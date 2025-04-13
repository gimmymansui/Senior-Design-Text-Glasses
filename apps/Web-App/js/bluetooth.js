/**
 * Bluetooth Connection Handler
 * Connects to Text Glasses using Web Bluetooth API
 */

class BluetoothHandler {
    constructor() {
        // UUID must match the one in the Python Bluetooth bridge
        this.serviceUUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee";
        this.characteristicUUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee";
        
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        
        // Add event listeners
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
     * Connect to the Bluetooth device
     */
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Bluetooth API is not supported in your browser');
        }
        
        try {
            // Request device selection dialog - Filter by service UUID
            console.log('Requesting Bluetooth device with service UUID:', this.serviceUUID);
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [this.serviceUUID] }
                ],
                // optionalServices: [this.serviceUUID] // Optional if already in filters
            });
            console.log('Device selected:', this.device.name);
            
            // Set up disconnect listener
            this.device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                console.log('Device disconnected');
                if (this.onDisconnected) {
                    this.onDisconnected();
                }
            });
            
            // Connect to GATT server
            console.log('Connecting to GATT server...');
            this.server = await this.device.gatt.connect();
            console.log('Connected to GATT server.');
            
            // Get the service
            console.log('Getting primary service:', this.serviceUUID);
            this.service = await this.server.getPrimaryService(this.serviceUUID);
            console.log('Got service.');
            
            // Get the characteristic
            console.log('Getting characteristic:', this.characteristicUUID);
            this.characteristic = await this.service.getCharacteristic(this.characteristicUUID);
            console.log('Got characteristic.');
            
            // If characteristic supports notifications, start notifications
            if (this.characteristic.properties.notify) {
                console.log('Starting notifications...');
                await this.characteristic.startNotifications();
                this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
                    const value = event.target.value;
                    const decoder = new TextDecoder('utf-8');
                    const data = decoder.decode(value);
                    console.log('Received data:', data);
                    
                    if (this.onDataReceived) {
                        this.onDataReceived(data);
                    }
                });
                console.log('Notifications started.');
            }
            
            this.isConnected = true;
            console.log('Bluetooth connection established.');
            
            if (this.onConnected) {
                this.onConnected();
            }
            
            return true;
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.isConnected = false;
            throw error;
        }
    }
    
    /**
     * Disconnect from the Bluetooth device
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
    }
    
    /**
     * Send data to the Bluetooth device
     */
    async sendData(data) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Not connected to a Bluetooth device');
        }
        
        // Convert message to JSON string if it's an object
        const message = typeof data === 'object' ? JSON.stringify(data) : data;
        
        // Convert message to ArrayBuffer
        const encoder = new TextEncoder();
        const dataArray = encoder.encode(message);
        
        // Write to the characteristic
        await this.characteristic.writeValue(dataArray);
    }
    
    /**
     * Send the record command to the Bluetooth device
     */
    async sendRecordCommand() {
        await this.sendData(JSON.stringify({ type: 'record' }));
    }
}

// Create global instance
window.bluetoothHandler = new BluetoothHandler(); 