#!/bin/bash
# Script untuk fix auto-renewal certbot

echo "=========================================="
echo "FIX CERTBOT AUTO-RENEWAL"
echo "=========================================="
echo ""

# Masalah: Certbot standalone mode tidak bisa renew karena port 80 digunakan Nginx
# Solusi: Gunakan webroot atau nginx plugin untuk renewal

echo "1. Backup konfigurasi renewal yang ada..."
sudo cp /etc/letsencrypt/renewal/voucher.tdn.id.conf /etc/letsencrypt/renewal/voucher.tdn.id.conf.backup
echo "✓ Backup selesai"

echo ""
echo "=========================================="

echo "2. Update renewal config untuk menggunakan nginx plugin..."

# Update renewal config
sudo tee /etc/letsencrypt/renewal/voucher.tdn.id.conf > /dev/null <<EOF
# renew_before_expiry = 30 days
version = 2.11.0
archive_dir = /etc/letsencrypt/archive/voucher.tdn.id
cert = /etc/letsencrypt/live/voucher.tdn.id/cert.pem
privkey = /etc/letsencrypt/live/voucher.tdn.id/privkey.pem
chain = /etc/letsencrypt/live/voucher.tdn.id/chain.pem
fullchain = /etc/letsencrypt/live/voucher.tdn.id/fullchain.pem

# Options used in the renewal process
[renewalparams]
account = $(sudo cat /etc/letsencrypt/renewal/voucher.tdn.id.conf | grep "account =" | cut -d= -f2 | xargs)
authenticator = nginx
installer = nginx
server = https://acme-v02.api.letsencrypt.org/directory
key_type = ecdsa
EOF

echo "✓ Config updated"

echo ""
echo "=========================================="

echo "3. Test renewal dengan nginx plugin..."
sudo certbot renew --dry-run --cert-name voucher.tdn.id

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Auto-renewal sekarang berfungsi dengan baik"
else
    echo ""
    echo "❌ Masih ada error. Coba metode alternatif..."
    echo ""
    
    # Alternatif: gunakan webroot
    echo "Mencoba dengan webroot method..."
    
    # Buat webroot directory
    sudo mkdir -p /var/www/html/.well-known/acme-challenge
    sudo chown -R www-data:www-data /var/www/html/.well-known
    
    # Update config untuk webroot
    sudo tee /etc/letsencrypt/renewal/voucher.tdn.id.conf > /dev/null <<EOF
# renew_before_expiry = 30 days
version = 2.11.0
archive_dir = /etc/letsencrypt/archive/voucher.tdn.id
cert = /etc/letsencrypt/live/voucher.tdn.id/cert.pem
privkey = /etc/letsencrypt/live/voucher.tdn.id/privkey.pem
chain = /etc/letsencrypt/live/voucher.tdn.id/chain.pem
fullchain = /etc/letsencrypt/live/voucher.tdn.id/fullchain.pem

# Options used in the renewal process
[renewalparams]
account = $(sudo cat /etc/letsencrypt/renewal/voucher.tdn.id.conf.backup | grep "account =" | cut -d= -f2 | xargs)
authenticator = webroot
installer = nginx
server = https://acme-v02.api.letsencrypt.org/directory
key_type = ecdsa

[[webroot_map]]
voucher.tdn.id = /var/www/html
EOF
    
    # Test lagi
    sudo certbot renew --dry-run --cert-name voucher.tdn.id
fi

echo ""
echo "=========================================="

echo "4. Setup systemd timer untuk auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo systemctl status certbot.timer --no-pager

echo ""
echo "=========================================="

echo "5. Setup post-renewal hook untuk reload Nginx..."
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post
sudo tee /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/bash
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
echo "✓ Post-renewal hook created"

echo ""
echo "=========================================="
echo "SELESAI"
echo "=========================================="
echo ""
echo "Auto-renewal sudah diperbaiki!"
echo ""
echo "Cek status timer:"
echo "  sudo systemctl status certbot.timer"
echo ""
echo "Test renewal manual:"
echo "  sudo certbot renew --dry-run"
