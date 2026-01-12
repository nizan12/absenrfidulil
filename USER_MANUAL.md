# 📖 Panduan Penggunaan Sistem Absensi RFID

---

## Mengapa Setiap Role Memiliki Akses Berbeda?

Sistem ini menerapkan **Role-Based Access Control (RBAC)** untuk:

| Alasan | Penjelasan |
|--------|------------|
| **Keamanan Data** | Data sensitif hanya dapat diakses oleh yang berwenang |
| **Tanggung Jawab** | Setiap role memiliki tugas spesifik |
| **Mencegah Kesalahan** | Membatasi risiko perubahan tidak disengaja |
| **Efisiensi Kerja** | Pengguna hanya melihat menu yang relevan |

### Hierarki Akses Role

```
Super Admin (Akses Penuh)
    ↓
Kepala Sekolah (Monitoring & Laporan)
    ↓
Staff Admin (Kelola Data & Perangkat)
    ↓
Operator (Kelola Data Dasar)
    ↓
Guru Piket (Monitoring Harian)
    ↓
Orang Tua (Lihat Kehadiran Anak)
    ↓
Siswa (Tap Kartu)
```

---

## Daftar Isi
1. [Siswa](#1-siswa)
2. [Orang Tua](#2-orang-tua)
3. [Guru Piket](#3-guru-piket)
4. [Operator](#4-operator)
5. [Staff Admin](#5-staff-admin)
6. [Kepala Sekolah](#6-kepala-sekolah)
7. [Super Admin](#7-super-admin)

---

## 1. Siswa

### Cara Absen
1. **Tempelkan kartu RFID** ke perangkat reader
2. Tunggu sampai ada **bunyi beep**
3. Pastikan layar menunjukkan **nama Anda**
4. Selesai!

### Tips
- Tap saat **masuk** dan **pulang**
- Jangan tap terlalu cepat berturut-turut
- Jika kartu tidak terbaca, lapor ke guru piket

---

## 2. Orang Tua

### Melihat Kehadiran Anak (Tanpa Login)
1. Buka **halaman utama** website
2. Ketik **nama anak** di kotak pencarian
3. Klik **nama anak** dari daftar yang muncul
4. Lihat **status kehadiran** dan riwayat

### Notifikasi WhatsApp
Anda akan menerima notifikasi otomatis saat anak masuk/pulang sekolah.

---

## 3. Guru Piket

### Login
1. Buka website → Klik **Masuk**
2. Masukkan email dan password
3. Klik **Login**

### Menu yang Dapat Diakses
| Menu | Fungsi |
|------|--------|
| Dashboard | Statistik kehadiran hari ini |
| Live Monitor | Pantau kehadiran real-time |
| Rekapitulasi | Lihat rekap kehadiran |

### Input Manual RFID
1. Di halaman utama, klik tombol **Manual**
2. Ketik **nomor RFID** atau scan USB reader
3. Tekan **Enter**

---

## 4. Operator

### Menu yang Dapat Diakses
| Menu | Fungsi |
|------|--------|
| Dashboard | Statistik kehadiran |
| Data Siswa | Kelola data siswa |
| Manajemen Kelas | Kelola kelas |
| Orang Tua | Kelola data orang tua |

### Menambah Siswa Baru
1. Menu **Data Siswa** → **Tambah Siswa**
2. Isi: Nama, NIS, Kelas, Foto (opsional)
3. **Scan kartu RFID** untuk input nomor
4. Klik **Simpan**

---

## 5. Staff Admin

### Menu yang Dapat Diakses
| Menu | Fungsi |
|------|--------|
| Dashboard | Statistik kehadiran |
| Data Siswa | Kelola data siswa |
| Data Guru | Kelola data guru |
| Manajemen Kelas | Kelola kelas |
| Kategori | Kelola kategori siswa |
| Orang Tua | Kelola data orang tua |
| Manajemen Alat | Kelola perangkat RFID |
| Lokasi | Kelola lokasi absensi |
| Live Monitor | Pantau real-time |
| Rekapitulasi | Rekap kehadiran |
| Notifikasi WA | Log notifikasi |

### Menambah Perangkat RFID
1. Menu **Manajemen Alat** → **Tambah**
2. Isi: Nama, Kode Perangkat, Lokasi
3. Klik **Simpan**

---

## 6. Kepala Sekolah

### Menu yang Dapat Diakses
| Menu | Fungsi |
|------|--------|
| Dashboard | Statistik keseluruhan |
| Live Monitor | Pantau kehadiran real-time |
| Rekapitulasi | Rekap kehadiran lengkap |

### Melihat Rekapitulasi
1. Menu **Rekapitulasi**
2. Pilih **tanggal** (dari - sampai)
3. Filter berdasarkan **kelas** (opsional)
4. Klik **Cari**

---

## 7. Super Admin

### Akses Penuh ke Semua Menu

| Menu | Fungsi |
|------|--------|
| Dashboard | Statistik keseluruhan |
| Data Siswa | Kelola semua data siswa |
| Data Guru | Kelola semua data guru |
| Manajemen Kelas | Kelola kelas |
| Kategori | Kelola kategori siswa |
| Orang Tua | Kelola data orang tua |
| **Data Admin** | Kelola akun pengguna/admin |
| Manajemen Alat | Kelola perangkat RFID |
| Lokasi | Kelola lokasi absensi |
| Live Monitor | Pantau kehadiran real-time |
| Rekapitulasi | Rekap kehadiran |
| Notifikasi WA | Log notifikasi WhatsApp |
| **Pengaturan** | Konfigurasi sistem |

### Menambah Pengguna/Admin Baru
1. Menu **Data Admin** → **Tambah**
2. Isi: Nama, Email, Password
3. Pilih **Role**
4. Klik **Simpan**

### Pengaturan Sistem
1. Menu **Pengaturan**
2. Konfigurasi: Info Institusi, API Key, WhatsApp

---

## Tips Umum

### Kartu RFID
- Tempelkan kartu **dekat** dengan reader (1-3 cm)
- Tunggu **bunyi beep** sebagai konfirmasi

### Troubleshooting
| Masalah | Solusi |
|---------|--------|
| Kartu tidak terbaca | Tempelkan ulang |
| Website error | Refresh (Ctrl + F5) |
| Lupa password | Hubungi Super Admin |

---

*Panduan Sistem Absensi RFID - SMAIT Ulil Albab*
