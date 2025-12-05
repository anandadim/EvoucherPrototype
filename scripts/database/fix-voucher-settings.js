// Fix voucher_settings table - Initialize if empty
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing voucher_settings table...\n');

// Check if voucher_settings has data
db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, row) => {
  if (err) {
    console.error('❌ Error checking voucher_settings:', err);
    db.close();
    return;
  }

  if (!row) {
    console.log('⚠️ voucher_settings is empty, initializing...');
    
    // Insert default settings
    db.run(
      'INSERT INTO voucher_settings (id, total_quota, allow_redownload) VALUES (1, 100, 0)',
      (err) => {
        if (err) {
          console.error('❌ Error inserting default settings:', err);
        } else {
          console.log('✅ Default settings inserted:');
          console.log('   - id: 1');
          console.log('   - total_quota: 100');
          console.log('   - allow_redownload: 0');
        }
        
        // Verify
        db.get('SELECT * FROM voucher_settings WHERE id = 1', (err, newRow) => {
          if (err) {
            console.error('❌ Error verifying:', err);
          } else {
            console.log('\n✅ Verification:');
            console.log(newRow);
          }
          db.close();
        });
      }
    );
  } else {
    console.log('✅ voucher_settings already has data:');
    console.log(row);
    console.log('\n✅ No action needed!');
    db.close();
  }
});
