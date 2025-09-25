@echo off
:: Qoder IDE Auto-commit Batch Script for GitHub Desktop
:: This script automatically commits changes and syncs with GitHub Desktop

setlocal enabledelayedexpansion

:: Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PowerShell is not available on this system.
    echo Please install PowerShell to use this script.
    pause
    exit /b 1
)

:: Get the directory of this batch file
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_PATH=%SCRIPT_DIR%qoder-auto-commit.ps1"

:: Check if the PowerShell script exists
if not exist "%SCRIPT_PATH%" (
    echo Error: PowerShell script not found at %SCRIPT_PATH%
    echo Please make sure qoder-auto-commit.ps1 is in the same directory as this batch file.
    pause
    exit /b 1
)

:: Parse command line arguments
set "COMMIT_MESSAGE="
set "OPEN_GITHUB_DESKTOP=0"

:parse_args
if "%1"=="" goto run_script
if /i "%1"=="-m" (
    set "COMMIT_MESSAGE=%2"
    shift
    shift
    goto parse_args
)
if /i "%1"=="--message" (
    set "COMMIT_MESSAGE=%2"
    shift
    shift
    goto parse_args
)
if /i "%1"=="-o" (
    set "OPEN_GITHUB_DESKTOP=1"
    shift
    goto parse_args
)
if /i "%1"=="--open" (
    set "OPEN_GITHUB_DESKTOP=1"
    shift
    goto parse_args
)
if /i "%1"=="-h" (
    goto show_help
)
if /i "%1"=="--help" (
    goto show_help
)
shift
goto parse_args

:show_help
echo Qoder IDE Auto-commit Batch Script
echo ===================================
echo Usage: qoder-auto-commit.bat [-m "commit message"] [-o] [-h]
echo.
echo Options:
echo   -m, --message "message"  Custom commit message
echo   -o, --open              Open GitHub Desktop after commit
echo   -h, --help              Show this help message
echo.
echo This script will:
echo   1. Check for changes in your repository
echo   2. Add all changes
echo   3. Commit with a descriptive message
echo   4. Push to your remote repository
echo   5. Optionally open GitHub Desktop
echo.
pause
exit /b 0

:run_script
echo Starting Qoder IDE auto-commit process...

:: Build PowerShell command
set "PS_COMMAND=& '%SCRIPT_PATH%'"

if defined COMMIT_MESSAGE (
    set "PS_COMMAND=!PS_COMMAND! -CommitMessage '!COMMIT_MESSAGE!'"
)

if "!OPEN_GITHUB_DESKTOP!"=="1" (
    set "PS_COMMAND=!PS_COMMAND! -OpenGitHubDesktop"
)

:: Execute PowerShell script
powershell -ExecutionPolicy Bypass -Command "!PS_COMMAND!"

:: Check result
if %errorlevel% equ 0 (
    echo.
    echo Auto-commit process completed successfully!
) else (
    echo.
    echo Auto-commit process failed with error code %errorlevel%.
)

pause