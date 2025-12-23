const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const { Parser } = require('@json2csv/plainjs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { createCanvas, Image } = require('canvas');
const QRCode = require('qrcode');
const { rateLimit } = require('express-rate-limit');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Trust only first proxy (Nginx)
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Security: Request size limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Security: Serve static files
app.use(express.static('public'));

// Security: Rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    // Skip rate limiting for check-auth endpoint
    return req.path === '/api/admin/check-auth';
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Terlalu banyak request dari IP ini, coba lagi nanti' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Strict rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ error: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit' });
  },
  skipSuccessfulRequests: true,
});

// Security: Rate limiting for download - ORIGINAL (COMMENTED)
// const downloadLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 10, // limit each IP to 10 downloads per hour
//   message: 'Terlalu banyak percobaan download, coba lagi nanti',
// });

// Security: NEW Rate limiting - Opsi 3 (IP longgar + Phone ketat)
const ipDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 downloads per IP per hour (longgar untuk shared IP)
  handler: (req, res) => {
    res.status(429).json({ error: 'Terlalu banyak request dari IP ini, coba lagi dalam 1 jam' });
  },
  standardHeaders: true,
  legacyHeaders: false
});

const phoneDownloadLimiter = rateLimit({
  keyGenerator: (req) => {
    // Only use phone number for rate limiting
    const phoneNumber = req.body?.phoneNumber;
    if (phoneNumber) {
      return `phone:${phoneNumber}`;
    }
    // Return undefined to skip this limiter (will use default IP-based)
    return undefined;
  },
  skip: (req) => {
    // Skip this limiter if no phone number provided
    return !req.body?.phoneNumber;
  },
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // 1 download per phone number per day
  handler: (req, res) => {
    res.status(429).json({ error: 'Nomor HP ini sudah pernah download hari ini' });
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Security: Session configuration with secure settings
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.COOKIE_SECURE === 'true' || isProduction, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
    },
    name: 'sessionId', // Don't use default 'connect.sid'
  })
);

// Security: Force HTTPS in production
if (isProduction && process.env.HTTPS_ENABLED === 'true') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', redirect: '/admin-login.html' });
}

// Database setup
const db = new sqlite3.Database('./voucher_downloads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
    initDatabase();
  }
});

