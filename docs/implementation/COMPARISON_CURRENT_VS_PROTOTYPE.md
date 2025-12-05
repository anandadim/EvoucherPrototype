# 📊 Comparison: Current Implementation vs EvoucherPrototype

**Tanggal Analisa:** 4 Desember 2024

---

## 🎯 KESIMPULAN UTAMA

**EvoucherPrototype = VERSI LAMA (sebelum RT Voucher implementation)**

Folder `EvoucherPrototype` berisi backup code dari **November 2024**, sebelum kita implement RT Voucher system (3-4 Desember 2024).

---

## 📅 Timeline Evidence

### Current Implementation (Root Directory):
- **Last Modified:** 3-4 Desember 2024
- **Features:** RT Voucher Phase 1-3 complete
- **Documentation:** 10 file RT/PHASE documentation

### EvoucherPrototype Folder:
- **Last Modified:** 8-17 November 2024
- **Features:** Basic voucher system only
- **Documentation:** 8 file basic documentation (no RT/PHASE docs)

---

## 🔍 Perbedaan Utama

### 1. **Documentation Files**

#### ✅ Current (Root):
```
RT_VOUCHER_IMPLEMENTATION.md      (3 Dec)
RT_VOUCHER_SUMMARY.md             (3 Dec)
RT_VOUCHER_FINAL_SUMMARY.md       (3 Dec)
PHASE1_IMPLEMENTATION_SUMMARY.md  (3 Dec)
PHASE1_TESTING_GUIDE.md           (3 Dec)
PHASE2_TESTING_GUIDE.md           (3 Dec)
PHASE3_TESTING_GUIDE.md           (3 Dec)
check-vouchers.js                 (RT support)
fix-ads-vouchers.js               (ADS support)
voucher_numbers_RTT_*.csv         (RT vouchers)
```

#### ❌ EvoucherPrototype:
```
CHANGELOG.md                      (11 Nov)
DEPLOYMENT-GUIDE.md               (8 Nov)
DOKUMENTASI.md                    (8 Nov)
TIMEZONE-FIX-SUMMARY.md           (9 Nov)
(No RT Voucher docs)
(No Phase docs)
(No RTT- voucher files)
```

---

### 2. **Code Implementation**

#### ✅ Current `server.js`:

**RT Voucher Logic:**
```javascript
// Line 321-327: Separate voucher pools
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Check RT vouchers (RTT- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp 
                WHERE is_used = 0 AND voucher_number LIKE 'RTT-%'";
} else {
  // Check regular vouchers (SRP- or ADS- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp 
                WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' 
                OR voucher_number LIKE 'ADS-%')";
}
```

**UTM Validation:**
```javascript
// Line 376-378: Strict UTM validation
const validSources = ['RT01', 'RT02', 'direct'];
// RT01, RT02 for RT vouchers, direct for regular vouchers
```

**Admin Stats:**
```javascript
// Line 686-702: Separate stats for RT and Regular
// Regular vouchers (SRP- or ADS-)
WHERE (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')

// RT vouchers (RTT-)
WHERE voucher_number LIKE 'RTT-%'
```

#### ❌ EvoucherPrototype `server.js`:

**NO RT Voucher Logic:**
- Tidak ada pemisahan voucher pool
- Tidak ada RTT- prefix support
- Tidak ada ADS- prefix support
- Tidak ada UTM validation untuk RT01/RT02
- Single voucher pool (SRP- only)

---

#### ✅ Current `public/script.js`:

**UTM Validation on Page Load:**
```javascript
// Line 10-38: Capture and validate UTM
(function captureUTM() {
  const utmSource = urlParams.get('utm_source') || 'direct';
  
  // Validate UTM source
  const validSources = ['RT01', 'RT02', 'direct'];
  
  if (utmSource !== 'direct' && !validSources.includes(utmSource)) {
    // Invalid UTM - block download
    errorMessage.textContent = 'Link tidak valid...';
    downloadBtn.disabled = true;
    return;
  }
  
  sessionStorage.setItem('utm_source', utmSource);
})();
```

#### ❌ EvoucherPrototype `public/script.js`:

**NO UTM Validation:**
- Tidak ada UTM capture function
- Tidak ada UTM validation
- Tidak ada invalid UTM blocking
- Basic phone validation only

---

### 3. **Database & Vouchers**

#### ✅ Current:
```
voucher_numbers_RTT_1764750961423.csv  (RT vouchers)
voucher_numbers_IGV_*.csv              (Regular vouchers)
```

**Database Support:**
- RTT- prefix (RT vouchers)
- SRP- prefix (Regular vouchers)
- ADS- prefix (Regular vouchers)

#### ❌ EvoucherPrototype:
```
voucher_numbers_IGV_*.csv              (Regular only)
```

**Database Support:**
- SRP- prefix only
- No RTT- support
- No ADS- support

