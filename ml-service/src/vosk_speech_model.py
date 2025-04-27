import sounddevice as sd
import numpy as np
from vosk import Model, KaldiRecognizer
import json
import asyncio
# Ensure WebSocketClient is robust (handles connection drops, etc.)
from websocket_client import WebSocketClient
import queue
import time
import re
# Ensure SimpleHeuristicDiarizer can provide the last known speaker
from speaker_diarizer import SimpleHeuristicDiarizer
import noisereduce as nr
import string
import sys # For stdout flushing and overwriting lines

# --- Configuration ---
MODEL_PATH = "/home/radxa/dev/large-vosk/"
WEBSOCKET_URL = "ws://localhost:8080" # Example URL - replace with your server
SAMPLE_RATE = 16000
CHANNELS = 1
BLOCK_SIZE = 2048 # 128ms chunk @ 16kHz, balance latency and efficiency
PAUSE_THRESHOLD = 0.8 # (seconds) Minimum pause duration to hint at sentence end (used for capitalization)
BUFFER_FLUSH_TIMEOUT = 2.5 # (seconds) Flush buffer if no final result received within this time
CONSOLE_LINE_WIDTH = 80 # Adjust if needed for console display padding

class AudioTranscriber:
    def __init__(self, model_path=MODEL_PATH):
        print(f"Loading Vosk model from: {model_path}")
        try:
            self.model = Model(model_path)
        except Exception as e:
            print(f"Error loading Vosk model: {e}. Check path: '{model_path}'")
            raise
        self.recognizer = KaldiRecognizer(self.model, SAMPLE_RATE)
        self.recognizer.SetWords(True) # Essential for pause detection

        self.is_running = False
        self.ws_client = None

        # Audio settings from config
        self.sample_rate = SAMPLE_RATE
        self.channels = CHANNELS
        self.block_size = BLOCK_SIZE

        # Message queue (Callback -> Async Loop)
        self.message_queue = queue.Queue()

        # --- State for Sentence Structure & Stalling ---
        self.sentence_buffer = ""           # Holds text waiting for sentence end
        self.last_partial_text_sent = ""    # Avoid sending identical WebSocket partials
        self.last_word_end_time = 0         # Word timing for pause detection
        self.last_final_result_time = time.monotonic() # Time of last final result
        self.buffer_flush_timeout = BUFFER_FLUSH_TIMEOUT
        self.pause_threshold = PAUSE_THRESHOLD
        self.capitalization_needed = True   # Capitalize first word of utterance/after punctuation
        self.sentence_end_re = re.compile(r'[.?!]') # Detect sentence endings
        self.current_sentence_id = 0 # <<< Add sentence ID counter
        # --- End State ---

        # Speaker Diarization - Ensure SimpleHeuristicDiarizer has get_last_speaker()
        self.diarizer = SimpleHeuristicDiarizer(sample_rate=self.sample_rate)

        # Noise Reduction Parameters
        self.noise_reduction_params = {
            'n_std_thresh_stationary': 1.5, 'stationary': False, 'sr': self.sample_rate,
            'n_fft': 512, 'win_length': 512, 'hop_length': 128,
            'freq_mask_smooth_hz': 500, 'time_mask_smooth_ms': 50, 'prop_decrease': 1.0
        }

        # Console display state
        self.last_displayed_line = "" # Track what was last printed with \r

        print("AudioTranscriber initialized.")

    def _format_text(self, text, capitalize_first):
        """Internal helper for text formatting."""
        if not text: return ""
        text = text.strip()
        if not text: return ""

        # 1. Capitalize first word
        if capitalize_first:
            words = text.split(' ', 1)
            if words:
                words[0] = words[0].capitalize()
                text = ' '.join(words)

        # 2. Capitalize standalone "i"
        text = re.sub(r'\b(i)\b', 'I', text)
        # 3. Fix space before punctuation
        text = re.sub(r'\s+([.,!?;:])', r'\1', text)
        # 4. Ensure space after punctuation followed by alpha-numeric
        text = re.sub(r'([.,!?;:])([a-zA-Z0-9])', r'\1 \2', text)
        # 5. Consolidate whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
        
    def _get_last_speaker(self):
        """Safely get the last known speaker."""
        if hasattr(self.diarizer, 'get_last_speaker'):
            return self.diarizer.get_last_speaker() or "Unknown"
        return "Unknown" # Default if diarizer doesn't support it

    def _queue_message(self, text, speaker, is_partial, sentence_id):
        """Formats and queues message for console and WebSocket."""
        if not text: return

        message = {
            "type": "subtitles",
            "speakerName": speaker,
            "text": text,
            "isPartial": is_partial,
            "sentenceId": sentence_id
        }
        try:
            self.message_queue.put_nowait(message)
        except queue.Full:
            print("Warning: Message queue full. Dropping message.", file=sys.stderr)

    def _update_console(self, text, speaker, is_partial):
        """Handles printing to console with line overwriting for partials."""
        if is_partial:
            # Overwrite previous partial line
            line = f"[PARTIAL] {speaker}: {text}"
            # Pad with spaces to clear previous longer line, limit width
            padded_line = line.ljust(len(self.last_displayed_line))[:CONSOLE_LINE_WIDTH]
            print(f"\r{padded_line}", end="", flush=True)
            self.last_displayed_line = line # Store the *unpadded* line
        else:
            # Print final line on a new line, clearing any leftover partial line
            final_line = f"[FINAL] {speaker}: {text}"
            # Clear current line before printing final
            print("\r".ljust(len(self.last_displayed_line)), end="")
            print(f"\r{final_line}") # Print final on its own line
            self.last_displayed_line = "" # Reset for next partial

    def flush_sentence_buffer(self, reason="timeout"):
        """Forces processing and sending of the current sentence buffer."""
        buffer_content = self.sentence_buffer.strip()
        if buffer_content:
            # Get last known speaker
            speaker = self._get_last_speaker()
            print(f"\n--- Flushing buffer ({reason}: '{buffer_content}') ---", flush=True)

            # Add punctuation if likely needed (basic heuristic)
            if not self.sentence_end_re.search(buffer_content[-1:]):
                 buffer_content += "."

            # Format and send
            formatted_text = self._format_text(buffer_content, self.capitalization_needed)
            self._queue_message(formatted_text, speaker, False, self.current_sentence_id)
            self.current_sentence_id += 1

            # Reset state
            self.sentence_buffer = ""
            self.capitalization_needed = True
            self.last_final_result_time = time.monotonic() # Reset timer after flush

    def audio_callback(self, indata, frames, time_info, status):
        """Processes each audio chunk (runs in a separate thread)."""
        # Use monotonic clock for reliable time differences
        current_time = time.monotonic()

        if status:
            if status.input_overflow:
                print("Warning: Input overflow detected (callback lagging?)", file=sys.stderr, flush=True)
            elif status.input_underflow:
                 pass # Less critical usually
            else:
                print(f"Audio status: {status}", file=sys.stderr, flush=True)

        if not self.is_running: return

        try:
            # 1. Basic Audio Processing (Buffer -> NR -> int16)
            data_int16 = np.frombuffer(indata, dtype=np.int16)
            data_float32 = data_int16.astype(np.float32) / 32768.0
            reduced_noise_float32 = nr.reduce_noise(y=data_float32, **self.noise_reduction_params)
            reduced_noise_float32_clamped = np.clip(reduced_noise_float32, -1.0, 1.0)
            reduced_noise_int16 = (reduced_noise_float32_clamped * 32767.0).astype(np.int16)

            # 2. Diarization
            speaker = self.diarizer.diarize(reduced_noise_int16) or self._get_last_speaker()

            # 3. Vosk Recognition
            if self.recognizer.AcceptWaveform(reduced_noise_int16.tobytes()):
                result = json.loads(self.recognizer.Result())
                final_text = result.get("text", "")

                if final_text:
                    # --- Process Final Result ---
                    self.last_final_result_time = current_time # Reset stall timer

                    # Pause detection using word timestamps *before* this chunk
                    words = result.get("result", [])
                    if words:
                        first_word_start = words[0].get("start", current_time)
                        pause_duration = first_word_start - self.last_word_end_time
                        if pause_duration > self.pause_threshold and self.sentence_buffer:
                            print(f"--- Pause detected ({pause_duration:.2f}s), hinting sentence end ---", flush=True)
                            self.capitalization_needed = True
                        # Update last word end time from *this* chunk
                        self.last_word_end_time = words[-1].get("end", self.last_word_end_time)

                    # Add to buffer & process sentences
                    self.sentence_buffer += final_text + " "
                    self.last_partial_text_sent = "" # Can reset partial tracker

                    sentence_boundary_found = False
                    while True: # Process multiple sentences if found
                        last_boundary_match = None
                        for match in self.sentence_end_re.finditer(self.sentence_buffer):
                            last_boundary_match = match

                        if last_boundary_match:
                            boundary_index = last_boundary_match.end()
                            sentence_to_send = self.sentence_buffer[:boundary_index].strip()
                            self.sentence_buffer = self.sentence_buffer[boundary_index:].lstrip() # Keep remainder

                            if sentence_to_send:
                                formatted_sentence = self._format_text(sentence_to_send, self.capitalization_needed)
                                self._queue_message(formatted_sentence, speaker, False, self.current_sentence_id)
                                self.current_sentence_id += 1
                                self.capitalization_needed = True # Next sentence needs capitalization
                                sentence_boundary_found = True
                            # Continue loop in case buffer had e.g., "Hello there. How are you?"
                        else:
                            break # No more sentence boundaries found in buffer

                    # If we sent sentences, clear the partial display
                    # If not, update partial display with current buffer content
                    current_partial_display = self._format_text(self.sentence_buffer, self.capitalization_needed).strip()
                    if current_partial_display:
                         if current_partial_display != self.last_partial_text_sent:
                             # Queue for WebSocket - Use current (possibly incremented) ID, mark as partial (True)
                             self._queue_message(current_partial_display, speaker, True, self.current_sentence_id)
                             self.last_partial_text_sent = current_partial_display
                         # Update console regardless of WebSocket send status (for visual feedback)
                         self._update_console(current_partial_display, speaker, True)
                    elif self.last_displayed_line: # Buffer is empty, clear console partial
                         # Send empty partial with current ID to potentially clear frontend display too
                         self._queue_message("", speaker, True, self.current_sentence_id)
                         self._update_console("", speaker, True) # Send empty partial to clear console

            else: # Process Partial Result
                partial_result = json.loads(self.recognizer.PartialResult())
                partial_text = partial_result.get("partial", "")

                # Update word end time from partial if available
                partial_words = partial_result.get("partial_result", [])
                if partial_words:
                    current_partial_end = partial_words[-1].get("end", self.last_word_end_time)
                    if current_partial_end > self.last_word_end_time:
                        self.last_word_end_time = current_partial_end

                if partial_text:
                    # Combine buffer + partial for display/sending
                    combined_partial_raw = (self.sentence_buffer + partial_text).strip()
                    formatted_partial = self._format_text(combined_partial_raw, self.capitalization_needed)

                    if formatted_partial:
                         # Send to WebSocket if changed - Use current ID, mark as partial (True)
                        if formatted_partial != self.last_partial_text_sent:
                             self._queue_message(formatted_partial, speaker, True, self.current_sentence_id)
                             self.last_partial_text_sent = formatted_partial
                        # Update console always if changed from *console's* perspective
                        if formatted_partial != self.last_displayed_line.split(":", 1)[-1].strip(): # Compare content part
                            self._update_console(formatted_partial, speaker, True)

        except queue.Full:
            # Already handled in _queue_message, but logging here might be useful
            pass
        except Exception as e:
            print(f"\n!!! Error in audio_callback: {e} !!!", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)


    async def process_message_queue(self):
        """Pulls messages from queue, prints, sends via WebSocket."""
        print("Starting message queue processor...")
        while self.is_running or not self.message_queue.empty():
            try:
                message = self.message_queue.get(timeout=0.1)

                # **Console output moved here for consistency**
                text = message.get("text", "")
                speaker = message.get("speakerName", "Unknown")
                is_partial = message.get("isPartial", False)

                # We let _update_console in the callback handle partial display now
                # Only print FINALS explicitly here, ensures they go on a new line
                if not is_partial:
                     self._update_console(text, speaker, False)

                # Send via WebSocket
                if self.ws_client and self.ws_client.connected:
                    try:
                        await self.ws_client.send_message(message)
                    except Exception as ws_err:
                        print(f"\nError sending WebSocket message: {ws_err}", file=sys.stderr)
                        # Consider WebSocket state check/reconnect logic here or in client

                self.message_queue.task_done()

            except queue.Empty:
                if not self.is_running: break # Exit if stopped and queue empty
                await asyncio.sleep(0.02) # Slightly longer sleep when idle
            except Exception as e:
                print(f"\nError processing message queue: {e}", file=sys.stderr)
                await asyncio.sleep(0.1)
        print("Message queue processor finished.")


    async def transcribe_stream(self, ws_client):
        """Main async transcription loop."""
        print("Starting transcription stream...")
        self.is_running = True
        self.ws_client = ws_client

        # Reset state thoroughly
        self.sentence_buffer = ""
        self.last_partial_text_sent = ""
        self.last_displayed_line = ""
        self.last_word_end_time = 0
        self.last_final_result_time = time.monotonic() # Use monotonic clock
        self.capitalization_needed = True
        self.current_sentence_id = 0 # <<< Reset sentence ID on start
        self.diarizer.reset()
        while not self.message_queue.empty(): # Clear queue
            try: self.message_queue.get_nowait(); self.message_queue.task_done()
            except queue.Empty: break

        message_processor_task = None

        try:
            message_processor_task = asyncio.create_task(self.process_message_queue())

            print("\n" + "=" * CONSOLE_LINE_WIDTH)
            print("TRANSCRIPTION STARTED".center(CONSOLE_LINE_WIDTH))
            print("=" * CONSOLE_LINE_WIDTH)

            with sd.InputStream(
                samplerate=self.sample_rate, channels=self.channels, dtype=np.int16,
                callback=self.audio_callback, blocksize=self.block_size
            ) as stream:
                if not stream:
                    print("Error: Failed to open audio stream.", file=sys.stderr)
                    self.is_running = False ; return # Stop if stream fails

                print(f"Listening ({self.sample_rate} Hz, {self.block_size} block)... Press Ctrl+C to stop")
                while self.is_running:
                    # --- Timeout Check for Buffer Flushing ---
                    if (time.monotonic() - self.last_final_result_time > self.buffer_flush_timeout and
                        self.sentence_buffer.strip()):
                        self.flush_sentence_buffer(reason="timeout")
                        # The flush updates last_final_result_time

                    # Check stream status (optional, can be verbose)
                    # if not stream.active:
                    #     print("Warning: Audio stream inactive.", file=sys.stderr)
                    #     self.is_running = False; break # Stop if stream dies

                    await asyncio.sleep(0.1) # Main loop check interval

        except sd.PortAudioError as pae:
            print(f"\nPortAudio Error: {pae}. Check sound device/config.", file=sys.stderr)
        except Exception as e:
            print(f"\nError during transcription stream: {e}", file=sys.stderr)
            import traceback; traceback.print_exc(file=sys.stderr)
        finally:
            print("\nStopping transcription stream...")
            self.is_running = False # Signal all loops/callbacks to stop

            # --- Cleanup ---
            # Flush any final buffer content
            if self.sentence_buffer.strip():
                 self.flush_sentence_buffer(reason="shutdown")

            # Allow queue processor to finish
            if message_processor_task:
                print("Waiting for message processor to finish...")
                try:
                    await asyncio.wait_for(message_processor_task, timeout=2.0)
                except (asyncio.TimeoutError, asyncio.CancelledError) as e:
                    print(f"Message processor finish status: {type(e).__name__}")

            print("=" * CONSOLE_LINE_WIDTH)
            print("TRANSCRIPTION ENDED".center(CONSOLE_LINE_WIDTH))
            print("=" * CONSOLE_LINE_WIDTH)
            print("Transcription stream stopped.")


    def stop(self):
        """Signals the transcription process to stop."""
        print("Stop requested.")
        self.is_running = False

