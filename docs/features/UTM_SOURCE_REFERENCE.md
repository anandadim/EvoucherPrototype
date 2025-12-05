# 📋 UTM Source Reference

**Last Updated:** 4 Desember 2024

---

## 🎯 Valid UTM Sources

### Currently Supported:

| UTM Source | Type | Voucher Pool | Description |
|------------|------|--------------|-------------|
| **RT01** | RT Voucher | RTT- prefix | RT community voucher (area 1) |
| **RT02** | RT Voucher | RTT- prefix | RT community voucher (area 2) |
| **direct** | Regular | SRP-/ADS- prefix | Direct access (no UTM parameter) |

---

## 🔧 Implementation Details

### Backend Validation (`server.js`)

**Line 377:**
```javascript
const validSources = ['RT01', 'RT02', 'direct'];
```

**Validation Logic:**
```javascript
if (utm_source && !validSources.includes(utm_source)) {
  return res.status(400).json({ 
    error: 'Link tidak valid. Silakan gunakan link yang diberikan oleh admin atau akses tanpa parameter.'
  });
}
```

---

### Frontend Validation (`public/script.js`)

**Line 18:**
```javascript
const validSources = ['RT01', 'RT02', 'direct'];
```

**Validation Logic:**
```javascript
if (utmSource !== 'direct' && !validSources.includes(utmSource)) {
  // Invalid UTM source - show error and disable download
  errorMessage.textContent = 'Link tidak valid...';
  downloadBtn.disabled = true;
  return;
}
```

---

## 📊 UTM Source Behavior

### RT01 & RT02 (RT Vouchers):

**Voucher Pool:**
- Uses vouchers with **RTT-** prefix
- Separate pool from regular vouchers
- Example: `RTT-0001-M0I0G`, `RTT-0002-XXXXX`

**Homepage:**
- Background: `images/homepage-rt.jpeg`
- Theme: Green, community-focused

**Voucher Display:**
- Background: `images/homepage-2-rt.png`
- Theme: Green voucher template

**Downloaded Image:**
- Template: `homepage-2-rt.png`
- Generated with RT branding

**Access URL:**
```
https://evoucher.com?utm_source=RT01
https://evoucher.com?utm_source=RT02
```

---

### direct (Regular Vouchers):

**Voucher Pool:**
- Uses vouchers with **SRP-** or **ADS-** prefix
- Separate pool from RT vouchers
- Example: `SRP-001`, `ADS-12345`

**Homepage:**
- Background: `images/homepage-1.jpeg`
- Theme: Regular/professional

**Voucher Display:**
- Background: `images/homepage-2.png`
- Theme: Regular voucher template

**Downloaded Image:**
- Template: `homepage-2.png`
- Generated with regular branding

**Access URL:**
```
https://evoucher.com
https://evoucher.com?utm_source=direct
```

---

## 🚫 Invalid UTM Sources

### Examples of INVALID sources:

```
❌ RT03  (not defined)
❌ RT04  (not defined)
❌ whatsapp  (not defined)
❌ instagram  (not defined)
❌ facebook  (not defined)
❌ random-text  (not defined)
```

**What Happens:**
1. Frontend shows error message
2. Download button disabled
3. User cannot proceed

**Error Message:**
```
"Link tidak valid. Silakan gunakan link yang diberikan oleh admin atau akses tanpa parameter."
```

---

## 🔄 Adding New UTM Sources

### If you want to add RT03, RT04, etc:

#### Step 1: Update Backend Validation

**File: `server.js` (Line 377)**
```javascript
// Before:
const validSources = ['RT01', 'RT02', 'direct'];

// After:
const validSources = ['RT01', 'RT02', 'RT03', 'RT04', 'direct'];
```

#### Step 2: Update Frontend Validation

**File: `public/script.js` (Line 18)**
```javascript
// Before:
const validSources = ['RT01', 'RT02', 'direct'];

// After:
const validSources = ['RT01', 'RT02', 'RT03', 'RT04', 'direct'];
```

#### Step 3: Update Logic (if needed)

**If RT03/RT04 should use same RT pool:**
```javascript
// In server.js and script.js
if (utmSource === 'RT01' || utmSource === 'RT02' || utmSource === 'RT03' || utmSource === 'RT04') {
  // Use RT voucher pool
}

// Or better, use array:
const rtSources = ['RT01', 'RT02', 'RT03', 'RT04'];
if (rtSources.includes(utmSource)) {
  // Use RT voucher pool
}
```

