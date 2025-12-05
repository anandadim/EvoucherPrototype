# 🛠️ Utility Scripts

Folder ini berisi script-script utility untuk maintenance dan management database.

## 📋 Available Scripts

### 1. **reset-database.js**
Reset database ke kondisi awal (kosongkan downloads, reset voucher status).

**Usage:**
```bash
node utility/reset-database.js
```

**What it does:**
- Kosongkan tabel `downloads`
- Reset `is_used = 0` di tabel `voucher_srp`
- Reset `used_quota = 0` di tabel `voucher_settings`

**When to use:**
- Setelah testing
- Sebelum demo
- Saat ingin mulai dari awal

---

### 2. **verify-reset.js**
Verifikasi hasil reset database.

**Usage:**
```bash
node utility/verify-reset.js
```

**What it checks:**
- Jumlah records di tabel `downloads` (harus 0)
- Status voucher di `voucher_srp` (semua harus available)
- Used quota di `voucher_settings` (harus 0)

**When to use:**
- Setelah menjalankan `reset-database.js`
- Untuk memastikan reset berhasil

---

### 3. **migrate-timezone.js**
Migrate existing timestamps dari UTC ke Jakarta time (+7 hours).

**Usage:**
```bash
node utility/migrate-timezone.js
```

**What it does:**
- Update semua timestamp lama +7 jam
- Adjust ke waktu Jakarta (WIB/UTC+7)
- Berlaku untuk: downloads, admin_logs, blocked_ips, voucher_srp

**When to use:**
- Hanya jika ada data lama yang masih menggunakan UTC
- Setelah fix timezone di schema
- **Optional** - data baru sudah otomatis pakai Jakarta time

**⚠️ Warning:**
- Backup database sebelum menjalankan script ini
- Script ini akan modify existing data

---

## 🚀 Quick Reference

```bash
# Reset database
node utility/reset-database.js

# Verify reset
node utility/verify-reset.js

# Migrate timezone (optional, untuk data lama)
node utility/migrate-timezone.js
```

---

## 📝 Notes

- Semua script menggunakan database: `voucher_downloads.db`
- Pastikan server tidak running saat menjalankan script
- Backup database sebelum menjalankan script yang modify data
- Script bersifat **synchronous** dan akan selesai dalam beberapa detik

---

**Location:** `/utility/`  
**Last Updated:** November 2024
