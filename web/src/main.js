// Coffee Scale Application
// Main entry point and module orchestration

import BluetoothManager from './bluetooth.js';
import BluetoothSimulator from './simulator.js';
import ScaleDataProcessor from './scale.js';
import BrewingTimer from './timer.js';
import FlowRateChart from './chart.js';
import UIManager from './ui.js';

class CoffeeScaleApp {
  constructor() {
    this.bluetoothManager = new BluetoothManager();
    this.simulator = null;
    this.dataProcessor = new ScaleDataProcessor();
    this.timer = new BrewingTimer();
    this.chart = null;
    this.ui = new UIManager();
    this.isConnected = false;
    this.isSimulatorMode = false;
    this.activeDevice = null; // Can be bluetoothManager or simulator
  }

  initialize() {
    this.chart = new FlowRateChart(document.getElementById('flow-chart'));
    this.ui.initialize();
    
    this.setupBluetoothCallbacks();
    this.setupDataProcessorCallbacks();
    this.setupTimerCallbacks();
    this.setupUICallbacks();
    
    if (!BluetoothManager.isSupported()) {
      this.ui.showError('Web Bluetooth is not supported in this browser');
    }
  }

  setupBluetoothCallbacks() {
    this.bluetoothManager.onDataReceived = (data) => this.handleBluetoothData(data);
    this.bluetoothManager.onConnectionChanged = (connected) => this.handleConnectionChange(connected);
    this.bluetoothManager.onError = (error) => this.ui.showError(error);
  }

  setupSimulatorCallbacks() {
    this.simulator.onDataReceived = (data) => this.handleBluetoothData(data);
    this.simulator.onConnectionChanged = (connected) => this.handleConnectionChange(connected);
    this.simulator.onError = (error) => this.ui.showError(error);
  }

  setupDataProcessorCallbacks() {
    // Data processor doesn't use callbacks, but we process its output in handleBluetoothData
  }

  setupTimerCallbacks() {
    this.timer.onTick = (elapsedMs) => {
      this.ui.updateTimerDisplay(BrewingTimer.formatTime(elapsedMs));
    };
    
    this.timer.onAlert = (alert) => {
      this.ui.vibrate(200);
      this.ui.showNotification(`Alert: ${alert.message}`, 'warning', 3000);
    };
    
    this.timer.onStateChange = (state) => {
      const stateMap = { 'true,false': 'running', 'true,true': 'paused', 'false,false': 'stopped' };
      const key = `${state.running},${state.paused}`;
      const displayState = key === 'true,false' ? 'running' : key === 'true,true' ? 'paused' : 'stopped';
      this.ui.updateTimerButtonState(displayState);
    };
  }

  setupUICallbacks() {
    this.ui.onConnectClick = () => this.handleConnectClick();
    this.ui.onTareClick = () => this.handleTareClick();
    this.ui.onTimerToggleClick = () => this.handleTimerToggle();
    this.ui.onTimerResetClick = () => this.handleTimerReset();
    this.ui.onUnitChange = (unit) => this.handleUnitChange(unit);
    this.ui.onScanAgainClick = () => this.connect();
    
    // Add simulator button handler
    const simulatorBtn = document.getElementById('simulator-btn');
    if (simulatorBtn) {
      simulatorBtn.addEventListener('click', () => this.handleSimulatorClick());
    }
  }

  handleBluetoothData(data) {
    const lines = data.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      if (line.startsWith('ALERT:')) {
        const seconds = parseInt(line.substring(6));
        this.ui.showNotification(`Alert at ${seconds}s`, 'warning');
      } else if (line.includes(',')) {
        const weight = this.dataProcessor.processCSVData(line);
        const flowRate = this.dataProcessor.updateFlowRate(weight);
        
        this.ui.updateWeightDisplay(weight, this.ui.currentUnit);
        this.ui.updateFlowRateDisplay(flowRate);
        this.chart.addDataPoint(flowRate);
      }
    }
  }

  handleConnectionChange(connected) {
    this.isConnected = connected;
    
    let deviceName = 'Scale';
    if (this.isSimulatorMode) {
      deviceName = 'Simulator';
    } else {
      deviceName = this.bluetoothManager.getDeviceInfo()?.name || 'Scale';
    }
    
    this.ui.updateConnectionStatus(connected, deviceName);
    
    if (connected) {
      this.ui.showSuccess('Connected to ' + deviceName);
      this.ui.setControlsDisabled(false);
    } else {
      this.ui.showError('Disconnected from scale');
      this.ui.setControlsDisabled(true);
      this.timer.stop();
    }
  }

  handleSimulatorClick() {
    try {
      if (this.isConnected && this.isSimulatorMode) {
        // Disconnect from simulator
        this.simulator.disconnect();
        this.isSimulatorMode = false;
        this.isConnected = false;
      } else if (!this.isConnected) {
        // Connect to simulator
        this.dataProcessor.reset();
        this.simulator = new BluetoothSimulator();
        this.setupSimulatorCallbacks();
        this.isSimulatorMode = true;
        this.simulator.connect();
      }
    } catch (error) {
      this.ui.showError('Simulator error: ' + error.message);
    }
  }

  async handleConnectClick() {
    try {
      if (this.isConnected) {
        if (this.isSimulatorMode) {
          this.simulator.disconnect();
        } else {
          await this.bluetoothManager.disconnect();
        }
      } else {
        await this.connect();
      }
    } catch (error) {
      this.ui.showError('Connection failed: ' + error.message);
    }
  }

  async connect() {
    try {
      this.ui.showNotification('Searching for scale...', 'info');
      await this.bluetoothManager.connect();
    } catch (error) {
      this.ui.showError('Device selection failed: ' + error.message);
    }
  }

  handleTareClick() {
    this.dataProcessor.tare();
    this.ui.updateWeightDisplay(0, this.ui.currentUnit);
    this.ui.showNotification('Scale tared', 'success');
  }

  handleTimerToggle() {
    if (this.timer.running) {
      if (this.timer.paused) {
        this.timer.resume();
      } else {
        this.timer.pause();
      }
    } else {
      this.timer.start();
    }
  }

  handleTimerReset() {
    this.timer.reset();
    this.ui.updateTimerDisplay('00:00');
    this.ui.showNotification('Timer reset', 'info');
  }

  handleUnitChange(unit) {
    const currentWeight = this.dataProcessor.getCurrentWeight();
    this.ui.updateWeightDisplay(currentWeight, unit);
  }

  start() {
    this.initialize();
    this.ui.updateConnectionStatus(false, 'Not Connected');
    this.ui.updateTimerDisplay('00:00');
    this.ui.showNotification('Coffee Scale Ready', 'info');
  }

  stop() {
    this.timer.stop();
    if (this.isConnected) {
      if (this.isSimulatorMode) {
        this.simulator?.disconnect();
      } else {
        this.bluetoothManager.disconnect();
      }
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

// App initialization
let app = null;

document.addEventListener('DOMContentLoaded', () => {
  app = new CoffeeScaleApp();
  app.start();
  window.coffeeScaleApp = app;
});

window.addEventListener('beforeunload', () => {
  if (app) app.stop();
});

export default CoffeeScaleApp;
