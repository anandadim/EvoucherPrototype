# Deployment Guide - Navigation Pane Feature

## 📋 Pre-Deployment Checklist

### 1. Code Review
- [ ] All code changes reviewed
- [ ] No syntax errors
- [ ] No console errors
- [ ] Code follows best practices

### 2. Testing
- [ ] All tests passed (see TESTING_CHECKLIST.md)
- [ ] Tested on multiple browsers
- [ ] Tested on multiple devices
- [ ] No regression issues

### 3. Documentation
- [ ] All documentation complete
- [ ] User guide ready
- [ ] Technical docs ready
- [ ] Changelog updated

### 4. Backup
- [ ] Database backup created
- [ ] Code backup created
- [ ] Rollback plan prepared
- [ ] Emergency contacts ready

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# 1. Pull latest code
git pull origin main

# 2. Verify all files present
ls -la public/admin-nav*
ls -la public/pages/

# 3. Check server.js changes
git diff HEAD~1 server.js

# 4. Install dependencies (if any)
npm install
```

### Step 2: Database Backup

```bash
# Backup database
cp voucher_downloads.db voucher_downloads.db.backup-$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -lh voucher_downloads.db*
```

### Step 3: Deploy Code

```bash
# Option A: Direct deployment
npm restart

# Option B: Using PM2
pm2 restart voucher-system

# Option C: Using systemd
sudo systemctl restart voucher-system
```

### Step 4: Verify Deployment

```bash
# 1. Check server is running
curl http://localhost:3000/api/admin/check-auth

# 2. Check logs
tail -f logs/server.log

# 3. Check database migration
sqlite3 voucher_downloads.db "PRAGMA table_info(voucher_settings);"
# Should show enable_navigation_pane column
```

### Step 5: Smoke Tests

1. **Test Admin Login**
   ```
   URL: http://your-domain/admin-login.html
   User: admin@voucher.com
   Expected: Redirects to admin.html (nav pane disabled by default)
   ```

2. **Test Feature Flag**
   ```
   1. Login as admin
   2. Check "Enable Navigation Pane"
   3. Page should refresh
   4. Should redirect to admin-nav.html
   ```

3. **Test Navigation**
   ```
   1. Click each menu item
   2. Verify pages load correctly
   3. No console errors
   ```

4. **Test Analytics**
   ```
   1. Go to Analytics page
   2. Select date range
   3. Click Apply Filter
   4. Verify data filters correctly
   5. Test Export CSV
   ```

5. **Test Rollback**
   ```
   1. Uncheck "Enable Navigation Pane"
   2. Page should refresh
   3. Should redirect to admin.html
   4. All features should work
   ```

## 🔄 Rollback Procedure

### Quick Rollback (If Issues Found)

#### Option 1: Via Admin Panel (Fastest)
```
1. Login as admin
2. Uncheck "Enable Navigation Pane"
3. Verify single page view works
```

#### Option 2: Via Database
```bash
# Disable feature flag
sqlite3 voucher_downloads.db "UPDATE voucher_settings SET enable_navigation_pane = 0 WHERE id = 1;"

# Verify
sqlite3 voucher_downloads.db "SELECT enable_navigation_pane FROM voucher_settings WHERE id = 1;"
```

#### Option 3: Code Rollback
```bash
# Revert to previous version
git revert HEAD

# Or restore from backup
git checkout <previous-commit-hash>

# Restart server
npm restart
```

#### Option 4: Database Restore
```bash
# Stop server
npm stop

# Restore database
cp voucher_downloads.db.backup-YYYYMMDD_HHMMSS voucher_downloads.db

# Restart server
npm start
```

## 📊 Post-Deployment Monitoring

### 1. Server Health
```bash
# Check server status
pm2 status

# Check memory usage
pm2 monit

# Check logs
pm2 logs voucher-system --lines 100
```

### 2. Error Monitoring
```bash
# Watch error logs
tail -f logs/error.log

# Check for specific errors
grep "ERROR" logs/server.log | tail -20
```

### 3. Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/admin/stats

# Monitor database size
ls -lh voucher_downloads.db
```

### 4. User Feedback
- [ ] Monitor user reports
- [ ] Check support tickets
- [ ] Review user feedback
- [ ] Track feature adoption

## 🔍 Troubleshooting

