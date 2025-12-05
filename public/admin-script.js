let deleteId = null;

// ============================================
// REUSABLE PAGINATION COMPONENT
// ============================================

class Pagination {
  constructor(containerId, rowsPerPage = 10) {
    this.containerId = containerId;
    this.rowsPerPage = rowsPerPage;
    this.currentPage = 1;
    this.allData = [];
    this.renderCallback = null;
  }

  setData(data, renderCallback) {
    this.allData = data;
    this.renderCallback = renderCallback;
    this.currentPage = 1;
    this.render();
  }

  render() {
    if (!this.renderCallback) return;

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const pageData = this.allData.slice(startIndex, endIndex);

    // Render table data
    this.renderCallback(pageData, startIndex);

    // Render pagination controls
    this.renderControls();
  }

  renderControls() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const totalPages = Math.ceil(this.allData.length / this.rowsPerPage);
    const startRecord = this.allData.length === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
    const endRecord = Math.min(this.currentPage * this.rowsPerPage, this.allData.length);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <div style="color: #666; font-size: 14px;">
          ${startRecord}-${endRecord} of ${this.allData.length} | Page ${this.currentPage} of ${totalPages}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-page" data-action="first" ${this.currentPage === 1 ? 'disabled' : ''}>First</button>
          <button class="btn-page" data-action="prev" ${this.currentPage === 1 ? 'disabled' : ''}>◀</button>
          <div style="display: flex; gap: 5px;">
            ${this.renderPageNumbers(totalPages)}
          </div>
          <button class="btn-page" data-action="next" ${this.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>▶</button>
          <button class="btn-page" data-action="last" ${this.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>Last</button>
          <div style="display: flex; gap: 5px; align-items: center; margin-left: 10px;">
            <input type="number" class="page-input" min="1" max="${totalPages}" value="${this.currentPage}" style="width: 50px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
            <button class="btn-page" data-action="go">Go</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachEventListeners(totalPages);
  }

  renderPageNumbers(totalPages) {
    let html = '';
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        html += this.createPageButton(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          html += this.createPageButton(i);
        }
        html += '<span style="padding: 6px;">...</span>';
        html += this.createPageButton(totalPages);
      } else if (this.currentPage >= totalPages - 2) {
        html += this.createPageButton(1);
        html += '<span style="padding: 6px;">...</span>';
        for (let i = totalPages - 3; i <= totalPages; i++) {
          html += this.createPageButton(i);
        }
      } else {
        html += this.createPageButton(1);
        html += '<span style="padding: 6px;">...</span>';
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          html += this.createPageButton(i);
        }
        html += '<span style="padding: 6px;">...</span>';
        html += this.createPageButton(totalPages);
      }
    }
    
    return html;
  }

  createPageButton(pageNum) {
    const isActive = pageNum === this.currentPage;
    return `<button 
      class="btn-page-num" 
      data-page="${pageNum}"
      style="padding: 6px 10px; border: 1px solid ${isActive ? '#667eea' : '#ddd'}; background: ${isActive ? '#667eea' : 'white'}; color: ${isActive ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: ${isActive ? '600' : 'normal'};"
    >${pageNum}</button>`;
  }

  attachEventListeners(totalPages) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Button actions
    container.querySelectorAll('.btn-page').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        
        switch(action) {
          case 'first':
            this.goToPage(1);
            break;
          case 'prev':
            this.goToPage(this.currentPage - 1);
            break;
          case 'next':
            this.goToPage(this.currentPage + 1);
            break;
          case 'last':
            this.goToPage(totalPages);
            break;
          case 'go':
            const input = container.querySelector('.page-input');
            const page = parseInt(input.value);
            this.goToPage(page);
            break;
        }
      });
    });

    // Page number buttons
    container.querySelectorAll('.btn-page-num').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      });
    });

    // Enter key on input
    const input = container.querySelector('.page-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const page = parseInt(e.target.value);
          this.goToPage(page);
        }
      });
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.allData.length / this.rowsPerPage);
    if (page < 1 || page > totalPages || isNaN(page)) return;
    
    this.currentPage = page;
    this.render();
  }
}

