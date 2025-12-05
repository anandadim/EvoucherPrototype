# Changelog: Export CSV dengan Voucher SRP Data

## Perubahan

### Sebelum:
Export CSV hanya menampilkan data dari tabel `downloads`:
- id
- phone_number
- voucher_code
- ip_address
- user_agent
- download_time

**Masalah:** Tidak ada informasi voucher SRP (voucher_number dan store)

### Sesudah:
Export CSV dengan JOIN ke tabel `voucher_srp`:
- download_id (dari downloads.id)
- phone_number
- voucher_code
- **voucher_srp** (voucher_number dari tabel voucher_srp) ← NEW
- **store** (dari tabel voucher_srp) ← NEW
- ip_address
- user_agent
- download_time

**Filter:** Hanya download yang `is_deleted = 0` (active)

## Query Baru

```sql
SELECT 
  d.id as download_id,
  d.phone_number,
  d.voucher_code,
  v.voucher_number as voucher_srp,
  v.store,
  d.ip_address,
  d.user_agent,
  d.download_time
FROM downloads d
INNER JOIN voucher_srp v ON v.used_by_download_id = d.id
WHERE d.is_deleted = 0
ORDER BY d.download_time DESC
```

## Manfaat

1. ✅ **Data Lebih Lengkap** - Termasuk voucher_number dan store dari voucher SRP
2. ✅ **Relasi Jelas** - Bisa lihat voucher SRP mana yang digunakan untuk setiap download
3. ✅ **Filter Active** - Hanya export download yang aktif (tidak termasuk yang dihapus)
4. ✅ **Audit Trail** - Lebih mudah untuk tracking dan reconciliation

## Format CSV Output

```csv
download_id,phone_number,voucher_code,voucher_srp,store,ip_address,user_agent,download_time
1,628123456789,VCH-ABC123,SRP-001,Store A,103.164.223.83,Mozilla/5.0...,2024-11-27 10:30:00
2,628987654321,VCH-DEF456,SRP-002,Store B,103.164.223.84,Mozilla/5.0...,2024-11-27 11:45:00
```

## Testing

### Test di Local:
1. Login ke admin panel
2. Klik tombol "Download CSV" atau "Export CSV"
3. Buka file CSV yang didownload
4. Verify kolom `voucher_srp` dan `store` ada dan terisi

### Test di Live Server:
```bash
# Restart server
pm2 restart voucher-app

# Test export
curl -I http://localhost:3000/api/admin/export-csv
```

## Backup

File backup tersimpan di: `server.js.backup`

Untuk restore jika ada masalah:
```bash
cp server.js.backup server.js
pm2 restart voucher-app
```

## Notes

- **INNER JOIN** digunakan, jadi hanya download yang punya relasi ke voucher_srp yang akan di-export
- Jika ada download tanpa voucher_srp (seharusnya tidak ada), tidak akan muncul di export
- Filter `is_deleted = 0` memastikan hanya download aktif yang di-export

## Rollback

Jika perlu rollback ke query lama:

```javascript
db.all('SELECT * FROM downloads WHERE is_deleted = 0 ORDER BY download_time DESC', (err, rows) => {
  // ...
  const fields = ['id', 'phone_number', 'voucher_code', 'ip_address', 'user_agent', 'download_time'];
  // ...
});
```

## Related Changes

Perubahan ini sejalan dengan:
- Soft delete implementation
- Data consistency fix
- Voucher SRP tracking improvement
