import { writable, get } from 'svelte/store';
import { startRecording, stopRecording } from './subtitles.js';

export const isRecording = writable(false);
export const recordingStatus = writable({
    active: false,
    duration: 0,
    savedSessions: []
});

// Set up a timer to track recording duration
let recordingTimer = null;
let startTime = null;

export function toggleRecording() {
    let currentState;
    isRecording.update(state => {
        currentState = !state;
        return currentState;
    });
    
    if (currentState) {
        startRecordingSession();
    } else {
        stopRecordingSession();
    }
}

export function setRecording(value) {
    if (value === true && !get(isRecording)) {
        startRecordingSession();
    } else if (value === false && get(isRecording)) {
        stopRecordingSession();
    }
    isRecording.set(value);
}

function startRecordingSession() {
    // Start a new recording
    startTime = Date.now();
    startRecording();
    
    // Update recording status
    recordingStatus.update(status => ({
        ...status,
        active: true,
        duration: 0
    }));
    
    // Set up timer to update duration
    recordingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        recordingStatus.update(status => ({
            ...status,
            duration: elapsed
        }));
    }, 1000);
}

function stopRecordingSession() {
    // Stop recording timer
    clearInterval(recordingTimer);
    recordingTimer = null;
    
    // Save the recording session
    const session = stopRecording();
    
    // Update recording status
    recordingStatus.update(status => ({
        ...status,
        active: false,
        duration: 0,
        savedSessions: session ? [...status.savedSessions, session] : status.savedSessions
    }));
}

// Function to get recordings for Bluetooth transfer
export function getRecordedConversations() {
    try {
        return JSON.parse(localStorage.getItem('recordedConversations') || '[]');
    } catch (e) {
        console.error('Failed to retrieve from localStorage:', e);
        return [];
    }
}