# RT Voucher Implementation - Detailed Documentation

## 📋 Overview

Implementasi sistem voucher terpisah untuk RT (Rukun Tetangga) dan Regular (Direct/WhatsApp/Instagram).

### Key Concepts:
- **RT Vouchers:** Prefix `RTT-` (e.g., RTT-0001-LHIAM)
- **Regular Vouchers:** Prefix `SRP-` (e.g., SRP-001)
- **RT Sources:** RT01, RT02 (bisa expand ke RT03, RT04, ...)
- **Regular Sources:** direct, whatsapp, instagram

---

## 🎯 Implementation Phases

### Phase 1: Core RT Voucher Logic (Priority: HIGH)
- Update valid UTM sources
- Update quota check by type
- Update voucher selection by type
- Update error messages

### Phase 2: Admin Panel Stats (Priority: MEDIUM)
- Create detailed stats endpoint
- Update admin panel UI
- Add warning for low RT vouchers

### Phase 3: CSV Template Download (Priority: LOW)
- Create template endpoint
- Add download button
- Add tooltip instructions

---

# Phase 1: Core RT Voucher Logic

## 📍 Files to Modify:
- `server.js` (4 locations)

---

## 🔧 Change 1: Update Valid UTM Sources

**Location:** `server.js` - Line ~365

**Current Code:**
```javascript
const validSources = ['RT01', 'RT02', 'RT03', 'RT04', 'RT05', 'direct'];
const utmSource = validSources.includes(utm_source) ? utm_source : 'direct';
```

**New Code:**
```javascript
// Valid UTM sources - RT01, RT02 for RT vouchers, others for regular vouchers
const validSources = ['RT01', 'RT02', 'direct', 'whatsapp', 'instagram'];
const utmSource = validSources.includes(utm_source) ? utm_source : 'direct';
```

**Why:**
- Add 'whatsapp' and 'instagram' to valid sources
- Keep RT01 and RT02 only (for now)
- Easy to add RT03, RT04 later by updating this list

---

## 🔧 Change 2: Update Quota Check in `/api/check-download`

**Location:** `server.js` - Line ~320

**Current Code:**
```javascript
// Check quota from voucher_srp
db.get('SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0', (err, quota) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (quota.available === 0) {
    return res.json({ alreadyDownloaded: true, quotaExceeded: true });
  }
  
  // ... continue
});
```

**New Code:**
```javascript
// Check quota by voucher type
const utmSource = req.query.utm_source || 'direct';
let quotaQuery;

if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Check RT vouchers (RTT- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%'";
} else {
  // Check regular vouchers (SRP- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%'";
}

db.get(quotaQuery, (err, quota) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (quota.available === 0) {
    return res.json({ 
      alreadyDownloaded: true, 
      quotaExceeded: true,
      voucherType: (utmSource === 'RT01' || utmSource === 'RT02') ? 'RT' : 'regular'
    });
  }
  
  // ... continue
});
```

**Why:**
- Check quota based on voucher type (RT vs Regular)
- Return voucherType for frontend handling
- Prevent RT users from seeing "regular voucher habis" when RT vouchers still available

---

## 🔧 Change 3: Update Quota Check in `/api/record-download`

**Location:** `server.js` - Line ~390

**Current Code:**
```javascript
// Check quota from voucher_srp
db.get('SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0', (err, quota) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (quota.available === 0) {
    return res.status(403).json({ error: 'Kuota voucher sudah habis' });
  }
  
  // ... continue
});
```

**New Code:**
```javascript
// Check quota by voucher type
let quotaQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Check RT vouchers (RTT- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%'";
} else {
  // Check regular vouchers (SRP- prefix)
  quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%'";
}

db.get(quotaQuery, (err, quota) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (quota.available === 0) {
    const errorMessage = (utmSource === 'RT01' || utmSource === 'RT02')
      ? 'Voucher RT sudah mencapai batas kuota. Silakan hubungi administrator.'
      : 'Kuota voucher sudah habis. Silakan hubungi administrator.';
    
    return res.status(403).json({ 
      error: errorMessage,
      voucherType: (utmSource === 'RT01' || utmSource === 'RT02') ? 'RT' : 'regular'
    });
  }
  
  // ... continue
});
```

