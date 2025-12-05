# UTM Tracking - Quick Reference Guide

## 🎯 Apa itu UTM Tracking?

Sistem untuk melacak dari mana user download voucher (RT01, RT02, dll).

## 🔗 URL Format

### RT 01:
```
https://voucher.tdn.id/?utm_source=RT01
```

### RT 02:
```
https://voucher.tdn.id/?utm_source=RT02
```

### Direct (tanpa UTM):
```
https://voucher.tdn.id
```

## 📱 Cara Pakai

### 1. Generate QR Code

**Online:** https://www.qr-code-generator.com/

**Input:**
- RT01: `https://voucher.tdn.id/?utm_source=RT01`
- RT02: `https://voucher.tdn.id/?utm_source=RT02`

**Download** QR Code sebagai PNG.

### 2. Print Poster

```
┌─────────────────────┐
│  SCAN UNTUK VOUCHER │
│                     │
│   [QR CODE RT01]    │
│                     │
│      RT 01          │
└─────────────────────┘
```

### 3. Distribusi

- Poster RT01 → Tempel di RT 01
- Poster RT02 → Tempel di RT 02

### 4. Monitor

Login admin panel → Lihat kolom "Source (RT)"

## 📊 Query Cepat

### Total Download per RT:
```bash
sqlite3 voucher_downloads.db "SELECT utm_source, COUNT(*) FROM downloads WHERE is_deleted = 0 GROUP BY utm_source;"
```

### Download Hari Ini per RT:
```bash
sqlite3 voucher_downloads.db "SELECT utm_source, COUNT(*) FROM downloads WHERE DATE(download_time) = DATE('now', 'localtime') GROUP BY utm_source;"
```

### Latest 10 Downloads:
```bash
sqlite3 voucher_downloads.db "SELECT id, phone_number, utm_source, download_time FROM downloads ORDER BY download_time DESC LIMIT 10;"
```

## 🎨 Short Links (s.id)

### Setup:

1. Login ke https://s.id
2. Create link:
   - **RT01:** `s.id/voucher-rt01` → `https://voucher.tdn.id/?utm_source=RT01`
   - **RT02:** `s.id/voucher-rt02` → `https://voucher.tdn.id/?utm_source=RT02`
3. Generate QR dari s.id
4. Print & distribute

### Keuntungan:
- URL lebih pendek
- QR Code lebih simple
- Bisa ganti target tanpa print ulang
- Bonus analytics dari s.id

## 🔍 Troubleshooting

### UTM tidak tercatat?

**Check:**
```bash
# Lihat latest download
sqlite3 voucher_downloads.db "SELECT * FROM downloads ORDER BY id DESC LIMIT 1;"
```

**Jika utm_source = "direct" padahal pakai UTM:**
- Clear browser cache
- Test dengan incognito mode
- Pastikan URL ada `?utm_source=RT01`

### Admin panel tidak tampil UTM?

**Solution:**
- Refresh page (Ctrl+F5)
- Clear browser cache
- Check console (F12) untuk error

## 📈 Analytics

### Summary Report:
```sql
SELECT 
  utm_source as RT,
  COUNT(*) as total_downloads,
  COUNT(DISTINCT phone_number) as unique_users,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM downloads WHERE is_deleted = 0), 2) as percentage
FROM downloads 
WHERE is_deleted = 0
GROUP BY utm_source
ORDER BY total_downloads DESC;
```

### Daily Trend:
```sql
SELECT 
  DATE(download_time) as tanggal,
  utm_source,
  COUNT(*) as downloads
FROM downloads 
WHERE is_deleted = 0
GROUP BY DATE(download_time), utm_source
ORDER BY tanggal DESC, downloads DESC;
```

## 🎯 Valid UTM Sources

Saat ini yang valid:
- `RT01`
- `RT02`
- `RT03`
- `RT04`
- `RT05`
- `direct` (default)

Untuk tambah RT baru, edit `server.js`:
```javascript
const validSources = ['RT01', 'RT02', 'RT03', ...];
```

## 📞 Quick Commands

### Check app status:
```bash
pm2 status
```

### Check logs:
```bash
pm2 logs voucher-app --lines 50
```

### Restart app:
```bash
pm2 restart voucher-app
```

### Check database:
```bash
sqlite3 voucher_downloads.db
```

## ✅ Checklist Deployment

- [ ] Database migration done
- [ ] App restarted
- [ ] Test download tanpa UTM (should be "direct")
- [ ] Test download dengan RT01 (should be "RT01")
- [ ] Test download dengan RT02 (should be "RT02")
- [ ] Admin panel show UTM column
- [ ] QR Code generated
- [ ] Poster printed
- [ ] Distributed to RT

---

**Quick Help:**
- Deployment guide: `DEPLOYMENT_UTM_TRACKING.md`
- Full documentation: `README.md`
