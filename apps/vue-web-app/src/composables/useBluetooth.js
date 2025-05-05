/**
 * Bluetooth Connection Handler
 * Connects to Text Glasses using Web Bluetooth API
 * Updated to match the backend GATT server setup
 */

import { ref, readonly, watch } from 'vue';

// --- Module-Scoped Reactive State ---
// Define the state *outside* the useBluetooth function.
// This ensures there is only ONE instance of this state.
const isSupported = ref(navigator.bluetooth ? true : false);
const isConnecting = ref(false);
const isConnected = ref(false);
const connectedDevice = ref(null); // Stores { id, name }
const connectionError = ref(null);
const latestTranscription = ref(null);
// ------------------------------------

class BluetoothHandlerInternal {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.commandCharacteristic = null;
        this.rawDataBuffer = [];

        this.SERVICE_UUID = "5f47a3c0-4f1a-4a69-9f6d-1b2c3d4e5f6a";
        this.COMMAND_CHARACTERISTIC_UUID = "7d8e1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b";
        this.DATA_TRANSFER_UUID = "8f5b1d6a-4e2b-4f3a-8e7d-2a3c4e5f6b7c";

        // Callbacks now update the module-scoped refs directly
        this._onConnectedCallback = (device) => {
            console.log("Handler: Connected event");
            isConnecting.value = false;
            isConnected.value = true;
            connectionError.value = null;
            connectedDevice.value = { id: device?.id, name: device?.name };
            if (device?.id) {
                sessionStorage.setItem('lastConnectedBluetoothDeviceId', device.id);
            }
             console.log("Handler: isConnected ref set to", isConnected.value);
        };
        this._onDisconnectedCallback = (/*device*/) => {
            console.log("Handler: Disconnected event");
            isConnecting.value = false;
            isConnected.value = false;
            connectedDevice.value = null;
            connectionError.value = null;
            sessionStorage.removeItem('lastConnectedBluetoothDeviceId');
             console.log("Handler: isConnected ref set to", isConnected.value);
        };
        this._onDataReceivedCallback = (jsonData) => {
            console.log("Handler: Data received", jsonData);
            latestTranscription.value = jsonData; // Update module-scoped ref
            console.log("Handler: latestTranscription ref updated:", latestTranscription.value);
        };
         this._onErrorCallback = (errorMessage) => {
             console.error("Handler: Error received", errorMessage);
             const isNotFoundError = errorMessage.includes('NotFoundError') || errorMessage.includes('cancelled') || errorMessage.includes('chooser');
             if (!isNotFoundError) {
                 connectionError.value = errorMessage;
             } else {
                 console.log('Handler: User cancelled device selection.');
                 connectionError.value = null;
             }
             isConnecting.value = false;
             isConnected.value = false; // Ensure disconnected state on error
             connectedDevice.value = null;
             // Attempt cleanup only if the handler thinks it's connected internally
             if (this.device && this.device.gatt.connected) {
                  console.log("Handler: Disconnecting due to error.");
                  this.disconnect().catch(e => console.error("Handler: Error during disconnect cleanup:", e));
             }
         };
    }

    isSupported() {
        return 'bluetooth' in navigator;
    }

    async connect() {
        if (!this.isSupported()) {
            const error = new Error('Web Bluetooth API is not supported');
            this._onErrorCallback(error.message); // Use callback
            throw error;
        }
        // Update module-scoped state
        isConnecting.value = true;
        connectionError.value = null;
        latestTranscription.value = null;

        try {
            console.log("Requesting Bluetooth device...");
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ name: "TextGlasses Gateway (Node)" }],
                optionalServices: [this.SERVICE_UUID]
            });
            console.log("Device selected:", this.device.name);

            this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));

            console.log("Connecting to GATT server...");
            this.server = await this.device.gatt.connect();
            console.log("GATT server connected.");

            this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
            this.commandCharacteristic = await this.service.getCharacteristic(this.COMMAND_CHARACTERISTIC_UUID);
            const dataCharacteristic = await this.service.getCharacteristic(this.DATA_TRANSFER_UUID);

            console.log("Starting notifications...");
            await dataCharacteristic.startNotifications();
            dataCharacteristic.addEventListener('characteristicvaluechanged', this.handleRawDataChunk.bind(this));
            console.log("Notifications started.");

            // Call the success callback which updates module-scoped state
            this._onConnectedCallback(this.device);

        } catch (error) {
            console.error('Connection error in handler:', error);
             // Error callback updates module-scoped state
            this._onErrorCallback(error.message || 'Connection failed');
            // Ensure connecting state is reset if error happens before connect callback
            if (isConnecting.value) isConnecting.value = false;
            throw error;
        }
    }

     async disconnect() {
         // Update module-scoped state immediately if trying to disconnect while connecting
         if (isConnecting.value) isConnecting.value = false;

        if (this.device && this.device.gatt.connected) {
            console.log("Disconnecting from GATT server...");
            // Don't update isConnected here; let the event handler do it via the callback
            await this.device.gatt.disconnect();
             console.log("GATT disconnect called.");
        } else {
             console.log("Disconnect called but device not connected.");
             // Manually trigger disconnect callback if not actually connected
             // to ensure state consistency (e.g., if disconnect is called during connection attempt)
             this._onDisconnectedCallback();
        }
    }

    // handleDisconnection calls the _onDisconnectedCallback which updates the module state
    handleDisconnection() {
        console.log("GATT server disconnected event. Triggering callback.");
        this.rawDataBuffer = [];
        const disconnectedDevice = this.device;
        this.device = null;
        this.server = null;
        this.service = null;
        this.commandCharacteristic = null;
        this._onDisconnectedCallback(disconnectedDevice);
    }

    // handleRawDataChunk and processBuffer update latestTranscription via _onDataReceivedCallback
    handleRawDataChunk(event) {
        const valueDataView = event.target.value;
        if (!valueDataView || !(valueDataView instanceof DataView) || valueDataView.buffer == null) {
            console.error("Invalid DataView received:", valueDataView);
            return;
        }
        const chunkBuffer = valueDataView.buffer;
        this.rawDataBuffer.push(chunkBuffer);
        this.processBuffer();
    }
    _concatArrayBuffers(buffers) {
        let totalLength = buffers.reduce((acc, val) => acc + val.byteLength, 0);
        let result = new Uint8Array(totalLength);
        let offset = 0;
        for (let buffer of buffers) {
            result.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }
        return result.buffer; // Return as ArrayBuffer
    }
    processBuffer() {
        if (this.rawDataBuffer.length === 0) return;

        const combinedBuffer = this._concatArrayBuffers(this.rawDataBuffer);
        const decoder = new TextDecoder('utf-8');
        let combinedString = "";
        try {
            combinedString = decoder.decode(combinedBuffer);
        } catch (e) {
            console.error("Error decoding combined buffer:", e);
            this.rawDataBuffer = []; // Clear buffer on decode error
            if (this._onErrorCallback) this._onErrorCallback("Buffer decoding error"); // Updates module state
            return;
        }

        const SOM_MARKER = "<<START>>";
        const EOM_MARKER = "<<END>>";
        const somIndex = combinedString.indexOf(SOM_MARKER);
        const eomIndex = combinedString.indexOf(EOM_MARKER);

        if (somIndex === 0 && eomIndex > somIndex) {
            const endMarkerEndIndex = eomIndex + EOM_MARKER.length;
            const potentialMessage = combinedString.substring(SOM_MARKER.length, eomIndex);

            try {
                const jsonData = JSON.parse(potentialMessage);
                console.log("Complete JSON parsed successfully:", jsonData);

                // Call the composable's data callback
                if (this._onDataReceivedCallback) {
                    this._onDataReceivedCallback(jsonData); // Updates module state
                }

                // Clear processed message from the buffer
                const remainingBuffer = combinedBuffer.slice(endMarkerEndIndex);
                this.rawDataBuffer = remainingBuffer.byteLength > 0 ? [remainingBuffer] : [];
                console.log(`Buffer cleared. Remaining raw buffer size: ${remainingBuffer.byteLength} bytes`);

                // If there's remaining data, process it immediately
                if (remainingBuffer.byteLength > 0) {
                    this.processBuffer();
                }

            } catch (e) {
                console.error('JSON parsing failed:', e);
                console.log('Buffer content on failure (between markers): ', potentialMessage);
                if (this._onErrorCallback) this._onErrorCallback("JSON parsing error"); // Updates module state
                // Decide how to handle buffer on parse error - maybe clear?
                 console.warn("Clearing entire raw buffer due to parsing error.");
                 this.rawDataBuffer = [];
            }
        } else if (eomIndex !== -1 && somIndex > 0) {
            console.warn("EOM marker found, but SOM marker is not at the beginning. Clearing buffer.");
            if (this._onErrorCallback) this._onErrorCallback("Data corruption (SOM)"); // Updates module state
            this.rawDataBuffer = [];
        } else {
            // Waiting for more data or markers not found yet
             // console.log("Waiting for complete SOM/EOM markers...");
        }
    }


    async sendData(data) {
         // Check module-scoped state
        if (!isConnected.value || !this.commandCharacteristic) {
             const errorMsg = 'Cannot send data: Not connected or characteristic not available.';
             console.error(errorMsg);
             this._onErrorCallback(errorMsg); // Updates module state
            throw new Error(errorMsg);
        }
        if (!this.commandCharacteristic.properties.write && !this.commandCharacteristic.properties.writeWithoutResponse) {
            const errorMsg = 'Characteristic does not support write operations.';
             console.error(errorMsg);
             this._onErrorCallback(errorMsg); // Updates module state
             throw new Error(errorMsg);
        }
        try {
            const message = data.toString();
            console.log('Sending command via BLE:', message);
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(message);

            if (this.commandCharacteristic.properties.write) {
                await this.commandCharacteristic.writeValueWithResponse(dataArray);
            } else {
                await this.commandCharacteristic.writeValueWithoutResponse(dataArray);
            }
            console.log('Command sent successfully.');
        } catch (error) {
            console.error('Error sending data:', error);
             this._onErrorCallback(error.message || 'Send data failed'); // Updates module state
            throw error;
        }
    }

    async sendRecordCommand() {
        // Check module-scoped state
        if (!isConnected.value) {
            const errorMsg = "Cannot send record command: Not connected.";
            console.error(errorMsg);
            this._onErrorCallback(errorMsg); // Updates module state
            // Don't throw, just set error and return
            return;
        }
        try {
            await this.sendData("record");
        } catch (error) {
            // sendData already calls _onErrorCallback
             console.error("Error during sendRecordCommand:", error);
        }
    }
} // --- End BluetoothHandlerInternal ---


