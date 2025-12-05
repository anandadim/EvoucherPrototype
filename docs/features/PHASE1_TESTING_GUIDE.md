# Phase 1 Testing Guide - RT Voucher Implementation

## ✅ Implementation Complete!

**Date:** December 3, 2024
**Phase:** Phase 1 - Core RT Voucher Logic
**Status:** Ready for Testing

---

## 📋 Changes Implemented

### 1. Valid UTM Sources Updated ✅
**File:** `server.js` (Line ~361)
```javascript
const validSources = ['RT01', 'RT02', 'direct', 'whatsapp', 'instagram'];
```

### 2. Quota Check by Type (check-download) ✅
**File:** `server.js` (Line ~297)
- RT01/RT02 → Check RTT- vouchers
- Others → Check SRP- vouchers

### 3. Quota Check by Type (record-download) ✅
**File:** `server.js` (Line ~395)
- RT01/RT02 → Check RTT- vouchers
- Others → Check SRP- vouchers
- Different error messages

### 4. Voucher Selection by Type ✅
**File:** `server.js` (Line ~451)
- RT01/RT02 → Get RTT- voucher (FIFO)
- Others → Get SRP- voucher (FIFO)

### 5. Frontend Update ✅
**File:** `public/script.js` (Line ~98)
- Send utm_source in check-download request
- Show different error message for RT vs Regular

---

## 🧪 Testing Checklist

### Pre-Testing Setup:
- [ ] Upload RT vouchers CSV (25 vouchers RTT-)
- [ ] Verify database has both SRP- and RTT- vouchers
- [ ] Backup current database (optional)

### Test 1: RT01 Download ✅
**URL:** `https://voucher.tdn.id/?utm_source=RT01`

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456789`
3. Click "Download Voucher"
4. Wait for voucher image to generate

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `RTT-` (e.g., RTT-0001-LHIAM)
- [ ] Image shows correct voucher number
- [ ] No errors in console

**Database Verification:**
```sql
-- Check downloads table
SELECT * FROM downloads WHERE phone_number = '628123456789' ORDER BY id DESC LIMIT 1;
-- Expected: utm_source = 'RT01'

-- Check voucher_srp table
SELECT * FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 1 ORDER BY id ASC LIMIT 1;
-- Expected: is_used = 1, used_by_download_id = [download_id]
```

---

### Test 2: RT02 Download ✅
**URL:** `https://voucher.tdn.id/?utm_source=RT02`

**Steps:**
1. Open URL in browser (use different browser or incognito)
2. Enter phone number: `628123456790`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `RTT-`
- [ ] Different voucher from Test 1 (FIFO order)
- [ ] utm_source = 'RT02' in database

---

### Test 3: Direct Download (No UTM) ✅
**URL:** `https://voucher.tdn.id/`

**Steps:**
1. Open URL in browser (new session)
2. Enter phone number: `628123456791`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `SRP-` (e.g., SRP-001)
- [ ] utm_source = 'direct' in database
- [ ] Does NOT get RTT- voucher

**Database Verification:**
```sql
SELECT * FROM downloads WHERE phone_number = '628123456791';
-- Expected: utm_source = 'direct', voucher linked to SRP- voucher
```

---

### Test 4: WhatsApp Download ✅
**URL:** `https://voucher.tdn.id/?utm_source=whatsapp`

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456792`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `SRP-`
- [ ] utm_source = 'whatsapp' in database

---

### Test 5: Instagram Download ✅
**URL:** `https://voucher.tdn.id/?utm_source=instagram`

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456793`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `SRP-`
- [ ] utm_source = 'instagram' in database

---

### Test 6: Invalid UTM Source (Fallback to Direct) ✅
**URL:** `https://voucher.tdn.id/?utm_source=invalid123`

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456794`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Voucher downloads successfully
- [ ] Voucher number starts with `SRP-` (fallback to regular)
- [ ] utm_source = 'direct' in database (sanitized)

---

### Test 7: RT Voucher Habis ⚠️
**Setup:** Mark all RTT- vouchers as used

```sql
UPDATE voucher_srp SET is_used = 1 WHERE voucher_number LIKE 'RTT-%';
```

**URL:** `https://voucher.tdn.id/?utm_source=RT01`

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456795`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Error message: "Voucher RT sudah mencapai batas kuota. Silakan hubungi administrator."
- [ ] Download button disabled
- [ ] No voucher generated
- [ ] Regular vouchers (SRP-) still work for direct/whatsapp/instagram

**Cleanup:**
```sql
-- Reset RT vouchers for further testing
UPDATE voucher_srp SET is_used = 0 WHERE voucher_number LIKE 'RTT-%';
```

---

### Test 8: Regular Voucher Habis ⚠️
**Setup:** Mark all SRP- vouchers as used

```sql
UPDATE voucher_srp SET is_used = 1 WHERE voucher_number LIKE 'SRP-%';
```

**URL:** `https://voucher.tdn.id/` (direct)

**Steps:**
1. Open URL in browser
2. Enter phone number: `628123456796`
3. Click "Download Voucher"

**Expected Results:**
- [ ] Error message: "Kuota voucher sudah habis. Silakan hubungi administrator."
- [ ] Download button disabled
- [ ] No voucher generated
- [ ] RT vouchers (RTT-) still work for RT01/RT02

**Cleanup:**
```sql
-- Reset regular vouchers
UPDATE voucher_srp SET is_used = 0 WHERE voucher_number LIKE 'SRP-%';
```

---

### Test 9: FIFO Order Verification ✅
**Goal:** Verify vouchers are allocated in FIFO order (First In First Out)

