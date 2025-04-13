class BluetoothController {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.SERVICE_UUID = '94f39d29-7d6d-437d-973b-fba39e49d4ee';
  }

  async connect() {
    try {
      // Request device with Serial Port Profile UUID
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['94f39d29-7d6d-437d-973b-fba39e49d4ee'] }]
      });
      
      console.log('Device connected:', this.device.name);
      
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService('94f39d29-7d6d-437d-973b-fba39e49d4ee');
      
      // Use a standard GATT characteristic UUID from Serial Port Profile
      this.characteristic = await service.getCharacteristic('00002a3d-0000-1000-8000-00805f9b34fb');
      
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  async toggleRecording() {
    if (!this.characteristic) {
      console.error('Bluetooth not connected');
      return false;
    }
    
    try {
      const command = JSON.stringify({ type: 'record' });
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(command));
      return true;
    } catch (error) {
      console.error('Failed to send recording command:', error);
      return false;
    }
  }

  async saveTranscription(name) {
    if (!this.characteristic) {
      console.error('Bluetooth not connected');
      return false;
    }
    
    try {
      const command = JSON.stringify({ 
        type: 'save', 
        conversationName: name 
      });
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(command));
      return true;
    } catch (error) {
      console.error('Failed to send save command:', error);
      return false;
    }
  }
}

// Export the controller
export const bluetoothController = new BluetoothController(); 