#include "HX711.h"
#include <SoftwareSerial.h>

// 定義 HC-08 腳位
const int BT_RX = 10;
const int BT_TX = 11;
SoftwareSerial bluetooth(BT_RX, BT_TX);

// 定義 HX711 腳位
const int dataPin = 2;
const int clockPin = 3;
HX711 scale;

// 時間與取樣設定
const int interval = 500; // 每 0.5 秒取樣一次
unsigned long lastTime = 0;

// --- 平滑 (滑動平均) 專用變數 ---
const int sampleCount = 2; // 0.5秒 * 2筆 = 1秒的歷史區間
float weightBuffer[sampleCount];
unsigned long timeBuffer[sampleCount];
int bufferIndex = 0;         
bool isBufferFilled = false; 

void setup() {
  Serial.begin(19200);     
  bluetooth.begin(9600);   
  
  scale.begin(dataPin, clockPin);
  scale.set_scale(-434.0); 
  scale.tare(); 
  
  for (int i = 0; i < sampleCount; i++) {
    weightBuffer[i] = 0.0;
    timeBuffer[i] = 0;
  }
  
  lastTime = millis();
  Serial.println("System Ready - HC-08 Connected");
  bluetooth.println("Bluetooth Scale Ready");
}

void loop() {
  // ==========================================
  // 新增：監聽手機傳來的歸零指令
  // ==========================================
  if (bluetooth.available() > 0) {
    char cmd = bluetooth.read(); // 讀取手機傳來的字元
    
    // 如果收到 't', 'T' 或 '0' 就執行歸零
    if (cmd == 't' || cmd == 'T' || cmd == '0') { 
      scale.tare(); // 實體重量歸零
      
      // 同步清空歷史緩衝區，確保下一次計算流速時從零開始
      for (int i = 0; i < sampleCount; i++) {
        weightBuffer[i] = 0.0;
        timeBuffer[i] = 0;
      }
      bufferIndex = 0;
      isBufferFilled = false; 
      
      Serial.println("--- Scale Tared ---");
      bluetooth.println("--- Scale Tared ---");
      
      lastTime = millis(); // 重新計時
    }
  }

  // ==========================================
  // 原本的秤重與流速計算邏輯
  // ==========================================
  unsigned long currentTime = millis();
  
  if (currentTime - lastTime >= interval) {
    if (scale.is_ready()) {
      float currentWeight = scale.get_units(1); 
      
      // 1. 存入最新數據
      weightBuffer[bufferIndex] = currentWeight;
      timeBuffer[bufferIndex] = currentTime;
      
      // 2. 尋找最舊數據
      int oldestIndex = isBufferFilled ? (bufferIndex + 1) % sampleCount : 0;
      
      // 3. 計算變化
      float weightDiff = currentWeight - weightBuffer[oldestIndex];
      float timeDiff = (currentTime - timeBuffer[oldestIndex]) / 1000.0; 
      
      // 4. 計算平滑流速
      float smoothedRate = 0.0;
      if (timeDiff > 0) {
        smoothedRate = weightDiff / timeDiff;
      }

      // ==========================================
      // 你修改的核心：收集滿後顯示，並重置狀態
      // ==========================================
      if (isBufferFilled) {
        String dataOut = "W: " + String(currentWeight, 1) + "g | R: " + String(smoothedRate, 2) + " g/s";
        Serial.println(dataOut);
        bluetooth.println(dataOut);
        
        // 顯示完畢後，將旗標改回 false，等待下一個週期集滿
        isBufferFilled = false;
      }
      
      // 5. 更新索引值
      bufferIndex++;
      if (bufferIndex >= sampleCount) {
        bufferIndex = 0;         
        isBufferFilled = true;   // 走到這裡代表陣列已經填滿
      }
      
      lastTime = currentTime;
    }
  }
}