# 📋 Guide: Menambah Prefix Voucher Baru (RCV-)

**Date:** 4 Desember 2024  
**Example:** Menambah prefix `RCV-` seperti `RTT-`

---

## 🎯 Overview

Untuk menambah prefix voucher baru (misal: `RCV-`), perlu update di **5 lokasi**:

1. ✅ **server.js** (4 tempat)
2. ✅ **check-vouchers.js** (1 tempat)
3. ✅ **CSV Template** (optional)

---

## 📍 Lokasi yang Perlu Diubah

### **File 1: server.js**

#### **Location 1: Quota Check - Line ~320-327**

**Current (RTT-):**
```javascript
let quotaQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Check RT vouchers (RTT- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%'";
} else {
  // Check regular vouchers (SRP- or ADS- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')";
}
```

**Add RCV- (Option A: Separate UTM):**
```javascript
let quotaQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Check RT vouchers (RTT- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%'";
} else if (utmSource === 'RCV01' || utmSource === 'RCV02') {
  // Check RCV vouchers (RCV- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RCV-%'";
} else {
  // Check regular vouchers (SRP- or ADS- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')";
}
```

**Add RCV- (Option B: Same Pool as RTT-):**
```javascript
let quotaQuery;
if (utmSource === 'RT01' || utmSource === 'RT02' || utmSource === 'RCV01' || utmSource === 'RCV02') {
  // Check RT/RCV vouchers (RTT- or RCV- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'RTT-%' OR voucher_number LIKE 'RCV-%')";
} else {
  // Check regular vouchers (SRP- or ADS- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')";
}
```

---

#### **Location 2: Quota Check in Download - Line ~404-411**

**Same as Location 1**, apply same changes.

---

#### **Location 3: Voucher Selection - Line ~464-471**

**Current (RTT-):**
```javascript
let voucherQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Get RT voucher (RTT- prefix)
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%' ORDER BY id ASC LIMIT 1";
} else {
  // Get regular voucher (SRP- or ADS- prefix)
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%') ORDER BY id ASC LIMIT 1";
}
```

**Add RCV- (Option A: Separate):**
```javascript
let voucherQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%' ORDER BY id ASC LIMIT 1";
} else if (utmSource === 'RCV01' || utmSource === 'RCV02') {
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RCV-%' ORDER BY id ASC LIMIT 1";
} else {
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%') ORDER BY id ASC LIMIT 1";
}
```

**Add RCV- (Option B: Same Pool):**
```javascript
let voucherQuery;
if (utmSource === 'RT01' || utmSource === 'RT02' || utmSource === 'RCV01' || utmSource === 'RCV02') {
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'RTT-%' OR voucher_number LIKE 'RCV-%') ORDER BY id ASC LIMIT 1";
} else {
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%') ORDER BY id ASC LIMIT 1";
}
```

---

#### **Location 4: Admin Stats - Line ~694-703**

**Current (RTT-):**
```javascript
// Get RT voucher stats (RTT-)
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE voucher_number LIKE 'RTT-%'
`, (err2, rtStats) => {
  // ...
});
```

**Add RCV- (Option A: Separate Stats):**
```javascript
// Get RT voucher stats (RTT-)
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE voucher_number LIKE 'RTT-%'
`, (err2, rtStats) => {
  if (err2) {
    return res.status(500).json({ error: 'Database error' });
  }

  // Get RCV voucher stats (RCV-)
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
    FROM voucher_srp 
    WHERE voucher_number LIKE 'RCV-%'
  `, (err3, rcvStats) => {
    if (err3) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      regular: regularStats,
      rt: rtStats,
      rcv: rcvStats  // Add RCV stats
    });
  });
});
```

**Add RCV- (Option B: Combined Stats):**
```javascript
// Get RT/RCV voucher stats (RTT- or RCV-)
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE voucher_number LIKE 'RTT-%' OR voucher_number LIKE 'RCV-%'
`, (err2, rtStats) => {
  // ...
});
```

---

### **File 2: check-vouchers.js**

#### **Location: Stats Check - Line ~27-41**

