# 🎯 Fix: Downloaded Voucher Image (Server-Side)

**Date:** 4 Desember 2024  
**Issue:** Voucher image yang di-download user tetap pakai template regular, bukan RT

---

## 🔍 Root Cause

### Misunderstanding:
Awalnya saya pikir masalahnya di **webpage background** (client-side).  
Ternyata masalahnya di **voucher image yang di-generate server** (server-side)!

### The Real Problem:

**Ada 2 jenis image:**

1. **Webpage Background** (Client-side) ✅ SUDAH FIX
   - `homepage-1.jpeg` → Initial homepage
   - `homepage-2.png` → Voucher display background
   - Ini yang user lihat di browser
   - **Sudah fixed** dengan logic di `script.js`

2. **Downloaded Voucher Image** (Server-side) ❌ BELUM FIX
   - Image JPG/PNG yang di-generate server
   - User download file ini
   - Di-generate di `server.js` pakai Canvas
   - **Ini yang masih hardcoded!**

---

## 🐛 Bug Location

### File: `server.js`
### Endpoint: `/api/download-voucher/:downloadId`
### Line: ~1332

**Before Fix:**
```javascript
// Load background image (homepage-2.png)
const backgroundImage = new Image();
const fs = require('fs');
const backgroundPath = path.join(__dirname, 'public/images/homepage-2.png');  // ❌ HARDCODED!

// Check if background image exists
if (!fs.existsSync(backgroundPath)) {
  return res.status(500).json({ error: 'Background image not found' });
}
```

**Problem:**
- Selalu pakai `homepage-2.png` untuk semua user
- Tidak check `download.utm_source`
- RT user dapat voucher dengan regular template

---

## ✅ Solution

### After Fix:
```javascript
// Load background image based on UTM source
const backgroundImage = new Image();
const fs = require('fs');

// Determine background based on UTM source
let backgroundFilename = 'homepage-2.png'; // Default for regular/direct
if (download.utm_source === 'RT01' || download.utm_source === 'RT02') {
  backgroundFilename = 'homepage-2-rt.png'; // RT voucher background
}

const backgroundPath = path.join(__dirname, 'public/images', backgroundFilename);

console.log(`Generating voucher image for UTM: ${download.utm_source}, using background: ${backgroundFilename}`);

// Check if background image exists, fallback to default if not found
let finalBackgroundPath = backgroundPath;
if (!fs.existsSync(backgroundPath)) {
  console.warn(`Background ${backgroundFilename} not found, falling back to default`);
  finalBackgroundPath = path.join(__dirname, 'public/images/homepage-2.png');
  if (!fs.existsSync(finalBackgroundPath)) {
    return res.status(500).json({ error: 'Background image not found' });
  }
}

// Load image from file
backgroundImage.src = fs.readFileSync(finalBackgroundPath);
```

**Changes:**
1. ✅ Check `download.utm_source` from database
2. ✅ Use `homepage-2-rt.png` for RT01/RT02
3. ✅ Use `homepage-2.png` for direct/regular
4. ✅ Fallback to default if RT template not found
5. ✅ Console log for debugging

---

## 🎨 Complete Image Flow

### Regular User (direct):
```
1. Homepage Background (webpage):
   → homepage-1.jpeg

2. Voucher Display Background (webpage):
   → homepage-2.png

3. Downloaded Voucher Image (file):
   → Generated with homepage-2.png template ✅
```

### RT User (RT01/RT02):
```
1. Homepage Background (webpage):
   → homepage-rt.jpeg

2. Voucher Display Background (webpage):
   → homepage-2-rt.png

3. Downloaded Voucher Image (file):
   → Generated with homepage-2-rt.png template ✅
```

---

## 🧪 Testing

### Test 1: Regular User Download

```bash
# 1. Access without UTM
http://localhost:3000

# 2. Enter phone & download

# 3. Check server logs
# Should see:
Generating voucher image for UTM: direct, using background: homepage-2.png

# 4. Download the voucher image file

# 5. Open downloaded image
# Should see: Regular template (current design)
```

