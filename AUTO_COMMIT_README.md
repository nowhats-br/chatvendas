# Auto-commit Scripts for Qoder IDE

This directory contains scripts to automatically commit and push changes to GitHub from Qoder IDE.

## Files Included

1. `auto-commit.ps1` - Simple PowerShell script for auto-commit
2. `auto-commit.bat` - Simple batch script for auto-commit
3. `auto-commit-enhanced.ps1` - Enhanced PowerShell script with configuration support
4. `auto-commit-config.json` - Configuration file for the enhanced script

## Usage

### Simple Scripts

#### PowerShell Script
```powershell
# Run with default message
.\auto-commit.ps1

# Run with custom message
.\auto-commit.ps1 -CommitMessage "Custom commit message"

# Run and open GitHub Desktop
.\auto-commit.ps1 -OpenGitHubDesktop
```

#### Batch Script
```batch
# Run with default message
auto-commit.bat

# Run with custom message
auto-commit.bat -m "Custom commit message"

# Run and open GitHub Desktop
auto-commit.bat --open-github
```

### Enhanced Script

```powershell
# Run with default message
.\auto-commit-enhanced.ps1

# Run with custom message
.\auto-commit-enhanced.ps1 -CommitMessage "Custom commit message"

# Run and open GitHub Desktop
.\auto-commit-enhanced.ps1 -OpenGitHubDesktop

# Show help
.\auto-commit-enhanced.ps1 -Help
```

## Configuration

The enhanced script reads configuration from `auto-commit-config.json`:

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

To integrate these scripts with Qoder IDE:

1. **Manual Execution**: Run the scripts manually after making changes
2. **Task Automation**: Set up tasks in Qoder to run these scripts
3. **Pre-commit Hooks**: Configure Git hooks to run these scripts before commits
4. **Scheduled Tasks**: Set up Windows Task Scheduler to run these scripts periodically

## GitHub Desktop Integration

The scripts can automatically open GitHub Desktop after committing changes. Make sure GitHub Desktop is installed in the default location:
`C:\Users\[USERNAME]\AppData\Local\GitHubDesktop\GitHubDesktop.exe`

## Troubleshooting

1. **Git not found**: Ensure Git is installed and in your PATH
2. **Permission denied**: Run the scripts with appropriate permissions
3. **No changes to commit**: The script will exit if there are no changes
4. **Network issues**: Ensure you have internet connectivity and proper Git remote configuration

## Security Notes

- Never commit sensitive information like API keys or passwords
- The scripts will commit all changes, so review changes before running
- Ensure your Git credentials are properly configured