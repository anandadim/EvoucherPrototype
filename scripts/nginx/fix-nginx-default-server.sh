#!/bin/bash
# Script untuk fix Nginx agar menerima request dari domain

echo "=========================================="
echo "FIX NGINX DEFAULT SERVER"
echo "=========================================="
echo ""

# Masalah: Ada 2 config yang conflict (default dan voucher.tdn.id)
# Solusi: Disable default, hanya pakai voucher.tdn.id

echo "1. Backup config yang ada..."
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
sudo cp /etc/nginx/sites-enabled/voucher.tdn.id /etc/nginx/sites-enabled/voucher.tdn.id.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
echo "✓ Backup selesai"

echo ""
echo "=========================================="

echo "2. Disable default site..."
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null
echo "✓ Default site disabled"

echo ""
echo "=========================================="

echo "3. Cek config voucher.tdn.id..."
if [ -f "/etc/nginx/sites-enabled/voucher.tdn.id" ]; then
    echo "✓ Config voucher.tdn.id ada"
    echo ""
    echo "Isi config:"
    sudo cat /etc/nginx/sites-enabled/voucher.tdn.id
else
    echo "❌ Config voucher.tdn.id tidak ada!"
    exit 1
fi

echo ""
echo "=========================================="

echo "4. Test Nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Config valid"
    echo ""
    echo "5. Reload Nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "❌ Config error!"
    echo "Restore backup..."
    sudo cp /etc/nginx/sites-enabled/default.backup.* /etc/nginx/sites-enabled/default 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================="

echo "6. Test akses..."
sleep 2
echo ""

echo "Test HTTP (should redirect to HTTPS):"
curl -I http://voucher.tdn.id 2>&1 | head -5

echo ""
echo "Test HTTPS:"
curl -I https://voucher.tdn.id 2>&1 | head -5

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "Coba akses di browser: https://voucher.tdn.id"
