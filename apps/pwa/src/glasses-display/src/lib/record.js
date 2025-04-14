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

    console.log('getRecordedConversations');
    console.log(getRecordedConversations());
}

// Function to get recordings for Bluetooth transfer and save to file
function getRecordedConversations() {
    try {
        const conversations = JSON.parse(localStorage.getItem('recordedConversations') || '[]');
        if (conversations.length === 0) return null;
        
        // Get the latest conversation
        const latestConversation = conversations[conversations.length - 1];
        
        // Convert to JSON string with proper formatting
        const jsonString = JSON.stringify(latestConversation, null, 2);
        
        // Send via WebSocket to bluetooth bridge
        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'transfer_data',
                data: jsonString
            }));
            console.log('Sent conversation data to bluetooth bridge');
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        return jsonString;
    } catch (e) {
        console.error('Failed to retrieve from localStorage:', e);
        return null;
    }
}
