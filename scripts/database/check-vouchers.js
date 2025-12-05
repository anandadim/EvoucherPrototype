// Quick script to check voucher status
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voucher_downloads.db');

console.log('=== CHECKING VOUCHER STATUS ===\n');

// Check SRP- vouchers
db.get(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
  FROM voucher_srp 
  WHERE (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')
`, (err, srpStats) => {
  if (err) {
    console.error('Error checking SRP vouchers:', err);
    return;
  }
  
  console.log('📦 Regular Vouchers (SRP- or ADS-):');
  console.log('  Total:', srpStats.total || 0);
  console.log('  Available:', srpStats.available || 0);
  console.log('  Used:', srpStats.used || 0);
  console.log('');
  
  // Check RTT- vouchers
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
    FROM voucher_srp 
    WHERE voucher_number LIKE 'RTT-%'
  `, (err, rttStats) => {
    if (err) {
      console.error('Error checking RTT vouchers:', err);
      return;
    }
    
    console.log('🏘️ RT Vouchers (RTT-):');
    console.log('  Total:', rttStats.total || 0);
    console.log('  Available:', rttStats.available || 0);
    console.log('  Used:', rttStats.used || 0);
    console.log('');
    
    // Check all vouchers (no filter)
    db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used
      FROM voucher_srp
    `, (err, allStats) => {
      if (err) {
        console.error('Error checking all vouchers:', err);
        return;
      }
      
      console.log('📊 All Vouchers (Total):');
      console.log('  Total:', allStats.total || 0);
      console.log('  Available:', allStats.available || 0);
      console.log('  Used:', allStats.used || 0);
      console.log('');
      
      // Show sample vouchers
      db.all(`
        SELECT voucher_number, is_used 
        FROM voucher_srp 
        ORDER BY id ASC 
        LIMIT 10
      `, (err, samples) => {
        if (err) {
          console.error('Error getting samples:', err);
          return;
        }
        
        console.log('📋 Sample Vouchers (first 10):');
        samples.forEach((v, i) => {
          console.log(`  ${i+1}. ${v.voucher_number} - ${v.is_used ? 'USED' : 'AVAILABLE'}`);
        });
        console.log('');
        
        // Diagnosis
        console.log('=== DIAGNOSIS ===');
        if (srpStats.total === 0 && rttStats.total === 0) {
          console.log('❌ NO VOUCHERS in database!');
          console.log('   → Upload vouchers via admin panel');
        } else if (srpStats.available === 0 && rttStats.available > 0) {
          console.log('⚠️ SRP- vouchers HABIS, but RTT- available');
          console.log('   → Upload more SRP- vouchers for direct/whatsapp/instagram users');
        } else if (srpStats.available > 0 && rttStats.available === 0) {
          console.log('⚠️ RTT- vouchers HABIS, but SRP- available');
          console.log('   → Upload more RTT- vouchers for RT01/RT02 users');
        } else if (srpStats.available === 0 && rttStats.available === 0) {
          console.log('❌ ALL vouchers HABIS!');
          console.log('   → Upload both SRP- and RTT- vouchers');
        } else {
          console.log('✅ Both voucher types available');
          console.log('   → System should work correctly');
        }
        
        db.close();
      });
    });
  });
});
