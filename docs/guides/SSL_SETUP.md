# Panduan Setup SSL/HTTPS

## Langkah-langkah Aktivasi SSL di Live Server

### 1. Cek Certificate Certbot
Pastikan certificate Let's Encrypt sudah terinstall:
```bash
sudo certbot certificates
```

Catat path certificate Anda, biasanya:
- Private Key: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
- Certificate: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`

### 2. Update File .env di Live Server
Edit file `.env` di live server:
```bash
nano .env
```

Update dengan nilai berikut (ganti `yourdomain.com` dengan domain Anda):
```env
NODE_ENV=production
HTTPS_ENABLED=true
COOKIE_SECURE=true

SSL_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 3. Berikan Permission ke Node.js untuk Akses Certificate
Certificate Let's Encrypt biasanya hanya bisa dibaca oleh root. Ada 2 cara:

#### Cara 1: Jalankan Node.js dengan sudo (TIDAK RECOMMENDED)
```bash
sudo npm start
```

#### Cara 2: Berikan permission ke user Node.js (RECOMMENDED)
```bash
# Buat group untuk certificate
sudo groupadd certaccess

# Tambahkan user Anda ke group
sudo usermod -a -G certaccess $USER

# Set permission folder certificate
sudo chgrp -R certaccess /etc/letsencrypt/live
sudo chgrp -R certaccess /etc/letsencrypt/archive
sudo chmod -R g+rx /etc/letsencrypt/live
sudo chmod -R g+rx /etc/letsencrypt/archive
```

Logout dan login kembali agar group changes berlaku.

#### Cara 3: Gunakan PM2 dengan setcap (PALING AMAN)
```bash
# Install PM2 jika belum
sudo npm install -g pm2

# Berikan capability ke Node.js untuk bind port 443
sudo setcap 'cap_net_bind_service=+ep' $(which node)

# Start dengan PM2
pm2 start server.js --name voucher-app
pm2 save
pm2 startup
```

### 4. Buka Port 443 di Firewall
```bash
# UFW
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Atau iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

### 5. Restart Aplikasi
```bash
# Jika pakai PM2
pm2 restart voucher-app

# Jika manual
sudo node server.js
```

### 6. Test SSL
Buka browser dan akses:
- `https://yourdomain.com` - Harus bisa akses dengan HTTPS
- `http://yourdomain.com` - Harus redirect ke HTTPS

## Troubleshooting

### Error: EACCES permission denied
Certificate tidak bisa dibaca. Gunakan Cara 2 atau 3 di atas.

### Error: EADDRINUSE port 443
Port 443 sudah digunakan. Cek dengan:
```bash
sudo lsof -i :443
sudo netstat -tulpn | grep :443
```

Kill process yang menggunakan port 443 atau gunakan reverse proxy.

### Certificate Expired
Certbot auto-renew biasanya sudah aktif. Cek dengan:
```bash
sudo certbot renew --dry-run
```

### Masih HTTP setelah setup
1. Cek log server: `pm2 logs voucher-app`
2. Pastikan `SSL_ENABLED=true` di .env
3. Pastikan path certificate benar
4. Cek permission file certificate

## Alternative: Gunakan Reverse Proxy (RECOMMENDED)

Jika tidak ingin Node.js handle SSL langsung, gunakan Nginx sebagai reverse proxy:

### Install Nginx
```bash
sudo apt install nginx
```

### Konfigurasi Nginx
```bash
sudo nano /etc/nginx/sites-available/voucher
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/voucher /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Dengan cara ini, Node.js tetap jalan di port 3000 (HTTP), dan Nginx yang handle SSL.

## Rekomendasi

Untuk production, **gunakan Nginx sebagai reverse proxy** karena:
- Lebih aman (Node.js tidak perlu akses root)
- Lebih mudah manage SSL
- Lebih baik untuk performance
- Bisa handle multiple apps di satu server
