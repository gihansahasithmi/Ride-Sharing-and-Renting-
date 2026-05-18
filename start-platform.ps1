# Ride Sharing and Renting Platform Launcher (PowerShell)
Clear-Host
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "         Ride Sharing and Renting Platform - Launcher (PS)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will help you launch the frontend, backend microservices,"
Write-Host "and the MySQL database in separate windows so you can monitor them."
Write-Host ""
Write-Host "[1] Start Everything (MySQL, All 5 Backend Services, and Frontend)"
Write-Host "[2] Start Backend Only (MySQL + All 5 Backend Services)"
Write-Host "[3] Start Frontend Only (React + Vite)"
Write-Host "[4] Start MySQL Database Only (via Docker Compose)"
Write-Host "[5] Exit"
Write-Host ""

$opt = Read-Host "Enter your choice (1-5)"

switch ($opt) {
    "1" {
        Write-Host "`n=== Starting MySQL Database via Docker Compose ===" -ForegroundColor Green
        Set-Location "$PSScriptRoot\RideRenting"
        docker-compose up -d
        Start-Sleep -Seconds 5

        Write-Host "`n=== Building Backend Services ===" -ForegroundColor Green
        mvn clean install -DskipTests

        Write-Host "`n=== Launching Backend Services ===" -ForegroundColor Green
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/gateway-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/auth-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/bike-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/rental-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/admin-service"'

        Write-Host "`n=== Launching Frontend ===" -ForegroundColor Green
        Set-Location "$PSScriptRoot\RideRenting\frontend"
        Start-Process cmd -ArgumentList '/k "npm run dev"'
        
        Write-Host "`nSuccess! All services launched in separate windows." -ForegroundColor Cyan
    }
    "2" {
        Write-Host "`n=== Starting MySQL Database via Docker Compose ===" -ForegroundColor Green
        Set-Location "$PSScriptRoot\RideRenting"
        docker-compose up -d
        Start-Sleep -Seconds 5

        Write-Host "`n=== Building Backend Services ===" -ForegroundColor Green
        mvn clean install -DskipTests

        Write-Host "`n=== Launching Backend Services ===" -ForegroundColor Green
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/gateway-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/auth-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/bike-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/rental-service"'
        Start-Sleep -Seconds 2
        Start-Process cmd -ArgumentList '/k "mvn spring-boot:run -pl backend/admin-service"'
        
        Write-Host "`nBackend services launched in separate windows." -ForegroundColor Cyan
    }
    "3" {
        Write-Host "`n=== Launching Frontend ===" -ForegroundColor Green
        Set-Location "$PSScriptRoot\RideRenting\frontend"
        Start-Process cmd -ArgumentList '/k "npm run dev"'
        Write-Host "`nFrontend launched." -ForegroundColor Cyan
    }
    "4" {
        Write-Host "`n=== Starting MySQL Database via Docker Compose ===" -ForegroundColor Green
        Set-Location "$PSScriptRoot\RideRenting"
        docker-compose up -d
        Write-Host "`nMySQL Database started." -ForegroundColor Cyan
    }
    "5" {
        exit
    }
    Default {
        Write-Host "`nInvalid choice." -ForegroundColor Red
    }
}
Read-Host "Press Enter to exit"