**Why:**
- Same as Change 2, but for record-download endpoint
- Different error message for RT vs Regular
- Return voucherType for better error handling

---

## 🔧 Change 4: Update Voucher Selection

**Location:** `server.js` - Line ~428 (inside `processDownload()` function)

**Current Code:**
```javascript
// Get next available voucher from voucher_srp (FIFO)
db.get('SELECT * FROM voucher_srp WHERE is_used = 0 ORDER BY id ASC LIMIT 1', (err, voucher) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!voucher) {
    return res.status(403).json({ error: 'Voucher habis. Silakan hubungi administrator.' });
  }
  
  // ... process voucher
});
```

**New Code:**
```javascript
// Get voucher by type (FIFO - First In First Out)
let voucherQuery;
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Get RT voucher (RTT- prefix)
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%' ORDER BY id ASC LIMIT 1";
} else {
  // Get regular voucher (SRP- prefix)
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%' ORDER BY id ASC LIMIT 1";
}

db.get(voucherQuery, (err, voucher) => {
  if (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!voucher) {
    const errorMessage = (utmSource === 'RT01' || utmSource === 'RT02')
      ? 'Voucher RT habis. Silakan hubungi administrator.'
      : 'Voucher regular habis. Silakan hubungi administrator.';
    
    return res.status(403).json({ 
      error: errorMessage,
      voucherType: (utmSource === 'RT01' || utmSource === 'RT02') ? 'RT' : 'regular'
    });
  }
  
  // ... process voucher (rest of the code stays the same)
  // Record download, mark voucher as used, update quota, return response
});
```

**Why:**
- **Core logic change** - Select voucher from correct pool
- RT users get RTT- vouchers
- Regular users get SRP- vouchers
- Maintain FIFO order (ORDER BY id ASC)
- Better error messages

---

## ✅ Phase 1 Testing Checklist

### Test 1: RT01 Download
- [ ] Access: `https://voucher.tdn.id/?utm_source=RT01`
- [ ] Enter phone number
- [ ] Click download
- [ ] Verify voucher number starts with `RTT-`
- [ ] Check database: voucher marked as used
- [ ] Check downloads table: utm_source = 'RT01'

### Test 2: RT02 Download
- [ ] Access: `https://voucher.tdn.id/?utm_source=RT02`
- [ ] Enter phone number
- [ ] Click download
- [ ] Verify voucher number starts with `RTT-`
- [ ] Check database: voucher marked as used
- [ ] Check downloads table: utm_source = 'RT02'

### Test 3: Direct Download
- [ ] Access: `https://voucher.tdn.id/` (no UTM)
- [ ] Enter phone number
- [ ] Click download
- [ ] Verify voucher number starts with `SRP-`
- [ ] Check database: voucher marked as used
- [ ] Check downloads table: utm_source = 'direct'

### Test 4: WhatsApp Download
- [ ] Access: `https://voucher.tdn.id/?utm_source=whatsapp`
- [ ] Enter phone number
- [ ] Click download
- [ ] Verify voucher number starts with `SRP-`
- [ ] Check downloads table: utm_source = 'whatsapp'

### Test 5: RT Voucher Habis
- [ ] Mark all RTT- vouchers as used in database
- [ ] Access: `https://voucher.tdn.id/?utm_source=RT01`
- [ ] Try to download
- [ ] Verify error: "Voucher RT sudah mencapai batas kuota"
- [ ] Verify regular vouchers still work (direct/whatsapp)

### Test 6: Regular Voucher Habis
- [ ] Mark all SRP- vouchers as used in database
- [ ] Access: `https://voucher.tdn.id/` (direct)
- [ ] Try to download
- [ ] Verify error: "Kuota voucher sudah habis"
- [ ] Verify RT vouchers still work (RT01/RT02)

---

# Phase 2: Admin Panel Stats

## 📍 Files to Modify:
- `server.js` (1 new endpoint)
- `public/admin-script.js` (update stats loading)
- `public/admin.html` (update UI)

