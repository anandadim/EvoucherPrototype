#!/bin/bash
# Script untuk fix port di Nginx config

echo "=========================================="
echo "FIX NGINX PORT"
echo "=========================================="
echo ""

CONFIG_FILE="/etc/nginx/sites-available/voucher.tdn.id"

echo "1. Backup config..."
sudo cp $CONFIG_FILE ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup selesai"

echo ""
echo "=========================================="

echo "2. Update port dari 3000 ke 3003..."
sudo sed -i 's/proxy_pass http:\/\/localhost:3000;/proxy_pass http:\/\/localhost:3003;/g' $CONFIG_FILE
echo "✓ Port updated"

echo ""
echo "=========================================="

echo "3. Verify perubahan..."
echo ""
echo "Config setelah update:"
sudo grep "proxy_pass" $CONFIG_FILE

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
    sudo cp ${CONFIG_FILE}.backup.* $CONFIG_FILE
    exit 1
fi

echo ""
echo "=========================================="

echo "6. Test akses..."
sleep 2
echo ""

echo "Test HTTPS:"
curl -I https://voucher.tdn.id 2>&1 | head -10

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "✅ Port sudah diperbaiki dari 3000 ke 3003"
echo ""
echo "Coba akses sekarang:"
echo "  https://voucher.tdn.id"
echo ""
echo "Seharusnya sudah bisa! 🎉"
