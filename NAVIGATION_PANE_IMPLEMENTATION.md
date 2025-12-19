# Navigation Pane Implementation (Hybrid Approach)

## Overview
Implementasi navigation pane dengan pendekatan hybrid yang rollback-friendly menggunakan feature flag.

## Features Implemented

### 1. Feature Flag System
- **Database Column**: `enable_navigation_pane` di table `voucher_settings`
- **Default**: Disabled (0)
- **Toggle**: Admin dapat enable/disable via checkbox di admin panel
- **API Endpoint**: `POST /api/admin/toggle-navigation-pane`

### 2. Role-Based Routing
- **Admin Role + Nav Pane Enabled** → Redirect ke `admin-nav.html` (multi-page dengan sidebar)
- **Admin Role + Nav Pane Disabled** → Redirect ke `admin.html` (single page)
- **CRM Role** → Selalu redirect ke `admin.html` (single page, limited access)

### 3. Navigation Pane UI (`admin-nav.html`)
- **Sidebar Navigation** dengan menu items:
  - Dashboard
  - Analytics (dengan date filter)
  - Vouchers
  - Bulk Generate
  - Downloads
  - Security
  - Activity Logs
- **Responsive Design**: Mobile-friendly dengan toggle button
- **Dynamic Content Loading**: Pages loaded dari `/pages/*.html`

### 4. Analytics Dashboard (`/pages/analytics.html`)
- **Summary Cards**:
  - Total Views
  - Total Downloads
  - Conversion Rate
  - Unique Visitors
- **Date Range Filter**: Optional filter untuk analytics data
- **Analytics Table**: Breakdown by UTM source
- **Export CSV**: Download analytics data dengan date filter

### 5. API Endpoints

#### New Endpoints:
```javascript
// Get analytics data with date filter
GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD

// Toggle navigation pane feature
POST /api/admin/toggle-navigation-pane
Body: { enable: true/false }
```

#### Updated Endpoints:
```javascript
// Export analytics with date filter
GET /api/admin/export-analytics-utm?from=YYYY-MM-DD&to=YYYY-MM-DD
```

## File Structure

```
public/
├── admin.html                    # Single page admin (existing)
├── admin-nav.html               # Multi-page admin with navigation
├── admin-nav-style.css          # Navigation pane styles
├── admin-nav-script.js          # Navigation pane logic
├── admin-login.html             # Updated with smart redirect
└── pages/                       # Dynamic page content
    ├── dashboard.html
    ├── analytics.html
    ├── vouchers.html
    ├── bulk-generate.html
    ├── downloads.html
    ├── security.html
    └── logs.html
```

## How to Use

### Enable Navigation Pane:
1. Login sebagai Admin (bukan CRM)
2. Scroll ke section "Pengaturan Kuota"
3. Centang checkbox "Enable Navigation Pane"
4. Halaman akan refresh otomatis
5. Anda akan diarahkan ke `admin-nav.html`

### Disable Navigation Pane (Rollback):
1. Di admin panel, uncheck "Enable Navigation Pane"
2. Halaman akan refresh
3. Kembali ke single page view (`admin.html`)

## Rollback Strategy

### Quick Rollback:
1. **Via Admin Panel**: Uncheck "Enable Navigation Pane" checkbox
2. **Via Database**: 
   ```sql
   UPDATE voucher_settings SET enable_navigation_pane = 0 WHERE id = 1;
   ```

### Complete Rollback:
Jika ingin menghapus semua file navigation pane:
```bash
# Delete navigation pane files
rm public/admin-nav.html
rm public/admin-nav-style.css
rm public/admin-nav-script.js
rm -rf public/pages/

# Revert server.js changes (optional)
git checkout server.js
```

## Testing Checklist

- [ ] Admin login → redirect ke admin-nav.html (jika enabled)
- [ ] CRM login → redirect ke admin.html (always)
- [ ] Toggle navigation pane → refresh dan redirect
- [ ] Analytics date filter → filter data correctly
- [ ] Export CSV dengan date filter
- [ ] Mobile responsive navigation
- [ ] All menu items load correctly
- [ ] Logout dari navigation pane
- [ ] Session handling di semua pages

## Security Notes

1. **Role-based Access**: CRM role tidak bisa toggle navigation pane
2. **Authentication**: Semua pages check auth status
3. **Session Management**: Session timeout handled di semua pages
4. **API Protection**: Semua endpoints require authentication

## Performance Considerations

1. **Lazy Loading**: Pages loaded on-demand
2. **Minimal Initial Load**: Navigation pane loads first, content loads after
3. **Caching**: Browser caches static page content
4. **No Breaking Changes**: Existing admin.html tetap berfungsi

## Future Enhancements

1. **More Analytics**:
   - Chart visualizations
   - Real-time updates
   - Custom date ranges

2. **User Management**:
   - Add/edit/delete admin users
   - Role management
   - Permission settings

3. **Dashboard Widgets**:
   - Customizable dashboard
   - Drag-and-drop widgets
   - Personal preferences

## Troubleshooting

### Issue: Navigation pane tidak muncul setelah enable
**Solution**: Clear browser cache dan refresh

### Issue: Redirect loop setelah login
**Solution**: Check database `enable_navigation_pane` value dan role

### Issue: Pages tidak load
**Solution**: Pastikan folder `/pages/` ada dan file HTML tersedia

### Issue: Analytics data kosong
**Solution**: Check `page_views` table di database

## Support

Untuk pertanyaan atau issue, hubungi development team.

---

**Version**: 1.0.0  
**Date**: December 9, 2025  
**Author**: Development Team
