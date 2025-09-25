# Qoder IDE GitHub Integration Guide

This guide explains how to set up automatic commits from Qoder IDE to GitHub Desktop.

## Current Setup

You now have the following files for automatic Git commits:

1. `qoder-auto-commit.ps1` - Main PowerShell script
2. `qoder-auto-commit.bat` - Batch file wrapper for easy execution
3. `setup-auto-commit-task.ps1` - Script to create scheduled automatic commits
4. `QODER_AUTO_COMMIT_README.md` - Documentation for the auto-commit solution

## Quick Start

### Option 1: Manual Commits (Recommended for Development)

Simply run the batch file whenever you want to commit changes:

```
qoder-auto-commit.bat
```

Or with a custom message:

```
qoder-auto-commit.bat -m "Your commit message"
```

### Option 2: Scheduled Automatic Commits

Run the setup script to create a scheduled task that commits every hour:

```
setup-auto-commit-task.ps1
```

## Integration with Qoder IDE

### Method 1: Using External Tools

1. In Qoder IDE, go to Settings/Preferences
2. Look for "External Tools" or "Custom Commands"
3. Add a new tool with these settings:
   - Name: `Auto Commit`
   - Command: `qoder-auto-commit.bat`
   - Arguments: `-m "Auto-commit from Qoder IDE"`
   - Working Directory: `$ProjectFileDir$` (or the project root path)

### Method 2: Keyboard Shortcut

1. In Qoder IDE, go to Settings/Preferences
2. Navigate to Keymap or Shortcuts
3. Find "External Tools" -> "Auto Commit" (if you set up Method 1)
4. Assign a keyboard shortcut (e.g., Ctrl+Alt+G)

### Method 3: File Watcher Integration

If Qoder IDE supports file watchers, you can set up an automatic commit on file save:

1. Go to Settings -> Tools -> File Watchers
2. Add a new watcher:
   - File type: Any
   - Scope: Project Files
   - Program: `qoder-auto-commit.bat`
   - Arguments: (leave empty for default behavior)
   - Output paths to refresh: `$ProjectFileDir$`

## Advanced Usage

### Custom Commit Messages

You can provide custom commit messages:

```powershell
# PowerShell
.\qoder-auto-commit.ps1 -CommitMessage "Implemented new feature"

# Batch file
qoder-auto-commit.bat -m "Fixed bug in authentication"
```

### Opening GitHub Desktop Automatically

```powershell
# PowerShell
.\qoder-auto-commit.ps1 -OpenGitHubDesktop

# Batch file
qoder-auto-commit.bat -o
```

### Combination of Options

```powershell
# PowerShell
.\qoder-auto-commit.ps1 -CommitMessage "Updated documentation" -OpenGitHubDesktop

# Batch file
qoder-auto-commit.bat -m "Updated documentation" -o
```

## Configuration

The auto-commit behavior can be customized in `auto-commit-config.json`:

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

## Troubleshooting

### "Execution Policy" Error in PowerShell

If you get an execution policy error, run this command as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "git" is not recognized

Make sure Git is installed and added to your PATH:
1. Download Git from https://git-scm.com/
2. During installation, select "Add Git to PATH"

### "GitHub Desktop not found"

Install GitHub Desktop from https://desktop.github.com/

## Best Practices

1. **Frequent Commits**: Run the auto-commit script frequently to avoid large commits
2. **Meaningful Messages**: Use custom messages for significant changes
3. **Review Changes**: Check what files are being committed with `git status`
4. **Staging**: For more control, manually stage files with `git add` before running the script

## Support

For any issues or questions about this integration:
1. Check the documentation in `QODER_AUTO_COMMIT_README.md`
2. Ensure all scripts are in the same directory
3. Verify Git is properly configured
4. Check that you have internet connectivity for pushing to GitHub