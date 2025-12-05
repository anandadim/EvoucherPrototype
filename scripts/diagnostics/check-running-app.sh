#!/bin/bash
# Script untuk cek aplikasi Node.js yang running

echo "=========================================="
echo "CEK APLIKASI NODE.JS YANG RUNNING"
echo "=========================================="
echo ""

echo "1. Cek process Node.js yang running:"
echo ""
ps aux | grep node | grep -v grep

echo ""
echo "=========================================="

echo "2. Cek port yang digunakan Node.js:"
echo ""
sudo netstat -tulpn | grep node

echo ""
echo "=========================================="

echo "3. Cek PM2 processes (jika pakai PM2):"
echo ""
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "PM2 logs (last 20 lines):"
    pm2 logs --lines 20 --nostream
else
    echo "PM2 tidak terinstall"
fi

echo ""
echo "=========================================="

echo "4. Cek .env file di project:"
echo ""
if [ -f ".env" ]; then
    echo "File .env ditemukan:"
    cat .env | grep PORT
else
    echo ".env tidak ditemukan"
fi

echo ""
echo "=========================================="

echo "5. Cek package.json:"
echo ""
if [ -f "package.json" ]; then
    echo "Scripts di package.json:"
    cat package.json | grep -A 5 '"scripts"'
else
    echo "package.json tidak ditemukan"
fi

echo ""
echo "=========================================="

echo "6. Cek semua port yang listening:"
echo ""
sudo netstat -tulpn | grep LISTEN | grep -E ":(3000|3003|80|443)"

echo ""
echo "=========================================="
echo "KESIMPULAN"
echo "=========================================="
echo ""

NODE_3000=$(sudo netstat -tulpn | grep ":3000" | grep node)
NODE_3003=$(sudo netstat -tulpn | grep ":3003" | grep node)

if [ ! -z "$NODE_3000" ]; then
    echo "✓ Node.js running di port 3000"
    echo "  Nginx config sudah benar"
elif [ ! -z "$NODE_3003" ]; then
    echo "✓ Node.js running di port 3003"
    echo "  ⚠️  Nginx config perlu diupdate ke port 3003"
    echo ""
    echo "  Solusi:"
    echo "  1. Update Nginx: ./fix-nginx-port.sh"
    echo "  2. ATAU restart Node.js ke port 3000"
else
    echo "❌ Node.js tidak running di port 3000 atau 3003"
    echo ""
    echo "  Solusi: Start aplikasi Node.js"
    echo "  pm2 start server.js --name voucher-app"
fi
