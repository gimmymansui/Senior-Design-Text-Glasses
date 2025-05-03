import numpy as np
import time
from abc import ABC, abstractmethod

class BaseSpeakerDiarizer(ABC):
    """Abstract base class for speaker diarization."""
    @abstractmethod
    def diarize(self, audio_chunk: np.ndarray) -> str:
        """
        Processes an audio chunk and returns the estimated speaker label.

        Args:
            audio_chunk: A numpy array containing the audio data for the chunk.

        Returns:
            The estimated speaker label (e.g., "Speaker 1").
        """
        pass

    @abstractmethod
    def reset(self):
        """Resets the internal state of the diarizer."""
        pass

class SimpleHeuristicDiarizer(BaseSpeakerDiarizer):
    """
    A simple diarizer based on energy thresholds and silence detection.
    Assumes a limited number of speakers switching turns.
    """
    def __init__(self, energy_threshold=300, silence_threshold=100, silence_duration=0.3, sample_rate=16000):
        self.energy_threshold = energy_threshold  # Min energy to be considered speech
        self.silence_threshold = silence_threshold # Max energy to be considered silence
        self.sample_rate = sample_rate
        self.min_silence_samples = int(silence_duration * sample_rate)

        self.speakers = ["Speaker 1", "Speaker 2"] # Add more if needed
        self.current_speaker_index = 0
        self.in_speech = False
        self.silence_samples_count = 0
        self.last_speech_time = time.monotonic()

    def get_current_speaker(self) -> str:
        return self.speakers[self.current_speaker_index]

    def switch_speaker(self):
        self.current_speaker_index = (self.current_speaker_index + 1) % len(self.speakers)
        print(f"--- Switched to {self.get_current_speaker()} ---")

    def diarize(self, audio_chunk: np.ndarray) -> str:
        """Estimates speaker based on energy and silence."""
        energy = np.mean(np.abs(audio_chunk))
        chunk_samples = len(audio_chunk)
        now = time.monotonic()

        if energy > self.energy_threshold:
            # Detected potential speech
            if not self.in_speech and self.silence_samples_count >= self.min_silence_samples:
                # Transition from long silence to speech - potential speaker switch
                self.switch_speaker()

            self.in_speech = True
            self.silence_samples_count = 0
            self.last_speech_time = now

        elif energy < self.silence_threshold:
            # Detected potential silence
            self.silence_samples_count += chunk_samples
            if self.in_speech:
                # Transitioning to silence
                self.in_speech = False
        else:
             # Energy between silence and speech threshold - treated as continuation of current state
             if self.in_speech:
                 self.silence_samples_count = 0 # Reset silence counter if we were speaking
             else:
                 self.silence_samples_count += chunk_samples # Continue counting silence


        # Fallback/Timeout: If long silence, reset to speaker 1 (or handle differently)
        # This prevents getting stuck on a speaker if detection fails
        # if not self.in_speech and (now - self.last_speech_time) > 5.0: # e.g., 5 seconds of silence
        #     if self.current_speaker_index != 0:
        #         print("--- Resetting to Speaker 1 after long silence ---")
        #         self.current_speaker_index = 0
        #     self.last_speech_time = now # Prevent rapid resets


        return self.get_current_speaker()

    def reset(self):
        """Resets the diarizer state."""
        self.current_speaker_index = 0
        self.in_speech = False
        self.silence_samples_count = 0
        self.last_speech_time = time.monotonic()
        print("--- Diarizer Reset ---")

# Example Usage (for testing if run directly)
if __name__ == '__main__':
    diarizer = SimpleHeuristicDiarizer(sample_rate=16000)
    chunk_size = 2000 # Example chunk size

    # Simulate silence
    print("Simulating silence...")
    for _ in range(10): # Simulate 10 chunks of silence
        silent_chunk = np.random.randint(-50, 50, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(silent_chunk)
        # print(f"Energy: {np.mean(np.abs(silent_chunk)):.2f}, Speaker: {speaker}, Silence Count: {diarizer.silence_samples_count}")
        time.sleep(chunk_size / 16000)


    # Simulate speaker 1
    print("\nSimulating Speaker 1...")
    for _ in range(5):
        speech_chunk = np.random.randint(-500, 500, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(speech_chunk)
        print(f"Energy: {np.mean(np.abs(speech_chunk)):.2f}, Speaker: {speaker}")
        time.sleep(chunk_size / 16000)

    # Simulate silence (enough to trigger switch)
    print("\nSimulating silence...")
    for _ in range(int(16000 * 0.5 / chunk_size) + 1): # Simulate 0.5 seconds of silence
        silent_chunk = np.random.randint(-50, 50, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(silent_chunk)
        # print(f"Energy: {np.mean(np.abs(silent_chunk)):.2f}, Speaker: {speaker}, Silence Count: {diarizer.silence_samples_count}")
        time.sleep(chunk_size / 16000)


    # Simulate speaker 2
    print("\nSimulating Speaker 2...")
    for _ in range(5):
        speech_chunk = np.random.randint(-500, 500, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(speech_chunk)
        print(f"Energy: {np.mean(np.abs(speech_chunk)):.2f}, Speaker: {speaker}")
        time.sleep(chunk_size / 16000)

    # Simulate more silence
    print("\nSimulating silence...")
    for _ in range(int(16000 * 0.5 / chunk_size) + 1): # Simulate 0.5 seconds of silence
        silent_chunk = np.random.randint(-50, 50, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(silent_chunk)
        # print(f"Energy: {np.mean(np.abs(silent_chunk)):.2f}, Speaker: {speaker}, Silence Count: {diarizer.silence_samples_count}")
        time.sleep(chunk_size / 16000)

    # Simulate speaker 1 again
    print("\nSimulating Speaker 1 again...")
    for _ in range(5):
        speech_chunk = np.random.randint(-500, 500, size=chunk_size, dtype=np.int16)
        speaker = diarizer.diarize(speech_chunk)
        print(f"Energy: {np.mean(np.abs(speech_chunk)):.2f}, Speaker: {speaker}")
        time.sleep(chunk_size / 16000) 