### Test 2: RT User Download

```bash
# 1. Access with RT UTM
http://localhost:3000?utm_source=RT01

# 2. Enter phone & download

# 3. Check server logs
# Should see:
Generating voucher image for UTM: RT01, using background: homepage-2-rt.png

# 4. Download the voucher image file

# 5. Open downloaded image
# Should see: RT template (green theme) ✅
```

---

## 📊 Database Check

**Verify UTM source is saved:**

```sql
SELECT 
  id,
  phone_number,
  utm_source,
  download_time
FROM downloads
ORDER BY id DESC
LIMIT 10;
```

**Expected:**
- Regular users: `utm_source = 'direct'`
- RT users: `utm_source = 'RT01'` or `'RT02'`

---

## 🔧 Troubleshooting

### Issue: Still using regular template

**Check server logs:**
```bash
# Should see this when user downloads:
Generating voucher image for UTM: RT01, using background: homepage-2-rt.png
```

**If shows:**
```bash
Generating voucher image for UTM: direct, using background: homepage-2.png
```

→ **Problem:** UTM not saved in database correctly

**Debug:**
```sql
-- Check specific download
SELECT * FROM downloads WHERE id = [downloadId];

-- Check utm_source value
-- Should be 'RT01', 'RT02', or 'direct'
```

---

### Issue: Fallback to default

**Server logs show:**
```bash
Background homepage-2-rt.png not found, falling back to default
```

→ **Problem:** File `homepage-2-rt.png` tidak ada

**Solution:**
```bash
# 1. Generate the image
# Open: create-rt-voucher-placeholder.html
# Download: homepage-2-rt.png

# 2. Upload to server
cp homepage-2-rt.png public/images/

# 3. Verify
ls -la public/images/homepage-2-rt.png

# 4. Restart server
pm2 restart voucher-app
```

---

### Issue: Error "Background image not found"

**Both files missing!**

**Solution:**
```bash
# Check files exist
ls -la public/images/homepage-2.png
ls -la public/images/homepage-2-rt.png

# If missing, restore/generate them
```

---

## ✅ Verification Steps

### Step 1: Check Files Exist
```bash
ls -la public/images/homepage-2.png      # Regular template
ls -la public/images/homepage-2-rt.png   # RT template
```

### Step 2: Restart Server
```bash
pm2 restart voucher-app
# Or
npm start
```

### Step 3: Test Regular Download
```bash
# Access: http://localhost:3000
# Download voucher
# Check downloaded image file
```

### Step 4: Test RT Download
```bash
# Access: http://localhost:3000?utm_source=RT01
# Download voucher
# Check downloaded image file (should be RT template!)
```

### Step 5: Check Server Logs
```bash
pm2 logs voucher-app --lines 50

# Look for:
# "Generating voucher image for UTM: RT01, using background: homepage-2-rt.png"
```

---

## 📝 Files Modified

```
Modified:
  server.js  (Line ~1328-1355)
    - Added UTM source check
    - Dynamic background selection
    - Fallback logic
    - Debug logging

Required Files:
  public/images/homepage-2.png      (existing - regular template)
  public/images/homepage-2-rt.png   (new - RT template)
```

---

## 🎯 Summary

### What Was Fixed:

**Before:**
- ❌ All downloaded vouchers use `homepage-2.png`
- ❌ RT users get regular template
- ❌ No differentiation in downloaded file

**After:**
- ✅ Regular users get `homepage-2.png` template
- ✅ RT users get `homepage-2-rt.png` template
- ✅ Full consistency from webpage to downloaded file
- ✅ Fallback to default if RT template missing
- ✅ Server logs for debugging

---

## 🚀 Next Steps

1. **Generate RT template:** Use `create-rt-voucher-placeholder.html`
2. **Upload to server:** Copy `homepage-2-rt.png` to `public/images/`
3. **Restart server:** `pm2 restart voucher-app`
4. **Test both flows:** Regular and RT downloads
5. **Verify downloaded files:** Check actual image files

---

**Status:** ✅ Code fixed, ready for testing after RT template upload!
