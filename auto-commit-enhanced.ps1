# Enhanced Auto-commit script for Qoder IDE
# This script automatically commits and pushes changes to GitHub with configuration support

param(
    [string]$CommitMessage,
    [switch]$OpenGitHubDesktop,
    [switch]$Help
)

# Function to show help
function Show-Help {
    Write-Host "Auto-commit script for Qoder IDE" -ForegroundColor Cyan
    Write-Host "Usage: .\auto-commit-enhanced.ps1 [-CommitMessage <message>] [-OpenGitHubDesktop] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Cyan
    Write-Host "  -CommitMessage <message>  : Custom commit message (default from config)" -ForegroundColor White
    Write-Host "  -OpenGitHubDesktop        : Open GitHub Desktop after commit" -ForegroundColor White
    Write-Host "  -Help                     : Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  The script reads configuration from auto-commit-config.json" -ForegroundColor White
}

# Function to log messages
function Log-Message {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Color) {
        "Red" { Write-Host "[$timestamp] $Message" -ForegroundColor Red }
        "Yellow" { Write-Host "[$timestamp] $Message" -ForegroundColor Yellow }
        "Cyan" { Write-Host "[$timestamp] $Message" -ForegroundColor Cyan }
        "White" { Write-Host "[$timestamp] $Message" -ForegroundColor White }
        default { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
    }
}

# Function to load configuration
function Get-Config {
    $configPath = Join-Path $PSScriptRoot "auto-commit-config.json"
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath | ConvertFrom-Json
            return $config
        } catch {
            Log-Message "Warning: Could not read config file, using defaults" "Yellow"
        }
    }
    
    # Default configuration
    return @{
        defaultCommitMessage = "Auto-commit from Qoder IDE"
        branch = "main"
        remote = "origin"
        openGitHubDesktop = $true
        filePatterns = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md", "*.sh", "*.ps1", "*.bat", "*.cjs")
        ignorePatterns = @("node_modules/", "dist/", "*.log", ".env")
    }
}

# Function to check if there are changes to commit
function Test-GitChanges {
    $status = git status --porcelain
    return $status -ne $null -and $status -ne ""
}

# Function to generate commit message based on changes
function Get-AutoCommitMessage {
    param($config)
    
    if ($CommitMessage) {
        return $CommitMessage
    }
    
    # Get changed files
    $changedFiles = git status --porcelain | ForEach-Object { $_.Trim() }
    
    if ($changedFiles.Count -eq 0) {
        return $config.defaultCommitMessage
    }
    
    # Analyze changes
    $tsChanges = $changedFiles | Where-Object { $_ -like "*/*.ts" -or $_ -like "*/*.tsx" }
    $configChanges = $changedFiles | Where-Object { $_ -like "*/*.json" -or $_ -like "*/*.config*" }
    $scriptChanges = $changedFiles | Where-Object { $_ -like "*/*.sh" -or $_ -like "*/*.ps1" -or $_ -like "*/*.bat" }
    $docChanges = $changedFiles | Where-Object { $_ -like "*/*.md" }
    
    # Generate message based on file types
    $messageParts = @()
    
    if ($tsChanges.Count -gt 0) {
        $messageParts += "$($tsChanges.Count) TypeScript file(s)"
    }
    
    if ($configChanges.Count -gt 0) {
        $messageParts += "$($configChanges.Count) config file(s)"
    }
    
    if ($scriptChanges.Count -gt 0) {
        $messageParts += "$($scriptChanges.Count) script file(s)"
    }
    
    if ($docChanges.Count -gt 0) {
        $messageParts += "$($docChanges.Count) document(s)"
    }
    
    if ($messageParts.Count -gt 0) {
        return "Update $($messageParts -join ', ') - Auto-commit from Qoder"
    }
    
    return $config.defaultCommitMessage
}

# Main script
if ($Help) {
    Show-Help
    exit 0
}

Log-Message "Starting enhanced auto-commit process..."

try {
    # Load configuration
    $config = Get-Config
    Log-Message "Configuration loaded successfully"
    
    # Check if we're in a git repository
    git rev-parse --git-dir > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Error: Not in a git repository" "Red"
        exit 1
    }

    # Check if there are changes to commit
    if (-not (Test-GitChanges)) {
        Log-Message "No changes to commit"
        exit 0
    }

    # Generate commit message
    $finalCommitMessage = Get-AutoCommitMessage $config
    Log-Message "Commit message: $finalCommitMessage"

    # Add all changes
    Log-Message "Adding all changes..."
    git add .

    # Commit changes
    Log-Message "Committing changes..."
    git commit -m "$finalCommitMessage"

    # Push to remote repository
    Log-Message "Pushing changes to $($config.remote)/$($config.branch)..."
    git push $config.remote $config.branch

    Log-Message "Enhanced auto-commit completed successfully!"

    # Optionally open GitHub Desktop
    if ($OpenGitHubDesktop -or $config.openGitHubDesktop) {
        Log-Message "Opening GitHub Desktop..."
        Start-Process "C:\Users\$env:USERNAME\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
    }

} catch {
    Log-Message "Error during enhanced auto-commit process: $($_.Exception.Message)" "Red"
    exit 1
}