async function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    voucher_code TEXT NOT NULL,
    download_time DATETIME DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS voucher_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_quota INTEGER DEFAULT 100,
    used_quota INTEGER DEFAULT 0,
    enable_navigation_pane INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS blocked_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT,
    blocked_by INTEGER NOT NULL,
    blocked_at DATETIME DEFAULT (datetime('now', 'localtime')),
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (blocked_by) REFERENCES admin_users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS voucher_srp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voucher_number TEXT UNIQUE NOT NULL,
    store TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by_download_id INTEGER,
    used_at DATETIME,
    FOREIGN KEY (used_by_download_id) REFERENCES downloads(id)
  )`);

  // Page views tracking table
  db.run(`CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utm_source TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    visit_time DATETIME DEFAULT (datetime('now', 'localtime')),
    visit_date DATE DEFAULT (date('now', 'localtime')),
    did_download INTEGER DEFAULT 0
  )`);

  // Bulk voucher upload tables
  db.run(`CREATE TABLE IF NOT EXISTS voucher_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT UNIQUE NOT NULL,
    batch_name TEXT,
    mekanisme TEXT,
    tanggal_blasting TEXT,
    total_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    deleted_by INTEGER,
    uploaded_at DATETIME DEFAULT (datetime('now', 'localtime')),
    uploaded_by INTEGER,
    FOREIGN KEY (uploaded_by) REFERENCES admin_users(id),
    FOREIGN KEY (deleted_by) REFERENCES admin_users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS voucher_batch_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    no_handphone TEXT NOT NULL,
    nama_customer TEXT,
    kode_voucher TEXT NOT NULL,
    mekanisme TEXT,
    tanggal_blasting TEXT,
    image_generated INTEGER DEFAULT 0,
    image_filename TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (batch_id) REFERENCES voucher_batches(batch_id)
  )`);

  // Initialize settings if not exists
  db.run(`INSERT OR IGNORE INTO voucher_settings (id, total_quota, used_quota) VALUES (1, 100, 0)`);

  // Create default admin user (email: admin@voucher.com, password from env)
  const defaultPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 10);
  db.run(
    `INSERT OR IGNORE INTO admin_users (id, email, password, name, role) VALUES (1, 'admin@voucher.com', ?, 'Administrator', 'admin')`,
    [defaultPassword],
    (err) => {
      if (!err && !isProduction) {
        console.log('⚠️  WARNING: Default admin credentials aktif!');
        console.log('   Email: admin@voucher.com');
        console.log('   Password:', process.env.ADMIN_DEFAULT_PASSWORD || 'admin123');
        console.log('   WAJIB ganti password setelah login pertama!');
      }
    }
  );

  // Create CRM admin user (limited access)
  const crmPassword = await bcrypt.hash('admincrm@123', 10);
  db.run(
    `INSERT OR IGNORE INTO admin_users (id, email, password, name, role) VALUES (2, 'admin_crm@voucher.com', ?, 'Admin CRM', 'crm')`,
    [crmPassword],
    (err) => {
      if (!err && !isProduction) {
        console.log('✅ CRM Admin user created:');
        console.log('   Email: admin_crm@voucher.com');
        console.log('   Password: admincrm@123');
        console.log('   Role: CRM (Limited Access)');
      }
    }
  );
}

// Get client IP address
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;

  // Convert IPv6 localhost to IPv4 for consistency
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
}

// Generate unique voucher code
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VCH-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if user already downloaded
app.post('/api/check-download', (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const { utm_source } = req.body;
  const utmSource = utm_source || 'direct';
  
  // Check if IP is blocked first
  db.get('SELECT * FROM blocked_ips WHERE ip_address = ? AND is_active = 1', [ipAddress], (err, blockedIp) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (blockedIp) {
      return res.json({ 
        alreadyDownloaded: true, 
        blocked: true,
        message: 'IP address Anda diblokir oleh administrator'
      });
    }

    // Check quota by voucher type
    let quotaQuery;
    if (utmSource !== 'direct') {
      // Check RT/RW vouchers (RCV- prefix) - for any Kel/RW/RT combination
      quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RCV-%'";
    } else {
      // Check regular vouchers (ADS- prefix)
      quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'ADS-%'";
    }

    db.get(quotaQuery, (err, quota) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (quota.available === 0) {
        return res.json({ 
          alreadyDownloaded: true, 
          quotaExceeded: true,
          voucherType: (utmSource !== 'direct') ? 'RT/RW' : 'regular'
        });
      }

      // Get settings for allow_redownload
      db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, settings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Check if redownload is allowed
        if (settings.allow_redownload === 1) {
          return res.json({ alreadyDownloaded: false, quotaExceeded: false, blocked: false });
        }

        // Check if already downloaded (only active records)
        db.get(
          'SELECT * FROM downloads WHERE (user_agent = ?) AND is_deleted = 0',
          [ userAgent],
          (err, row) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ alreadyDownloaded: !!row, quotaExceeded: false, blocked: false });
          }
        );
      });
    });
  });
});

// Track page view
app.post('/api/track-view', (req, res) => {
  const { utm_source } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || '(direct)';

  // Insert page view record
  db.run(
    `INSERT INTO page_views (utm_source, ip_address, user_agent, referrer) 
     VALUES (?, ?, ?, ?)`,
    [utm_source || 'direct', ipAddress, userAgent, referrer],
    function(err) {
      if (err) {
        console.error('Error tracking page view:', err);
        return res.status(500).json({ error: 'Failed to track view' });
      }

      res.json({ 
        success: true, 
        viewId: this.lastID 
      });
    }
  );
});

// Record download (with NEW rate limiting - IP + Phone)
//app.post('/api/record-download', ipDownloadLimiter, phoneDownloadLimiter, (req, res) => {
  app.post('/api/record-download', phoneDownloadLimiter, (req,res) =>{
  const { phoneNumber, utm_source } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  // Validate and sanitize UTM source
  // Whitelist of valid UTM sources
  // Define UTM source groups
  const pondokKacangSources = [
    'KelPondokKacangRW01RT04',
    'KelPondokKacangRW01RT02',
    'KelPondokKacangRW09RT03',
    'KelPondokKacangRW09RT01',
    'KelPondokKacangRW07RT15',
    'KelPondokKacangRW07RT05',
    'KelPondokKacangRW07RT07',
    'KelPondokKacangRW07RT04',
    'KelPondokKacangRW07RT06'
  ];

  const sukahatiSources = [
    'KelSukahatiRW09RT01',
    'KelSukahatiRW09RT02',
    'KelSukahatiRW09RT03',
    'KelSukahatiRW09RT04',
    'KelSukahatiRW09RT05',
    'KelSukahatiRW09RT06',
    'KelSukahatiRW09RT07',
    'KelSukahatiRW09RT08'
  ];

  const tengahSources = [
    'KelTengahRW07RT06',
    'KelTengahRW08RT01',
    'KelTengahRW08RT02',
    'KelTengahRW08RT03',
    'KelTengahRW08RT04',
    'KelTengahRW08RT05',
    'KelTengahRW08RT06'
  ];

  // Combine all valid sources
  const validUTMSources = [
    'direct',
    ...pondokKacangSources,
    ...sukahatiSources,
    ...tengahSources
  ];
  
  // Block invalid UTM sources
  if (utm_source && !validUTMSources.includes(utm_source)) {
    return res.status(400).json({ 
      error: 'Link tidak valid. Silakan gunakan link yang diberikan oleh RT/RW atau akses langsung tanpa parameter.'
    });
  }
  
  const utmSource = utm_source || 'direct';

  if (!phoneNumber || !phoneNumber.startsWith('628') || phoneNumber.length < 11 || phoneNumber.length > 14) {
    return res.status(400).json({ error: 'Invalid phone number. Must start with 628 and be 11-14 digits' });
  }

  // Check if IP is blocked
  db.get('SELECT * FROM blocked_ips WHERE ip_address = ? AND is_active = 1', [ipAddress], (err, blockedIp) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (blockedIp) {
      return res.status(403).json({ error: 'IP address Anda diblokir oleh administrator' });
    }

    // Check quota by voucher type
    let quotaQuery;
    if (utmSource !== 'direct') {
      // Check RT/RW vouchers (RCV- prefix) - for any Kel/RW/RT combination
      quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RCV-%'";
    } else {
      // Check regular vouchers (ADS- prefix)
      quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'ADS-%'";
    }

    db.get(quotaQuery, (err, quota) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (quota.available === 0) {
        const errorMessage = (utmSource !== 'direct')
          ? 'Voucher RT/RW sudah mencapai batas kuota. Silakan hubungi administrator.'
          : 'Kuota voucher sudah habis. Silakan hubungi administrator.';
        
        return res.status(403).json({ 
          error: errorMessage,
          voucherType: (utmSource !== 'direct') ? 'RT/RW' : 'regular'
        });
      }

      // Get settings for allow_redownload
      db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, settings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Check if redownload is allowed
        if (settings.allow_redownload === 1) {
          // Skip duplicate check, allow redownload
          processDownload();
          return;
        }

        // Check if already downloaded (only active records)
        db.get(
          'SELECT * FROM downloads WHERE (user_agent = ?) AND is_deleted = 0',
          [ userAgent],
          (err, row) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
              return res.status(403).json({ error: 'Voucher sudah pernah didownload' });
            }

            processDownload();
          }
        );

        function processDownload() {

          const voucherCode = generateVoucherCode();

          // Define UTM source groups for voucher allocation
          const pondokKacangSources = [
            'KelPondokKacangRW01RT04', 'KelPondokKacangRW01RT02', 'KelPondokKacangRW09RT03',
            'KelPondokKacangRW09RT01', 'KelPondokKacangRW07RT15', 'KelPondokKacangRW07RT05',
            'KelPondokKacangRW07RT07', 'KelPondokKacangRW07RT04', 'KelPondokKacangRW07RT06'
          ];
          const sukahatiSources = [
            'KelSukahatiRW09RT01', 'KelSukahatiRW09RT02', 'KelSukahatiRW09RT03', 'KelSukahatiRW09RT04',
            'KelSukahatiRW09RT05', 'KelSukahatiRW09RT06', 'KelSukahatiRW09RT07', 'KelSukahatiRW09RT08'
          ];
          const tengahSources = [
            'KelTengahRW07RT06', 'KelTengahRW08RT01', 'KelTengahRW08RT02', 'KelTengahRW08RT03',
            'KelTengahRW08RT04', 'KelTengahRW08RT05', 'KelTengahRW08RT06'
          ];

          // Get voucher by type based on UTM source (FIFO - First In First Out)
          let voucherQuery;
          let voucherType;
          
          if (pondokKacangSources.includes(utmSource)) {
            // Pondok Kacang voucher (GRC- prefix)
            voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'GRC-%' ORDER BY id ASC LIMIT 1";
            voucherType = 'Pondok Kacang';
          } else if (sukahatiSources.includes(utmSource) || tengahSources.includes(utmSource)) {
            // Sukahati/Tengah RT/RW voucher (RCV- prefix)
            voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'RCV-%' ORDER BY id ASC LIMIT 1";
            voucherType = 'RT/RW';
          } else if (utmSource === 'direct') {
            // Regular voucher (ADS- prefix)
            voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'ADS-%' ORDER BY id ASC LIMIT 1";
            voucherType = 'Regular';
          } else {
            // Fallback for unknown UTM
            voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 ORDER BY id ASC LIMIT 1";
            voucherType = 'Unknown';
          }

          db.get(voucherQuery, (err, voucher) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (!voucher) {
              const errorMessage = `Voucher ${voucherType} habis. Silakan hubungi administrator.`;
              
              return res.status(403).json({ 
                error: errorMessage,
                voucherType: voucherType
              });
            }

            // Record the download with UTM source
            db.run(
              'INSERT INTO downloads (phone_number, ip_address, user_agent, voucher_code, utm_source) VALUES (?, ?, ?, ?, ?)',
              [phoneNumber, ipAddress, userAgent, voucherCode, utmSource],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to record download' });
                }

                const downloadId = this.lastID;

                // Mark voucher as used
                db.run(
                  "UPDATE voucher_srp SET is_used = 1, used_by_download_id = ?, used_at = datetime('now', 'localtime') WHERE id = ?",
                  [downloadId, voucher.id]
                );

                // Update used quota
                db.run('UPDATE voucher_settings SET used_quota = used_quota + 1 WHERE id = 1');

                // Mark page view as downloaded (update most recent view from this IP)
                db.run(
                  `UPDATE page_views 
                   SET did_download = 1 
                   WHERE id = (
                     SELECT id FROM page_views 
                     WHERE ip_address = ? 
                     AND utm_source = ? 
                     AND did_download = 0 
                     ORDER BY visit_time DESC 
                     LIMIT 1
                   )`,
                  [ipAddress, utmSource]
                );

                res.json({
                  success: true,
                  voucherCode,
                  voucherNumber: voucher.voucher_number,
                  store: voucher.store,
                  downloadId: downloadId,
                });
              }
            );
          });
        }
      });
    });
  });
});

// Admin Login (with rate limiting)
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getClientIp(req);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi' });
  }

  db.get('SELECT * FROM admin_users WHERE email = ?', [email], async (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      // Log failed login attempt
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [admin.id, 'LOGIN_FAILED', `Failed login attempt for ${email}`, ipAddress]
      );
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Set session
    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;
    req.session.adminName = admin.name;
    req.session.adminRole = admin.role || 'admin';

    // Log successful login
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.id, 'LOGIN_SUCCESS', `Successful login`, ipAddress]
    );

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  });
});

// Admin Logout
app.post('/api/admin/logout', requireAuth, (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  // Log logout
  db.run(
    'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
    [adminId, 'LOGOUT', 'Admin logged out', ipAddress]
  );

  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/admin/check-auth', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        id: req.session.adminId,
        email: req.session.adminEmail,
        name: req.session.adminName,
        role: req.session.adminRole || 'admin',
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Admin: Get download statistics
app.get('/api/admin/stats', requireAuth, (req, res) => {
  // Get quota from voucher_srp
  db.get('SELECT COUNT(*) as total, SUM(is_used) as used FROM voucher_srp', (err, voucherStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get downloads with voucher_srp data (JOIN)
      db.all(`
        SELECT 
          d.id,
          d.phone_number,
          d.voucher_code,
          v.voucher_number,
          v.store,
          d.utm_source,
          d.ip_address,
          d.user_agent,
          d.download_time,
          d.is_deleted
        FROM downloads d
        LEFT JOIN voucher_srp v ON v.used_by_download_id = d.id
        WHERE d.is_deleted = 0
        ORDER BY d.download_time DESC
      `, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Override settings with actual voucher counts
        // Fallback to default if settings is null/undefined
        const updatedSettings = {
          ...(settings || { allow_redownload: 0 }),
          total_quota: voucherStats.total || 0,
          used_quota: voucherStats.used || 0
        };

        res.json({ 
          downloads: rows,
          settings: updatedSettings
        });
      });
    });
  });
});

// Admin: Get voucher SRP statistics
app.get('/api/admin/voucher-stats', requireAuth, (req, res) => {
  db.get('SELECT COUNT(*) as total, SUM(is_used) as used FROM voucher_srp', (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const total = stats.total || 0;
    const used = stats.used || 0;
    const available = total - used;

    res.json({
      total,
      available,
      used
    });
  });
});

// Admin: Get detailed voucher stats (RT vs Regular)
app.get('/api/admin/voucher-stats-detailed', requireAuth, (req, res) => {
  // Get regular voucher stats (SRP-)
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
    FROM voucher_srp 
    WHERE (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')
  `, (err, regularStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get RT voucher stats (RTT-)
    db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
      FROM voucher_srp 
      WHERE voucher_number LIKE 'RTT-%'
    `, (err2, rtStats) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        regular: {
          total: regularStats.total || 0,
          available: regularStats.available || 0,
          used: regularStats.used || 0
        },
        rt: {
          total: rtStats.total || 0,
          available: rtStats.available || 0,
          used: rtStats.used || 0
        }
      });
    });
  });
});

// Admin: Get voucher list with pagination
app.get('/api/admin/vouchers', requireAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  // Get filter parameters
  const voucherFilter = req.query.voucher || '';
  const storeFilter = req.query.store || '';
  const statusFilter = req.query.status || '';

  // Build WHERE clause
  const conditions = [];
  const params = [];

  if (voucherFilter) {
    conditions.push('voucher_number LIKE ?');
    params.push(`%${voucherFilter}%`);
  }

  if (storeFilter) {
    conditions.push('store LIKE ?');
    params.push(`%${storeFilter}%`);
  }

  if (statusFilter !== '') {
    if (statusFilter === 'available') {
      conditions.push('is_used = 0');
    } else if (statusFilter === 'used') {
      conditions.push('is_used = 1');
    }
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Get total count with filters
  db.get(`SELECT COUNT(*) as total FROM voucher_srp ${whereClause}`, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get paginated vouchers with filters
    const queryParams = [...params, limit, offset];
    db.all(
      `SELECT voucher_number, store, created_at, is_used FROM voucher_srp ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      queryParams,
      (err, vouchers) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          vouchers,
          pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit),
          },
          filters: {
            voucher: voucherFilter,
            store: storeFilter,
            status: statusFilter,
          },
        });
      }
    );
  });
});

