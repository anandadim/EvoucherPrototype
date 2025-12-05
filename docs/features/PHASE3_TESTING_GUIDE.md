# Phase 3 Testing Guide - CSV Template Download

## ✅ Implementation Complete!

**Date:** December 3, 2024
**Phase:** Phase 3 - CSV Template Download
**Status:** Ready for Testing

---

## 📋 Changes Implemented

### 1. New Endpoint: /api/admin/download-csv-template ✅
**File:** `server.js`
- Public endpoint (no auth required)
- Returns CSV template with header and 3 example rows
- Includes BOM for Excel UTF-8 support
- Filename: `template_voucher_bulk.csv`

**Template Content:**
```csv
Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,SRP-002
```

### 2. Download Button Added ✅
**File:** `public/admin.html`
- Button in "Generate Voucher Images (Bulk)" section
- Placed BEFORE file upload input (logical flow)
- Download icon for clarity
- Tooltip with explanation

---

## 🧪 Testing Checklist

### Test 1: Download Template ✅

**Steps:**
1. Login to admin panel
2. Scroll to "🖼️ Generate Voucher Images (Bulk)" section
3. Look for download button at top of section
4. Click "Download Template CSV" button

**Expected Results:**
- [ ] Button visible with download icon
- [ ] Button has secondary style (not primary)
- [ ] File downloads immediately
- [ ] Filename: `template_voucher_bulk.csv`
- [ ] No errors in console

---

### Test 2: Template Content ✅

**Steps:**
1. Download template (from Test 1)
2. Open file in text editor (Notepad, VS Code, etc.)
3. Check content

**Expected Results:**
- [ ] Header row: `Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP`
- [ ] 3 example rows present
- [ ] Row 1: Budi Santoso with SRP-001
- [ ] Row 2: Siti Aminah with RTT-0001-XXXXX (RT example)
- [ ] Row 3: Ahmad Rizki with SRP-002
- [ ] No extra blank lines
- [ ] Proper CSV format (comma-separated)

**Template Content:**
```csv
Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,SRP-002
```

---

### Test 3: Open in Excel ✅

**Steps:**
1. Download template
2. Open in Microsoft Excel or Google Sheets
3. Check formatting

**Expected Results:**
- [ ] Opens correctly (no encoding issues)
- [ ] Indonesian characters display correctly (if any)
- [ ] 4 columns visible
- [ ] 4 rows total (1 header + 3 data)
- [ ] No garbled text
- [ ] Commas not treated as data (proper column separation)

**Excel View:**
```
| Nama Customer  | No Handphone  | Tanggal Blasting | Kode Voucher SRP |
|----------------|---------------|------------------|------------------|
| Budi Santoso   | 081234567890  | 2024-12-03       | SRP-001          |
| Siti Aminah    | 081234567891  | 2024-12-03       | RTT-0001-XXXXX   |
| Ahmad Rizki    | 081234567892  | 2024-12-03       | SRP-002          |
```

---

### Test 4: Tooltip Functionality ✅

**Steps:**
1. Go to "Generate Voucher Images (Bulk)" section
2. Look for ℹ️ icon next to download button
3. Hover over "Apa itu template?" text

**Expected Results:**
- [ ] Tooltip appears on hover
- [ ] Tooltip text: "Template CSV berisi format yang benar dengan contoh data. Download, isi data Anda, lalu upload kembali."
- [ ] Tooltip readable and helpful
- [ ] Text has underline (indicates clickable/hoverable)

---

### Test 5: Use Template for Bulk Generation ✅

**Steps:**
1. Download template
2. Open in Excel/Google Sheets
3. Replace example data with real data (5-10 rows)
4. Save as CSV
5. Upload to bulk generation
6. Select template (e.g., Cibinong)
7. Click "Generate Images"

**Expected Results:**
- [ ] Upload successful
- [ ] Generation starts
- [ ] Progress bar shows
- [ ] Images generated successfully
- [ ] No format errors
- [ ] Batch created in history

**Example Real Data:**
```csv
Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
John Doe,081234567890,2024-12-03,SRP-100
Jane Smith,081234567891,2024-12-03,SRP-101
Bob Wilson,081234567892,2024-12-03,RTT-0025-ABCDE
```

---

### Test 6: Template with RT Vouchers ✅

**Goal:** Verify template shows both SRP- and RTT- examples

**Steps:**
1. Download template
2. Check example rows

**Expected Results:**
- [ ] Row 1 has SRP- voucher (regular)
- [ ] Row 2 has RTT- voucher (RT example)
- [ ] Row 3 has SRP- voucher (regular)
- [ ] Clear that both types are supported

**Why Important:**
- Users know they can use both SRP- and RTT- vouchers
- Shows correct format for RT vouchers (RTT-XXXX-XXXXX)

---

### Test 7: Multiple Downloads ✅

**Steps:**
1. Download template (1st time)
2. Download template again (2nd time)
3. Download template again (3rd time)

**Expected Results:**
- [ ] All downloads successful
- [ ] Same filename each time
- [ ] Same content each time
- [ ] No errors
- [ ] No rate limiting issues

---

### Test 8: Download Without Login ✅

**Goal:** Verify endpoint is public (no auth required)

**Steps:**
1. Logout from admin panel
2. Access URL directly: `https://voucher.tdn.id/api/admin/download-csv-template`
3. Or open in incognito/private window

**Expected Results:**
- [ ] Template downloads successfully
- [ ] No redirect to login page
- [ ] No authentication error
- [ ] Public access works

**Why Public:**
- Template is just example data (no sensitive info)
- Makes it easier for users to get template
- Can share URL directly

---

### Test 9: Button Styling ✅

**Steps:**
1. Go to admin panel
2. Check download button appearance

