@echo off
echo =======================================================
echo Starting ExamGen Studio with Virtual Environment (.venv)
echo =======================================================
call .\venv\Scripts\activate.bat
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
