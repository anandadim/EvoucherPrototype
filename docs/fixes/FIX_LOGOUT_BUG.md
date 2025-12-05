# Fix: Auto Logout Setelah Generate Voucher

## Masalah
Setelah berhasil generate voucher images, halaman otomatis logout dan redirect ke login page.

## Penyebab
1. **Session check yang gagal** - `loadBatchHistory()` memanggil `/api/admin/check-auth` yang mungkin gagal
2. **Unhandled 401 response** - Response 401 tidak di-handle dengan baik
3. **Race condition** - `loadBatchHistory()` dipanggil terlalu cepat setelah generate selesai

## Solusi yang Sudah Diterapkan

### 1. Tambah Session Touch
Di `server.js`, endpoint `/api/admin/generate-voucher-batch`:
```javascript
// Touch session to keep it alive during long process
req.session.touch();
```

### 2. Handle 401 Response di Generate
Di `public/admin-script.js`, generate bulk button handler:
```javascript
// Check if unauthorized (session expired)
if (response.status === 401) {
  alert('Session expired. Silakan login kembali.');
  window.location.href = 'admin-login.html';
  return;
}
```

### 3. Handle 401 di loadBatchHistory
Di `public/admin-script.js`, function `loadBatchHistory()`:
```javascript
// Check if unauthorized
if (authResponse.status === 401) {
  console.warn('Session expired during loadBatchHistory');
  return; // Don't redirect, just skip loading
}
```

### 4. Tambah Delay Sebelum Reload
Di `public/admin-script.js`, setelah generate success:
```javascript
// Reload batch history with delay to ensure server is ready
setTimeout(() => {
  loadBatchHistory().catch(err => {
    console.error('Error reloading batch history:', err);
  });
}, 1000);
```

### 5. Better Error Handling
Tambah try-catch dan console.error di semua async functions untuk debugging.

## Testing

### Test 1: Generate dengan CSV Kecil (1-5 rows)
```
1. Login ke admin panel
2. Upload CSV dengan 1-5 rows
3. Pilih template
4. Klik Generate
5. Tunggu sampai selesai
6. Cek apakah tetap login atau logout
```

### Test 2: Generate dengan CSV Besar (100+ rows)
```
1. Login ke admin panel
2. Upload CSV dengan 100+ rows
3. Pilih template
4. Klik Generate
5. Tunggu sampai selesai (bisa 1-2 menit)
6. Cek apakah tetap login atau logout
```

### Test 3: Cek Console Log
```
1. Buka Developer Tools (F12)
2. Buka tab Console
3. Generate voucher
4. Lihat apakah ada error di console
5. Jika ada error 401, berarti session expired
```

## Troubleshooting

### Masih Logout Setelah Fix

#### Cek 1: Session Timeout
```javascript
// Di server.js, cek session maxAge
cookie: { 
  maxAge: 24 * 60 * 60 * 1000, // 24 hours - cukup lama
  ...
}
```

Jika masih logout, increase maxAge:
```javascript
maxAge: 48 * 60 * 60 * 1000, // 48 hours
```

#### Cek 2: Server Timeout
Jika generate CSV besar (1000+ rows), server mungkin timeout.

**Solusi:** Increase server timeout di `server.js`:
```javascript
// Tambahkan setelah app initialization
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});
```

#### Cek 3: Nginx Timeout (jika pakai Nginx)
Jika pakai Nginx sebagai reverse proxy, tambahkan timeout di config:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    ...
}
```

#### Cek 4: Browser Console Error
Buka Developer Tools dan cek:
- Tab Console: Lihat error JavaScript
- Tab Network: Lihat request yang gagal (status 401, 500, dll)
- Tab Application > Cookies: Cek apakah cookie session ada

### Error: "Session expired during loadBatchHistory"

Ini warning normal jika session memang expired. Tidak akan redirect otomatis.

**Solusi:** Refresh page manual (F5) untuk login ulang.

### Error: "Failed to generate vouchers"

Cek log server:
```bash
pm2 logs voucher-app
```

Kemungkinan:
- Template image tidak ditemukan
- Koordinat overlay error
- Memory habis (jika CSV terlalu besar)

## Prevention

### 1. Batasi Ukuran CSV
Tambahkan validasi di frontend:
```javascript
if (file.size > 5 * 1024 * 1024) { // 5MB
  alert('File terlalu besar. Maksimal 5MB atau ~5000 rows');
  return;
}
```

### 2. Tambah Progress Real-time
Gunakan WebSocket atau Server-Sent Events untuk progress real-time, sehingga user tahu proses masih berjalan.

### 3. Background Job
Untuk CSV sangat besar (10000+ rows), gunakan background job queue (Bull, Bee-Queue) agar tidak block request.

## Monitoring

### Cek Session Active
```bash
# Di server, cek session store
# Jika pakai default memory store, session hilang saat restart
```

### Cek Memory Usage
```bash
pm2 monit
```

Jika memory usage tinggi saat generate, consider:
- Increase server memory
- Process CSV in chunks
- Use streaming instead of loading all to memory

## Rollback

Jika fix ini menyebabkan masalah lain, rollback dengan:
```bash
git checkout HEAD~1 public/admin-script.js server.js
pm2 restart voucher-app
```

## Support

Jika masih bermasalah:
1. Capture screenshot error
2. Export console log (Developer Tools > Console > Save as...)
3. Share PM2 logs: `pm2 logs voucher-app --lines 100 > logs.txt`
4. Hubungi tim IT dengan info di atas
