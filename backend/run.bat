@echo off
REM Menjalankan backend di Windows: klik dua kali file ini.
cd /d "%~dp0"
if not exist .venv (
  echo Membuat virtual environment...
  python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt -q
set ENVFLAG=
if exist .env set ENVFLAG=--env-file .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000 %ENVFLAG%
pause
