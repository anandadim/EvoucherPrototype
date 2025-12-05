# 🚀 Deployment Guide - Jagoan Hosting

Panduan deploy Sistem Voucher Elektronik ke Jagoan Hosting dengan security yang sudah ditingkatkan.

## 📋 Pre-Deployment Checklist

- [ ] Backup database lokal
- [ ] Export voucher CSV jika ada
- [ ] Generate session secret yang kuat
- [ ] Siapkan password admin baru
- [ ] Test aplikasi di local
- [ ] Compress project files

## 🔧 Step 1: Persiapan Files

### 1.1 Generate Session Secret
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy hasil generate untuk digunakan nanti.

### 1.2 Compress Project
```bash
# Exclude node_modules dan database
zip -r voucher-system.zip . -x "node_modules/*" "*.db" "*.backup" ".env"
```

Atau manual:
- Zip semua file KECUALI: `node_modules/`, `*.db`, `*.backup`, `.env`

## 📤 Step 2: Upload ke Hosting

### 2.1 Via File Manager (cPanel)
1. Login ke cPanel Jagoan Hosting
2. Buka File Manager
3. Navigate ke folder aplikasi (misal: `public_html/voucher`)
4. Upload `voucher-system.zip`
5. Extract zip file
6. Delete zip file setelah extract

### 2.2 Via FTP
1. Connect dengan FileZilla/WinSCP
2. Upload semua files ke folder aplikasi
3. Pastikan struktur folder benar

## ⚙️ Step 3: Setup Node.js App

### 3.1 Di cPanel
1. Cari menu **"Setup Node.js App"** atau **"Node.js Selector"**
2. Klik **"Create Application"**
3. Isi form:
   - **Node.js version:** 18.x atau 20.x (pilih yang terbaru)
   - **Application mode:** Production
   - **Application root:** `/home/username/public_html/voucher`
   - **Application URL:** `voucher.yourdomain.com` atau subdomain
   - **Application startup file:** `server.js`
   - **Environment variables:** (lihat Step 4)

### 3.2 Set Environment Variables

Tambahkan di Node.js App Manager:

```
SESSION_SECRET=<hasil-generate-dari-step-1.1>
ADMIN_DEFAULT_PASSWORD=<password-admin-baru-yang-kuat>
PORT=3000
NODE_ENV=production
HTTPS_ENABLED=true
COOKIE_SECURE=true
```

**⚠️ PENTING:** Jangan gunakan password default `admin123` di production!

## 📦 Step 4: Install Dependencies

### 4.1 Via Terminal (SSH)
```bash
cd /home/username/public_html/voucher
npm install --production
```

### 4.2 Via Node.js App Manager
1. Klik tombol **"Run NPM Install"**
2. Tunggu sampai selesai (bisa 2-5 menit)

## 🔐 Step 5: Setup SSL/HTTPS

