# 🔧 Troubleshooting: UTM Images Not Showing

**Issue:** Voucher yang sudah ter-download masih pakai image direct, bukan RT

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

1. **Buka browser DevTools** (F12 atau Ctrl+Shift+I)
2. **Go to Console tab**
3. **Access dengan RT UTM:** `http://localhost:3000?utm_source=RT01`
4. **Download voucher**
5. **Check console logs:**

**Expected logs:**
```
Loading RT homepage background
UTM Source captured: RT01
=== VOUCHER DOWNLOAD SUCCESS ===
Current UTM Source: RT01
Is RT user? true
Loading RT voucher background: http://localhost:3000/images/homepage-2-rt.png
Final background image: http://localhost:3000/images/homepage-2-rt.png
================================
```

**If you see:**
```
Current UTM Source: direct  ← ❌ PROBLEM!
Is RT user? false
Loading regular voucher background: ...
```

→ **Problem:** sessionStorage tidak ter-set dengan benar

---

### Step 2: Check sessionStorage

**In browser console, paste:**
```javascript
console.log('UTM from sessionStorage:', sessionStorage.getItem('utm_source'));
```

**Expected:**
- If accessed with `?utm_source=RT01` → Should show: `RT01`
- If accessed with `?utm_source=RT02` → Should show: `RT02`
- If accessed without UTM → Should show: `direct`

**If shows `null` or wrong value:**
→ **Problem:** sessionStorage cleared or not set

---

### Step 3: Check Image File Exists

**In browser console, paste:**
```javascript
const img = new Image();
img.onload = () => console.log('✅ homepage-2-rt.png EXISTS');
img.onerror = () => console.log('❌ homepage-2-rt.png NOT FOUND (404)');
img.src = 'images/homepage-2-rt.png';
```

**If shows 404:**
→ **Problem:** File `homepage-2-rt.png` belum di-upload

---

### Step 4: Check Network Tab

1. **Open DevTools → Network tab**
2. **Filter by "Img"**
3. **Download voucher**
4. **Look for:** `homepage-2-rt.png` or `homepage-2.png`

**Check:**
- ✅ Status: 200 (OK)
- ❌ Status: 404 (Not Found)
- ❌ Status: 304 (Cached - might be old version)

---

## 🐛 Common Issues & Solutions

### Issue 1: sessionStorage Cleared

**Symptoms:**
- Console shows: `Current UTM Source: direct` (even with RT01 in URL)
- sessionStorage.getItem('utm_source') returns `null`

**Causes:**
- Browser privacy mode/incognito
- Browser extension clearing storage
- Page refresh without UTM parameter

**Solutions:**
```javascript
// Force set in console (temporary test)
sessionStorage.setItem('utm_source', 'RT01');
// Then try download again
```

**Permanent fix:**
- Always access with UTM parameter: `?utm_source=RT01`
- Don't refresh page without UTM parameter

---

### Issue 2: Image File Not Found (404)

**Symptoms:**
- Console shows: Loading RT voucher background
- But image doesn't change
- Network tab shows 404 for `homepage-2-rt.png`

**Causes:**
- File `homepage-2-rt.png` belum di-generate
- File belum di-upload ke `public/images/`
- Filename typo (case-sensitive!)

**Solutions:**
```bash
# 1. Generate the image
# Open: create-rt-voucher-placeholder.html
# Click: Download RT Voucher Background
# Save as: homepage-2-rt.png

# 2. Upload to correct location
cp homepage-2-rt.png public/images/

# 3. Verify file exists
ls -la public/images/homepage-2-rt.png

# 4. Check file permissions
chmod 644 public/images/homepage-2-rt.png
```

---

### Issue 3: Browser Cache

**Symptoms:**
- Code updated but still shows old behavior
- Console logs not appearing
- Old image still loading

**Solutions:**
```bash
# Hard refresh browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Or clear cache in DevTools
DevTools → Network tab → Check "Disable cache"
```

---

### Issue 4: Script Not Updated

**Symptoms:**
- Console logs from new code not appearing
- Old behavior persists

