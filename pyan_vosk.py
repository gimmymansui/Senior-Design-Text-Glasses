import json
import torch
import pyaudio
import numpy as np
from vosk import Model, KaldiRecognizer
from pyannote.audio.pipelines import SpeakerDiarization
from pyannote.audio import Audio

# Load the Vosk model
model = Model(r"/home/radxa/dev/small-vosk/")  # Adjust path as needed
recognizer = KaldiRecognizer(model, 16000)

# Load Pyannote Speaker Diarization Model
diarization_pipeline = SpeakerDiarization.from_pretrained("pyannote/speaker-diarization", use_auth_token="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")

# Function to estimate the number of speakers dynamically
def estimate_speakers(waveform):
    """ Estimates number of speakers dynamically """
    inference = diarization_pipeline({"waveform": waveform, "sample_rate": 16000})
    speakers = set()
    for _, _, speaker in inference.itertracks(yield_label=True):
        speakers.add(speaker)
    return max(len(speakers), 1)  # Ensure at least 1 speaker is detected

# Initialize Microphone and Audio Stream
mic = pyaudio.PyAudio()
stream = mic.open(format=pyaudio.paInt16,
                  channels=1,
                  rate=16000,
                  input=True,
                  frames_per_buffer=2048)  # Larger buffer for better processing
stream.start_stream()

print("Listening...")

# Buffer to store audio data for speaker diarization
audio_buffer = []

while True:
    data = stream.read(2048, exception_on_overflow=False)  # Read in chunks
    audio_buffer.append(data)

    if recognizer.AcceptWaveform(data):
        result = json.loads(recognizer.Result())
        text = result.get("text", "")

        if text:
            # Convert buffered audio to Pyannote format
            waveform = np.frombuffer(b''.join(audio_buffer), dtype=np.int16).astype(np.float32) / 32768.0
            waveform = torch.tensor(waveform).unsqueeze(0)  # Add batch dimension

            # Estimate speakers dynamically
            diarization_results = diarization_pipeline({"waveform": waveform, "sample_rate": 16000})

            # Print speaker-labeled transcription
            for segment, _, speaker in diarization_results.itertracks(yield_label=True):
                print(f"[{speaker}] {text}")

            # Clear buffer after processing
            audio_buffer = []

    else:
        partial_result = json.loads(recognizer.PartialResult())
        partial_text = partial_result.get("partial", "")

        if partial_text:
            print(partial_text, end='\r')  # Real-time partial output
