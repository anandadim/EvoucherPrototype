#!/bin/bash
# Script untuk cek status SSL certificate

echo "=========================================="
echo "CEK STATUS SSL CERTIFICATE"
echo "=========================================="
echo ""

# 1. Cek certificate yang terinstall
echo "1. Certificate yang terinstall:"
sudo certbot certificates

echo ""
echo "=========================================="

# 2. List semua certificate di /etc/letsencrypt/live
echo "2. List semua certificate folder:"
if [ -d "/etc/letsencrypt/live" ]; then
    sudo ls -la /etc/letsencrypt/live/
    echo ""
    
    # Cek expiry date untuk setiap certificate
    echo "Expiry date untuk setiap certificate:"
    for cert_dir in /etc/letsencrypt/live/*/; do
        if [ -f "$cert_dir/cert.pem" ]; then
            DOMAIN=$(basename "$cert_dir")
            echo ""
            echo "Domain: $DOMAIN"
            sudo openssl x509 -in "$cert_dir/cert.pem" -noout -dates -subject
        fi
    done
else
    echo "Folder /etc/letsencrypt/live tidak ditemukan"
fi

echo ""
echo "=========================================="

# 3. Cek Nginx configuration
echo "3. Cek Nginx SSL configuration:"
sudo nginx -t
echo ""
echo "Nginx sites enabled:"
sudo ls -la /etc/nginx/sites-enabled/

echo ""
echo "=========================================="

# 4. Cek SSL config di Nginx
echo "4. SSL certificate path di Nginx config:"
sudo grep -r "ssl_certificate" /etc/nginx/sites-enabled/ 2>/dev/null || echo "Tidak ada SSL config ditemukan"

echo ""
echo "=========================================="

# 5. Cek port yang listening
echo "5. Port yang listening:"
sudo netstat -tulpn | grep -E ':(80|443)' 2>/dev/null || sudo ss -tulpn | grep -E ':(80|443)'

echo ""
echo "=========================================="

# 6. Test auto-renewal
echo "6. Test auto-renewal (dry-run):"
echo "Ini akan memakan waktu beberapa detik..."
sudo certbot renew --dry-run 2>&1 | tail -20

echo ""
echo "=========================================="

# 7. Cek systemd timer
echo "7. Cek certbot auto-renewal timer:"
sudo systemctl status certbot.timer 2>/dev/null || echo "Certbot timer tidak aktif"

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "CATATAN:"
echo "- Jika certificate expired, jalankan: ./renew-ssl.sh"
echo "- Jika tidak ada certificate, install dengan: sudo certbot --nginx"
