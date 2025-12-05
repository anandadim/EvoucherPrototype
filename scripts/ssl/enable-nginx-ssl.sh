#!/bin/bash
# Script untuk enable SSL di Nginx config

echo "=========================================="
echo "ENABLE SSL DI NGINX"
echo "=========================================="
echo ""

DOMAIN="voucher.tdn.id"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# Cek apakah certificate ada
if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo "❌ Certificate tidak ditemukan di $CERT_PATH"
    echo "Jalankan dulu: sudo certbot --nginx -d $DOMAIN"
    exit 1
fi

echo "✓ Certificate ditemukan"
echo ""

# Backup existing config
echo "1. Backup existing Nginx config..."
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup selesai"

echo ""
echo "=========================================="

# Create new config
echo "2. Membuat konfigurasi Nginx dengan SSL..."

sudo tee /etc/nginx/sites-available/voucher > /dev/null <<'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name voucher.tdn.id;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main config
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name voucher.tdn.id;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/voucher.tdn.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voucher.tdn.id/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Let's Encrypt webroot for renewal
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    # Logs
    access_log /var/log/nginx/voucher_access.log;
    error_log /var/log/nginx/voucher_error.log;
}
EOF

echo "✓ Config created"

echo ""
echo "=========================================="

# Enable site
echo "3. Enable site..."
sudo ln -sf /etc/nginx/sites-available/voucher /etc/nginx/sites-enabled/voucher

# Remove default if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "Menonaktifkan default site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

echo "✓ Site enabled"

echo ""
echo "=========================================="

# Test config
echo "4. Test Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Config valid"
    echo ""
    echo "5. Reload Nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "❌ Config error! Restore backup..."
    sudo rm /etc/nginx/sites-enabled/voucher
    sudo cp /etc/nginx/sites-enabled/default.backup.* /etc/nginx/sites-enabled/default 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================="

# Test HTTPS
echo "6. Test HTTPS..."
sleep 2
echo ""
echo "Test dari server:"
curl -I https://voucher.tdn.id 2>&1 | head -10

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "✅ SSL sudah diaktifkan!"
echo ""
echo "Test di browser: https://voucher.tdn.id"
echo ""
echo "Jika masih tidak bisa akses:"
echo "  1. Cek firewall: sudo ufw status"
echo "  2. Cek Node.js app: pm2 status atau ps aux | grep node"
echo "  3. Cek log: sudo tail -f /var/log/nginx/voucher_error.log"
