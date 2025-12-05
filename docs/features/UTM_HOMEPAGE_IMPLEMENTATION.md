# 🏘️ UTM-Based Homepage Implementation

**Date:** 4 Desember 2024  
**Feature:** Different homepage background based on UTM source

---

## ✅ What's Implemented

Homepage sekarang akan menampilkan **background image berbeda** berdasarkan UTM source:

- **RT01 / RT02** → `images/homepage-rt.jpeg` (RT community theme)
- **direct / no UTM** → `images/homepage-1.jpeg` (Regular theme)

---

## 📝 Changes Made

### 1. **Modified: `public/script.js`**

Added image swap logic in `captureUTM()` function:

```javascript
// Swap background image based on UTM source
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // RT Homepage - use RT background
  backgroundImage.src = 'images/homepage-rt.jpeg';
  backgroundImage.alt = 'Promo Khusus Warga RT';
  console.log('Loading RT homepage background');
} else {
  // Regular Homepage - use regular background
  backgroundImage.src = 'images/homepage-1.jpeg';
  backgroundImage.alt = 'Promo';
  console.log('Loading regular homepage background');
}
```

**Location:** Line ~24-35 in `captureUTM()` function

---

## 🎨 Image Setup

### Current Status:

✅ **Regular Homepage:** `public/images/homepage-1.jpeg` (existing)  
✅ **Regular Voucher:** `public/images/homepage-2.png` (existing)  
⏳ **RT Homepage:** `public/images/homepage-rt.jpeg` (temporary placeholder needed)  
⏳ **RT Voucher:** `public/images/homepage-2-rt.png` (temporary placeholder needed)

### How to Create Temporary Placeholders:

#### 1. RT Homepage Background:
1. **Open:** `create-rt-placeholder.html` in browser
2. **Click:** "Download RT Placeholder" button
3. **Save as:** `homepage-rt.jpeg`
4. **Upload to:** `public/images/` folder

#### 2. RT Voucher Background:
1. **Open:** `create-rt-voucher-placeholder.html` in browser
2. **Click:** "Download RT Voucher Background" button
3. **Save as:** `homepage-2-rt.png`
4. **Upload to:** `public/images/` folder

### Placeholder Specs:

#### RT Homepage (homepage-rt.jpeg):
- **Size:** 1200 x 1600 pixels
- **Format:** JPEG
- **Theme:** Green gradient (community-focused)
- **Content:**
  - 🏘️ Community icon
  - "E-VOUCHER KHUSUS WARGA RT" title
  - RT-specific benefits
  - Temporary watermark

#### RT Voucher Background (homepage-2-rt.png):
- **Size:** 1200 x 1600 pixels
- **Format:** PNG
- **Theme:** Subtle green (voucher-focused)
- **Content:**
  - Light green gradient background
  - "Voucher Warga RT" header
  - Voucher display area (for QR & details)
  - RT branding elements
  - Temporary watermark

---

## 🧪 Testing

### Test Scenarios:

#### 1. **Regular Homepage (Default)**
```
URL: http://localhost:3000
Expected: Shows homepage-1.jpeg
Console: "Loading regular homepage background"
```

#### 2. **RT Homepage (RT01)**
```
URL: http://localhost:3000?utm_source=RT01
Expected: Shows homepage-rt.jpeg
Console: "Loading RT homepage background"
```

#### 3. **RT Homepage (RT02)**
```
URL: http://localhost:3000?utm_source=RT02
Expected: Shows homepage-rt.jpeg
Console: "Loading RT homepage background"
```

#### 4. **Regular Homepage (Direct)**
```
URL: http://localhost:3000?utm_source=direct
Expected: Shows homepage-1.jpeg
Console: "Loading regular homepage background"
```

#### 5. **Invalid UTM**
```
URL: http://localhost:3000?utm_source=RT03
Expected: Error message, download disabled
Console: "Invalid UTM source: RT03"
```

---

## 🚀 Deployment Steps

### Step 1: Create Placeholder Image
```bash
# 1. Open create-rt-placeholder.html in browser
# 2. Download the generated image
# 3. Save as: homepage-rt.jpeg
```

### Step 2: Upload Image
```bash
# Upload to server
scp homepage-rt.jpeg user@server:/var/www/EvoucherPrototype/public/images/

# Or if deploying to current directory
cp homepage-rt.jpeg public/images/
```

### Step 3: Deploy Code
```bash
# Copy updated script.js to production
cp public/script.js /var/www/EvoucherPrototype/public/

# Or if using current directory
# (already updated)
```

### Step 4: Test
```bash
# Test regular homepage
curl -I http://localhost:3000

# Test RT homepage
curl -I http://localhost:3000?utm_source=RT01
```

### Step 5: Restart (if needed)
```bash
# Only if using PM2 and need to clear cache
pm2 restart voucher-app
```

---

## 🔄 Future Updates

### When Final Design is Ready:

