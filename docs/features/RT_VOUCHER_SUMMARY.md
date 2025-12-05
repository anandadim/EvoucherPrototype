# RT Voucher Implementation - Quick Summary

## 🎯 Goal
Memisahkan voucher pool untuk RT (Rukun Tetangga) dan Regular users.

---

## 📊 Voucher Types

| Type | Prefix | UTM Sources | Example |
|------|--------|-------------|---------|
| **RT Vouchers** | RTT- | RT01, RT02 | RTT-0001-LHIAM |
| **Regular Vouchers** | SRP- | direct, whatsapp, instagram | SRP-001 |

---

## 🔧 Implementation Phases

### ✅ Phase 1: Core Logic (MUST HAVE)
**What:** Separate voucher allocation by UTM source
**Files:** `server.js` (4 changes)
**Time:** 30-45 min
**Risk:** MEDIUM

**Changes:**
1. Update valid UTM sources list
2. Check quota by voucher type (2 locations)
3. Select voucher by type
4. Update error messages

**Testing:**
- RT01 → Gets RTT- voucher ✓
- RT02 → Gets RTT- voucher ✓
- direct → Gets SRP- voucher ✓
- whatsapp → Gets SRP- voucher ✓

---

### ✅ Phase 2: Admin Stats (NICE TO HAVE)
**What:** Show separate stats for RT vs Regular vouchers
**Files:** `server.js`, `admin-script.js`, `admin.html`
**Time:** 45-60 min
**Risk:** LOW

**Features:**
- Separate stats cards (RT vs Regular)
- Warning banner when RT vouchers < 100
- Urgent banner when RT vouchers = 0

**UI:**
```
📦 Regular Vouchers (SRP-)
[Total: 5000] [Tersedia: 3200] [Terpakai: 1800]

🏘️ RT Vouchers (RTT-)
[Total: 1000] [Tersedia: 975] [Terpakai: 25]

⚠️ Peringatan: Voucher RT tersisa 75. Segera upload voucher baru!
```

---

### ✅ Phase 3: CSV Template (NICE TO HAVE)
**What:** Download button for CSV template
**Files:** `server.js`, `admin.html`
**Time:** 15-30 min
**Risk:** VERY LOW

**Features:**
- Download template button
- Template includes header + 3 example rows
- Tooltip with simple instructions

---

## 🚀 Quick Start

### 1. Upload RT Vouchers
Upload file `voucher_numbers_RTT_1764750961423.csv` via admin panel

### 2. Implement Phase 1
Copy-paste code changes from `RT_VOUCHER_IMPLEMENTATION.md` Phase 1

### 3. Test
- Access `https://voucher.tdn.id/?utm_source=RT01`
- Download voucher
- Verify voucher number starts with `RTT-`

### 4. Deploy
```bash
git add server.js
git commit -m "Phase 1: RT voucher separation"
git push
pm2 restart voucher-app
```

---

## 📋 URLs for Testing

| UTM Source | URL | Expected Voucher |
|------------|-----|------------------|
| RT01 | `https://voucher.tdn.id/?utm_source=RT01` | RTT-XXXX-XXXXX |
| RT02 | `https://voucher.tdn.id/?utm_source=RT02` | RTT-XXXX-XXXXX |
| Direct | `https://voucher.tdn.id/` | SRP-XXX |
| WhatsApp | `https://voucher.tdn.id/?utm_source=whatsapp` | SRP-XXX |
| Instagram | `https://voucher.tdn.id/?utm_source=instagram` | SRP-XXX |

---

## 🔍 Key Code Locations

### Valid UTM Sources (Line ~365)
```javascript
const validSources = ['RT01', 'RT02', 'direct', 'whatsapp', 'instagram'];
```

### Voucher Selection Logic (Line ~428)
```javascript
if (utmSource === 'RT01' || utmSource === 'RT02') {
  // Get RTT- voucher
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RTT-%' ORDER BY id ASC LIMIT 1";
} else {
  // Get SRP- voucher
  voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%' ORDER BY id ASC LIMIT 1";
}
```

---

## ⚠️ Important Notes

### Adding New RT Sources (RT03, RT04, ...)
1. Update `validSources` array
2. Update condition: `utmSource === 'RT01' || utmSource === 'RT02' || utmSource === 'RT03'`
3. Deploy

### Voucher Pool Management
- RT vouchers (RTT-) shared by all RT sources (RT01, RT02, RT03, ...)
- Regular vouchers (SRP-) shared by direct, whatsapp, instagram
- Pools are completely separate (no mixing)

### Error Handling
- RT voucher habis → Show "Voucher RT sudah mencapai batas kuota"
- Regular voucher habis → Show "Kuota voucher sudah habis"
- Different error messages for better UX

---

## 📊 Database Queries (Useful)

### Check RT voucher stats:
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available
FROM voucher_srp 
WHERE voucher_number LIKE 'RTT-%';
```

### Check downloads by RT source:
```sql
SELECT utm_source, COUNT(*) as total
FROM downloads
WHERE utm_source IN ('RT01', 'RT02')
GROUP BY utm_source;
```

### Find which RT got which voucher:
```sql
SELECT 
  d.utm_source,
  v.voucher_number,
  d.phone_number
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE v.voucher_number LIKE 'RTT-%'
ORDER BY d.download_time DESC
LIMIT 10;
```

---

## ✅ Success Criteria

### Phase 1:
- [ ] RT01 users get RTT- vouchers
- [ ] RT02 users get RTT- vouchers
- [ ] Direct users get SRP- vouchers
- [ ] No mixing between pools
- [ ] Proper error messages

### Phase 2:
- [ ] Admin panel shows separate stats
- [ ] Warning shows when RT < 100
- [ ] Stats update in real-time

### Phase 3:
- [ ] Template downloads successfully
- [ ] Template format correct
- [ ] Can use template for bulk generation

---

## 🆘 Troubleshooting

### Issue: RT users getting SRP vouchers
**Cause:** UTM source not recognized or validation failed
**Fix:** Check `validSources` array includes RT01, RT02

### Issue: "Voucher habis" but vouchers available
**Cause:** Quota check looking at wrong pool
**Fix:** Verify quota check uses correct LIKE condition (RTT- vs SRP-)

### Issue: Stats showing 0 for RT vouchers
**Cause:** No RTT- vouchers in database
**Fix:** Upload RT vouchers CSV via admin panel

---

**Document Version:** 1.0
**Last Updated:** December 3, 2024
**Status:** Ready for Implementation
