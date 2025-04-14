import sounddevice as sd
import numpy as np
from vosk import Model, KaldiRecognizer
import json
import asyncio
from websocket_client import WebSocketClient
import queue
import time
import re
from speaker_diarizer import SimpleHeuristicDiarizer
import noisereduce as nr

class AudioTranscriber:
    def __init__(self, model_path="/home/radxa/dev/large-vosk/"):
        self.model = Model(model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        self.is_running = False
        self.ws_client = None

        # Audio settings
        self.sample_rate = 16000
        self.channels = 1
        self.block_size = 2048

        # Message queue for communication between callback and async loop
        self.message_queue = queue.Queue()

        # Sentence structure tracking
        self.sentence_buffer = ""
        self.last_partial_text = ""

        # Speaker Diarization
        self.diarizer = SimpleHeuristicDiarizer(sample_rate=self.sample_rate)

        # Noise Reduction
        self.noise_reducer = nr.ReduceNoise(
            n_std_thresh_stationary=1.5,
            stationary=False,
            sr=self.sample_rate,
            n_fft=512,
            win_length=512,
            hop_length=128,
            freq_mask_smooth_hz=500,
            prop_decrease=1.0
        )

    def audio_callback(self, indata, frames, time, status):
        """This is called (from a separate thread) for each audio block."""
        if status:
            print(f"Audio status: {status}")

        if self.is_running:
            try:
                # 1. Convert raw buffer (bytes) to int16 numpy array
                data_int16 = np.frombuffer(indata, dtype=np.int16)

                # 2. Convert int16 to float32 for noisereduce
                # Ensure data is copied to avoid modifying original buffer if needed elsewhere
                data_float32 = data_int16.astype(np.float32) / 32768.0

                # 3. Apply noise reduction
                # This mutates the state of self.noise_reducer if stationary=True
                reduced_noise_float32 = self.noise_reducer.reduce(
                    y=data_float32,
                    sr=self.sample_rate
                )

                # 4. Convert float32 back to int16 for diarizer and Vosk
                reduced_noise_int16 = (reduced_noise_float32 * 32768.0).astype(np.int16)

                # 5. Perform Diarization on cleaned audio
                speaker = self.diarizer.diarize(reduced_noise_int16)

                # 6. Feed cleaned audio (as bytes) to Vosk
                if self.recognizer.AcceptWaveform(reduced_noise_int16.tobytes()):
                    result = json.loads(self.recognizer.Result())
                    final_text = result.get("text", "")
                    if final_text:
                        # Append finalized text chunk to the buffer
                        self.sentence_buffer += final_text + " "
                        self.last_partial_text = ""

                        # Find the last sentence boundary
                        boundary_match = None
                        for match in re.finditer(r'[.?!]', self.sentence_buffer):
                            boundary_match = match

                        if boundary_match:
                            boundary_index = boundary_match.end()
                            sentences_to_send = self.sentence_buffer[:boundary_index].strip()
                            # Update buffer with remaining text
                            self.sentence_buffer = self.sentence_buffer[boundary_index:].lstrip()

                            if sentences_to_send:
                                # Send the complete sentence(s)
                                self.message_queue.put({
                                    "type": "subtitles",
                                    "speakerName": speaker,
                                    "text": sentences_to_send,
                                    "isPartial": False
                                })
                        # Note: Any remaining text in sentence_buffer is carried over
                else:
                    partial = json.loads(self.recognizer.PartialResult())
                    partial_text = partial.get("partial", "")
                    if partial_text and partial_text != self.last_partial_text:
                        self.last_partial_text = partial_text
                        # Send the current buffer + new partial text
                        text_to_send = (self.sentence_buffer + partial_text).strip()
                        if text_to_send:
                            self.message_queue.put({
                                "type": "subtitles",
                                "speakerName": speaker,
                                "text": text_to_send,
                                "isPartial": True
                            })
            except Exception as e:
                # Log errors in the callback more visibly
                print(f"Error in audio_callback: {e}")
                import traceback
                traceback.print_exc()

    async def process_message_queue(self):
        """Process messages from the queue in the async context"""
        while self.is_running:
            try:
                # Process messages as quickly as possible
                while not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    if self.ws_client:
                        await self.ws_client.send_message(message)
                # Reduced sleep time for faster processing
                await asyncio.sleep(0.01)
            except queue.Empty:
                pass
            except Exception as e:
                print(f"Error processing message: {e}")

    async def transcribe_stream(self, ws_client):
        """Main transcription loop"""
        self.is_running = True
        self.ws_client = ws_client

        try:
            # Reset diarizer state at start
            self.diarizer.reset()

            # Start the message processing task
            message_processor = asyncio.create_task(self.process_message_queue())

            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=np.int16,
                callback=self.audio_callback,
                blocksize=self.block_size
            ):
                print("Listening... Press Ctrl+C to stop")
                while self.is_running:
                    await asyncio.sleep(0.005)  # Reduced sleep time

        except Exception as e:
            print(f"Error: {e}")
        finally:
            self.is_running = False
            if 'message_processor' in locals():
                message_processor.cancel()
                try:
                    await message_processor
                except asyncio.CancelledError:
                    pass

    def stop(self):
        """Stop the transcription"""
        self.is_running = False

async def main():
    client = WebSocketClient()
    try:
        if await client.connect():
            transcriber = AudioTranscriber()
            transcriber.diarizer.reset()
            await transcriber.transcribe_stream(client)
        else:
            print("Failed to connect to WebSocket server")
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        if 'transcriber' in locals():
            transcriber.stop()
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
