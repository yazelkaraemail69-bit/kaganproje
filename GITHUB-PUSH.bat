@echo off
chcp 65001 >nul
echo ========================================
echo  KaganProje - GitHub Yukleme
echo ========================================
echo.
set /p GHUSER=GitHub kullanici adiniz: 
if "%GHUSER%"=="" (
  echo Kullanici adi bos olamaz.
  pause
  exit /b 1
)
git remote remove origin 2>nul
git remote add origin https://github.com/%GHUSER%/kaganproje.git
git branch -M main
git push -u origin main
if errorlevel 1 (
  echo Push basarisiz. gh auth login ile giris yapin.
) else (
  echo Basarili! Repo: https://github.com/%GHUSER%/kaganproje
)
pause
