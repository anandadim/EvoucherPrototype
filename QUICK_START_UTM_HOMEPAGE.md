# 🚀 Quick Start: UTM Homepage Implementation

## ✅ What's Done:

1. ✅ **Code updated** - `public/script.js` sudah diupdate
2. ✅ **Placeholder generator ready** - `create-rt-placeholder.html` siap dipakai
3. ✅ **Documentation complete** - `UTM_HOMEPAGE_IMPLEMENTATION.md`

---

## 📋 Next Steps (4 Steps):

### Step 1: Generate RT Homepage Image (2 minutes)

```bash
# 1. Buka file ini di browser:
create-rt-placeholder.html

# 2. Klik tombol: "Download RT Placeholder"
# 3. Save as: homepage-rt.jpeg
```

### Step 2: Generate RT Voucher Background (2 minutes)

```bash
# 1. Buka file ini di browser:
create-rt-voucher-placeholder.html

# 2. Klik tombol: "Download RT Voucher Background"
# 3. Save as: homepage-2-rt.png
```

### Step 3: Upload Images (1 minute)

```bash
# Copy ke folder images
cp homepage-rt.jpeg public/images/
cp homepage-2-rt.png public/images/

# Atau kalau di server:
scp homepage-rt.jpeg homepage-2-rt.png user@server:/var/www/EvoucherPrototype/public/images/
```

### Step 4: Test (2 minutes)

```bash
# Test 1: Regular homepage
http://localhost:3000
Expected: homepage-1.jpeg

# Test 2: RT homepage
http://localhost:3000?utm_source=RT01
Expected: homepage-rt.jpeg

# Test 3: Download regular voucher
1. Access: http://localhost:3000
2. Enter phone & download
Expected: homepage-2.png (after download)

# Test 4: Download RT voucher
1. Access: http://localhost:3000?utm_source=RT01
2. Enter phone & download
Expected: homepage-2-rt.png (after download)
```

---

## 🎯 Expected Results:

### Regular Flow:
```
1. Homepage: http://localhost:3000
   → Image: homepage-1.jpeg (existing)
   
2. After Download:
   → Image: homepage-2.png (existing)
```

### RT Flow:
```
1. Homepage: http://localhost:3000?utm_source=RT01
   → Image: homepage-rt.jpeg (green RT theme)
   
2. After Download:
   → Image: homepage-2-rt.png (green voucher background)
```

---

## 🔄 When Final Design Ready:

```bash
# Just replace the image files, no code changes!
cp final-rt-homepage.jpeg public/images/homepage-rt.jpeg
cp final-rt-voucher.png public/images/homepage-2-rt.png
```

---

## 📝 Files Changed:

```
Modified:
  public/script.js                    (added image swap logic for homepage & voucher)

Created:
  create-rt-placeholder.html          (RT homepage generator)
  create-rt-voucher-placeholder.html  (RT voucher background generator)
  UTM_HOMEPAGE_IMPLEMENTATION.md      (full documentation)
  QUICK_START_UTM_HOMEPAGE.md         (this file)

To Upload:
  public/images/homepage-rt.jpeg      (generate from create-rt-placeholder.html)
  public/images/homepage-2-rt.png     (generate from create-rt-voucher-placeholder.html)
```

---

## ✅ Checklist:

- [x] Code implementation (homepage + voucher)
- [x] Placeholder generators (2 files)
- [x] Documentation
- [ ] Generate RT homepage image (homepage-rt.jpeg)
- [ ] Generate RT voucher background (homepage-2-rt.png)
- [ ] Upload both to public/images/
- [ ] Test RT01 homepage
- [ ] Test RT01 download (voucher background)
- [ ] Test RT02 homepage
- [ ] Test RT02 download (voucher background)
- [ ] Test direct/regular flow

---

**Total Time:** ~8 minutes to complete all steps! 🎉
