/**
 * Bluetooth Connection Handler
 * Connects to Text Glasses using Web Bluetooth API
 * Updated to match the backend GATT server setup
 */

class BluetoothHandler {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.commandCharacteristic = null;
        this.isConnected = false;
        this.dataBuffer = ""; // Add buffer for incoming data chunks
        
        // UUIDs should match those in bluetooth_bridge.js
        this.SERVICE_UUID = "5f47a3c0-4f1a-4a69-9f6d-1b2c3d4e5f6a";
        this.COMMAND_CHARACTERISTIC_UUID = "7d8e1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b";
        this.DATA_TRANSFER_UUID = "8f5b1d6a-4e2b-4f3a-8e7d-2a3c4e5f6b7c"; // Match the UUID from bridge
        
        // Callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onDataReceived = null;
    }
    
    /**
     * Check if Web Bluetooth API is supported by the browser
     */
    isSupported() {
        return 'bluetooth' in navigator;
    }
    
    /**
     * Connect to the Bluetooth device targeting the GATT setup
     */
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Bluetooth API is not supported in your browser');
        }
        
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ name: "TextGlasses Gateway (Node)" }],
                optionalServices: [this.SERVICE_UUID]
            });

            this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
            
            this.server = await this.device.gatt.connect();
            this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
            
            // Get the command characteristic
            this.commandCharacteristic = await this.service.getCharacteristic(this.COMMAND_CHARACTERISTIC_UUID);

            // Set up data transfer characteristic listener
            const dataCharacteristic = await this.service.getCharacteristic(this.DATA_TRANSFER_UUID);
            await dataCharacteristic.startNotifications();
            dataCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataReceived.bind(this));

            this.isConnected = true;
            if (this.onConnected) this.onConnected();
            
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }

    handleDisconnection() {
        this.isConnected = false;
        this.dataBuffer = ""; // Clear buffer on disconnect
        if (this.onDisconnected) this.onDisconnected();
    }

    // Handle incoming data chunks using SOM and EOM markers
    handleDataReceived(event) {
        const value = event.target.value; // This is an ArrayBuffer
        const decoder = new TextDecoder();
        const chunk = decoder.decode(value);
        console.log("Raw BLE chunk received:", JSON.stringify(chunk)); // Log the raw chunk safely
        this.dataBuffer += chunk; // Append the chunk to the buffer

        const SOM_MARKER = "<<START>>";
        const EOM_MARKER = "<<END>>";

        // Check if the buffer contains both SOM and EOM markers
        const somIndex = this.dataBuffer.indexOf(SOM_MARKER);
        const eomIndex = this.dataBuffer.indexOf(EOM_MARKER);

        // Ensure SOM is at the beginning and EOM is present *after* SOM
        if (somIndex === 0 && eomIndex > somIndex) {
            // Extract the potential message content between markers
            const potentialMessage = this.dataBuffer.substring(SOM_MARKER.length, eomIndex);
            console.log("SOM/EOM found. Attempting to parse content:", potentialMessage);

            // Try to parse the extracted content as JSON
            try {
                const jsonData = JSON.parse(potentialMessage);
                // If parsing is successful, we have the complete JSON object
                console.log("Complete JSON received and parsed successfully:", jsonData);
                if (this.onDataReceived) {
                    this.onDataReceived(jsonData);
                }
                // Clear the buffer *after* successfully processing the message
                // Remove the processed message including markers
                this.dataBuffer = this.dataBuffer.substring(eomIndex + EOM_MARKER.length);
                console.log("Buffer cleared. Remaining buffer content:", JSON.stringify(this.dataBuffer));

            } catch (e) {
                // If parsing fails, log the error and the problematic content
                console.error('JSON parsing failed even after finding SOM/EOM:', e);
                console.log('Buffer content on failure (between markers):', JSON.stringify(potentialMessage));
                // Clear the buffer entirely to prevent retrying with potentially corrupted data
                console.warn("Clearing entire buffer due to parsing error.");
                this.dataBuffer = "";
            }
        } else if (eomIndex !== -1 && somIndex > 0) {
            // EOM found but SOM is not at the start - data corruption?
            console.warn("EOM marker found, but SOM marker is not at the beginning. Possible data corruption. Clearing buffer.");
            this.dataBuffer = "";
        } else {
            // Markers not found (or incomplete), wait for more chunks
            console.log("Received chunk, waiting for complete SOM/EOM markers...");
        }
    }

    /**
     * Send data (command) to the Bluetooth device via the command characteristic
     */
    async sendData(data) {
        if (!this.isConnected || !this.commandCharacteristic) {
            console.error('Cannot send data: Not connected or characteristic not available.');
            throw new Error('Not connected to a Bluetooth device or characteristic unavailable');
        }

        // Check if the characteristic supports write operations
        if (!this.commandCharacteristic.properties.write && !this.commandCharacteristic.properties.writeWithoutResponse) {
             console.error('Characteristic does not support write operations.');
             throw new Error('Characteristic does not support write operations.');
        }

        try {
            // Ensure data is a string for the command characteristic
            const message = data.toString();
            console.log('Sending command string:', message);

            // Convert message to ArrayBuffer
            const encoder = new TextEncoder(); // UTF-8 encoding
            const dataArray = encoder.encode(message);

            // Write to the characteristic - Prefer write with response if available, else without response
            if (this.commandCharacteristic.properties.write) {
                // console.log('Using writeValueWithResponse');
                await this.commandCharacteristic.writeValueWithResponse(dataArray);
            } else {
                // console.log('Using writeValueWithoutResponse');
                await this.commandCharacteristic.writeValueWithoutResponse(dataArray);
            }
            console.log('Data sent successfully.');
        } catch (error) {
            console.error('Error sending data:', error);
            throw error;
        }
    }

    /**
     * Send the record command to the Bluetooth device (as expected by the Python script)
     */
    async sendRecordCommand() {
        const command = "record"; // The specific string the Python script expects
        console.log(`Sending '${command}' command...`);
        await this.sendData(command); // Send the raw string
    }
}

// Create global instance
window.bluetoothHandler = new BluetoothHandler(); 