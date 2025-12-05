# 📚 Dokumentasi Sistem Voucher Elektronik

## 📋 Daftar Isi
1. [Overview Aplikasi](#overview-aplikasi)
2. [Fitur-Fitur](#fitur-fitur)
3. [Struktur Project](#struktur-project)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Instalasi & Setup](#instalasi--setup)
7. [Cara Menjalankan](#cara-menjalankan)
8. [Deployment ke Hosting](#deployment-ke-hosting)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview Aplikasi

Sistem Voucher Elektronik adalah aplikasi web untuk distribusi voucher digital dengan fitur:
- Download voucher otomatis dengan QR Code
- Preview voucher sebelum download
- Admin panel untuk manajemen voucher
- Import voucher dari CSV
- Tracking download dengan IP & User Agent
- Blocking IP address
- Export data ke CSV

**Teknologi yang Digunakan:**
- Backend: Node.js + Express.js
- Database: SQLite3
- Frontend: HTML, CSS, JavaScript (Vanilla)
- QR Code: qrcode library
- Canvas: node-canvas (untuk generate voucher image)

---

## ✨ Fitur-Fitur

### 🎫 Halaman User (Public)
1. **Input Nomor HP**
   - Validasi nomor HP (628xxxxxxxxx)
   - Minimal 11 digit, maksimal 14 digit
   - Hanya menerima angka

2. **Preview Voucher**
   - Otomatis muncul saat nomor HP valid
   - Menampilkan voucher yang akan didapat
   - QR Code preview
   - Info store dan nomor voucher

3. **Download Voucher**
   - Generate voucher dalam format PNG
   - Berisi QR Code, nomor voucher, store, nomor HP
   - Satu IP/device hanya bisa download 1x (kecuali mode development)

4. **Pembatasan Download**
   - Deteksi IP Address
   - Deteksi User Agent (browser fingerprint)
   - Cek kuota voucher tersedia
   - Cek IP yang diblokir

### 🔐 Admin Panel
1. **Dashboard Statistik**
   - Total kuota voucher
   - Jumlah download
   - Voucher tersisa
   - Persentase penggunaan

2. **Manajemen Kuota**
   - Update total kuota
   - Reset kuota terpakai
   - Toggle allow redownload (mode development)

3. **Manajemen Voucher SRP**
   - Upload CSV voucher baru
   - Statistik voucher (total, tersedia, terpakai)
   - Import otomatis ke database

4. **Export Data**
   - Download data download dalam CSV
   - Berisi semua informasi download

5. **Log Aktivitas Admin**
   - Tracking semua aksi admin
   - Login/logout
   - Update settings
   - Block/unblock IP
   - Delete records

6. **Manajemen IP Address**
   - Block IP address
   - Unblock IP address
   - Delete blocked IP record
   - Lihat alasan blocking

7. **Data Download Voucher**
   - Tabel semua download
   - Filter dan search
   - Delete individual record
   - Refresh data

---

## 📁 Struktur Project

```
voucher-system/
├── public/
│   ├── index.html              # Halaman utama user
│   ├── style.css               # Styling halaman user
│   ├── script.js               # Logic halaman user
│   ├── admin-login.html        # Halaman login admin
│   ├── admin.html              # Dashboard admin
│   ├── admin-style.css         # Styling admin panel
│   └── admin-script.js         # Logic admin panel
├── server.js                   # Backend server (Express.js)
├── voucher_downloads.db        # Database SQLite
├── package.json                # Dependencies
└── node_modules/               # Installed packages
```

---

## 🗄️ Database Schema

### Tabel: `downloads`
Menyimpan data setiap download voucher.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID unik download |
| phone_number | TEXT | Nomor HP user (628xxx) |
| ip_address | TEXT | IP address user |
| user_agent | TEXT | Browser fingerprint |
| voucher_code | TEXT | Kode voucher yang digenerate |
| download_time | DATETIME | Waktu download |

### Tabel: `voucher_settings`
Menyimpan pengaturan sistem.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID (selalu 1) |
| total_quota | INTEGER | Total kuota voucher |
| used_quota | INTEGER | Jumlah voucher terpakai |
| allow_redownload | INTEGER | Izinkan download berulang (0/1) |

### Tabel: `admin_users`
Menyimpan data admin.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID admin |
| email | TEXT UNIQUE | Email admin |
| password | TEXT | Password (bcrypt hash) |
| name | TEXT | Nama admin |
| created_at | DATETIME | Waktu dibuat |

**Default Admin:**
- Email: `admin@voucher.com`
- Password: `admin123`

### Tabel: `admin_logs`
Menyimpan log aktivitas admin.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID log |
| admin_id | INTEGER | ID admin yang melakukan aksi |
| action | TEXT | Jenis aksi (LOGIN, UPDATE_QUOTA, dll) |
| details | TEXT | Detail aksi |
| ip_address | TEXT | IP address admin |
| timestamp | DATETIME | Waktu aksi |

### Tabel: `blocked_ips`
Menyimpan IP address yang diblokir.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID record |
| ip_address | TEXT UNIQUE | IP address yang diblokir |
| reason | TEXT | Alasan blocking |
| blocked_by | INTEGER | ID admin yang memblokir |
| blocked_at | DATETIME | Waktu diblokir |
| is_active | INTEGER | Status aktif (0/1) |

### Tabel: `voucher_srp`
Menyimpan data voucher dari SRP.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | ID voucher |
| voucher_number | TEXT UNIQUE | Nomor voucher (IGV-xxxx-xxxxx) |
| store | TEXT | Nama toko |
| status | TEXT | Status voucher |
| created_at | TEXT | Tanggal dibuat |
| is_used | INTEGER | Sudah dipakai (0/1) |
| used_by_download_id | INTEGER | ID download yang memakai |
| used_at | DATETIME | Waktu dipakai |

---

## 🔌 API Endpoints

### Public Endpoints

#### POST `/api/check-download`
Cek apakah user sudah pernah download.

**Request Body:** (none - menggunakan IP & User Agent)

**Response:**
```json
{
  "alreadyDownloaded": false,
  "quotaExceeded": false,
  "blocked": false
}
```

#### POST `/api/preview-voucher`
Preview voucher yang akan didapat (tanpa mark as used).

**Request Body:**
```json
{
  "phoneNumber": "628123456789"
}
```

**Response:**
```json
{
  "voucherNumber": "IGV-0010-PBGUI",
  "store": "019 - TDN Cibinong",
  "phoneNumber": "628123456789"
}
```

#### POST `/api/record-download`
Record download dan mark voucher as used.

**Request Body:**
```json
{
  "phoneNumber": "628123456789"
}
```

**Response:**
```json
{
  "success": true,
  "voucherCode": "VCH-ABC12345",
  "voucherNumber": "IGV-0010-PBGUI",
  "store": "019 - TDN Cibinong",
  "downloadId": 1
}
```

#### GET `/api/generate-voucher/:downloadId`
Generate voucher image (PNG).

**Response:** PNG image file

### Admin Endpoints (Require Authentication)

#### POST `/api/admin/login`
Login admin.

**Request Body:**
```json
{
  "email": "admin@voucher.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": 1,
    "email": "admin@voucher.com",
    "name": "Administrator"
  }
}
```

#### POST `/api/admin/logout`
Logout admin.

#### GET `/api/admin/check-auth`
Cek status autentikasi.

#### GET `/api/admin/stats`
Get statistik download.

**Response:**
```json
{
  "downloads": [...],
  "settings": {
    "total_quota": 100,
    "used_quota": 5,
    "allow_redownload": 0
  }
}
```

#### POST `/api/admin/update-quota`
Update total kuota.

**Request Body:**
```json
{
  "quota": 100
}
```

#### POST `/api/admin/reset-quota`
Reset kuota terpakai ke 0.

#### POST `/api/admin/toggle-redownload`
Toggle allow redownload.

**Request Body:**
```json
{
  "allow": true
}
```

#### GET `/api/admin/export-csv`
Export data download ke CSV.

**Response:** CSV file

#### GET `/api/admin/logs`
Get log aktivitas admin.

#### GET `/api/admin/blocked-ips`
Get daftar IP yang diblokir.

#### POST `/api/admin/block-ip`
Block IP address.

**Request Body:**
```json
{
  "ipAddress": "192.168.1.1",
  "reason": "Spam"
}
```

#### POST `/api/admin/unblock-ip`
Unblock IP address.

**Request Body:**
```json
{
  "ipAddress": "192.168.1.1"
}
```

#### DELETE `/api/admin/blocked-ip/:id`
Delete blocked IP record.

#### DELETE `/api/delete/:id`
Delete download record by ID.

#### DELETE `/api/delete-by-phone/:phone`
Delete download record by phone number.

#### DELETE `/api/delete-by-ip/:ip`
Delete download record by IP address.

#### DELETE `/api/delete-all`
Delete all download records.

---

## 🚀 Instalasi & Setup

### Prerequisites
- Node.js (v14 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone atau Download Project**
   ```bash
   # Jika menggunakan git
   git clone <repository-url>
   cd voucher-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

   Dependencies yang akan terinstall:
   - express
   - sqlite3
   - body-parser
   - @json2csv/plainjs
   - express-session
   - bcrypt
   - canvas
   - qrcode

3. **Verifikasi Instalasi**
   ```bash
   npm list
   ```

---

## ▶️ Cara Menjalankan

### Development Mode

1. **Start Server**
   ```bash
   node server.js
   ```

2. **Akses Aplikasi**
   - Halaman User: `http://localhost:3000`
   - Admin Login: `http://localhost:3000/admin-login.html`
   - Admin Panel: `http://localhost:3000/admin.html`

3. **Login Admin**
   - Email: `admin@voucher.com`
   - Password: `admin123`

### Production Mode

Untuk production, gunakan process manager seperti PM2:

```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start server.js --name voucher-system

# Auto restart on reboot
pm2 startup
pm2 save
```

---

## 🌐 Deployment ke Hosting

### Persiapan untuk Jagoan Hosting

1. **Compress Project**
   - Zip semua file kecuali `node_modules/`
   - Upload ke hosting via File Manager atau FTP

2. **Setup Node.js di cPanel**
   - Buka "Setup Node.js App"
   - Node.js Version: 14.x atau lebih baru
   - Application Mode: Production
   - Application Root: `/home/username/public_html/voucher` (sesuaikan)
   - Application URL: `voucher.domain.com` atau subdomain
   - Application Startup File: `server.js`

3. **Install Dependencies**
   ```bash
   cd /home/username/public_html/voucher
   npm install
   ```

4. **Set Environment Variables** (jika perlu)
   - PORT: 3000 (atau sesuai hosting)
   - NODE_ENV: production

5. **Start Application**
   - Klik "Start" di Node.js App Manager
   - Atau via terminal: `node server.js`

### Migrasi ke MySQL (Untuk Hosting)

Jika hosting tidak support SQLite dengan baik, migrasi ke MySQL:

1. **Install mysql2**
   ```bash
   npm install mysql2
   ```

2. **Create Database di cPanel**
   - Buka MySQL Databases
   - Create database: `username_voucher`
   - Create user dan assign ke database

3. **Update Connection di server.js**
   ```javascript
   const mysql = require('mysql2');
   
   const db = mysql.createConnection({
     host: 'localhost',
     user: 'username_voucheruser',
     password: 'password',
     database: 'username_voucher'
   });
   ```

4. **Convert Schema SQLite ke MySQL**
   - Ubah `INTEGER PRIMARY KEY AUTOINCREMENT` → `INT AUTO_INCREMENT PRIMARY KEY`
   - Ubah `DATETIME DEFAULT CURRENT_TIMESTAMP` → `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'canvas'"

**Solusi:**
```bash
# Windows
npm install --global --production windows-build-tools
npm install canvas

# Linux
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas

# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

### Error: "EADDRINUSE: address already in use"

Port 3000 sudah digunakan.

**Solusi:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Locked

**Solusi:**
- Restart server
- Pastikan tidak ada multiple instance yang running
- Gunakan MySQL untuk production

### Voucher Preview Tidak Muncul

**Solusi:**
- Cek console browser untuk error
- Pastikan QRCode library loaded
- Cek API `/api/preview-voucher` response

### Admin Tidak Bisa Login

**Solusi:**
- Cek database `admin_users` table
- Reset password admin:
  ```javascript
  const bcrypt = require('bcrypt');
  const newPassword = await bcrypt.hash('admin123', 10);
  // Update di database
  ```

### IP Address Selalu 127.0.0.1

**Solusi:**
- Pastikan server accessible dari network
- Cek `x-forwarded-for` header
- Gunakan reverse proxy (nginx) untuk production

---

## 📝 Catatan Penting

### Mode Development
- **Allow Redownload** harus diaktifkan untuk testing
- **WAJIB dinonaktifkan** sebelum deploy ke production

### Security
- Ganti password admin default
- Gunakan HTTPS di production
- Set session secret yang kuat
- Validasi semua input user

### Performance
- Gunakan MySQL/PostgreSQL untuk production
- Enable caching jika traffic tinggi
- Gunakan CDN untuk static files
- Monitor database size

### Backup
- Backup database secara berkala
- Backup file voucher CSV
- Backup konfigurasi server

---

## 📞 Support

Untuk pertanyaan atau issue, hubungi developer atau buat issue di repository.

---

**Versi:** 1.0.0  
**Tanggal:** November 2024  
**Developer:** [Nama Developer]
