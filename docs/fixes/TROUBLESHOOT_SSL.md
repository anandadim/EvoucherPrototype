# Troubleshooting SSL Tidak Aktif

## Kemungkinan Penyebab SSL Tidak Aktif

### 1. Certificate Expired (PALING UMUM)
Let's Encrypt certificate berlaku **90 hari**. Jika auto-renewal gagal, certificate akan expired.

**Cara Cek:**
```bash
# Cek status certificate
sudo certbot certificates

# Cek expiry date
sudo openssl x509 -in /etc/letsencrypt/live/DOMAIN-ANDA/cert.pem -noout -dates
```

**Solusi:**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Atau gunakan script yang sudah disediakan
chmod +x renew-ssl.sh
./renew-ssl.sh
```

### 2. Auto-Renewal Tidak Berjalan
Certbot seharusnya auto-renew setiap 60 hari, tapi kadang gagal.

**Cara Cek:**
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Cek cron job atau systemd timer
sudo systemctl status certbot.timer
# atau
sudo crontab -l | grep certbot
```

**Solusi:**
```bash
# Enable systemd timer untuk auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Atau tambahkan cron job manual
sudo crontab -e
# Tambahkan baris ini:
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 3. Nginx Configuration Salah
Nginx mungkin tidak menggunakan certificate yang benar.

**Cara Cek:**
```bash
# Test nginx config
sudo nginx -t

# Lihat config SSL
sudo cat /etc/nginx/sites-enabled/default | grep ssl
```

**Solusi:**
Pastikan config Nginx seperti ini:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Settings (optional tapi recommended)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
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
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Setelah edit:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Firewall Memblokir Port 443
Port 443 harus terbuka untuk HTTPS.

**Cara Cek:**
```bash
# Cek firewall
sudo ufw status
# atau
sudo iptables -L -n | grep 443
```

**Solusi:**
```bash
# UFW
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw reload

# iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables-save
```

### 5. DNS Tidak Pointing ke Server
Domain harus pointing ke IP server Anda.

**Cara Cek:**
```bash
# Cek DNS
nslookup yourdomain.com
dig yourdomain.com

# Cek IP server
curl ifconfig.me
```

**Solusi:**
Update DNS A record di domain registrar Anda untuk pointing ke IP server.

### 6. Certificate Path Salah
Nginx mungkin mencari certificate di path yang salah.

**Cara Cek:**
```bash
# Cek apakah file certificate ada
ls -la /etc/letsencrypt/live/yourdomain.com/
```

**Solusi:**
Update path di Nginx config sesuai dengan output `sudo certbot certificates`.

## Langkah-langkah Troubleshooting

### Step 1: Jalankan Script Check
```bash
chmod +x check-ssl.sh
./check-ssl.sh
```

Script ini akan cek:
- Certificate yang terinstall
- Expiry date
- Nginx configuration
- Port yang listening
- Auto-renewal status

### Step 2: Identifikasi Masalah
Dari output script di atas, lihat:
- Apakah certificate expired?
- Apakah Nginx config valid?
- Apakah port 443 listening?

### Step 3: Renew Certificate (Jika Expired)
```bash
chmod +x renew-ssl.sh
./renew-ssl.sh
```

### Step 4: Test SSL
```bash
# Test dari server
curl -I https://yourdomain.com

# Test SSL grade
# Buka di browser: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

## Quick Fix Commands

```bash
# 1. Renew certificate
sudo certbot renew --force-renewal

# 2. Restart Nginx
sudo systemctl restart nginx

# 3. Cek status
sudo certbot certificates
sudo systemctl status nginx

# 4. Test HTTPS
curl -I https://yourdomain.com
```

## Jika Masih Gagal

### Reinstall Certificate
```bash
# Hapus certificate lama
sudo certbot delete --cert-name yourdomain.com

# Install certificate baru
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Atau manual
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Cek Log Error
```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Certbot log
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# System log
sudo journalctl -u nginx -f
```

## Prevention: Setup Auto-Renewal

Agar tidak terjadi lagi di masa depan:

```bash
# 1. Enable systemd timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 2. Verify timer aktif
sudo systemctl list-timers | grep certbot

# 3. Test renewal
sudo certbot renew --dry-run
```

## Monitoring Certificate Expiry

Setup monitoring agar dapat notifikasi sebelum certificate expired:

```bash
# Install monitoring script
sudo nano /usr/local/bin/check-cert-expiry.sh
```

Isi dengan:
```bash
#!/bin/bash
DOMAIN="yourdomain.com"
DAYS_BEFORE_EXPIRY=$(sudo openssl x509 -in /etc/letsencrypt/live/$DOMAIN/cert.pem -noout -enddate | cut -d= -f2 | xargs -I{} date -d "{}" +%s)
CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( ($DAYS_BEFORE_EXPIRY - $CURRENT_DATE) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate akan expired dalam $DAYS_LEFT hari!"
    # Kirim email atau notifikasi
fi
```

Tambahkan ke cron:
```bash
sudo crontab -e
# Cek setiap hari jam 9 pagi
0 9 * * * /usr/local/bin/check-cert-expiry.sh
```

## Kontak Support

Jika masih bermasalah setelah semua langkah di atas:
1. Jalankan `./check-ssl.sh` dan simpan outputnya
2. Cek log error di `/var/log/nginx/error.log`
3. Cek log certbot di `/var/log/letsencrypt/letsencrypt.log`
4. Share output tersebut untuk analisa lebih lanjut
