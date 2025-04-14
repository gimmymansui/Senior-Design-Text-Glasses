/**
 * Bluetooth Connection Handler
 * Connects to Text Glasses using Web Bluetooth API
 * Updated to match the backend GATT server setup
 */

class BluetoothHandler {
    constructor() {
        // UUIDs based on the Python BLE gateway script
        this.targetDeviceName = "TextGlasses"; // Keep this or change if your device name differs
        this.gattServiceUUID = "5f47a3c0-4f1a-4a69-9f6d-1b2c3d4e5f6a"; // SERVICE_UUID from Python script
        this.commandCharacteristicUUID = "7d8e1b3c-6a7b-4e8f-9a0b-1c2d3e4f5a6b"; // COMMAND_CHARACTERISTIC_UUID from Python script
        
        this.device = null;
        this.server = null;
        this.service = null;
        this.commandCharacteristic = null; // Renamed for clarity
        this.isConnected = false;
        
        // Add event listeners
        this.onConnected = null;
        this.onDisconnected = null;
        this.onDataReceived = null; // Callback for data received via notifications
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
            // Request device selection dialog - Filter by NAME
            // Backend also advertises the gattServiceUUID via advertise_ble, 
            // so filtering by service could be an alternative: { services: [this.gattServiceUUID] }
            console.log(`Requesting Bluetooth device advertising service "${this.gattServiceUUID}"...`);
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [this.gattServiceUUID] } // Filter by advertised service UUID
                ],
                optionalServices: [ 
                    this.gattServiceUUID, // Crucial: Need access to the GATT service
                    'generic_access'     // Often needed for name/appearance
                ]
            });
            console.log('Device selected:', this.device.name);
            
            // Set up disconnect listener
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
            
            // Connect to GATT server
            console.log('Connecting to GATT server...');
            this.server = await this.device.gatt.connect();
            console.log('Connected to GATT server.');
            
            // Get the primary service defined in the backend's GATT setup
            console.log('Getting primary service:', this.gattServiceUUID);
            this.service = await this.server.getPrimaryService(this.gattServiceUUID);
            console.log('Got service.');
            
            // Get the specific command characteristic defined in the Python script
            console.log('Getting command characteristic:', this.commandCharacteristicUUID);
            this.commandCharacteristic = await this.service.getCharacteristic(this.commandCharacteristicUUID);
            console.log('Got characteristic.');
            
            // Set up notifications if the characteristic supports it (unlikely for a write-only command char, but check anyway)
            if (this.commandCharacteristic.properties.notify) {
                console.log('Starting notifications (if supported)...');
                await this.commandCharacteristic.startNotifications();
                this.commandCharacteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged.bind(this));
                console.log('Notifications started.');
            } else {
                 console.log('Characteristic does not support notifications.');
            }
            
            this.isConnected = true;
            console.log('Bluetooth connection established and characteristic obtained.');
            
            // Trigger connected callback
            if (this.onConnected) {
                this.onConnected();
            }
            
            return true; // Indicate success
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.cleanupConnection(); // Ensure cleanup on error
            throw error; // Re-throw the error for calling code to handle
        }
    }

    // Handles characteristic value changes (Notifications)
    handleCharacteristicValueChanged(event) {
        const value = event.target.value; // This is a DataView
        const decoder = new TextDecoder('utf-8');
        let dataString;
        try {
            dataString = decoder.decode(value);
            console.log('Received data:', dataString);

            // Attempt to parse as JSON (as backend sends JSON)
            try {
                 const jsonData = JSON.parse(dataString);
                 if (this.onDataReceived) {
                    this.onDataReceived(jsonData); // Pass parsed JSON
                 }
            } catch (jsonError) {
                 console.warn('Received data is not valid JSON:', dataString);
                 // Optionally pass raw string if needed
                 // if (this.onDataReceived) {
                 //    this.onDataReceived(dataString);
                 // }
            }
        } catch (decodeError) {
            console.error('Error decoding received data:', decodeError, value);
        }
    }

    // Handles disconnection event
    handleDisconnect() {
        if (!this.isConnected) return; // Avoid duplicate calls
        console.log('Device disconnected (gattserverdisconnected event).');
        this.isConnected = false;
        // Don't null out device/server here, allows for potential reconnection attempts
        // this.characteristic = null; 
        // this.service = null;
        if (this.onDisconnected) {
            this.onDisconnected();
        }
    }

    // Cleans up connection variables
    cleanupConnection() {
        if (this.commandCharacteristic) {
            try {
                // Remove listener if added
                if (this.commandCharacteristic.properties.notify) {
                    this.commandCharacteristic.removeEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged.bind(this));
                    // console.log('Stopping notifications...');
                    // await this.commandCharacteristic.stopNotifications(); // Avoid if causing issues
                }
            } catch (e) { console.warn('Error during characteristic cleanup:', e); }
        }

        if (this.device && this.device.gatt.connected) {
            console.log('Attempting to disconnect GATT server during cleanup...');
            this.device.gatt.disconnect();
        }
        
        this.device = null;
        this.server = null;
        this.service = null;
        this.commandCharacteristic = null; // Clear the characteristic
        this.isConnected = false;
        console.log('Connection cleaned up.');
    }
    
    /**
     * Disconnect from the Bluetooth device
     */
    async disconnect() {
        console.log('Disconnect requested.');
        if (this.device && this.device.gatt.connected) {
            console.log('Disconnecting from GATT server...');
            this.device.gatt.disconnect(); // This should trigger the 'gattserverdisconnected' event
        } else {
             console.log('Already disconnected or no device connected.');
             this.cleanupConnection(); // Ensure state is clean
        }
        // Note: State clearing primarily happens in handleDisconnect & cleanupConnection
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