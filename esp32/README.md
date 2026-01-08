# ESP32 RFID Attendance System

Kode ini untuk ESP32 dengan modul RFID MFRC522 yang terhubung ke sistem absensi.

## Hardware yang Dibutuhkan

1. **ESP32 DevKit** (ESP32-WROOM-32 atau yang sejenis)
2. **MFRC522 RFID Reader Module**
3. **Buzzer** (opsional, untuk feedback suara)
4. **Kartu/Tag RFID 13.56MHz** (Mifare Classic)

## Wiring

| MFRC522 | ESP32 |
|---------|-------|
| SDA     | GPIO 5 |
| SCK     | GPIO 18 |
| MOSI    | GPIO 23 |
| MISO    | GPIO 19 |
| RST     | GPIO 22 |
| 3.3V    | 3.3V |
| GND     | GND |

**Opsional:**
- Buzzer → GPIO 4
- LED → GPIO 2 (built-in LED)

## Library yang Dibutuhkan

Install library berikut di Arduino IDE:
1. **MFRC522** by GithubCommunity
2. **ArduinoJson** by Benoit Blanchon

## Setup

1. Buka `esp32_rfid_attendance.ino` di Arduino IDE
2. Edit konfigurasi di bagian atas file:

```cpp
// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // Nama WiFi
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // Password WiFi

// Server Settings
const char* SERVER_URL = "http://192.168.1.100:8000/api/tap";  // IP server Laravel
const char* API_KEY = "YOUR_API_KEY_FROM_SETTINGS";            // API Key dari Pengaturan
const char* DEVICE_CODE = "ESP32-001";                          // Kode device (harus sama dengan di database)
```

3. Pilih Board: **ESP32 Dev Module**
4. Upload ke ESP32

## Mendapatkan API Key

1. Login ke dashboard admin
2. Buka menu **Pengaturan**
3. Di bagian **Keamanan ESP32**, klik tombol **Generate**
4. Simpan pengaturan
5. Salin API Key tersebut ke kode ESP32

## Mendaftarkan Device

1. Login ke dashboard admin
2. Buka menu **ESP Devices**
3. Tambah device baru dengan:
   - **Device Code**: Sama dengan yang di kode ESP32 (contoh: `ESP32-001`)
   - **Nama**: Nama device (contoh: `Pintu Utama`)
   - **Lokasi**: Pilih lokasi
   - **Status**: Aktif

## Cara Kerja

1. ESP32 membaca kartu RFID yang ditempel
2. Mengirim UID kartu ke server
3. Server mengecek apakah kartu terdaftar (siswa/guru)
4. Mencatat kehadiran (masuk/keluar)
5. ESP32 memberikan feedback suara:
   - **2 beep pendek**: Sukses
   - **1 beep panjang rendah**: Error
   - **3 beep cepat**: Kartu tidak terdaftar
   - **2 beep rendah**: Tap terlalu cepat

## Troubleshooting

### MFRC522 tidak terdeteksi
- Periksa koneksi kabel SPI
- Pastikan menggunakan 3.3V (bukan 5V!)
- Coba ganti kabel jumper

### WiFi tidak connect
- Periksa SSID dan password
- Pastikan ESP32 dalam jangkauan WiFi
- Coba restart ESP32

### Server tidak merespons
- Periksa IP server sudah benar
- Pastikan Laravel server berjalan
- Cek API Key sudah sama
- Pastikan device code sudah terdaftar

## Serial Monitor

Buka Serial Monitor (115200 baud) untuk melihat debug output:
```
=================================
  ESP32 RFID Attendance System
=================================

MFRC522 Firmware Version: 0x92
Connecting to WiFi: MyWiFi
....
WiFi Connected!
IP Address: 192.168.1.50

>> Ready! Tempelkan kartu RFID...

Kartu terdeteksi: A1B2C3D4
>> Mengirim ke server...
   Payload: {"device_code":"ESP32-001","rfid_uid":"A1B2C3D4","api_key":"xxx"}
   Response (200): {"success":true,"message":"Selamat datang, Ahmad!"}
   >> SUKSES: Selamat datang, Ahmad!
```
