/*
 * ================================================
 * Coffee Weight Scale - Arduino UNO Controller
 * ================================================
 * 
 * Hardware Configuration:
 * - Arduino UNO with ATmega328P processor
 * - HX711 Load Cell Amplifier (24-bit ADC)
 * - HC-08 Bluetooth 4.0 Module
 * - 5kg Precision Load Cell
 * 
 * Author: Larry
 * Date: 2026-05-09
 * Version: 1.0
 */

#include <HX711.h>
#include <Wire.h>

// ============================================================================
// PIN DEFINITIONS
// ============================================================================

const int HX711_DT_PIN = 3;   // Data pin for HX711
const int HX711_SCK_PIN = 2;  // Clock pin for HX711

#define BLUETOOTH_BAUD_RATE 9600

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

HX711 scale;

float calibration_factor = 450.0;  // Typical range: 420-650

#define BUFFER_SIZE 10
float weight_buffer[BUFFER_SIZE] = {0};
int buffer_index = 0;

float current_weight = 0;
float tare_weight = 0;
bool is_tared = false;

unsigned long timer_start_time = 0;
unsigned long timer_elapsed_ms = 0;
bool timer_running = false;
bool last_alert_sent = false;

unsigned long last_send_time = 0;
unsigned long send_interval = 100; // 100ms = 10Hz

String incoming_command = "";

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(BLUETOOTH_BAUD_RATE);
  
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);
  delay(1000);
  
  scale.set_scale(calibration_factor);
  scale.tare();
  
  for (int i = 0; i < BUFFER_SIZE; i++) {
    weight_buffer[i] = 0;
  }
  
  Serial.println("=== Coffee Scale Ready ===");
  Serial.println("Commands: TARE, START, STOP, RESET");
  delay(500);
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Process commands from Bluetooth
  if (Serial.available() > 0) {
    handle_bluetooth_command();
  }
  
  // Send weight data at 10Hz interval
  unsigned long current_time = millis();
  if (current_time - last_send_time >= send_interval) {
    send_weight_data();
    last_send_time = current_time;
  }
  
  // Update timer and check for alerts
  if (timer_running) {
    update_timer();
  }
  
  // Small delay to prevent watchdog reset
  delay(5);
}

// ============================================================================
// WEIGHT DATA TRANSMISSION
// ============================================================================

void send_weight_data() {
  // Read 10 raw sensor values and generate CSV format
  // Format: w1,w2,w3,w4,w5,w6,w7,w8,w9,w10\n
  float raw_values[10];
  for (int i = 0; i < 10; i++) {
    if (scale.is_ready()) {
      raw_values[i] = scale.get_units() - tare_weight;
      
      // Constrain to reasonable range
      if (raw_values[i] < 0) raw_values[i] = 0;
      if (raw_values[i] > 5000) raw_values[i] = 5000;
    }
    delayMicroseconds(900);
  }
  
  // Build CSV string
  String csv_data = "";
  for (int i = 0; i < 10; i++) {
    csv_data += String(raw_values[i], 1);
    if (i < 9) csv_data += ",";
  }
  csv_data += "\n";
  
  current_weight = raw_values[9];
  
  // Send via Bluetooth
  Serial.print(csv_data);
}

// ============================================================================
// BLUETOOTH COMMAND HANDLING
// ============================================================================

void handle_bluetooth_command() {
  // Handle commands from mobile app
  // Supported Commands: TARE, START, STOP, RESET, CALIB:<value>
  
  char inbyte = Serial.read();
  
  if (inbyte == '\n' || inbyte == '\r') {
    incoming_command.trim();
    
    if (incoming_command.length() > 0) {
      if (incoming_command == "TARE") {
        perform_tare();
      } 
      else if (incoming_command == "START") {
        start_timer();
      } 
      else if (incoming_command == "STOP") {
        stop_timer();
      } 
      else if (incoming_command == "RESET") {
        reset_timer();
      }
      else if (incoming_command.startsWith("CALIB:")) {
        String calib_value = incoming_command.substring(6);
        calibration_factor = calib_value.toFloat();
        scale.set_scale(calibration_factor);
        Serial.println("CALIB_OK");
      }
      else {
        Serial.println("CMD_UNKNOWN");
      }
    }
    
    incoming_command = "";
  } else {
    incoming_command += inbyte;
  }
}

