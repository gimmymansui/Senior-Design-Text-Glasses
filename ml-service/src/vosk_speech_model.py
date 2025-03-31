import sounddevice as sd
import numpy as np
from vosk import Model, KaldiRecognizer
import json
import asyncio
from websocket_client import WebSocketClient
import queue
import time

class AudioTranscriber:
    def __init__(self, model_path="/home/radxa/dev/large-vosk/"):
        self.model = Model(model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        self.is_running = False
        self.ws_client = None
        
        # Audio settings
        self.sample_rate = 16000
        self.channels = 1
        self.block_size = 8000
        
        # Message queue for communication between callback and async loop
        self.message_queue = queue.Queue()
        
        # Speaker tracking
        self.current_speaker = None
        self.last_voice_activity = 0
        self.silence_threshold = 1.5  # seconds of silence to trigger speaker change
        self.speakers = ["Speaker 1", "Speaker 2"]  # Default speakers
        self.speaker_index = 0
        
        # Sentence tracking
        self.current_sentence_id = 0
        self.last_was_partial = False
    
    def detect_speaker(self, audio_data):
        """Simple speaker detection based on silence"""
        # Calculate audio energy (very basic approach)
        energy = np.mean(np.abs(audio_data))
        
        current_time = time.time()
        
        # If silence detected for long enough, prepare for speaker change
        if energy < 100:  # Adjust this threshold as needed
            if self.current_speaker and (current_time - self.last_voice_activity) > self.silence_threshold:
                # Ready for a potential new speaker
                self.speaker_index = (self.speaker_index + 1) % len(self.speakers)
                self.current_speaker = None
        else:
            # Voice activity detected
            self.last_voice_activity = current_time
            if not self.current_speaker:
                # New speaker started talking
                self.current_speaker = self.speakers[self.speaker_index]
                self.current_sentence_id += 1
        
        return self.current_speaker or self.speakers[0]

    def audio_callback(self, indata, frames, time, status):
        """This is called (from a separate thread) for each audio block."""
        if status:
            print(status)
        
        if self.is_running:
            data = np.frombuffer(indata, dtype=np.int16)
            speaker = self.detect_speaker(data)
            
            if self.recognizer.AcceptWaveform(data.tobytes()):
                result = json.loads(self.recognizer.Result())
                if result["text"]:
                    print(f"Transcribed: {result['text']}")
                    # Send complete utterance
                    self.message_queue.put({
                        "type": "subtitles",
                        "speakerName": speaker,
                        "text": result["text"],
                        "isPartial": False,
                        "sentenceId": self.current_sentence_id
                    })
                    self.last_was_partial = False
            else:
                partial = json.loads(self.recognizer.PartialResult())
                if partial["partial"]:
                    partial_text = partial["partial"]
                    print(f"Partial: {partial_text}")
                    
                    # Only send partials if they have content
                    if partial_text.strip():
                        self.message_queue.put({
                            "type": "subtitles",
                            "speakerName": speaker,
                            "text": partial_text,
                            "isPartial": True,
                            "sentenceId": self.current_sentence_id
                        })
                        self.last_was_partial = True

    async def process_message_queue(self):
        """Process messages from the queue in the async context"""
        while self.is_running:
            try:
                # Check queue for messages
                while not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    if self.ws_client:
                        await self.ws_client.send_message(message)
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
            except queue.Empty:
                pass
            except Exception as e:
                print(f"Error processing message: {e}")

    async def transcribe_stream(self, ws_client):
        """Main transcription loop"""
        self.is_running = True
        self.ws_client = ws_client
        
        try:
            # Start the message processing task
            message_processor = asyncio.create_task(self.process_message_queue())
            
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=np.int16,
                callback=self.audio_callback,
                blocksize=2000
            ):
                print("Listening... Press Ctrl+C to stop")
                while self.is_running:
                    await asyncio.sleep(0.01)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            self.is_running = False
            # Ensure message processor is cleaned up
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