**Current (RTT-):**
```javascript
// Check RTT- vouchers
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE voucher_number LIKE 'RTT-%'
`, (err, rttStats) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('🏘️ RT Vouchers (RTT-):');
  console.log('  Total:', rttStats.total || 0);
  console.log('  Available:', rttStats.available || 0);
  console.log('  Used:', rttStats.used || 0);
  console.log('');
  
  // ... rest of code
});
```

**Add RCV- (Separate):**
```javascript
// Check RTT- vouchers
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE voucher_number LIKE 'RTT-%'
`, (err, rttStats) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('🏘️ RT Vouchers (RTT-):');
  console.log('  Total:', rttStats.total || 0);
  console.log('  Available:', rttStats.available || 0);
  console.log('  Used:', rttStats.used || 0);
  console.log('');
  
  // Check RCV- vouchers
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
    FROM voucher_srp 
    WHERE voucher_number LIKE 'RCV-%'
  `, (err, rcvStats) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('📦 RCV Vouchers (RCV-):');
    console.log('  Total:', rcvStats.total || 0);
    console.log('  Available:', rcvStats.available || 0);
    console.log('  Used:', rcvStats.used || 0);
    console.log('');
    
    // ... rest of code
  });
});
```

---

### **File 3: public/script.js** (Frontend Validation)

#### **Location: Valid UTM Sources - Line ~18**

**Current:**
```javascript
const validSources = ['RT01', 'RT02', 'direct'];
```

**Add RCV:**
```javascript
const validSources = ['RT01', 'RT02', 'RCV01', 'RCV02', 'direct'];
```

---

### **File 4: CSV Template** (Optional)

#### **Location: server.js - Line ~938-941**

**Current:**
```javascript
const template = `Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,SRP-002`;
```

**Add RCV:**
```javascript
const template = `Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,RCV-0001-XXXXX
Dewi Lestari,081234567893,2024-12-03,SRP-002`;
```

---

## 🎯 Decision: Separate vs Combined Pool

### **Option A: Separate Pool (RCV- independent)**

**Use Case:** RCV vouchers untuk campaign berbeda, tidak boleh mix dengan RTT-

**Pros:**
- ✅ Full control per prefix
- ✅ Separate stats
- ✅ Separate quota management

**Cons:**
- ❌ More code changes
- ❌ More complex logic

**UTM Sources:**
- `RCV01`, `RCV02` → Get RCV- vouchers only
- `RT01`, `RT02` → Get RTT- vouchers only
- `direct` → Get SRP-/ADS- vouchers

---

### **Option B: Combined Pool (RCV- + RTT- same pool)**

**Use Case:** RCV dan RTT sama-sama untuk RT community, boleh mix

**Pros:**
- ✅ Simpler code
- ✅ Flexible voucher usage
- ✅ Combined stats

**Cons:**
- ❌ Cannot separate RCV from RTT stats
- ❌ Less control

**UTM Sources:**
- `RCV01`, `RCV02`, `RT01`, `RT02` → Get RTT- or RCV- vouchers (mixed)
- `direct` → Get SRP-/ADS- vouchers

---

## 📋 Summary: Files to Modify

| File | Locations | Purpose |
|------|-----------|---------|
| **server.js** | 4 places | Quota check, voucher selection, stats |
| **public/script.js** | 1 place | Frontend UTM validation |
| **check-vouchers.js** | 1 place | Debug tool stats |
| **CSV Template** | 1 place | Example in template (optional) |

---

## ✅ Checklist

### **Before Changes:**
- [ ] Decide: Separate or Combined pool?
- [ ] Define UTM sources (RCV01, RCV02, etc.)
- [ ] Backup current files

### **Code Changes:**
- [ ] Update server.js (4 locations)
- [ ] Update public/script.js (1 location)
- [ ] Update check-vouchers.js (1 location)
- [ ] Update CSV template (optional)

### **After Changes:**
- [ ] Test syntax (no errors)
- [ ] Upload to server
- [ ] Restart PM2
- [ ] Upload RCV- vouchers via admin panel
- [ ] Test download with RCV UTM
- [ ] Verify stats in admin panel

---

## 🧪 Testing

### **Test RCV Download:**
```
1. Upload RCV- vouchers via admin panel
2. Access: https://your-domain.com?utm_source=RCV01
3. Enter phone: 628123456789
4. Download voucher
5. Expected: Get RCV- voucher
```

### **Verify Database:**
```sql
-- Check RCV vouchers
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RCV-%';

-- Check recent downloads
SELECT phone_number, utm_source, voucher_code 
FROM downloads 
ORDER BY id DESC LIMIT 5;
```

---

**Recommendation:** Pakai **Option B (Combined Pool)** kalau RCV dan RTT untuk audience yang sama. Lebih simple! 😊
