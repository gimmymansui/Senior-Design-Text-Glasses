import { writable } from 'svelte/store';

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
 * Creates a new subtitle to the svelte subtitle store
 * @param {Object} newSubtitle
 * @param {Object} newSubtitle.speakerName
 * @param {Object} newSubtitle.text
 */

export function addSubtitle(subtitle) {
    // Add to current recording if active - BUT ONLY FOR COMPLETE SENTENCES
    if (currentRecordingSession && !subtitle.isPartial) {
        currentRecordingSession.transcripts.push({
            ...subtitle,
            timestamp: new Date().toISOString()
        });
    }
    
    subtitlesStore.update(subtitles => {
        const { speakerName, text, isPartial, sentenceId } = subtitle;
        
        // Check if we already have this sentence in our map
        if (sentenceMap.has(sentenceId)) {
            // Update existing sentence
            sentenceMap.set(sentenceId, { 
                speakerName, 
                text, 
                isPrevious: false,
                sentenceId, // Add this to track the actual ID
                lastUpdated: Date.now() // Add timestamp for proper sorting
            });
            
            // If this is a final (non-partial) update, mark older sentences as previous
            if (!isPartial) {
                // Mark all sentences EXCEPT the current one as "previous"
                for (const [id, sentence] of sentenceMap.entries()) {
                    if (id !== sentenceId) {
                        sentenceMap.set(id, { ...sentence, isPrevious: true });
                    }
                }
            }
        } else {
            // New sentence - mark all existing sentences as previous
            for (const [id, sentence] of sentenceMap.entries()) {
                sentenceMap.set(id, { ...sentence, isPrevious: true });
            }
            
            // Add the new sentence
            sentenceMap.set(sentenceId, { 
                speakerName, 
                text, 
                isPrevious: false,
                sentenceId,
                lastUpdated: Date.now()
            });
        }
        
        // Convert map to array and prepare for display
        const newSubtitles = Array.from(sentenceMap.values());
        
        // Sort subtitles: current sentence first (isPrevious=false), then previous by recency
        newSubtitles.sort((a, b) => {
            if (a.isPrevious !== b.isPrevious) {
                return a.isPrevious ? 1 : -1; // Current sentence first
            }
            // For previous sentences, show most recent first
            return b.lastUpdated - a.lastUpdated;
        });
        
        // Limit to last 3 sentences
        if (newSubtitles.length > 3) {
            // Keep the current sentence and the 2 most recent previous sentences
            const currentSentences = newSubtitles.filter(s => !s.isPrevious);
            const previousSentences = newSubtitles.filter(s => s.isPrevious)
                                                .slice(0, 3 - currentSentences.length);
            
            // Update the map to remove old sentences
            const sentencesToKeep = new Set([
                ...currentSentences.map(s => s.sentenceId),
                ...previousSentences.map(s => s.sentenceId)
            ]);
            
            // Remove sentences not in the keep set
            for (const id of sentenceMap.keys()) {
                if (!sentencesToKeep.has(id)) {
                    sentenceMap.delete(id);
                }
            }
            
            return [...currentSentences, ...previousSentences];
        }
        
        return newSubtitles;
    });
}