#!/bin/bash
# Test DNS dari server untuk memastikan DNS sudah benar

echo "=========================================="
echo "TEST DNS DARI SERVER"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"
EXPECTED_IP="103.164.223.83"

echo "Domain: $DOMAIN"
echo "Expected IP: $EXPECTED_IP"
echo ""

# Test dengan berbagai DNS server
echo "1. Test dengan Google DNS (8.8.8.8):"
GOOGLE_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -1)
echo "   Result: $GOOGLE_IP"
if [ "$GOOGLE_IP" = "$EXPECTED_IP" ]; then
    echo "   Status: ✅ OK"
else
    echo "   Status: ❌ SALAH atau BELUM PROPAGATE"
fi

echo ""

echo "2. Test dengan Cloudflare DNS (1.1.1.1):"
CF_IP=$(dig +short $DOMAIN @1.1.1.1 | tail -1)
echo "   Result: $CF_IP"
if [ "$CF_IP" = "$EXPECTED_IP" ]; then
    echo "   Status: ✅ OK"
else
    echo "   Status: ❌ SALAH atau BELUM PROPAGATE"
fi

echo ""

echo "3. Test dengan OpenDNS (208.67.222.222):"
OPEN_IP=$(dig +short $DOMAIN @208.67.222.222 | tail -1)
echo "   Result: $OPEN_IP"
if [ "$OPEN_IP" = "$EXPECTED_IP" ]; then
    echo "   Status: ✅ OK"
else
    echo "   Status: ❌ SALAH atau BELUM PROPAGATE"
fi

echo ""

echo "4. Test dengan Local DNS:"
LOCAL_IP=$(dig +short $DOMAIN | tail -1)
echo "   Result: $LOCAL_IP"
if [ "$LOCAL_IP" = "$EXPECTED_IP" ]; then
    echo "   Status: ✅ OK"
else
    echo "   Status: ❌ SALAH atau BELUM PROPAGATE"
fi

echo ""
echo "=========================================="

echo "5. Cek Nameserver untuk domain:"
echo ""
dig NS $DOMAIN +short

echo ""
echo "=========================================="

echo "6. Full DNS info:"
echo ""
dig $DOMAIN ANY

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""

if [ "$GOOGLE_IP" = "$EXPECTED_IP" ] && [ "$CF_IP" = "$EXPECTED_IP" ]; then
    echo "✅ DNS SUDAH BENAR dan PROPAGATE!"
    echo ""
    echo "Seharusnya https://$DOMAIN sudah bisa diakses dari mana saja."
    echo ""
    echo "Jika masih tidak bisa dari device lain:"
    echo "1. Clear DNS cache di device:"
    echo "   Windows: ipconfig /flushdns"
    echo "   Mac: sudo dscacheutil -flushcache"
    echo "   Linux: sudo systemd-resolve --flush-caches"
    echo ""
    echo "2. Restart browser atau coba incognito mode"
    echo "3. Coba dari device/network lain"
    echo "4. Ganti DNS device ke 8.8.8.8"
else
    echo "❌ DNS BELUM BENAR!"
    echo ""
    echo "Kemungkinan:"
    echo "1. DNS A record belum dibuat di domain registrar"
    echo "2. DNS baru diupdate, tunggu propagation (15 menit - 2 jam)"
    echo "3. Nameserver belum dikonfigurasi dengan benar"
    echo ""
    echo "SOLUSI:"
    echo "1. Login ke domain registrar (tempat beli domain)"
    echo "2. Cari menu DNS Management / DNS Settings"
    echo "3. Tambah/update A record:"
    echo "   Type: A"
    echo "   Name: voucher"
    echo "   Value: $EXPECTED_IP"
    echo "   TTL: 3600"
    echo ""
    echo "4. Save dan tunggu 15-30 menit"
    echo "5. Jalankan script ini lagi untuk cek"
    echo ""
    echo "Cek propagation online:"
    echo "https://www.whatsmydns.net/#A/$DOMAIN"
fi

echo ""
echo "=========================================="
