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
        self.block_size = 2000  # Smaller block size for faster processing

        # Message queue for communication between callback and async loop
        self.message_queue = queue.Queue()

        # Speaker tracking (simplified)
        self.current_speaker = "Speaker 1"
        self.speakers = ["Speaker 1", "Speaker 2"]
        self.speaker_index = 0

    def detect_speaker(self, audio_data):
        """Simple speaker detection based on audio energy"""
        energy = np.mean(np.abs(audio_data))

        # Very simple speaker detection - just to maintain functionality
        if energy < 100:  # Low energy might indicate silence
            return self.speakers[self.speaker_index]

        return self.current_speaker

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
                    # Directly send complete utterance without sentence tracking
                    self.message_queue.put({
                        "type": "subtitles",
                        "speakerName": speaker,
                        "text": result["text"],
                        "isPartial": False
                    })
            else:
                partial = json.loads(self.recognizer.PartialResult())
                if partial["partial"]:
                    partial_text = partial["partial"]

                    # Send all partial results immediately without filtering
                    self.message_queue.put({
                        "type": "subtitles",
                        "speakerName": speaker,
                        "text": partial_text,
                        "isPartial": True
                    })

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