### 5.1 Install SSL Certificate
1. Di cPanel, cari **"SSL/TLS Status"**
2. Pilih domain/subdomain aplikasi
3. Klik **"Run AutoSSL"** (gratis dari Let's Encrypt)
4. Tunggu sampai status menjadi "Valid"

### 5.2 Force HTTPS
Aplikasi sudah otomatis redirect HTTP ke HTTPS jika:
- `NODE_ENV=production`
- `HTTPS_ENABLED=true`

## ▶️ Step 6: Start Application

### 6.1 Via Node.js App Manager
1. Klik tombol **"Start"** atau **"Restart"**
2. Tunggu status menjadi **"Running"**
3. Check logs jika ada error

### 6.2 Via Terminal (PM2)
```bash
cd /home/username/public_html/voucher
pm2 start server.js --name voucher-system
pm2 save
pm2 startup
```

## ✅ Step 7: Verifikasi Deployment

### 7.1 Test Akses Website
1. Buka `https://voucher.yourdomain.com`
2. Pastikan halaman utama muncul
3. Test input nomor HP
4. Test preview voucher

### 7.2 Test Admin Login
1. Buka `https://voucher.yourdomain.com/admin-login.html`
2. Login dengan:
   - Email: `admin@voucher.com`
   - Password: (sesuai `ADMIN_DEFAULT_PASSWORD` di env)
3. Pastikan bisa masuk ke dashboard

### 7.3 Test Rate Limiting
1. Coba login dengan password salah 6x
2. Setelah 5x, harus muncul error "Terlalu banyak percobaan login"
3. Tunggu 15 menit atau test dari IP lain

### 7.4 Test HTTPS Redirect
1. Akses `http://voucher.yourdomain.com` (tanpa s)
2. Harus otomatis redirect ke `https://`

## 🔒 Step 8: Post-Deployment Security

### 8.1 Ganti Admin Password
1. Login ke admin panel
2. Buat admin baru dengan password kuat
3. Logout dan login dengan admin baru
4. Hapus admin default (id=1) dari database

### 8.2 Backup Database
```bash
# Via SSH
cd /home/username/public_html/voucher
cp voucher_downloads.db voucher_downloads.db.backup
```

### 8.3 Set File Permissions
```bash
chmod 644 server.js
chmod 600 .env
chmod 600 *.db
chmod 755 public/
```

### 8.4 Monitor Logs
```bash
# Via PM2
pm2 logs voucher-system

# Via Node.js App Manager
Check "Application Logs" section
```

## 🗄️ Step 9: Database Migration (Optional)

Jika ingin migrasi ke MySQL:

### 9.1 Create MySQL Database
1. Di cPanel, buka **"MySQL Databases"**
2. Create database: `username_voucher`
3. Create user: `username_voucheruser`
4. Assign user ke database
5. Set privileges: ALL

### 9.2 Update Connection
Edit `server.js`:
```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'username_voucheruser',
  password: 'password',
  database: 'username_voucher'
});
```

### 9.3 Install mysql2
```bash
npm install mysql2
```

### 9.4 Migrate Schema
Run SQL queries untuk create tables (convert dari SQLite ke MySQL syntax)

## 🔍 Troubleshooting

### Error: "Cannot find module"
```bash
cd /home/username/public_html/voucher
npm install
```

### Error: "Port already in use"
```bash
# Check running processes
pm2 list
# Stop duplicate
pm2 stop voucher-system
pm2 start server.js --name voucher-system
```

### Error: "Permission denied"
```bash
chmod -R 755 /home/username/public_html/voucher
chmod 600 .env
chmod 600 *.db
```

### Error: "Database locked"
```bash
# Stop all instances
pm2 stop all
# Remove lock
rm -f voucher_downloads.db-journal
# Start again
pm2 start server.js --name voucher-system
```

### Rate Limit Terlalu Ketat
Edit `server.js` dan adjust:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increase dari 5 ke 10
});
```

## 📊 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs voucher-system --lines 50
```

### Check Resource Usage
```bash
pm2 monit
```

### Check Database Size
```bash
ls -lh *.db
```

## 🔄 Update Application

### Pull Updates
```bash
cd /home/username/public_html/voucher
# Backup first
cp server.js server.js.backup
# Upload new files via FTP/File Manager
# Restart
pm2 restart voucher-system
```

## 📞 Support

Jika ada masalah:
1. Check application logs
2. Check Node.js App Manager status
3. Check SSL certificate status
4. Contact Jagoan Hosting support
5. Check dokumentasi: `SECURITY-IMPROVEMENTS.md`

---

**Deployment Checklist:**
- [ ] Files uploaded
- [ ] Node.js app configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] SSL certificate installed
- [ ] Application started
- [ ] Website accessible
- [ ] Admin login working
- [ ] Rate limiting tested
- [ ] HTTPS redirect working
- [ ] Admin password changed
- [ ] Database backed up

**Status:** Ready for Production ✅

---

**Version:** 1.1.0  
**Last Updated:** November 2024
