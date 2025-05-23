// bluetooth_bridge.js
const bleno = require('@abandonware/bleno');
const WebSocket = require('ws');
const util = require('util');

// --- Configuration ---
const WEBSOCKET_URI = "ws://localhost:8080"; // Connect to your existing server
const SERVICE_UUID = "5f47a3c0-4f1a-4a69-9f6d-1b2c3d4e5f6a";
const COMMAND_CHARACTERISTIC_UUID = "7d8e1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b";
// Correct Data Transfer UUID - ensure this matches the client (bluetooth.js)
const DATA_TRANSFER_UUID = "8f5b1d6a-4e2b-4f3a-8e7d-2a3c4e5f6b7c"; 
// const DATA_TRANSFER_CHARACTERISTIC_UUID = "8d7f1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b"; // Removed incorrect/old UUID
const EXPECTED_BLE_COMMAND = "record";
const WEBSOCKET_MESSAGE = { type: "record" };
const DEVICE_NAME = "TextGlasses Gateway (Node)";
// --- End Configuration ---

// Define unique markers (use non-printable characters or unlikely sequences if possible)
// Ensure these sequences are *highly unlikely* to appear naturally in your JSON data.
const SOM_MARKER = Buffer.from("<<START>>");
const EOM_MARKER = Buffer.from("<<END>>");

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

// Add data transfer characteristic
class DataTransferCharacteristic extends bleno.Characteristic {
    constructor() {
        super({
            uuid: DATA_TRANSFER_UUID,
            properties: ['notify', 'write'],
            value: null,
            descriptors: [
                new bleno.Descriptor({
                    uuid: '2901',
                    value: 'Transfer conversation data'
                })
            ]
        });
        this.updateValueCallback = null;
    }

    onSubscribe(maxValueSize, updateValueCallback) {
        console.log('Client subscribed to data transfer');
        this.updateValueCallback = updateValueCallback;
        return this.RESULT_SUCCESS;
    }

    onUnsubscribe() {
        console.log('Client unsubscribed from data transfer');
        this.updateValueCallback = null;
        return this.RESULT_SUCCESS;
    }

    async sendData(data) {
        if (!this.updateValueCallback) {
            console.log('No BLE client subscribed for notifications');
            return false;
        }

        console.log('--- Preparing data for BLE transmission ---');
        console.log(`Original data length: ${data.length} bytes`);
        console.log('--- Sending with SOM/EOM markers (with inter-chunk delay) ---');

        try {
            const dataBuffer = Buffer.from(data, 'utf8');
            const chunkSize = 200; // Reduced chunk size
            const delayMs = 10; // Delay between data chunks

            console.log(`Sending SOM marker (${SOM_MARKER.length} bytes)`);
            this.updateValueCallback(SOM_MARKER);
            // Optional short delay after SOM if needed
            // await new Promise(resolve => setTimeout(resolve, 5));

            console.log(`Sending data (${dataBuffer.length} bytes) in chunks of max ${chunkSize} with ${delayMs}ms delay...`);
            for (let i = 0; i < dataBuffer.length; i += chunkSize) {
                const chunk = dataBuffer.slice(i, Math.min(i + chunkSize, dataBuffer.length));
                console.log(` Sending chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} bytes)...`);
                this.updateValueCallback(chunk);
                // Wait for the delay before sending the next chunk
                await new Promise(resolve => setTimeout(resolve, delayMs)); 
            }

            // Send EOM immediately after the last data chunk + delay
            console.log(`Sending EOM marker (${EOM_MARKER.length} bytes) immediately.`);
            if (this.updateValueCallback) { // Check if still valid
                this.updateValueCallback(EOM_MARKER);
                console.log(`Successfully initiated sending of EOM marker.`);
            } else {
                console.log('Client unsubscribed before EOM could be sent.');
            }

            console.log(`Successfully initiated sending of ${dataBuffer.length} bytes data (+ markers) via BLE.`);
            return true;

        } catch (error) {
            console.error('Error during data/marker sending via BLE:', error);
            return false;
        }
    }
}

// --- BLE Service Definition ---
const commandService = new bleno.PrimaryService({
    uuid: SERVICE_UUID,
    characteristics: [
        new CommandCharacteristic(),
        new DataTransferCharacteristic()
    ]
});

// Store the data transfer characteristic for easy access
let dataTransferCharacteristic = null;

// --- WebSocket Client Logic ---
let webSocketClient = null;