**Steps:**
1. Check current RT vouchers order:
```sql
SELECT id, voucher_number, is_used FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%' 
ORDER BY id ASC 
LIMIT 5;
```

2. Download 3 RT vouchers (RT01):
   - Phone: 628111111111
   - Phone: 628111111112
   - Phone: 628111111113

3. Verify allocation order:
```sql
SELECT d.phone_number, v.id, v.voucher_number 
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE v.voucher_number LIKE 'RTT-%'
ORDER BY d.id ASC;
```

**Expected Results:**
- [ ] First download gets voucher with lowest id
- [ ] Second download gets voucher with next lowest id
- [ ] Third download gets voucher with next lowest id
- [ ] FIFO order maintained

---

### Test 10: Pool Separation Verification ✅
**Goal:** Verify RT and Regular pools are completely separated

**Steps:**
1. Count available vouchers:
```sql
-- RT vouchers
SELECT COUNT(*) as rt_available FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;

-- Regular vouchers
SELECT COUNT(*) as regular_available FROM voucher_srp 
WHERE voucher_number LIKE 'SRP-%' AND is_used = 0;
```

2. Download 5 RT vouchers (RT01/RT02)
3. Download 5 Regular vouchers (direct/whatsapp)
4. Recount:

**Expected Results:**
- [ ] RT available decreased by 5
- [ ] Regular available decreased by 5
- [ ] No mixing between pools
- [ ] RT users never get SRP- vouchers
- [ ] Regular users never get RTT- vouchers

---

## 📊 Database Queries for Monitoring

### Check RT Voucher Stats:
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

### Check Regular Voucher Stats:
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
FROM voucher_srp 
WHERE voucher_number LIKE 'SRP-%';
```

### Check Downloads by UTM Source:
```sql
SELECT 
  utm_source,
  COUNT(*) as total,
  COUNT(DISTINCT phone_number) as unique_users
FROM downloads
WHERE is_deleted = 0
GROUP BY utm_source
ORDER BY total DESC;
```

### Check RT Voucher Allocation:
```sql
SELECT 
  d.utm_source,
  v.voucher_number,
  d.phone_number,
  d.download_time
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE v.voucher_number LIKE 'RTT-%'
ORDER BY d.download_time DESC
LIMIT 10;
```

### Check Regular Voucher Allocation:
```sql
SELECT 
  d.utm_source,
  v.voucher_number,
  d.phone_number,
  d.download_time
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE v.voucher_number LIKE 'SRP-%'
ORDER BY d.download_time DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue 1: RT users getting SRP vouchers
**Symptoms:** RT01/RT02 users receive SRP-XXX vouchers

**Possible Causes:**
1. UTM source not captured correctly
2. Validation logic not working
3. Query condition wrong

**Debug Steps:**
```javascript
// Check console log in browser
console.log('UTM Source:', sessionStorage.getItem('utm_source'));

// Check server logs
pm2 logs voucher-app --lines 50
```

**Fix:**
- Verify `validSources` array includes RT01, RT02
- Check voucher selection query uses correct LIKE condition

---

### Issue 2: "Voucher habis" but vouchers available
**Symptoms:** Error message shows voucher habis, but database has available vouchers

**Possible Causes:**
1. Quota check looking at wrong pool
2. Query condition wrong

**Debug Steps:**
```sql
-- Check if RTT- vouchers exist
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'RTT-%' AND is_used = 0;

-- Check if SRP- vouchers exist
SELECT COUNT(*) FROM voucher_srp WHERE voucher_number LIKE 'SRP-%' AND is_used = 0;
```

**Fix:**
- Verify quota check query uses correct LIKE condition
- Check utmSource variable is passed correctly

---

### Issue 3: Error in console
**Symptoms:** JavaScript errors in browser console

**Debug Steps:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Common Errors:**
- `utm_source is not defined` → Check sessionStorage
- `500 Internal Server Error` → Check server logs
- `403 Forbidden` → Check quota or duplicate download

---

## ✅ Success Criteria

### Phase 1 is successful if:
- [ ] RT01 users get RTT- vouchers ✅
- [ ] RT02 users get RTT- vouchers ✅
- [ ] Direct users get SRP- vouchers ✅
- [ ] WhatsApp users get SRP- vouchers ✅
- [ ] Instagram users get SRP- vouchers ✅
- [ ] No mixing between pools ✅
- [ ] FIFO order maintained ✅
- [ ] Proper error messages ✅
- [ ] No JavaScript errors ✅
- [ ] No server errors ✅

---

## 📝 Test Results Template

```
=== PHASE 1 TESTING RESULTS ===
Date: _______________
Tester: _______________

Test 1 (RT01): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 2 (RT02): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 3 (Direct): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 4 (WhatsApp): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 5 (Instagram): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 6 (Invalid UTM): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 7 (RT Habis): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 8 (Regular Habis): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 9 (FIFO Order): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 10 (Pool Separation): [ ] PASS [ ] FAIL
Notes: _______________________________

Overall Result: [ ] ALL PASS [ ] SOME FAIL

Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________

Ready for Production: [ ] YES [ ] NO
```

---

## 🚀 Next Steps

### If All Tests Pass:
1. ✅ Mark Phase 1 as complete
2. ⏭️ Proceed to Phase 2 (Admin Stats)
3. 📝 Update documentation

### If Tests Fail:
1. 🐛 Debug and fix issues
2. 🔄 Re-test failed scenarios
3. 📋 Document fixes made

---

**Testing Guide Version:** 1.0
**Last Updated:** December 3, 2024
**Status:** Ready for Testing
