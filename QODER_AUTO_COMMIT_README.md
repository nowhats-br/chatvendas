# Qoder IDE Auto-commit Solution

This solution provides automatic Git commits from Qoder IDE to GitHub Desktop for all updates.

## Files Included

1. `qoder-auto-commit.ps1` - PowerShell script for auto-commit functionality
2. `qoder-auto-commit.bat` - Batch file wrapper for easier execution
3. `auto-commit-config.json` - Configuration file (already exists)

## Features

- Automatically detects changed files
- Generates descriptive commit messages based on file types
- Commits and pushes changes to your remote repository
- Optionally opens GitHub Desktop after committing
- Works with any Git repository

## Prerequisites

- Git must be installed and configured
- GitHub Desktop (optional, but recommended)
- PowerShell (for the main script)

## Usage

### Method 1: Using the Batch File (Recommended)

Double-click `qoder-auto-commit.bat` or run from command line:

```cmd
qoder-auto-commit.bat
```

With custom commit message:
```cmd
qoder-auto-commit.bat -m "Your custom commit message"
```

With custom message and open GitHub Desktop:
```cmd
qoder-auto-commit.bat -m "Your message" -o
```

### Method 2: Using PowerShell Directly

```powershell
.\qoder-auto-commit.ps1
```

With custom commit message:
```powershell
.\qoder-auto-commit.ps1 -CommitMessage "Your custom commit message"
```

With custom message and open GitHub Desktop:
```powershell
.\qoder-auto-commit.ps1 -CommitMessage "Your message" -OpenGitHubDesktop
```

## Configuration

The script uses `auto-commit-config.json` for configuration:

```json
{
  "defaultCommitMessage": "Auto-commit from Qoder IDE",
  "branch": "main",
  "remote": "origin",
  "openGitHubDesktop": true,
  "filePatterns": [
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "*.json",
    "*.md",
    "*.sh",
    "*.ps1",
    "*.bat",
    "*.cjs"
  ],
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "*.log",
    ".env"
  ]
}
```

## Integration with Qoder IDE

To automatically commit after each save or at regular intervals:

1. **Manual Trigger**: Run the batch file whenever you want to commit changes
2. **Scheduled Task**: Set up a Windows Scheduled Task to run the script periodically
3. **File Watcher**: Use a file watcher tool to trigger the script on file changes

### Setting up a Scheduled Task

1. Open Task Scheduler (taskschd.msc)
2. Click "Create Basic Task"
3. Name it "Qoder Auto-commit"
4. Set trigger (e.g., daily, hourly, etc.)
5. Set action to run `qoder-auto-commit.bat`
6. Finish the wizard

### Setting up a File Watcher (Advanced)

You can use tools like [WatchDirectory](https://www.watchdirectory.net/) or create a PowerShell script that monitors file changes.

## Troubleshooting

### "PowerShell is not available"
- Install PowerShell from the Microsoft Store or [PowerShell GitHub releases](https://github.com/PowerShell/PowerShell/releases)

### "Not in a Git repository"
- Make sure you're running the script from the root of your Git repository
- Initialize Git repository with `git init` if needed

### "GitHub Desktop not found"
- Install GitHub Desktop from [desktop.github.com](https://desktop.github.com/)
- Or set the correct path in the script

### "Permission denied" or "Access denied"
- Run the script as Administrator
- Check file permissions

## Customization

You can modify the PowerShell script to:
- Change commit message generation logic
- Add more file type detection
- Customize logging format
- Add pre-commit hooks
- Integrate with other tools

## Support

For issues or feature requests, please check the existing scripts and configuration files.