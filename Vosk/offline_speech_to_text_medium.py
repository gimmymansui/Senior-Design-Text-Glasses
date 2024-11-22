import os
import pyaudio
import json
from vosk import Model, KaldiRecognizer

# Load the Vosk model (adjust the path if necessary)
model = Model("vosk-model-en-us-0.22")


# Initialize recognizer
recognizer = KaldiRecognizer(model, 16000)

# Function to listen and transcribe speech
def listen_and_transcribe():
    # Open the microphone stream
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=4000)
    stream.start_stream()

    print("Listening... Speak something!")

    while True:
        data = stream.read(4000, exception_on_overflow=False)
        if recognizer.AcceptWaveform(data):
            result = recognizer.Result()
            result_json = json.loads(result)
            print(f"You said: {result_json['text']}")
        else:
            partial_result = recognizer.PartialResult()
            partial_json = json.loads(partial_result)
            print(f"Partial: {partial_json['partial']}")

if __name__ == "__main__":
    listen_and_transcribe()
