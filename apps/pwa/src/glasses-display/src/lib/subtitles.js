import { writable } from 'svelte/store';

export const subtitlesStore = writable([]);

/**
 * Creates a new subtitle to the svelte subtitle store
 * @param {Object} newSubtitle
 * @param {Object} newSubtitle.speakerName
 * @param {Object} newSubtitle.text
 */

export const addSubtitle = (newSubtitle) => {
  subtitlesStore.update(subtitles => {
    // Mark previous subtitles as "previous"
    const updatedSubtitles = subtitles.map(subtitle => ({
      ...subtitle,
      isPrevious: true
    }));
    
    // Add new subtitle
    const allSubtitles = [...updatedSubtitles, {
      ...newSubtitle,
      isPrevious: false
    }];
    
    // Keep only last 3 subtitles
    return allSubtitles.slice(-3);
  });
};