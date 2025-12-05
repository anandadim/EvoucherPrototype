# 🖼️ Bulk Voucher Image Generation - User Guide

## 📋 Overview

Fitur ini memungkinkan admin untuk generate voucher images secara massal (bulk) berdasarkan file CSV yang di-upload.

## ✨ Features

- ✅ Upload CSV dengan data customer & voucher
- ✅ Generate voucher images secara otomatis
- ✅ QR Code untuk setiap voucher
- ✅ Batch management (history, download, delete)
- ✅ Download semua images sebagai ZIP
- ✅ Progress indicator saat generate
- ✅ Error handling & validation

---

## 📝 CSV Format

### Required Columns:
```csv
Nama Customer,No Handphone,Tanggal Blasting,Tanggal Berlaku,Kode Voucher SRP
```

### Example:
```csv
Nama Customer,No Handphone,Tanggal Blasting,Tanggal Berlaku,Kode Voucher SRP
John Doe,628123456789,25/11/2025,31/12/2025,VCH-ABC123
Jane Smith,628987654321,25/11/2025,31/12/2025,VCH-XYZ789
Ahmad Yani,628111222333,25/11/2025,31/12/2025,VCH-TEST001
```

### Field Descriptions:

| Field | Description | Format | Required |
|-------|-------------|--------|----------|
| **Nama Customer** | Nama pelanggan | Text | ❌ (tidak ditampilkan di voucher) |
| **No Handphone** | Nomor HP pelanggan | 628xxxxxxxxx | ❌ (tidak ditampilkan di voucher) |
| **Tanggal Blasting** | Tanggal kirim WhatsApp | DD/MM/YYYY | ✅ |
| **Tanggal Berlaku** | Tanggal expired voucher | DD/MM/YYYY | ✅ |
| **Kode Voucher SRP** | Kode voucher unik | Text | ✅ |

**Note:** Nama Customer dan No Handphone tidak ditampilkan di voucher image, hanya digunakan untuk metadata.

---

## 🎨 Voucher Design

### Layout:
```
┌─────────────────────────────────────┐
│  [LOGO]  TOKO DAGING NUSANTARA     │
│          Dapur & Memasak           │
├─────────────────────────────────────┤
│                                     │
│  [QR CODE]    ┌──────────────────┐ │
│   (Merah)     │  VCH-ABC123      │ │ <- Kode Voucher
│               └──────────────────┘ │
│                                     │
│               Tanggal Blasting:     │
│               25/11/2025            │
│                                     │
│               Berlaku sampai:       │
│               31/12/2025            │
│                                     │
│  Hanya bisa digunakan kurun waktu  │
│  1 minggu setelah tanggal download │
│  HANYA BERLAKU DI TDN CIBINONG     │
│                                     │
├─────────────────────────────────────┤
│  IG TikTok @tokodagingnusantara    │
│  @tdn.id                            │
│  [Red & Yellow Wave Design]         │
└─────────────────────────────────────┘
```

