// Navigation Pane Script
let currentPage = 'dashboard';
let adminData = null;

// Check authentication and role
async function checkAuth() {
  try {
    const response = await fetch('/api/admin/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = 'admin-login.html';
      return null;
    }

    adminData = data.admin;
    
    // Update sidebar user info
    document.getElementById('sidebarAdminName').textContent = data.admin.name;
    document.getElementById('sidebarAdminRole').textContent = 
      data.admin.role === 'admin' ? 'Administrator' : 'CRM Admin';

    return data;
  } catch (error) {
    window.location.href = 'admin-login.html';
    return null;
  }
}

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('mainContent').classList.toggle('expanded');
});

// Mobile toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('mobile-open');
});

// Logout
document.getElementById('sidebarLogout').addEventListener('click', async () => {
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

// Menu navigation
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    navigateToPage(page);
  });
});

// Navigate to page
function navigateToPage(page) {
  // Update active menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  // Update page title
  const titles = {
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'vouchers': 'Voucher Management',
    'bulk-generate': 'Bulk Generate',
    'downloads': 'Download Records',
    'security': 'Security & IP Blocking',
    'logs': 'Activity Logs'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

  // Load page content
  currentPage = page;
  loadPageContent(page);

  // Close mobile menu
  document.getElementById('sidebar').classList.remove('mobile-open');
}

// Load page content dynamically
async function loadPageContent(page) {
  const container = document.getElementById('contentContainer');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`/pages/${page}.html`);
    if (response.ok) {
      const html = await response.text();
      container.innerHTML = html;
      
      // Execute scripts in the loaded HTML
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      
      // Initialize page-specific scripts
      setTimeout(() => {
        initializePage(page);
      }, 50);
    } else {
      container.innerHTML = `<div style="text-align: center; padding: 60px; color: #999;">
        <h2>Page not found</h2>
        <p>The requested page could not be loaded.</p>
      </div>`;
    }
  } catch (error) {
    console.error('Error loading page:', error);
    container.innerHTML = `<div style="text-align: center; padding: 60px; color: #f44336;">
      <h2>Error loading page</h2>
      <p>${error.message}</p>
    </div>`;
  }
}

// Initialize page-specific functionality
function initializePage(page) {
  switch(page) {
    case 'dashboard':
      initDashboard();
      break;
    case 'analytics':
      initAnalytics();
      break;
    case 'vouchers':
      initVouchers();
      break;
    case 'bulk-generate':
      initBulkGenerate();
      break;
    case 'downloads':
      initDownloads();
      break;
    case 'security':
      initSecurity();
      break;
    case 'logs':
      initLogs();
      break;
  }
}

// Page initialization functions
function initDashboard() {
  console.log('Dashboard initialized');
  // Load dashboard data
  loadDashboardStats();
}

function initAnalytics() {
  console.log('Analytics initialized');
  // Analytics page scripts should be executed automatically
  // Just call loadAnalyticsData if it exists
  if (typeof loadAnalyticsData === 'function') {
    loadAnalyticsData();
  }
}

function initVouchers() {
  console.log('Vouchers initialized');
  // Vouchers page scripts should be executed automatically
}

function initBulkGenerate() {
  console.log('Bulk Generate initialized');
  // Bulk generate page scripts should be executed automatically
}

function initDownloads() {
  console.log('Downloads initialized');
  // Downloads page scripts should be executed automatically
}

function initSecurity() {
  console.log('Security initialized');
  // Security page scripts should be executed automatically
}

function initLogs() {
  console.log('Logs initialized');
  // Logs page scripts should be executed automatically
}

// Dashboard stats loader
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    
    // Update stats in dashboard
    if (document.getElementById('totalQuota')) {
      document.getElementById('totalQuota').textContent = data.settings.total_quota;
      document.getElementById('usedQuota').textContent = data.settings.used_quota;
      document.getElementById('remainingQuota').textContent = 
        data.settings.total_quota - data.settings.used_quota;
      
      const percentage = Math.round((data.settings.used_quota / data.settings.total_quota) * 100);
      document.getElementById('percentageUsed').textContent = percentage + '%';
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Analytics data loader
async function loadAnalyticsData() {
  try {
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    
    const response = await fetch(`/api/admin/analytics?${params}`);
    const data = await response.json();
    
    // Update analytics UI
    renderAnalytics(data);
  } catch (error) {
    console.error('Error loading analytics:', error);
    // Show error in table if exists
    const tbody = document.getElementById('analyticsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #f44336;">Error loading analytics data</td></tr>';
    }
  }
}

// Render analytics data
function renderAnalytics(data) {
  // Summary cards
  if (document.getElementById('totalViews')) {
    document.getElementById('totalViews').textContent = data.summary.totalViews || 0;
    document.getElementById('totalDownloads').textContent = data.summary.totalDownloads || 0;
    document.getElementById('conversionRate').textContent = 
      (data.summary.conversionRate || 0).toFixed(2) + '%';
    document.getElementById('uniqueVisitors').textContent = data.summary.uniqueVisitors || 0;
  }

  // Analytics table
  const tbody = document.getElementById('analyticsTableBody');
  if (tbody && data.bySource) {
    if (data.bySource.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #999;">Belum ada data analytics</td></tr>';
    } else {
      tbody.innerHTML = data.bySource.map(row => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${row.utm_source || 'direct'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${row.total_views || 0}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${row.total_downloads || 0}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${row.views_only || 0}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${(row.conversion_rate || 0).toFixed(2)}%</td>
        </tr>
      `).join('');
    }
  }
}

// Helper functions for pages (make them globally available)
window.loadAnalyticsData = loadAnalyticsData;
window.renderAnalytics = renderAnalytics;
window.loadDashboardStats = loadDashboardStats;
window.navigateToPage = navigateToPage;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  const authData = await checkAuth();
  if (authData) {
    // Load default page
    navigateToPage('dashboard');
  }
});
