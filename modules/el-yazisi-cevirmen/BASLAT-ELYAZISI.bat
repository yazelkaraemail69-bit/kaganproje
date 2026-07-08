@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo ========================================
echo  El Yazisi Okuyucu ve Cevirici - API
echo ========================================
echo.
if not exist node_modules (
  echo Bagimliliklar yukleniyor...
  call npm install
  if errorlevel 1 (
    echo npm install basarisiz.
    pause
    exit /b 1
  )
)
if not exist .env (
  if exist .env.example (
    copy /Y .env.example .env >nul
    echo .env olusturuldu. OPENROUTER_API_KEY degerini duzenleyin.
  )
)
echo Sunucu: http://localhost:4000
echo KaganProje modulu: http://localhost:3000/elyazisi
echo.
call npm run dev
pause