### Specifications:
- **Size:** 800x1200px (Portrait)
- **Format:** PNG
- **Color Scheme:** Red (#e31e24) & Yellow (#ffd700)
- **QR Code:** Contains voucher code
- **Background:** Light gray (#f5f5f5)

---

## 🚀 How to Use

### Step 1: Prepare CSV File
1. Create CSV file with required columns
2. Fill in data for each voucher
3. Save as `.csv` format

### Step 2: Upload & Generate
1. Login to Admin Panel
2. Scroll to **"Generate Voucher Images (Bulk)"** section
3. Click **"Choose File"** and select your CSV
4. Click **"Generate Images"** button
5. Wait for processing (progress bar will show)
6. Success message will show batch ID and statistics

### Step 3: Download Images
1. Check **"Batch History"** table
2. Find your batch (sorted by date)
3. Click **📥 Download** button
4. ZIP file will be downloaded automatically

### Step 4: Use Images
1. Extract ZIP file
2. Images are named: `{VoucherCode}.png`
3. Use for WhatsApp blasting or other purposes

---

## 📦 Batch Management

### Batch History Table

| Column | Description |
|--------|-------------|
| **Batch ID** | Unique identifier (batch_timestamp) |
| **Tanggal** | Creation date & time |
| **Total** | Total rows in CSV |
| **Berhasil** | Successfully generated images |
| **Error** | Failed generations |
| **Images** | Number of PNG files |
| **Actions** | Download (📥) / Delete (🗑️) |

### Actions:

**📥 Download:**
- Downloads all images as ZIP
- Includes `manifest.json` with details
- Filename: `{batchId}.zip`

**🗑️ Delete:**
- Deletes entire batch folder
- Removes all images permanently
- Confirmation required

---

## 📁 Folder Structure

```
generated_vouchers/
└── batch_1732518000000/
    ├── manifest.json
    ├── VCH-ABC123.png
    ├── VCH-XYZ789.png
    ├── VCH-TEST001.png
    └── ...
```

### manifest.json:
```json
{
  "batchId": "batch_1732518000000",
  "createdAt": "2025-11-25T13:20:00.000Z",
  "totalRows": 5,
  "successCount": 5,
  "errorCount": 0,
  "results": [
    {
      "row": 1,
      "voucherCode": "VCH-ABC123",
      "filename": "VCH_ABC123.png",
      "status": "success"
    },
    ...
  ]
}
```

---

## ⚠️ Error Handling

### Common Errors:

**1. Missing Required Fields**
```
Error: Missing required fields
```
**Solution:** Ensure all required columns are filled

**2. Invalid Date Format**
```
Error: Invalid date format
```
**Solution:** Use DD/MM/YYYY format (e.g., 25/11/2025)

**3. Duplicate Voucher Code**
```
Warning: Duplicate code detected
```
**Solution:** Each voucher code must be unique

**4. File Too Large**
```
Error: File size exceeds limit
```
**Solution:** Split CSV into smaller batches (max 10MB)

---

## 💡 Best Practices

### CSV Preparation:
1. ✅ Use UTF-8 encoding
2. ✅ Remove empty rows
3. ✅ Validate date formats
4. ✅ Check for duplicate codes
5. ✅ Test with small batch first

### Batch Size:
- **Recommended:** 50-100 vouchers per batch
- **Maximum:** 500 vouchers per batch
- **Processing Time:** ~1-2 seconds per voucher

### Storage Management:
- Delete old batches regularly
- Keep only recent batches
- Backup important batches before delete

---

## 🔧 Technical Details

### Image Generation:
- **Library:** node-canvas
- **QR Code:** qrcode library
- **Format:** PNG (lossless)
- **Size:** ~100-200KB per image

### Performance:
- **Generation Speed:** ~1-2 seconds per image
- **Concurrent Processing:** Sequential (one by one)
- **Memory Usage:** ~50MB per batch

### API Endpoints:
```
POST   /api/admin/generate-voucher-batch
GET    /api/admin/voucher-batches
GET    /api/admin/download-batch/:batchId
DELETE /api/admin/delete-batch/:batchId
```

---

## 📊 Sample CSV File

File: `sample_bulk_voucher.csv` (included in project)

```csv
Nama Customer,No Handphone,Tanggal Blasting,Tanggal Berlaku,Kode Voucher SRP
John Doe,628123456789,25/11/2025,31/12/2025,VCH-ABC123
Jane Smith,628987654321,25/11/2025,31/12/2025,VCH-XYZ789
Ahmad Yani,628111222333,25/11/2025,31/12/2025,VCH-TEST001
Siti Nurhaliza,628444555666,25/11/2025,31/12/2025,VCH-TEST002
Budi Santoso,628777888999,25/11/2025,31/12/2025,VCH-TEST003
```

---

## 🆘 Troubleshooting

### Issue: Images not generating
**Check:**
1. CSV format is correct
2. All required fields are filled
3. Server has enough disk space
4. Canvas library is installed

### Issue: Download not working
**Check:**
1. Batch exists in folder
2. Images were generated successfully
3. Browser allows downloads
4. No popup blocker active

### Issue: Slow generation
**Possible causes:**
1. Large batch size (>200 vouchers)
2. Server resource limitations
3. Network latency

**Solutions:**
1. Split into smaller batches
2. Upgrade server resources
3. Generate during off-peak hours

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error messages in console
3. Check admin activity logs
4. Contact system administrator

---

## 🔄 Version History

**v1.0.0** - Initial Release (25 Nov 2025)
- Bulk voucher image generation
- CSV upload & parsing
- Batch management
- ZIP download functionality
- Progress indicator
- Error handling

---

**Last Updated:** 25 November 2025  
**Feature Status:** ✅ Production Ready
