@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   English Learning App - Khoi dong dev
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Tai tai: https://nodejs.org ^(ban LTS^)
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Docker Desktop. Tai tai: https://www.docker.com/products/docker-desktop
  echo       ^(Hoac tu cai PostgreSQL 15 va sua DATABASE_URL trong .env^)
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/4] Cai dependencies ^(lan dau hoi lau^)...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
) else (
  echo [1/4] Dependencies da co - bo qua.
)

echo [2/4] Khoi dong PostgreSQL ^(Docker^)...
docker compose up -d
if errorlevel 1 (
  echo [LOI] Docker chua chay? Mo Docker Desktop roi chay lai file nay.
  pause
  exit /b 1
)
echo       Cho database san sang...
timeout /t 8 /nobreak >nul

echo [3/4] Tao schema + seed du lieu mau...
call npx prisma migrate dev --name init
call npx prisma db seed

echo [4/4] Khoi dong app tai http://localhost:3000
echo       Admin: admin@example.com / admin12345
echo       ^(Nhan Ctrl+C de dung^)
start "" http://localhost:3000
call npm run dev
pause