#### Step 4: Test New Sources

```bash
# Test RT03
http://localhost:3000?utm_source=RT03

# Test RT04
http://localhost:3000?utm_source=RT04
```

---

## 📈 UTM Source Usage Stats

### Check in Database:

```sql
-- Count downloads by UTM source
SELECT 
  utm_source,
  COUNT(*) as total_downloads,
  COUNT(DISTINCT phone_number) as unique_users
FROM downloads
GROUP BY utm_source
ORDER BY total_downloads DESC;
```

**Expected Results:**
```
utm_source | total_downloads | unique_users
-----------|-----------------|-------------
direct     | 150             | 145
RT01       | 45              | 42
RT02       | 30              | 28
```

---

## 🎯 Use Cases

### RT01 - RT Area 1
```
Purpose: Vouchers for RT community area 1
Target: Residents of specific RT area
Distribution: Via RT admin/WhatsApp group
Link: https://evoucher.com?utm_source=RT01
```

### RT02 - RT Area 2
```
Purpose: Vouchers for RT community area 2
Target: Residents of different RT area
Distribution: Via RT admin/WhatsApp group
Link: https://evoucher.com?utm_source=RT02
```

### direct - General Public
```
Purpose: Regular vouchers for general customers
Target: All customers
Distribution: Website, social media, general marketing
Link: https://evoucher.com
```

---

## 🔍 Debugging UTM Sources

### Check Current UTM:

**In Browser Console:**
```javascript
// Check URL parameter
console.log('UTM from URL:', new URLSearchParams(window.location.search).get('utm_source'));

// Check sessionStorage
console.log('UTM from storage:', sessionStorage.getItem('utm_source'));
```

### Check Database:

```sql
-- Check recent downloads
SELECT 
  id,
  phone_number,
  utm_source,
  download_time
FROM downloads
ORDER BY id DESC
LIMIT 20;
```

### Check Server Logs:

```bash
# PM2 logs
pm2 logs voucher-app --lines 50

# Look for:
# "UTM Source: RT01"
# "Generating voucher image for UTM: RT01"
```

---

## 📝 Best Practices

### 1. **Consistent Naming**
- Use uppercase: `RT01`, `RT02` (not `rt01`, `Rt01`)
- Keep it short and memorable
- Use numbers for variants: `RT01`, `RT02`, `RT03`

### 2. **Validation**
- Always validate on both frontend and backend
- Show clear error messages for invalid sources
- Log invalid attempts for monitoring

### 3. **Documentation**
- Document each UTM source purpose
- Keep track of which links are distributed where
- Monitor usage statistics

### 4. **Testing**
- Test each UTM source after adding
- Verify voucher pool separation
- Check downloaded image templates

---

## 🚀 Quick Reference

### Valid URLs:

```bash
# RT Vouchers
✅ https://evoucher.com?utm_source=RT01
✅ https://evoucher.com?utm_source=RT02

# Regular Vouchers
✅ https://evoucher.com
✅ https://evoucher.com?utm_source=direct

# Invalid
❌ https://evoucher.com?utm_source=RT03  (not defined yet)
❌ https://evoucher.com?utm_source=whatsapp  (not defined)
```

### Code Locations:

```
Backend Validation:  server.js (line 377)
Frontend Validation: public/script.js (line 18)
Voucher Logic:       server.js (line 320, 404, 464)
Image Logic:         server.js (line 1334)
                     public/script.js (line 26, 199)
```

---

## 💡 Future Enhancements

### Possible Additional Sources:

```javascript
// Social media tracking
'whatsapp'   // WhatsApp distribution
'instagram'  // Instagram posts
'facebook'   // Facebook ads

// Campaign tracking
'promo-jan'  // January promotion
'promo-feb'  // February promotion

// Partner tracking
'partner-A'  // Partner A distribution
'partner-B'  // Partner B distribution
```

**Note:** Each new source needs:
1. Add to `validSources` array
2. Define voucher pool (RT or Regular)
3. Define image templates (if different)
4. Update documentation
5. Test thoroughly

---

**Current Status:** 3 valid UTM sources (RT01, RT02, direct) ✅
