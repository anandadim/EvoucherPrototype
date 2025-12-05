#!/bin/bash
# Script untuk cek domain yang dikonfigurasi

echo "=========================================="
echo "CEK DOMAIN CONFIGURATION"
echo "=========================================="
echo ""

# 1. Cek domain di Nginx
echo "1. Domain yang dikonfigurasi di Nginx:"
echo ""
sudo grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "#"

echo ""
echo "=========================================="

# 2. Cek SSL certificate yang ada
echo "2. SSL Certificate yang terinstall:"
echo ""
sudo certbot certificates 2>/dev/null || echo "Tidak ada certificate ditemukan"

echo ""
echo "=========================================="

# 3. Cek IP server
echo "3. IP Address server ini:"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "Tidak dapat detect IP")
echo "Public IP: $SERVER_IP"

echo ""
echo "=========================================="

# 4. List semua domain di /etc/letsencrypt/live
echo "4. Certificate folders di /etc/letsencrypt/live:"
echo ""
if [ -d "/etc/letsencrypt/live" ]; then
    for cert_dir in /etc/letsencrypt/live/*/; do
        DOMAIN=$(basename "$cert_dir")
        if [ "$DOMAIN" != "README" ]; then
            echo "Domain: $DOMAIN"
            if [ -f "$cert_dir/cert.pem" ]; then
                EXPIRY=$(sudo openssl x509 -in "$cert_dir/cert.pem" -noout -enddate | cut -d= -f2)
                echo "  Expiry: $EXPIRY"
                
                # Hitung hari tersisa
                EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
                NOW_EPOCH=$(date +%s)
                if [ ! -z "$EXPIRY_EPOCH" ]; then
                    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
                    if [ $DAYS_LEFT -lt 0 ]; then
                        echo "  Status: ❌ EXPIRED ($DAYS_LEFT hari yang lalu)"
                    elif [ $DAYS_LEFT -lt 30 ]; then
                        echo "  Status: ⚠️  AKAN EXPIRED ($DAYS_LEFT hari lagi)"
                    else
                        echo "  Status: ✅ VALID ($DAYS_LEFT hari lagi)"
                    fi
                fi
            else
                echo "  Status: ❌ Certificate file tidak ditemukan"
            fi
            echo ""
        fi
    done
else
    echo "Folder /etc/letsencrypt/live tidak ditemukan"
fi

echo ""
echo "=========================================="

# 5. Cek DNS untuk setiap domain
echo "5. Cek DNS pointing:"
echo ""
if [ -d "/etc/letsencrypt/live" ]; then
    for cert_dir in /etc/letsencrypt/live/*/; do
        DOMAIN=$(basename "$cert_dir")
        if [ "$DOMAIN" != "README" ]; then
            DOMAIN_IP=$(dig +short $DOMAIN 2>/dev/null | tail -1)
            echo "Domain: $DOMAIN"
            echo "  DNS IP: $DOMAIN_IP"
            if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
                echo "  Status: ✅ Pointing ke server ini"
            else
                echo "  Status: ❌ TIDAK pointing ke server ini"
            fi
            echo ""
        fi
    done
fi

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""
echo "Jika certificate EXPIRED atau TIDAK ADA:"
echo "  → Jalankan: ./install-ssl.sh"
echo ""
echo "Jika certificate VALID tapi SSL tidak aktif:"
echo "  → Cek Nginx config dengan: sudo nginx -t"
echo "  → Cek apakah Nginx menggunakan certificate yang benar"
echo ""
echo "Jika DNS TIDAK POINTING:"
echo "  → Update DNS A record di domain registrar"
echo "  → Tunggu propagasi DNS (bisa 1-24 jam)"
