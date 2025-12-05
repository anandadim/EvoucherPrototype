#!/bin/bash
# Git Initialization Script
# Quick setup for E-Voucher System

echo "🚀 Git Initialization Script"
echo "=============================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    echo "   Please install Git first: https://git-scm.com/"
    exit 1
fi

echo "✅ Git is installed: $(git --version)"
echo ""

# Check if already initialized
if [ -d ".git" ]; then
    echo "⚠️  Git repository already initialized!"
    read -p "   Do you want to reinitialize? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Cancelled"
        exit 0
    fi
    rm -rf .git
fi

# Initialize Git
echo "📦 Initializing Git repository..."
git init
echo ""

# Configure Git (if not configured)
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Git user not configured"
    read -p "   Enter your name: " username
    git config --global user.name "$username"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "   Enter your email: " useremail
    git config --global user.email "$useremail"
fi

echo "✅ Git configured:"
echo "   Name: $(git config --global user.name)"
echo "   Email: $(git config --global user.email)"
echo ""

# Add files
echo "📁 Adding files to Git..."
git add .
echo ""

# Show status
echo "📊 Git status:"
git status --short
echo ""

# Create first commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: E-Voucher System

Features:
- RT Voucher system (RCV- prefix)
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
echo ""

# Ask for remote
read -p "🌐 Do you want to add a remote repository? (yes/no): " add_remote
if [ "$add_remote" = "yes" ]; then
    read -p "   Enter remote URL (e.g., https://github.com/user/repo.git): " remote_url
    git remote add origin "$remote_url"
    echo "✅ Remote added: $remote_url"
    echo ""
    
    read -p "📤 Push to remote now? (yes/no): " push_now
    if [ "$push_now" = "yes" ]; then
        git branch -M main
        git push -u origin main
        echo "✅ Pushed to remote!"
    fi
fi

echo ""
echo "🎉 Git setup complete!"
echo ""
echo "📝 Next steps:"
echo "   - Review: git log"
echo "   - Check status: git status"
echo "   - View guide: cat GIT_SETUP_GUIDE.md"
echo ""
