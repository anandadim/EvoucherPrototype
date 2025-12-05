#!/bin/bash
# Master script untuk diagnosa SSL

echo "=========================================="
echo "DIAGNOSA SSL - voucher.tdn.id"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"
PASS=0
FAIL=0

# Test 1: Certificate exists
echo "✓ Test 1: Certificate exists"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "  ✅ PASS - Certificate ditemukan"
    PASS=$((PASS+1))
    
    # Check expiry
    EXPIRY=$(sudo openssl x509 -in /etc/letsencrypt/live/$DOMAIN/cert.pem -noout -enddate | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    echo "  📅 Expired: $EXPIRY ($DAYS_LEFT hari lagi)"
else
    echo "  ❌ FAIL - Certificate tidak ditemukan"
    FAIL=$((FAIL+1))
fi

echo ""

# Test 2: Nginx config valid
echo "✓ Test 2: Nginx config valid"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "  ✅ PASS - Nginx config valid"
    PASS=$((PASS+1))
else
    echo "  ❌ FAIL - Nginx config error"
    FAIL=$((FAIL+1))
fi

echo ""

# Test 3: Nginx using SSL certificate
echo "✓ Test 3: Nginx menggunakan SSL certificate"
if sudo grep -r "ssl_certificate.*$DOMAIN" /etc/nginx/sites-enabled/ 2>/dev/null | grep -q "fullchain.pem"; then
    echo "  ✅ PASS - Nginx menggunakan certificate"
    PASS=$((PASS+1))
else
    echo "  ❌ FAIL - Nginx tidak menggunakan certificate"
    echo "  💡 Solusi: Jalankan ./enable-nginx-ssl.sh"
    FAIL=$((FAIL+1))
fi

echo ""

# Test 4: Port 443 listening
echo "✓ Test 4: Port 443 listening"
if sudo netstat -tulpn 2>/dev/null | grep -q ":443.*nginx" || sudo ss -tulpn 2>/dev/null | grep -q ":443.*nginx"; then
    echo "  ✅ PASS - Nginx listening di port 443"
    PASS=$((PASS+1))
else
    echo "  ❌ FAIL - Port 443 tidak listening"
    FAIL=$((FAIL+1))
fi

echo ""

# Test 5: HTTPS accessible
echo "✓ Test 5: HTTPS accessible"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "  ✅ PASS - HTTPS accessible (HTTP $HTTP_CODE)"
    PASS=$((PASS+1))
else
    echo "  ❌ FAIL - HTTPS tidak accessible (HTTP $HTTP_CODE)"
    FAIL=$((FAIL+1))
fi

echo ""

# Test 6: SSL certificate valid
echo "✓ Test 6: SSL certificate valid (dari client)"
if timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "  ✅ PASS - SSL certificate valid"
    PASS=$((PASS+1))
else
    echo "  ⚠️  WARNING - SSL certificate validation issue"
    echo "  (Ini normal jika test dari server yang sama)"
fi

echo ""

# Test 7: HTTP redirect to HTTPS
echo "✓ Test 7: HTTP redirect to HTTPS"
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null)
if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
    echo "  ✅ PASS - HTTP redirect ke HTTPS"
    PASS=$((PASS+1))
else
    echo "  ⚠️  WARNING - HTTP tidak redirect ke HTTPS (HTTP $HTTP_REDIRECT)"
fi

echo ""

# Test 8: Auto-renewal configured
echo "✓ Test 8: Auto-renewal configured"
if sudo systemctl is-enabled certbot.timer 2>/dev/null | grep -q "enabled"; then
    echo "  ✅ PASS - Auto-renewal enabled"
    PASS=$((PASS+1))
else
    echo "  ❌ FAIL - Auto-renewal tidak enabled"
    echo "  💡 Solusi: Jalankan ./fix-auto-renewal.sh"
    FAIL=$((FAIL+1))
fi

echo ""
echo "=========================================="
echo "HASIL DIAGNOSA"
echo "=========================================="
echo ""
echo "✅ PASS: $PASS"
echo "❌ FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 SEMPURNA! SSL sudah aktif dan berfungsi dengan baik"
    echo ""
    echo "Test di browser: https://$DOMAIN"
elif [ $FAIL -le 2 ]; then
    echo "⚠️  SSL hampir sempurna, ada beberapa issue kecil"
    echo ""
    echo "Rekomendasi:"
    if ! sudo grep -r "ssl_certificate.*$DOMAIN" /etc/nginx/sites-enabled/ 2>/dev/null | grep -q "fullchain.pem"; then
        echo "  1. Jalankan: ./enable-nginx-ssl.sh"
    fi
    if ! sudo systemctl is-enabled certbot.timer 2>/dev/null | grep -q "enabled"; then
        echo "  2. Jalankan: ./fix-auto-renewal.sh"
    fi
else
    echo "❌ SSL belum aktif dengan baik"
    echo ""
    echo "Langkah perbaikan:"
    echo "  1. Jalankan: ./check-nginx-ssl.sh (untuk detail)"
    echo "  2. Jalankan: ./enable-nginx-ssl.sh (untuk fix)"
    echo "  3. Jalankan: ./fix-auto-renewal.sh (untuk auto-renewal)"
fi

echo ""
echo "=========================================="
