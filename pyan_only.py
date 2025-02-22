import torch
import pyaudio
import numpy as np
from pyannote.audio.pipelines import SpeakerDiarization
from pyannote.audio import Audio
from pyannote.core import Segment
import wave

# Load the pre-trained speaker diarization model
diarization_pipeline = SpeakerDiarization.from_pretrained(
    "pyannote/speaker-diarization",
    use_auth_token="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"
)

# Initialize PyAudio for real-time recording
CHUNK = 4096  # Number of frames per buffer
FORMAT = pyaudio.paInt16  # Audio format (16-bit PCM)
CHANNELS = 1  # Mono audio
RATE = 16000  # Sample rate (16 kHz)

audio = pyaudio.PyAudio()

# Start real-time audio stream
stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                    input=True, frames_per_buffer=CHUNK)

print("Listening for speaker diarization...")

# Buffer to store audio
audio_buffer = []

try:
    while True:
        # Read audio data from the microphone
        data = stream.read(CHUNK, exception_on_overflow=False)
        audio_buffer.append(data)

        # Process every 3 seconds of audio for diarization
        if len(audio_buffer) * CHUNK / RATE >= 3:
            print("\nProcessing speaker diarization...\n")

            # Save buffer to a temporary WAV file
            wav_file = "temp_audio.wav"
            wf = wave.open(wav_file, "wb")
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(audio.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(audio_buffer))
            wf.close()

            # Perform diarization
            diarization_results = diarization_pipeline({"uri": "realtime", "audio": wav_file})

            # Print speaker segments
            for segment, _, speaker in diarization_results.itertracks(yield_label=True):
                print(f"[{speaker}] from {segment.start:.2f}s to {segment.end:.2f}s")

            # Clear buffer after processing
            audio_buffer = []

except KeyboardInterrupt:
    print("\nStopping recording...")

finally:
    stream.stop_stream()
    stream.close()
    audio.terminate()
