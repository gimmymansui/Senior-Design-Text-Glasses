import { writable, get } from 'svelte/store';
import { startRecording, stopRecording } from './subtitles.js';
import { websocketConnection } from '$lib/stores/websocket-store';

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
    const currentlyRecording = get(isRecording);
    
    if (!currentlyRecording) {
        // Starting recording - just set recording flag
        isRecording.set(true);
        startRecording();
    } else {
        // Stopping recording - set flag and send recorded data
        isRecording.set(false);
        stopRecording();
        
        // After stopping, send the recorded conversation from local storage
        // This only happens when we stop recording
        setTimeout(() => {
            getRecordedConversations();
        }, 300); // Small delay to ensure recording is fully processed
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
        
        // Send via existing WebSocket
        const connection = get(websocketConnection);
        if (connection && connection.sendMessage) {
            connection.sendMessage({
                type: 'record_data',
                command: 'send_conversation',
                data: jsonString
            });
            console.log('Sent conversation data to bluetooth bridge');
        } else {
            console.error('WebSocket connection not available');
        }
        
        return jsonString;
    } catch (e) {
        console.error('Failed to retrieve from localStorage:', e);
        return null;
    }
}
