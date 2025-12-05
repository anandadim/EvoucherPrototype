# 🚀 Deployment to Live Server (EvoucherPrototype)

**Date:** 4 Desember 2024  
**Target:** EvoucherPrototype folder (Live Server)  
**Source:** Current Implementation (Root Directory)

---

## ⚠️ CRITICAL INFORMATION

### **EvoucherPrototype = LIVE SERVER (Production)**

Folder `EvoucherPrototype` adalah **production code** yang currently running di live server!

**Status:**
- ❌ **OUTDATED** - Last modified: November 2024
- ❌ **Missing RT Voucher features** (implemented Dec 3-4, 2024)
- ❌ **Missing UTM Homepage features** (implemented Dec 4, 2024)
- ❌ **Missing Downloaded Voucher Image fix** (implemented Dec 4, 2024)

---

## 📊 What's Missing in Live Server

### Features NOT in Production Yet:

#### 1. **RT Voucher System** (Phase 1-3)
- ❌ Separate voucher pools (RTT- vs SRP-/ADS-)
- ❌ UTM validation (RT01, RT02, direct)
- ❌ RT-specific error messages
- ❌ Admin stats separation
- ❌ CSV template with RT example

#### 2. **UTM Homepage** (Today's work)
- ❌ Different homepage background based on UTM
- ❌ RT theme (green) for RT01/RT02
- ❌ Regular theme for direct

#### 3. **Downloaded Voucher Image** (Today's work)
- ❌ RT template for downloaded voucher
- ❌ Server-side image generation based on UTM

---

## 🎯 Deployment Strategy

### **Option 1: Full Sync (Recommended)**

Copy ALL updated files from current to EvoucherPrototype.

**Pros:**
- ✅ Complete feature parity
- ✅ All RT Voucher features
- ✅ All UTM Homepage features
- ✅ Latest bug fixes

**Cons:**
- ⚠️ More files to copy
- ⚠️ Need thorough testing

---

### **Option 2: Minimal Update (Today's Changes Only)**

Copy only today's changes (UTM Homepage + Downloaded Image fix).

**Pros:**
- ✅ Quick deployment
- ✅ Less risk

**Cons:**
- ❌ Still missing RT Voucher logic
- ❌ RT users will get errors

**Recommendation:** ❌ **DON'T USE** - RT Voucher logic is critical!

---

## 📦 Files to Deploy (Full Sync)

### **Core Backend:**
```
✅ server.js                    (RT Voucher + UTM + Downloaded Image)
```

### **Frontend:**
```
✅ public/script.js             (UTM Homepage + Validation)
✅ public/admin-script.js       (RT Stats display)
✅ public/admin.html            (RT Stats UI)
```

### **Helper Scripts:**
```
✅ check-vouchers.js            (Debug tool with RT support)
✅ fix-ads-vouchers.js          (ADS- voucher support script)
```

### **Assets:**
```
✅ public/images/homepage-rt.jpeg       (RT homepage background)
✅ public/images/homepage-2-rt.png      (RT voucher background)
```

### **Documentation (Optional but Recommended):**
```
✅ RT_VOUCHER_IMPLEMENTATION.md
✅ RT_VOUCHER_SUMMARY.md
✅ RT_VOUCHER_FINAL_SUMMARY.md
✅ PHASE1_IMPLEMENTATION_SUMMARY.md
✅ PHASE1_TESTING_GUIDE.md
✅ PHASE2_TESTING_GUIDE.md
✅ PHASE3_TESTING_GUIDE.md
✅ UTM_HOMEPAGE_IMPLEMENTATION.md
✅ UTM_SOURCE_REFERENCE.md
✅ FIX_DOWNLOADED_VOUCHER_IMAGE.md
✅ DEPLOYMENT_TO_LIVE_SERVER.md (this file)
```

---

## 🔧 Step-by-Step Deployment

### **Pre-Deployment Checklist:**

- [ ] Backup EvoucherPrototype folder
- [ ] Check database has `utm_source` column
- [ ] Verify RT vouchers (RTT-) uploaded to database
- [ ] Test current implementation locally
- [ ] Prepare rollback plan

---

### **Step 1: Backup Live Server**

