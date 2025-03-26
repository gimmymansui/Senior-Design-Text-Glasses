import pyaudio
import json
from vosk import Model, KaldiRecognizer
import queue
import asyncio
from websocket_client import WebSocketClient  # Ensure you have websocket-client installed

class AudioTranscriber:
    def __init__(self, model_path="/home/radxa/dev/large-vosk/"):
        # Initialize the Vosk model and recognizer
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

    def audio_callback(self, indata, frames, time, status):
        """This is called (from a separate thread) for each audio block."""
        if status:
            print(status)

        if self.is_running:
            data = np.frombuffer(indata, dtype=np.int16)

            # Process the audio data with Vosk recognizer
            if self.recognizer.AcceptWaveform(data.tobytes()):
                result = json.loads(self.recognizer.Result())
                if result["text"]:
                    print(f"Transcribed: {result['text']}")
                    # Send final transcription to the message queue
                    self.message_queue.put({
                        "speakerName": "John",
                        "text": result["text"]
                    })
            else:
                partial = json.loads(self.recognizer.PartialResult())
                if partial["partial"]:
                    print(f"Partial: {partial['partial']}")
                    # Send every partial transcription to the message queue (no check for duplicates)
                    self.message_queue.put({
                        "speakerName": "John",
                        "text": partial["partial"]
                    })

    async def process_message_queue(self):
        """Process messages from the queue in the async context"""
        while self.is_running:
            try:
                # Check queue for messages
                while not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    if self.ws_client:
                        await self.ws_client.send_message(message)  # Send transcription to the WebSocket server
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

            mic = pyaudio.PyAudio()
            stream = mic.open(format=pyaudio.paInt16,
                              channels=1,
                              rate=16000,
                              input=True,
                              frames_per_buffer=8000)  # Even smaller buffer size for reduced latency
            stream.start_stream()

            print("Listening... Press Ctrl+C to stop")
            while self.is_running:
                # Read data from the microphone
                data = stream.read(200, exception_on_overflow=False)

                # Process the audio stream
                if self.recognizer.AcceptWaveform(data):
                    result = self.recognizer.Result()
                    # Only print the final result when it's ready (strip out the JSON parts)
                    print(result[14:-3])  # Final recognized result
                    self.message_queue.put({
                        "speakerName": "John",
                        "text": result[14:-3]
                    })
                else:
                    partial_result = self.recognizer.PartialResult()
                    partial_text = partial_result[15:-3]

                    # Send every partial result (even if it is the same as before)
                    print(f"\r{partial_text}", end="")  # Overwrite the same line with new partial result
                    self.message_queue.put({
                        "speakerName": "John",
                        "text": partial_text
                    })

                await asyncio.sleep(0.01)  # Ensure async loop doesn't block

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