// ============================================
// END REUSABLE PAGINATION COMPONENT
// ============================================

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/admin/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = 'admin-login.html';
      return null;
    }

    document.getElementById('adminName').textContent = data.admin.name;
    return data; // Return full data object including admin info
  } catch (error) {
    window.location.href = 'admin-login.html';
    return null;
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (!confirm('Apakah Anda yakin ingin logout?')) {
    return;
  }

  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = 'admin-login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Load activity logs
async function loadLogs() {
  try {
    const response = await fetch('/api/admin/logs');
    const data = await response.json();

    // Setup pagination for logs
    logsPagination.setData(data.logs, renderLogsTable);
  } catch (error) {
    console.error('Error loading logs:', error);
    document.getElementById('logsTableBody').innerHTML = 
      '<tr><td colspan="5" class="empty-state">Error loading logs</td></tr>';
  }
}

// Render logs table with current page data
function renderLogsTable(pageData, startIndex) {
  const tbody = document.getElementById('logsTableBody');
  
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada log aktivitas</td></tr>';
    return;
  }

  tbody.innerHTML = pageData.map((log) => `
    <tr>
      <td>${new Date(log.timestamp).toLocaleString('id-ID')}</td>
      <td>${log.name} (${log.email})</td>
      <td><strong>${log.action}</strong></td>
      <td>${log.details || '-'}</td>
      <td>${log.ip_address}</td>
    </tr>
  `).join('');
}

// Pagination instances
const downloadsPagination = new Pagination('downloadsPaginationControls', 10);
const logsPagination = new Pagination('logsPaginationControls', 10);
const batchHistoryPagination = new Pagination('batchHistoryPaginationControls', 10);

// Load statistics and data
async function loadData() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();

    // Update statistics
    const { settings, downloads } = data;
    document.getElementById('totalQuota').textContent = settings.total_quota;
    document.getElementById('usedQuota').textContent = settings.used_quota;
    document.getElementById('remainingQuota').textContent = settings.total_quota - settings.used_quota;
    
    const percentage = Math.round((settings.used_quota / settings.total_quota) * 100);
    document.getElementById('percentageUsed').textContent = percentage + '%';
    document.getElementById('quotaInput').value = settings.total_quota;
    document.getElementById('allowRedownloadCheckbox').checked = settings.allow_redownload === 1;

    // Setup pagination for downloads
    downloadsPagination.setData(downloads, renderDownloadsTable);

  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('tableBody').innerHTML = 
      '<tr><td colspan="8" class="loading">Error loading data</td></tr>';
  }
}