function connectToWebSocket() {
    console.log(`Connecting to WebSocket server at: ${WEBSOCKET_URI}`);
    webSocketClient = new WebSocket(WEBSOCKET_URI);

    webSocketClient.on('open', function open() {
        console.log('Connected to WebSocket server');
    });

    webSocketClient.on('message', function incoming(message) {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log('Received message from WebSocket server:', parsedMessage);

            // Only process messages of type 'record_data'
            if (parsedMessage.type === 'record_data') {
                 // Further check if the command is to send conversation data
                 if (parsedMessage.command === 'send_conversation') {
                    console.log("Processing 'record_data' with command 'send_conversation'");
                    //console.log('Received conversation data from WebSocket. Data BEFORE sending to BLE:', parsedMessage.data); // Optional: Keep or remove this log

                    // Send via BLE if a client is connected
                    if (dataTransferCharacteristic && dataTransferCharacteristic.updateValueCallback) {
                        const success = dataTransferCharacteristic.sendData(parsedMessage.data);
                        
                        // Send status back
                        const statusResponse = {
                            type: 'transfer_status',
                            status: success ? 'sent' : 'failed',
                            error: success ? null : 'Failed to send via BLE'
                        };
                        
                        webSocketClient.send(JSON.stringify(statusResponse));
                        console.log('Sent transfer status:', statusResponse.status);
                    } else {
                        console.error('No BLE client subscribed for notifications');
                        
                        // Send error status
                        webSocketClient.send(JSON.stringify({
                            type: 'transfer_status',
                            status: 'failed',
                            error: 'No BLE client connected'
                        }));
                    }
                } else {
                     console.log(`Ignoring 'record_data' message with command: ${parsedMessage.command}`);
                }
            } else {
                // Ignore other message types
                console.log(`Ignoring message with type: ${parsedMessage.type}`);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });

    webSocketClient.on('close', function close() {
        console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
        setTimeout(connectToWebSocket, 5000);
    });

    webSocketClient.on('error', function error(err) {
        console.error(`WebSocket error: ${err.message}`);
        // Attempt to close if an error occurs
        if (webSocketClient.readyState !== WebSocket.CLOSED) {
            webSocketClient.close();
        }
    });
}

// Modified function to send messages through existing connection
function sendToWebSocket(message) {
    if (webSocketClient && webSocketClient.readyState === WebSocket.OPEN) {
        try {
            const messageString = JSON.stringify(message);
            webSocketClient.send(messageString);
            console.log(`Sent message to WebSocket: ${messageString}`);
        } catch (err) {
            console.error('Error sending message via WebSocket:', err);
        }
    } else {
        console.error('WebSocket not connected. Message not sent.');
    }
}

// --- BLE Advertising and State Management ---
bleno.on('stateChange', (state) => {
    console.log(`BLE state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log("Setting BLE services...");
        // Set services before starting advertising
        bleno.setServices([commandService], (error) => {
            if(error) {
                console.error("Setting services failed:", error);
            } else {
                 console.log("Services set successfully. Starting advertising...");
                 // Start advertising only after services are set
                 bleno.startAdvertising(DEVICE_NAME, [commandService.uuid], (err) => {
                     if (err) {
                         console.error("Advertising failed:", err);
                     }
                     // Advertising start success/failure is logged in the 'advertisingStart' event handler
                 });
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
        console.log(` Command Characteristic UUID: ${COMMAND_CHARACTERISTIC_UUID}`);
        // Use the correct constant for logging
        console.log(` Data Transfer Characteristic UUID: ${DATA_TRANSFER_UUID}`); 
        console.log('Waiting for BLE connections...');
        // **setServices call was moved to 'stateChange' handler**
        // bleno.setServices([commandService], (error) => {
        //     if(error) {
        //         console.error("Setting services failed:", error)
        //     } else {
        //          console.log("Services set successfully.");
        //     }
        // });
    } else {
        console.error('BLE advertising failed to start:', err);
    }
});

// After services are set, store the data transfer characteristic
bleno.on('servicesSet', (err) => {
    if (!err) {
        // Find the DataTransferCharacteristic
        commandService.characteristics.forEach(char => {
            if (char instanceof DataTransferCharacteristic) {
                dataTransferCharacteristic = char;
                console.log('Data transfer characteristic ready');
            }
        });
    }
});

// Connect to WebSocket server on startup
connectToWebSocket();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("\nCaught interrupt signal (Ctrl+C). Shutting down.");
    bleno.stopAdvertising(() => {
        console.log("Advertising stopped.");
        if (webSocketClient) {
            webSocketClient.close();
        }
        // Allow time for disconnect events before exiting
        setTimeout(() => process.exit(0), 500);
    });
});