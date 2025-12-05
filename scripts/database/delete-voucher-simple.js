// Simple delete voucher script
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

// Get voucher number from command line argument
const voucherNumber = process.argv[2];

if (!voucherNumber) {
  console.log('❌ Usage: node delete-voucher-simple.js <voucher_number>');
  console.log('   Example: node delete-voucher-simple.js TEST-001');
  process.exit(1);
}

console.log(`🗑️ Deleting voucher: ${voucherNumber}\n`);

// Check if voucher exists and not used
db.get(`
  SELECT * FROM voucher_srp 
  WHERE voucher_number = ?
`, [voucherNumber], (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  if (!row) {
    console.log('❌ Voucher not found!');
    db.close();
    return;
  }

  if (row.is_used === 1) {
    console.log('⚠️ Warning: Voucher already used!');
    console.log(`   Used by download ID: ${row.used_by_download_id}`);
    console.log(`   Used at: ${row.used_at}`);
    console.log('\n❌ Cannot delete used voucher!');
    db.close();
    return;
  }

  // Delete voucher
  db.run(`DELETE FROM voucher_srp WHERE voucher_number = ?`, [voucherNumber], function(err) {
    if (err) {
      console.error('❌ Error deleting:', err);
      db.close();
      return;
    }

    console.log('✅ Voucher deleted successfully!');
    console.log(`   Voucher: ${voucherNumber}`);
    console.log(`   Rows affected: ${this.changes}`);

    // Show remaining count
    db.get(`SELECT COUNT(*) as count FROM voucher_srp WHERE is_used = 0`, (err, result) => {
      if (!err) {
        console.log(`\n📊 Remaining available vouchers: ${result.count}`);
      }
      db.close();
    });
  });
});
