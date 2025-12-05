/**
 * Database Migration Script: Add UTM Tracking
 * Run: node migrate-utm.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

console.log('========================================');
console.log('DATABASE MIGRATION: Add UTM Tracking');
console.log('========================================');
console.log('');

// Check if column already exists
db.get("PRAGMA table_info(downloads)", (err, row) => {
  if (err) {
    console.error('❌ Error checking table:', err);
    db.close();
    return;
  }

  // Check if utm_source column exists
  db.all("PRAGMA table_info(downloads)", (err, columns) => {
    if (err) {
      console.error('❌ Error getting columns:', err);
      db.close();
      return;
    }

    const hasUtmSource = columns.some(col => col.name === 'utm_source');

    if (hasUtmSource) {
      console.log('✅ Column utm_source already exists!');
      console.log('   Migration skipped.');
      console.log('');
      
      // Show sample data
      db.all("SELECT id, phone_number, utm_source FROM downloads ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('📊 Sample data:');
          console.table(rows);
        }
        db.close();
      });
      return;
    }

    // Add utm_source column
    console.log('📝 Adding utm_source column...');
    
    db.run("ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct'", (err) => {
      if (err) {
        console.error('❌ Error adding column:', err);
        db.close();
        return;
      }

      console.log('✅ Column utm_source added successfully!');
      console.log('');

      // Verify
      db.all("PRAGMA table_info(downloads)", (err, columns) => {
        if (err) {
          console.error('❌ Error verifying:', err);
          db.close();
          return;
        }

        console.log('📋 Table structure:');
        console.table(columns.map(col => ({
          name: col.name,
          type: col.type,
          default: col.dflt_value
        })));

        console.log('');
        console.log('========================================');
        console.log('✅ MIGRATION COMPLETED!');
        console.log('========================================');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test download tanpa UTM');
        console.log('2. Test download dengan ?utm_source=RT01');
        console.log('3. Check admin panel');
        console.log('');

        db.close();
      });
    });
  });
});
