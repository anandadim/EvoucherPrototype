// Project Organization Script
// This script organizes files in root directory
// EXCLUDES: EvoucherPrototype folder (production)

const fs = require('fs');
const path = require('path');

console.log('🗂️ Project Organization Script\n');
console.log('⚠️ This will organize files in root directory');
console.log('✅ EvoucherPrototype folder will NOT be touched!\n');

// Folders to ignore (never touch these!)
const IGNORE_FOLDERS = [
  'EvoucherPrototype',
  'node_modules',
  'public',
  'uploads',
  'csv_archive',
  'generated_vouchers',
  'utility',
  '.well-known',
  '.vscode',
  '.git'
];

// Folders to create
const NEW_FOLDERS = {
  'docs/deployment': [],
  'docs/features': [],
  'docs/fixes': [],
  'docs/implementation': [],
  'docs/guides': [],
  'scripts/database': [],
  'scripts/ssl': [],
  'scripts/nginx': [],
  'scripts/diagnostics': [],
  'scripts/one-time': [],
  'backups': [],
  'templates': []
};

// File patterns to move
const FILE_PATTERNS = {
  'docs/deployment': [
    'DEPLOYMENT*.md',
    'DEPLOY*.md'
  ],
  'docs/features': [
    'RT_VOUCHER*.md',
    'PHASE*.md',
    'UTM*.md',
    'BULK*.md',
    'PAGINATION*.md',
    'CSV_EXPORT*.md'
  ],
  'docs/fixes': [
    'FIX_*.md',
    'BUG_*.md',
    'TROUBLESHOOT*.md',
    'QUICK_FIX*.md'
  ],
  'docs/implementation': [
    'IMPLEMENTATION*.md',
    'SESSION*.md',
    'CHANGELOG*.md',
    'PART*.md',
    'COMPARISON*.md'
  ],
  'docs/guides': [
    '*GUIDE*.md',
    'CARA_*.md',
    'ADD_NEW*.md',
    'SECURITY*.md',
    'SSL_*.md',
    'TIMEZONE*.md',
    'ADMIN-PANEL*.md',
    'CLEANUP*.md'
  ],
  'scripts/database': [
    'check-vouchers.js',
    'delete-voucher*.js',
    'fix-voucher-settings.js',
    'migrate*.js',
    'check-migration.js'
  ],
  'scripts/ssl': [
    '*ssl*.sh',
    'renew-ssl.sh',
    'install-ssl.sh',
    'enable-nginx-ssl.sh',
    'fix-auto-renewal.sh'
  ],
  'scripts/nginx': [
    '*nginx*.sh',
    'fix-nginx-port.sh',
    'fix-nginx-default-server.sh'
  ],
  'scripts/diagnostics': [
    'check-*.sh',
    'test-*.sh',
    'quick-diagnose.sh',
    'diagnose*.sh'
  ],
  'scripts/one-time': [
    'fix-ads-vouchers.js',
    'migrate-add-utm.sql'
  ],
  'backups': [
    '*.backup*',
    'server.js.save'
  ],
  'templates': [
    'create-*.html',
    'test-*.html',
    'sample_*.csv',
    'test-*.md'
  ]
};

// Dry run mode (preview only, no actual move)
const DRY_RUN = false;

console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (Preview Only)' : '🚀 ACTUAL MOVE'}\n`);

// Create folders
console.log('📁 Creating folders...\n');
for (const folder in NEW_FOLDERS) {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    if (!DRY_RUN) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    console.log(`  ✅ ${folder}`);
  } else {
    console.log(`  ⏭️  ${folder} (already exists)`);
  }
}

console.log('\n📦 Files to move:\n');

// Function to match pattern
function matchPattern(filename, pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
  return regex.test(filename);
}

// Scan and move files
let totalFiles = 0;
for (const [targetFolder, patterns] of Object.entries(FILE_PATTERNS)) {
  const files = fs.readdirSync(__dirname);
  const matchedFiles = [];

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const stat = fs.statSync(filePath);

    // Skip if it's a directory
    if (stat.isDirectory()) continue;

    // Check if file matches any pattern
    for (const pattern of patterns) {
      if (matchPattern(file, pattern)) {
        matchedFiles.push(file);
        break;
      }
    }
  }

  if (matchedFiles.length > 0) {
    console.log(`\n📂 ${targetFolder}:`);
    matchedFiles.forEach(file => {
      console.log(`  → ${file}`);
      totalFiles++;

      if (!DRY_RUN) {
        const sourcePath = path.join(__dirname, file);
        const targetPath = path.join(__dirname, targetFolder, file);
        fs.renameSync(sourcePath, targetPath);
      }
    });
  }
}

console.log(`\n\n📊 Summary:`);
console.log(`  Total files to organize: ${totalFiles}`);
console.log(`  Folders ignored: ${IGNORE_FOLDERS.join(', ')}`);
console.log(`\n✅ EvoucherPrototype folder: UNTOUCHED (as expected)`);

if (DRY_RUN) {
  console.log('\n⚠️ This was a DRY RUN (preview only)');
  console.log('💡 To actually move files, edit this script and set DRY_RUN = false');
} else {
  console.log('\n✅ Files organized successfully!');
}

console.log('\n🎉 Done!');
