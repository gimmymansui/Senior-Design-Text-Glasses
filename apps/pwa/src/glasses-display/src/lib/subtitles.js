import { writable, get } from 'svelte/store';
import { isRecording } from './record';

export const subtitlesStore = writable([]);

// Track current sentences by ID (Optional, might not be needed if we always work with the last item)
// const sentenceMap = new Map();

// Create a store for recorded conversations
export const recordedConversations = writable([]);

// Current recording session data
let currentRecordingSession = null;
let recordingStartTime = null;
let lastSentenceId = null; // Keep track of the last sentence ID processed

/**
 * Start a new recording session
 */
export function startRecording() {
    recordingStartTime = new Date();
    currentRecordingSession = {
        id: Date.now().toString(),
        startTime: recordingStartTime,
        endTime: null,
        transcripts: [] // Store final transcripts here
    };
    lastSentenceId = null; // Reset last sentence ID for new recording
}

/**
 * Stop the current recording session and save it
 */
export function stopRecording() {
    if (!currentRecordingSession) return;

    currentRecordingSession.endTime = new Date();

    // Save the completed session
    recordedConversations.update(sessions => {
        // Filter out potential duplicates based on sentenceId if necessary,
        // or ensure only finals were added. Assuming final logic handles this for now.
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
    lastSentenceId = null; // Reset last sentence ID

    return completedSession;
}

/**
 * Handles incoming subtitle updates (partial or final).
 * Assumes newSubtitle format: { speakerName, text, sentenceId, isFinal }
 * @param {Object} subtitleUpdate
 * @param {string} subtitleUpdate.speakerName
 * @param {string} subtitleUpdate.text
 * @param {string | number} subtitleUpdate.sentenceId
 * @param {boolean} subtitleUpdate.isFinal
 */
export const handleSubtitleUpdate = (subtitleUpdate) => {
    console.log('Handling subtitle update:', JSON.stringify(subtitleUpdate));

    subtitlesStore.update(subs => {
        let updatedSubs = [...subs];
        const lastSub = updatedSubs.length > 0 ? updatedSubs[updatedSubs.length - 1] : null;

        console.log(`Incoming ID: ${subtitleUpdate.sentenceId}, Last Store ID: ${lastSub ? lastSub.sentenceId : 'N/A'}`);

        if (lastSub && lastSub.sentenceId === subtitleUpdate.sentenceId) {
            console.log('Updating existing sentence.');
            // It's the same sentence, just update the text
            lastSub.text = subtitleUpdate.text;
            lastSub.isFinal = subtitleUpdate.isFinal;
        } else {
            console.log('Adding new sentence, marking previous.');
            // It's a new sentence (different ID or first sentence)
            // Mark previous lines as 'previous'
            updatedSubs = updatedSubs.map(sub => ({ ...sub, isPrevious: true }));
            // Add the new subtitle line
            updatedSubs.push({
                ...subtitleUpdate,
                isPrevious: false,
            });
            // Keep only the last 3 lines
            updatedSubs = updatedSubs.slice(-3);
        }

        console.log('Store state after update:', JSON.stringify(updatedSubs.map(s => ({ id: s.sentenceId, text: s.text.slice(0, 10) + '...', isPrev: s.isPrevious }))));

        return updatedSubs;
    });

    // Update recording transcript logic
    if (currentRecordingSession && get(isRecording)) {
        const transcriptIndex = currentRecordingSession.transcripts.findIndex(
            t => t.sentenceId === subtitleUpdate.sentenceId
        );

        const transcriptEntry = {
            speaker: subtitleUpdate.speakerName,
            text: subtitleUpdate.text,
            timestamp: new Date().toISOString(), // Might want start/end timestamps
            sentenceId: subtitleUpdate.sentenceId,
            isFinal: subtitleUpdate.isFinal
        };

        if (transcriptIndex > -1) {
            // Update existing transcript entry
            currentRecordingSession.transcripts[transcriptIndex] = transcriptEntry;
        } else {
            // Add new transcript entry
            currentRecordingSession.transcripts.push(transcriptEntry);
        }

        // Optional: Clean up non-final transcripts in stopRecording if desired
    }

    // Update the last processed sentence ID
    lastSentenceId = subtitleUpdate.sentenceId;
};

// Deprecate or remove the old addSubtitle if no longer used externally
// export const addSubtitle = ... (old implementation)