---

## 🔧 Change 1: Create Detailed Stats Endpoint

**Location:** `server.js` - Add new endpoint after existing `/api/admin/voucher-stats`

**New Code:**
```javascript
// Admin: Get detailed voucher stats (RT vs Regular)
app.get('/api/admin/voucher-stats-detailed', requireAuth, (req, res) => {
  // Get regular voucher stats (SRP-)
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
    FROM voucher_srp 
    WHERE voucher_number LIKE 'SRP-%'
  `, (err, regularStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

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

      res.json({
        regular: {
          total: regularStats.total || 0,
          available: regularStats.available || 0,
          used: regularStats.used || 0
        },
        rt: {
          total: rtStats.total || 0,
          available: rtStats.available || 0,
          used: rtStats.used || 0
        }
      });
    });
  });
});
```

---

## 🔧 Change 2: Update Admin Panel JavaScript

**Location:** `public/admin-script.js` - Update `loadVoucherStats()` function

**Current Code:**
```javascript
async function loadVoucherStats() {
  try {
    const response = await fetch('/api/admin/voucher-stats');
    const data = await response.json();

    document.getElementById('voucherTotal').textContent = data.total;
    document.getElementById('voucherAvailable').textContent = data.available;
    document.getElementById('voucherUsed').textContent = data.used;
  } catch (error) {
    console.error('Error loading voucher stats:', error);
  }
}
```

**New Code:**
```javascript
async function loadVoucherStats() {
  try {
    const response = await fetch('/api/admin/voucher-stats-detailed');
    const data = await response.json();

    // Regular vouchers
    document.getElementById('voucherTotalRegular').textContent = data.regular.total;
    document.getElementById('voucherAvailableRegular').textContent = data.regular.available;
    document.getElementById('voucherUsedRegular').textContent = data.regular.used;

    // RT vouchers
    document.getElementById('voucherTotalRT').textContent = data.rt.total;
    document.getElementById('voucherAvailableRT').textContent = data.rt.available;
    document.getElementById('voucherUsedRT').textContent = data.rt.used;

    // Show warning if RT vouchers < 100
    const rtWarning = document.getElementById('rtVoucherWarning');
    if (data.rt.available < 100 && data.rt.available > 0) {
      rtWarning.style.display = 'block';
      rtWarning.textContent = `⚠️ Peringatan: Voucher RT tersisa ${data.rt.available}. Segera upload voucher baru!`;
    } else if (data.rt.available === 0) {
      rtWarning.style.display = 'block';
      rtWarning.textContent = '🚨 URGENT: Voucher RT sudah habis! Upload voucher baru sekarang.';
      rtWarning.style.background = '#f44336';
      rtWarning.style.color = 'white';
    } else {
      rtWarning.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading voucher stats:', error);
  }
}
```

---

## 🔧 Change 3: Update Admin Panel HTML

**Location:** `public/admin.html` - Update voucher stats section

**Current Code:**
```html
<div class="voucher-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #667eea;" id="voucherTotal">0</div>
    <div style="font-size: 14px; color: #666;">Total Voucher</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #4caf50;" id="voucherAvailable">0</div>
    <div style="font-size: 14px; color: #666;">Tersedia</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #f44336;" id="voucherUsed">0</div>
    <div style="font-size: 14px; color: #666;">Terpakai</div>
  </div>
</div>
```

**New Code:**
```html
<!-- RT Voucher Warning -->
<div id="rtVoucherWarning" style="display: none; padding: 15px; background: #ff9800; color: white; border-radius: 8px; margin-bottom: 20px; font-weight: 600;">
  ⚠️ Peringatan: Voucher RT tersisa sedikit!
</div>

<!-- Regular Vouchers Stats -->
<h3 style="margin-bottom: 15px;">📦 Regular Vouchers (SRP-)</h3>
<div class="voucher-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #667eea;" id="voucherTotalRegular">0</div>
    <div style="font-size: 14px; color: #666;">Total</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #4caf50;" id="voucherAvailableRegular">0</div>
    <div style="font-size: 14px; color: #666;">Tersedia</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #f44336;" id="voucherUsedRegular">0</div>
    <div style="font-size: 14px; color: #666;">Terpakai</div>
  </div>
</div>

<!-- RT Vouchers Stats -->
<h3 style="margin-bottom: 15px;">🏘️ RT Vouchers (RTT-)</h3>
<div class="voucher-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #667eea;" id="voucherTotalRT">0</div>
    <div style="font-size: 14px; color: #666;">Total</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #4caf50;" id="voucherAvailableRT">0</div>
    <div style="font-size: 14px; color: #666;">Tersedia</div>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; color: #f44336;" id="voucherUsedRT">0</div>
    <div style="font-size: 14px; color: #666;">Terpakai</div>
  </div>
</div>
```

---

## ✅ Phase 2 Testing Checklist

### Test 1: Stats Display
- [ ] Login to admin panel
- [ ] Verify "Regular Vouchers (SRP-)" section shows correct stats
- [ ] Verify "RT Vouchers (RTT-)" section shows correct stats
- [ ] Verify total = available + used for both types

### Test 2: Warning Banner
- [ ] Set RT available < 100 in database
- [ ] Refresh admin panel
- [ ] Verify warning banner shows: "⚠️ Peringatan: Voucher RT tersisa X"
- [ ] Banner color: Orange (#ff9800)

### Test 3: Urgent Banner
- [ ] Mark all RT vouchers as used
- [ ] Refresh admin panel
- [ ] Verify urgent banner shows: "🚨 URGENT: Voucher RT sudah habis!"
- [ ] Banner color: Red (#f44336)

### Test 4: No Warning
- [ ] Set RT available > 100
- [ ] Refresh admin panel
- [ ] Verify warning banner is hidden

---

# Phase 3: CSV Template Download

## 📍 Files to Modify:
- `server.js` (1 new endpoint)
- `public/admin.html` (add button)

---

## 🔧 Change 1: Create Template Download Endpoint

**Location:** `server.js` - Add new endpoint

**New Code:**
```javascript
// Admin: Download CSV template for bulk voucher generation
app.get('/api/admin/download-csv-template', (req, res) => {
  // CSV template with header and example rows
  const template = `Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,SRP-002`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=template_voucher_bulk.csv');
  res.send('\uFEFF' + template); // Add BOM for Excel UTF-8 support
});
```

**Why:**
- Simple template with header and 3 example rows
- Shows both SRP- and RTT- voucher examples
- BOM (\uFEFF) for proper Excel UTF-8 encoding
- No authentication required (public template)

---

## 🔧 Change 2: Add Download Button in Admin Panel

**Location:** `public/admin.html` - In "Generate Voucher Images (Bulk)" section

**Find this section:**
```html
<div class="form-group">
  <label for="bulkCsvFileInput">Upload File CSV</label>
  <input type="file" id="bulkCsvFileInput" accept=".csv" style="...">
  <span class="helper-text">Format CSV: Nama Customer, No Handphone, Tanggal Blasting, Kode Voucher SRP</span>
</div>
```

**Add this BEFORE the file input:**
```html
<div style="margin-bottom: 20px;">
  <a href="/api/admin/download-csv-template" download class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
    </svg>
    Download Template CSV
  </a>
  <span style="margin-left: 10px; color: #666; font-size: 14px;" title="Template CSV berisi format yang benar dengan contoh data. Download, isi data Anda, lalu upload kembali.">
    ℹ️ <span style="text-decoration: underline; cursor: help;">Apa itu template?</span>
  </span>
</div>

<div class="form-group">
  <label for="bulkCsvFileInput">Upload File CSV</label>
  <input type="file" id="bulkCsvFileInput" accept=".csv" style="...">
  <span class="helper-text">Format CSV: Nama Customer, No Handphone, Tanggal Blasting, Kode Voucher SRP</span>
</div>
```

**Why:**
- Button placed before file input (logical flow: download → fill → upload)
- Simple tooltip with ℹ️ icon
- Download icon for clarity
- Secondary button style (not primary, to avoid confusion)

---

## ✅ Phase 3 Testing Checklist

### Test 1: Download Template
- [ ] Login to admin panel
- [ ] Go to "Generate Voucher Images (Bulk)" section
- [ ] Click "Download Template CSV" button
- [ ] Verify file downloads: `template_voucher_bulk.csv`
- [ ] Open in Excel/Google Sheets
- [ ] Verify columns: Nama Customer, No Handphone, Tanggal Blasting, Kode Voucher SRP
- [ ] Verify 3 example rows present
- [ ] Verify UTF-8 encoding (no garbled characters)

### Test 2: Use Template
- [ ] Download template
- [ ] Fill with real data (5-10 rows)
- [ ] Upload to bulk generation
- [ ] Verify generation works
- [ ] Verify images generated correctly

### Test 3: Tooltip
- [ ] Hover over ℹ️ icon
- [ ] Verify tooltip shows explanation
- [ ] Tooltip text clear and helpful

---

# 📊 Summary

## Changes Overview:

| Phase | Files Modified | Lines Changed | Risk Level |
|-------|---------------|---------------|------------|
| Phase 1 | server.js | ~80 lines | MEDIUM |
| Phase 2 | server.js, admin-script.js, admin.html | ~100 lines | LOW |
| Phase 3 | server.js, admin.html | ~30 lines | VERY LOW |
| **Total** | **3 files** | **~210 lines** | **MEDIUM** |

## Deployment Order:

1. **Phase 1** (Core logic) - Deploy first, test thoroughly
2. **Phase 2** (Stats) - Deploy after Phase 1 verified
3. **Phase 3** (Template) - Deploy anytime (independent)

## Rollback Plan:

If issues occur:
1. Keep backup of original `server.js`
2. Can rollback Phase 2 & 3 without affecting Phase 1
3. Phase 1 rollback requires full server.js restore

---

# 🚀 Deployment Steps

## Pre-Deployment:

1. ✅ Backup current `server.js`
2. ✅ Upload RT vouchers (RTT-) to database
3. ✅ Verify database has both SRP- and RTT- vouchers

## Deployment:

```bash
# 1. Commit changes
git add server.js public/admin-script.js public/admin.html
git commit -m "Implement RT voucher separation (Phase 1-3)"
git push

# 2. SSH to server
ssh user@server

# 3. Backup current code
cd /var/www/voucher-app
cp server.js server.js.backup

# 4. Pull changes
git pull

# 5. Restart app
pm2 restart voucher-app

# 6. Check logs
pm2 logs voucher-app --lines 50
```

## Post-Deployment Testing:

1. Test RT01 download
2. Test RT02 download
3. Test direct download
4. Check admin panel stats
5. Download CSV template
6. Monitor for errors

---

# 📝 Notes

## Adding New RT Sources:

To add RT03, RT04, etc:

1. Update `validSources` in server.js:
```javascript
const validSources = ['RT01', 'RT02', 'RT03', 'RT04', 'direct', 'whatsapp', 'instagram'];
```

2. Update condition checks:
```javascript
// Before
if (utmSource === 'RT01' || utmSource === 'RT02') {

// After
if (utmSource === 'RT01' || utmSource === 'RT02' || utmSource === 'RT03' || utmSource === 'RT04') {

// Or use helper function:
const isRTSource = (source) => ['RT01', 'RT02', 'RT03', 'RT04'].includes(source);
if (isRTSource(utmSource)) {
```

3. Deploy changes

## Database Queries:

### Check RT voucher usage:
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

### Check downloads by RT source:
```sql
SELECT utm_source, COUNT(*) as total
FROM downloads
WHERE utm_source IN ('RT01', 'RT02')
AND is_deleted = 0
GROUP BY utm_source;
```

### Check which RT vouchers were used by which RT source:
```sql
SELECT 
  d.utm_source,
  v.voucher_number,
  d.phone_number,
  d.download_time
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE v.voucher_number LIKE 'RTT-%'
ORDER BY d.download_time DESC;
```

---

**Documentation Date:** December 3, 2024
**Status:** Ready for Implementation
**Estimated Total Time:** 2-3 hours
