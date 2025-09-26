# Setup script for automatic commits in Qoder IDE
# Creates a Windows Scheduled Task that runs the auto-commit script every hour

# Define task name
$taskName = "Qoder-Auto-Commit"

# Get the current directory (where this script is located)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchScriptPath = Join-Path $scriptDir "qoder-auto-commit.bat"

# Check if the batch script exists
if (-not (Test-Path $batchScriptPath)) {
    Write-Host "Error: qoder-auto-commit.bat not found at $batchScriptPath" -ForegroundColor Red
    Write-Host "Please run this setup script from the same directory as qoder-auto-commit.bat" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting up automatic commit task for Qoder IDE..." -ForegroundColor Cyan
Write-Host "Task Name: $taskName" -ForegroundColor White
Write-Host "Script Path: $batchScriptPath" -ForegroundColor White

try {
    # Check if task already exists
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "Task already exists. Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Create the scheduled task action
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batchScriptPath`"" -WorkingDirectory $scriptDir

    # Create the scheduled task trigger (every hour)
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

    # Create the scheduled task settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    # Create the scheduled task principal (run whether user is logged on or not)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    # Register the scheduled task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Automatically commits changes from Qoder IDE to Git"

    Write-Host "Scheduled task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The task will run every hour and automatically commit any changes in your repository." -ForegroundColor White
    Write-Host "To modify the schedule, please use Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host ""
    Write-Host "To manually run the task:" -ForegroundColor Cyan
    Write-Host "1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "2. Navigate to Task Scheduler Library" -ForegroundColor White
    Write-Host "3. Find '$taskName'" -ForegroundColor White
    Write-Host "4. Right-click and select 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "To disable the automatic commits:" -ForegroundColor Cyan
    Write-Host "1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "2. Find '$taskName'" -ForegroundColor White
    Write-Host "3. Right-click and select 'Disable'" -ForegroundColor White
    Write-Host ""
    Write-Host "To completely remove the task:" -ForegroundColor Cyan
    Write-Host "1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "2. Find '$taskName'" -ForegroundColor White
    Write-Host "3. Right-click and select 'Delete'" -ForegroundColor White

} catch {
    Write-Host "Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}