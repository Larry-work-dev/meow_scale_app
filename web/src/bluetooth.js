// Bluetooth Connection Manager
// Web Bluetooth API wrapper for hardware integration

class BluetoothManager {
  constructor() {
    this.device = null;
    this.service = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.isConnected = false;
    this.filters = [{ services: [0xFFE0] }];
    this.onDataReceived = null;
    this.onConnectionChanged = null;
    this.onError = null;
  }

  async requestDevice() {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: this.filters,
        optionalServices: [0xFFE0],
      });
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        if (this.onConnectionChanged) this.onConnectionChanged(false);
      });
      return this.device;
    } catch (error) {
      if (this.onError) this.onError('Device selection failed: ' + error.message);
      throw error;
    }
  }

  async connectGATT() {
    try {
      if (!this.device) throw new Error('No device selected');
      const gattServer = await this.device.gatt.connect();
      this.service = await gattServer.getPrimaryService(0xFFE0);
      const characteristics = await this.service.getCharacteristics();
      
      for (let char of characteristics) {
        if (char.uuid === '0000ffe1-0000-1000-8000-00805f9b34fb') {
          this.rxCharacteristic = char;
        }
      }

      if (!this.rxCharacteristic) throw new Error('RX characteristic not found');
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', 
        (event) => this.handleDataReceived(event));
      
      this.isConnected = true;
      if (this.onConnectionChanged) this.onConnectionChanged(true);
      return true;
    } catch (error) {
      this.isConnected = false;
      if (this.onConnectionChanged) this.onConnectionChanged(false);
      if (this.onError) this.onError('Connection failed: ' + error.message);
      throw error;
    }
  }

  async connect() {
    await this.requestDevice();
    await this.connectGATT();
    return true;
  }

  handleDataReceived(event) {
    try {
      const value = event.target.value;
      let receivedString = '';
      for (let i = 0; i < value.byteLength; i++) {
        receivedString += String.fromCharCode(value.getUint8(i));
      }
      if (this.onDataReceived) this.onDataReceived(receivedString);
    } catch (error) {
      if (this.onError) this.onError('Data processing error: ' + error.message);
    }
  }

  async sendCommand(command) {
    try {
      if (!this.isConnected) throw new Error('Bluetooth not connected');
      if (!this.rxCharacteristic) throw new Error('Characteristic not available');
      
      const commandWithNewline = command + '\n';
      const encoder = new TextEncoder();
      const data = encoder.encode(commandWithNewline);
      
      return true;
    } catch (error) {
      if (this.onError) this.onError('Command send failed: ' + error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }
      this.isConnected = false;
      this.device = null;
      this.service = null;
      this.rxCharacteristic = null;
      if (this.onConnectionChanged) this.onConnectionChanged(false);
    } catch (error) {
      if (this.onError) this.onError('Disconnect failed: ' + error.message);
    }
  }

  static isSupported() {
    return navigator.bluetooth !== undefined;
  }
}

export default BluetoothManager;
