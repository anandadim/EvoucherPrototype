// Migration script to fix existing timestamps
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./voucher_downloads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

console.log('🔄 Migrating Existing Timestamps to Jakarta Time (UTC+7)\n');
console.log('⚠️  WARNING: This will modify existing data!');
console.log('   Make sure you have a backup before proceeding.\n');

// Ask for confirmation (in real scenario, use readline)
console.log('Starting migration in 3 seconds...\n');

setTimeout(() => {
  db.serialize(() => {
    console.log('📊 Checking current data...\n');

    // Check downloads
    db.get('SELECT COUNT(*) as count FROM downloads', (err, row) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(`Found ${row.count} download records`);
    });

    // Check admin_logs
    db.get('SELECT COUNT(*) as count FROM admin_logs', (err, row) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(`Found ${row.count} admin log records`);
    });

    // Check blocked_ips
    db.get('SELECT COUNT(*) as count FROM blocked_ips', (err, row) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(`Found ${row.count} blocked IP records`);
    });

    // Check voucher_srp
    db.get('SELECT COUNT(*) as count FROM voucher_srp WHERE used_at IS NOT NULL', (err, row) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(`Found ${row.count} used voucher records\n`);

      // Start migration
      console.log('🔄 Starting migration...\n');

      // Update downloads
      db.run(`UPDATE downloads 
              SET download_time = datetime(download_time, '+7 hours')
              WHERE download_time IS NOT NULL`, 
      function(err) {
        if (err) {
          console.error('❌ Error updating downloads:', err);
        } else {
          console.log(`✅ Updated ${this.changes} download records`);
        }
      });

      // Update admin_logs
      db.run(`UPDATE admin_logs 
              SET timestamp = datetime(timestamp, '+7 hours')
              WHERE timestamp IS NOT NULL`, 
      function(err) {
        if (err) {
          console.error('❌ Error updating admin_logs:', err);
        } else {
          console.log(`✅ Updated ${this.changes} admin log records`);
        }
      });

      // Update blocked_ips
      db.run(`UPDATE blocked_ips 
              SET blocked_at = datetime(blocked_at, '+7 hours')
              WHERE blocked_at IS NOT NULL`, 
      function(err) {
        if (err) {
          console.error('❌ Error updating blocked_ips:', err);
        } else {
          console.log(`✅ Updated ${this.changes} blocked IP records`);
        }
      });

      // Update admin_users
      db.run(`UPDATE admin_users 
              SET created_at = datetime(created_at, '+7 hours')
              WHERE created_at IS NOT NULL`, 
      function(err) {
        if (err) {
          console.error('❌ Error updating admin_users:', err);
        } else {
          console.log(`✅ Updated ${this.changes} admin user records`);
        }
      });

      // Update voucher_srp
      db.run(`UPDATE voucher_srp 
              SET used_at = datetime(used_at, '+7 hours')
              WHERE used_at IS NOT NULL`, 
      function(err) {
        if (err) {
          console.error('❌ Error updating voucher_srp:', err);
        } else {
          console.log(`✅ Updated ${this.changes} voucher records`);
        }

        // Verify migration
        console.log('\n📊 Verifying migration...\n');

        db.get(`SELECT 
                  datetime('now', 'localtime') as current_jakarta,
                  (SELECT download_time FROM downloads ORDER BY id DESC LIMIT 1) as latest_download
                `, (err, row) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log('Current Jakarta Time:', row.current_jakarta);
            console.log('Latest Download Time:', row.latest_download || 'No downloads');
            console.log('');
          }

          console.log('✅ Migration complete!\n');
          console.log('📝 Note: New records will automatically use Jakarta time.');
          console.log('   Old records have been adjusted by +7 hours.\n');

          db.close();
        });
      });
    });
  });
}, 3000);
