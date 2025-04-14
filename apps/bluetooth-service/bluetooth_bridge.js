// bluetooth_bridge.js
const bleno = require('@abandonware/bleno');
const WebSocket = require('ws');
const util = require('util');

// --- Configuration ---
const WEBSOCKET_URI = "ws://localhost:8080";
const SERVICE_UUID = "5f47a3c0-4f1a-4a69-9f6d-1b2c3d4e5f6a"; // Use the same UUIDs
const COMMAND_CHARACTERISTIC_UUID = "7d8e1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b";
const EXPECTED_BLE_COMMAND = "record";
const WEBSOCKET_MESSAGE = { type: "record" }; // Message to send
const DEVICE_NAME = "TextGlasses Gateway (Node)";
// --- End Configuration ---

// --- WebSocket Logic ---
function sendToWebSocket(message) {
    console.log(`Attempting to connect to WebSocket: ${WEBSOCKET_URI}`);
    const ws = new WebSocket(WEBSOCKET_URI);

    ws.on('open', function open() {
        console.log('WebSocket connection established.');
        try {
            const messageString = JSON.stringify(message);
            ws.send(messageString);
            console.log(`Sent message to WebSocket: ${messageString}`);
        } catch (err) {
            console.error('Error sending message via WebSocket:', err);
        } finally {
             // Close connection after sending (optional, depends on your ws server needs)
             ws.close();
        }
    });

    ws.on('close', function close() {
        console.log('WebSocket connection closed.');
    });

    ws.on('error', function error(err) {
        console.error(`WebSocket connection error: ${err.message}`);
        // Attempt to close if an error occurs before 'open' or during communication
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
        }
    });
}

// --- BLE Characteristic Logic ---
class CommandCharacteristic extends bleno.Characteristic {
    constructor() {
        super({
            uuid: COMMAND_CHARACTERISTIC_UUID,
            properties: ['write', 'writeWithoutResponse'],
            value: null,
            descriptors: [
                new bleno.Descriptor({
                    uuid: '2901', // Characteristic User Description UUID
                    value: 'Receives commands'
                })
            ]
        });
    }

    onWriteRequest(data, offset, withoutResponse, callback) {
        try {
            const command = data.toString('utf8').trim();
            console.log(`Received data via BLE: '${command}'`);

            if (command === EXPECTED_BLE_COMMAND) {
                console.log(`Command '${EXPECTED_BLE_COMMAND}' received. Triggering WebSocket send.`);
                // Send to WebSocket asynchronously (no need to wait for it here)
                sendToWebSocket(WEBSOCKET_MESSAGE);
            } else {
                console.warn(`Received unknown/unexpected command: ${command}`);
            }
            // Signal success to the BLE client
            callback(this.RESULT_SUCCESS);
        } catch (err) {
            console.error(`Error processing received BLE data: ${err}`);
            // Signal failure to the BLE client
            callback(this.RESULT_UNLIKELY_ERROR);
        }
    }
}

// --- BLE Service Definition ---
const commandService = new bleno.PrimaryService({
    uuid: SERVICE_UUID,
    characteristics: [
        new CommandCharacteristic()
    ]
});

// --- BLE Advertising and State Management ---
bleno.on('stateChange', (state) => {
    console.log(`BLE state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log(`Starting BLE advertising as '${DEVICE_NAME}'...`);
        bleno.startAdvertising(DEVICE_NAME, [commandService.uuid], (err) => {
            if (err) {
                console.error("Advertising failed:", err);
            }
        });
    } else {
        console.log("Stopping BLE advertising.");
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', (err) => {
    if (!err) {
        console.log('BLE advertising started successfully.');
        console.log(` Service UUID: ${SERVICE_UUID}`);
        console.log(` Writable Characteristic UUID: ${COMMAND_CHARACTERISTIC_UUID}`);
        console.log('Waiting for BLE connections and commands...');
        bleno.setServices([commandService], (error) => {
            if(error) {
                console.error("Setting services failed:", error)
            } else {
                 console.log("Services set successfully.");
            }
        });
    } else {
        console.error('BLE advertising failed to start:', err);
    }
});

bleno.on('advertisingStop', () => {
    console.log('BLE advertising stopped.');
});

bleno.on('servicesSet', (err) => {
    if(err) console.error('Setting services failed:', err);
    else console.log('BLE services set.');
});

bleno.on('accept', (clientAddress) => {
    console.log(`Accepted connection from: ${clientAddress}`);
});

bleno.on('disconnect', (clientAddress) => {
    console.log(`Disconnected from: ${clientAddress}`);
    // Optional: Restart advertising if needed/allowed by the library state
    // if (bleno.state === 'poweredOn') {
    //     bleno.startAdvertising(DEVICE_NAME, [commandService.uuid]);
    // }
});


console.log("Starting BLE WebSocket Gateway (Node.js)...");
console.log("Ensure you have the necessary permissions (e.g., run with sudo if required).");
// Platform check (basic)
if (process.platform === 'win32') {
    console.error("Warning: bleno is not fully supported on Windows. Use Linux or macOS.");
} else if (process.platform === 'darwin') {
     console.log("Running on macOS. Ensure Bluetooth is enabled.");
} else if (process.platform === 'linux') {
    console.log("Running on Linux. Ensure Bluetooth daemon is running and you have permissions.");
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("\nCaught interrupt signal (Ctrl+C). Shutting down.");
    bleno.stopAdvertising(() => {
        console.log("Advertising stopped.");
        // Allow time for disconnect events if necessary before exiting
        setTimeout(() => process.exit(0), 500);
    });
});