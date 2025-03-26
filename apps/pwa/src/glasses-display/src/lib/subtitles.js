import { writable } from 'svelte/store';

export const subtitlesStore = writable([]);

// Track current sentences by ID
const sentenceMap = new Map();

/**
 * Creates a new subtitle to the svelte subtitle store
 * @param {Object} newSubtitle
 * @param {Object} newSubtitle.speakerName
 * @param {Object} newSubtitle.text
 */

export function addSubtitle(subtitle) {
    subtitlesStore.update(subtitles => {
        const { speakerName, text, isPartial, sentenceId } = subtitle;
        
        // Check if we already have this sentence in our map
        if (sentenceMap.has(sentenceId)) {
            // Update existing sentence if it's a partial update
            if (isPartial) {
                sentenceMap.set(sentenceId, { speakerName, text, isPrevious: false });
            } else {
                // Final version of the sentence
                sentenceMap.set(sentenceId, { speakerName, text, isPrevious: false });
                
                // Mark previous sentences as "previous"
                for (const [id, sentence] of sentenceMap.entries()) {
                    if (id !== sentenceId) {
                        sentenceMap.set(id, { ...sentence, isPrevious: true });
                    }
                }
            }
        } else {
            // New sentence
            sentenceMap.set(sentenceId, { speakerName, text, isPrevious: false });
        }
        
        // Convert map to array and limit to last 3 sentences
        const newSubtitles = Array.from(sentenceMap.values());
        
        // Sort by isPrevious (false first, then true)
        newSubtitles.sort((a, b) => {
            if (a.isPrevious === b.isPrevious) return 0;
            return a.isPrevious ? 1 : -1;
        });
        
        // Limit to last 3 sentences
        if (newSubtitles.length > 3) {
            // Remove oldest previous sentences
            const previousCount = newSubtitles.filter(s => s.isPrevious).length;
            if (previousCount > 2) {
                // Find keys to remove
                const keysToRemove = [];
                for (const [id, sentence] of sentenceMap.entries()) {
                    if (sentence.isPrevious) {
                        keysToRemove.push(id);
                        if (keysToRemove.length >= previousCount - 2) break;
                    }
                }
                
                // Remove oldest keys
                for (const key of keysToRemove) {
                    sentenceMap.delete(key);
                }
                
                // Rebuild array
                return Array.from(sentenceMap.values());
            }
        }
        
        return newSubtitles;
    });
}