#!/bin/bash
# Script untuk cek konfigurasi SSL di Nginx

echo "=========================================="
echo "CEK NGINX SSL CONFIGURATION"
echo "=========================================="
echo ""

echo "1. Nginx config files:"
sudo ls -la /etc/nginx/sites-enabled/

echo ""
echo "=========================================="

echo "2. SSL configuration di Nginx:"
echo ""
for config in /etc/nginx/sites-enabled/*; do
    if [ -f "$config" ]; then
        echo "File: $config"
        echo "---"
        sudo grep -E "(listen|server_name|ssl_certificate)" "$config" | grep -v "#"
        echo ""
    fi
done

echo ""
echo "=========================================="

echo "3. Full SSL config untuk voucher.tdn.id:"
echo ""
sudo grep -A 20 -B 5 "voucher.tdn.id" /etc/nginx/sites-enabled/* 2>/dev/null || echo "Tidak ditemukan config untuk voucher.tdn.id"

echo ""
echo "=========================================="

echo "4. Test akses HTTPS dari server:"
echo ""
echo "Test HTTP (port 80):"
curl -I http://voucher.tdn.id 2>&1 | head -5

echo ""
echo "Test HTTPS (port 443):"
curl -I https://voucher.tdn.id 2>&1 | head -5

echo ""
echo "=========================================="

echo "5. Cek certificate yang digunakan Nginx:"
echo ""
echo "Certificate di config:"
sudo grep -r "ssl_certificate" /etc/nginx/sites-enabled/ 2>/dev/null

echo ""
echo "Certificate yang tersedia:"
ls -la /etc/letsencrypt/live/voucher.tdn.id/

echo ""
echo "=========================================="

echo "6. Test SSL dengan openssl:"
echo ""
timeout 5 openssl s_client -connect voucher.tdn.id:443 -servername voucher.tdn.id 2>/dev/null | grep -E "(subject|issuer|Verify return code)"

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""
echo "Jika curl HTTPS gagal atau certificate tidak match:"
echo "  → Nginx mungkin tidak menggunakan certificate yang benar"
echo "  → Atau Nginx config untuk SSL belum ada"
echo ""
echo "Solusi:"
echo "  1. Cek config di /etc/nginx/sites-enabled/"
echo "  2. Pastikan ada config untuk voucher.tdn.id dengan SSL"
echo "  3. Jika tidak ada, jalankan: sudo certbot --nginx -d voucher.tdn.id"
