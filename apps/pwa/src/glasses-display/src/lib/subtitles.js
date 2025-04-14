import { writable, get } from 'svelte/store';
import { isRecording } from './record';

export const subtitlesStore = writable([]);

// Track current sentences by ID
const sentenceMap = new Map();

// Create a store for recorded conversations
export const recordedConversations = writable([]);

// Current recording session data
let currentRecordingSession = null;
let recordingStartTime = null;

/**
 * Start a new recording session
 */
export function startRecording() {
    recordingStartTime = new Date();
    currentRecordingSession = {
        id: Date.now().toString(),
        startTime: recordingStartTime,
        endTime: null,
        transcripts: []
    };
}

/**
 * Stop the current recording session and save it
 */
export function stopRecording() {
    if (!currentRecordingSession) return;
    
    currentRecordingSession.endTime = new Date();
    
    // Save the completed session
    recordedConversations.update(sessions => {
        return [...sessions, currentRecordingSession];
    });
    
    // Store in localStorage as backup
    try {
        const existingSessions = JSON.parse(localStorage.getItem('recordedConversations') || '[]');
        existingSessions.push(currentRecordingSession);
        localStorage.setItem('recordedConversations', JSON.stringify(existingSessions));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
    
    const completedSession = currentRecordingSession;
    currentRecordingSession = null;
    
    return completedSession;
}

/**
 * Adds a new subtitle line and potentially records it.
 * @param {Object} newSubtitle
 * @param {string} newSubtitle.speakerName
 * @param {string} newSubtitle.text
 * @param {string | number} newSubtitle.sentenceId
 */
export const addSubtitle = (newSubtitle) => {
    // Update the visual subtitle store regardless of recording state
    subtitlesStore.update(subs => {
        const updatedSubs = subs.map(sub => ({ ...sub, isPrevious: true }));
        return [...updatedSubs, { ...newSubtitle, isPrevious: false }].slice(-3); // Keep last 3
    });

    // Only add to transcript if a session exists AND the isRecording flag is true
    if (currentRecordingSession && get(isRecording)) {
        currentRecordingSession.transcripts.push({
            speaker: newSubtitle.speakerName,
            text: newSubtitle.text,
            timestamp: new Date().toISOString(),
            sentenceId: newSubtitle.sentenceId
        });
    } else if (currentRecordingSession && !get(isRecording)) {
        // Optional: Log when a session exists but recording is false (indicates timing issue)
        // console.log("Subtitle received, session exists, but isRecording is false. Skipping add.");
    }
};