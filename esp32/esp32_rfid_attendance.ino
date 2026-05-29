/*
 * ESP32 RFID Attendance System
 *
 * Hardware:
 * - ESP32 DevKit
 * - MFRC522 RFID Reader
 * - LCD I2C 16x2 (0x27)
 * - Buzzer
 *
 * Wiring MFRC522 to ESP32:
 * - SDA  -> GPIO 5
 * - SCK  -> GPIO 18
 * - MOSI -> GPIO 23
 * - MISO -> GPIO 19
 * - RST  -> GPIO 27
 * - 3.3V -> 3.3V
 * - GND  -> GND
 *
 * Wiring LCD I2C:
 * - SDA  -> GPIO 21
 * - SCL  -> GPIO 22
 * - VCC  -> 5V
 * - GND  -> GND
 *
 * Wiring Buzzer:
 * - Signal -> GPIO 4
 * - GND    -> GND
 */

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>

// ==================== KONFIGURASI ====================
const char *WIFI_SSID = "Redmi4x";
const char *WIFI_PASSWORD = "lopolo9090**";

const char *SERVER_URL = "https://absenulilalbab.com/api/tap";
const char *API_KEY = "Opkzo68p2o1tRZpM4LG1HkKEsFVJikDf";
const char *DEVICE_CODE = "ESP32-GERBANG";

// RFID
#define SS_PIN 5
#define RST_PIN 27

// BUZZER
#define BUZZER_PIN 4
// =====================================================

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Mode: 1 = Baca UID saja, 2 = Mode Absensi
int currentMode = 2;

// =====================================================
// BUZZER
// =====================================================

void beep(int duration) {

  digitalWrite(BUZZER_PIN, HIGH);

  delay(duration);

  digitalWrite(BUZZER_PIN, LOW);
}

void beepSuccess() {

  beep(100);

  delay(100);

  beep(100);
}

void beepError() { beep(500); }

// =====================================================
// RUNNING TEXT
// =====================================================

void runningText(String text, int row, int speedDelay) {

  String padding = "                ";

  String fullText = padding + text + padding;

  for (int i = 0; i < fullText.length() - 15; i++) {

    lcd.setCursor(0, row);

    lcd.print(fullText.substring(i, i + 16));

    delay(speedDelay);
  }
}

// =====================================================
// AUTO WRAP TEXT
// =====================================================

void printWrapped(String line1, String line2 = "") {

  lcd.clear();

  // BARIS PERTAMA
  lcd.setCursor(0, 0);

  if (line1.length() > 16) {

    lcd.print(line1.substring(0, 16));
  }

  else {

    lcd.print(line1);
  }

  // BARIS KEDUA
  lcd.setCursor(0, 1);

  if (line2.length() > 16) {

    lcd.print(line2.substring(0, 16));
  }

  else {

    lcd.print(line2);
  }
}

// =====================================================
// GET UID
// =====================================================

String getUID() {

  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {

    uid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");

    uid += String(rfid.uid.uidByte[i], HEX);
  }

  uid.toUpperCase();

  return uid;
}

// =====================================================
// WIFI
// =====================================================

