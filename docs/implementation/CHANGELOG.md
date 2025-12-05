# Changelog

## [1.1.4] - 2024-11-11 - Voucher List Display

### ✨ Added
- Voucher list table in admin panel
- Display columns: voucher_number, store, created_at, status
- Pagination (10 rows per page)
- Status badge (Tersedia/Terpakai)
- Pagination controls (Previous, Page numbers, Next)
- Pagination info (Showing X-Y of Z vouchers)
- Auto-refresh after CSV upload

### 🔧 Backend
- New endpoint: `GET /api/admin/vouchers?page=X`
- Pagination support with limit and offset
- Returns voucher data with pagination metadata

### 🎨 Frontend
- New table in Voucher SRP Management section
- JavaScript pagination controls
- Formatted date display (Indonesian locale)
- Status badge styling (green/red)

---

## [1.1.3] - 2024-11-11 - CSV Upload Feature

### ✨ Added
- CSV upload endpoint: `/api/admin/upload-csv`
- Import vouchers from CSV file
- Duplicate detection (skip existing vouchers)
- Error handling and validation
- Upload statistics (imported, skipped, errors)
- Activity logging for CSV uploads
- File size limit: 10MB
- Supported CSV format: Voucher Number, Store, Status, Created at

### 📦 Dependencies
- Added `multer` for file upload handling
- Added `csv-parser` for CSV parsing
- Added `fs` for file operations

### 🔧 Technical
- Multer configuration with file type validation
- CSV parsing with flexible column names
- Async processing with callback chain
- Automatic file cleanup after processing

---

## [1.1.2] - 2024-11-09 - CSV Export Enhancement

### ✨ Added
- Added `user_agent` column to CSV export
- CSV export now includes: id, phone_number, voucher_code, ip_address, user_agent, download_time
- Dynamic filename with timestamp: `export_voucher_detail_YYYYMMDD_HHMMSS.csv`
- Example: `export_voucher_detail_20241109_143052.csv`

### 🗂️ Project Structure
- Created `utility/` folder for utility scripts
- Moved `reset-database.js`, `verify-reset.js`, `migrate-timezone.js` to `utility/`
- Added `utility/README.md` for documentation
- Removed backup folders and unused files

### 🧹 Cleanup
- Removed backup folders: `backup_20251108_202207/`, `backup_before_preview_20251108_205340/`
- Removed backup files: `server.js.backup`
- Removed Fastify migration files (not used)
- Removed `server - Copy.js`

---

## [1.1.1] - 2024-11-09 - Timezone Fix

### 🕐 Fixed
- Database timestamps now use Jakarta time (WIB/UTC+7) instead of UTC
- Changed `CURRENT_TIMESTAMP` to `datetime('now', 'localtime')` in all tables
- Fixed timezone for: downloads, admin_logs, blocked_ips, admin_users, voucher_srp
- All new records will automatically use Jakarta time

### 📝 Files Changed
- `server.js` - Updated all DATETIME DEFAULT values
- Added `TIMEZONE-FIX-SUMMARY.md` - Documentation
- Added `migrate-timezone.js` - Migration script for existing data

### ⚠️ Important
- Existing data in database still uses UTC
- Run `migrate-timezone.js` to update old data (optional)
- Time difference: +7 hours adjustment needed for old data

---

## [1.1.0] - 2024-11-08 - Security Enhanced

### 🔒 Security Improvements

#### Added
- Environment variables support dengan `dotenv`
- Rate limiting untuk semua endpoints
- Strict rate limiting untuk login (5 attempts / 15 min)
- Rate limiting untuk download (10 downloads / 1 hour)
- Secure cookie configuration (httpOnly, secure, sameSite)
- HTTPS enforcement untuk production
- Request size limit (10MB)
- Session secret dari environment variable
- Warning message untuk default credentials

#### Changed
- Session secret tidak lagi hardcoded
- Cookie configuration lebih aman
- Admin default password bisa di-set via environment variable
- Package version bump ke 1.1.0

#### Files Added
- `.env` - Environment variables (development)
- `.env.example` - Template untuk production
- `.gitignore` - Protect sensitive files
- `server.js.backup` - Backup versi sebelumnya
- `SECURITY-IMPROVEMENTS.md` - Dokumentasi security
- `README.md` - Quick start guide
- `CHANGELOG.md` - Version history

#### Dependencies Added
- `dotenv@^17.2.3` - Environment variables management
- `express-rate-limit@^8.2.1` - Rate limiting middleware

### 🧪 Testing
- ✅ Server startup successful
- ✅ Login functionality working
- ✅ Rate limiting tested and working
- ✅ Environment variables loaded correctly
- ✅ No diagnostics errors

### 📊 Security Score
- Before: 4/10 (TIDAK AMAN)
- After: 7/10 (CUKUP AMAN untuk Production)

### 🔄 Rollback Available
Backup file tersedia di `server.js.backup`

---

## [1.0.0] - 2024-11-07 - Initial Release

### Features
- Download voucher elektronik dengan QR Code
- Preview voucher sebelum download
- Admin panel dengan authentication
- Import voucher dari CSV
- IP blocking management
- Activity logging
- Export data ke CSV
- Tracking download dengan IP & User Agent

### Database
- SQLite3 dengan 6 tabel
- Bcrypt password hashing
- Session-based authentication

### Known Issues
- Session secret hardcoded (Fixed in 1.1.0)
- No rate limiting (Fixed in 1.1.0)
- Insecure cookie configuration (Fixed in 1.1.0)
- No HTTPS enforcement (Fixed in 1.1.0)