// --- Singleton Instance Holder ---
let handlerInstance = null;
console.log("--- useBluetooth() module loaded ---");

// --- Exported Composable Function ---
export function useBluetooth() {
    console.log("--- Inside useBluetooth() function execution ---");

    // Ensure only one handler instance exists
    if (!handlerInstance) {
        console.log("Creating new BluetoothHandlerInternal instance");
        handlerInstance = new BluetoothHandlerInternal();
    }
    const handler = handlerInstance;

    // --- Methods Exposed by Composable ---
    // These methods now primarily interact with the handlerInstance,
    // which in turn updates the module-scoped state via its callbacks.
    const connect = async () => {
        // Check module-scoped state
        if (isConnected.value || isConnecting.value) {
            console.warn("Connect called while already connected or connecting.");
            return;
        }
        // State updates (isConnecting, error) are handled within handler.connect()
        try {
            await handler.connect();
        } catch (error) {
             console.error("Error caught during connect method in composable:", error);
             // Ensure connecting is false if callbacks didn't handle it
             if (isConnecting.value) isConnecting.value = false;
        }
    };

    const disconnect = async () => {
        // Check module-scoped state
        if (!isConnected.value && !isConnecting.value) {
             console.warn("Disconnect called but not connected or connecting.");
             if (isConnecting.value) isConnecting.value = false; // Reset connecting if called early
            return;
        }
         console.log("Composable requesting disconnect...");
         // State updates handled by handler.disconnect() -> _onDisconnectedCallback
         await handler.disconnect();
    };

    const sendRecordCommand = async () => {
        // Error handling and state check now inside handler.sendRecordCommand()
         await handler.sendRecordCommand();
    };

     const clearError = () => {
         connectionError.value = null; // Directly update module-scoped ref
     };

     const clearTranscription = () => {
         latestTranscription.value = null; // Directly update module-scoped ref
     };

    // --- Return module-scoped reactive state (readonly) and methods ---
    return {
        isSupported: readonly(isSupported),
        isConnecting: readonly(isConnecting),
        isConnected: readonly(isConnected),
        connectedDevice: readonly(connectedDevice),
        connectionError: readonly(connectionError),
        latestTranscription: readonly(latestTranscription), // Return the actual ref needed for watching

        connect,
        disconnect,
        sendRecordCommand,
        clearError,
        clearTranscription,
    };
} 