```bash
# SSH to server
ssh user@your-server.com

# Navigate to parent directory
cd /var/www

# Create timestamped backup
cp -r EvoucherPrototype EvoucherPrototype-backup-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -la EvoucherPrototype-backup-*

# Backup database specifically
cp EvoucherPrototype/voucher_downloads.db EvoucherPrototype/voucher_downloads.db.backup-$(date +%Y%m%d-%H%M%S)
```

---

### **Step 2: Check Database Schema**

```bash
# Check if utm_source column exists
cd /var/www/EvoucherPrototype
sqlite3 voucher_downloads.db "PRAGMA table_info(downloads);"

# Look for: utm_source | TEXT | 0 | 'direct' | 0
```

**If NOT found:**
```bash
# Add utm_source column
sqlite3 voucher_downloads.db "ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';"

# Verify
sqlite3 voucher_downloads.db "SELECT utm_source FROM downloads LIMIT 1;"
```

**If found:**
✅ Continue to next step

---

### **Step 3: Check RT Vouchers in Database**

```bash
# Check if RTT- vouchers exist
sqlite3 voucher_downloads.db "SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%';"

# Should return: number > 0
```

**If returns 0:**
```bash
# Need to upload RT vouchers first!
# Use admin panel to upload voucher_numbers_RTT_*.csv
# Or copy from current directory:
cp voucher_numbers_RTT_*.csv EvoucherPrototype/
```

---

### **Step 4: Copy Files to EvoucherPrototype**

#### **Option A: From Local Machine (SCP)**

```bash
# From your local machine (current directory)

# Core files
scp server.js user@server:/var/www/EvoucherPrototype/
scp public/script.js user@server:/var/www/EvoucherPrototype/public/
scp public/admin-script.js user@server:/var/www/EvoucherPrototype/public/
scp public/admin.html user@server:/var/www/EvoucherPrototype/public/

# Helper scripts
scp check-vouchers.js user@server:/var/www/EvoucherPrototype/
scp fix-ads-vouchers.js user@server:/var/www/EvoucherPrototype/

# Images
scp public/images/homepage-rt.jpeg user@server:/var/www/EvoucherPrototype/public/images/
scp public/images/homepage-2-rt.png user@server:/var/www/EvoucherPrototype/public/images/

# Documentation (optional)
scp RT_VOUCHER_*.md user@server:/var/www/EvoucherPrototype/
scp PHASE*.md user@server:/var/www/EvoucherPrototype/
scp UTM_*.md user@server:/var/www/EvoucherPrototype/
```

#### **Option B: From Current Directory (if on same server)**

```bash
# If current directory and EvoucherPrototype are on same server
cd /var/www

# Core files
cp server.js EvoucherPrototype/
cp public/script.js EvoucherPrototype/public/
cp public/admin-script.js EvoucherPrototype/public/
cp public/admin.html EvoucherPrototype/public/

# Helper scripts
cp check-vouchers.js EvoucherPrototype/
cp fix-ads-vouchers.js EvoucherPrototype/

# Images
cp public/images/homepage-rt.jpeg EvoucherPrototype/public/images/
cp public/images/homepage-2-rt.png EvoucherPrototype/public/images/

# Documentation
cp RT_VOUCHER_*.md EvoucherPrototype/
cp PHASE*.md EvoucherPrototype/
cp UTM_*.md EvoucherPrototype/
```

---

### **Step 5: Verify Files**

```bash
cd /var/www/EvoucherPrototype

# Check core files updated
ls -la server.js
ls -la public/script.js
ls -la public/admin-script.js
ls -la public/admin.html

# Check images exist
ls -la public/images/homepage-rt.jpeg
ls -la public/images/homepage-2-rt.png

# Check file permissions
chmod 644 server.js
chmod 644 public/*.js
chmod 644 public/*.html
chmod 644 public/images/*.jpeg
chmod 644 public/images/*.png
```

---

### **Step 6: Verify Code Changes**

```bash
# Check if RT Voucher logic exists
grep -n "RT01.*RT02" server.js
# Should show multiple lines with RT01/RT02 logic

# Check if UTM homepage logic exists
grep -n "homepage-rt.jpeg" public/script.js
# Should show line with RT homepage background

# Check if downloaded image logic exists
grep -n "Generating voucher image for UTM" server.js
# Should show line with UTM-based image generation
```

---

### **Step 7: Restart Application**

```bash
# Check PM2 status
pm2 status

# Restart voucher app
pm2 restart voucher-app

# Check logs for errors
pm2 logs voucher-app --lines 50

# Should see:
# "Server running on port 3001"
# "Database connected"
# No error messages
```

