# Cara Adjust Koordinat Template Voucher

## Masalah

Template Cibinong dan Cileungsi tidak menampilkan QR code, voucher code, tanggal, dan nomor HP karena koordinat overlay tidak sesuai dengan layout template.

## Solusi

### Opsi 1: Gunakan Script Test (RECOMMENDED)

#### 1. Jalankan Script Test
```bash
node test-template-coordinates.js
```

Script ini akan generate 3 file test:
- `test-output-voucher-template.jpeg` (default)
- `test-output-voucher-template-cibinong.jpg`
- `test-output-voucher-template-cileungsi.jpg`

#### 2. Buka File Test
Buka file test di image viewer dan perhatikan:
- **Red box** = Area QR code
- **Red dots** = Center point untuk text (voucher code, tanggal, phone)

#### 3. Adjust Koordinat
Jika posisi tidak pas, edit file `test-template-coordinates.js`:

```javascript
{
  name: 'voucher-template-cibinong.jpg',
  coords: {
    qr: { x: 195, y: 400, size: 320 },  // Adjust x, y, size
    voucherCode: { x: 1030, y: 420, ... },  // Adjust x, y
    tanggal: { x: 1030, y: 500, ... },  // Adjust x, y
    phone: { x: 1030, y: 550, ... }  // Adjust x, y
  }
}
```

**Tips Adjust:**
- **Geser ke kanan**: Increase nilai `x`
- **Geser ke bawah**: Increase nilai `y`
- **Geser ke kiri**: Decrease nilai `x`
- **Geser ke atas**: Decrease nilai `y`
- **QR lebih besar**: Increase `size`
- **QR lebih kecil**: Decrease `size`

#### 4. Test Lagi
```bash
node test-template-coordinates.js
```

Ulangi sampai posisi pas.

#### 5. Copy Koordinat ke Server
Setelah koordinat pas, copy ke `server.js` di function `getTemplateCoordinates`:

```javascript
'voucher-template-cibinong.jpg': {
  qr: { x: 195, y: 400, size: 320 },
  voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
  tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
  phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
}
```

#### 6. Restart Server
```bash
pm2 restart voucher-app
```

---

### Opsi 2: Manual dengan Image Editor

#### 1. Buka Template di Image Editor
Buka file template (Photoshop, GIMP, Paint.NET, dll)

#### 2. Aktifkan Ruler/Grid
Enable ruler atau grid untuk melihat koordinat pixel

#### 3. Tentukan Area
Tentukan area untuk:
- **QR Code**: Kotak di kiri (catat x, y top-left corner dan size)
- **Voucher Code**: Text di kanan (catat x, y center point)
- **Tanggal**: Text di bawah voucher code (catat x, y center point)
- **Phone**: Text di bawah tanggal (catat x, y center point)

#### 4. Update Koordinat di server.js
Edit function `getTemplateCoordinates` dengan koordinat yang sudah dicatat.

---

## Contoh Koordinat untuk Template Berbeda

### Template Default (1200x800)
```javascript
qr: { x: 195, y: 400, size: 320 },
voucherCode: { x: 1030, y: 420, ... },
tanggal: { x: 1030, y: 500, ... },
phone: { x: 1030, y: 550, ... }
```

### Template dengan Layout Berbeda (contoh)
```javascript
// Jika QR code di tengah
qr: { x: 440, y: 300, size: 320 },

// Jika text di bawah QR
voucherCode: { x: 600, y: 650, ... },
tanggal: { x: 600, y: 700, ... },
phone: { x: 600, y: 750, ... }
```

---

## Troubleshooting

### QR Code tidak muncul
- Cek koordinat `qr.x` dan `qr.y` tidak keluar dari canvas
- Cek `qr.size` tidak terlalu besar
- Pastikan area QR di template tidak tertutup layer lain

### Text tidak muncul
- Cek koordinat `x` dan `y` berada di dalam canvas
- Cek warna text (`color`) kontras dengan background
  - Jika background putih, gunakan `#000000` (hitam)
  - Jika background gelap, gunakan `#ffffff` (putih)
- Cek font size tidak terlalu besar atau kecil

### Text terpotong
- Koordinat `x` dan `y` adalah **center point**
- Pastikan ada space cukup di kiri-kanan untuk text
- Reduce font size jika perlu

### QR Code terpotong
- Koordinat `x` dan `y` adalah **top-left corner**
- Pastikan `x + size` tidak melebihi canvas width
- Pastikan `y + size` tidak melebihi canvas height

---

## Quick Reference

### Sistem Koordinat Canvas
```
(0,0) -------- x -------->
  |
  |
  y
  |
  |
  v
```

### Text Alignment
```javascript
ctx.textAlign = 'center';  // x adalah center point
ctx.textAlign = 'left';    // x adalah left edge
ctx.textAlign = 'right';   // x adalah right edge
```

### Text Baseline
```javascript
ctx.textBaseline = 'middle';  // y adalah vertical center
ctx.textBaseline = 'top';     // y adalah top edge
ctx.textBaseline = 'bottom';  // y adalah bottom edge
```

---

## Setelah Adjust

1. **Test dengan 1 voucher dulu**
   - Upload CSV dengan 1 row saja
   - Generate dan cek hasilnya
   - Jika pas, baru generate bulk

2. **Simpan koordinat**
   - Dokumentasikan koordinat untuk setiap template
   - Buat backup file `server.js`

3. **Share ke tim**
   - Jika ada template baru, share koordinatnya
   - Update dokumentasi

---

## Kontak

Jika masih kesulitan adjust koordinat:
1. Screenshot template dengan ruler/grid
2. Screenshot hasil test output
3. Share koordinat yang sudah dicoba
4. Hubungi tim IT untuk bantuan
