# Git Initialization Script (PowerShell)
# Quick setup for E-Voucher System

Write-Host "🚀 Git Initialization Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "   Please install Git first: https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if already initialized
if (Test-Path ".git") {
    Write-Host "⚠️  Git repository already initialized!" -ForegroundColor Yellow
    $confirm = Read-Host "   Do you want to reinitialize? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }
    Remove-Item -Recurse -Force .git
}

# Initialize Git
Write-Host "📦 Initializing Git repository..." -ForegroundColor Cyan
git init
Write-Host ""

# Configure Git (if not configured)
$userName = git config --global user.name
if ([string]::IsNullOrEmpty($userName)) {
    Write-Host "⚙️  Git user not configured" -ForegroundColor Yellow
    $userName = Read-Host "   Enter your name"
    git config --global user.name $userName
}

$userEmail = git config --global user.email
if ([string]::IsNullOrEmpty($userEmail)) {
    $userEmail = Read-Host "   Enter your email"
    git config --global user.email $userEmail
}

Write-Host "✅ Git configured:" -ForegroundColor Green
Write-Host "   Name: $(git config --global user.name)"
Write-Host "   Email: $(git config --global user.email)"
Write-Host ""

# Add files
Write-Host "📁 Adding files to Git..." -ForegroundColor Cyan
git add .
Write-Host ""

# Show status
Write-Host "📊 Git status:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Create first commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Cyan
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
Write-Host ""

# Ask for remote
$addRemote = Read-Host "🌐 Do you want to add a remote repository? (yes/no)"
if ($addRemote -eq "yes") {
    $remoteUrl = Read-Host "   Enter remote URL (e.g., https://github.com/user/repo.git)"
    git remote add origin $remoteUrl
    Write-Host "✅ Remote added: $remoteUrl" -ForegroundColor Green
    Write-Host ""
    
    $pushNow = Read-Host "📤 Push to remote now? (yes/no)"
    if ($pushNow -eq "yes") {
        git branch -M main
        git push -u origin main
        Write-Host "✅ Pushed to remote!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Git setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Review: git log"
Write-Host "   - Check status: git status"
Write-Host "   - View guide: cat GIT_SETUP_GUIDE.md"
Write-Host ""
