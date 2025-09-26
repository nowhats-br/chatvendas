# Qoder IDE Auto-commit Script for GitHub Desktop
# This script automatically commits changes and syncs with GitHub Desktop

param(
    [string]$CommitMessage = "",
    [switch]$OpenGitHubDesktop,
    [switch]$Help
)

# Function to show help
function Show-Help {
    Write-Host "Qoder IDE Auto-commit Script" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Usage: .\qoder-auto-commit.ps1 [-CommitMessage <message>] [-OpenGitHubDesktop] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Cyan
    Write-Host "  -CommitMessage <message>  : Custom commit message (default: 'Auto-commit from Qoder IDE')" -ForegroundColor White
    Write-Host "  -OpenGitHubDesktop        : Open GitHub Desktop after commit" -ForegroundColor White
    Write-Host "  -Help                     : Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Cyan
    Write-Host "  1. Check for changes in your repository" -ForegroundColor White
    Write-Host "  2. Add all changes" -ForegroundColor White
    Write-Host "  3. Commit with a descriptive message" -ForegroundColor White
    Write-Host "  4. Push to your remote repository" -ForegroundColor White
    Write-Host "  5. Optionally open GitHub Desktop" -ForegroundColor White
}

# Function to log messages with timestamp
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

# Function to check if Git repository is valid
function Test-GitRepository {
    try {
        $gitDir = git rev-parse --git-dir 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Function to check if there are changes to commit
function Test-GitChanges {
    try {
        $status = git status --porcelain 2>$null
        return ($status -ne $null) -and ($status.Trim() -ne "")
    } catch {
        return $false
    }
}

# Function to get changed files summary
function Get-ChangedFilesSummary {
    try {
        $changedFiles = git status --porcelain 2>$null | ForEach-Object { $_.Trim() }
        if ($changedFiles.Count -eq 0) { return @() }
        
        $summary = @{
            TypeScript = ($changedFiles | Where-Object { $_ -like "*/*.ts" -or $_ -like "*/*.tsx" }).Count
            JavaScript = ($changedFiles | Where-Object { $_ -like "*/*.js" -or $_ -like "*/*.jsx" }).Count
            Config = ($changedFiles | Where-Object { $_ -like "*/*.json" -or $_ -like "*/*.config*" -or $_ -like "*/*.cjs" }).Count
            Scripts = ($changedFiles | Where-Object { $_ -like "*/*.sh" -or $_ -like "*/*.ps1" -or $_ -like "*/*.bat" }).Count
            Docs = ($changedFiles | Where-Object { $_ -like "*/*.md" }).Count
            Styles = ($changedFiles | Where-Object { $_ -like "*/*.css" -or $_ -like "*/*.scss" -or $_ -like "*/*.less" }).Count
            Other = ($changedFiles | Where-Object { 
                $_ -notlike "*/*.ts" -and $_ -notlike "*/*.tsx" -and 
                $_ -notlike "*/*.js" -and $_ -notlike "*/*.jsx" -and
                $_ -notlike "*/*.json" -and $_ -notlike "*/*.config*" -and $_ -notlike "*/*.cjs" -and
                $_ -notlike "*/*.sh" -and $_ -notlike "*/*.ps1" -and $_ -notlike "*/*.bat" -and
                $_ -notlike "*/*.md" -and $_ -notlike "*/*.css" -and $_ -notlike "*/*.scss" -and $_ -notlike "*/*.less"
            }).Count
        }
        return $summary
    } catch {
        return @{}
    }
}

# Function to generate descriptive commit message
function Get-CommitMessage {
    param([string]$CustomMessage)
    
    # Use custom message if provided
    if ($CustomMessage -and $CustomMessage -ne "") {
        return $CustomMessage
    }
    
    # Generate descriptive message based on changed files
    $summary = Get-ChangedFilesSummary
    $messageParts = @()
    
    if ($summary.TypeScript -gt 0) {
        $messageParts += "$($summary.TypeScript) TypeScript file(s)"
    }
    
    if ($summary.JavaScript -gt 0) {
        $messageParts += "$($summary.JavaScript) JavaScript file(s)"
    }
    
    if ($summary.Config -gt 0) {
        $messageParts += "$($summary.Config) config file(s)"
    }
    
    if ($summary.Scripts -gt 0) {
        $messageParts += "$($summary.Scripts) script file(s)"
    }
    
    if ($summary.Docs -gt 0) {
        $messageParts += "$($summary.Docs) document(s)"
    }
    
    if ($summary.Styles -gt 0) {
        $messageParts += "$($summary.Styles) style file(s)"
    }
    
    if ($summary.Other -gt 0) {
        $messageParts += "$($summary.Other) other file(s)"
    }
    
    # Default message if no specific files detected
    if ($messageParts.Count -eq 0) {
        return "Auto-commit from Qoder IDE - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    return "Update $($messageParts -join ', ') - Auto-commit from Qoder IDE"
}

# Function to check if GitHub Desktop is installed
function Test-GitHubDesktop {
    $paths = @(
        "C:\Users\brazz\AppData\Local\GitHubDesktop\GitHubDesktop.exe",
        "C:\Users\$env:USERNAME\AppData\Local\GitHubDesktop\GitHubDesktop.exe",
        "C:\Program Files\GitHub Desktop\GitHubDesktop.exe",
        "C:\Program Files (x86)\GitHub Desktop\GitHubDesktop.exe"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    # Try to find via command
    try {
        $ghDesktop = Get-Command github -ErrorAction SilentlyContinue
        if ($ghDesktop) {
            return $ghDesktop.Source
        }
    } catch {
        # Continue if not found
    }
    
    return $null
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Log-Message "Starting Qoder IDE auto-commit process..." "Cyan"

try {
    # Check if we're in a Git repository
    if (-not (Test-GitRepository)) {
        Log-Message "Error: Not in a Git repository. Please run this script from the root of your Git repository." "Red"
        exit 1
    }

    # Check if there are changes to commit
    if (-not (Test-GitChanges)) {
        Log-Message "No changes to commit." "Yellow"
        
        # Optionally open GitHub Desktop even if no changes
        if ($OpenGitHubDesktop) {
            $ghDesktopPath = Test-GitHubDesktop
            if ($ghDesktopPath) {
                Log-Message "Opening GitHub Desktop..." "Cyan"
                Start-Process $ghDesktopPath
            } else {
                Log-Message "GitHub Desktop not found. Please install it from https://desktop.github.com/" "Yellow"
            }
        }
        
        exit 0
    }

    # Show what files have changed
    Log-Message "Changes detected:" "Cyan"
    git status --short

    # Generate commit message
    $finalCommitMessage = Get-CommitMessage $CommitMessage
    Log-Message "Commit message: $finalCommitMessage" "White"

    # Add all changes
    Log-Message "Adding all changes..." "Cyan"
    git add .

    # Commit changes
    Log-Message "Committing changes..." "Cyan"
    git commit -m "$finalCommitMessage"

    # Push to remote repository
    Log-Message "Pushing changes to remote repository..." "Cyan"
    git push

    Log-Message "Auto-commit completed successfully!" "Green"

    # Optionally open GitHub Desktop
    if ($OpenGitHubDesktop) {
        $ghDesktopPath = Test-GitHubDesktop
        if ($ghDesktopPath) {
            Log-Message "Opening GitHub Desktop..." "Cyan"
            Start-Process $ghDesktopPath
        } else {
            Log-Message "GitHub Desktop not found. Please install it from https://desktop.github.com/" "Yellow"
        }
    }

} catch {
    Log-Message "Error during auto-commit process: $($_.Exception.Message)" "Red"
    exit 1
}