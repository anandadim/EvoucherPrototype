# 🚀 Git Setup Guide

**Date:** 4 Desember 2024  
**Project:** E-Voucher System

---

## 📋 Pre-Setup Checklist

- [x] Project organized (docs, scripts, backups separated)
- [x] .gitignore updated
- [ ] Git installed
- [ ] GitHub/GitLab account ready (optional)

---

## 🎯 Quick Setup (5 Commands)

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "Initial commit: E-Voucher System with RT Voucher features"

# 4. Add remote (optional - replace with your repo URL)
git remote add origin https://github.com/yourusername/evoucher-system.git

# 5. Push to remote (optional)
git push -u origin main
```

---

## 📝 Detailed Setup

### **Step 1: Check Git Installation**

```bash
git --version
```

**Expected:** `git version 2.x.x`

**If not installed:**
- Windows: Download from https://git-scm.com/
- Linux: `sudo apt install git`
- Mac: `brew install git`

---

### **Step 2: Configure Git (First Time)**

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify
git config --list
```

---

### **Step 3: Initialize Repository**

```bash
# Initialize Git in current directory
git init

# Check status
git status
```

**Expected output:**
```
Initialized empty Git repository in /path/to/project/.git/
```

---

### **Step 4: Review .gitignore**

File `.gitignore` sudah di-setup untuk ignore:

```
✅ node_modules/           (Dependencies)
✅ .env                    (Secrets)
✅ *.db                    (Database)
✅ backups/                (Backup files)
✅ uploads/                (User uploads)
✅ EvoucherPrototype/      (Production folder)
✅ voucher_numbers_*.csv   (Voucher data)
```

**Verify:**
```bash
cat .gitignore
```

---

### **Step 5: Stage Files**

```bash
# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status
```

**Expected:** Should NOT include:
- ❌ node_modules/
- ❌ .env
- ❌ *.db files
- ❌ EvoucherPrototype/
- ❌ backups/

---

### **Step 6: First Commit**

```bash
# Create first commit
git commit -m "Initial commit: E-Voucher System

Features:
- RT Voucher system (RTT-/RCV- prefix)
- UTM tracking (RT01, RT02, direct)
- Admin panel with stats
- Bulk voucher upload
- CSV export
- Rate limiting
- Session management

Tech Stack:
- Node.js + Express
- SQLite3
- Canvas (voucher generation)
- QRCode generation
"

# Verify commit
git log --oneline
```

---

### **Step 7: Create Remote Repository (Optional)**

#### **Option A: GitHub**

1. Go to https://github.com/new
2. Create new repository: `evoucher-system`
3. **Don't** initialize with README (we already have code)
4. Copy repository URL

#### **Option B: GitLab**

1. Go to https://gitlab.com/projects/new
2. Create new project: `evoucher-system`
3. Copy repository URL

#### **Option C: Bitbucket**

1. Go to https://bitbucket.org/repo/create
2. Create repository: `evoucher-system`
3. Copy repository URL

---

### **Step 8: Connect to Remote (Optional)**

```bash
# Add remote (replace with your URL)
git remote add origin https://github.com/yourusername/evoucher-system.git

# Verify remote
git remote -v

# Push to remote
git branch -M main
git push -u origin main
```

---

## 🌿 Branch Strategy (Recommended)

### **Main Branches:**

```
main (production)
  ↓
develop (development)
  ↓
feature/* (features)
```

### **Create Branches:**

```bash
# Create develop branch
git checkout -b develop

# Create feature branch
git checkout -b feature/new-voucher-type

# Switch back to main
git checkout main
```

---

## 📦 What's Included in Git

### **✅ Included:**

```
✅ Source code (server.js, public/*)
✅ Documentation (docs/*)
✅ Scripts (scripts/*)
✅ Templates (templates/*)
✅ Configuration (package.json, .env.example)
✅ README.md
```

### **❌ Excluded (via .gitignore):**

```
❌ node_modules/           (Install via npm install)
❌ .env                    (Secrets - create manually)
❌ *.db                    (Database - backup separately)
❌ backups/                (Backup files)
❌ uploads/                (User uploads)
❌ EvoucherPrototype/      (Production - separate repo)
❌ voucher_numbers_*.csv   (Sensitive data)
```

---

## 🔐 Security Best Practices

### **1. Never Commit Secrets:**

```bash
# Check if .env is ignored
git check-ignore .env

# Should output: .env
```

### **2. Create .env.example:**

```bash
# Copy .env to .env.example (without real values)
cp .env .env.example

# Edit .env.example - remove real values
nano .env.example
```

**Example .env.example:**
```env
# Server
PORT=3000
NODE_ENV=production

# Session
SESSION_SECRET=your-secret-here-change-this

# Database
DB_PATH=./voucher_downloads.db

# Admin (create via utility/create-admin.js)
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=change-this
```

### **3. Add .env.example to Git:**

```bash
git add .env.example
git commit -m "Add .env.example template"
```

---

## 📝 Useful Git Commands

### **Daily Workflow:**

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to remote
git push

# Pull from remote
git pull
```

### **View History:**

```bash
# View commit history
git log

# View compact history
git log --oneline

# View last 5 commits
git log -5

# View changes in commit
git show <commit-hash>
```

### **Undo Changes:**

```bash
# Discard changes in file
git checkout -- filename

# Unstage file
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## 🚀 Deployment Workflow

### **Development → Production:**

```bash
# 1. Develop in local
git checkout develop
# ... make changes ...
git add .
git commit -m "Add new feature"

# 2. Merge to main
git checkout main
git merge develop

# 3. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Push to remote
git push origin main --tags

# 5. Deploy to server
# (SSH to server, pull changes, restart)
```

---

## 📊 Repository Structure

```
evoucher-system/
├── .git/                    # Git metadata
├── .gitignore              # Ignore rules
├── docs/                   # Documentation
│   ├── deployment/
│   ├── features/
│   └── guides/
├── scripts/                # Utility scripts
│   ├── database/
│   ├── ssl/
│   └── diagnostics/
├── templates/              # Templates
├── public/                 # Frontend
├── server.js              # Main server
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md              # Main README
```

---

## 🔍 Verify Setup

### **Checklist:**

```bash
# 1. Git initialized?
ls -la .git
# Should show .git directory

# 2. Files staged?
git status
# Should show files to be committed

# 3. .gitignore working?
git status | grep node_modules
# Should NOT show node_modules

# 4. Remote connected?
git remote -v
# Should show origin URL (if added)

# 5. First commit done?
git log
# Should show initial commit
```

---

## 📚 Additional Resources

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

## 🎉 Next Steps

After Git setup:

1. **Create README.md** (project overview)
2. **Add LICENSE** (if open source)
3. **Setup CI/CD** (optional - GitHub Actions, GitLab CI)
4. **Add CONTRIBUTING.md** (if team project)
5. **Setup branch protection** (protect main branch)

---

**Status:** ✅ Ready for Git initialization!
