#!/bin/bash
# Script untuk test koneksi lengkap

echo "=========================================="
echo "TEST KONEKSI LENGKAP"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"

echo "1. Test Node.js langsung (port 3000):"
echo ""
curl -I http://localhost:3000 2>&1 | head -10

echo ""
echo "=========================================="

echo "2. Test Nginx HTTP (port 80) via localhost:"
echo ""
curl -I http://localhost 2>&1 | head -10

echo ""
echo "=========================================="

echo "3. Test Nginx HTTPS (port 443) via localhost:"
echo ""
curl -I -k https://localhost 2>&1 | head -10

echo ""
echo "=========================================="

echo "4. Test HTTP via domain (dari server):"
echo ""
curl -I http://$DOMAIN 2>&1 | head -10

echo ""
echo "=========================================="

echo "5. Test HTTPS via domain (dari server):"
echo ""
curl -I https://$DOMAIN 2>&1 | head -10

echo ""
echo "=========================================="

echo "6. Test dengan verbose untuk lihat detail error:"
echo ""
curl -v https://$DOMAIN 2>&1 | head -30

echo ""
echo "=========================================="

echo "7. Cek Nginx error log (last 20 lines):"
echo ""
sudo tail -20 /var/log/nginx/error.log

echo ""
echo "=========================================="

echo "8. Cek Nginx access log (last 10 lines):"
echo ""
sudo tail -10 /var/log/nginx/access.log

echo ""
echo "=========================================="

echo "9. Test DNS resolution:"
echo ""
nslookup $DOMAIN
echo ""
dig +short $DOMAIN

echo ""
echo "=========================================="

echo "10. Test SSL handshake:"
echo ""
timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>&1 | head -40

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
