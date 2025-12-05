#!/bin/bash
# Script untuk cek DNS dan accessibility

echo "=========================================="
echo "CEK DNS DAN ACCESSIBILITY"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"
SERVER_IP="103.164.223.83"

# 1. Cek DNS resolution
echo "1. Cek DNS Resolution:"
echo ""
echo "Domain: $DOMAIN"
echo "Server IP: $SERVER_IP"
echo ""

RESOLVED_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -1)
echo "DNS Resolution (Google DNS): $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS pointing ke server yang benar"
else
    echo "❌ DNS TIDAK pointing ke server!"
    echo "   Expected: $SERVER_IP"
    echo "   Got: $RESOLVED_IP"
    echo ""
    echo "💡 Solusi: Update DNS A record di domain registrar:"
    echo "   voucher.tdn.id -> $SERVER_IP"
fi

echo ""
echo "=========================================="

# 2. Cek dari berbagai DNS server
echo "2. Cek dari berbagai DNS server:"
echo ""

echo "Google DNS (8.8.8.8):"
dig +short $DOMAIN @8.8.8.8 | tail -1

echo ""
echo "Cloudflare DNS (1.1.1.1):"
dig +short $DOMAIN @1.1.1.1 | tail -1

echo ""
echo "Local DNS:"
dig +short $DOMAIN | tail -1

echo ""
echo "=========================================="

# 3. Test akses via IP
echo "3. Test akses via IP ($SERVER_IP):"
echo ""

echo "HTTP via IP:"
curl -I http://$SERVER_IP 2>&1 | head -5

echo ""
echo "HTTPS via IP (akan error karena certificate untuk domain):"
curl -I -k https://$SERVER_IP 2>&1 | head -5

echo ""
echo "=========================================="

# 4. Test akses via domain
echo "4. Test akses via domain ($DOMAIN):"
echo ""

echo "HTTP via domain:"
curl -I http://$DOMAIN 2>&1 | head -5

echo ""
echo "HTTPS via domain:"
curl -I https://$DOMAIN 2>&1 | head -5

echo ""
echo "=========================================="

# 5. Test dengan Host header
echo "5. Test dengan Host header (bypass DNS):"
echo ""

echo "HTTP dengan Host header:"
curl -I -H "Host: $DOMAIN" http://$SERVER_IP 2>&1 | head -5

echo ""
echo "HTTPS dengan Host header:"
curl -I -k -H "Host: $DOMAIN" https://$SERVER_IP 2>&1 | head -5

echo ""
echo "=========================================="

# 6. Cek Nginx server_name config
echo "6. Cek Nginx server_name config:"
echo ""
sudo grep -r "server_name" /etc/nginx/sites-enabled/ | grep -v "#"

echo ""
echo "=========================================="

# 7. Ping test
echo "7. Ping test:"
echo ""
ping -c 3 $DOMAIN 2>&1 | head -10

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo "❌ MASALAH: DNS tidak pointing ke server"
    echo ""
    echo "Solusi:"
    echo "1. Login ke domain registrar (tempat beli domain)"
    echo "2. Update DNS A record:"
    echo "   Type: A"
    echo "   Name: voucher (atau @)"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600"
    echo ""
    echo "3. Tunggu propagasi DNS (5 menit - 24 jam)"
    echo ""
    echo "4. Test lagi dengan: ping $DOMAIN"
elif curl -I https://$DOMAIN 2>&1 | grep -q "200\|301\|302"; then
    echo "✅ Semuanya OK! HTTPS accessible"
else
    echo "⚠️  DNS OK tapi HTTPS tidak accessible"
    echo ""
    echo "Kemungkinan:"
    echo "1. Firewall memblokir port 443"
    echo "2. Nginx tidak listening di port 443"
    echo "3. Certificate issue"
    echo ""
    echo "Cek dengan:"
    echo "  sudo ufw status"
    echo "  sudo netstat -tulpn | grep :443"
fi
