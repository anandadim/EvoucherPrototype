// Elements
const phoneInput = document.getElementById('phoneNumber');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const formOverlay = document.getElementById('formOverlay');
const voucherOverlay = document.getElementById('voucherOverlay');
const backgroundImage = document.getElementById('backgroundImage');

let isDownloaded = false;

// Capture UTM parameters on page load
(function captureUTM() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || 'direct';
    
    // Validate UTM source (must match backend validation)
    // Whitelist of valid UTM sources
    // Define UTM source groups
    const pondokKacangSources = [
      'KelPondokKacangRW01RT04',
      'KelPondokKacangRW01RT02',
      'KelPondokKacangRW09RT03',
      'KelPondokKacangRW09RT01',
      'KelPondokKacangRW07RT15',
      'KelPondokKacangRW07RT05',
      'KelPondokKacangRW07RT07',
      'KelPondokKacangRW07RT04',
      'KelPondokKacangRW07RT06'
    ];

    const sukahatiSources = [
      'KelSukahatiRW09RT01',
      'KelSukahatiRW09RT02',
      'KelSukahatiRW09RT03',
      'KelSukahatiRW09RT04',
      'KelSukahatiRW09RT05',
      'KelSukahatiRW09RT06',
      'KelSukahatiRW09RT07',
      'KelSukahatiRW09RT08'
    ];

    const tengahSources = [
      'KelTengahRW07RT06',
      'KelTengahRW08RT01',
      'KelTengahRW08RT02',
      'KelTengahRW08RT03',
      'KelTengahRW08RT04',
      'KelTengahRW08RT05',
      'KelTengahRW08RT06'
    ];

    // Combine all valid sources
    const validUTMSources = [
      'direct',
      ...pondokKacangSources,
      ...sukahatiSources,
      ...tengahSources
    ];
    
    if (!validUTMSources.includes(utmSource)) {
      // Invalid UTM source - show error and disable download
      const errorMessage = document.getElementById('errorMessage');
      const downloadBtn = document.getElementById('downloadBtn');
      
      errorMessage.textContent = 'Link tidak valid. Silakan gunakan link yang diberikan oleh RT/RW atau akses langsung tanpa parameter.';
      errorMessage.style.display = 'block';
      downloadBtn.disabled = true;
      
      console.warn('Invalid UTM source:', utmSource);
      sessionStorage.setItem('utm_source', 'invalid');
      return;
    }
    
    // Swap background image based on UTM source
    if (pondokKacangSources.includes(utmSource)) {
      // Pondok Kacang Homepage
      backgroundImage.src = 'images/homepage-pondokkacang.jpg';
      backgroundImage.alt = 'Promo Khusus Warga Pondok Kacang';
      console.log('Loading Pondok Kacang homepage background');
      
      // Add class for custom form positioning
      const formOverlay = document.getElementById('formOverlay');
      if (formOverlay) {
        formOverlay.classList.add('pondok-kacang-form');
      }
    } else if (sukahatiSources.includes(utmSource) || tengahSources.includes(utmSource)) {
      // Sukahati/Tengah RT/RW Homepage
      backgroundImage.src = 'images/homepage-rt.jpg';
      backgroundImage.alt = 'Promo Khusus Warga RT/RW';
      console.log('Loading RT/RW homepage background');
    } else {
      // Regular Homepage - use regular background
      backgroundImage.src = 'images/homepage-1.jpeg';
      backgroundImage.alt = 'Promo';
      console.log('Loading regular homepage background');
    }
    
    // Store valid UTM in sessionStorage
    sessionStorage.setItem('utm_source', utmSource);
    
    // Track page view
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utm_source: utmSource })
    }).then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Page view tracked:', data.viewId);
        }
      })
      .catch(error => {
        console.error('Error tracking page view:', error);
      });
    
    // Log for debugging (remove in production if needed)
    console.log('UTM Source captured:', utmSource);
  } catch (error) {
    console.error('Error capturing UTM:', error);
    sessionStorage.setItem('utm_source', 'direct');
  }
})();

// Validate phone number
function validatePhoneNumber(phone) {
  const phoneRegex = /^628[0-9]{8,11}$/;
  return phoneRegex.test(phone);
}

// Format phone number for display (628xxx -> 08xx-xxx-xxx)
function formatPhoneDisplay(phone) {
  if (phone.startsWith('628')) {
    const withoutPrefix = '0' + phone.substring(2);
    // Format: 08xx-xxx-xxx
    if (withoutPrefix.length >= 11) {
      return withoutPrefix.substring(0, 4) + '-' + 
             withoutPrefix.substring(4, 8) + '-' + 
             withoutPrefix.substring(9);
    }
    return withoutPrefix;
  }
  return phone;
}

// Format date to Indonesian format
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('id-ID', options);
}

// Phone input validation
phoneInput.addEventListener('input', function(e) {
  let value = e.target.value;
  
  // Remove non-numeric characters
  value = value.replace(/[^0-9]/g, '');
  
  // Ensure it starts with 628
  if (value.length > 0 && !value.startsWith('628')) {
    if (value.startsWith('08')) {
      value = '628' + value.substring(2);
    } else if (value.startsWith('8')) {
      value = '628' + value.substring(1);
    } else if (!value.startsWith('6')) {
      value = '628' + value;
    }
  }
  
  e.target.value = value;
  
  // Validate and enable/disable button
  if (validatePhoneNumber(value)) {
    errorMessage.textContent = '';
    downloadBtn.disabled = false;
  } else {
    if (value.length >= 11) {
      errorMessage.textContent = 'Format nomor tidak valid';
    } else {
      errorMessage.textContent = '';
    }
    downloadBtn.disabled = true;
  }
});

