# 🚨 Quick Fix Check

**Issue:** Voucher masih pakai image direct padahal akses dengan RT01

---

## ✅ File Check

```bash
✅ homepage-2-rt.png EXISTS in public/images/
```

File sudah ada, jadi bukan masalah file missing!

---

## 🔍 Kemungkinan Masalah:

### 1. **Browser Cache** (Most Likely!)

**Problem:** Browser masih pakai script.js yang lama (sebelum update)

**Solution:**
```bash
# Hard refresh browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Or in DevTools:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

---

### 2. **sessionStorage Cleared**

**Problem:** Refresh page tanpa UTM parameter

**Solution:**
```bash
# Always access dengan UTM:
http://localhost:3000?utm_source=RT01

# Jangan refresh tanpa UTM!
# Kalau refresh, UTM hilang → sessionStorage jadi 'direct'
```

---

### 3. **Script Belum Ter-reload**

**Problem:** File script.js updated tapi browser pakai cached version

**Check in console:**
```javascript
// Paste ini di browser console:
console.log('Script version check:');
console.log('Has debug logs?', 
  document.querySelector('script[src="script.js"]') !== null
);

// Reload script
const script = document.createElement('script');
script.src = 'script.js?v=' + Date.now();
document.body.appendChild(script);
```

---

## 🧪 Quick Test (Do This Now!)

### Test 1: Check Console Logs

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Clear console** (Ctrl+L)
4. **Access:** `http://localhost:3000?utm_source=RT01`
5. **Look for:**
   ```
   Loading RT homepage background
   UTM Source captured: RT01
   ```

**If you DON'T see these logs:**
→ Script.js belum ter-reload! Do hard refresh!

---

### Test 2: Check sessionStorage

**In console, paste:**
```javascript
console.log('UTM:', sessionStorage.getItem('utm_source'));
```

**Expected:** `RT01`

**If shows:** `direct` or `null`
→ Problem: sessionStorage tidak ter-set atau cleared

---

### Test 3: Manual Test

**In console, paste:**
```javascript
// Force set UTM
sessionStorage.setItem('utm_source', 'RT01');

// Check what image will be used
const currentUtmSource = sessionStorage.getItem('utm_source') || 'direct';
if (currentUtmSource === 'RT01' || currentUtmSource === 'RT02') {
  console.log('✅ Will use: images/homepage-2-rt.png');
} else {
  console.log('❌ Will use: images/homepage-2.png');
}
```

---

### Test 4: Force Image Change

**In console, paste:**
```javascript
// Force change background to RT image
const bg = document.getElementById('backgroundImage');
bg.src = 'images/homepage-2-rt.png';
console.log('Forced change to:', bg.src);

// Check if loads
bg.onload = () => console.log('✅ RT image loaded successfully!');
bg.onerror = () => console.log('❌ RT image failed to load!');
```

**If image changes:**
→ File OK, problem is in logic/sessionStorage

**If image doesn't change:**
→ File problem or path issue

---

## 💡 Most Likely Solution:

### **Do Hard Refresh!**

```bash
1. Close all tabs of localhost:3000
2. Clear browser cache
3. Open new tab
4. Access: http://localhost:3000?utm_source=RT01
5. Open DevTools Console
6. Check for new debug logs
7. Try download
```

**New debug logs should show:**
```
=== VOUCHER DOWNLOAD SUCCESS ===
Current UTM Source: RT01
Is RT user? true
Loading RT voucher background: http://localhost:3000/images/homepage-2-rt.png
Final background image: http://localhost:3000/images/homepage-2-rt.png
================================
```

---

## 📊 Diagnostic Results:

**Run this in console and share output:**

```javascript
console.log('=== DIAGNOSTIC ===');
console.log('1. URL:', window.location.href);
console.log('2. UTM from URL:', new URLSearchParams(window.location.search).get('utm_source'));
console.log('3. UTM from storage:', sessionStorage.getItem('utm_source'));
console.log('4. Background src:', document.getElementById('backgroundImage')?.src);
console.log('5. File exists test...');

const img = new Image();
img.onload = () => console.log('   ✅ homepage-2-rt.png EXISTS');
img.onerror = () => console.log('   ❌ homepage-2-rt.png NOT FOUND');
img.src = 'images/homepage-2-rt.png';

console.log('==================');
```

**Share the output so I can help debug further!** 😊

---

## 🎯 Expected Flow:

```
1. Access: http://localhost:3000?utm_source=RT01
   → Console: "Loading RT homepage background"
   → Console: "UTM Source captured: RT01"
   → Background: homepage-rt.jpeg ✅

2. Enter phone & download
   → Console: "=== VOUCHER DOWNLOAD SUCCESS ==="
   → Console: "Current UTM Source: RT01"
   → Console: "Is RT user? true"
   → Console: "Loading RT voucher background: .../homepage-2-rt.png"
   → Background: homepage-2-rt.png ✅
```

**If any step fails, that's where the problem is!**
