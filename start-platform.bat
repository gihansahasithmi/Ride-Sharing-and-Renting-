@echo off
title Ride Sharing and Renting Platform Launcher
cls
echo =====================================================================
echo          Ride Sharing and Renting Platform - Launcher
echo =====================================================================
echo.
echo This script will help you launch the frontend, backend microservices,
echo and the MySQL database in separate windows so you can monitor them.
echo.
echo [1] Start Everything (MySQL, All 5 Backend Services, and Frontend)
echo [2] Start Backend Only (MySQL + All 5 Backend Services)
echo [3] Start Frontend Only (React + Vite)
echo [4] Start MySQL Database Only (via Docker Compose)
echo [5] Exit
echo.
set /p opt="Enter your choice (1-5): "

if "%opt%"=="1" goto start_all
if "%opt%"=="2" goto start_backend
if "%opt%"=="3" goto start_frontend
if "%opt%"=="4" goto start_mysql
if "%opt%"=="5" goto exit
echo Invalid choice.
pause
goto exit

:start_all
echo.
echo === Starting MySQL Database via Docker Compose ===
cd RideRenting
docker-compose up -d
echo Waiting 5 seconds for MySQL to initialize...
timeout /t 5 >nul

echo.
echo === Building Backend Services ===
call mvn clean install -DskipTests

echo.
echo === Launching Backend Services ===
start "Gateway Service (Port 8080)" cmd /k "mvn spring-boot:run -pl backend/gateway-service"
timeout /t 2 >nul
start "Auth Service (Port 8081)" cmd /k "mvn spring-boot:run -pl backend/auth-service"
timeout /t 2 >nul
start "Bike Service (Port 8082)" cmd /k "mvn spring-boot:run -pl backend/bike-service"
timeout /t 2 >nul
start "Rental Service (Port 8083)" cmd /k "mvn spring-boot:run -pl backend/rental-service"
timeout /t 2 >nul
start "Admin Service (Port 8084)" cmd /k "mvn spring-boot:run -pl backend/admin-service"

echo.
echo === Launching Frontend ===
cd frontend
start "Frontend (Port 5173)" cmd /k "npm run dev"

echo.
echo Success! All services launched in separate windows.
echo Keep those windows open to keep the application running.
pause
goto exit

:start_backend
echo.
echo === Starting MySQL Database via Docker Compose ===
cd RideRenting
docker-compose up -d
echo Waiting 5 seconds for MySQL to initialize...
timeout /t 5 >nul

echo.
echo === Building Backend Services ===
call mvn clean install -DskipTests

echo.
echo === Launching Backend Services ===
start "Gateway Service (Port 8080)" cmd /k "mvn spring-boot:run -pl backend/gateway-service"
timeout /t 2 >nul
start "Auth Service (Port 8081)" cmd /k "mvn spring-boot:run -pl backend/auth-service"
timeout /t 2 >nul
start "Bike Service (Port 8082)" cmd /k "mvn spring-boot:run -pl backend/bike-service"
timeout /t 2 >nul
start "Rental Service (Port 8083)" cmd /k "mvn spring-boot:run -pl backend/rental-service"
timeout /t 2 >nul
start "Admin Service (Port 8084)" cmd /k "mvn spring-boot:run -pl backend/admin-service"

echo.
echo Backend services launched in separate windows.
pause
goto exit

:start_frontend
echo.
echo === Launching Frontend ===
cd RideRenting\frontend
start "Frontend (Port 5173)" cmd /k "npm run dev"
echo Frontend launched.
pause
goto exit

:start_mysql
echo.
echo === Starting MySQL Database via Docker Compose ===
cd RideRenting
docker-compose up -d
echo MySQL Database started.
pause
goto exit

:exit
exit
