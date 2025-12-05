// Script to update server.js to support ADS- vouchers as regular vouchers
const fs = require('fs');

console.log('Updating server.js to support ADS- vouchers...\n');

// Read server.js
let content = fs.readFileSync('./server.js', 'utf8');

// Count occurrences before
const beforeCount = (content.match(/voucher_number LIKE 'SRP-%'/g) || []).length;
console.log(`Found ${beforeCount} occurrences of "voucher_number LIKE 'SRP-%'"`);

// Replace all occurrences
// Pattern 1: In quota checks (COUNT queries)
content = content.replace(
  /quotaQuery = "SELECT COUNT\(\*\) as available FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%'";/g,
  `quotaQuery = "SELECT COUNT(*) as available FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')";`
);

// Pattern 2: In voucher selection (SELECT * queries)
content = content.replace(
  /voucherQuery = "SELECT \* FROM voucher_srp WHERE is_used = 0 AND voucher_number LIKE 'SRP-%' ORDER BY id ASC LIMIT 1";/g,
  `voucherQuery = "SELECT * FROM voucher_srp WHERE is_used = 0 AND (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%') ORDER BY id ASC LIMIT 1";`
);

// Pattern 3: In stats endpoint
content = content.replace(
  /WHERE voucher_number LIKE 'SRP-%'/g,
  `WHERE (voucher_number LIKE 'SRP-%' OR voucher_number LIKE 'ADS-%')`
);

// Update comments
content = content.replace(
  /\/\/ Check regular vouchers \(SRP- prefix\)/g,
  `// Check regular vouchers (SRP- or ADS- prefix)`
);

content = content.replace(
  /\/\/ Get regular voucher \(SRP- prefix\)/g,
  `// Get regular voucher (SRP- or ADS- prefix)`
);

// Count occurrences after
const afterCount = (content.match(/voucher_number LIKE 'SRP-%'/g) || []).length;
console.log(`Remaining occurrences: ${afterCount}`);
console.log(`Updated: ${beforeCount - afterCount} occurrences\n`);

// Write back
fs.writeFileSync('./server.js', content, 'utf8');

console.log('✅ server.js updated successfully!');
console.log('\nChanges made:');
console.log('1. Quota checks now include ADS- vouchers');
console.log('2. Voucher selection now includes ADS- vouchers');
console.log('3. Stats endpoint now includes ADS- vouchers');
console.log('\nRegular vouchers now include: SRP- and ADS-');
console.log('RT vouchers remain: RTT-');
