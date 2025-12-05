// Script untuk reset database
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./voucher_downloads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Database connected');
});

// Reset database
db.serialize(() => {
  console.log('🔄 Resetting database...\n');

  // 1. Kosongkan tabel downloads
  db.run('DELETE FROM downloads', function(err) {
    if (err) {
      console.error('❌ Error deleting downloads:', err);
    } else {
      console.log(`✅ Deleted ${this.changes} records from downloads table`);
    }
  });

  // 2. Reset voucher_srp - set is_used = 0 dan used_by_download_id = NULL
  db.run('UPDATE voucher_srp SET is_used = 0, used_by_download_id = NULL, used_at = NULL', function(err) {
    if (err) {
      console.error('❌ Error resetting voucher_srp:', err);
    } else {
      console.log(`✅ Reset ${this.changes} vouchers in voucher_srp table`);
    }
  });

  // 3. Reset used_quota di voucher_settings
  db.run('UPDATE voucher_settings SET used_quota = 0 WHERE id = 1', function(err) {
    if (err) {
      console.error('❌ Error resetting quota:', err);
    } else {
      console.log(`✅ Reset used_quota to 0`);
    }
  });

  // 4. Verify results
  db.get('SELECT COUNT(*) as count FROM downloads', (err, row) => {
    if (!err) {
      console.log(`\n📊 Downloads table: ${row.count} records`);
    }
  });

  db.get('SELECT COUNT(*) as total, SUM(is_used) as used FROM voucher_srp', (err, row) => {
    if (!err) {
      console.log(`📊 Voucher SRP: ${row.total} total, ${row.used || 0} used, ${row.total - (row.used || 0)} available`);
    }
  });

  db.get('SELECT used_quota, total_quota FROM voucher_settings WHERE id = 1', (err, row) => {
    if (!err) {
      console.log(`📊 Settings: ${row.used_quota}/${row.total_quota} used\n`);
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database reset complete!');
      }
    });
  });
});
