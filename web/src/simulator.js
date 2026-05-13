// Bluetooth Simulator - Test Data Generator
// Simulates Arduino CSV data for testing the web app without hardware

class BluetoothSimulator {
  constructor() {
    this.isSimulating = false;
    this.onDataReceived = null;
    this.onConnectionChanged = null;
    this.currentWeight = 0;
    this.flowRate = 0;
    this.timerSeconds = 0;
  }

  // Start simulating Bluetooth data
  connect() {
    console.log('📡 Bluetooth Simulator: Connected');
    this.isSimulating = true;
    if (this.onConnectionChanged) {
      this.onConnectionChanged(true);
    }
    this.startSimulation();
  }

  // Simulate continuous data stream
  startSimulation() {
    let messageCount = 0;
    
    const interval = setInterval(() => {
      if (!this.isSimulating) {
        clearInterval(interval);
        return;
      }

      // Simulate weight increase over time (like pouring water)
      if (messageCount < 100) {
        this.currentWeight += Math.random() * 2;
        this.flowRate = 0.5 + Math.random() * 1.5; // 0.5-2 g/s
      } else if (messageCount < 150) {
        this.currentWeight += Math.random() * 0.5;
        this.flowRate = 0.1 + Math.random() * 0.3;
      } else {
        this.flowRate = 0;
      }

      // Generate 10 CSV values with slight variations
      const csvData = this.generateCSVData();
      
      // Send data every 100ms (10Hz like real hardware)
      if (this.onDataReceived) {
        this.onDataReceived(csvData);
      }

      messageCount++;

      // Stop after 200 messages (~20 seconds)
      if (messageCount > 200) {
        clearInterval(interval);
      }
    }, 100);
  }

  // Generate CSV string with 10 weight readings
  generateCSVData() {
    const readings = [];
    
    // Add slight noise and variations to each reading
    for (let i = 0; i < 10; i++) {
      const noise = (Math.random() - 0.5) * 0.3; // ±0.15g noise
      const reading = this.currentWeight + noise;
      readings.push(reading.toFixed(1));
    }

    return readings.join(',') + '\n';
  }

  // Simulate Tare command
  handleTare() {
    console.log('🎯 Simulated: TARE command received');
    this.currentWeight = 0;
    if (this.onDataReceived) {
      this.onDataReceived('TARE_DONE\n');
    }
  }

  // Simulate timer start
  handleTimerStart() {
    console.log('⏱️ Simulated: Timer started');
    this.timerSeconds = 0;
    if (this.onDataReceived) {
      this.onDataReceived('TIMER_START\n');
    }
  }

  // Simulate timer alerts
  triggerSimulatedAlerts() {
    setTimeout(() => {
      if (this.onDataReceived) {
        this.onDataReceived('ALERT:30\n');
      }
    }, 30000);

    setTimeout(() => {
      if (this.onDataReceived) {
        this.onDataReceived('ALERT:60\n');
      }
    }, 60000);
  }

  disconnect() {
    console.log('🔌 Bluetooth Simulator: Disconnected');
    this.isSimulating = false;
    if (this.onConnectionChanged) {
      this.onConnectionChanged(false);
    }
  }

  static isSupported() {
    return true; // Simulator always available
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.BluetoothSimulator = BluetoothSimulator;
}

export default BluetoothSimulator;
