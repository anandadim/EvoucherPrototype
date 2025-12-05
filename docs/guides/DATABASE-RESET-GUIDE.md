# 🔄 Database Reset Guide

Panduan untuk reset database voucher ke kondisi awal.

## 📋 Apa yang Di-reset?

### 1. Tabel `downloads`
- ✅ Semua record dihapus
- ✅ Tabel menjadi kosong

### 2. Tabel `voucher_srp`
- ✅ `is_used` → 0 (semua voucher available lagi)
- ✅ `used_by_download_id` → NULL
- ✅ `used_at` → NULL

### 3. Tabel `voucher_settings`
- ✅ `used_quota` → 0

## 🚀 Cara Reset Database

### Method 1: Menggunakan Script (Recommended)

```bash
# Reset database
node utility/reset-database.js

# Verifikasi hasil reset
node utility/verify-reset.js
```

### Method 2: Manual SQL

```sql
-- 1. Kosongkan tabel downloads
DELETE FROM downloads;

-- 2. Reset voucher_srp
UPDATE voucher_srp 
SET is_used = 0, 
    used_by_download_id = NULL, 
    used_at = NULL;

-- 3. Reset used_quota
UPDATE voucher_settings 
SET used_quota = 0 
WHERE id = 1;
```

## ✅ Verifikasi Reset

Setelah reset, jalankan:

```bash
node verify-reset.js
```

**Expected Output:**
```
📋 Downloads Table:
   Total records: 0
   Status: ✅ EMPTY (CORRECT)

🎫 Voucher SRP Table:
   Total vouchers: 10
   Used: 0
   Available: 10
   Status: ✅ ALL RESET (CORRECT)

⚙️  Settings:
   Total quota: 100
   Used quota: 0
   Status: ✅ RESET (CORRECT)
```

## 🧪 Test Setelah Reset

1. **Start Server**
   ```bash
   node server.js
   ```

2. **Test Preview Voucher**
   ```bash
   curl -X POST http://localhost:3000/api/preview-voucher \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"628123456789"}'
   ```

   **Expected:** Voucher pertama (IGV-0001-SSY6P) muncul lagi

3. **Test Download**
   - Buka http://localhost:3000
   - Input nomor HP: 628123456789
   - Preview voucher harus muncul
   - Download harus berhasil

## ⚠️ Kapan Perlu Reset?

### Development/Testing:
- ✅ Setelah testing fitur download
- ✅ Sebelum demo ke client
- ✅ Setelah import voucher baru
- ✅ Saat ingin mulai dari awal

### Production:
- ⚠️ **HATI-HATI!** Reset akan menghapus semua data download
- ⚠️ Backup database dulu sebelum reset
- ⚠️ Pastikan tidak ada transaksi aktif

## 💾 Backup Sebelum Reset

```bash
# Backup database
cp voucher_downloads.db voucher_downloads.db.backup-$(date +%Y%m%d-%H%M%S)

# Atau di Windows PowerShell
Copy-Item voucher_downloads.db "voucher_downloads.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

## 🔄 Restore dari Backup

Jika perlu restore:

```bash
# Stop server dulu
pm2 stop voucher-system

# Restore backup
cp voucher_downloads.db.backup-20241108-220000 voucher_downloads.db

# Start server
pm2 start voucher-system
```

## 📊 Scripts Available

| Script | Purpose | Usage |
|--------|---------|-------|
| `reset-database.js` | Reset database | `node utility/reset-database.js` |
| `verify-reset.js` | Verifikasi reset | `node utility/verify-reset.js` |

## 🎯 Use Cases

### 1. Testing Download Flow
```bash
# Reset database
node utility/reset-database.js

# Start server
node server.js

# Test download di browser
# http://localhost:3000
```

### 2. Demo Preparation
```bash
# Backup current state
cp voucher_downloads.db voucher_downloads.db.backup

# Reset untuk demo
node utility/reset-database.js

# Verify
node utility/verify-reset.js
```

### 3. Import New Vouchers
```bash
# Reset old vouchers
node utility/reset-database.js

# Import new CSV via admin panel
# http://localhost:3000/admin.html
```

## 🔍 Troubleshooting

### Error: "Database is locked"
```bash
# Stop all node processes
pkill node

# Or Windows
taskkill /F /IM node.exe

# Try reset again
node reset-database.js
```

### Error: "Cannot find module"
```bash
# Install dependencies
npm install

# Try again
node reset-database.js
```

### Reset Tidak Berhasil
```bash
# Check database file
ls -lh voucher_downloads.db

# Check permissions
chmod 644 voucher_downloads.db

# Try manual SQL
sqlite3 voucher_downloads.db < reset.sql
```

## 📝 Notes

- ✅ Reset tidak menghapus voucher_srp (voucher tetap ada)
- ✅ Reset tidak menghapus admin users
- ✅ Reset tidak menghapus blocked IPs
- ✅ Reset tidak menghapus admin logs
- ✅ Reset hanya menghapus download history

## 🎓 Best Practices

1. **Always Backup** sebelum reset di production
2. **Verify** setelah reset dengan `verify-reset.js`
3. **Test** download flow setelah reset
4. **Document** kapan dan kenapa reset dilakukan
5. **Notify** team jika reset di shared environment

---

**Created:** November 2024  
**Version:** 1.0
