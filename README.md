# meow_scale_app

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the# Weight Scale App Development Plan

## Table of Contents
1. [Hardware Specifications](#hardware-specifications)
2. [Hardware Assembly](#hardware-assembly)
3. [Development Requirements](#development-requirements)
4. [Implementation Checklist](#implementation-checklist)
5. [Technical Architecture](#technical-architecture)

---

## Hardware Specifications

### Components Overview

| Component | Model | Specifications | Purpose |
|-----------|-------|----------------|---------|
| **Microcontroller** | Arduino UNO | 5V, ATmega328P | Main processor for scale logic |
| **Load Cell** | Generic | Max Load: 5kg | Weight measurement sensor |
| **Amplifier** | HX711 | 24-bit ADC | Amplifies load cell signal |
| **Bluetooth Module** | HC-08 | Bluetooth 4.0 (BLE) | Wireless data transmission |

### Connections

```
Load Cell → HX711 Amplifier
HX711 → Arduino UNO
  - DT (Data) → Arduino Pin D3
  - SCK (Clock) → Arduino Pin D2
  - VCC → Arduino 5V
  - GND → Arduino GND

HC-08 Bluetooth Module → Arduino UNO
  - TX → Arduino Pin RX (Pin 0)
  - RX → Arduino Pin TX (Pin 1)
  - VCC → Arduino 5V
  - GND → Arduino GND
```

### Data Protocol

**CSV Format over Bluetooth (10Hz, 100ms intervals)**
```
Format: w1,w2,w3,w4,w5,w6,w7,w8,w9,w10\n
Example: 125.3,125.4,125.5,125.6,125.7,125.8,125.9,126.0,126.1,126.2
```

Each value represents a weight reading in grams, sent every 100ms.

---

## Hardware Assembly

### Scale Assembly Image

> **📸 Insert Hardware Photos Here**
>
> - [ ] Photo 1: Full scale assembly with all components
> - [ ] Photo 2: Load cell mounting detail
> - [ ] Photo 3: Arduino and HX711 wiring
> - [ ] Photo 4: Bluetooth module HC-08 connection
> - [ ] Photo 5: Final assembled prototype

*Place your hardware photos in this section to document the physical setup*

---

## Development Requirements

### Functional Requirements

#### 1. **Tare Function** ✓
- Zero out the current weight reading
- Store baseline weight for future calculations
- Button trigger on mobile/web interface

#### 2. **Brewing Timer** ✓
- Start/Stop/Reset controls
- Real-time countdown display
- Alert system (see requirement #6)

#### 3. **Bluetooth Connection Interface** ✓
- Dedicated connection screen
- Display list of available Bluetooth devices
- Manual device selection and connection
- Connection status indicator
- Disconnect functionality

#### 4. **Weight Data Transmission** ✓
- Read 10 samples per second (10Hz)
- Apply smoothing algorithm (weighted moving average)
- Transmit via HC-08 as CSV format
- Display smoothed weight value with 1 decimal place

#### 5. **Flow Rate Calculation & Visualization** ✓
- Calculate flow rate: Δweight / Δtime (g/s)
- Real-time chart display using Chart.js
- Update frequency: 1 Hz (for smooth visual)
- Color-coded flow rate visualization

#### 6. **Progressive Alert System** ✓
- **First 30 seconds**: Alert at 30s mark
- **After 30s**: Alert at 1min, 2min, 3min, 4min... (every 60s)
- Audio beep notification
- Visual feedback (optional toast/notification)

#### 7. **Responsive Web Interface** ✓
- Mobile-first design (iOS-like feel)
- Glassmorphism UI components
- Dark theme ("Espresso Dark")
- Portrait orientation optimization

---

## Implementation Checklist

### Phase 1: Arduino Firmware Development

#### 1.1 HX711 Load Cell Integration
- [ ] Install HX711 library in Arduino IDE
- [ ] Initialize HX711 with correct pins (DT=3, SCK=2)
- [ ] Calibrate load cell with known weights
- [ ] Implement tare function
- [ ] Read raw values from HX711
- [ ] Convert raw ADC values to grams
- [ ] Test weight accuracy within ±5g tolerance

#### 1.2 Bluetooth Data Transmission
- [ ] Configure HC-08 module (baud rate: 9600)
- [ ] Implement Serial communication
- [ ] Format weight readings as CSV (10 values per packet)
- [ ] Send data at 100ms intervals (10Hz)
- [ ] Test data integrity with serial monitor
- [ ] Verify Bluetooth connection stability

#### 1.3 Timer Logic
- [ ] Implement timer using millis() function
- [ ] Create start/stop/reset commands (receive from app)
- [ ] Track elapsed time
- [ ] Calculate alert triggers (30s, 60s, 120s, etc.)

#### 1.4 Arduino Command Protocol
- [ ] Define commands from app:
  - [ ] `TARE` - Zero the scale
  - [ ] `START` - Start timer
  - [ ] `STOP` - Stop timer
  - [ ] `RESET` - Reset timer
- [ ] Implement command parsing from Bluetooth input
- [ ] Send acknowledgment back to app

---

### Phase 2: Backend Data Processing (Arduino Firmware)

#### 2.1 Smoothing Algorithm
- [ ] Implement weighted moving average filter
- [ ] Apply to 10Hz raw data stream
- [ ] Reduce jitter while maintaining responsiveness
- [ ] Test with sample data

#### 2.2 Flow Rate Calculation
- [ ] Calculate difference in weight over time
- [ ] Convert to g/s format
- [ ] Transmit flow rate data (optional: separate from weight)
- [ ] Test accuracy with known pour rates

---

### Phase 3: Web Application Frontend

#### 3.1 Project Setup
- [ ] Initialize Vite project with Vanilla JavaScript
- [ ] Install Chart.js library
- [ ] Set up folder structure (src/, assets/, index.html)
- [ ] Configure build and dev scripts

#### 3.2 Bluetooth Connection Interface (`src/bluetooth.js`)
- [ ] Implement Web Bluetooth API integration
- [ ] Create device discovery UI
- [ ] Display paired/nearby devices
- [ ] Implement connection/disconnection logic
- [ ] Handle connection errors and timeouts
- [ ] Store device preference (local storage)
- [ ] Auto-reconnect on app reload

#### 3.3 Weight Display & UI (`index.html`, `src/ui.js`)
- [ ] Large, prominent weight display (font-size: 4rem+)
- [ ] Show units (g, kg selector)
- [ ] Display connection status
- [ ] Tare button with visual feedback
- [ ] Timer start/stop/reset buttons
- [ ] Real-time updates (100ms)

#### 3.4 Data Reception & Processing (`src/scale.js`)
- [ ] Parse incoming CSV data from Bluetooth
- [ ] Extract 10 weight values per packet
- [ ] Validate data integrity
- [ ] Update weight display
- [ ] Queue data for chart visualization

#### 3.5 Timer Implementation (`src/timer.js`)
- [ ] Elapsed time display
- [ ] Start/stop/reset state management
- [ ] Alert trigger at 30s, 60s, 120s, 180s, etc.
- [ ] Audio notification system
- [ ] Visual alert indicator

#### 3.6 Flow Rate Chart (`src/chart.js`)
- [ ] Initialize Chart.js line chart
- [ ] Real-time data point addition (1Hz)
- [ ] Y-axis: Flow rate (g/s)
- [ ] X-axis: Time (seconds)
- [ ] Color gradient visualization
- [ ] Maintain 60-second window rolling display
- [ ] Optimize performance for smooth 10Hz updates

#### 3.7 Styling & Theme (`index.css`)
- [ ] Apply "Espresso Dark" theme
  - [ ] Deep charcoal background (#1a1a1a)
  - [ ] Warm browns (#8b7355)
  - [ ] Golden highlights (#d4a574)
- [ ] Implement glassmorphism effects (backdrop-filter: blur)
- [ ] Import Google Fonts (Outfit)
- [ ] Mobile-first responsive design
- [ ] Touch-friendly button sizes (min 44x44px)

#### 3.8 Main Application Logic (`index.html`, `main.js`)
- [ ] Assemble all components
- [ ] Initialize UI on page load
- [ ] Handle app lifecycle (pause/resume)
- [ ] State management for:
  - [ ] Bluetooth connection status
  - [ ] Current weight value
  - [ ] Timer state
  - [ ] Flow rate data
- [ ] Error handling and user feedback

---

### Phase 4: Testing & Verification

#### 4.1 Unit Tests
- [ ] CSV parser validation
  - [ ] Valid format acceptance
  - [ ] Invalid format rejection
  - [ ] Edge cases (negative values, decimal handling)
- [ ] Smoothing algorithm tests
  - [ ] Output stability verification
  - [ ] Responsiveness to weight changes
  - [ ] No data loss
- [ ] Flow rate calculation tests
  - [ ] Accurate g/s conversion
  - [ ] Boundary conditions

#### 4.2 Integration Tests
- [ ] Bluetooth data stream → Display update
- [ ] Timer trigger → Audio alert
- [ ] Tare function → Weight reset
- [ ] Multiple operations in sequence

#### 4.3 Manual Verification
- [ ] [ ] Timer alerts at exactly 30s
- [ ] [ ] Timer alerts at exactly 60s, 120s, 180s, etc.
- [ ] [ ] Tare function zeroes weight correctly
- [ ] [ ] Flow rate chart smooth and responsive
- [ ] [ ] Bluetooth connection stable for 5+ minutes
- [ ] [ ] No audio playback until user initiates
- [ ] [ ] UI responsive on mobile devices
- [ ] [ ] Data accuracy within ±5g

#### 4.4 Performance Testing
- [ ] Chart updates at smooth frame rate (60fps)
- [ ] No lag in weight display updates
- [ ] Bluetooth data reception lag < 100ms
- [ ] Memory usage remains stable over 30-minute session

---

### Phase 5: Documentation & Deployment

#### 5.1 Documentation
- [ ] Arduino firmware README
  - [ ] Calibration instructions
  - [ ] Command protocol specification
- [ ] Web app README
  - [ ] Setup instructions
  - [ ] Browser compatibility notes
  - [ ] User guide
- [ ] API documentation (if applicable)

#### 5.2 Deployment
- [ ] Build web app for production
- [ ] Test on multiple browsers/devices
- [ ] Deploy to hosting (GitHub Pages, Netlify, etc.)
- [ ] Verify Bluetooth works on target devices
- [ ] Performance profiling

---

## Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Arduino UNO (Firmware)          │
│                                         │
│  Load Cell Data → HX711 → Smoothing   │
│                      ↓                 │
│         CSV Formatter → HC-08 Bluetooth│
│           ↑                      ↓     │
│      Command Receiver    [10Hz Stream] │
└─────────────────────────────────────────┘
                    ↕ Bluetooth 4.0
         (100ms intervals, 10 values/s)
                    ↕
┌─────────────────────────────────────────┐
│      Web Application (Browser)          │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Bluetooth Connection Manager    │  │
│  └─────────────────────────────────┘  │
│              ↓                         │
│  ┌─────────────────────────────────┐  │
│  │ CSV Parser → Data Buffer        │  │
│  └─────────────────────────────────┘  │
│              ↓                         │
│  ┌──────────────────┬──────────────┐  │
│  │ Weight Display   │ Flow Rate    │  │
│  │                  │ Chart        │  │
│  └──────────────────┴──────────────┘  │
│              ↓                         │
│  ┌──────────────────┬──────────────┐  │
│  │ Timer Manager    │ Audio Alert  │  │
│  │                  │ System       │  │
│  └──────────────────┴──────────────┘  │
└─────────────────────────────────────────┘
```

### Data Flow

1. **10Hz Raw Data** (Arduino): Load cell → HX711 → Smoothing filter
2. **CSV Packet** (Arduino): 10 smoothed values formatted as `w1,w2,...,w10`
3. **Bluetooth TX** (HC-08): CSV packet sent every 100ms
4. **Web Reception** (Bluetooth API): Receive CSV string
5. **Parsing** (Web): Extract 10 individual weight values
6. **Display Update** (Web): Update weight display every 100ms
7. **Chart Update** (Web): Aggregate to 1Hz for visualization
8. **Flow Rate** (Web): Calculate Δweight/Δtime and display

---

## Success Criteria

- ✅ Scale shows weight within ±5g accuracy
- ✅ Weight display updates smoothly without jitter
- ✅ Timer alerts trigger at exact 30s, 60s, 120s marks
- ✅ Flow rate chart displays real-time data smoothly
- ✅ Bluetooth connection stable and reliable
- ✅ UI responsive on mobile devices
- ✅ App functions continuously for 30+ minutes
- ✅ Audio alerts functional (user-triggered first)

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-09  
**Status**: Development Plan Ready

[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

# Coffee Scale App Implementation Plan

A high-fidelity, premium web application designed to simulate and potentially interface with a coffee scale via Bluetooth. The app features a brewing timer with audio alerts, real-time flow rate monitoring, and smoothed weight displays.

## User Review Required

> [!IMPORTANT]
> **Bluetooth Connectivity**: In a standard browser environment, Web Bluetooth is required. For this prototype, I will implement a **Mock Bluetooth Interface** that allows you to simulate the CSV data stream (10 values per second) to verify the logic.
> **Audio Alerts**: The browser requires a user interaction (like clicking "Start") before it can play sounds.
> **Platform**: This will be built as a responsive web app that feels like a native iOS app.

## Proposed Changes

### Project Setup
- Initialize Vite project with Vanilla JS.
- Use Chart.js for real-time visualization.

### Core Components

#### 1. UI & Design System (`index.css`) [NEW]
- **Theme**: "Espresso Dark" - Deep charcoal, warm browns, and golden highlights.
- **Glassmorphism**: Using backdrop-filter: blur() for overlays and cards.
- **Typography**: Using Google Fonts (Outfit) for a modern, premium feel.

#### 2. Bluetooth & Data Logic (`src/scale.js`) [NEW]
- **CSV Parser**: Handles the w1,w2,...,w10 format received every second.
- **Smoother**: Implements a weighted moving average to prevent "jumpy" numbers.
- **Tare Logic**: Allows zeroing the scale.

#### 3. Brewing Timer (`src/timer.js`) [NEW]
- **State Management**: Tracks elapsed time.
- **Alert System**: Triggers beeps at 30s and every 60s.
- **Flow Rate Calculation**: Derives g/s from the 10Hz data stream.

#### 4. Visualization (`src/chart.js`) [NEW]
- Real-time line chart for flow rate.
- Optimized for performance to ensure smooth 10Hz updates.

#### 5. Main Application (`index.html`, `main.js`) [NEW]
- Assembles the UI.
- Large, readable weight display.
- Integrated controls for Start/Stop/Tare.

## Verification Plan

### Automated Tests
- Unit tests for CSV parsing logic.
- Tests for the smoothing algorithm to ensure "eyes don't hurt".

### Manual Verification
- Verify that the timer triggers sounds at exactly 30s and 60s.
- Test the "Tare" function with mock data.
- Observe the flow rate chart for stability and responsiveness.
