#!/bin/bash
# Script untuk install SSL certificate baru

echo "=========================================="
echo "INSTALL SSL CERTIFICATE"
echo "=========================================="
echo ""

# Minta input domain
read -p "Masukkan domain Anda (contoh: voucher.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Error: Domain tidak boleh kosong!"
    exit 1
fi

echo ""
echo "Domain yang akan diinstall: $DOMAIN"
echo ""

# Konfirmasi
read -p "Apakah sudah benar? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Dibatalkan."
    exit 0
fi

echo ""
echo "=========================================="

# Cek apakah Nginx sudah terinstall
echo "1. Cek Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "Nginx belum terinstall. Install dulu dengan:"
    echo "sudo apt update && sudo apt install nginx -y"
    exit 1
fi

echo "✓ Nginx terinstall"
echo ""

# Cek apakah Certbot sudah terinstall
echo "2. Cek Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot belum terinstall. Install dulu dengan:"
    echo "sudo apt update && sudo apt install certbot python3-certbot-nginx -y"
    exit 1
fi

echo "✓ Certbot terinstall"
echo ""

# Cek DNS pointing
echo "3. Cek DNS pointing..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -1)
SERVER_IP=$(curl -s ifconfig.me)

echo "Domain IP: $DOMAIN_IP"
echo "Server IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo ""
    echo "⚠️  WARNING: Domain belum pointing ke server ini!"
    echo "   Update DNS A record di domain registrar Anda:"
    echo "   $DOMAIN -> $SERVER_IP"
    echo ""
    read -p "Lanjutkan install? (y/n): " continue_install
    if [ "$continue_install" != "y" ]; then
        echo "Dibatalkan. Update DNS dulu, lalu jalankan script ini lagi."
        exit 0
    fi
fi

echo ""
echo "=========================================="

# Install certificate
echo "4. Install SSL certificate..."
echo ""

# Pilih metode
echo "Pilih metode install:"
echo "1. Automatic (Certbot akan auto-config Nginx) - RECOMMENDED"
echo "2. Manual (Certbot hanya generate certificate)"
read -p "Pilih (1/2): " method

if [ "$method" = "1" ]; then
    echo ""
    echo "Installing dengan automatic mode..."
    sudo certbot --nginx -d $DOMAIN
elif [ "$method" = "2" ]; then
    echo ""
    echo "Installing dengan manual mode..."
    echo "Nginx akan di-stop sementara..."
    sudo systemctl stop nginx
    sudo certbot certonly --standalone -d $DOMAIN
    sudo systemctl start nginx
else
    echo "Pilihan tidak valid!"
    exit 1
fi

echo ""
echo "=========================================="

# Verify installation
echo "5. Verify installation..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✓ Certificate berhasil diinstall!"
    echo ""
    sudo openssl x509 -in /etc/letsencrypt/live/$DOMAIN/cert.pem -noout -dates
else
    echo "✗ Certificate gagal diinstall!"
    exit 1
fi

echo ""
echo "=========================================="

# Setup auto-renewal
echo "6. Setup auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
echo "✓ Auto-renewal aktif"

echo ""
echo "=========================================="

# Test Nginx config
echo "7. Test Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx config valid"
    echo ""
    echo "Reload Nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx config error!"
    echo "Perbaiki config di /etc/nginx/sites-enabled/"
fi

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "Test SSL di browser: https://$DOMAIN"
echo ""
echo "Atau test dengan command:"
echo "curl -I https://$DOMAIN"
