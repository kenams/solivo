@echo off
echo Starting Solivo development servers...

start "Solivo Web" cmd /k "cd /d %~dp0web && npm run dev"
start "Solivo Mobile" cmd /k "cd /d %~dp0mobile && npx expo start"

echo.
echo Web:    http://localhost:3000
echo Mobile: Scan QR code with Expo Go
echo API:    http://localhost:3002 (start manually with PostgreSQL DB)
