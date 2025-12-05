# 🚀 Quick Deployment Reference

**Target:** EvoucherPrototype (Live Server)  
**Date:** 4 Desember 2024

---

## ⚡ Super Quick Deploy (5 Commands)

```bash
# 1. Backup
cd /var/www && cp -r EvoucherPrototype EvoucherPrototype-backup-$(date +%Y%m%d-%H%M%S)

# 2. Check database
sqlite3 EvoucherPrototype/voucher_downloads.db "PRAGMA table_info(downloads);" | grep utm_source

# 3. Copy files (adjust path to your current directory)
cp server.js EvoucherPrototype/
cp public/script.js EvoucherPrototype/public/
cp public/admin-script.js EvoucherPrototype/public/
cp public/admin.html EvoucherPrototype/public/
cp public/images/homepage-rt.jpeg EvoucherPrototype/public/images/
cp public/images/homepage-2-rt.png EvoucherPrototype/public/images/

# 4. Restart
pm2 restart voucher-app

# 5. Test
curl -I https://your-domain.com?utm_source=RT01
```

---

## 📦 Files to Copy (Checklist)

### **MUST HAVE (Core):**
- [ ] `server.js`
- [ ] `public/script.js`
- [ ] `public/admin-script.js`
- [ ] `public/admin.html`
- [ ] `public/images/homepage-rt.jpeg`
- [ ] `public/images/homepage-2-rt.png`

### **NICE TO HAVE (Helpers):**
- [ ] `check-vouchers.js`
- [ ] `fix-ads-vouchers.js`

### **OPTIONAL (Docs):**
- [ ] `RT_VOUCHER_*.md`
- [ ] `PHASE*.md`
- [ ] `UTM_*.md`

---

## ⚠️ Critical Checks

### **1. Database Schema:**
```bash
# Must have utm_source column
sqlite3 EvoucherPrototype/voucher_downloads.db "PRAGMA table_info(downloads);" | grep utm_source

# If not found, add it:
sqlite3 EvoucherPrototype/voucher_downloads.db "ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';"
```

### **2. RT Vouchers:**
```bash
# Must have RTT- vouchers
sqlite3 EvoucherPrototype/voucher_downloads.db "SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%';"

# If 0, upload via admin panel first!
```

### **3. Image Files:**
```bash
# Must exist
ls -la EvoucherPrototype/public/images/homepage-rt.jpeg
ls -la EvoucherPrototype/public/images/homepage-2-rt.png
```

---

## 🧪 Quick Test

```bash
# Test 1: Regular
curl https://your-domain.com

# Test 2: RT
curl https://your-domain.com?utm_source=RT01

# Test 3: Logs
pm2 logs voucher-app --lines 20

# Test 4: Database
sqlite3 EvoucherPrototype/voucher_downloads.db "SELECT * FROM downloads ORDER BY id DESC LIMIT 3;"
```

---

## 🔄 Quick Rollback

```bash
# If something goes wrong:
cd /var/www
pm2 stop voucher-app
rm -rf EvoucherPrototype
cp -r EvoucherPrototype-backup-YYYYMMDD-HHMMSS EvoucherPrototype
pm2 restart voucher-app
```

---

## 📊 What's Different

| Feature | Before (Live) | After (Deploy) |
|---------|---------------|----------------|
| RT Vouchers | ❌ Not supported | ✅ Supported (RTT-) |
| UTM Homepage | ❌ Same for all | ✅ Different (RT/Regular) |
| Downloaded Image | ❌ Same template | ✅ Different (RT/Regular) |
| Admin Stats | ❌ Combined | ✅ Separated (RT/Regular) |

---

## 🎯 Success Check

After deployment, verify:

- [ ] No errors in `pm2 logs`
- [ ] Regular download works
- [ ] RT download works (RT01)
- [ ] Downloaded RT voucher has green theme
- [ ] Database records utm_source
- [ ] Admin panel shows RT stats

---

**Full Guide:** See `DEPLOYMENT_TO_LIVE_SERVER.md`