---

### **Step 8: Test Deployment**

#### **Test 1: Server Health**
```bash
curl -I https://your-domain.com
# Expected: 200 OK
```

#### **Test 2: Regular Homepage**
```bash
# Via browser
https://your-domain.com

# Expected:
# - Shows homepage-1.jpeg
# - No errors in console
```

#### **Test 3: RT Homepage**
```bash
# Via browser
https://your-domain.com?utm_source=RT01

# Expected:
# - Shows homepage-rt.jpeg (green theme)
# - Console: "Loading RT homepage background"
# - Console: "UTM Source captured: RT01"
```

#### **Test 4: Regular Download**
```bash
# Via browser:
1. Access: https://your-domain.com
2. Enter phone: 628123456789
3. Download voucher
4. Check downloaded image file
   Expected: Regular template (current design)
```

#### **Test 5: RT Download**
```bash
# Via browser:
1. Access: https://your-domain.com?utm_source=RT01
2. Enter phone: 628987654321
3. Download voucher
4. Check downloaded image file
   Expected: RT template (green theme) ✅
```

#### **Test 6: Check Database**
```bash
# Check recent downloads
sqlite3 voucher_downloads.db "SELECT id, phone_number, utm_source, download_time FROM downloads ORDER BY id DESC LIMIT 5;"

# Expected:
# - RT downloads have utm_source = 'RT01' or 'RT02'
# - Regular downloads have utm_source = 'direct'
```

#### **Test 7: Check Voucher Assignment**
```bash
# Check which vouchers were assigned
sqlite3 voucher_downloads.db "SELECT v.voucher_number, d.utm_source FROM voucher_srp v JOIN downloads d ON v.used_by_download_id = d.id ORDER BY v.id DESC LIMIT 5;"

# Expected:
# - RT downloads get RTT- vouchers
# - Regular downloads get SRP- or ADS- vouchers
```

#### **Test 8: Admin Panel**
```bash
# Via browser:
1. Login to admin panel
2. Check stats display
   Expected:
   - Separate stats for RT and Regular
   - Warning banner if RT < 100
```

---

### **Step 9: Monitor Production**

```bash
# Watch logs in real-time
pm2 logs voucher-app

# Check for errors
pm2 logs voucher-app --err

# Monitor downloads
watch -n 5 'sqlite3 voucher_downloads.db "SELECT COUNT(*) FROM downloads WHERE download_time > datetime(\"now\", \"-1 hour\");"'
```

---

## 🐛 Troubleshooting

### **Issue 1: Error "no such column: utm_source"**

**Cause:** Database schema not updated

**Solution:**
```bash
cd /var/www/EvoucherPrototype
sqlite3 voucher_downloads.db "ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';"
pm2 restart voucher-app
```

---

### **Issue 2: RT users get error "Voucher RT habis"**

**Cause:** No RTT- vouchers in database

**Solution:**
```bash
# Check RTT- vouchers
sqlite3 voucher_downloads.db "SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;"

# If 0, upload RT vouchers via admin panel
# Or run check-vouchers.js for detailed info
node check-vouchers.js
```

---

### **Issue 3: Images not showing (404)**

**Cause:** Image files not uploaded

**Solution:**
```bash
# Check files exist
ls -la public/images/homepage-rt.jpeg
ls -la public/images/homepage-2-rt.png

# If missing, upload them
scp public/images/homepage-*.* user@server:/var/www/EvoucherPrototype/public/images/

# Check permissions
chmod 644 public/images/*.jpeg
chmod 644 public/images/*.png
```

---

### **Issue 4: Downloaded voucher still regular template**

**Cause:** server.js not updated or not restarted

**Solution:**
```bash
# Verify server.js has new code
grep "Generating voucher image for UTM" server.js

# If not found, re-upload server.js
scp server.js user@server:/var/www/EvoucherPrototype/

# Restart
pm2 restart voucher-app

# Test again
```

---

### **Issue 5: 500 Internal Server Error**

**Check logs:**
```bash
pm2 logs voucher-app --lines 100 --err
```

**Common causes:**
- Missing database column
- Missing image files
- Syntax error in code
- File permissions

**Debug:**
```bash
# Check PM2 status
pm2 status

# Check if app is running
pm2 describe voucher-app

# Restart with logs
pm2 restart voucher-app --update-env
pm2 logs voucher-app
```