### Issue: Server won't start
**Solution:**
```bash
# Check logs
cat logs/server.log

# Check port availability
netstat -tulpn | grep 3000

# Kill existing process
pkill -f "node server.js"

# Restart
npm start
```

### Issue: Database migration failed
**Solution:**
```bash
# Check database integrity
sqlite3 voucher_downloads.db "PRAGMA integrity_check;"

# Manually add column if needed
sqlite3 voucher_downloads.db "ALTER TABLE voucher_settings ADD COLUMN enable_navigation_pane INTEGER DEFAULT 0;"

# Restart server
npm restart
```

### Issue: Pages not loading
**Solution:**
```bash
# Check file permissions
ls -la public/pages/

# Fix permissions if needed
chmod 644 public/pages/*.html

# Verify files exist
ls -la public/pages/
```

### Issue: Feature flag not working
**Solution:**
```bash
# Check database value
sqlite3 voucher_downloads.db "SELECT * FROM voucher_settings WHERE id = 1;"

# Reset if needed
sqlite3 voucher_downloads.db "UPDATE voucher_settings SET enable_navigation_pane = 0 WHERE id = 1;"

# Clear browser cache
# Logout and login again
```

## 📈 Success Metrics

### Day 1 (Deployment Day)
- [ ] Zero critical errors
- [ ] Server uptime 100%
- [ ] All smoke tests passed
- [ ] No user complaints

### Week 1
- [ ] Feature adoption rate tracked
- [ ] User feedback collected
- [ ] Performance metrics normal
- [ ] No rollbacks needed

### Month 1
- [ ] Feature usage analytics
- [ ] User satisfaction survey
- [ ] Performance optimization
- [ ] Plan for enhancements

## 📞 Emergency Contacts

### Development Team
- **Primary**: [Developer Name] - [Phone] - [Email]
- **Backup**: [Developer Name] - [Phone] - [Email]

### Operations Team
- **Primary**: [Ops Name] - [Phone] - [Email]
- **Backup**: [Ops Name] - [Phone] - [Email]

### Product Owner
- **Name**: [PO Name]
- **Phone**: [Phone]
- **Email**: [Email]

## 📝 Deployment Log

### Deployment Information
- **Date**: _______________
- **Time**: _______________
- **Deployed By**: _______________
- **Version**: 1.0.0
- **Environment**: Production

### Pre-Deployment
- [ ] Backup created at: _______________
- [ ] Code reviewed by: _______________
- [ ] Tests passed: Yes / No
- [ ] Stakeholders notified: Yes / No

### Deployment
- [ ] Code deployed at: _______________
- [ ] Server restarted at: _______________
- [ ] Database migrated: Yes / No
- [ ] Smoke tests passed: Yes / No

### Post-Deployment
- [ ] Monitoring started at: _______________
- [ ] No errors detected: Yes / No
- [ ] Users notified: Yes / No
- [ ] Documentation updated: Yes / No

### Issues Encountered
```
[List any issues encountered during deployment]
```

### Resolution
```
[List how issues were resolved]
```

### Sign-Off
- **Developer**: _______________ Date: _______________
- **QA**: _______________ Date: _______________
- **Operations**: _______________ Date: _______________
- **Product Owner**: _______________ Date: _______________

## 🎉 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Check server performance
- [ ] Verify feature flag works
- [ ] Test all pages load
- [ ] Respond to user feedback

### Short-term (Week 1)
- [ ] Collect user feedback
- [ ] Track feature adoption
- [ ] Monitor performance metrics
- [ ] Fix any minor issues
- [ ] Update documentation if needed

### Long-term (Month 1)
- [ ] Analyze usage patterns
- [ ] Plan optimizations
- [ ] Consider enhancements
- [ ] Review success metrics
- [ ] Plan next iteration

## 📚 Reference Documents

- [Quick Start Guide](QUICK_START_NAVIGATION_PANE.md)
- [Technical Documentation](NAVIGATION_PANE_IMPLEMENTATION.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Testing Checklist](TESTING_CHECKLIST.md)
- [Changelog](CHANGELOG_NAVIGATION_PANE.md)
- [README](README_NAVIGATION_PANE.md)

---

**Deployment Status**: Ready ✅  
**Risk Level**: Low (Rollback-friendly)  
**Estimated Downtime**: < 1 minute  
**Rollback Time**: < 5 minutes

**Good luck with the deployment! 🚀**