// Admin: Update quota
app.post('/api/admin/update-quota', requireAuth, (req, res) => {
  const { quota } = req.body;
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  if (!quota || quota < 1 || quota > 100) {
    return res.status(400).json({ error: 'Quota must be between 1 and 100' });
  }

  db.run('UPDATE voucher_settings SET total_quota = ? WHERE id = 1', [quota], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Log action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'UPDATE_QUOTA', `Updated quota to ${quota}`, ipAddress]
    );

    res.json({ success: true, message: 'Quota updated' });
  });
});

// Admin: Reset quota
app.post('/api/admin/reset-quota', requireAuth, (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  db.run('UPDATE voucher_settings SET used_quota = 0 WHERE id = 1', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Log action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'RESET_QUOTA', 'Reset used quota to 0', ipAddress]
    );

    res.json({ success: true, message: 'Quota reset' });
  });
});

// Admin: Toggle allow redownload
app.post('/api/admin/toggle-redownload', requireAuth, (req, res) => {
  const { allow } = req.body;
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  // First check if column exists, if not add it
  db.get('PRAGMA table_info(voucher_settings)', (err, info) => {
    db.run('UPDATE voucher_settings SET allow_redownload = ? WHERE id = 1', [allow ? 1 : 0], function(err) {
      if (err) {
        // Column might not exist, try to add it
        db.run('ALTER TABLE voucher_settings ADD COLUMN allow_redownload INTEGER DEFAULT 0', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            return res.status(500).json({ error: 'Database error' });
          }
          // Try update again
          db.run('UPDATE voucher_settings SET allow_redownload = ? WHERE id = 1', [allow ? 1 : 0], (err2) => {
            if (err2) {
              return res.status(500).json({ error: 'Database error' });
            }
            logAndRespond();
          });
        });
      } else {
        logAndRespond();
      }
    });
  });

  function logAndRespond() {
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'TOGGLE_REDOWNLOAD', `Set allow_redownload to ${allow ? 'enabled' : 'disabled'}`, ipAddress]
    );
    res.json({ success: true, message: 'Setting updated' });
  }
});

