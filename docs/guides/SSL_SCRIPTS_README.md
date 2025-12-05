# SSL Troubleshooting Scripts

Kumpulan script untuk troubleshoot dan fix SSL di server voucher.tdn.id

## 📋 Daftar Script

### 1. diagnose-ssl.sh ⭐ (MULAI DARI SINI)
**Master script untuk diagnosa lengkap SSL**

```bash
chmod +x diagnose-ssl.sh
./diagnose-ssl.sh
```

Script ini akan:
- Cek apakah certificate ada dan valid
- Cek apakah Nginx config benar
- Cek apakah HTTPS accessible
- Cek apakah auto-renewal aktif
- Memberikan rekomendasi fix

### 2. check-nginx-ssl.sh
**Cek detail konfigurasi SSL di Nginx**

```bash
chmod +x check-nginx-ssl.sh
./check-nginx-ssl.sh
```

Gunakan jika:
- Ingin lihat detail config Nginx
- Ingin tahu certificate mana yang digunakan
- Troubleshoot kenapa HTTPS tidak berfungsi

### 3. enable-nginx-ssl.sh
**Aktifkan SSL di Nginx (jika belum aktif)**

```bash
chmod +x enable-nginx-ssl.sh
./enable-nginx-ssl.sh
```

Script ini akan:
- Backup config Nginx yang ada
- Buat config baru dengan SSL enabled
- Setup redirect HTTP → HTTPS
- Test dan reload Nginx

### 4. fix-auto-renewal.sh
**Fix auto-renewal certbot**

```bash
chmod +x fix-auto-renewal.sh
./fix-auto-renewal.sh
```

Gunakan jika:
- Auto-renewal gagal (error port 80 in use)
- Ingin pastikan certificate auto-renew sebelum expired

### 5. check-ssl.sh
**Cek status certificate dan auto-renewal**

```bash
chmod +x check-ssl.sh
./check-ssl.sh
```

Untuk cek:
- Certificate apa yang terinstall
- Kapan expired
- Status auto-renewal

### 6. check-domain.sh
**Cek domain dan DNS configuration**

```bash
chmod +x check-domain.sh
./check-domain.sh
```

Untuk cek:
- Domain apa yang dikonfigurasi
- Apakah DNS pointing ke server
- Status certificate untuk setiap domain

### 7. renew-ssl.sh
**Manual renew certificate (jika expired)**

```bash
chmod +x renew-ssl.sh
./renew-ssl.sh
```

Gunakan jika certificate sudah expired dan perlu renew manual.

### 8. install-ssl.sh
**Install certificate baru untuk domain baru**

```bash
chmod +x install-ssl.sh
./install-ssl.sh
```

Gunakan jika:
- Belum pernah install certificate
- Ingin install certificate untuk domain baru

## 🚀 Quick Start

### Jika SSL Tidak Aktif:

```bash
# 1. Diagnosa masalah
chmod +x diagnose-ssl.sh
./diagnose-ssl.sh

# 2. Jika Nginx belum pakai SSL, aktifkan
chmod +x enable-nginx-ssl.sh
./enable-nginx-ssl.sh

# 3. Fix auto-renewal
chmod +x fix-auto-renewal.sh
./fix-auto-renewal.sh

# 4. Test lagi
./diagnose-ssl.sh
```

### Jika Certificate Expired:

```bash
# 1. Renew certificate
chmod +x renew-ssl.sh
./renew-ssl.sh

# 2. Fix auto-renewal agar tidak terjadi lagi
chmod +x fix-auto-renewal.sh
./fix-auto-renewal.sh
```

## 📊 Berdasarkan Log Anda

Dari log yang Anda share:
- ✅ Certificate VALID (expired 14 Feb 2026, masih 79 hari)
- ✅ Domain: voucher.tdn.id
- ✅ Nginx config OK
- ✅ Port 443 listening
- ❌ Auto-renewal gagal (port 80 in use)

### Rekomendasi:

1. **Cek apakah Nginx sudah menggunakan SSL:**
   ```bash
   ./check-nginx-ssl.sh
   ```

2. **Jika Nginx belum pakai SSL, aktifkan:**
   ```bash
   ./enable-nginx-ssl.sh
   ```

3. **Fix auto-renewal:**
   ```bash
   ./fix-auto-renewal.sh
   ```

4. **Verify semuanya OK:**
   ```bash
   ./diagnose-ssl.sh
   ```

## 🔍 Troubleshooting

### HTTPS tidak bisa diakses padahal certificate valid

**Kemungkinan:** Nginx tidak menggunakan certificate

**Solusi:**
```bash
./check-nginx-ssl.sh  # Cek config
./enable-nginx-ssl.sh # Fix config
```

### Auto-renewal gagal

**Kemungkinan:** Port 80 digunakan Nginx saat certbot coba renew

**Solusi:**
```bash
./fix-auto-renewal.sh
```

### Certificate expired

**Solusi:**
```bash
./renew-ssl.sh
./fix-auto-renewal.sh  # Agar tidak terjadi lagi
```

## 📝 Notes

- Semua script harus dijalankan di server (bukan di local)
- Beberapa command butuh sudo, pastikan user punya akses sudo
- Backup config otomatis dibuat sebelum perubahan
- Jika ada error, cek log di `/var/log/nginx/` dan `/var/log/letsencrypt/`

## 🆘 Jika Masih Bermasalah

1. Jalankan semua diagnostic script dan simpan outputnya:
   ```bash
   ./diagnose-ssl.sh > diagnose.txt
   ./check-nginx-ssl.sh > nginx-check.txt
   ./check-ssl.sh > ssl-check.txt
   ```

2. Cek log error:
   ```bash
   sudo tail -100 /var/log/nginx/error.log > nginx-error.txt
   sudo tail -100 /var/log/letsencrypt/letsencrypt.log > certbot-error.txt
   ```

3. Share file-file tersebut untuk analisa lebih lanjut
