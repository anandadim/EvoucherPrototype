# 🚀 Deployment Checklist - 4 Desember 2024

**Features:** UTM Homepage + Downloaded Voucher Image Fix

---

## ⚠️ IMPORTANT: Database Schema

### ❗ Kolom `utm_source` HARUS ADA!

**Perubahan hari ini TIDAK mengubah schema**, tapi **MEMBUTUHKAN** kolom `utm_source` yang sudah ada dari deployment sebelumnya.

### Check di Live Server:

```sql
-- Check apakah kolom utm_source sudah ada
PRAGMA table_info(downloads);

-- Atau test query
SELECT utm_source FROM downloads LIMIT 1;
```

**Jika kolom BELUM ADA (error):**
```sql
-- Tambahkan kolom utm_source
ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';
```

**Jika kolom SUDAH ADA:**
✅ Skip, langsung deploy code!

---

## 📦 Files Changed Today

### 1. **Backend (Server-side)**

#### Modified:
```
server.js
  - Line ~1328-1355: Downloaded voucher image logic
  - Added UTM-based background selection for generated voucher
```

### 2. **Frontend (Client-side)**

#### Modified:
```
public/script.js
  - Line ~26-46: Homepage background swap (UTM-based)
  - Line ~199-217: Voucher display background swap (UTM-based)
  - Added debug console logs
```

### 3. **New Assets Required**

#### Images:
```
public/images/homepage-rt.jpeg       (RT homepage background)
public/images/homepage-2-rt.png      (RT voucher background)
```

**Status:**
- ✅ `homepage-rt.jpeg` - Already exists
- ✅ `homepage-2-rt.png` - Already exists

---

## 🔧 Deployment Steps

### Step 1: Backup Current Files

```bash
# SSH to live server
ssh user@your-server.com

# Navigate to project
cd /var/www/EvoucherPrototype

# Backup current files
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)
cp public/script.js public/script.js.backup-$(date +%Y%m%d-%H%M%S)

# Backup database
cp voucher_downloads.db voucher_downloads.db.backup-$(date +%Y%m%d-%H%M%S)
```

---

### Step 2: Check Database Schema

```bash
# Check if utm_source column exists
sqlite3 voucher_downloads.db "PRAGMA table_info(downloads);"

# Look for: utm_source | TEXT | 0 | 'direct' | 0
```

**If NOT found:**
```bash
# Add the column
sqlite3 voucher_downloads.db "ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';"

# Verify
sqlite3 voucher_downloads.db "SELECT utm_source FROM downloads LIMIT 1;"
```

**If found:**
✅ Continue to next step

---

### Step 3: Upload New Files

#### Option A: Using SCP (from local)
```bash
# From your local machine
scp server.js user@server:/var/www/EvoucherPrototype/
scp public/script.js user@server:/var/www/EvoucherPrototype/public/
scp public/images/homepage-rt.jpeg user@server:/var/www/EvoucherPrototype/public/images/
scp public/images/homepage-2-rt.png user@server:/var/www/EvoucherPrototype/public/images/
```

#### Option B: Using Git (if using version control)
```bash
# On server
cd /var/www/EvoucherPrototype
git pull origin main
```

#### Option C: Manual Copy-Paste
```bash
# Edit files directly on server
nano server.js
nano public/script.js

# Upload images via SFTP or file manager
```

---

### Step 4: Verify Files

```bash
# Check files exist
ls -la server.js
ls -la public/script.js
ls -la public/images/homepage-rt.jpeg
ls -la public/images/homepage-2-rt.png

# Check file permissions
chmod 644 server.js
chmod 644 public/script.js
chmod 644 public/images/*.jpeg
chmod 644 public/images/*.png
```

---

### Step 5: Restart Application

```bash
# If using PM2
pm2 restart voucher-app

# Or if using npm directly
npm start

# Check status
pm2 status
# or
pm2 logs voucher-app --lines 20
```

---

### Step 6: Test Deployment

#### Test 1: Regular Homepage
```bash
# Access
curl -I https://your-domain.com

# Expected: 200 OK
```

#### Test 2: RT Homepage
```bash
# Access
curl -I https://your-domain.com?utm_source=RT01

# Expected: 200 OK
```

#### Test 3: Regular Download
```bash
# Via browser:
1. Access: https://your-domain.com
2. Enter phone number
3. Download voucher
4. Check downloaded image (should be regular template)
```

#### Test 4: RT Download
```bash
# Via browser:
1. Access: https://your-domain.com?utm_source=RT01
2. Enter phone number
3. Download voucher
4. Check downloaded image (should be RT template - green theme)
```

#### Test 5: Check Server Logs
```bash
pm2 logs voucher-app --lines 50

# Look for:
# "Loading RT homepage background"
# "Generating voucher image for UTM: RT01, using background: homepage-2-rt.png"
```

---

## ✅ Verification Checklist

