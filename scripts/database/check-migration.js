/**
 * Check Migration Status
 * Run: node check-migration.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

console.log('========================================');
console.log('CHECK MIGRATION STATUS');
console.log('========================================');
console.log('');

// Check table structure
db.all("PRAGMA table_info(downloads)", (err, columns) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  console.log('📋 Downloads table structure:');
  console.table(columns.map(col => ({
    name: col.name,
    type: col.type,
    default: col.dflt_value || 'NULL'
  })));

  const hasUtmSource = columns.some(col => col.name === 'utm_source');

  console.log('');
  if (hasUtmSource) {
    console.log('✅ utm_source column EXISTS');
    console.log('   Migration status: COMPLETED');
    
    // Show sample data
    db.all("SELECT id, phone_number, utm_source, download_time FROM downloads ORDER BY id DESC LIMIT 5", (err, rows) => {
      if (!err) {
        console.log('');
        console.log('📊 Sample data (latest 5):');
        if (rows.length > 0) {
          console.table(rows);
        } else {
          console.log('   No data yet');
        }
      }
      db.close();
    });
  } else {
    console.log('❌ utm_source column NOT FOUND');
    console.log('   Migration status: PENDING');
    console.log('');
    console.log('Run migration:');
    console.log('   node migrate-utm.js');
    db.close();
  }
});
