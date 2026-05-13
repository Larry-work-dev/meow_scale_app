// Brewing Timer
// Manages brew timing with progressive alerts

class BrewingTimer {
  constructor() {
    this.running = false;
    this.paused = false;
    this.startTime = null;
    this.pauseTime = null;
    this.elapsedMs = 0;
    this.alertedTimes = new Set();
    this.onTick = null;
    this.onAlert = null;
    this.onStateChange = null;
    this.audioContext = null;
  }

  start() {
    if (!this.running) {
      this.startTime = Date.now() - this.elapsedMs;
      this.running = true;
      this.paused = false;
      this.alertedTimes.clear();
      if (this.onStateChange) {
        this.onStateChange({ running: true, paused: false });
      }
      this.update();
    }
  }

  pause() {
    if (this.running && !this.paused) {
      this.paused = true;
      this.pauseTime = Date.now();
      if (this.onStateChange) {
        this.onStateChange({ running: true, paused: true });
      }
    }
  }

  resume() {
    if (this.running && this.paused) {
      this.startTime += (Date.now() - this.pauseTime);
      this.paused = false;
      if (this.onStateChange) {
        this.onStateChange({ running: true, paused: false });
      }
      this.update();
    }
  }

  stop() {
    this.running = false;
    this.paused = false;
    if (this.onStateChange) {
      this.onStateChange({ running: false, paused: false });
    }
  }

  reset() {
    this.running = false;
    this.paused = false;
    this.elapsedMs = 0;
    this.alertedTimes.clear();
    if (this.onStateChange) {
      this.onStateChange({ running: false, paused: false });
    }
  }

  update() {
    if (this.running && !this.paused) {
      this.elapsedMs = Date.now() - this.startTime;
      const seconds = Math.floor(this.elapsedMs / 1000);
      
      this.checkAlerts(seconds);
      
      if (this.onTick) {
        this.onTick(this.elapsedMs);
      }
      
      requestAnimationFrame(() => this.update());
    }
  }

  checkAlerts(seconds) {
    if (seconds === 30 && !this.alertedTimes.has(30)) {
      this.alertedTimes.add(30);
      this.triggerAlert(30);
    } else if (seconds > 30 && seconds % 60 === 0 && !this.alertedTimes.has(seconds)) {
      this.alertedTimes.add(seconds);
      this.triggerAlert(seconds);
    }
  }

  triggerAlert(seconds) {
    this.playAlertSound();
    if (this.onAlert) {
      this.onAlert({
        time: seconds,
        message: seconds === 30 ? 'First alert' : `Alert at ${seconds}s`,
      });
    }
  }

  playAlertSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio unavailable');
    }
  }

  static formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  getElapsed() {
    return this.elapsedMs;
  }

  getFormattedTime() {
    return BrewingTimer.formatTime(this.elapsedMs);
  }
}

export default BrewingTimer;
