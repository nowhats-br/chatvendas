@echo off
REM Auto-commit script for Qoder IDE
REM This script automatically commits and pushes changes to GitHub

setlocal enabledelayedexpansion

REM Set default commit message
set COMMIT_MESSAGE=Auto-commit from Qoder IDE
set OPEN_GITHUB_DESKTOP=0

REM Parse command line arguments
:parse_args
if "%1"=="" goto :start
if "%1"=="-m" (
    set "COMMIT_MESSAGE=%2"
    shift
    shift
    goto :parse_args
)
if "%1"=="--message" (
    set "COMMIT_MESSAGE=%2"
    shift
    shift
    goto :parse_args
)
if "%1"=="--open-github" (
    set OPEN_GITHUB_DESKTOP=1
    shift
    goto :parse_args
)
shift
goto :parse_args

:start
echo [$(date /t) $(time /t)] Starting auto-commit process...

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [$(date /t) $(time /t)] Error: Not in a git repository
    exit /b 1
)

REM Check if there are changes to commit
git status --porcelain | findstr /R /C:"^.." >nul
if errorlevel 1 (
    echo [$(date /t) $(time /t)] No changes to commit
    exit /b 0
)

REM Add all changes
echo [$(date /t) $(time /t)] Adding all changes...
git add .

REM Commit changes
echo [$(date /t) $(time /t)] Committing changes with message: %COMMIT_MESSAGE%
git commit -m "%COMMIT_MESSAGE%"

REM Push to remote repository
echo [$(date /t) $(time /t)] Pushing changes to remote repository...
git push origin main

echo [$(date /t) $(time /t)] Auto-commit completed successfully!

REM Optionally open GitHub Desktop
if "%OPEN_GITHUB_DESKTOP%"=="1" (
    echo [$(date /t) $(time /t)] Opening GitHub Desktop...
    start "" "C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
)

endlocal