// Check if already downloaded
async function checkDownloadStatus() {
  try {
    const utmSource = sessionStorage.getItem('utm_source') || 'direct';
    
    const response = await fetch('/api/check-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utm_source: utmSource })
    });
    
    const data = await response.json();
    
    if (data.alreadyDownloaded) {
      if (data.blocked) {
        errorMessage.textContent = 'IP address Anda diblokir';
        downloadBtn.disabled = true;
      } else if (data.quotaExceeded) {
        // Different message for RT vs Regular
        const voucherTypeMsg = data.voucherType === 'RT' 
          ? 'Voucher RT sudah mencapai batas kuota' 
          : 'Kuota voucher habis';
        errorMessage.textContent = voucherTypeMsg;
        downloadBtn.disabled = true;
      } else {
        errorMessage.textContent = 'Anda sudah download voucher';
        downloadBtn.disabled = true;
      }
    }
  } catch (error) {
    console.error('Error checking download status:', error);
  }
}

// Download voucher
downloadBtn.addEventListener('click', async function() {
  if (isDownloaded) return;
  
  const phoneNumber = phoneInput.value;
  
  if (!validatePhoneNumber(phoneNumber)) {
    errorMessage.textContent = 'Nomor HP tidak valid';
    return;
  }
  
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Memproses...';
  errorMessage.textContent = '';
  
  try {
    // Get UTM source from sessionStorage
    const utmSource = sessionStorage.getItem('utm_source') || 'direct';
    
    // Record download with UTM tracking
    const response = await fetch('/api/record-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber,
        utm_source: utmSource
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Gagal memproses voucher');
    }
    
    if (data.success) {
      isDownloaded = true;
      
      // Change background based on UTM source (maintain consistency)
      const currentUtmSource = sessionStorage.getItem('utm_source') || 'direct';
      
      // Debug logging
      console.log('=== VOUCHER DOWNLOAD SUCCESS ===');
      console.log('Current UTM Source:', currentUtmSource);
      console.log('Is RT/RW user?', (currentUtmSource !== 'direct'));
      
      // Define groups again for overlay (or move to global scope)
      const pondokKacangSources = [
        'KelPondokKacangRW01RT04', 'KelPondokKacangRW01RT02', 'KelPondokKacangRW09RT03',
        'KelPondokKacangRW09RT01', 'KelPondokKacangRW07RT15', 'KelPondokKacangRW07RT05',
        'KelPondokKacangRW07RT07', 'KelPondokKacangRW07RT04', 'KelPondokKacangRW07RT06'
      ];
      const sukahatiSources = [
        'KelSukahatiRW09RT01', 'KelSukahatiRW09RT02', 'KelSukahatiRW09RT03', 'KelSukahatiRW09RT04',
        'KelSukahatiRW09RT05', 'KelSukahatiRW09RT06', 'KelSukahatiRW09RT07', 'KelSukahatiRW09RT08'
      ];
      const tengahSources = [
        'KelTengahRW07RT06', 'KelTengahRW08RT01', 'KelTengahRW08RT02', 'KelTengahRW08RT03',
        'KelTengahRW08RT04', 'KelTengahRW08RT05', 'KelTengahRW08RT06'
      ];

      if (pondokKacangSources.includes(currentUtmSource)) {
        backgroundImage.src = 'images/homepage-2-pondokkacang.jpg';
        console.log('Loading Pondok Kacang voucher background:', backgroundImage.src);
      } else if (sukahatiSources.includes(currentUtmSource) || tengahSources.includes(currentUtmSource)) {
        backgroundImage.src = 'images/homepage-2-rt.jpg';
        console.log('Loading RT/RW voucher background:', backgroundImage.src);
      } else {
        backgroundImage.src = 'images/homepage-2.png';
        console.log('Loading regular voucher background:', backgroundImage.src);
      }
      
      console.log('Final background image:', backgroundImage.src);
      console.log('================================');
      
      // Hide form and show voucher overlay with phone number only
      formOverlay.style.display = 'none';
      voucherOverlay.style.display = 'block';
      
      // Generate QR Code - HIDDEN (commented out)
      // const qrCodeDiv = document.getElementById('qrCode');
      // qrCodeDiv.innerHTML = ''; // Clear previous QR code
      
      // new QRCode(qrCodeDiv, {
      //   text: data.voucherNumber || data.voucherCode,
      //   width: 150,
      //   height: 150,
      //   colorDark: '#000000',
      //   colorLight: '#ffffff',
      //   correctLevel: QRCode.CorrectLevel.H
      // });
      
      // Display phone number only (hide voucher code and date)
      // document.getElementById('voucherNumber').textContent = data.voucherNumber || 'N/A';
      document.getElementById('voucherPhone').textContent = formatPhoneDisplay(phoneNumber);
      // document.getElementById('voucherDate').textContent = formatDate(new Date());
      
      // Download voucher image
      setTimeout(() => {
        generateAndDownloadVoucher(data.downloadId);
      }, 500);
      
    } else {
      throw new Error('Gagal memproses voucher');
    }
    
  } catch (error) {
    errorMessage.textContent = error.message;
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download E-Voucher';
  }
});

// Generate and download voucher image
async function generateAndDownloadVoucher(downloadId) {
  try {
    const response = await fetch(`/api/generate-voucher/${downloadId}`);
    
    if (!response.ok) {
      throw new Error('Gagal generate voucher');
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `voucher-${downloadId}.png`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Error downloading voucher:', error);
  }
}

// Check download status on page load
checkDownloadStatus();
