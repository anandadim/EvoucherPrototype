# Deployment Checklist - December 3, 2024

## 📦 Files to Upload

### ✅ Core Application Files (MUST UPLOAD):

1. **server.js**
   - RT voucher logic (Phase 1)
   - Admin stats endpoint (Phase 2)
   - CSV template endpoint (Phase 3)
   - ADS- voucher support
   - UTM validation

2. **public/script.js**
   - UTM source handling
   - UTM validation (frontend)
   - Error messages for invalid UTM

3. **public/admin-script.js**
   - Pagination for all sections
   - RT vs Regular stats display
   - Warning banner logic

4. **public/admin.html**
   - Pagination containers
   - Separate stats UI (RT vs Regular)
   - CSV template download button
   - Warning banner element

---

## 📋 Summary of Changes

### Session 1 & 2 Changes:

#### 1. Pagination (Part 2) ✅
- **Files:** `public/admin-script.js`, `public/admin.html`
- **What:** Added pagination to Log Aktivitas and Batch History
- **Impact:** Better UX, no more long scrolling

#### 2. CSV Export Improvement ✅
- **Files:** `server.js`
- **What:** Removed voucher_code, added utm_source column
- **Impact:** Cleaner CSV with relevant data

#### 3. RT Voucher Implementation (Phase 1-3) ✅
- **Files:** `server.js`, `public/script.js`, `public/admin-script.js`, `public/admin.html`
- **What:** 
  - Separate voucher pools (RT vs Regular)
  - Admin stats with warnings
  - CSV template download
- **Impact:** Support for RT01/RT02 users with dedicated vouchers

#### 4. ADS- Voucher Support ✅
- **Files:** `server.js`
- **What:** ADS- vouchers now work as regular vouchers
- **Impact:** Existing vouchers continue to work

#### 5. UTM Validation ✅
- **Files:** `server.js`, `public/script.js`
- **What:** Block invalid UTM sources (only RT01, RT02, direct allowed)
- **Impact:** Security, prevent abuse

---

## 🚀 Deployment Steps

### Step 1: Backup Current Files
```bash
# SSH to server
ssh user@server

# Navigate to app directory
cd /var/www/voucher-app

# Create backup directory
mkdir -p backups/backup-$(date +%Y%m%d-%H%M%S)

# Backup current files
cp server.js backups/backup-$(date +%Y%m%d-%H%M%S)/
cp public/script.js backups/backup-$(date +%Y%m%d-%H%M%S)/
cp public/admin-script.js backups/backup-$(date +%Y%m%d-%H%M%S)/
cp public/admin.html backups/backup-$(date +%Y%m%d-%H%M%S)/
```

---

### Step 2: Upload Files

#### Option A: Using Git (Recommended)
```bash
# On local machine
git add server.js public/script.js public/admin-script.js public/admin.html
git commit -m "Complete RT voucher implementation + ADS support + UTM validation"
git push

# On server
cd /var/www/voucher-app
git pull
```

#### Option B: Using SCP
```bash
# From local machine
scp server.js user@server:/var/www/voucher-app/
scp public/script.js user@server:/var/www/voucher-app/public/
scp public/admin-script.js user@server:/var/www/voucher-app/public/
scp public/admin.html user@server:/var/www/voucher-app/public/
```

#### Option C: Using FTP/SFTP
Upload these 4 files using FileZilla or similar:
- `server.js` → `/var/www/voucher-app/`
- `public/script.js` → `/var/www/voucher-app/public/`
- `public/admin-script.js` → `/var/www/voucher-app/public/`
- `public/admin.html` → `/var/www/voucher-app/public/`

---

### Step 3: Upload RT Vouchers (IMPORTANT!)
```bash
# Before restarting, upload RT vouchers via admin panel
# 1. Login to admin panel
# 2. Go to "Manajemen Voucher SRP"
# 3. Upload CSV file: voucher_numbers_RTT_1764750961423.csv (25 vouchers)
# 4. Verify upload successful
```

**Note:** RT vouchers MUST be uploaded before users can access RT01/RT02 links!

---

### Step 4: Restart Application
```bash
# SSH to server
ssh user@server

# Restart PM2
pm2 restart voucher-app

# Or restart Node.js (if not using PM2)
# pkill node
# node server.js &

# Check status
pm2 status

# View logs
pm2 logs voucher-app --lines 50
```

---

### Step 5: Verify Deployment

#### Check 1: Server Running
```bash
# Check if server is running
pm2 status
# Should show: online

# Check logs for errors
pm2 logs voucher-app --lines 20
# Should see: "Server running on port 3000"
```

#### Check 2: Test Frontend
```bash
# Test URLs (replace with your domain)
curl https://voucher.tdn.id/
# Should return HTML

curl https://voucher.tdn.id/?utm_source=RT01
# Should return HTML

curl https://voucher.tdn.id/?utm_source=RT03
# Should show error in page
```

#### Check 3: Test Admin Panel
1. Login to admin panel
2. Check stats display (should show RT and Regular separately)
3. Check pagination works
4. Download CSV template
5. Verify no JavaScript errors in console

---

## ✅ Post-Deployment Testing

### Test 1: RT01 Download
- URL: `https://voucher.tdn.id/?utm_source=RT01`
- Enter phone: 628123456789
- Click download
- **Expected:** Gets RTT- voucher

### Test 2: RT02 Download
- URL: `https://voucher.tdn.id/?utm_source=RT02`
- Enter phone: 628123456790
- Click download
- **Expected:** Gets RTT- voucher

