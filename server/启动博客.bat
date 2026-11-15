@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Python 3.10 或更高版本，并勾选 Add Python to PATH。
  pause
  exit /b 1
)
echo 博客地址：http://127.0.0.1:8080
python server.py
pause
