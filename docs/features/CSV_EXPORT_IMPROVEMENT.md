# CSV Export Improvement

## 📋 Summary

Menghilangkan kolom `voucher_code` dari export CSV dan menambahkan kolom `utm_source` untuk data yang lebih relevan.

## 🎯 Changes

### CSV Columns

**Before:**
```
download_id, phone_number, voucher_code, voucher_srp, store, ip_address, user_agent, download_time
```

**After:**
```
download_id, phone_number, voucher_srp, store, utm_source, ip_address, user_agent, download_time
```

### What Changed?
1. ❌ **Removed:** `voucher_code` - Internal generated code (not useful for analysis)
2. ✅ **Added:** `utm_source` - Marketing source tracking (useful for analysis)

## 💡 Rationale

### Why Remove voucher_code?
- `voucher_code` adalah kode internal yang di-generate sistem (e.g., VCH-ABC123)
- Tidak ada value untuk analisis atau reconciliation
- User hanya perlu `voucher_srp` (nomor voucher asli dari SRP)

### Why Add utm_source?
- Tracking marketing source (WhatsApp, Instagram, Direct, dll)
- Berguna untuk analisis efektivitas campaign
- Membantu decision making untuk marketing strategy

## 🔧 Implementation

### Server.js Changes

**Before:**
```javascript
const query = `
  SELECT 
    d.id as download_id,
    d.phone_number,
    d.voucher_code,        ← REMOVED
    v.voucher_number as voucher_srp,
    v.store,
    d.ip_address,
    d.user_agent,
    d.download_time
  FROM downloads d
  INNER JOIN voucher_srp v ON v.used_by_download_id = d.id
  WHERE d.is_deleted = 0
  ORDER BY d.download_time DESC
`;

const fields = ['download_id', 'phone_number', 'voucher_code', 'voucher_srp', 'store', 'ip_address', 'user_agent', 'download_time'];
```

**After:**
```javascript
const query = `
  SELECT 
    d.id as download_id,
    d.phone_number,
    v.voucher_number as voucher_srp,
    v.store,
    d.utm_source,          ← ADDED
    d.ip_address,
    d.user_agent,
    d.download_time
  FROM downloads d
  INNER JOIN voucher_srp v ON v.used_by_download_id = d.id
  WHERE d.is_deleted = 0
  ORDER BY d.download_time DESC
`;

const fields = ['download_id', 'phone_number', 'voucher_srp', 'store', 'utm_source', 'ip_address', 'user_agent', 'download_time'];
```

## 📊 CSV Example

### Before:
```csv
download_id,phone_number,voucher_code,voucher_srp,store,ip_address,user_agent,download_time
1,081234567890,VCH-ABC123,SRP-001,Cibinong,192.168.1.1,Mozilla/5.0...,2024-12-03 10:30:00
2,081234567891,VCH-DEF456,SRP-002,Cileungsi,192.168.1.2,Mozilla/5.0...,2024-12-03 10:31:00
```

### After:
```csv
download_id,phone_number,voucher_srp,store,utm_source,ip_address,user_agent,download_time
1,081234567890,SRP-001,Cibinong,whatsapp,192.168.1.1,Mozilla/5.0...,2024-12-03 10:30:00
2,081234567891,SRP-002,Cileungsi,instagram,192.168.1.2,Mozilla/5.0...,2024-12-03 10:31:00
```

## 📈 Benefits

### 1. Cleaner Data
- Removed redundant internal code
- Only relevant data for analysis

### 2. Better Analytics
- Can analyze which marketing channel is most effective
- Can track ROI per channel (WhatsApp vs Instagram vs Direct)
- Better decision making for marketing budget allocation

### 3. Consistent with UI
- CSV now matches what's shown in admin panel table
- No confusion about which voucher number to use

## 📝 Use Cases

### Marketing Analysis
```sql
-- Count downloads per UTM source
SELECT utm_source, COUNT(*) as total
FROM downloads
WHERE is_deleted = 0
GROUP BY utm_source
ORDER BY total DESC;
```

Result:
```
utm_source | total
-----------|------
whatsapp   | 150
instagram  | 80
direct     | 20
```

### Store Performance by Channel
```sql
-- Downloads per store per channel
SELECT v.store, d.utm_source, COUNT(*) as total
FROM downloads d
JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE d.is_deleted = 0
GROUP BY v.store, d.utm_source
ORDER BY v.store, total DESC;
```

## 🚀 Deployment

### Files to Upload:
1. ✅ server.js

### No Database Changes:
- ✅ No migration needed
- ✅ Column `utm_source` already exists in downloads table
- ✅ Just code update

### Steps:
```bash
# 1. Upload file
git add server.js
git commit -m "Improve CSV export: remove voucher_code, add utm_source"
git push

# 2. SSH to server
ssh user@server

# 3. Pull changes
cd /var/www/voucher-app
git pull

# 4. Restart app
pm2 restart voucher-app

# 5. Test export
# Download CSV from admin panel and verify columns
```

## 🔍 Testing

### Test Export CSV
1. Login to admin panel
2. Click "Download CSV" button
3. Open CSV file
4. Verify columns:
   - ✅ download_id
   - ✅ phone_number
   - ✅ voucher_srp (not voucher_code)
   - ✅ store
   - ✅ utm_source (new!)
   - ✅ ip_address
   - ✅ user_agent
   - ✅ download_time
5. Verify data is correct
6. Verify utm_source shows: whatsapp, instagram, direct, etc.

## 📝 Notes

### Backward Compatibility
- ✅ No breaking changes
- ✅ Old CSV exports still valid (just different columns)
- ✅ Database schema unchanged

### Future Enhancements
- [ ] Add more UTM parameters (utm_campaign, utm_medium)
- [ ] Add date range filter for export
- [ ] Add store filter for export
- [ ] Add UTM source filter for export

---

**Implementation Date:** 2024-12-03
**Status:** ✅ COMPLETED
**Ready for Deployment:** YES
