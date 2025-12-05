# Deployment Guide: UTM Tracking Implementation

## 📋 Overview

Implementasi UTM tracking untuk melacak sumber download voucher (RT01, RT02, dll).

## 🎯 Fitur yang Ditambahkan

1. ✅ Capture UTM parameter dari URL
2. ✅ Save UTM source ke database
3. ✅ Display UTM di admin panel
4. ✅ Export CSV include UTM data
5. ✅ Backward compatible (user tanpa UTM tetap bisa download)

## 📁 Files yang Diubah

```
✅ server.js                    - Backend: Save UTM ke database
✅ public/script.js             - Frontend: Capture UTM dari URL
✅ public/admin.html            - Admin: Tambah kolom UTM
✅ public/admin-script.js       - Admin: Display UTM data
✅ migrate-add-utm.sql          - Database migration script
```

## 🚀 Deployment Steps

### Step 1: Backup

```bash
# SSH ke live server
ssh user@103.164.223.83

# Masuk ke folder project
cd /var/www/voucher-app  # sesuaikan path

# Backup database
cp voucher_downloads.db voucher_downloads.db.backup_$(date +%Y%m%d_%H%M%S)

# Backup code (jika tidak pakai git)
tar -czf backup_code_$(date +%Y%m%d_%H%M%S).tar.gz server.js public/
```

### Step 2: Upload Files

**Opsi A: Via Git (RECOMMENDED)**

```bash
# Di local
git add server.js public/script.js public/admin.html public/admin-script.js migrate-add-utm.sql
git commit -m "Add UTM tracking for download sources"
git push origin main

# Di server
cd /var/www/voucher-app
git pull origin main
```

**Opsi B: Via SCP**

```bash
# Di local
scp server.js user@103.164.223.83:/var/www/voucher-app/
scp public/script.js user@103.164.223.83:/var/www/voucher-app/public/
scp public/admin.html user@103.164.223.83:/var/www/voucher-app/public/
scp public/admin-script.js user@103.164.223.83:/var/www/voucher-app/public/
scp migrate-add-utm.sql user@103.164.223.83:/var/www/voucher-app/
```

**Opsi C: Via FTP/SFTP**

Upload files menggunakan FileZilla atau FTP client lainnya.

### Step 3: Database Migration

```bash
# Di server
cd /var/www/voucher-app

# Run migration
sqlite3 voucher_downloads.db < migrate-add-utm.sql

# Verify column added
sqlite3 voucher_downloads.db "PRAGMA table_info(downloads);"

# Should see: utm_source | TEXT | 0 | 'direct' | 0
```

**Atau manual:**

```bash
sqlite3 voucher_downloads.db

# Di sqlite prompt:
ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';

# Verify:
PRAGMA table_info(downloads);

# Exit:
.quit
```

### Step 4: Restart Application

```bash
# Restart dengan PM2
pm2 restart voucher-app

# Atau jika tidak pakai PM2
pkill -f node
node server.js &
```

### Step 5: Verify Deployment

```bash
# Check app is running
pm2 status
# atau
ps aux | grep node

# Check logs
pm2 logs voucher-app --lines 50

# Check database
sqlite3 voucher_downloads.db "SELECT COUNT(*) FROM downloads;"
```

## ✅ Testing Checklist

### Test 1: Tanpa UTM (Existing Flow)

```bash
# Akses dari browser
https://voucher.tdn.id

# Download voucher dengan nomor test
# Expected: utm_source = "direct"
```

**Verify:**
```bash
sqlite3 voucher_downloads.db "SELECT id, phone_number, utm_source FROM downloads ORDER BY id DESC LIMIT 1;"
```

### Test 2: Dengan UTM RT01

```bash
# Akses dari browser
https://voucher.tdn.id/?utm_source=RT01

# Download voucher
# Expected: utm_source = "RT01"
```

**Verify:**
```bash
sqlite3 voucher_downloads.db "SELECT id, phone_number, utm_source FROM downloads ORDER BY id DESC LIMIT 1;"
```

### Test 3: Dengan UTM RT02

```bash
# Akses dari browser
https://voucher.tdn.id/?utm_source=RT02

# Download voucher
# Expected: utm_source = "RT02"
```

### Test 4: Admin Panel

1. Login ke admin panel: `https://voucher.tdn.id/admin.html`
2. Cek tabel downloads
3. Verify kolom "Source (RT)" muncul
4. Verify badge warna (Direct = abu-abu, RT01/RT02 = biru)

### Test 5: Export CSV

1. Login ke admin panel
2. Klik "Download CSV" atau "Export CSV"
3. Buka file CSV
4. Verify kolom `utm_source` atau `voucher_srp` ada

## 📊 Monitoring

### Check UTM Distribution

