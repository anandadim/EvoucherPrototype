const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, '../voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Creating Admin User ===\n');

async function createAdmin() {
  try {
    // Get password from .env or use default
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin_users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'", async (err, table) => {
      if (err) {
        console.error('❌ Error checking table:', err.message);
        db.close();
        return;
      }

      if (!table) {
        console.log('⚠️  Table admin_users tidak ada. Creating table...\n');
        
        // Create table
        db.run(`CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        )`, (err) => {
          if (err) {
            console.error('❌ Error creating table:', err.message);
            db.close();
            return;
          }
          console.log('✓ Table admin_users created!\n');
          insertAdmin(hashedPassword);
        });
      } else {
        insertAdmin(hashedPassword);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
  }
}

function insertAdmin(hashedPassword) {
  // Check if admin already exists
  db.get('SELECT * FROM admin_users WHERE email = ?', ['admin@voucher.com'], (err, admin) => {
    if (err) {
      console.error('❌ Error checking admin:', err.message);
      db.close();
      return;
    }

    if (admin) {
      console.log('⚠️  Admin user sudah ada!');
      console.log('   Email: admin@voucher.com');
      console.log('   ID:', admin.id);
      console.log('\n💡 Jika lupa password, hapus user ini dulu dengan:');
      console.log('   sqlite3 voucher_downloads.db "DELETE FROM admin_users WHERE email=\'admin@voucher.com\';"');
      console.log('   Lalu jalankan script ini lagi.\n');
      db.close();
      return;
    }

    // Insert new admin
    db.run(
      'INSERT INTO admin_users (email, password, name) VALUES (?, ?, ?)',
      ['admin@voucher.com', hashedPassword, 'Administrator'],
      function(err) {
        if (err) {
          console.error('❌ Error inserting admin:', err.message);
          db.close();
          return;
        }

        console.log('✅ Admin user berhasil dibuat!\n');
        console.log('   Email: admin@voucher.com');
        console.log('   Password:', process.env.ADMIN_DEFAULT_PASSWORD || 'admin123');
        console.log('   ID:', this.lastID);
        console.log('\n🔐 Silakan login di: https://voucher.tdn.id/admin-login.html\n');
        
        db.close();
      }
    );
  });
}

createAdmin();
