#!/bin/bash
# Script untuk renew SSL certificate Let's Encrypt

echo "=========================================="
echo "RENEW SSL CERTIFICATE"
echo "=========================================="
echo ""

# 1. Stop services yang menggunakan port 80/443 (jika perlu)
echo "1. Checking services on port 80/443..."
sudo netstat -tulpn | grep -E ':(80|443)'

echo ""
read -p "Apakah perlu stop Nginx? (y/n): " stop_nginx

if [ "$stop_nginx" = "y" ]; then
    echo "Stopping Nginx..."
    sudo systemctl stop nginx
fi

echo ""
echo "=========================================="

# 2. Renew certificate
echo "2. Renewing certificate..."
sudo certbot renew --force-renewal

echo ""
echo "=========================================="

# 3. Restart Nginx
echo "3. Restarting Nginx..."
sudo systemctl start nginx
sudo systemctl status nginx

echo ""
echo "=========================================="

# 4. Verify certificate
echo "4. Verifying new certificate..."
sudo certbot certificates

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "Test SSL di browser: https://$(hostname -f)"
