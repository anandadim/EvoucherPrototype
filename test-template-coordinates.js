/**
 * Script untuk test koordinat template voucher
 * Gunakan script ini untuk menemukan koordinat yang tepat untuk setiap template
 */

const { createCanvas, Image } = require('canvas');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Test data
const testData = {
  voucherCode: 'VCH-TEST123',
  tanggalBlasting: '27/11/2024',
  noHandphone: '0812-3456-7890'
};

// Template yang akan di-test
const templates = [
  {
    name: 'voucher-template.jpeg',
    coords: {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    }
  },
  {
    name: 'voucher-template-cibinong.jpg',
    coords: {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    }
  },
  {
    name: 'voucher-template-cileungsi.jpg',
    coords: {
      qr: { x: 195, y: 400, size: 320 },
      voucherCode: { x: 1030, y: 420, font: 'bold 42px Arial', color: '#ffffff' },
      tanggal: { x: 1030, y: 500, font: 'bold 32px Arial', color: '#333333' },
      phone: { x: 1030, y: 550, font: 'bold 32px Arial', color: '#333333' }
    }
  }
];

async function testTemplate(template) {
  try {
    console.log(`\n========================================`);
    console.log(`Testing: ${template.name}`);
    console.log(`========================================`);

    const templatePath = path.join(__dirname, 'public/images', template.name);
    
    if (!fs.existsSync(templatePath)) {
      console.log(`❌ Template not found: ${templatePath}`);
      return;
    }

    // Load template
    const templateBuffer = fs.readFileSync(templatePath);
    const templateImage = new Image();
    templateImage.src = templateBuffer;

    console.log(`Template size: ${templateImage.width}x${templateImage.height}`);

    // Create canvas
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');

    // Draw template
    ctx.drawImage(templateImage, 0, 0);

    // Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(testData.voucherCode, {
      width: 240,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const qrImage = new Image();
    qrImage.src = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Draw QR Code with red border for visibility
    const coords = template.coords;
    
    // Red box around QR area
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(coords.qr.x, coords.qr.y, coords.qr.size, coords.qr.size);
    
    // Draw QR Code
    ctx.drawImage(qrImage, coords.qr.x, coords.qr.y, coords.qr.size, coords.qr.size);

    // Draw voucher code with background for visibility
    ctx.fillStyle = coords.voucherCode.color;
    ctx.font = coords.voucherCode.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add red circle marker at text position
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(coords.voucherCode.x, coords.voucherCode.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = coords.voucherCode.color;
    ctx.fillText(testData.voucherCode, coords.voucherCode.x, coords.voucherCode.y);

    // Draw tanggal with marker
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(coords.tanggal.x, coords.tanggal.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = coords.tanggal.color;
    ctx.font = coords.tanggal.font;
    ctx.fillText(testData.tanggalBlasting, coords.tanggal.x, coords.tanggal.y);

    // Draw phone with marker
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(coords.phone.x, coords.phone.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = coords.phone.color;
    ctx.font = coords.phone.font;
    ctx.fillText(testData.noHandphone, coords.phone.x, coords.phone.y);

    // Save test image
    const outputPath = path.join(__dirname, `test-output-${template.name}`);
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);

    console.log(`✓ Test image saved: ${outputPath}`);
    console.log(`\nCoordinates used:`);
    console.log(`  QR Code: x=${coords.qr.x}, y=${coords.qr.y}, size=${coords.qr.size}`);
    console.log(`  Voucher Code: x=${coords.voucherCode.x}, y=${coords.voucherCode.y}`);
    console.log(`  Tanggal: x=${coords.tanggal.x}, y=${coords.tanggal.y}`);
    console.log(`  Phone: x=${coords.phone.x}, y=${coords.phone.y}`);
    console.log(`\n💡 Cek file output dan adjust koordinat jika perlu`);
    console.log(`   Red markers menunjukkan posisi center text`);
    console.log(`   Red box menunjukkan area QR code`);

  } catch (error) {
    console.error(`❌ Error testing ${template.name}:`, error.message);
  }
}

async function main() {
  console.log('========================================');
  console.log('TEMPLATE COORDINATE TESTER');
  console.log('========================================');
  console.log('\nTest data:');
  console.log(`  Voucher Code: ${testData.voucherCode}`);
  console.log(`  Tanggal: ${testData.tanggalBlasting}`);
  console.log(`  Phone: ${testData.noHandphone}`);

  for (const template of templates) {
    await testTemplate(template);
  }

  console.log('\n========================================');
  console.log('SELESAI');
  console.log('========================================');
  console.log('\nCara adjust koordinat:');
  console.log('1. Buka file test-output-*.jpeg');
  console.log('2. Lihat posisi QR code, text, dll');
  console.log('3. Jika tidak pas, edit koordinat di script ini');
  console.log('4. Jalankan lagi: node test-template-coordinates.js');
  console.log('5. Setelah pas, copy koordinat ke server.js');
  console.log('\nTips:');
  console.log('- Koordinat x,y adalah center point untuk text');
  console.log('- Koordinat x,y untuk QR adalah top-left corner');
  console.log('- Increase x = geser ke kanan');
  console.log('- Increase y = geser ke bawah');
}

main().catch(console.error);
