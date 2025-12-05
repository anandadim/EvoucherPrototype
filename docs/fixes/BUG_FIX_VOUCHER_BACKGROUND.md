# 🐛 Bug Fix: RT Voucher Background

**Date:** 4 Desember 2024  
**Issue:** Setelah download, background kembali ke regular image (tidak maintain RT theme)

---

## 🔍 Problem

### Before Fix:
```
1. User akses: ?utm_source=RT01
   → Homepage: homepage-rt.jpeg ✅
   
2. User download voucher
   → Background: homepage-2.png ❌ (regular, bukan RT!)
```

**Root Cause:** Code hardcoded `homepage-2.png` untuk semua user, tidak check UTM source.

---

## ✅ Solution

### After Fix:
```
1. User akses: ?utm_source=RT01
   → Homepage: homepage-rt.jpeg ✅
   
2. User download voucher
   → Background: homepage-2-rt.png ✅ (RT theme maintained!)
```

**Implementation:** Check `sessionStorage.utm_source` setelah download, pakai image yang sesuai.

---

## 🔧 Code Changes

### Modified: `public/script.js`

**Before:**
```javascript
if (data.success) {
  isDownloaded = true;
  
  // Change background to homepage-2
  backgroundImage.src = 'images/homepage-2.png';  // ❌ Hardcoded!
  
  // Hide form, show voucher
  formOverlay.style.display = 'none';
  voucherOverlay.style.display = 'block';
```

**After:**
```javascript
if (data.success) {
  isDownloaded = true;
  
  // Change background based on UTM source (maintain consistency)
  const currentUtmSource = sessionStorage.getItem('utm_source') || 'direct';
  if (currentUtmSource === 'RT01' || currentUtmSource === 'RT02') {
    backgroundImage.src = 'images/homepage-2-rt.png';  // ✅ RT theme!
  } else {
    backgroundImage.src = 'images/homepage-2.png';     // ✅ Regular theme!
  }
  
  // Hide form, show voucher
  formOverlay.style.display = 'none';
  voucherOverlay.style.display = 'block';
```

---

## 🎨 New Asset Required

### File: `public/images/homepage-2-rt.png`

**Purpose:** Voucher background untuk RT users (setelah download)

**How to Create:**
1. Open: `create-rt-voucher-placeholder.html`
2. Click: "Download RT Voucher Background"
3. Save as: `homepage-2-rt.png`
4. Upload to: `public/images/`

**Design:**
- Subtle green gradient (less prominent than homepage)
- "Voucher Warga RT" header
- Voucher display area (for QR & details)
- RT branding elements
- Professional, voucher-focused design

---

## 🧪 Testing

### Test Case 1: Regular User
```
1. Access: http://localhost:3000
2. Download voucher
3. Expected: homepage-2.png (existing regular background)
```

### Test Case 2: RT User (RT01)
```
1. Access: http://localhost:3000?utm_source=RT01
2. Download voucher
3. Expected: homepage-2-rt.png (new RT background)
```

### Test Case 3: RT User (RT02)
```
1. Access: http://localhost:3000?utm_source=RT02
2. Download voucher
3. Expected: homepage-2-rt.png (new RT background)
```

---

## 📊 Complete Image Flow

### Regular User Flow:
```
Homepage → Download → Voucher
   ↓          ↓          ↓
homepage-1.jpeg → homepage-2.png
```

### RT User Flow:
```
Homepage → Download → Voucher
   ↓          ↓          ↓
homepage-rt.jpeg → homepage-2-rt.png
```

---

## ✅ Status

- [x] Bug identified
- [x] Code fixed
- [x] Placeholder generator created
- [ ] Generate homepage-2-rt.png
- [ ] Upload to production
- [ ] Test all scenarios

---

**Impact:** Full RT theme consistency from homepage to voucher display! 🎉
