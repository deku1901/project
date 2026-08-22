# ExamGen Studio PowerShell Launcher
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting ExamGen Studio using .venv virtual environment" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

& ".\venv\Scripts\python.exe" -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
