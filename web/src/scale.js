// Scale Data Processor
// Handles CSV parsing, smoothing, flow rate calculation

class ScaleDataProcessor {
  constructor() {
    this.weightBuffer = new Array(10).fill(0);
    this.weightHistory = [];
    this.flowRateHistory = [];
    this.tareWeight = 0;
    this.currentWeightSmoothed = 0;
    this.lastUpdateTime = null;
    this.smoothingFactor = 0.6;
  }

  parseCSVData(csvString) {
    try {
      const values = csvString.trim().split(',');
      const parsed = values.map(v => parseFloat(v));
      return parsed.every(v => !isNaN(v)) ? parsed : [];
    } catch {
      return [];
    }
  }

  calculateWeightedMovingAverage(values) {
    if (!values || values.length === 0) return 0;
    let sum = 0;
    let weightSum = 0;
    for (let i = 0; i < values.length; i++) {
      const weight = (i + 1) / values.length;
      sum += values[i] * weight;
      weightSum += weight;
    }
    return sum / weightSum;
  }

  processCSVData(csvString) {
    const values = this.parseCSVData(csvString);
    if (values.length === 0) return 0;
    
    const rawAverage = values.reduce((a, b) => a + b) / values.length;
    const weightedValue = this.calculateWeightedMovingAverage(values);
    
    this.currentWeightSmoothed = 
      this.currentWeightSmoothed * (1 - this.smoothingFactor) +
      weightedValue * this.smoothingFactor;
    
    const netWeight = Math.max(0, this.currentWeightSmoothed - this.tareWeight);
    
    this.weightHistory.push({
      timestamp: Date.now(),
      weight: netWeight,
      raw: rawAverage,
    });
    
    if (this.weightHistory.length > 300) {
      this.weightHistory.shift();
    }
    
    return netWeight;
  }

  updateFlowRate(currentWeight) {
    const now = Date.now();
    
    if (this.lastUpdateTime === null) {
      this.lastUpdateTime = now;
      return 0;
    }
    
    const timeDeltaSeconds = (now - this.lastUpdateTime) / 1000;
    if (timeDeltaSeconds < 0.1) return this.flowRateHistory[this.flowRateHistory.length - 1] || 0;
    
    const lastWeight = this.weightHistory.length > 1 
      ? this.weightHistory[this.weightHistory.length - 2].weight 
      : currentWeight;
    
    const weightDelta = currentWeight - lastWeight;
    const flowRate = timeDeltaSeconds > 0 ? weightDelta / timeDeltaSeconds : 0;
    
    this.flowRateHistory.push(Math.max(0, flowRate));
    if (this.flowRateHistory.length > 60) {
      this.flowRateHistory.shift();
    }
    
    this.lastUpdateTime = now;
    return flowRate;
  }

  tare() {
    if (this.weightHistory.length > 0) {
      this.tareWeight = this.currentWeightSmoothed;
      return this.tareWeight;
    }
    return 0;
  }

  reset() {
    this.weightBuffer = new Array(10).fill(0);
    this.weightHistory = [];
    this.flowRateHistory = [];
    this.tareWeight = 0;
    this.currentWeightSmoothed = 0;
    this.lastUpdateTime = null;
  }

  getFlowRateHistory(count = 60) {
    return this.flowRateHistory.slice(-count);
  }

  getWeightHistory(count = 60) {
    return this.weightHistory.slice(-count);
  }

  getCurrentWeight() {
    return Math.max(0, this.currentWeightSmoothed - this.tareWeight);
  }

  getFlowRateStatistics() {
    if (this.flowRateHistory.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0 };
    }
    
    const values = this.flowRateHistory;
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b) / values.length,
      current: values[values.length - 1],
    };
  }
}

export default ScaleDataProcessor;