void connectWiFi() {

  Serial.print(F("Menghubungkan WiFi..."));

  printWrapped("CONNECT WIFI", "PLEASE WAIT");

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 20) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println(F("\n✅ WIFI CONNECTED"));

    printWrapped("WIFI CONNECTED");

    beepSuccess();

    delay(1000);
  }

  else {

    Serial.println(F("\n❌ WIFI FAILED"));

    printWrapped("WIFI FAILED");

    beepError();

    delay(1000);
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(2000);

  // BUZZER
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);

  // LCD
  Wire.begin(21, 22);

  lcd.init();

  lcd.backlight();

  printWrapped("DIAGNOSTIK...");

  beep(100);

  // RFID
  SPI.begin();

  rfid.PCD_Init();

  // RFID CHECK
  Serial.println(F("\n--- DIAGNOSTIK RFID ---"));

  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);

  Serial.print(F("Firmware RFID: 0x"));

  Serial.println(v, HEX);

  if (v == 0x00 || v == 0xFF) {

    Serial.println(F("❌ RFID ERROR"));

    printWrapped("RFID ERROR", "CEK KABEL");

    beepError();

    while (true) {

      delay(1000);
    }
  }

  else {

    Serial.println(F("✅ RFID READY"));

    printWrapped("RFID READY");

    beepSuccess();

    delay(1000);
  }

  // LANGSUNG MODE ABSENSI
  Serial.println(F("\n>> MODE PRESENSI (AUTO)"));
  Serial.println(F(">> Ketik '1' di Serial untuk mode baca UID"));
  Serial.println(F(">> Ketik '2' untuk kembali ke mode absensi\n"));

  connectWiFi();

  printWrapped("TEMPELKAN", "KARTU RFID");
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // CEK SERIAL UNTUK GANTI MODE (MAINTENANCE)
  if (Serial.available() > 0) {

    char input = Serial.read();

    if (input == '1') {

      currentMode = 1;

      printWrapped("MODE UID");

      beep(100);

      Serial.println(F(">> MODE UID (ketik '2' untuk kembali)"));
    }

    else if (input == '2') {

      currentMode = 2;

      printWrapped("MODE PRESENSI");

      beep(100);

      if (WiFi.status() != WL_CONNECTED) {

        connectWiFi();
      }

      printWrapped("TEMPELKAN", "KARTU RFID");

      Serial.println(F(">> MODE PRESENSI"));
    }
  }

  // CEK KARTU
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {

    return;
  }

  String uid = getUID();

  beep(80);

  // ================= TEST UID =================

  if (currentMode == 1) {

    Serial.println("UID: " + uid);

    printWrapped("UID", uid);

    delay(2000);

    printWrapped("MODE UID");
  }

  // ================= PRESENSI =================

  else if (currentMode == 2) {

    printWrapped("SCANNING...", uid);

    sendToServer(uid);
  }

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();
}

// =====================================================
// SEND TO SERVER
// =====================================================

void sendToServer(String uid) {

  if (WiFi.status() != WL_CONNECTED) {

    connectWiFi();
  }

  HTTPClient http;

  http.begin(SERVER_URL);

  http.addHeader("Content-Type", "application/json");

  http.addHeader("Accept", "application/json");

  StaticJsonDocument<512> doc;

  doc["device_code"] = DEVICE_CODE;
  doc["rfid_uid"] = uid;
  doc["api_key"] = API_KEY;

  String payload;

  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  String response = http.getString();

  Serial.printf("Response [%d]: %s\n", httpCode, response.c_str());

  // ================= JSON =================

  StaticJsonDocument<512> responseDoc;

  deserializeJson(responseDoc, response);

  String nama = responseDoc["nama"] | "UNKNOWN";

  String pesan = responseDoc["pesan"] | "ABSEN";

  // ================= BERHASIL =================

  if (httpCode == 200 || httpCode == 201) {

    beepSuccess();

    lcd.clear();

    // BARIS PERTAMA
    lcd.setCursor(0, 0);

    lcd.print(pesan);

    // BARIS KEDUA
    if (nama.length() <= 16) {

      lcd.setCursor(0, 1);

      lcd.print(nama);

      delay(1200);
    }

    else {

      runningText(nama, 1, 100);
    }
  }

  // ================= ERROR CUSTOM =================

  else if (httpCode == 404 || httpCode == 429) {

    beepError();

    printWrapped(pesan, nama);

    delay(1800);
  }

  // ================= ERROR UMUM =================

  else {

    beepError();

    printWrapped("GAGAL", "CODE: " + String(httpCode));

    delay(1500);
  }

  // ================= READY =================

  printWrapped("TEMPELKAN", "KARTU RFID");

  http.end();
}