// Admin: Toggle navigation pane (Feature Flag)
app.post('/api/admin/toggle-navigation-pane', requireAuth, (req, res) => {
  const { enable } = req.body;
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);
  const adminRole = req.session.adminRole || 'admin';

  // Only admin role can toggle this feature
  if (adminRole !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can toggle this feature' });
  }

  // Check if column exists, if not add it
  db.run('UPDATE voucher_settings SET enable_navigation_pane = ? WHERE id = 1', [enable ? 1 : 0], function(err) {
    if (err) {
      // Column might not exist, try to add it
      db.run('ALTER TABLE voucher_settings ADD COLUMN enable_navigation_pane INTEGER DEFAULT 0', (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column')) {
          return res.status(500).json({ error: 'Database error' });
        }
        // Try update again
        db.run('UPDATE voucher_settings SET enable_navigation_pane = ? WHERE id = 1', [enable ? 1 : 0], (err2) => {
          if (err2) {
            return res.status(500).json({ error: 'Database error' });
          }
          logAndRespond();
        });
      });
    } else {
      logAndRespond();
    }
  });

  function logAndRespond() {
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'TOGGLE_NAVIGATION_PANE', `Set navigation pane to ${enable ? 'enabled' : 'disabled'}`, ipAddress]
    );
    res.json({ success: true, message: 'Navigation pane setting updated' });
  }
});

// Admin: Export to CSV
app.get('/api/admin/export-csv', requireAuth, (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);
  
  // Query with JOIN to include voucher_srp data
  const query = `
    SELECT 
      d.id as download_id,
      d.phone_number,
      v.voucher_number as voucher_srp,
      v.store,
      d.utm_source,
      d.ip_address,
      d.user_agent,
      d.download_time
    FROM downloads d
    INNER JOIN voucher_srp v ON v.used_by_download_id = d.id
    WHERE d.is_deleted = 0
    ORDER BY d.download_time DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    try {
      const fields = ['download_id', 'phone_number', 'voucher_srp', 'store', 'utm_source', 'ip_address', 'user_agent', 'download_time'];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(rows);

      // Generate filename with timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const filename = `export_voucher_detail_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;

      // Log action
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [adminId, 'EXPORT_CSV', `Exported ${rows.length} records to CSV`, ipAddress]
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate CSV' });
    }
  });
});

// Admin: Get Analytics Data (with date filter)
app.get('/api/admin/analytics', requireAuth, (req, res) => {
  const { from, to } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (from && to) {
    dateFilter = 'WHERE visit_date BETWEEN ? AND ?';
    params.push(from, to);
  } else if (from) {
    dateFilter = 'WHERE visit_date >= ?';
    params.push(from);
  } else if (to) {
    dateFilter = 'WHERE visit_date <= ?';
    params.push(to);
  }

  // Get analytics by UTM source
  db.all(
    `SELECT 
      utm_source,
      COUNT(*) as total_views,
      SUM(did_download) as total_downloads,
      COUNT(*) - SUM(did_download) as views_only,
      ROUND(SUM(did_download) * 100.0 / COUNT(*), 2) as conversion_rate
    FROM page_views
    ${dateFilter}
    GROUP BY utm_source
    ORDER BY total_views DESC`,
    params,
    (err, bySource) => {
      if (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics data' });
      }

      // Get summary stats
      db.get(
        `SELECT 
          COUNT(*) as total_views,
          SUM(did_download) as total_downloads,
          COUNT(DISTINCT ip_address) as unique_visitors,
          ROUND(SUM(did_download) * 100.0 / COUNT(*), 2) as conversion_rate
        FROM page_views
        ${dateFilter}`,
        params,
        (err, summary) => {
          if (err) {
            console.error('Error fetching summary:', err);
            return res.status(500).json({ error: 'Failed to fetch summary data' });
          }

          res.json({
            summary: {
              totalViews: summary.total_views || 0,
              totalDownloads: summary.total_downloads || 0,
              uniqueVisitors: summary.unique_visitors || 0,
              conversionRate: summary.conversion_rate || 0
            },
            bySource: bySource
          });
        }
      );
    }
  );
});

// Admin: Export Analytics by UTM Source
app.get('/api/admin/export-analytics-utm', requireAuth, (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);
  const { from, to } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (from && to) {
    dateFilter = 'WHERE visit_date BETWEEN ? AND ?';
    params.push(from, to);
  } else if (from) {
    dateFilter = 'WHERE visit_date >= ?';
    params.push(from);
  } else if (to) {
    dateFilter = 'WHERE visit_date <= ?';
    params.push(to);
  }

  // Query analytics data grouped by UTM source
  db.all(
    `SELECT 
      utm_source,
      COUNT(*) as total_views,
      SUM(did_download) as total_downloads,
      COUNT(*) - SUM(did_download) as views_only,
      ROUND(SUM(did_download) * 100.0 / COUNT(*), 2) as conversion_rate
    FROM page_views
    ${dateFilter}
    GROUP BY utm_source
    ORDER BY total_views DESC`,
    params,
    (err, rows) => {
      if (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics data' });
      }

      // Generate CSV content
      let csv = 'UTM Source,Total Views,Total Downloads,Views Only,Conversion Rate (%)\n';
      
      rows.forEach(row => {
        csv += `"${row.utm_source}",${row.total_views},${row.total_downloads || 0},${row.views_only},${row.conversion_rate || 0}\n`;
      });

      // Log admin action
      const dateRange = from && to ? ` (${from} to ${to})` : '';
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [adminId, 'EXPORT_ANALYTICS_UTM', `Exported analytics by UTM source${dateRange} (${rows.length} rows)`, ipAddress]
      );

      // Send CSV file
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-utm-${timestamp}.csv`);
      res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support
    }
  );
});

// Admin: Download CSV template for bulk voucher generation
app.get('/api/admin/download-csv-template', (req, res) => {
  // CSV template with header and example rows
  const template = `Nama Customer,No Handphone,Tanggal Blasting,Kode Voucher SRP
Budi Santoso,081234567890,2024-12-03,SRP-001
Siti Aminah,081234567891,2024-12-03,RTT-0001-XXXXX
Ahmad Rizki,081234567892,2024-12-03,SRP-002`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=template_voucher_bulk.csv');
  res.send('\uFEFF' + template); // Add BOM for Excel UTF-8 support
});

// Configure multer for CSV upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Admin: Upload CSV vouchers
app.post('/api/admin/upload-csv', requireAuth, upload.single('csvFile'), (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process CSV data
      const processRow = (index) => {
        if (index >= results.length) {
          // Cleanup uploaded file
          fs.unlinkSync(req.file.path);

          // Log action
          db.run(
            'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [
              adminId,
              'UPLOAD_CSV',
              `Uploaded CSV: ${imported} imported, ${skipped} skipped, ${errors} errors`,
              ipAddress,
            ]
          );

          return res.json({
            success: true,
            imported,
            skipped,
            errors,
            total: results.length,
          });
        }

        const row = results[index];

        // Expected CSV format: Voucher Number, Store, Status, Created at
        const voucherNumber = row['Voucher Number'] || row['voucher_number'] || row['Voucher_Number'];
        const store = row['Store'] || row['store'];
        const status = row['Status'] || row['status'];
        const createdAt = row['Created at'] || row['created_at'] || row['Created_at'];

        if (!voucherNumber || !store) {
          errors++;
          processRow(index + 1);
          return;
        }

        // Check if voucher already exists
        db.get(
          'SELECT id FROM voucher_srp WHERE voucher_number = ?',
          [voucherNumber],
          (err, existing) => {
            if (err) {
              errors++;
              processRow(index + 1);
              return;
            }

            if (existing) {
              skipped++;
              processRow(index + 1);
              return;
            }

            // Insert new voucher
            db.run(
              'INSERT INTO voucher_srp (voucher_number, store, status, created_at, is_used) VALUES (?, ?, ?, ?, 0)',
              [voucherNumber, store, status || 'Active', createdAt || new Date().toISOString()],
              (err) => {
                if (err) {
                  errors++;
                } else {
                  imported++;
                }
                processRow(index + 1);
              }
            );
          }
        );
      };

      processRow(0);
    })
    .on('error', (err) => {
      // Cleanup uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to parse CSV: ' + err.message });
    });
});

// Admin: Get activity logs
app.get('/api/admin/logs', requireAuth, (req, res) => {
  db.all(
    `SELECT al.*, au.email, au.name 
     FROM admin_logs al 
     JOIN admin_users au ON al.admin_id = au.id 
     ORDER BY al.timestamp DESC 
     LIMIT 100`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ logs: rows });
    }
  );
});

// Admin: Get blocked IPs
app.get('/api/admin/blocked-ips', requireAuth, (req, res) => {
  db.all(
    `SELECT bi.*, au.name as blocked_by_name, au.email as blocked_by_email
     FROM blocked_ips bi
     JOIN admin_users au ON bi.blocked_by = au.id
     ORDER BY bi.blocked_at DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ blockedIps: rows });
    }
  );
});

