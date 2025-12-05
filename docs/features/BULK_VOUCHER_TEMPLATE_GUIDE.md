# Panduan Bulk Voucher Generation dengan Template Cabang

## Fitur Baru

Sekarang Anda bisa memilih template berbeda untuk setiap cabang saat generate bulk voucher images.

## Template yang Tersedia

1. **Default Template** - `voucher-template.jpeg`
2. **Cabang Cibinong** - `voucher-template-cibinong.jpg`
3. **Cabang Cileungsi** - `voucher-template-cileungsi.jpg`

## Cara Menggunakan

### 1. Login ke Admin Panel
Akses: `https://voucher.tdn.id/admin.html`

### 2. Scroll ke Section "Generate Voucher Images (Bulk)"

### 3. Upload File CSV
- Klik "Upload File CSV"
- Pilih file CSV dengan format:
  ```
  Nama Customer, No Handphone, Tanggal Blasting, Kode Voucher SRP, Mekanisme
  ```

### 4. Pilih Template Cabang
- Pilih template dari dropdown:
  - **Default Template** - Untuk voucher umum
  - **Cabang Cibinong** - Untuk voucher khusus cabang Cibinong
  - **Cabang Cileungsi** - Untuk voucher khusus cabang Cileungsi

### 5. Klik "Generate Images"
- Sistem akan memproses CSV dan generate voucher images
- Progress bar akan menunjukkan status
- Setelah selesai, akan muncul notifikasi dengan detail:
  - Total rows
  - Berhasil
  - Error
  - Batch ID

### 6. Download Hasil
- Scroll ke "Batch History"
- Klik tombol "Download ZIP" pada batch yang diinginkan
- File ZIP berisi semua voucher images yang sudah di-generate

## Format File CSV

```csv
Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP,Mekanisme
John Doe,628123456789,25/11/2024,VCH-ABC123,Promo Lebaran
Jane Smith,628987654321,25/11/2024,VCH-DEF456,Promo Lebaran
```

**Catatan:**
- No Handphone harus diawali dengan `628` (format Indonesia)
- Jika tidak ada prefix `628`, sistem akan otomatis menambahkan `62` di depan
- Tanggal format: DD/MM/YYYY

## Menambah Template Baru

Jika ingin menambah template cabang baru:

### 1. Upload Template Image
Upload file template ke folder: `public/images/`

Contoh: `voucher-template-bogor.jpg`

### 2. Update HTML
Edit file `public/admin.html`, tambahkan option baru di dropdown:

```html
<select id="templateSelect">
  <option value="voucher-template.jpeg">Default Template</option>
  <option value="voucher-template-cibinong.jpg">Cabang Cibinong</option>
  <option value="voucher-template-cileungsi.jpg">Cabang Cileungsi</option>
  <option value="voucher-template-bogor.jpg">Cabang Bogor</option> <!-- NEW -->
</select>
```

### 3. Restart Server
```bash
pm2 restart voucher-app
```

## Spesifikasi Template Image

Untuk hasil terbaik, template image harus memiliki:

- **Format**: JPEG atau PNG
- **Ukuran**: Sesuai kebutuhan (contoh: 1200x800 px)
- **Area untuk QR Code**: Kotak di kiri (koordinat: x=195, y=400, size=320)
- **Area untuk Voucher Code**: Oval di kanan (koordinat: x=1030, y=420)
- **Area untuk Tanggal**: Di bawah voucher code (koordinat: x=1030, y=500)
- **Area untuk No HP**: Di bawah tanggal (koordinat: x=1030, y=550)

## Troubleshooting

### Template tidak muncul di dropdown
- Pastikan file template sudah diupload ke `public/images/`
- Pastikan nama file sesuai dengan yang ada di HTML
- Restart browser (Ctrl+F5)

### Error saat generate
- Cek format CSV sudah benar
- Pastikan file template ada dan tidak corrupt
- Cek log server: `pm2 logs voucher-app`

### Voucher image tidak sesuai
- Cek koordinat overlay di function `generateBulkVoucherImage` di `server.js`
- Adjust koordinat sesuai dengan layout template Anda
- Koordinat yang bisa diubah:
  - `qrX`, `qrY`, `qrSize` - Posisi QR Code
  - `voucherX`, `voucherY` - Posisi Voucher Code
  - `tanggalBlastingY` - Posisi Tanggal
  - `noHandphoneY` - Posisi No HP

## Tips

1. **Gunakan template yang konsisten** - Pastikan semua template memiliki layout yang sama agar koordinat overlay tidak perlu diubah

2. **Test dengan 1-2 data dulu** - Sebelum generate ribuan voucher, test dulu dengan CSV kecil untuk memastikan hasilnya sesuai

3. **Backup template** - Simpan backup template original sebelum edit

4. **Naming convention** - Gunakan naming yang jelas: `voucher-template-{cabang}.jpg`

5. **Optimize image size** - Compress template image untuk mempercepat proses generation

## Contoh Use Case

### Scenario 1: Promo Khusus Cabang Cibinong
1. Siapkan CSV dengan data customer cabang Cibinong
2. Pilih template "Cabang Cibinong"
3. Generate images
4. Download ZIP dan kirim ke tim marketing Cibinong

### Scenario 2: Promo Nasional dengan Template Default
1. Siapkan CSV dengan data customer dari semua cabang
2. Pilih template "Default Template"
3. Generate images
4. Download ZIP dan distribute ke semua cabang

### Scenario 3: Generate untuk Multiple Cabang
1. Siapkan CSV terpisah untuk setiap cabang
2. Generate batch pertama dengan template Cibinong
3. Generate batch kedua dengan template Cileungsi
4. Download masing-masing ZIP sesuai cabang

## Support

Jika ada pertanyaan atau issue, hubungi tim IT dengan informasi:
- Batch ID
- Template yang digunakan
- Error message (jika ada)
- Screenshot (jika perlu)