**Solutions:**
```bash
# 1. Check if script.js actually updated
# Look for this in public/script.js:
grep -n "VOUCHER DOWNLOAD SUCCESS" public/script.js

# Should show line number with the debug log

# 2. If not found, script not updated
# Re-apply the changes or copy from backup

# 3. Hard refresh browser after confirming file updated
```

---

## 🧪 Use Debug Tool

**Open:** `test-utm-debug.html` in browser

**Features:**
- ✅ Check current UTM status
- ✅ Simulate download logic
- ✅ Test sessionStorage
- ✅ Check image files exist
- ✅ Copy debug code for console

**Quick test:**
1. Open `test-utm-debug.html`
2. Click "Set RT01 in sessionStorage"
3. Click "Simulate Download"
4. Check if logic shows correct image

---

## 📋 Verification Checklist

### Before Testing:
- [ ] File `public/images/homepage-2-rt.png` exists
- [ ] File permissions correct (644)
- [ ] Browser cache cleared
- [ ] DevTools console open

### During Testing:
- [ ] Access with `?utm_source=RT01`
- [ ] Check console: "Loading RT homepage background"
- [ ] Check sessionStorage: `utm_source = RT01`
- [ ] Download voucher
- [ ] Check console: "Loading RT voucher background"
- [ ] Check Network tab: `homepage-2-rt.png` loaded (200)
- [ ] Visual: Background changed to RT theme

### If Still Not Working:
- [ ] Run debug tool (`test-utm-debug.html`)
- [ ] Check all console logs
- [ ] Verify sessionStorage value
- [ ] Test image URL directly in browser
- [ ] Check for JavaScript errors

---

## 🔬 Advanced Debugging

### Check Actual Background Image:

**In console:**
```javascript
const bg = document.getElementById('backgroundImage');
console.log('Current src:', bg.src);
console.log('Expected for RT:', window.location.origin + '/images/homepage-2-rt.png');
console.log('Match?', bg.src === window.location.origin + '/images/homepage-2-rt.png');
```

### Force Change Image (Test):

**In console:**
```javascript
// Force change to RT image
document.getElementById('backgroundImage').src = 'images/homepage-2-rt.png';

// Check if image loads
document.getElementById('backgroundImage').onload = () => console.log('✅ Image loaded!');
document.getElementById('backgroundImage').onerror = () => console.log('❌ Image failed to load!');
```

### Monitor sessionStorage Changes:

**In console:**
```javascript
// Watch for changes
const originalSetItem = sessionStorage.setItem;
sessionStorage.setItem = function(key, value) {
  console.log('sessionStorage.setItem:', key, '=', value);
  originalSetItem.apply(this, arguments);
};
```

---

## 💡 Quick Fix Script

**Paste in console untuk quick test:**

```javascript
// === QUICK FIX TEST ===
console.log('=== UTM IMAGE DEBUG ===');

// 1. Check current state
const currentUtm = sessionStorage.getItem('utm_source');
console.log('1. Current UTM:', currentUtm);

// 2. Check if RT user
const isRT = (currentUtm === 'RT01' || currentUtm === 'RT02');
console.log('2. Is RT user?', isRT);

// 3. Expected image
const expectedImage = isRT ? 'images/homepage-2-rt.png' : 'images/homepage-2.png';
console.log('3. Expected image:', expectedImage);

// 4. Current image
const bg = document.getElementById('backgroundImage');
console.log('4. Current image:', bg?.src);

// 5. Test if image exists
const testImg = new Image();
testImg.onload = () => console.log('5. ✅ Expected image EXISTS');
testImg.onerror = () => console.log('5. ❌ Expected image NOT FOUND');
testImg.src = expectedImage;

// 6. Force change (test)
if (bg) {
  console.log('6. Forcing image change to:', expectedImage);
  bg.src = expectedImage;
}

console.log('======================');
```

---

## 📞 Still Not Working?

**Provide these info:**

1. **Console logs** (copy all logs after download)
2. **sessionStorage value:** `sessionStorage.getItem('utm_source')`
3. **Network tab screenshot** (showing image requests)
4. **File exists?** `ls -la public/images/homepage-2-rt.png`
5. **Browser & version**
6. **Access URL** (with UTM parameter)

---

**Most Common Solution:** File `homepage-2-rt.png` belum di-upload! 😊
