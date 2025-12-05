# Fix DNS Problem - voucher.tdn.id

## Masalah yang Ditemukan

DNS request timeout saat akses dari luar:
```
Server: 202.51.97.7
DNS request timed out
```

Ini berarti domain voucher.tdn.id tidak bisa di-resolve dari internet.

## Penyebab

1. **Nameserver belum dikonfigurasi dengan benar** di domain registrar
2. **DNS A record belum dibuat** atau salah
3. **DNS propagation belum selesai** (jika baru diupdate)

## Solusi

### Step 1: Login ke Domain Registrar

Login ke tempat Anda beli domain (contoh: Niagahoster, Rumahweb, GoDaddy, Namecheap, dll)

### Step 2: Cek Nameserver

Pastikan nameserver sudah dikonfigurasi. Ada 2 opsi:

#### Opsi A: Pakai Nameserver Hosting/Registrar (RECOMMENDED)

Jika domain dan hosting di tempat yang sama, pakai nameserver mereka:

**Contoh Niagahoster:**
```
ns1.niagahoster.com
ns2.niagahoster.com
```

**Contoh Rumahweb:**
```
ns1.rumahweb.com
ns2.rumahweb.com
```

**Contoh Cloudflare (jika pakai):**
```
xxx.ns.cloudflare.com
yyy.ns.cloudflare.com
```

#### Opsi B: Pakai Nameserver Custom

Jika punya DNS server sendiri, pastikan DNS server berfungsi dengan baik.

### Step 3: Setup DNS A Record

Di DNS Management, tambahkan A record:

```
Type: A
Name: voucher (atau @ untuk root domain)
Value: 103.164.223.83
TTL: 3600 (atau Auto)
```

Jika ingin www juga bisa diakses:
```
Type: A
Name: www
Value: 103.164.223.83
TTL: 3600
```

### Step 4: Tunggu DNS Propagation

Setelah update DNS:
- **Minimal**: 5-15 menit
- **Maksimal**: 24-48 jam (jarang)
- **Rata-rata**: 1-2 jam

### Step 5: Test DNS

Dari device luar (bukan server), test dengan:

**Windows:**
```cmd
nslookup voucher.tdn.id 8.8.8.8
```

**Linux/Mac:**
```bash
dig voucher.tdn.id @8.8.8.8
```

Harusnya dapat IP: `103.164.223.83`

## Troubleshooting

### Test DNS dari berbagai DNS server

```bash
# Google DNS
nslookup voucher.tdn.id 8.8.8.8

# Cloudflare DNS
nslookup voucher.tdn.id 1.1.1.1

# OpenDNS
nslookup voucher.tdn.id 208.67.222.222
```

### Cek DNS Propagation Online

Buka website ini untuk cek DNS propagation:
- https://www.whatsmydns.net/#A/voucher.tdn.id
- https://dnschecker.org/#A/voucher.tdn.id

Website ini akan cek DNS dari berbagai lokasi di dunia.

### Jika DNS Sudah Propagate tapi Masih Timeout

Kemungkinan DNS server 202.51.97.7 bermasalah. Solusi:

**Windows:**
1. Buka Control Panel > Network and Internet > Network Connections
2. Klik kanan adapter > Properties
3. Pilih Internet Protocol Version 4 (TCP/IPv4)
4. Pilih "Use the following DNS server addresses"
5. Preferred DNS: `8.8.8.8` (Google)
6. Alternate DNS: `1.1.1.1` (Cloudflare)

**Atau pakai command:**
```cmd
netsh interface ip set dns "Wi-Fi" static 8.8.8.8
netsh interface ip add dns "Wi-Fi" 1.1.1.1 index=2
```

## Sementara Waktu

Sambil menunggu DNS propagation, Anda bisa:

### 1. Akses via IP (tanpa SSL)
```
http://103.164.223.83
```

### 2. Edit File Hosts (untuk testing)

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac:** `/etc/hosts`

Tambahkan baris:
```
103.164.223.83 voucher.tdn.id
```

Setelah edit hosts, Anda bisa akses https://voucher.tdn.id dari device tersebut.

**PENTING:** Hapus baris ini setelah DNS propagation selesai!

## Checklist

- [ ] Login ke domain registrar
- [ ] Cek nameserver sudah benar
- [ ] Tambah/update DNS A record: voucher.tdn.id -> 103.164.223.83
- [ ] Save perubahan
- [ ] Tunggu 15-30 menit
- [ ] Test dengan: `nslookup voucher.tdn.id 8.8.8.8`
- [ ] Cek di https://www.whatsmydns.net/#A/voucher.tdn.id
- [ ] Jika sudah propagate, test: https://voucher.tdn.id

## Kontak Provider

Jika masih bermasalah setelah 24 jam, hubungi support domain registrar Anda dengan info:

```
Domain: voucher.tdn.id
Issue: DNS not resolving
Expected IP: 103.164.223.83
Current Status: DNS timeout
```

Mereka akan bantu cek konfigurasi DNS di sisi mereka.
