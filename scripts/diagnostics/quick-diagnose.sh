#!/bin/bash
# Quick diagnose untuk masalah akses domain

echo "=========================================="
echo "QUICK DIAGNOSE"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"
SERVER_IP="103.164.223.83"

# Test 1: DNS
echo "✓ Test 1: DNS Resolution"
RESOLVED_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -1)
echo "  Domain: $DOMAIN"
echo "  Server IP: $SERVER_IP"
echo "  Resolved IP: $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "  Status: ✅ DNS OK"
    DNS_OK=true
else
    echo "  Status: ❌ DNS SALAH!"
    echo ""
    echo "  🔧 FIX: Update DNS A record di domain registrar"
    echo "     voucher.tdn.id -> $SERVER_IP"
    DNS_OK=false
fi

echo ""

# Test 2: Ping
echo "✓ Test 2: Ping Domain"
if ping -c 2 $DOMAIN &>/dev/null; then
    PING_IP=$(ping -c 1 $DOMAIN | grep "PING" | awk -F'[()]' '{print $2}')
    echo "  Ping IP: $PING_IP"
    if [ "$PING_IP" = "$SERVER_IP" ]; then
        echo "  Status: ✅ Ping OK"
    else
        echo "  Status: ❌ Ping ke IP salah"
    fi
else
    echo "  Status: ❌ Tidak bisa ping"
fi

echo ""

# Test 3: Port 443 accessible
echo "✓ Test 3: Port 443 Accessible"
if timeout 3 bash -c "echo > /dev/tcp/$DOMAIN/443" 2>/dev/null; then
    echo "  Status: ✅ Port 443 terbuka"
else
    echo "  Status: ❌ Port 443 tidak accessible"
    echo ""
    echo "  🔧 FIX: Cek firewall"
    echo "     sudo ufw allow 443/tcp"
fi

echo ""

# Test 4: HTTPS Response
echo "✓ Test 4: HTTPS Response"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null)
echo "  HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "  Status: ✅ HTTPS OK"
else
    echo "  Status: ❌ HTTPS tidak OK"
fi

echo ""

# Test 5: SSL Certificate
echo "✓ Test 5: SSL Certificate"
if timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "  Status: ✅ Certificate valid"
else
    echo "  Status: ⚠️  Certificate issue (atau timeout)"
fi

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""

if [ "$DNS_OK" = false ]; then
    echo "❌ MASALAH UTAMA: DNS"
    echo ""
    echo "Domain voucher.tdn.id tidak pointing ke server $SERVER_IP"
    echo ""
    echo "SOLUSI:"
    echo "1. Login ke domain registrar (tempat beli domain)"
    echo "2. Cari menu DNS Management / DNS Settings"
    echo "3. Update atau tambah A record:"
    echo ""
    echo "   Type: A"
    echo "   Name: voucher (atau @ untuk root domain)"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600"
    echo ""
    echo "4. Save dan tunggu 5-30 menit untuk propagasi"
    echo ""
    echo "5. Test dengan: ping voucher.tdn.id"
    echo "   Harus dapat IP: $SERVER_IP"
    echo ""
    echo "Sementara waktu, akses pakai IP:"
    echo "   http://$SERVER_IP"
    
elif [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "302" ]; then
    echo "⚠️  DNS OK tapi HTTPS tidak bisa diakses"
    echo ""
    echo "SOLUSI:"
    echo "1. Cek Nginx config:"
    echo "   ./check-nginx-ssl.sh"
    echo ""
    echo "2. Fix Nginx default server:"
    echo "   ./fix-nginx-default-server.sh"
    echo ""
    echo "3. Cek firewall:"
    echo "   sudo ufw status"
    echo "   sudo ufw allow 443/tcp"
else
    echo "✅ SEMUANYA OK!"
    echo ""
    echo "HTTPS seharusnya bisa diakses: https://$DOMAIN"
    echo ""
    echo "Jika masih tidak bisa di browser:"
    echo "1. Clear browser cache (Ctrl+Shift+Del)"
    echo "2. Coba browser lain atau incognito mode"
    echo "3. Coba dari device lain"
    echo "4. Tunggu beberapa menit untuk DNS propagation"
fi

echo ""
echo "=========================================="