// Admin: Block IP address
app.post('/api/admin/block-ip', requireAuth, (req, res) => {
  const { ipAddress, reason } = req.body;
  const adminId = req.session.adminId;
  const adminIp = getClientIp(req);

  if (!ipAddress) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  // Check if IP already blocked
  db.get('SELECT * FROM blocked_ips WHERE ip_address = ?', [ipAddress], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Update existing record
      db.run(
        "UPDATE blocked_ips SET is_active = 1, reason = ?, blocked_by = ?, blocked_at = datetime('now', 'localtime') WHERE ip_address = ?",
        [reason || 'No reason provided', adminId, ipAddress],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Log action
          db.run(
            'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [adminId, 'BLOCK_IP', `Blocked IP: ${ipAddress} - Reason: ${reason || 'No reason'}`, adminIp]
          );

          res.json({ success: true, message: 'IP address blocked' });
        }
      );
    } else {
      // Insert new record
      db.run(
        'INSERT INTO blocked_ips (ip_address, reason, blocked_by, is_active) VALUES (?, ?, ?, 1)',
        [ipAddress, reason || 'No reason provided', adminId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Log action
          db.run(
            'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [adminId, 'BLOCK_IP', `Blocked IP: ${ipAddress} - Reason: ${reason || 'No reason'}`, adminIp]
          );

          res.json({ success: true, message: 'IP address blocked' });
        }
      );
    }
  });
});

// Admin: Unblock IP address
app.post('/api/admin/unblock-ip', requireAuth, (req, res) => {
  const { ipAddress } = req.body;
  const adminId = req.session.adminId;
  const adminIp = getClientIp(req);

  if (!ipAddress) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  db.run(
    'UPDATE blocked_ips SET is_active = 0 WHERE ip_address = ?',
    [ipAddress],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'IP address not found' });
      }

      // Log action
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [adminId, 'UNBLOCK_IP', `Unblocked IP: ${ipAddress}`, adminIp]
      );

      res.json({ success: true, message: 'IP address unblocked' });
    }
  );
});

// Admin: Delete blocked IP record
app.delete('/api/admin/blocked-ip/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const adminId = req.session.adminId;
  const adminIp = getClientIp(req);

  db.get('SELECT ip_address FROM blocked_ips WHERE id = ?', [id], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.run('DELETE FROM blocked_ips WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Log action
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [adminId, 'DELETE_BLOCKED_IP', `Deleted blocked IP record: ${record.ip_address}`, adminIp]
      );

      res.json({ success: true, message: 'Record deleted' });
    });
  });
});

// Soft delete download by ID + unreserve voucher
app.delete('/api/delete/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  // First, get the download info to find associated voucher
  db.get('SELECT * FROM downloads WHERE id = ?', [id], (err, download) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!download) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Soft delete: Mark as deleted instead of removing
    db.run('UPDATE downloads SET is_deleted = 1 WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Unreserve the voucher if it was used by this download
      db.run(
        'UPDATE voucher_srp SET is_used = 0, used_by_download_id = NULL, used_at = NULL WHERE used_by_download_id = ?',
        [id],
        function (err) {
          if (err) {
            console.error('Error unreserving voucher:', err);
          }
          
          const voucherUnreserved = this.changes > 0;
          const logDetails = voucherUnreserved 
            ? `Soft deleted download ID: ${id}, unreserved voucher for phone: ${download.phone_number}`
            : `Soft deleted download ID: ${id} (no voucher to unreserve)`;

          // Log action
          db.run(
            'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [adminId, 'SOFT_DELETE_AND_UNRESERVE', logDetails, ipAddress]
          );

          res.json({ 
            success: true, 
            message: 'Record deleted and voucher unreserved',
            voucherUnreserved: voucherUnreserved
          });
        }
      );
    });
  });
});

// Delete download by phone number
app.delete('/api/delete-by-phone/:phone', requireAuth, (req, res) => {
  const { phone } = req.params;
  
  db.run('DELETE FROM downloads WHERE phone_number = ?', [phone], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ success: true, message: `Deleted ${this.changes} record(s)` });
  });
});

// Delete download by IP address
app.delete('/api/delete-by-ip/:ip', requireAuth, (req, res) => {
  const { ip } = req.params;
  
  db.run('DELETE FROM downloads WHERE ip_address = ?', [ip], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ success: true, message: `Deleted ${this.changes} record(s)` });
  });
});

// Delete all downloads (reset database)
app.delete('/api/delete-all', requireAuth, (req, res) => {
  db.run('DELETE FROM downloads', function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: `Deleted ${this.changes} record(s)` });
  });
});

// Preview next voucher (without marking as used)
app.post('/api/preview-voucher', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !phoneNumber.startsWith('628') || phoneNumber.length < 11 || phoneNumber.length > 14) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  // Get next available voucher
  db.get('SELECT * FROM voucher_srp WHERE is_used = 0 ORDER BY id ASC LIMIT 1', (err, voucher) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!voucher) {
      return res.status(404).json({ error: 'No vouchers available' });
    }

    res.json({
      voucherNumber: voucher.voucher_number,
      store: voucher.store,
      phoneNumber: phoneNumber
    });
  });
});

