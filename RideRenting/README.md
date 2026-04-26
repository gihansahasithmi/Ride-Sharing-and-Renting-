# Ride Renting Platform

RideRenting is a microservices-based motor bicycle renting platform with a React frontend and Spring Boot backend.

## Architecture

- `frontend`: React + Vite client.
- `backend/auth-service`: registration and login for `USER`, `OWNER`, and `DRIVER`, plus admin login support.
- `backend/bike-service`: owners publish motor bicycle listings and users browse available bikes.
- `backend/rental-service`: hourly rental creation, amount calculation, payment slip upload, and rental status workflow.
- `backend/admin-service`: aggregated statistics and platform-wide details for admins.
- `backend/gateway-service`: single entry point for the frontend.

Each service uses MySQL. The default credentials are already configured from your request:

- username: `root`
- password: `Gihansa@123`

The backend creates these schemas automatically on startup:

- `rr_auth`
- `rr_bikes`
- `rr_rentals`

## Default Admin

- username: `admin`
- password: `Admin@123`

Admins can log in but cannot register.

## Run MySQL

```bash
docker compose up -d
```

## Run The Backend

From the repository root:

```bash
./mvnw -pl backend/auth-service spring-boot:run
./mvnw -pl backend/bike-service spring-boot:run
./mvnw -pl backend/rental-service spring-boot:run
./mvnw -pl backend/admin-service spring-boot:run
./mvnw -pl backend/gateway-service spring-boot:run
```

Windows PowerShell:

```powershell
.\mvnw.cmd -pl backend/auth-service spring-boot:run
.\mvnw.cmd -pl backend/bike-service spring-boot:run
.\mvnw.cmd -pl backend/rental-service spring-boot:run
.\mvnw.cmd -pl backend/admin-service spring-boot:run
.\mvnw.cmd -pl backend/gateway-service spring-boot:run
```

Service ports:

- gateway: `8080`
- auth: `8081`
- bikes: `8082`
- rentals: `8083`
- admin: `8084`

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Implemented Flows

- User, owner, and driver registration.
- User, owner, driver, and admin login.
- Owners can upload motor bicycle information.
- Users can browse bikes and create hourly rentals.
- Rental amount is calculated from `hoursBooked * hourlyRate`.
- Users, admins, owners, and drivers can upload payment slips.
- Admins can view platform statistics, users, bikes, and rentals.

## Notes

- Authentication is session-light and frontend-driven in this scaffold; there is no JWT or Spring Security gateway enforcement yet.
- Payment slips are stored in the rental database as binary data.
- The bike service includes sample listings for initial testing.