### Pre-Deployment:
- [ ] Backup current files
- [ ] Backup database
- [ ] Check `utm_source` column exists
- [ ] Verify new image files ready

### During Deployment:
- [ ] Upload `server.js`
- [ ] Upload `public/script.js`
- [ ] Upload `public/images/homepage-rt.jpeg`
- [ ] Upload `public/images/homepage-2-rt.png`
- [ ] Set correct file permissions
- [ ] Restart application

### Post-Deployment:
- [ ] Test regular homepage (no UTM)
- [ ] Test RT homepage (RT01)
- [ ] Test RT homepage (RT02)
- [ ] Test regular download
- [ ] Test RT download (check downloaded file!)
- [ ] Check server logs for errors
- [ ] Monitor for 10-15 minutes

---

## 🐛 Troubleshooting

### Issue 1: Error "no such column: utm_source"

**Cause:** Column not added to database

**Solution:**
```bash
sqlite3 voucher_downloads.db "ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';"
pm2 restart voucher-app
```

---

### Issue 2: RT image not showing

**Cause:** Image file not uploaded

**Solution:**
```bash
# Check files exist
ls -la public/images/homepage-rt.jpeg
ls -la public/images/homepage-2-rt.png

# If missing, upload them
scp public/images/homepage-*.* user@server:/var/www/EvoucherPrototype/public/images/
```

---

### Issue 3: Downloaded voucher still regular template

**Cause:** Server not restarted or code not updated

**Solution:**
```bash
# Check server.js has new code
grep "Generating voucher image for UTM" server.js

# If not found, re-upload server.js
scp server.js user@server:/var/www/EvoucherPrototype/

# Restart
pm2 restart voucher-app
```

---

### Issue 4: 500 Internal Server Error

**Check logs:**
```bash
pm2 logs voucher-app --lines 100

# Look for error messages
```

**Common causes:**
- Missing image files
- Database column missing
- Syntax error in code

---

## 📊 Monitoring

### Check Downloads by UTM:

```sql
-- Recent downloads
SELECT 
  id,
  phone_number,
  utm_source,
  download_time
FROM downloads
ORDER BY id DESC
LIMIT 20;

-- Count by UTM
SELECT 
  utm_source,
  COUNT(*) as total
FROM downloads
GROUP BY utm_source;
```

### Check Server Logs:

```bash
# Real-time logs
pm2 logs voucher-app

# Last 100 lines
pm2 logs voucher-app --lines 100

# Filter for errors
pm2 logs voucher-app --err
```

---

## 🔄 Rollback Plan

**If something goes wrong:**

### Quick Rollback:
```bash
# Restore backup files
cp server.js.backup-YYYYMMDD-HHMMSS server.js
cp public/script.js.backup-YYYYMMDD-HHMMSS public/script.js

# Restart
pm2 restart voucher-app
```

### Full Rollback:
```bash
# Restore database (if needed)
cp voucher_downloads.db.backup-YYYYMMDD-HHMMSS voucher_downloads.db

# Restore all files
cp server.js.backup-YYYYMMDD-HHMMSS server.js
cp public/script.js.backup-YYYYMMDD-HHMMSS public/script.js

# Restart
pm2 restart voucher-app
```

---

## 📝 Summary of Changes

### What Changed:

1. **Homepage Background (Client-side)**
   - RT users see green RT theme
   - Regular users see regular theme

2. **Voucher Display Background (Client-side)**
   - RT users see green voucher background
   - Regular users see regular background

3. **Downloaded Voucher Image (Server-side)** ⭐ NEW!
   - RT users download voucher with RT template
   - Regular users download voucher with regular template

### What DIDN'T Change:

- ❌ Database schema (utm_source already exists from before)
- ❌ Voucher logic (RTT- vs SRP-/ADS- separation)
- ❌ Admin panel
- ❌ Authentication
- ❌ Rate limiting

---

## 🎯 Expected Behavior After Deployment

### Regular User Flow:
```
1. Access: https://evoucher.com
   → Homepage: Regular theme
   
2. Download voucher
   → Display: Regular background
   → Downloaded file: Regular template ✅
```

### RT User Flow:
```
1. Access: https://evoucher.com?utm_source=RT01
   → Homepage: RT theme (green)
   
2. Download voucher
   → Display: RT background (green)
   → Downloaded file: RT template (green) ✅
```

---

## ⏱️ Estimated Deployment Time

- **Backup:** 2 minutes
- **Check database:** 2 minutes
- **Upload files:** 5 minutes
- **Restart & test:** 5 minutes
- **Monitoring:** 10 minutes

**Total:** ~25 minutes

---

## 📞 Support

**If issues occur:**

1. Check server logs first
2. Verify database schema
3. Test with curl/browser
4. Rollback if critical
5. Contact developer if needed

---

**Deployment Date:** 4 Desember 2024  
**Status:** Ready for deployment ✅  
**Risk Level:** LOW (no schema changes, backward compatible)