// Generate voucher image - New Design (Opsi 2: Mirip Guide-2)
app.get('/api/generate-voucher/:downloadId', async (req, res) => {
  const { downloadId } = req.params;

  db.get(
    `SELECT d.*, v.voucher_number, v.store 
     FROM downloads d 
     LEFT JOIN voucher_srp v ON v.used_by_download_id = d.id 
     WHERE d.id = ?`,
    [downloadId],
    async (err, download) => {
      if (err || !download) {
        return res.status(404).json({ error: 'Download not found' });
      }

      try {
        const canvas = createCanvas(900, 1600);
        const ctx = canvas.getContext('2d');
        const { Image } = require('canvas');

        // Load background image based on UTM source
        const backgroundImage = new Image();
        const fs = require('fs');
        
        // Define UTM source groups
        const pondokKacangSources = [
          'KelPondokKacangRW01RT04', 'KelPondokKacangRW01RT02', 'KelPondokKacangRW09RT03',
          'KelPondokKacangRW09RT01', 'KelPondokKacangRW07RT15', 'KelPondokKacangRW07RT05',
          'KelPondokKacangRW07RT07', 'KelPondokKacangRW07RT04', 'KelPondokKacangRW07RT06'
        ];
        const sukahatiSources = [
          'KelSukahatiRW09RT01', 'KelSukahatiRW09RT02', 'KelSukahatiRW09RT03', 'KelSukahatiRW09RT04',
          'KelSukahatiRW09RT05', 'KelSukahatiRW09RT06', 'KelSukahatiRW09RT07', 'KelSukahatiRW09RT08'
        ];
        const tengahSources = [
          'KelTengahRW07RT06', 'KelTengahRW08RT01', 'KelTengahRW08RT02', 'KelTengahRW08RT03',
          'KelTengahRW08RT04', 'KelTengahRW08RT05', 'KelTengahRW08RT06'
        ];

        // Determine background based on UTM source
        let backgroundFilename = 'homepage-2.png'; // Default for regular/direct
        if (pondokKacangSources.includes(download.utm_source)) {
          backgroundFilename = 'homepage-2-pondokkacang.jpg'; // Pondok Kacang voucher background
        } else if (sukahatiSources.includes(download.utm_source) || tengahSources.includes(download.utm_source)) {
          backgroundFilename = 'homepage-2-rt.jpg'; // Sukahati/Tengah RT/RW voucher background
        }
        
        const backgroundPath = path.join(__dirname, 'public/images', backgroundFilename);
        
        console.log(`Generating voucher image for UTM: ${download.utm_source}, using background: ${backgroundFilename}`);
        
        // Check if background image exists, fallback to default if not found
        let finalBackgroundPath = backgroundPath;
        if (!fs.existsSync(backgroundPath)) {
          console.warn(`Background ${backgroundFilename} not found, falling back to default`);
          finalBackgroundPath = path.join(__dirname, 'public/images/homepage-2.png');
          if (!fs.existsSync(finalBackgroundPath)) {
            return res.status(500).json({ error: 'Background image not found' });
          }
        }
        
        // Load image from file synchronously
        backgroundImage.src = fs.readFileSync(finalBackgroundPath);
        
        // Draw background image (no stretch - ukuran asli)
        ctx.drawImage(backgroundImage, 0, 0, 900, 1600);

        // HIDDEN - QR Code, voucher code, and date removed (only show phone number)
        // Format phone number first
        const phone = download.phone_number;
        let displayPhone = phone;
        if (phone.startsWith('628')) {
          const withoutPrefix = '0' + phone.substring(2);
          if (withoutPrefix.length >= 11) {
            displayPhone = withoutPrefix.substring(0, 4) + '-' + 
                         withoutPrefix.substring(4, 7) + '-' + 
                         withoutPrefix.substring(7);
          } else {
            displayPhone = withoutPrefix;
          }
        }

        // Conditional position based on UTM source
        let phoneY, phoneX;
        
        if (pondokKacangSources.includes(download.utm_source)) {
          // Posisi khusus Pondok Kacang (adjust manual sesuai kebutuhan)
          phoneY = 1100; // TODO: Adjust nilai ini untuk geser vertikal
          phoneX = 450;  // Center of 900px canvas
        } else {
          // Posisi default untuk Sukahati/Tengah
          phoneY = 1100;
          phoneX = 450;
        }
        
        const phoneBtnWidth = 390;
        const phoneBtnHeight = 75;
        
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.roundRect(phoneX - (phoneBtnWidth / 2), phoneY, phoneBtnWidth, phoneBtnHeight, 37);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 33px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(displayPhone, phoneX, phoneY + 48);

        // Instruksi text di bawah nomor HP
        const instructionY = phoneY + phoneBtnHeight + 70; // 30px gap dari tombol
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Harap screenshoot image ini untuk ditunjukan kepada kasir', phoneX, instructionY);

        // Generate filename with voucher_number-phone_number-download_time
        const fileDate = new Date(download.download_time);
        const fileDateStr = fileDate.getFullYear() + 
                       String(fileDate.getMonth() + 1).padStart(2, '0') + 
                       String(fileDate.getDate()).padStart(2, '0') + '_' +
                       String(fileDate.getHours()).padStart(2, '0') + 
                       String(fileDate.getMinutes()).padStart(2, '0') + 
                       String(fileDate.getSeconds()).padStart(2, '0');
        
        const filename = `voucher-${download.voucher_number || 'N/A'}-${download.phone_number}-${fileDateStr}.png`;
        
        // Send PNG (just background image without any voucher details)
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        canvas.createPNGStream().pipe(res);
        
      } catch (error) {
        console.error('Error generating voucher:', error);
        res.status(500).json({ error: 'Failed to generate voucher image' });
      }
    }
  );
});

// ============================================
// BULK VOUCHER IMAGE GENERATION
// ============================================

// Helper: Create batch folder
function createBatchFolder(batchId) {
  const batchPath = path.join(__dirname, 'generated_vouchers', batchId);
  if (!fs.existsSync(batchPath)) {
    fs.mkdirSync(batchPath, { recursive: true });
  }
  return batchPath;
}

// Helper: Get template-specific coordinates
function getTemplateCoordinates(templateName) {
  // Define coordinates for each template
  const templateConfigs = {
    'voucher-template.jpeg': {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    },
    'voucher-template-cibinong.jpg': {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    },
    'voucher-template-cileungsi.jpg': {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    }
  };

  // Return config for template, or default if not found
  return templateConfigs[templateName] || templateConfigs['voucher-template.jpeg'];
}

// Helper: Generate single voucher image
async function generateBulkVoucherImage(voucherCode, tanggalBlasting, noHandphone, outputPath, templateName = 'voucher-template.jpeg') {
  try {
    // Load template image
    const templatePath = path.join(__dirname, 'public/images', templateName);
    
    // Check if template exists, fallback to default
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template ${templateName} not found, using default`);
      templateName = 'voucher-template.jpeg';
    }
    
    const finalTemplatePath = path.join(__dirname, 'public/images', templateName);
    const templateBuffer = fs.readFileSync(finalTemplatePath);
    const templateImage = new Image();
    templateImage.src = templateBuffer;

    // Create canvas with template dimensions
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');

    // Draw template as background
    ctx.drawImage(templateImage, 0, 0);

    // Get coordinates for this template
    const coords = getTemplateCoordinates(templateName);
    
    console.log(`Generating voucher with template: ${templateName}`);
    console.log(`Using coordinates:`, coords);

    // HIDDEN - QR Code generation and drawing removed (not needed anymore)
    const qrCodeDataUrl = await QRCode.toDataURL(voucherCode, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const qrImage = new Image();
    qrImage.src = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // All voucher details (QR, code, phone, date) are hidden from blast image

    // Overlay Voucher Code
    ctx.fillStyle = coords.voucherCode.color;
    ctx.font = coords.voucherCode.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(voucherCode, coords.voucherCode.x, coords.voucherCode.y);

    // Overlay Tanggal Blasting
    ctx.fillStyle = coords.tanggal.color;
    ctx.font = coords.tanggal.font;
    ctx.textAlign = 'center';
    ctx.fillText(tanggalBlasting, coords.tanggal.x, coords.tanggal.y);

    // Overlay No Handphone (format: 0812-3456-7890)
    ctx.fillStyle = coords.phone.color;
    ctx.font = coords.phone.font;
    ctx.textAlign = 'center';
    
    // Format nomor HP: 628xxx -> 08xxx dengan dash
    let formattedPhone = noHandphone;
    if (noHandphone.startsWith('62')) {
      formattedPhone = '0' + noHandphone.substring(2);
    }
    // Add dashes: 08123456789 -> 0812-3456-7890
    if (formattedPhone.length >= 11) {
      formattedPhone = formattedPhone.substring(0, 4) + '-' + 
                       formattedPhone.substring(4, 8) + '-' + 
                       formattedPhone.substring(8);
    }
    ctx.fillText(formattedPhone, coords.phone.x, coords.phone.y);

    // Save image as JPEG
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✓ Voucher generated: ${path.basename(outputPath)}`);
    
    return true;
  } catch (error) {
    console.error('Error generating voucher image:', error);
    throw error;
  }
}

