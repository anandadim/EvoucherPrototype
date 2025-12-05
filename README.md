# 🎫 Sistem Voucher Elektronik

Aplikasi web untuk distribusi voucher digital dengan fitur manajemen lengkap dan keamanan yang ditingkatkan.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start server
npm start
```

Akses aplikasi di `http://localhost:3000`

### Production
```bash
# Set environment variables
export NODE_ENV=production
export SESSION_SECRET=$(openssl rand -base64 32)
export HTTPS_ENABLED=true
export COOKIE_SECURE=true

# Start with PM2
pm2 start server.js --name voucher-system
```

## 🔐 Security Features (v1.1.0)

✅ **Environment Variables** - Session secret tidak hardcoded  
✅ **Secure Cookies** - httpOnly, secure, sameSite protection  
✅ **HTTPS Enforcement** - Auto redirect HTTP ke HTTPS (production)  
✅ **Rate Limiting** - Anti brute force & DDoS protection  
✅ **Request Size Limit** - Mencegah memory exhaustion  

**Security Score:** 7/10 (Cukup Aman untuk Production)

## 📋 Default Credentials

**⚠️ WAJIB GANTI SETELAH DEPLOY!**

- Email: `admin@voucher.com`
- Password: `admin123` (atau sesuai `.env`)

## 🔧 Environment Variables

```env
SESSION_SECRET=<random-string-panjang>
ADMIN_DEFAULT_PASSWORD=<password-kuat>
PORT=3000
NODE_ENV=production
HTTPS_ENABLED=true
COOKIE_SECURE=true
```

## 📚 Dokumentasi

- [Dokumentasi Lengkap](DOKUMENTASI.md)
- [Security Improvements](SECURITY-IMPROVEMENTS.md)
- [HTML Documentation](dokumentasi.html)

## 🛡️ Rate Limits

- **General:** 100 requests / 15 menit per IP
- **Login:** 5 attempts / 15 menit per IP
- **Download:** 10 downloads / 1 jam per IP

## 🔄 Rollback

Jika ada masalah:
```bash
cp server.js.backup server.js
npm start
```

## 📞 Support

Untuk pertanyaan atau issue, check dokumentasi atau hubungi developer.

---

**Version:** 1.1.0 (Security Enhanced)  
**Last Updated:** November 2024