**Expected Results:**
- [ ] Button has secondary style (not primary blue)
- [ ] Download icon visible (arrow down)
- [ ] Text: "Download Template CSV"
- [ ] Button in light gray box (background: #f5f5f5)
- [ ] Tooltip icon (ℹ️) visible next to button
- [ ] Clean, professional look

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ [⬇ Download Template CSV]  ℹ️ Apa itu template? │
└─────────────────────────────────────────────────┘
```

---

### Test 10: Cross-Browser Compatibility ✅

**Steps:**
1. Test in Chrome
2. Test in Firefox
3. Test in Edge
4. Test in Safari (if available)

**Expected Results:**
- [ ] Download works in all browsers
- [ ] Filename correct in all browsers
- [ ] Content correct in all browsers
- [ ] Tooltip works in all browsers
- [ ] No browser-specific issues

---

## 📊 Template Specifications

### File Details:
- **Filename:** `template_voucher_bulk.csv`
- **Encoding:** UTF-8 with BOM (for Excel compatibility)
- **Format:** CSV (Comma-Separated Values)
- **Columns:** 4
- **Rows:** 4 (1 header + 3 examples)
- **Size:** ~200 bytes

### Column Specifications:
1. **Nama Customer** - String, customer name
2. **No Handphone** - String, phone number (08xxx format)
3. **Tanggal Blasting** - String, date (YYYY-MM-DD format)
4. **Kode Voucher SRP** - String, voucher code (SRP-XXX or RTT-XXXX-XXXXX)

### Example Values:
- **Regular Voucher:** SRP-001, SRP-002
- **RT Voucher:** RTT-0001-XXXXX
- **Phone:** 081234567890 (Indonesian format)
- **Date:** 2024-12-03 (ISO format)

---

## 🐛 Troubleshooting

### Issue 1: Download not starting
**Symptoms:** Click button but nothing happens

**Possible Causes:**
1. JavaScript error
2. Network issue
3. Server error

**Debug Steps:**
```javascript
// Check browser console
// Should see no errors

// Check Network tab
// Should see request to /api/admin/download-csv-template
// Status: 200 OK
```

**Fix:**
- Check server logs
- Verify endpoint exists
- Clear browser cache

---

### Issue 2: Garbled text in Excel
**Symptoms:** Special characters show as ??? or boxes

**Possible Causes:**
1. Encoding issue
2. BOM missing
3. Excel version issue

**Debug Steps:**
- Open in text editor (should look correct)
- Check file encoding (should be UTF-8)
- Try opening in Google Sheets

**Fix:**
- Verify BOM added in server code: `\uFEFF`
- Try "Import Data" in Excel instead of double-click

---

### Issue 3: Wrong format when uploading
**Symptoms:** Upload fails with format error

**Possible Causes:**
1. Modified template structure
2. Extra columns added
3. Header changed

**Debug Steps:**
- Compare with original template
- Check column names match exactly
- Check no extra commas

**Fix:**
- Download fresh template
- Don't modify header row
- Keep same column order

---

### Issue 4: Tooltip not showing
**Symptoms:** Hover over ℹ️ but no tooltip

**Possible Causes:**
1. Browser doesn't support title attribute
2. CSS issue
3. Element not hoverable

**Debug Steps:**
```javascript
// Check element
document.querySelector('[title]');
// Should return element with title attribute
```

**Fix:**
- Tooltip uses native HTML title attribute (should work everywhere)
- Try different browser
- Check if element visible

---

## ✅ Success Criteria

### Phase 3 is successful if:
- [ ] Download button visible and styled correctly ✅
- [ ] Template downloads successfully ✅
- [ ] Template content correct (header + 3 examples) ✅
- [ ] Opens correctly in Excel/Google Sheets ✅
- [ ] Tooltip shows helpful information ✅
- [ ] Can use template for bulk generation ✅
- [ ] Shows both SRP- and RTT- examples ✅
- [ ] Works in all major browsers ✅
- [ ] Public access (no auth required) ✅
- [ ] No errors or issues ✅

---

## 📝 Test Results Template

```
=== PHASE 3 TESTING RESULTS ===
Date: _______________
Tester: _______________

Test 1 (Download Template): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 2 (Template Content): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 3 (Open in Excel): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 4 (Tooltip): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 5 (Use for Bulk Generation): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 6 (RT Vouchers Example): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 7 (Multiple Downloads): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 8 (Public Access): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 9 (Button Styling): [ ] PASS [ ] FAIL
Notes: _______________________________

Test 10 (Cross-Browser): [ ] PASS [ ] FAIL
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
1. ✅ Mark Phase 3 as complete
2. ✅ All RT Voucher phases complete!
3. 📝 Update documentation
4. 🚀 Ready for production deployment

### If Tests Fail:
1. 🐛 Debug and fix issues
2. 🔄 Re-test failed scenarios
3. 📋 Document fixes made

---

## 📚 User Guide (for Admins)

### How to Use Template:

1. **Download Template**
   - Go to admin panel
   - Section: "Generate Voucher Images (Bulk)"
   - Click "Download Template CSV"

2. **Fill Data**
   - Open template in Excel/Google Sheets
   - Delete example rows (keep header!)
   - Add your customer data
   - Use correct voucher codes (SRP-XXX or RTT-XXXX-XXXXX)

3. **Upload & Generate**
   - Save as CSV
   - Upload to admin panel
   - Select template (Cibinong/Cileungsi)
   - Click "Generate Images"

4. **Download Results**
   - Wait for generation to complete
   - Download ZIP from Batch History
   - Extract and use images

---

**Testing Guide Version:** 1.0
**Last Updated:** December 3, 2024
**Status:** Ready for Testing
