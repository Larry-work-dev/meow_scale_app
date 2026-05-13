// Flow Rate Chart
// Real-time visualization with Chart.js

class FlowRateChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.chart = null;
    this.maxDataPoints = 60;
    this.initialize();
  }

  initialize() {
    const ctx = this.canvas.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Flow Rate (g/s)',
            data: [],
            borderColor: '#d4a574',
            backgroundColor: 'rgba(212, 165, 116, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#d4a574',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          filler: {
            propagate: true,
          },
        },
        scales: {
          x: {
            display: false,
            grid: {
              display: false,
            },
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(212, 165, 116, 0.1)',
              drawBorder: false,
            },
            ticks: {
              color: '#999',
              font: {
                size: 11,
              },
            },
            beginAtZero: true,
            max: 10,
          },
        },
      },
    });
  }

  addDataPoint(flowRate) {
    if (!this.chart) return;
    
    const data = this.chart.data.datasets[0].data;
    data.push(Math.max(0, flowRate));
    
    if (data.length > this.maxDataPoints) {
      data.shift();
      this.chart.data.labels.shift();
    }
    
    this.chart.data.labels.push('');
    this.updateChart();
  }

  updateChart() {
    if (this.chart) {
      this.chart.update('none');
    }
  }

  clear() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [];
    this.chart.data.labels = [];
    this.updateChart();
  }

  getStatistics() {
    const data = this.chart?.data.datasets[0].data || [];
    if (data.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0 };
    }
    
    return {
      min: Math.min(...data),
      max: Math.max(...data),
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      current: data[data.length - 1],
    };
  }

  exportData() {
    return {
      labels: this.chart?.data.labels || [],
      data: this.chart?.data.datasets[0].data || [],
    };
  }

  setMaxDataPoints(count) {
    this.maxDataPoints = count;
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

export default FlowRateChart;
