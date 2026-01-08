/*
 * ESP32 RFID Attendance System (Simplified)
 * 
 * Hardware:
 * - ESP32 DevKit
 * - MFRC522 RFID Reader
 * 
 * Wiring MFRC522 to ESP32:
 * - SDA  -> GPIO 5
 * - SCK  -> GPIO 18
 * - MOSI -> GPIO 23
 * - MISO -> GPIO 19
 * - RST  -> GPIO 27
 * - 3.3V -> 3.3V
 * - GND  -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ==================== KONFIGURASI - SESUAIKAN! ====================

// WiFi Settings
const char* WIFI_SSID = "Redmi";          // Ganti dengan nama WiFi
const char* WIFI_PASSWORD = "2324252627";  // Ganti dengan password WiFi

// Server Settings
const char* SERVER_URL = "http://127.0.0.1:8000/api/tap";  // Ganti dengan IP server Laravel
const char* API_KEY = "Opkzo68p2o1tRZpM4LG1HkKEsFVJikDf";            // Salin dari halaman Pengaturan
const char* DEVICE_CODE = "ESP32-GERBANG";                          // Kode unik device ini

// ===================================================================

// MFRC522 Pin Configuration
#define SS_PIN    5   // SDA
#define RST_PIN   27  // Reset

// Objects
MFRC522 rfid(SS_PIN, RST_PIN);

// Variables
unsigned long lastTapTime = 0;
String lastUID = "";
const unsigned long TAP_COOLDOWN = 3000;  // 3 second cooldown between same card

// Mode: 1 = Baca UID saja, 2 = Mode Absensi
int currentMode = 0;

void setup() {
    Serial.begin(115200);
    Serial.println("\n=================================");
    Serial.println("  ESP32 RFID Attendance System");
    Serial.println("=================================\n");

    // Initialize SPI and RFID
    SPI.begin();
    rfid.PCD_Init();
    
    // Check RFID reader
    byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
    if (version == 0x00 || version == 0xFF) {
        Serial.println("ERROR: MFRC522 tidak terdeteksi!");
        Serial.println("Periksa koneksi kabel.");
        while (true) {
            delay(1000);
        }
    }
    Serial.print("MFRC522 Firmware Version: 0x");
    Serial.println(version, HEX);

    // Show menu
    showMenu();
}

void showMenu() {
    Serial.println("\n=========== PILIH MODE ===========");
    Serial.println("1. Baca Nomor RFID (untuk daftar kartu baru)");
    Serial.println("2. Mode Absensi (kirim ke server)");
    Serial.println("===================================");
    Serial.println("Ketik 1 atau 2, lalu tekan Enter:");
    
    currentMode = 0;
}

void loop() {
    // Check for serial input to change mode
    if (Serial.available() > 0) {
        char input = Serial.read();
        
        if (input == '1') {
            currentMode = 1;
            Serial.println("\n>> MODE: Baca Nomor RFID");
            Serial.println(">> Tempelkan kartu untuk melihat UID...\n");
        } 
        else if (input == '2') {
            currentMode = 2;
            Serial.println("\n>> MODE: Absensi");
            Serial.println(">> Menyambungkan ke WiFi...");
            connectWiFi();
            Serial.println("\n>> Tempelkan kartu untuk absensi...\n");
        }
        else if (input == 'm' || input == 'M') {
            showMenu();
        }
    }

    // If no mode selected, wait
    if (currentMode == 0) {
        return;
    }

    // Look for new cards
    if (!rfid.PICC_IsNewCardPresent()) {
        return;
    }

    // Select card
    if (!rfid.PICC_ReadCardSerial()) {
        return;
    }

    // Get UID
    String uid = getUID();
    
    if (currentMode == 1) {
        // Mode 1: Just read and display UID
        Serial.println("=====================================");
        Serial.print(">> UID Kartu: ");
        Serial.println(uid);
        Serial.println("=====================================");
        Serial.println("(Salin UID di atas untuk mendaftarkan siswa/guru)");
        Serial.println("Ketik 'm' untuk kembali ke menu\n");
    }
    else if (currentMode == 2) {
        // Mode 2: Attendance mode
        Serial.print("Kartu terdeteksi: ");
        Serial.println(uid);

        // Check cooldown (prevent double tap)
        if (uid == lastUID && (millis() - lastTapTime) < TAP_COOLDOWN) {
            Serial.println(">> Cooldown - tunggu sebentar");
            rfid.PICC_HaltA();
            rfid.PCD_StopCrypto1();
            return;
        }

        // Update last tap
        lastUID = uid;
        lastTapTime = millis();

        // Send to server
        sendToServer(uid);
    }

    // Halt card
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    
    delay(500);  // Small delay to prevent rapid reads
}

String getUID() {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) {
            uid += "0";
        }
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    return uid;
}

void sendToServer(String uid) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println(">> WiFi tidak terhubung!");
        return;
    }

    Serial.println(">> Mengirim ke server...");

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Accept", "application/json");
    http.setTimeout(10000);  // 10 second timeout

    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["device_code"] = DEVICE_CODE;
    doc["rfid_uid"] = uid;
    doc["api_key"] = API_KEY;

    String payload;
    serializeJson(doc, payload);

    Serial.print("   Payload: ");
    Serial.println(payload);

    // Send POST request
    int httpCode = http.POST(payload);

    if (httpCode > 0) {
        String response = http.getString();
        Serial.print("   Response (");
        Serial.print(httpCode);
        Serial.print("): ");
        Serial.println(response);

        // Parse response
        StaticJsonDocument<512> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);

        if (!error) {
            bool success = responseDoc["success"] | false;
            const char* message = responseDoc["message"] | "Unknown";

            if (success) {
                Serial.println("   >> SUKSES: " + String(message));
            } else {
                Serial.println("   >> GAGAL: " + String(message));
            }
        } else {
            Serial.println("   >> Error parsing response");
        }
    } else {
        Serial.print("   >> HTTP Error: ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
    Serial.println();
}

void connectWiFi() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi Connection FAILED!");
        Serial.println("Check SSID and password.");
    }
}