# --- Main Execution ---
async def main():
    # Assume WebSocketClient implements async connect, send_message, close, and 'connected' property
    client = WebSocketClient(WEBSOCKET_URL)
    transcriber = None

    try:
        # List devices for user info
        try:
             print("Available audio devices:", sd.query_devices())
             print("Default input device:", sd.query_devices(kind='input'))
        except Exception as sd_err: print(f"Could not query audio devices: {sd_err}")

        print(f"Attempting to connect to WebSocket: {WEBSOCKET_URL}")
        if await client.connect(): # Ensure connect is async and returns success/failure
            print("WebSocket connected.")
            transcriber = AudioTranscriber() # Uses MODEL_PATH from config
            await transcriber.transcribe_stream(client)
        else:
            print("Failed to connect to WebSocket server. Is it running?")

    except KeyboardInterrupt:
        print("\nCtrl+C detected. Stopping...")
    except FileNotFoundError as fnf_err:
         print(f"\nModel Error: {fnf_err}. Check MODEL_PATH: '{MODEL_PATH}'")
    except Exception as e:
        print(f"\nAn unexpected error occurred in main: {e}")
        import traceback; traceback.print_exc()
    finally:
        print("Cleaning up...")
        if transcriber:
            transcriber.stop() # Signal stop

        # Short delay might help ensure loops notice is_running flag
        await asyncio.sleep(0.2)

        if client and client.connected: # Check if client exists and connection was made
            print("Closing WebSocket connection...")
            await client.close() # Ensure close is async
            print("WebSocket closed.")
        elif client:
             print("WebSocket client exists but was not connected or already closed.")

        print("Cleanup complete. Exiting.")

if __name__ == "__main__":
    # Setup asyncio loop - consider uvloop for potential performance boost
    try:
       import uvloop
       uvloop.install()
       print("Using uvloop.")
    except ImportError:
       print("uvloop not found, using default asyncio loop.")

    try:
        asyncio.run(main())
    except Exception as e:
         # Catch errors during asyncio execution itself (less common)
         print(f"\nFatal error during asyncio execution: {e}")

