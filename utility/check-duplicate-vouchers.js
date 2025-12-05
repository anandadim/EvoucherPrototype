const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Duplicate Voucher Numbers ===\n');

// Query untuk cari duplicate voucher_number
const query = `
  SELECT 
    voucher_number, 
    COUNT(*) as count,
    GROUP_CONCAT(id) as ids,
    GROUP_CONCAT(store) as stores
  FROM voucher_srp 
  GROUP BY voucher_number 
  HAVING COUNT(*) > 1
  ORDER BY count DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('✓ Tidak ada voucher_number yang duplicate!');
    console.log('✓ Database clean!\n');
  } else {
    console.log(`⚠️  Ditemukan ${rows.length} voucher_number yang duplicate:\n`);
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Voucher Number: ${row.voucher_number}`);
      console.log(`   Jumlah duplicate: ${row.count}`);
      console.log(`   IDs: ${row.ids}`);
      console.log(`   Stores: ${row.stores}`);
      console.log('');
    });

    // Total duplicate records
    const totalDuplicates = rows.reduce((sum, row) => sum + (row.count - 1), 0);
    console.log(`Total duplicate records: ${totalDuplicates}\n`);
  }

  // Show total vouchers
  db.get('SELECT COUNT(*) as total FROM voucher_srp', [], (err, result) => {
    if (!err) {
      console.log(`Total vouchers in database: ${result.total}`);
    }
    db.close();
  });
});
