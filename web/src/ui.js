// UI Manager
// DOM manipulation and user feedback

class UIManager {
  constructor() {
    this.weightDisplay = document.getElementById('weight-value');
    this.timerDisplay = document.getElementById('timer-display');
    this.flowRateDisplay = document.getElementById('flow-rate-value');
    this.statusText = document.getElementById('status-text');
    this.statusIndicator = document.getElementById('status-indicator');
    this.connectBtn = document.getElementById('connect-btn');
    this.tareBtn = document.getElementById('tare-btn');
    this.timerToggleBtn = document.getElementById('timer-toggle-btn');
    this.timerResetBtn = document.getElementById('timer-reset-btn');
    this.unitToggle = document.getElementById('unit-toggle');
    this.bluetoothModal = document.getElementById('bluetooth-modal');
    this.deviceList = document.getElementById('device-list');
    this.scanAgainBtn = document.getElementById('scan-again-btn');
    this.notificationContainer = document.getElementById('notification-container');
    
    this.currentUnit = 'g';
    
    this.onConnectClick = null;
    this.onTareClick = null;
    this.onTimerToggleClick = null;
    this.onTimerResetClick = null;
    this.onUnitChange = null;
    this.onScanAgainClick = null;
    this.onDeviceSelect = null;
  }

  initialize() {
    this.connectBtn.addEventListener('click', () => {
      if (this.onConnectClick) this.onConnectClick();
    });
    
    this.tareBtn.addEventListener('click', () => {
      if (this.onTareClick) this.onTareClick();
    });
    
    this.timerToggleBtn.addEventListener('click', () => {
      if (this.onTimerToggleClick) this.onTimerToggleClick();
    });
    
    this.timerResetBtn.addEventListener('click', () => {
      if (this.onTimerResetClick) this.onTimerResetClick();
    });
    
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentUnit = e.target.dataset.unit;
        if (this.onUnitChange) this.onUnitChange(this.currentUnit);
      });
    });
    
    this.scanAgainBtn.addEventListener('click', () => {
      if (this.onScanAgainClick) this.onScanAgainClick();
    });
  }

  updateWeightDisplay(weight, unit = 'g') {
    let displayValue = weight;
    if (unit === 'kg') {
      displayValue = (weight / 1000).toFixed(2);
    } else {
      displayValue = weight.toFixed(1);
    }
    
    if (this.weightDisplay) {
      this.weightDisplay.textContent = displayValue;
    }
  }

  updateTimerDisplay(formattedTime) {
    if (this.timerDisplay) {
      this.timerDisplay.textContent = formattedTime;
    }
  }

  updateFlowRateDisplay(flowRate) {
    if (this.flowRateDisplay) {
      this.flowRateDisplay.textContent = (flowRate || 0).toFixed(2);
    }
  }

  updateConnectionStatus(connected, deviceName = 'Unknown') {
    if (this.statusIndicator) {
      this.statusIndicator.className = 'status-indicator ' + 
        (connected ? 'connected' : 'disconnected');
    }
    
    if (this.statusText) {
      this.statusText.textContent = connected 
        ? `Connected: ${deviceName}`
        : 'Disconnected';
    }
    
    if (this.connectBtn) {
      this.connectBtn.textContent = connected ? 'Disconnect' : 'Connect';
    }
  }

  updateTimerButtonState(state) {
    if (!this.timerToggleBtn) return;
    
    if (state === 'running') {
      this.timerToggleBtn.innerHTML = '⏸ Pause';
    } else if (state === 'paused') {
      this.timerToggleBtn.innerHTML = '▶ Resume';
    } else {
      this.timerToggleBtn.innerHTML = '▶ Start';
    }
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.animation = 'slideUp 0.3s ease-out';
    
    if (this.notificationContainer) {
      this.notificationContainer.appendChild(notification);
    }
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  showBluetoothModal(devices) {
    this.deviceList.innerHTML = '';
    devices.forEach((device, index) => {
      const item = document.createElement('div');
      item.className = 'device-item';
      item.textContent = device.name || `Device ${index}`;
      item.addEventListener('click', () => {
        if (this.onDeviceSelect) this.onDeviceSelect(device);
        this.closeBluetoothModal();
      });
      this.deviceList.appendChild(item);
    });
    
    if (this.bluetoothModal) {
      this.bluetoothModal.style.display = 'flex';
    }
  }

  closeBluetoothModal() {
    if (this.bluetoothModal) {
      this.bluetoothModal.style.display = 'none';
    }
  }

  setControlsDisabled(disabled) {
    [this.tareBtn, this.timerToggleBtn, this.timerResetBtn]
      .forEach(btn => {
        if (btn) btn.disabled = disabled;
      });
  }

  vibrate(duration = 100) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  showError(message) {
    this.showNotification(message, 'error', 5000);
  }

  showSuccess(message) {
    this.showNotification(message, 'success', 3000);
  }
}

export default UIManager;