// ============================================================================
// TARE FUNCTION
// ============================================================================

void perform_tare() {
  // Zero the scale and store baseline
  
  if (scale.is_ready()) {
    tare_weight = scale.get_units();
    current_weight = 0;
    is_tared = true;
    
    Serial.println("TARE_DONE");
  } else {
    Serial.println("TARE_FAIL");
  }
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

void start_timer() {
  // Start the brewing timer
  if (!timer_running) {
    timer_start_time = millis();
    timer_running = true;
    last_alert_sent = false;
    Serial.println("TIMER_START");
  }
}

void stop_timer() {
  // Stop the brewing timer
  if (timer_running) {
    timer_running = false;
    Serial.println("TIMER_STOP");
  }
}

void reset_timer() {
  // Reset the brewing timer
  timer_running = false;
  timer_elapsed_ms = 0;
  last_alert_sent = false;
  Serial.println("TIMER_RESET");
}

void update_timer() {
  // Update timer and check for alert conditions
  // Alert Rules:
  // - First 30 seconds: Alert at 30s
  // - After: Alert at 60s, 120s, 180s, etc. (every 60s)
  
  timer_elapsed_ms = millis() - timer_start_time;
  unsigned long elapsed_seconds = timer_elapsed_ms / 1000;
  
  if (elapsed_seconds == 30 && !last_alert_sent) {
    trigger_alert(30);
    last_alert_sent = true;
  }
  else if (elapsed_seconds > 30 && elapsed_seconds % 60 == 0 && !last_alert_sent) {
    trigger_alert(elapsed_seconds);
    last_alert_sent = true;
  }
  else if (elapsed_seconds % 60 != 0) {
    last_alert_sent = false;
  }
}

void trigger_alert(unsigned long seconds) {
  // Trigger an alert
  Serial.print("ALERT:");
  Serial.println(seconds);
}

// ============================================================================
// CALIBRATION HELPER FUNCTIONS
// ============================================================================

void calibrate_scale() {
  // Calibrate scale - call from Serial Monitor in IDE
  // Steps:
  // 1. Place known weight object on scale
  // 2. Enter in Serial Monitor: CALIB:<factor>
  // 3. Adjust until correct weight displays
  
  if (scale.is_ready()) {
    long reading = scale.read();
    Serial.print("HX711 reading: ");
    Serial.println(reading);
  } else {
    Serial.println("HX711 not found.");
  }
}

// ============================================================================
// BLUETOOTH COMMAND PROTOCOL DOCUMENTATION
// ============================================================================

// Commands (App → Arduino):
// - TARE\n           : Zero the scale
// - START\n          : Start timer
// - STOP\n           : Stop timer
// - RESET\n          : Reset timer
// - CALIB:450.0\n    : Set calibration factor

// Data Format (Arduino → App):
// Weight Data (sent every 100ms):
// Format: w1,w2,w3,w4,w5,w6,w7,w8,w9,w10\n
// Status Messages:
// - TARE_DONE        : Tare successful
// - TARE_FAIL        : Tare failed
// - TIMER_START      : Timer started
// - TIMER_STOP       : Timer stopped
// - TIMER_RESET      : Timer reset
// - ALERT:30         : Alert at 30 seconds
// - ALERT:60         : Alert at 60 seconds
// - CALIB_OK         : Calibration set
// - CMD_UNKNOWN      : Unknown command

// Debugging:
// - View output in Serial Monitor
// - Baud Rate: 9600

// ============================================================================
// LIBRARY REQUIREMENTS
// ============================================================================

// Required Libraries:
// 1. HX711 by Bogdan Necula (https://github.com/bogde/HX711)
//    Installation: Arduino IDE > Sketch > Include Library > Manage Libraries
//    Search for "HX711" and click Install
//
// 2. HC-08 uses standard Serial (no additional library needed)