---

### 4. **Admin Panel**

#### ✅ Current `public/admin.html` & `admin-script.js`:

**Features:**
- Separate stats display (RT vs Regular)
- Warning banner when RT < 100
- Pagination for all sections
- CSV template download with RTT- example
- Detailed voucher breakdown

#### ❌ EvoucherPrototype:

**Features:**
- Single voucher stats
- No RT/Regular separation
- Basic pagination (if any)
- No warning banners
- Generic stats display

---

## 🔧 Technical Differences Summary

| Feature | Current (Root) | EvoucherPrototype |
|---------|---------------|-------------------|
| **RT Voucher Support** | ✅ Yes (RTT-) | ❌ No |
| **ADS Voucher Support** | ✅ Yes (ADS-) | ❌ No |
| **UTM Validation** | ✅ RT01, RT02, direct | ❌ Basic/None |
| **Separate Voucher Pools** | ✅ Yes | ❌ No |
| **Admin Stats** | ✅ Detailed (RT + Regular) | ❌ Basic |
| **Warning Banners** | ✅ Yes | ❌ No |
| **CSV Template** | ✅ With RTT- example | ❌ Basic |
| **Pagination** | ✅ Complete | ❌ Basic/None |
| **Last Updated** | 3-4 Dec 2024 | 8-17 Nov 2024 |

---

## 📁 File Count Comparison

### Current (Root):
- **Total MD files:** ~40 files
- **RT/PHASE docs:** 10 files
- **Backup files:** Multiple versions
- **CSV files:** RTT- + IGV-

### EvoucherPrototype:
- **Total MD files:** 8 files
- **RT/PHASE docs:** 0 files
- **Backup files:** server.js backups (Nov)
- **CSV files:** IGV- only

---

## 🎯 Kenapa Folder Ini Ada?

**EvoucherPrototype adalah backup/snapshot dari November 2024:**

1. **Backup Purpose:** Menyimpan versi stable sebelum major changes
2. **Development History:** Record of implementation progress
3. **Rollback Option:** Jika ada masalah, bisa rollback ke versi ini

**Tapi sekarang outdated karena:**
- Tidak ada RT Voucher implementation
- Tidak ada ADS- support
- Missing 1 bulan development (Nov → Dec)

---

## ⚠️ IMPORTANT NOTE

**Jika production server running dari folder EvoucherPrototype:**

❌ **MASALAH:**
- Server pakai code lama (November)
- Tidak ada RT Voucher logic
- Tidak ada ADS- support
- User dengan UTM RT01/RT02 akan error
- ADS- vouchers tidak bisa dipakai

✅ **SOLUSI:**
```bash
# Copy current files ke EvoucherPrototype
cp server.js EvoucherPrototype/
cp public/script.js EvoucherPrototype/public/
cp public/admin-script.js EvoucherPrototype/public/
cp public/admin.html EvoucherPrototype/public/

# Restart server
pm2 restart voucher-app
```

---

## 📊 Feature Matrix

### Phase 1 (RT Voucher Basic):
- ✅ Current: Implemented
- ❌ EvoucherPrototype: Not available

### Phase 2 (UTM Validation):
- ✅ Current: Implemented
- ❌ EvoucherPrototype: Not available

### Phase 3 (Admin Panel):
- ✅ Current: Implemented
- ❌ EvoucherPrototype: Not available

### ADS- Support:
- ✅ Current: Implemented
- ❌ EvoucherPrototype: Not available

---

## 🚀 Recommendation

### Untuk Development:
1. **Gunakan root directory** sebagai main codebase
2. **EvoucherPrototype** hanya untuk reference/backup
3. Update EvoucherPrototype jika perlu backup baru

### Untuk Production:
1. **Pastikan PM2 running dari root directory**
2. Atau **copy latest code ke EvoucherPrototype**
3. **Jangan deploy dari EvoucherPrototype** tanpa update

### Untuk Backup:
1. Buat backup baru dengan timestamp
2. Contoh: `EvoucherPrototype-backup-20241204`
3. Keep EvoucherPrototype as historical reference

---

## ✅ Verification Checklist

Untuk memastikan production pakai code yang benar:

```bash
# 1. Check PM2 working directory
pm2 info voucher-app | grep "cwd"

# 2. Check server.js content
grep -n "RTT-" /path/to/running/server.js

# 3. Check if RT Voucher logic exists
grep -n "RT01.*RT02" /path/to/running/server.js

# 4. Test download with RT UTM
curl -X POST http://localhost:3001/api/record-download \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"628123456789","utm_source":"RT01"}'
```

**Expected Results:**
- ✅ Should find RTT- references
- ✅ Should find RT01/RT02 logic
- ✅ Download should work without 500 error

---

**Summary:** EvoucherPrototype = November backup, Current = December implementation with RT Voucher Phase 1-3 complete.
