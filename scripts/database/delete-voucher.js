// Delete voucher script
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'voucher_downloads.db');
const db = new sqlite3.Database(dbPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗑️ Delete Voucher Tool\n');

// Step 1: Show available vouchers
console.log('📋 Available vouchers:\n');

db.all(`
  SELECT id, voucher_number, is_used, created_at 
  FROM voucher_srp 
  WHERE is_used = 0 
  ORDER BY id ASC 
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️ No available vouchers found!');
    db.close();
    return;
  }

  console.log('ID  | Voucher Number        | Created At');
  console.log('----|-----------------------|------------------');
  rows.forEach(row => {
    console.log(`${row.id.toString().padEnd(4)}| ${row.voucher_number.padEnd(22)}| ${row.created_at || 'N/A'}`);
  });

  console.log('\n');

  // Step 2: Ask which voucher to delete
  rl.question('Enter voucher number to delete (or "cancel" to exit): ', (answer) => {
    if (answer.toLowerCase() === 'cancel') {
      console.log('❌ Cancelled');
      rl.close();
      db.close();
      return;
    }

    const voucherNumber = answer.trim();

    // Verify voucher exists and not used
    db.get(`
      SELECT * FROM voucher_srp 
      WHERE voucher_number = ? AND is_used = 0
    `, [voucherNumber], (err, row) => {
      if (err) {
        console.error('❌ Error:', err);
        rl.close();
        db.close();
        return;
      }

      if (!row) {
        console.log('❌ Voucher not found or already used!');
        rl.close();
        db.close();
        return;
      }

      // Confirm deletion
      rl.question(`⚠️ Delete voucher "${voucherNumber}"? (yes/no): `, (confirm) => {
        if (confirm.toLowerCase() === 'yes') {
          // Delete voucher
          db.run(`DELETE FROM voucher_srp WHERE voucher_number = ?`, [voucherNumber], function(err) {
            if (err) {
              console.error('❌ Error deleting:', err);
            } else {
              console.log(`✅ Voucher "${voucherNumber}" deleted successfully!`);
              console.log(`   Rows affected: ${this.changes}`);
            }

            // Show remaining count
            db.get(`SELECT COUNT(*) as count FROM voucher_srp WHERE is_used = 0`, (err, result) => {
              if (!err) {
                console.log(`\n📊 Remaining available vouchers: ${result.count}`);
              }
              rl.close();
              db.close();
            });
          });
        } else {
          console.log('❌ Cancelled');
          rl.close();
          db.close();
        }
      });
    });
  });
});
