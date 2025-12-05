// Script untuk verifikasi reset database
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./voucher_downloads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

console.log('🔍 Verifying database reset...\n');

db.serialize(() => {
  // Check downloads table
  db.get('SELECT COUNT(*) as count FROM downloads', (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`📋 Downloads Table:`);
      console.log(`   Total records: ${row.count}`);
      console.log(`   Status: ${row.count === 0 ? '✅ EMPTY (CORRECT)' : '❌ NOT EMPTY'}\n`);
    }
  });

  // Check voucher_srp table
  db.all('SELECT id, voucher_number, is_used, used_by_download_id FROM voucher_srp LIMIT 5', (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`🎫 Voucher SRP Table (First 5):`);
      rows.forEach(row => {
        console.log(`   ID: ${row.id}, Voucher: ${row.voucher_number}, is_used: ${row.is_used}, used_by: ${row.used_by_download_id || 'NULL'}`);
      });
    }
  });

  db.get('SELECT COUNT(*) as total, SUM(is_used) as used FROM voucher_srp', (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else {
      const used = row.used || 0;
      const available = row.total - used;
      console.log(`\n   Total vouchers: ${row.total}`);
      console.log(`   Used: ${used}`);
      console.log(`   Available: ${available}`);
      console.log(`   Status: ${used === 0 ? '✅ ALL RESET (CORRECT)' : '❌ SOME STILL USED'}\n`);
    }
  });

  // Check settings
  db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`⚙️  Settings:`);
      console.log(`   Total quota: ${row.total_quota}`);
      console.log(`   Used quota: ${row.used_quota}`);
      console.log(`   Status: ${row.used_quota === 0 ? '✅ RESET (CORRECT)' : '❌ NOT RESET'}\n`);
    }
    
    db.close();
  });
});
