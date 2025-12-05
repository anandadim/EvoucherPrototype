# Phase 2 Testing Guide - Admin Stats

## ✅ Implementation Complete!

**Date:** December 3, 2024
**Phase:** Phase 2 - Admin Panel Stats (RT vs Regular)
**Status:** Ready for Testing

---

## 📋 Changes Implemented

### 1. New Endpoint: /api/admin/voucher-stats-detailed ✅
**File:** `server.js`
- Returns separate stats for RT and Regular vouchers
- Response format:
```json
{
  "regular": {
    "total": 5000,
    "available": 3200,
    "used": 1800
  },
  "rt": {
    "total": 1000,
    "available": 975,
    "used": 25
  }
}
```

### 2. Updated loadVoucherStats() Function ✅
**File:** `public/admin-script.js`
- Calls new detailed endpoint
- Updates separate stats for RT and Regular
- Shows warning banner when RT < 100
- Shows urgent banner when RT = 0

### 3. Updated Admin Panel UI ✅
**File:** `public/admin.html`
- Separate stats cards for Regular (SRP-) and RT (RTT-)
- Warning banner for low RT vouchers
- Clean, organized layout

---

## 🧪 Testing Checklist

### Pre-Testing Setup:
- [ ] Phase 1 deployed and working
- [ ] RT vouchers uploaded (RTT-)
- [ ] Regular vouchers exist (SRP-)
- [ ] Admin panel accessible

---

### Test 1: Stats Display - Both Types Available ✅

**Setup:**
```sql
-- Ensure both types have vouchers
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'SRP-%';  -- Should be > 0
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%';  -- Should be > 0
```

**Steps:**
1. Login to admin panel
2. Navigate to "Manajemen Voucher SRP" section
3. Observe stats display

**Expected Results:**
- [ ] Section shows "📦 Regular Vouchers (SRP-)"
- [ ] Regular stats show: Total, Tersedia, Terpakai
- [ ] Section shows "🏘️ RT Vouchers (RTT-)"
- [ ] RT stats show: Total, Tersedia, Terpakai
- [ ] All numbers are correct (verify with database)
- [ ] No warning banner visible (if RT > 100)