1. **Get final design** from designer
2. **Save as:** `homepage-rt.jpeg` (same filename)
3. **Replace** the temporary placeholder
4. **No code changes needed!** Just replace the image file

### Recommended Image Specs:

- **Format:** JPEG or PNG
- **Size:** 1200 x 1600 pixels (or match homepage-1.jpeg size)
- **File size:** < 500KB (optimized for web)
- **Theme:** RT community-focused
- **Content suggestions:**
  - RT community imagery
  - Neighborhood/local vibes
  - Warm, friendly colors
  - RT-specific messaging

---

## 🎯 How It Works

### Technical Flow:

```
1. User clicks link with UTM parameter
   ↓
2. Browser loads index.html
   ↓
3. script.js executes captureUTM()
   ↓
4. JavaScript reads utm_source from URL
   ↓
5. If RT01/RT02: Set backgroundImage.src = 'homepage-rt.jpeg'
   If direct/none: Set backgroundImage.src = 'homepage-1.jpeg'
   ↓
6. Browser loads the correct image
   ↓
7. User sees appropriate homepage
   ↓
8. User enters phone & clicks download
   ↓
9. After successful download:
   If RT01/RT02: Set backgroundImage.src = 'homepage-2-rt.png'
   If direct/none: Set backgroundImage.src = 'homepage-2.png'
   ↓
10. User sees voucher with consistent RT/Regular theme
```

### Key Points:

- ✅ **Same HTML file** (index.html)
- ✅ **Same JavaScript file** (script.js)
- ✅ **Same URL structure** (just different query parameter)
- ✅ **No server-side routing** needed
- ✅ **No duplicate code** or folders
- ✅ **Instant image swap** (client-side)

---

## 🐛 Troubleshooting

### Issue: RT image not showing

**Check:**
```bash
# 1. Verify file exists
ls -la public/images/homepage-rt.jpeg

# 2. Check file permissions
chmod 644 public/images/homepage-rt.jpeg

# 3. Check browser console for errors
# Open DevTools → Console → Look for 404 errors
```

**Solution:**
- Ensure `homepage-rt.jpeg` exists in `public/images/`
- Check filename spelling (case-sensitive)
- Clear browser cache (Ctrl+Shift+R)

### Issue: Still showing old image

**Solution:**
```bash
# Clear browser cache
# Or add cache-busting parameter temporarily
backgroundImage.src = 'images/homepage-rt.jpeg?v=1';
```

### Issue: Image loads slowly

**Solution:**
```bash
# Optimize image file size
# Use online tools like TinyJPG or ImageOptim
# Target: < 500KB file size
```

---

## 📊 Monitoring

### Check Image Usage:

```javascript
// Add to script.js for analytics (optional)
console.log('Homepage loaded:', {
  utm_source: utmSource,
  image: backgroundImage.src,
  timestamp: new Date().toISOString()
});
```

### Server-side Tracking:

Already tracked in database via `utm_source` field in downloads table.

Query to check RT vs Regular usage:
```sql
SELECT 
  utm_source,
  COUNT(*) as downloads
FROM downloads
WHERE utm_source IN ('RT01', 'RT02', 'direct')
GROUP BY utm_source;
```

---

## ✅ Checklist

### Implementation:
- [x] Update `public/script.js` with image swap logic
- [x] Create placeholder generator (`create-rt-placeholder.html`)
- [ ] Generate temporary RT placeholder image
- [ ] Upload `homepage-rt.jpeg` to `public/images/`
- [ ] Test with `?utm_source=RT01`
- [ ] Test with `?utm_source=RT02`
- [ ] Test with `?utm_source=direct`
- [ ] Test without UTM parameter

### Production Deployment:
- [ ] Copy `script.js` to production
- [ ] Upload `homepage-rt.jpeg` to production
- [ ] Test production URLs
- [ ] Monitor for errors
- [ ] Update documentation

### Future:
- [ ] Get final RT design from designer
- [ ] Replace temporary placeholder
- [ ] Optimize image file size
- [ ] Consider adding more UTM-specific customizations

---

## 📚 Related Documentation

- `RT_VOUCHER_FINAL_SUMMARY.md` - RT Voucher implementation overview
- `PHASE1_IMPLEMENTATION_SUMMARY.md` - Phase 1 details
- `COMPARISON_CURRENT_VS_PROTOTYPE.md` - Current vs old comparison

---

## 💡 Notes

### Why This Approach:

1. **Simple:** Only 10 lines of code added
2. **Maintainable:** Single codebase, easy to update
3. **Flexible:** Easy to add more UTM sources later
4. **Fast:** Client-side image swap, no server processing
5. **Safe:** No breaking changes, easy rollback

### Future Enhancements (Optional):

- Add fade-in animation for image swap
- Preload both images for faster switching
- Add different text/copy based on UTM
- Add different color themes
- Track image load performance

---

**Status:** ✅ Code implemented, waiting for RT placeholder image upload

**Next Step:** Generate and upload `homepage-rt.jpeg` using `create-rt-placeholder.html`
