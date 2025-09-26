# Auto-commit script for Qoder IDE
# This script automatically commits and pushes changes to GitHub

param(
    [string]$CommitMessage = "Auto-commit from Qoder IDE",
    [switch]$OpenGitHubDesktop
)

# Function to log messages
function Log-Message {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Green
}

# Function to check if there are changes to commit
function Test-GitChanges {
    $status = git status --porcelain
    return $status -ne $null -and $status -ne ""
}

# Main script
Log-Message "Starting auto-commit process..."

try {
    # Check if we're in a git repository
    git rev-parse --git-dir > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Message "Error: Not in a git repository"
        exit 1
    }

    # Check if there are changes to commit
    if (-not (Test-GitChanges)) {
        Log-Message "No changes to commit"
        exit 0
    }

    # Add all changes
    Log-Message "Adding all changes..."
    git add .

    # Commit changes
    Log-Message "Committing changes with message: $CommitMessage"
    git commit -m "$CommitMessage"

    # Push to remote repository
    Log-Message "Pushing changes to remote repository..."
    git push origin main

    Log-Message "Auto-commit completed successfully!"

    # Optionally open GitHub Desktop
    if ($OpenGitHubDesktop) {
        Log-Message "Opening GitHub Desktop..."
        Start-Process "C:\Users\$env:USERNAME\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
    }

} catch {
    Log-Message "Error during auto-commit process: $($_.Exception.Message)"
    exit 1
}