```bash
sqlite3 voucher_downloads.db <<EOF
.headers on
.mode column
SELECT 
  utm_source,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM downloads WHERE is_deleted = 0), 2) as percentage
FROM downloads 
WHERE is_deleted = 0
GROUP BY utm_source
ORDER BY total DESC;
EOF
```

### Check Latest Downloads with UTM

```bash
sqlite3 voucher_downloads.db <<EOF
.headers on
.mode column
.width 5 15 25 10 30
SELECT 
  id,
  phone_number,
  voucher_code,
  utm_source,
  download_time
FROM downloads 
WHERE is_deleted = 0
ORDER BY download_time DESC 
LIMIT 10;
EOF
```

## 🔧 Troubleshooting

### Issue 1: Column Already Exists

**Error:**
```
Error: duplicate column name: utm_source
```

**Solution:**
Column sudah ada, skip migration. Lanjut ke restart app.

### Issue 2: UTM Always "direct"

**Check:**
1. Apakah URL ada parameter `?utm_source=RT01`?
2. Buka browser console (F12), cek log "UTM Source captured"
3. Cek sessionStorage: `sessionStorage.getItem('utm_source')`

**Solution:**
- Clear browser cache (Ctrl+Shift+Del)
- Pastikan URL ada parameter UTM
- Test dengan incognito mode

### Issue 3: Admin Panel Error

**Error:**
```
Cannot read property 'utm_source' of undefined
```

**Solution:**
```bash
# Restart app
pm2 restart voucher-app

# Clear browser cache
# Refresh admin panel (Ctrl+F5)
```

### Issue 4: Export CSV Missing UTM

**Check:**
Export CSV endpoint sudah diupdate di commit sebelumnya (include voucher_srp JOIN).

**Verify:**
```bash
grep -n "voucher_srp" server.js | grep export
```

## 📱 Generate QR Codes

### Step 1: Create URLs

**RT01:**
```
https://voucher.tdn.id/?utm_source=RT01
```

**RT02:**
```
https://voucher.tdn.id/?utm_source=RT02
```

### Step 2: Generate QR Code

**Online Tools:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://www.the-qrcode-generator.com/

**Settings:**
- URL: `https://voucher.tdn.id/?utm_source=RT01`
- Size: 300x300 px atau lebih
- Error correction: Medium (M)
- Format: PNG atau SVG

### Step 3: Create Short Links (Optional)

**Via s.id:**

1. Login ke https://s.id
2. Create short link:
   - Short URL: `s.id/voucher-rt01`
   - Target: `https://voucher.tdn.id/?utm_source=RT01`
3. Generate QR dari s.id dashboard
4. Download dan print

### Step 4: Print & Distribute

**Design Poster:**
```
┌─────────────────────────────────┐
│                                 │
│   SCAN UNTUK DAPATKAN VOUCHER   │
│                                 │
│        [QR CODE RT01]           │
│                                 │
│         RT 01                   │
│                                 │
│   s.id/voucher-rt01             │
│                                 │
└─────────────────────────────────┘
```

## 🎯 Next Steps (Optional)

### Phase 2: Add More RT

Edit `server.js`:
```javascript
const validSources = ['RT01', 'RT02', 'RT03', 'RT04', 'RT05', 'direct'];
```

Generate QR untuk RT03, RT04, dst.

### Phase 3: Add Campaign Tracking

```sql
ALTER TABLE downloads ADD COLUMN utm_campaign TEXT DEFAULT 'none';
```

Update code untuk capture `utm_campaign`.

### Phase 4: Add Medium Tracking

```sql
ALTER TABLE downloads ADD COLUMN utm_medium TEXT DEFAULT 'none';
```

Track channel: qr_code, whatsapp, poster, dll.

### Phase 5: Analytics Dashboard

Buat dashboard dengan chart/graph untuk visualisasi data UTM.

## 📞 Support

Jika ada masalah:

1. **Check logs:**
   ```bash
   pm2 logs voucher-app --lines 100
   ```

2. **Check database:**
   ```bash
   sqlite3 voucher_downloads.db "SELECT * FROM downloads ORDER BY id DESC LIMIT 5;"
   ```

3. **Rollback jika perlu:**
   ```bash
   # Restore database
   cp voucher_downloads.db.backup_YYYYMMDD_HHMMSS voucher_downloads.db
   
   # Restore code
   git checkout HEAD~1
   pm2 restart voucher-app
   ```

## ✅ Success Criteria

- [ ] Database migration berhasil
- [ ] App restart tanpa error
- [ ] User tanpa UTM bisa download (utm_source = "direct")
- [ ] User dengan UTM RT01 bisa download (utm_source = "RT01")
- [ ] User dengan UTM RT02 bisa download (utm_source = "RT02")
- [ ] Admin panel menampilkan kolom "Source (RT)"
- [ ] Export CSV include utm_source
- [ ] QR Code generated dan ready to print

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** _____________