---

## 🔄 Rollback Plan

### **If Critical Issues Occur:**

#### **Quick Rollback (Files Only):**
```bash
cd /var/www

# Stop current app
pm2 stop voucher-app

# Restore from backup
rm -rf EvoucherPrototype
cp -r EvoucherPrototype-backup-YYYYMMDD-HHMMSS EvoucherPrototype

# Restart
pm2 restart voucher-app
```

#### **Full Rollback (Files + Database):**
```bash
cd /var/www/EvoucherPrototype

# Stop app
pm2 stop voucher-app

# Restore database
cp voucher_downloads.db.backup-YYYYMMDD-HHMMSS voucher_downloads.db

# Restore files (from backup folder)
cd /var/www
rm -rf EvoucherPrototype
cp -r EvoucherPrototype-backup-YYYYMMDD-HHMMSS EvoucherPrototype

# Restart
pm2 restart voucher-app
```

---

## 📊 Post-Deployment Monitoring

### **First 30 Minutes:**

```bash
# Monitor logs continuously
pm2 logs voucher-app

# Check for:
# ✅ No error messages
# ✅ Successful downloads
# ✅ Correct UTM tracking
# ✅ Correct voucher assignment
```

### **First 24 Hours:**

```sql
-- Check download distribution
SELECT 
  utm_source,
  COUNT(*) as downloads,
  COUNT(DISTINCT phone_number) as unique_users
FROM downloads
WHERE download_time > datetime('now', '-24 hours')
GROUP BY utm_source;

-- Check voucher usage
SELECT 
  CASE 
    WHEN voucher_number LIKE 'RTT-%' THEN 'RT'
    ELSE 'Regular'
  END as type,
  COUNT(*) as used
FROM voucher_srp
WHERE is_used = 1
  AND used_at > datetime('now', '-24 hours')
GROUP BY type;
```

---

## ✅ Success Criteria

### **Deployment Successful If:**

- ✅ Server running without errors
- ✅ Regular users can download (direct)
- ✅ RT users can download (RT01/RT02)
- ✅ RT users get RTT- vouchers
- ✅ Regular users get SRP-/ADS- vouchers
- ✅ Downloaded images have correct template
- ✅ Admin panel shows separate stats
- ✅ No 500 errors in logs
- ✅ Database records utm_source correctly

---

## 📝 Deployment Summary

### **What Will Change:**

#### **For Regular Users (direct):**
- ✅ Same experience as before
- ✅ Get SRP- or ADS- vouchers
- ✅ Regular template design

#### **For RT Users (RT01/RT02):**
- ✅ NEW: Green RT theme homepage
- ✅ NEW: Get RTT- vouchers (separate pool)
- ✅ NEW: RT template for downloaded voucher
- ✅ NEW: RT-specific error messages

#### **For Admins:**
- ✅ NEW: Separate stats (RT vs Regular)
- ✅ NEW: Warning banner when RT < 100
- ✅ NEW: CSV template with RT example
- ✅ NEW: Debug tools (check-vouchers.js)

---

## ⏱️ Estimated Timeline

- **Backup:** 5 minutes
- **Database check:** 5 minutes
- **File upload:** 10 minutes
- **Verification:** 5 minutes
- **Restart & test:** 10 minutes
- **Monitoring:** 15 minutes

**Total:** ~50 minutes

---

## 🎯 Final Checklist

### **Before Deployment:**
- [ ] Read this document completely
- [ ] Backup EvoucherPrototype folder
- [ ] Backup database
- [ ] Check utm_source column exists
- [ ] Verify RT vouchers in database
- [ ] Test current implementation locally

### **During Deployment:**
- [ ] Copy all files to EvoucherPrototype
- [ ] Verify files copied correctly
- [ ] Check file permissions
- [ ] Restart PM2
- [ ] Check logs for errors

### **After Deployment:**
- [ ] Test regular homepage
- [ ] Test RT homepage (RT01, RT02)
- [ ] Test regular download
- [ ] Test RT download
- [ ] Check downloaded image files
- [ ] Verify database records
- [ ] Check admin panel
- [ ] Monitor for 30 minutes

---

**Deployment Status:** Ready ✅  
**Risk Level:** MEDIUM (major feature update)  
**Rollback Plan:** Available ✅  
**Estimated Downtime:** < 2 minutes (during restart)

---

**Good luck with deployment! 🚀**
