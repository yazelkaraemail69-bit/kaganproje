@echo off
chcp 65001 >nul
title KaganProje - Dijital Kartvizit ve Menu
cd /d "%~dp0"

echo.
echo  ========================================
echo   KaganProje - Dijital Vitrin Stuyosu
echo  ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [!] Node.js bulunamadi.
  echo  https://nodejs.org adresinden LTS surumunu kurun.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Bagimliliklar yukleniyor...
  call npm install
  if errorlevel 1 (
    echo  npm install basarisiz.
    pause
    exit /b 1
  )
)

if not exist .env.local (
  if exist .env.example (
    copy /Y .env.example .env.local >nul
    echo  .env.local olusturuldu. Shorts icin API anahtarlarini duzenleyin.
  )
)

echo  Sunucu baslatiliyor: http://localhost:3000
echo  Kapatmak icin Ctrl+C veya pencereyi kapatin.
echo.
start "" "http://localhost:3000"
call npm run dev