### Test 3: Direct Download
- URL: `https://voucher.tdn.id/`
- Enter phone: 628123456791
- Click download
- **Expected:** Gets ADS- voucher

### Test 4: Invalid UTM (RT03)
- URL: `https://voucher.tdn.id/?utm_source=RT03`
- **Expected:** Error message shown, button disabled

### Test 5: Admin Stats
- Login to admin panel
- Check "Manajemen Voucher SRP" section
- **Expected:** 
  - Regular Vouchers (SRP- or ADS-) stats shown
  - RT Vouchers (RTT-) stats shown
  - Warning banner if RT < 100

### Test 6: CSV Template
- Go to "Generate Voucher Images (Bulk)"
- Click "Download Template CSV"
- **Expected:** Template downloads with examples

### Test 7: CSV Export
- Click "Download CSV" in admin panel
- Open CSV file
- **Expected:** Columns include utm_source, no voucher_code

---

## 🔍 Troubleshooting

### Issue 1: Server won't start
**Check:**
```bash
pm2 logs voucher-app --lines 50
# Look for syntax errors or missing dependencies
```

**Fix:**
- Restore from backup
- Check file permissions
- Verify Node.js version

---

### Issue 2: "Voucher habis" error
**Check:**
```bash
# SSH to server
cd /var/www/voucher-app
node check-vouchers.js
```

**Expected Output:**
```
📦 Regular Vouchers (SRP- or ADS-): Available > 0
🏘️ RT Vouchers (RTT-): Available > 0
```

**Fix:**
- Upload RT vouchers via admin panel
- Verify ADS- vouchers exist in database

---

### Issue 3: Invalid UTM not blocked
**Check:**
- Clear browser cache
- Check browser console for errors
- Verify script.js uploaded correctly

**Fix:**
- Re-upload public/script.js
- Hard refresh browser (Ctrl+F5)

---

### Issue 4: Admin stats not showing
**Check:**
- Browser console for JavaScript errors
- Network tab for API errors

**Fix:**
- Re-upload public/admin-script.js
- Re-upload public/admin.html
- Clear browser cache

---

## 📊 Database Verification

### Check Voucher Status:
```bash
# On server
cd /var/www/voucher-app
node check-vouchers.js
```

**Expected:**
```
📦 Regular Vouchers (SRP- or ADS-): Total > 0, Available > 0
🏘️ RT Vouchers (RTT-): Total > 0, Available > 0
✅ Both voucher types available
```

---

## 🔄 Rollback Plan (If Needed)

### If deployment fails:
```bash
# SSH to server
cd /var/www/voucher-app

# Restore from backup
cp backups/backup-YYYYMMDD-HHMMSS/server.js ./
cp backups/backup-YYYYMMDD-HHMMSS/script.js public/
cp backups/backup-YYYYMMDD-HHMMSS/admin-script.js public/
cp backups/backup-YYYYMMDD-HHMMSS/admin.html public/

# Restart
pm2 restart voucher-app

# Verify
pm2 logs voucher-app --lines 20
```

---

## 📝 Files Summary

### Files to Upload (4 files):
1. ✅ `server.js` (root directory)
2. ✅ `public/script.js`
3. ✅ `public/admin-script.js`
4. ✅ `public/admin.html`

### Files NOT to Upload (documentation):
- ❌ All `.md` files (documentation only)
- ❌ `check-vouchers.js` (optional, for debugging)
- ❌ `fix-ads-vouchers.js` (already applied)
- ❌ `test-utm-validation.md` (documentation)

### Optional Files (for debugging):
- `check-vouchers.js` (useful for checking voucher status)

---

## ⚠️ Important Notes

### Before Deployment:
1. ✅ Backup current files
2. ✅ Test locally first
3. ✅ Prepare RT vouchers CSV
4. ✅ Notify users (if needed)

### After Deployment:
1. ✅ Upload RT vouchers immediately
2. ✅ Test all URLs (RT01, RT02, direct, invalid)
3. ✅ Check admin panel
4. ✅ Monitor logs for errors
5. ✅ Verify stats display correctly

### Critical:
- **RT vouchers MUST be uploaded** before sharing RT01/RT02 links
- **Test invalid UTM** (RT03) to verify blocking works
- **Check ADS- vouchers** still work for direct users

---

## 📞 Support

### If Issues Occur:
1. Check PM2 logs: `pm2 logs voucher-app`
2. Check browser console for errors
3. Run `node check-vouchers.js` to verify database
4. Restore from backup if needed

### Contact:
- Check documentation in `.md` files
- Review testing guides (PHASE1/2/3_TESTING_GUIDE.md)

---

## ✅ Deployment Checklist

- [ ] Backup current files
- [ ] Upload 4 files (server.js, script.js, admin-script.js, admin.html)
- [ ] Upload RT vouchers CSV (25 vouchers)
- [ ] Restart PM2
- [ ] Check server logs (no errors)
- [ ] Test RT01 download
- [ ] Test RT02 download
- [ ] Test direct download
- [ ] Test invalid UTM (RT03)
- [ ] Check admin stats
- [ ] Download CSV template
- [ ] Verify CSV export
- [ ] Monitor for 30 minutes
- [ ] All tests pass ✅

---

**Deployment Date:** December 3, 2024
**Status:** Ready for Production
**Risk Level:** LOW (backward compatible)

---

**Good luck with deployment! 🚀**
