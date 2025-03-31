import { writable, get } from 'svelte/store';

// Store for saved transcripts
export const savedTranscriptsStore = writable([]);

// Initialize from localStorage on app load
export function initTranscriptManager() {
  try {
    const savedData = localStorage.getItem('savedTranscripts');
    if (savedData) {
      savedTranscriptsStore.set(JSON.parse(savedData));
    }
  } catch (error) {
    console.error('Error loading saved transcripts', error);
    // Initialize with empty array if there's an error
    savedTranscriptsStore.set([]);
  }
}

// Save a new transcript
export function saveTranscript(subtitles) {
  const newTranscript = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    subtitles: [...subtitles]
  };
  
  savedTranscriptsStore.update(transcripts => {
    const updated = [...transcripts, newTranscript];
    // Persist to localStorage
    try {
      localStorage.setItem('savedTranscripts', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving transcripts', error);
    }
    return updated;
  });
  
  return newTranscript;
}

// Delete a transcript
export function deleteTranscript(id) {
  savedTranscriptsStore.update(transcripts => {
    const updated = transcripts.filter(t => t.id !== id);
    // Update localStorage
    localStorage.setItem('savedTranscripts', JSON.stringify(updated));
    return updated;
  });
}

// Get all saved transcripts
export function getAllTranscripts() {
  return get(savedTranscriptsStore);
} 