**Database Verification:**
```sql
-- Regular vouchers
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'SRP-%';

-- RT vouchers
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

---

### Test 2: Warning Banner - RT < 100 ⚠️

**Setup:**
```sql
-- Set RT available to < 100 (e.g., 75)
-- Mark some RT vouchers as used
UPDATE voucher_srp 
SET is_used = 1 
WHERE voucher_number LIKE 'RTT-%' 
AND id IN (SELECT id FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' LIMIT 10);

-- Verify
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;
-- Should be < 100
```

**Steps:**
1. Refresh admin panel (F5)
2. Check "Manajemen Voucher SRP" section

**Expected Results:**
- [ ] Warning banner visible at top of section
- [ ] Banner color: Orange (#ff9800)
- [ ] Banner text: "⚠️ Peringatan: Voucher RT tersisa X. Segera upload voucher baru!"
- [ ] X = actual number of available RT vouchers
- [ ] Regular vouchers not affected

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Peringatan: Voucher RT tersisa 75.          │
│    Segera upload voucher baru!                  │
└─────────────────────────────────────────────────┘
```

---

### Test 3: Urgent Banner - RT = 0 🚨

**Setup:**
```sql
-- Mark ALL RT vouchers as used
UPDATE voucher_srp 
SET is_used = 1 
WHERE voucher_number LIKE 'RTT-%';

-- Verify
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;
-- Should be 0
```

**Steps:**
1. Refresh admin panel (F5)
2. Check "Manajemen Voucher SRP" section

**Expected Results:**
- [ ] Urgent banner visible at top of section
- [ ] Banner color: Red (#f44336)
- [ ] Banner text: "🚨 URGENT: Voucher RT sudah habis! Upload voucher baru sekarang."
- [ ] RT Available shows: 0
- [ ] Regular vouchers not affected

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ 🚨 URGENT: Voucher RT sudah habis!             │
│    Upload voucher baru sekarang.                │
└─────────────────────────────────────────────────┘
```

**Cleanup:**
```sql
-- Reset RT vouchers for further testing
UPDATE voucher_srp 
SET is_used = 0 
WHERE voucher_number LIKE 'RTT-%';
```

---

### Test 4: No Warning - RT > 100 ✅

**Setup:**
```sql
-- Ensure RT available > 100
UPDATE voucher_srp 
SET is_used = 0 
WHERE voucher_number LIKE 'RTT-%';

-- Verify
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;
-- Should be > 100 (or upload more vouchers)
```

**Steps:**
1. Refresh admin panel (F5)
2. Check "Manajemen Voucher SRP" section

**Expected Results:**
- [ ] No warning banner visible
- [ ] RT stats show correct numbers
- [ ] RT Available > 100
- [ ] Clean, normal display

---

### Test 5: Stats Update After Download ✅

**Steps:**
1. Note current RT stats (e.g., Available: 975)
2. Download RT voucher from frontend:
   - Access: `https://voucher.tdn.id/?utm_source=RT01`
   - Enter phone: 628999999999
   - Download voucher
3. Refresh admin panel (F5)
4. Check RT stats

**Expected Results:**
- [ ] RT Available decreased by 1 (now 974)
- [ ] RT Used increased by 1
- [ ] RT Total unchanged
- [ ] Regular stats unchanged

---

### Test 6: Stats Update After Regular Download ✅

**Steps:**
1. Note current Regular stats (e.g., Available: 3200)
2. Download Regular voucher from frontend:
   - Access: `https://voucher.tdn.id/` (direct)
   - Enter phone: 628999999998
   - Download voucher
3. Refresh admin panel (F5)
4. Check Regular stats

**Expected Results:**
- [ ] Regular Available decreased by 1 (now 3199)
- [ ] Regular Used increased by 1
- [ ] Regular Total unchanged
- [ ] RT stats unchanged

---

### Test 7: Stats After CSV Upload ✅

**Steps:**
1. Note current stats (Regular and RT)
2. Upload CSV with new vouchers (e.g., 50 SRP- vouchers)
3. Refresh admin panel (F5)
4. Check stats

**Expected Results:**
- [ ] Regular Total increased by 50
- [ ] Regular Available increased by 50
- [ ] Regular Used unchanged
- [ ] RT stats unchanged (if uploaded SRP- vouchers)

---

### Test 8: Real-time Stats Accuracy ✅

**Goal:** Verify stats match database exactly

**Steps:**
1. Check admin panel stats
2. Query database:
```sql
-- Regular
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'SRP-%';

-- RT
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

**Expected Results:**
- [ ] Admin panel numbers match database exactly
- [ ] Total = Available + Used (for both types)
- [ ] No discrepancies

---

### Test 9: Warning Threshold Boundary ✅

**Goal:** Test warning appears exactly at < 100

**Test 9a: RT Available = 100**
```sql
-- Set RT available to exactly 100
-- (Mark some as used if needed)
```
**Expected:** No warning banner

**Test 9b: RT Available = 99**
```sql
-- Set RT available to 99
UPDATE voucher_srp 
SET is_used = 1 
WHERE voucher_number LIKE 'RTT-%' 
AND id = (SELECT id FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0 LIMIT 1);
```
**Expected:** Warning banner appears (orange)

**Test 9c: RT Available = 1**
```sql
-- Set RT available to 1
```
**Expected:** Warning banner shows "tersisa 1"

**Test 9d: RT Available = 0**
```sql
-- Set RT available to 0
```
**Expected:** Urgent banner (red)

---

### Test 10: Multiple Admin Sessions ✅

**Goal:** Verify stats consistent across multiple admin sessions

**Steps:**
1. Login to admin panel in Browser 1
2. Login to admin panel in Browser 2 (different browser/incognito)
3. Check stats in both browsers
4. Download voucher from frontend
5. Refresh both admin panels

**Expected Results:**
- [ ] Both browsers show same stats initially
- [ ] Both browsers show updated stats after refresh
- [ ] Stats consistent across sessions

---

## 📊 Database Queries for Monitoring

### Check Stats Accuracy:
```sql
-- Compare with admin panel display
SELECT 
  'Regular' as type,
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'SRP-%'

UNION ALL

SELECT 
  'RT' as type,
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

### Check Warning Threshold:
```sql
-- Should trigger warning if < 100
SELECT COUNT(*) as rt_available 
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;
```

### Check Recent Usage:
```sql
-- Last 10 vouchers used
SELECT 
  v.voucher_number,
  CASE 
    WHEN v.voucher_number LIKE 'RTT-%' THEN 'RT'
    ELSE 'Regular'
  END as type,
  d.utm_source,
  d.phone_number,
  d.download_time
FROM voucher_srp v
JOIN downloads d ON d.id = v.used_by_download_id
WHERE v.is_used = 1
ORDER BY d.download_time DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue 1: Stats showing 0 for both types
**Symptoms:** All stats show 0

**Possible Causes:**
1. No vouchers in database
2. Endpoint error
3. JavaScript error

**Debug Steps:**
```sql
-- Check if vouchers exist
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'SRP-%';
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%';
```

```javascript
// Check browser console
// Should see no errors
// Check Network tab for API response
```

**Fix:**
- Upload vouchers if database empty
- Check server logs for errors
- Verify endpoint returns correct data

---

### Issue 2: Warning banner not showing
**Symptoms:** RT < 100 but no warning

**Possible Causes:**
1. JavaScript error
2. Element ID mismatch
3. CSS display issue

**Debug Steps:**
```javascript
// Check browser console
console.log(document.getElementById('rtVoucherWarning'));
// Should not be null

// Check if element exists
document.getElementById('rtVoucherWarning').style.display;
```

**Fix:**
- Verify element ID in HTML: `rtVoucherWarning`
- Check JavaScript updates element correctly
- Clear browser cache

---

### Issue 3: Stats not updating after download
**Symptoms:** Download voucher but stats unchanged

**Possible Causes:**
1. Browser cache
2. Need to refresh page
3. Stats endpoint not called

**Debug Steps:**
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Check Network tab for API calls
- Verify database updated

**Fix:**
- Refresh page after download
- Check if loadVoucherStats() called on page load

---

## ✅ Success Criteria

### Phase 2 is successful if:
- [ ] Separate stats display for RT and Regular ✅
- [ ] Stats numbers accurate (match database) ✅
- [ ] Warning banner shows when RT < 100 ✅
- [ ] Urgent banner shows when RT = 0 ✅
- [ ] No warning when RT >= 100 ✅
- [ ] Stats update after downloads ✅
- [ ] Stats update after CSV upload ✅
- [ ] No JavaScript errors ✅
- [ ] Clean, organized UI ✅
- [ ] Consistent across browsers ✅

---

## 📝 Test Results Template

```
=== PHASE 2 TESTING RESULTS ===
Date: _______________
Tester: _______________

Test 1 (Stats Display): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 2 (Warning < 100): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 3 (Urgent = 0): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 4 (No Warning > 100): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 5 (Update After RT Download): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 6 (Update After Regular Download): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 7 (Update After CSV Upload): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 8 (Stats Accuracy): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 9 (Warning Threshold): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 10 (Multiple Sessions): [ ] PASS [ ] FAIL
Notes: _______________________________

Overall Result: [ ] ALL PASS [ ] SOME FAIL

Issues Found:
1. _______________________________
2. _______________________________

Ready for Production: [ ] YES [ ] NO
```

---

## 🚀 Next Steps

### If All Tests Pass:
1. ✅ Mark Phase 2 as complete
2. ⏭️ Proceed to Phase 3 (CSV Template)
3. 📝 Update documentation

### If Tests Fail:
1. 🐛 Debug and fix issues
2. 🔄 Re-test failed scenarios
3. 📋 Document fixes made

---

**Testing Guide Version:** 1.0
**Last Updated:** December 3, 2024
**Status:** Ready for Testing
