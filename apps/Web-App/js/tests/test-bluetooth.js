/**
 * Bluetooth Test Functionality
 * Provides test utilities for the Bluetooth connection
 */

import { bluetoothController } from '../controllers/bluetooth.js';

/**
 * Initialize the connection test
 * Sets up the test UI and event listeners
 */
export function initBluetoothTest() {
    // Create test UI
    createTestUI();
    
    // Add event listeners
    document.getElementById('testConnectBtn').addEventListener('click', testConnect);
    document.getElementById('testRecordBtn').addEventListener('click', testRecording);
    document.getElementById('testSaveBtn').addEventListener('click', testSave);
    
    // Log initialization
    logStatus('Bluetooth test initialized. Ready to connect.');
}

/**
 * Create the test UI elements
 */
function createTestUI() {
    const testContainer = document.createElement('div');
    testContainer.className = 'bluetooth-test-container';
    testContainer.innerHTML = `
        <h2>Bluetooth Test Panel</h2>
        <div class="test-status" id="testStatus">Not Connected</div>
        <div class="test-controls">
            <button id="testConnectBtn" class="test-button">Connect Device</button>
            <button id="testRecordBtn" class="test-button" disabled>Test Recording</button>
            <button id="testSaveBtn" class="test-button" disabled>Test Save</button>
        </div>
        <div class="test-log">
            <h3>Test Log</h3>
            <div id="testLog" class="log-container"></div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .bluetooth-test-container {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 1000;
            width: 300px;
        }
        .test-status {
            padding: 8px;
            margin: 10px 0;
            text-align: center;
            font-weight: bold;
            border-radius: 5px;
            background: #ff3b30;
        }
        .test-status.connected {
            background: #34c759;
        }
        .test-controls {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .test-button {
            padding: 8px;
            background: #007aff;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
        }
        .test-button:disabled {
            background: #999;
            cursor: not-allowed;
        }
        .test-log {
            margin-top: 15px;
        }
        .log-container {
            height: 150px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            padding: 8px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        }
        .log-entry {
            margin-bottom: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 2px;
        }
        .log-entry.error {
            color: #ff3b30;
        }
        .log-entry.success {
            color: #34c759;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(testContainer);
}

/**
 * Test the Bluetooth connection
 */
async function testConnect() {
    logStatus('Attempting to connect...');
    
    try {
        const result = await bluetoothController.connect();
        if (result) {
            updateConnectionStatus(true);
            logStatus('Successfully connected to device', 'success');
        } else {
            updateConnectionStatus(false);
            logStatus('Failed to connect to device', 'error');
        }
    } catch (error) {
        updateConnectionStatus(false);
        logStatus(`Connection error: ${error.message}`, 'error');
    }
}

/**
 * Test the recording functionality
 */
async function testRecording() {
    logStatus('Testing recording functionality...');
    
    try {
        const result = await bluetoothController.toggleRecording();
        if (result) {
            logStatus('Recording command sent successfully', 'success');
        } else {
            logStatus('Failed to send recording command', 'error');
        }
    } catch (error) {
        logStatus(`Recording error: ${error.message}`, 'error');
    }
}

/**
 * Test the save functionality
 */
async function testSave() {
    logStatus('Testing save functionality...');
    const testName = 'TestConversation_' + new Date().toISOString().replace(/:/g, '-');
    
    try {
        const result = await bluetoothController.saveTranscription(testName);
        if (result) {
            logStatus(`Save command sent successfully with name "${testName}"`, 'success');
        } else {
            logStatus('Failed to send save command', 'error');
        }
    } catch (error) {
        logStatus(`Save error: ${error.message}`, 'error');
    }
}

/**
 * Update the connection status in the UI
 */
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('testStatus');
    const recordButton = document.getElementById('testRecordBtn');
    const saveButton = document.getElementById('testSaveBtn');
    
    if (statusElement) {
        statusElement.textContent = isConnected ? 'Connected' : 'Not Connected';
        statusElement.className = isConnected ? 'test-status connected' : 'test-status';
    }
    
    if (recordButton) {
        recordButton.disabled = !isConnected;
    }
    
    if (saveButton) {
        saveButton.disabled = !isConnected;
    }
}

/**
 * Log a status message to the test log
 */
function logStatus(message, type = 'info') {
    const logElement = document.getElementById('testLog');
    if (logElement) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    console.log(`Bluetooth Test: ${message}`);
}