// Render downloads table with current page data
function renderDownloadsTable(pageData, startIndex) {
  const tbody = document.getElementById('tableBody');
  
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Belum ada data download</td></tr>';
    return;
  }

  tbody.innerHTML = pageData.map((row, index) => {
    // Calculate global row number
    const globalRowNumber = startIndex + index + 1;
    
    // Format UTM source with badge
    const utmBadge = row.utm_source === 'direct' 
      ? '<span style="background: #9e9e9e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Direct</span>'
      : `<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${row.utm_source || 'direct'}</span>`;
    
    return `
      <tr>
        <td>${globalRowNumber}</td>
        <td>${row.phone_number}</td>
        <td><span class="voucher-code">${row.voucher_number || 'N/A'}</span></td>
        <td>${utmBadge}</td>
        <td>${row.ip_address}</td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.user_agent || '-'}">${row.user_agent || '-'}</td>
        <td>${new Date(row.download_time).toLocaleString('id-ID')}</td>
        <td class="action-column">
          <button class="btn-delete" onclick="confirmDelete(${row.id})">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}



// Update quota
document.getElementById('updateQuotaBtn').addEventListener('click', async () => {
  const quota = parseInt(document.getElementById('quotaInput').value);
  
  if (quota < 1 || quota > 100) {
    alert('Kuota harus antara 1 dan 100');
    return;
  }

  try {
    const response = await fetch('/api/admin/update-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quota })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Kuota berhasil diupdate!');
      loadData();
    } else {
      alert(data.error || 'Gagal update kuota');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Toggle allow redownload
document.getElementById('allowRedownloadCheckbox').addEventListener('change', async (e) => {
  const allow = e.target.checked;
  
  if (allow) {
    if (!confirm('⚠️ PERINGATAN: Fitur ini akan mengizinkan user download berulang kali!\n\nIni adalah fitur development untuk testing.\nPastikan untuk MENONAKTIFKAN sebelum deploy ke production.\n\nLanjutkan?')) {
      e.target.checked = false;
      return;
    }
  }

  try {
    const response = await fetch('/api/admin/toggle-redownload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allow })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert(allow ? '✓ Download berulang DIAKTIFKAN' : '✓ Download berulang DINONAKTIFKAN');
      loadData();
      loadLogs();
    } else {
      alert(data.error || 'Gagal update setting');
      e.target.checked = !allow;
    }
  } catch (error) {
    alert('Error: ' + error.message);
    e.target.checked = !allow;
  }
});

// Reset quota
document.getElementById('resetQuotaBtn').addEventListener('click', async () => {
  if (!confirm('Apakah Anda yakin ingin mereset kuota terpakai menjadi 0?')) {
    return;
  }

  try {
    const response = await fetch('/api/admin/reset-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Kuota terpakai berhasil direset!');
      loadData();
    } else {
      alert(data.error || 'Gagal reset kuota');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Export to CSV
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  window.location.href = '/api/admin/export-csv';
});

// Export downloads CSV (duplicate button in table section)
document.getElementById('exportDownloadsBtn').addEventListener('click', () => {
  window.location.href = '/api/admin/export-csv';
});

// Refresh data
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadData();
  loadLogs();
  loadBlockedIps();
});

// Confirm delete
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('deleteModal').classList.add('show');
}

// Delete record
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteId) return;

  try {
    const response = await fetch(`/api/delete/${deleteId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Data berhasil dihapus!');
      document.getElementById('deleteModal').classList.remove('show');
      deleteId = null;
      loadData();
    } else {
      alert(data.error || 'Gagal menghapus data');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Cancel delete
document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  document.getElementById('deleteModal').classList.remove('show');
  deleteId = null;
});

// Close modal on outside click
document.getElementById('deleteModal').addEventListener('click', (e) => {
  if (e.target.id === 'deleteModal') {
    document.getElementById('deleteModal').classList.remove('show');
    deleteId = null;
  }
});

// Load blocked IPs
async function loadBlockedIps() {
  try {
    const response = await fetch('/api/admin/blocked-ips');
    const data = await response.json();

    const tbody = document.getElementById('blockedIpsTableBody');

    if (data.blockedIps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada IP yang diblokir</td></tr>';
      return;
    }

    tbody.innerHTML = data.blockedIps
      .map(
        (ip) => `
      <tr>
        <td><strong>${ip.ip_address}</strong></td>
        <td>${ip.reason || '-'}</td>
        <td>${ip.blocked_by_name}</td>
        <td>${new Date(ip.blocked_at).toLocaleString('id-ID')}</td>
        <td>
          ${
            ip.is_active
              ? '<span style="color: #f44336; font-weight: 600;">🔴 Diblokir</span>'
              : '<span style="color: #4caf50; font-weight: 600;">🟢 Aktif</span>'
          }
        </td>
        <td>
          ${
            ip.is_active
              ? `<button class="btn-delete" style="background: #4caf50;" onclick="unblockIp('${ip.ip_address}')">Unblock</button>`
              : `<button class="btn-delete" style="background: #ff9800;" onclick="blockIpAgain('${ip.ip_address}')">Block Lagi</button>`
          }
          <button class="btn-delete" onclick="confirmDeleteBlockedIp(${ip.id})">Hapus</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading blocked IPs:', error);
  }
}

// Block IP
document.getElementById('blockIpBtn').addEventListener('click', async () => {
  const ipAddress = document.getElementById('ipAddressInput').value.trim();
  const reason = document.getElementById('blockReasonInput').value.trim();

  if (!ipAddress) {
    alert('IP address harus diisi');
    return;
  }

  // Simple IP validation
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(ipAddress)) {
    alert('Format IP address tidak valid');
    return;
  }

  try {
    const response = await fetch('/api/admin/block-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress, reason }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('IP address berhasil diblokir!');
      document.getElementById('ipAddressInput').value = '';
      document.getElementById('blockReasonInput').value = '';
      loadBlockedIps();
      loadLogs();
    } else {
      alert(data.error || 'Gagal memblokir IP');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// Unblock IP
async function unblockIp(ipAddress) {
  if (!confirm(`Apakah Anda yakin ingin unblock IP: ${ipAddress}?`)) {
    return;
  }

  try {
    const response = await fetch('/api/admin/unblock-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('IP address berhasil di-unblock!');
      loadBlockedIps();
      loadLogs();
    } else {
      alert(data.error || 'Gagal unblock IP');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Block IP again
async function blockIpAgain(ipAddress) {
  try {
    const response = await fetch('/api/admin/block-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress, reason: 'Blocked again' }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('IP address berhasil diblokir kembali!');
      loadBlockedIps();
      loadLogs();
    } else {
      alert(data.error || 'Gagal memblokir IP');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Delete blocked IP modal
let deleteBlockedIpId = null;

function confirmDeleteBlockedIp(id) {
  deleteBlockedIpId = id;
  document.getElementById('deleteBlockedIpModal').classList.add('show');
}

document.getElementById('confirmDeleteBlockedIpBtn').addEventListener('click', async () => {
  if (!deleteBlockedIpId) return;

  try {
    const response = await fetch(`/api/admin/blocked-ip/${deleteBlockedIpId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (response.ok) {
      alert('Record berhasil dihapus!');
      document.getElementById('deleteBlockedIpModal').classList.remove('show');
      deleteBlockedIpId = null;
      loadBlockedIps();
      loadLogs();
    } else {
      alert(data.error || 'Gagal menghapus record');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('cancelDeleteBlockedIpBtn').addEventListener('click', () => {
  document.getElementById('deleteBlockedIpModal').classList.remove('show');
  deleteBlockedIpId = null;
});

document.getElementById('deleteBlockedIpModal').addEventListener('click', (e) => {
  if (e.target.id === 'deleteBlockedIpModal') {
    document.getElementById('deleteBlockedIpModal').classList.remove('show');
    deleteBlockedIpId = null;
  }
});

// Load voucher SRP statistics (detailed - RT vs Regular)
async function loadVoucherStats() {
  try {
    const response = await fetch('/api/admin/voucher-stats-detailed');
    const data = await response.json();

    // Regular vouchers
    document.getElementById('voucherTotalRegular').textContent = data.regular.total;
    document.getElementById('voucherAvailableRegular').textContent = data.regular.available;
    document.getElementById('voucherUsedRegular').textContent = data.regular.used;

    // RT vouchers
    document.getElementById('voucherTotalRT').textContent = data.rt.total;
    document.getElementById('voucherAvailableRT').textContent = data.rt.available;
    document.getElementById('voucherUsedRT').textContent = data.rt.used;

    // Show warning if RT vouchers < 100
    const rtWarning = document.getElementById('rtVoucherWarning');
    if (data.rt.available < 100 && data.rt.available > 0) {
      rtWarning.style.display = 'block';
      rtWarning.style.background = '#ff9800';
      rtWarning.style.color = 'white';
      rtWarning.textContent = `⚠️ Peringatan: Voucher RT tersisa ${data.rt.available}. Segera upload voucher baru!`;
    } else if (data.rt.available === 0) {
      rtWarning.style.display = 'block';
      rtWarning.style.background = '#f44336';
      rtWarning.style.color = 'white';
      rtWarning.textContent = '🚨 URGENT: Voucher RT sudah habis! Upload voucher baru sekarang.';
    } else {
      rtWarning.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading voucher stats:', error);
  }
}

// Load voucher list with pagination
let currentVoucherPage = 1;

async function loadVoucherList(page = 1) {
  try {
    const response = await fetch(`/api/admin/vouchers?page=${page}`);
    const data = await response.json();

    const tbody = document.getElementById('voucherListTableBody');
    tbody.innerHTML = '';

    if (data.vouchers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Tidak ada data voucher</td></tr>';
      return;
    }

    data.vouchers.forEach((voucher) => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(voucher.created_at);
      const formattedDate = date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Status badge
      const statusBadge = voucher.is_used === 1
        ? '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Terpakai</span>'
        : '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Tersedia</span>';

      row.innerHTML = `
        <td>${voucher.voucher_number}</td>
        <td>${voucher.store}</td>
        <td>${formattedDate}</td>
        <td>${statusBadge}</td>
      `;
      tbody.appendChild(row);
    });

    // Update pagination info
    const start = (page - 1) * data.pagination.limit + 1;
    const end = Math.min(page * data.pagination.limit, data.pagination.total);
    document.getElementById('voucherPaginationInfo').textContent = 
      `Showing ${start}-${end} of ${data.pagination.total} vouchers`;

    // Update pagination controls
    renderVoucherPagination(data.pagination);
    currentVoucherPage = page;
  } catch (error) {
    console.error('Error loading voucher list:', error);
    document.getElementById('voucherListTableBody').innerHTML = 
      '<tr><td colspan="4" style="text-align: center; color: #f44336;">Error loading data</td></tr>';
  }
}

function renderVoucherPagination(pagination) {
  const controls = document.getElementById('voucherPaginationControls');
  controls.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.className = 'btn btn-secondary';
  prevBtn.style.padding = '8px 16px';
  prevBtn.style.fontSize = '14px';
  prevBtn.disabled = pagination.page === 1;
  prevBtn.onclick = () => loadVoucherList(pagination.page - 1);
  controls.appendChild(prevBtn);

  // Page numbers
  const maxPages = 5;
  let startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
  let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === pagination.page ? 'btn btn-primary' : 'btn btn-secondary';
    pageBtn.style.padding = '8px 16px';
    pageBtn.style.fontSize = '14px';
    pageBtn.onclick = () => loadVoucherList(i);
    controls.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.className = 'btn btn-secondary';
  nextBtn.style.padding = '8px 16px';
  nextBtn.style.fontSize = '14px';
  nextBtn.disabled = pagination.page === pagination.totalPages;
  nextBtn.onclick = () => loadVoucherList(pagination.page + 1);
  controls.appendChild(nextBtn);
}

// CSV file input handler
document.getElementById('csvFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  document.getElementById('uploadCsvBtn').disabled = !file;
});

// Upload CSV
document.getElementById('uploadCsvBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('csvFileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Pilih file CSV terlebih dahulu');
    return;
  }

  const formData = new FormData();
  formData.append('csvFile', file);

  const uploadBtn = document.getElementById('uploadCsvBtn');
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  try {
    const response = await fetch('/api/admin/upload-csv', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      alert(
        `✓ Import berhasil!\n\n` +
          `Imported: ${data.imported}\n` +
          `Skipped (duplicate): ${data.skipped}\n` +
          `Errors: ${data.errors}\n` +
          `Total: ${data.total}`
      );
      fileInput.value = '';
      loadVoucherStats();
      loadVoucherList(1);
      loadLogs();
    } else {
      alert('Error: ' + (data.error || 'Failed to import CSV'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
      </svg>
      Upload & Import CSV
    `;
  }
});

// ============================================
// BULK VOUCHER IMAGE GENERATION
// ============================================

// Enable/disable generate button based on file selection
document.getElementById('bulkCsvFileInput').addEventListener('change', (e) => {
  const generateBtn = document.getElementById('generateBulkBtn');
  generateBtn.disabled = !e.target.files.length;
});

// Generate bulk voucher images
document.getElementById('generateBulkBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('bulkCsvFileInput');
  const templateSelect = document.getElementById('templateSelect');
  const generateBtn = document.getElementById('generateBulkBtn');
  const progressDiv = document.getElementById('bulkProgress');
  const progressBar = document.getElementById('bulkProgressBar');
  const progressText = document.getElementById('bulkProgressText');

  if (!fileInput.files.length) {
    alert('Pilih file CSV terlebih dahulu');
    return;
  }

  const file = fileInput.files[0];
  const selectedTemplate = templateSelect.value;
  
  const formData = new FormData();
  formData.append('csvFile', file);
  formData.append('template', selectedTemplate);

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Processing...';
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    // Simulate progress (since we don't have real-time progress)
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 10;
        progressBar.style.width = progress + '%';
        progressText.textContent = progress + '%';
      }
    }, 500);

    const response = await fetch('/api/admin/generate-voucher-batch', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressText.textContent = '100%';

    // Check if unauthorized (session expired)
    if (response.status === 401) {
      alert('Session expired. Silakan login kembali.');
      window.location.href = 'admin-login.html';
      return;
    }

    const data = await response.json();

    if (response.ok) {
      setTimeout(() => {
        alert(`✓ Berhasil generate ${data.successCount} voucher images!\n\nTotal: ${data.totalRows}\nBerhasil: ${data.successCount}\nError: ${data.errorCount}\n\nBatch ID: ${data.batchId}`);
        
        // Reset form
        fileInput.value = '';
        generateBtn.disabled = true;
        progressDiv.style.display = 'none';
        
        // Reload batch history with delay to ensure server is ready
        setTimeout(() => {
          loadBatchHistory().catch(err => {
            console.error('Error reloading batch history:', err);
          });
        }, 1000);
      }, 500);
    } else {
      alert('Error: ' + (data.error || 'Failed to generate vouchers'));
      progressDiv.style.display = 'none';
    }
  } catch (error) {
    alert('Error: ' + error.message);
    progressDiv.style.display = 'none';
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="display: inline-block; vertical-align: middle;">
        <path d="M13 7H7v6h6V7z"/>
        <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd"/>
      </svg>
      Generate Images
    `;
  }
});

// Store user role globally for batch history rendering
let currentUserRole = 'admin';

// Load batch history
async function loadBatchHistory() {
  try {
    // Get user role
    const authResponse = await fetch('/api/admin/check-auth');
    
    // Check if unauthorized
    if (authResponse.status === 401) {
      console.warn('Session expired during loadBatchHistory');
      return; // Don't redirect, just skip loading
    }
    
    const authData = await authResponse.json();
    currentUserRole = authData.admin?.role || 'admin';
    
    const response = await fetch('/api/admin/voucher-batches');
    
    // Check if unauthorized
    if (response.status === 401) {
      console.warn('Session expired during fetch voucher-batches');
      return; // Don't redirect, just skip loading
    }
    
    const data = await response.json();

    // Setup pagination for batch history
    if (data.batches && data.batches.length > 0) {
      batchHistoryPagination.setData(data.batches, renderBatchHistoryTable);
    } else {
      document.getElementById('batchHistoryTableBody').innerHTML = 
        '<tr><td colspan="7" style="text-align: center; color: #999;">Belum ada batch</td></tr>';
    }
  } catch (error) {
    console.error('Error in loadBatchHistory:', error);
    document.getElementById('batchHistoryTableBody').innerHTML = 
      '<tr><td colspan="7" style="text-align: center; color: #f44336;">Error loading batches</td></tr>';
  }
}

// Render batch history table with current page data
function renderBatchHistoryTable(pageData, startIndex) {
  const tbody = document.getElementById('batchHistoryTableBody');
  
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">Belum ada batch</td></tr>';
    return;
  }

  tbody.innerHTML = pageData.map(batch => {
    const date = new Date(batch.createdAt);
    const formattedDate = date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Hide delete button for CRM role
    const deleteButton = currentUserRole === 'crm' ? '' : `
      <button class="btn-action btn-delete" onclick="deleteBatch('${batch.batchId}')" title="Delete">
        🗑️
      </button>
    `;

    return `
      <tr>
        <td style="font-family: monospace; font-size: 12px;">${batch.batchId}</td>
        <td>${formattedDate}</td>
        <td>${batch.totalRows}</td>
        <td style="color: #4caf50; font-weight: 600;">${batch.successCount}</td>
        <td style="color: #f44336; font-weight: 600;">${batch.errorCount}</td>
        <td>${batch.imageCount} images</td>
        <td>
          <button class="btn-action btn-download" onclick="downloadBatch('${batch.batchId}')" title="Download ZIP">
            📥
          </button>
          ${deleteButton}
        </td>
      </tr>
    `;
  }).join('');
}

// Download batch as ZIP
async function downloadBatch(batchId) {
  try {
    const response = await fetch(`/api/admin/download-batch/${batchId}`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batchId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const data = await response.json();
      alert('Error: ' + (data.error || 'Failed to download batch'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Delete batch
async function deleteBatch(batchId) {
  if (!confirm(`Hapus batch ${batchId}?\n\nSemua images dalam batch ini akan dihapus permanen.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/delete-batch/${batchId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      alert('✓ Batch berhasil dihapus');
      loadBatchHistory();
    } else {
      alert('Error: ' + (data.error || 'Failed to delete batch'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Initialize page
async function init() {
  const authData = await checkAuth();
  if (authData && authData.authenticated) {
    const userRole = authData.admin?.role || 'admin';
    
    console.log('User role:', userRole); // Debug log
    
    // Hide sections based on role
    if (userRole === 'crm') {
      // Hide all sections except bulk voucher generation
      // Use more compatible selectors
      const elementsToHide = [
        document.querySelector('.stats-grid'),
        document.getElementById('quotaInput')?.closest('.card'),
        document.getElementById('voucherListTableBody')?.closest('.card'),
        document.getElementById('exportCsvBtn')?.closest('.card'),
        document.getElementById('logsTableBody')?.closest('.card'),
        document.getElementById('blockedIpsTableBody')?.closest('.card'),
        document.getElementById('downloadsTable')?.closest('.card')
      ];
      
      elementsToHide.forEach(element => {
        if (element) {
          element.style.display = 'none';
          console.log('Hidden:', element); // Debug log
        }
      });
      
      console.log('CRM mode: Only loading batch history');
      // Only load batch history for CRM
      loadBatchHistory();
    } else {
      console.log('Admin mode: Loading all data');
      // Admin: load everything
      loadData();
      loadLogs();
      loadBlockedIps();
      loadVoucherStats();
      loadVoucherList(1);
      loadBatchHistory();
    }
  }
}

init();
