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
    const stopDelay = 1000; // Delay in ms before actually stopping
    const processingDelay = 300; // Delay in ms after stopping to allow processing

    if (!currentlyRecording) {
        // Starting recording - create session first, then set flag
        // No delay added here to keep UI responsive
        startRecording(); // Create the session object in subtitles.js
        isRecording.set(true); // NOW set the flag to true
    } else {
        // Add a delay before stopping to potentially capture trailing audio
        setTimeout(() => {
            // Stopping recording - set flag and stop the actual recording
            isRecording.set(false);
            stopRecording();

            // After stopping, wait a bit more for processing, then send the recorded conversation
            setTimeout(() => {
                getRecordedConversations();
            }, processingDelay); // Small delay to ensure recording is fully processed
        }, stopDelay);
    }
}

export function setRecording(value) {
    // This function now primarily calls the session functions
    // The isRecording flag is set *inside* start/stopRecordingSession
    if (value === true && !get(isRecording)) {
        startRecordingSession();
    } else if (value === false && get(isRecording)) {
        stopRecordingSession();
    }
    // Remove isRecording.set(value); from here as it's handled internally now
}

function startRecordingSession() {
    // Start a new recording session
    startTime = Date.now();
    startRecording(); // Create the session object in subtitles.js

    // Set recording flag AFTER session is initialized
    isRecording.set(true);

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
    const stopDelay = 1000; // Delay in ms before actually stopping
    const processingDelay = 300; // Delay in ms after stopping to allow processing

    // Stop recording timer
    clearInterval(recordingTimer);
    recordingTimer = null;

    // Add a delay before stopping to potentially capture trailing audio
    setTimeout(() => {
        // Save the recording session
        const session = stopRecording(); // This implicitly stops adding subtitles

        // Set flag to false AFTER stopping subtitle capture
        isRecording.set(false);

        // Update recording status
        recordingStatus.update(status => ({
            ...status,
            active: false,
            duration: 0,
            savedSessions: session ? [...status.savedSessions, session] : status.savedSessions
        }));

        // Wait a bit more for processing before sending
        setTimeout(() => {
            console.log('getRecordedConversations from stopRecordingSession');
            getRecordedConversations();
        }, processingDelay);

    }, stopDelay);
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