// Helper: Load image from data URL
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Admin: Upload CSV and generate voucher images
app.post('/api/admin/generate-voucher-batch', requireAuth, upload.single('csvFile'), async (req, res) => {
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);
  const selectedTemplate = req.body.template || 'voucher-template.jpeg'; // Get template from request

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('Selected template:', selectedTemplate); // Debug log
  
  // Touch session to keep it alive during long process
  req.session.touch();

  const timestamp = Date.now();
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let batchId = null;
  let batchName = null;
  let mekanisme = null;
  let tanggalBlasting = null;

  try {
    // Parse CSV
    const csvData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => csvData.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    if (csvData.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Get mekanisme and tanggal from first row for batch naming
    const firstRow = csvData[0];
    
    // Debug: Log all column names
    console.log('CSV Columns:', Object.keys(firstRow));
    
    // Try multiple variations of column names
    mekanisme = firstRow['Mekanisme'] || firstRow['mekanisme'] || firstRow['MEKANISME'] || 
                firstRow['Mekanisme '] || firstRow[' Mekanisme'] || '';
    tanggalBlasting = firstRow['Tanggal Blasting'] || firstRow['Tanggal_Blasting'] || 
                      firstRow['tanggal_blasting'] || firstRow['Tanggal Blasting '] || '';
    
    console.log('Mekanisme found:', mekanisme);
    console.log('Tanggal Blasting found:', tanggalBlasting);
    
    // Generate batch name from mekanisme (max 30 chars) + date
    const cleanMekanisme = mekanisme ? mekanisme.substring(0, 30).trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') : '';
    const cleanDate = tanggalBlasting.replace(/\//g, '-');
    batchName = cleanMekanisme ? `${cleanMekanisme}_${cleanDate}` : `Batch_${cleanDate}`;
    batchId = `${batchName}_${timestamp}`;
    
    console.log('Batch Name:', batchName);
    console.log('Batch ID:', batchId);
    
    const batchPath = createBatchFolder(batchId);

    // Save batch to database
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO voucher_batches (batch_id, batch_name, mekanisme, tanggal_blasting, total_rows, uploaded_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [batchId, batchName, mekanisme, tanggalBlasting, csvData.length, adminId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Support multiple column name formats (with various spacing)
      let voucherCode = row['Kode Voucher SRP'] || row['Kode Voucher  SRP'] || row['Kode Voucher'] || 
                        row['Kode Voucher '] || row['Kode Voucher  '] || row[' Kode Voucher'] ||
                        row['Kode_Voucher_SRP'] || row['kode_voucher_srp'] || row['kode_voucher'];
      let tanggalBlastingRow = row['Tanggal Blasting'] || row['Tanggal_Blasting'] || row['tanggal_blasting'] ||
                               row['Tanggal Blasting '] || row[' Tanggal Blasting'];
      let noHandphone = row['No Handphone'] || row['No_Handphone'] || row['no_handphone'] ||
                        row['No Handphone '] || row[' No Handphone'];
      const namaCustomer = row['Nama Customer'] || row['Nama_Customer'] || row['nama_customer'] || 
                           row['Nama Customer '] || row[' Nama Customer'] || '';
      const mekanismeRow = row['Mekanisme'] || row['mekanisme'] || row['Mekanisme '] || row[' Mekanisme'] || mekanisme;

      // Auto-fix phone number: add 62 prefix if missing
      if (noHandphone && !noHandphone.startsWith('62')) {
        noHandphone = '62' + noHandphone;
      }

      if (!voucherCode || !tanggalBlastingRow || !noHandphone) {
        errorCount++;
        
        // Save to database with error status
        db.run(
          `INSERT INTO voucher_batch_details (batch_id, no_handphone, nama_customer, kode_voucher, mekanisme, tanggal_blasting, status, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [batchId, noHandphone || '', namaCustomer, voucherCode || '', mekanismeRow, tanggalBlastingRow || '', 'error', 'Missing required fields']
        );
        
        results.push({
          row: i + 1,
          status: 'error',
          message: 'Missing required fields'
        });
        continue;
      }

      try {
        // Format filename: VCH-ABC123_628123456789_25-11-2025.jpeg
        const cleanVoucherCode = voucherCode.replace(/[^a-zA-Z0-9-]/g, '_');
        const cleanPhone = noHandphone.replace(/[^0-9]/g, '');
        const cleanDateFile = tanggalBlastingRow.replace(/\//g, '-');
        const filename = `${cleanVoucherCode}_${cleanPhone}_${cleanDateFile}.jpeg`;
        const outputPath = path.join(batchPath, filename);
        
        await generateBulkVoucherImage(voucherCode, tanggalBlastingRow, noHandphone, outputPath, selectedTemplate);
        
        // Save to database with success status
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO voucher_batch_details (batch_id, no_handphone, nama_customer, kode_voucher, mekanisme, tanggal_blasting, image_generated, image_filename, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [batchId, noHandphone, namaCustomer, voucherCode, mekanismeRow, tanggalBlastingRow, 1, filename, 'success'],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        successCount++;
        results.push({
          row: i + 1,
          voucherCode,
          filename,
          status: 'success'
        });
      } catch (error) {
        errorCount++;
        
        // Save to database with error status
        db.run(
          `INSERT INTO voucher_batch_details (batch_id, no_handphone, nama_customer, kode_voucher, mekanisme, tanggal_blasting, status, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [batchId, noHandphone, namaCustomer, voucherCode, mekanismeRow, tanggalBlastingRow, 'error', error.message]
        );
        
        results.push({
          row: i + 1,
          voucherCode,
          status: 'error',
          message: error.message
        });
      }
    }

    // Update batch counts
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE voucher_batches SET success_count = ?, error_count = ? WHERE batch_id = ?`,
        [successCount, errorCount, batchId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create manifest
    const manifest = {
      batchId,
      batchName,
      mekanisme,
      tanggalBlasting,
      createdAt: new Date().toISOString(),
      totalRows: csvData.length,
      successCount,
      errorCount,
      results
    };

    fs.writeFileSync(
      path.join(batchPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Archive CSV to success or failed folder
    const csvArchiveDir = path.join(__dirname, 'csv_archive');
    const csvArchiveStatus = successCount > 0 ? 'success' : 'failed';
    const csvArchivePath = path.join(csvArchiveDir, csvArchiveStatus);
    
    // Create archive folders if not exist
    if (!fs.existsSync(csvArchivePath)) {
      fs.mkdirSync(csvArchivePath, { recursive: true });
    }
    
    // Copy CSV to archive with batch name
    const csvArchiveFile = path.join(csvArchivePath, `${batchId}.csv`);
    fs.copyFileSync(req.file.path, csvArchiveFile);
    
    // Delete original uploaded file
    fs.unlinkSync(req.file.path);

    // Log action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'GENERATE_VOUCHER_BATCH', `Generated ${successCount} vouchers in ${batchId} (CSV archived to ${csvArchiveStatus})`, ipAddress]
    );

    res.json({
      success: true,
      batchId,
      totalRows: csvData.length,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    
    // Archive failed CSV
    if (fs.existsSync(req.file.path)) {
      try {
        const csvArchiveDir = path.join(__dirname, 'csv_archive', 'failed');
        
        // Create failed folder if not exist
        if (!fs.existsSync(csvArchiveDir)) {
          fs.mkdirSync(csvArchiveDir, { recursive: true });
        }
        
        // Copy CSV to failed folder with timestamp
        const failedFileName = `Failed_${timestamp}.csv`;
        const csvArchiveFile = path.join(csvArchiveDir, failedFileName);
        fs.copyFileSync(req.file.path, csvArchiveFile);
        
        // Delete original
        fs.unlinkSync(req.file.path);
        
        console.log(`Failed CSV archived to: ${csvArchiveFile}`);
      } catch (archiveError) {
        console.error('Error archiving failed CSV:', archiveError);
        // Still delete the original file
        fs.unlinkSync(req.file.path);
      }
    }
    
    res.status(500).json({ error: 'Failed to process CSV: ' + error.message });
  }
});

// Admin: Get list of voucher batches
app.get('/api/admin/voucher-batches', requireAuth, (req, res) => {
  try {
    // Get batches from database (exclude deleted)
    db.all(
      `SELECT batch_id, batch_name, mekanisme, tanggal_blasting, total_rows, success_count, error_count, uploaded_at 
       FROM voucher_batches 
       WHERE is_deleted = 0 
       ORDER BY uploaded_at DESC`,
      (err, batches) => {
        if (err) {
          console.error('Error listing batches:', err);
          return res.status(500).json({ error: 'Failed to list batches' });
        }

        // Add image count from file system
        const batchesWithImages = batches.map(batch => {
          const batchPath = path.join(__dirname, 'generated_vouchers', batch.batch_id);
          let imageCount = 0;

          if (fs.existsSync(batchPath)) {
            const files = fs.readdirSync(batchPath);
            imageCount = files.filter(f => f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')).length;
          }

          return {
            batchId: batch.batch_id,
            batchName: batch.batch_name,
            mekanisme: batch.mekanisme,
            tanggalBlasting: batch.tanggal_blasting,
            createdAt: batch.uploaded_at,
            totalRows: batch.total_rows,
            successCount: batch.success_count,
            errorCount: batch.error_count,
            imageCount
          };
        });

        res.json({ batches: batchesWithImages });
      }
    );
  } catch (error) {
    console.error('Error listing batches:', error);
    res.status(500).json({ error: 'Failed to list batches' });
  }
});

// Admin: Download batch as ZIP
app.get('/api/admin/download-batch/:batchId', requireAuth, (req, res) => {
  const { batchId } = req.params;
  const batchPath = path.join(__dirname, 'generated_vouchers', batchId);

  if (!fs.existsSync(batchPath)) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  try {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`${batchId}.zip`);
    archive.pipe(res);

    // Add all image files (PNG, JPEG, JPG)
    const files = fs.readdirSync(batchPath);
    files.forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.jpg')) {
        archive.file(path.join(batchPath, file), { name: file });
      }
    });

    // Add manifest
    if (fs.existsSync(path.join(batchPath, 'manifest.json'))) {
      archive.file(path.join(batchPath, 'manifest.json'), { name: 'manifest.json' });
    }

    archive.finalize();

    // Log action
    const adminId = req.session.adminId;
    const ipAddress = getClientIp(req);
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [adminId, 'DOWNLOAD_BATCH', `Downloaded batch ${batchId}`, ipAddress]
    );

  } catch (error) {
    console.error('Error creating ZIP:', error);
    res.status(500).json({ error: 'Failed to create ZIP' });
  }
});

// Admin: Delete batch (Soft Delete)
app.delete('/api/admin/delete-batch/:batchId', requireAuth, (req, res) => {
  const { batchId } = req.params;
  const adminRole = req.session.adminRole || 'admin';
  const adminId = req.session.adminId;
  const ipAddress = getClientIp(req);

  // Check if user has permission to delete
  if (adminRole === 'crm') {
    return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus batch' });
  }

  try {
    // Soft delete: Update is_deleted flag in database
    db.run(
      `UPDATE voucher_batches 
       SET is_deleted = 1, deleted_at = datetime('now', 'localtime'), deleted_by = ? 
       WHERE batch_id = ?`,
      [adminId, batchId],
      function(err) {
        if (err) {
          console.error('Error soft deleting batch:', err);
          return res.status(500).json({ error: 'Failed to delete batch' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Batch not found' });
        }

        // Also soft delete all details
        db.run(
          `UPDATE voucher_batch_details 
           SET is_deleted = 1 
           WHERE batch_id = ?`,
          [batchId],
          (err) => {
            if (err) {
              console.error('Error soft deleting batch details:', err);
            }
          }
        );

        // Log action
        db.run(
          'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
          [adminId, 'DELETE_BATCH', `Soft deleted batch ${batchId} (files preserved)`, ipAddress]
        );

        res.json({ 
          success: true, 
          message: 'Batch deleted successfully (files preserved)' 
        });
      }
    );
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Frontend Routes - Serve HTML pages with proper routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-nav', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-nav.html'));
});

// Admin Dashboard Routes (Multi-page Navigation)
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html'));
});

app.get('/admin/vouchers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'vouchers.html'));
});

app.get('/admin/downloads', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'downloads.html'));
});

app.get('/admin/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'analytics.html'));
});

app.get('/admin/bulk-generate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'bulk-generate.html'));
});

app.get('/admin/logs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'logs.html'));
});

app.get('/admin/security', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'security.html'));
});

// Legacy Route Support (for backward compatibility)
app.get('/pages/:page', (req, res) => {
  const { page } = req.params;
  const filePath = path.join(__dirname, 'public', 'pages', `${page}.html`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Catch-all handler for undefined routes (serve 404 or redirect to home)
app.use((req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For non-API routes, redirect to home
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Also accessible via your IP address on port ${PORT}`);
  console.log(`\n📱 Available Routes:`);
  console.log(`  🏠 Home: http://localhost:${PORT}/`);
  console.log(`  🔐 Admin Login: http://localhost:${PORT}/admin-login`);
  console.log(`  📊 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`  🎛️  Admin Navigation: http://localhost:${PORT}/admin-nav`);
  console.log(`\n📋 Admin Pages (Multi-page Dashboard):`);
  console.log(`  📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
  console.log(`  🎫 Vouchers: http://localhost:${PORT}/admin/vouchers`);
  console.log(`  📥 Downloads: http://localhost:${PORT}/admin/downloads`);
  console.log(`  📈 Analytics: http://localhost:${PORT}/admin/analytics`);
  console.log(`  🖼️  Bulk Generate: http://localhost:${PORT}/admin/bulk-generate`);
  console.log(`  📝 Logs: http://localhost:${PORT}/admin/logs`);
  console.log(`  🔒 Security: http://localhost:${PORT}/admin/security`);
});
