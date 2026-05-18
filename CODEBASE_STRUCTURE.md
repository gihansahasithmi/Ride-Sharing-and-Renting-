# Ride-Sharing and Renting Platform - Codebase Structure Overview

## 1. BACKEND ARCHITECTURE

### Technology Stack
- **Framework**: Spring Boot (Microservices)
- **Language**: Java
- **Database**: MySQL
- **ORM**: JPA/Hibernate
- **Build**: Maven
- **API Gateway**: Spring Cloud Gateway

### Microservices Architecture

#### **1.1 Auth Service** (Port 8081)
**Location**: `backend/auth-service/`

**Database**: `rr_auth`

**Entity Classes**:
1. **UserAccount** (Base class - Single Table Inheritance)
   - `id` (Long, PK)
   - `username` (String, unique)
   - `email` (String, unique)
   - `fullName` (String)
   - `passwordHash` (String)
   - `role` (UserRole enum: USER, OWNER, DRIVER, ADMIN)
   - `phoneNumber` (String)
   - `active` (boolean)
   
2. **OwnerAccount** (extends UserAccount)
   - DiscriminatorValue: "OWNER"
   - Inherits all UserAccount fields

3. **DriverAccount** (extends UserAccount)
   - DiscriminatorValue: "DRIVER"
   - Inherits all UserAccount fields

4. **AdminAccount** (extends UserAccount)
   - DiscriminatorValue: "ADMIN"
   - Inherits all UserAccount fields

**Inheritance Strategy**: SINGLE_TABLE with @DiscriminatorFormula

**Controllers** (`AuthController`):
```
POST   /api/auth/register      - Register new user (Owner/Driver/User only, not Admin)
POST   /api/auth/login         - Login and retrieve user info
GET    /api/auth/users         - Get all users
GET    /api/auth/stats         - Get user statistics (count by role)
```

**Service Layer** (`AuthService`):
- `register(RegisterRequest)` - Creates user account with role-based instantiation
- `login(LoginRequest)` - Authenticates user, supports default admin fallback
- `getAllUsers()` - Returns all users as UserResponse DTOs
- `getStats()` - Returns counts of users by role

**Repository** (`UserAccountRepository`):
```java
- findByUsername(String)
- findByUsernameIgnoreCaseOrEmailIgnoreCase(String, String)
- existsByUsername(String)
- existsByEmail(String)
- findByRole(UserRole)
```

**Authentication Model**:
- Password stored as hash (PasswordEncoder via Spring Security)
- NO JWT tokens - returns full User object on login
- Client stores user data in localStorage
- User credentials sent in request body (no Authorization headers)

---

#### **1.2 Bike Service** (Port 8082)
**Location**: `backend/bike-service/`

**Database**: `rr_bike`

**Entity Classes**:
1. **Bike**
   - `id` (Long, PK)
   - `ownerId` (Long, FK to UserAccount)
   - `ownerName` (String)
   - `brand` (String)
   - `model` (String)
   - `registrationNumber` (String, unique)
   - `engineCapacityCc` (Integer)
   - `hourlyRate` (BigDecimal, precision=10, scale=2)
   - `description` (String, 1500 chars max)
   - `location` (String)
   - `imageUrl` (String)
   - `imageData` (byte[], BLOB)
   - `imageOriginalFileName` (String)
   - `imageContentType` (String)
   - `status` (BikeStatus enum: AVAILABLE, RENTED, UNAVAILABLE)

2. **BikeStatus** (Enum)
   - AVAILABLE
   - RENTED
   - UNAVAILABLE

**Controllers** (`BikeController`):
```
POST   /api/bikes                      - Create new bike (multipart form-data with image)
GET    /api/bikes                      - Get all available bikes
GET    /api/bikes/owner/{ownerId}      - Get bikes owned by specific owner
GET    /api/bikes/{bikeId}/pricing     - Get bike pricing info
GET    /api/bikes/{bikeId}/image       - Download bike image
PATCH  /api/bikes/{bikeId}/status      - Update bike status
```

**Service Layer** (`BikeService`):
- `createBike(CreateBikeRequest, MultipartFile)` - Create bike with image upload
- `getAvailableBikes()` - Returns bikes with AVAILABLE status
- `getOwnerBikes(Long ownerId)` - Returns all bikes owned by user
- `getPricing(Long bikeId)` - Returns BikePricingResponse
- `getBikeImage(Long bikeId)` - Returns image as Resource
- `updateStatus(Long bikeId, BikeStatus status)` - Update bike status

**Repository** (`BikeRepository`):
```java
- findByStatus(BikeStatus)
- findByOwnerId(Long)
- existsByRegistrationNumber(String)
```

**File Handling**:
- Images stored as BLOB in database
- Image URL generated on save: `{baseUrl}/api/bikes/{bikeId}/image`
- Multipart form-data used for creation

---

#### **1.3 Rental Service** (Port 8083)
**Location**: `backend/rental-service/`

**Database**: `rr_rental`

**Entity Classes**:
1. **Rental**
   - `id` (Long, PK)
   - `bikeId` (Long, FK to Bike)
   - `bikeName` (String)
   - `ownerId` (Long, FK to UserAccount)
   - `userId` (Long, FK to UserAccount - Renter)
   - `userName` (String)
   - `hoursBooked` (Integer)
   - `hourlyRate` (BigDecimal)
   - `totalAmount` (BigDecimal)
   - `status` (RentalStatus enum)
   - `pickupTime` (LocalDateTime)
   - `returnTime` (LocalDateTime)
   - `paymentReference` (String)
   - `paymentSlip` (byte[], BLOB, LAZY fetch)
   - `slipOriginalFileName` (String)
   - `slipContentType` (String)
   - `slipUploadedBy` (SlipUploaderRole enum)
   - `notes` (String, 1000 chars max)

2. **RentalStatus** (Enum)
   - PENDING_PAYMENT
   - PAYMENT_CONFIRMED
   - AWAITING_PICKUP
   - COMPLETED
   - CANCELLED

3. **SlipUploaderRole** (Enum)
   - USER
   - OWNER

**Controllers** (`RentalController`):
```
POST   /api/rentals                           - Create rental (JSON body)
POST   /api/rentals/{rentalId}/slip           - Upload payment slip (multipart)
DELETE /api/rentals/{rentalId}/slip           - Delete payment slip
PATCH  /api/rentals/{rentalId}/status         - Update rental status
GET    /api/rentals                           - Get all rentals (admin view)
GET    /api/rentals/user/{userId}             - Get user's rentals
GET    /api/rentals/owner/{ownerId}           - Get owner's rentals
GET    /api/rentals/{rentalId}/slip           - Download payment slip
GET    /api/rentals/stats                     - Get rental statistics
```

**Service Layer** (`RentalService`):
- `createRental(CreateRentalRequest)` - Create rental (calls Bike Service for pricing)
- `uploadSlip(Long, MultipartFile, SlipUploaderRole, String, String)` - Upload payment proof
- `deleteSlip(Long)` - Remove payment slip
- `updateStatus(Long, RentalStatus, String)` - Update rental status
- `getAllRentals()` - Get all rentals
- `getUserRentals(Long)` - Get user's rentals
- `getOwnerRentals(Long)` - Get owner's rentals
- `getPaymentSlip(Long)` - Return payment slip as Resource
- `getStats()` - Return rental statistics

**Repository** (`RentalRepository`):
```java
- findByUserId(Long)
- findByOwnerId(Long)
- findByStatus(RentalStatus)
```

**Inter-Service Communication**:
- Uses `RestClient` (Spring 6+) to call Bike Service
- Gets pricing from `/api/bikes/{bikeId}/pricing`
- Updates bike status on rental creation

---

#### **1.4 Admin Service** (Port 8084)
**Location**: `backend/admin-service/`

**Controllers** (`AdminController`):
```
GET    /api/admin/dashboard    - Get dashboard with aggregated stats
```

**Service Layer** (`AdminService`):
- `getDashboard()` - Aggregates data from other services:
  - Total users (by role)
  - Total bikes
  - Total rentals
  - Revenue data

**Inter-Service Communication**:
- Calls Auth Service for user stats
- Calls Bike Service for bike stats
- Calls Rental Service for rental/revenue stats

---

#### **1.5 Gateway Service** (Port 8080)
**Location**: `backend/gateway-service/`

**Purpose**: API Gateway routing requests to microservices

**Routes** (Typical):
```
/api/auth/**      → Auth Service (8081)
/api/bikes/**     → Bike Service (8082)
/api/rentals/**   → Rental Service (8083)
/api/admin/**     → Admin Service (8084)
```

---

### Database Configuration

All services use MySQL with following credentials (from application.yml):
```
URL: jdbc:mysql://localhost:3306/rr_{service_name}
Username: root (configurable via DB_USERNAME)
Password: Gihansa@123 (configurable via DB_PASSWORD)
```

**Hibernate Settings**:
- `ddl-auto: update` - Auto-create/update schema
- `format_sql: true` - Format SQL logs
- `open-in-view: false` - No lazy loading after session close

---

## 2. FRONTEND ARCHITECTURE

**Technology Stack**:
- React 18
- Vite (build tool)
- Three.js (3D animations)
- CSS (vanilla)
- No routing library (single-page app with manual state management)

**Location**: `frontend/src/`

### Components and Files

#### **2.1 Main Entry Point**
- **`main.jsx`** - React root render

#### **2.2 Main App Component**
- **`App.jsx`** - Central state management and UI logic
  - **Size**: ~500+ lines of code (monolithic approach)
  - **State Management**: useState + localStorage
  
**Key State Variables**:
```javascript
- authMode ('login' | 'register')
- showVideoIntro (boolean) - Intro video overlay
- currentUser (UserResponse | null)
- registerForm, loginForm, bikeForm, rentalForm, rideShareForm
- bikes, ownerBikes, drivers
- rentals, dashboard
- rideShareRequests (from localStorage)
- driverAvailability (from localStorage)
- userView ('renting' | 'ride-sharing')
```

**Key Functions**:
- `hydrateRoleData(user)` - Load role-specific data after login
- `loadBikes()` - Fetch available bikes
- `loadUsers()` - Get all users
- Role-specific views for USER, OWNER, DRIVER, ADMIN

#### **2.3 3D Animation Component**
- **`Antigravity.jsx`** - Three.js/React-Three-Fiber particle animation
  - Used as visual background/intro effect
  - Parameters: count, magnetRadius, waveSpeed, color, etc.

#### **2.4 Styling**
- **`styles.css`** - All UI styling
  - Forms, cards, buttons, navigation
  - No component-level CSS

### Frontend Views/Pages

Based on `App.jsx` analysis, the application implements the following views:

#### **1. Intro Screen**
- Video overlay with skip button
- Shown on initial page load

#### **2. Authentication Views**
- **Login Form** - Username + Password
- **Register Form** - Username, Email, Full Name, Phone, Role selection
- **Role Options**: USER, OWNER, DRIVER

#### **3. User Dashboard** (after login)
- **For USERS**: 
  - Browse available bikes
  - Create rental bookings
  - View my rentals
  - View available drivers (ride-sharing)
  - Request ride-share from drivers
  
- **For OWNERS**:
  - Create/manage bikes
  - Upload bike images
  - View rental requests for my bikes
  - Manage rental statuses
  - Upload payment confirmations
  
- **For DRIVERS**:
  - View available ride-share requests
  - Set availability status
  - Manage ride-share interactions
  - Define fee for trips
  
- **For ADMINS**:
  - View dashboard with statistics
  - See all rentals
  - See all users
  - System overview

### Data Flow & State Management

#### **Authentication Flow**:
1. User submits login/register form
2. API call to `/api/auth/login` or `/api/auth/register`
3. Receives `UserResponse` object
4. Stores in `localStorage` with key `"ride-renting-user"`
5. Calls `hydrateRoleData(currentUser)` to load role-specific data
6. No JWT tokens - full user object persisted

#### **Bike Management Flow**:
1. Owner fills `bikeForm` + selects image
2. Image converted to FormData
3. POST to `/api/bikes` (multipart/form-data)
4. Returns `BikeResponse` with image URL
5. UI updates to show new bike

#### **Rental Flow**:
1. User selects bike and fill rental form (hours, pickup time)
2. POST to `/api/rentals` with CreateRentalRequest
3. Backend calls Bike Service for pricing
4. Returns RentalResponse with status PENDING_PAYMENT
5. User can upload payment slip
6. Owner/Admin can confirm payment and update status

#### **Ride-Share Flow**:
1. USER submits ride-share request (current location, destination)
2. Stored in `localStorage` (not persisted to backend)
3. DRIVERS see requests, can set fee/response
4. In-memory coordination (no database persistence)

### API Endpoints Called from Frontend

**Auth Endpoints**:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users` - Get all users (for driver list)
- `GET /api/auth/stats` - (potentially unused)

**Bike Endpoints**:
- `GET /api/bikes` - Get available bikes
- `GET /api/bikes/owner/{ownerId}` - Get owner's bikes
- `POST /api/bikes` - Create bike with image
- `GET /api/bikes/{bikeId}/image` - Download image

**Rental Endpoints**:
- `POST /api/rentals` - Create rental
- `GET /api/rentals/user/{userId}` - User's rentals
- `GET /api/rentals/owner/{ownerId}` - Owner's rentals
- `GET /api/rentals` - All rentals
- `POST /api/rentals/{rentalId}/slip` - Upload payment slip
- `DELETE /api/rentals/{rentalId}/slip` - Delete slip
- `GET /api/rentals/{rentalId}/slip` - Download slip
- `PATCH /api/rentals/{rentalId}/status` - Update status

**Admin Endpoints**:
- `GET /api/admin/dashboard` - Dashboard stats

### API Client (`api.js`)

Simple API client with base URL: `http://localhost:8080` (Gateway)

Key functions:
```javascript
- register(payload)
- login(payload)
- getUsers()
- getBikes()
- getOwnerBikes(ownerId)
- createBike(payload, imageFile)
- createRental(payload)
- getUserRentals(userId)
- getOwnerRentals(ownerId)
- getAllRentals()
- uploadSlip(rentalId, uploaderRole, paymentReference, notes, file)
- deleteSlip(rentalId)
- updateRentalStatus(rentalId, status, notes)
- getDashboard()
```

---

## 3. SUMMARY TABLE

| Component | Entity/Class | Database | Role | Key Methods |
|-----------|---|---|---|---|
| **Auth Service** | UserAccount (base) + subclasses | rr_auth | User management | register, login, getAllUsers |
| **Bike Service** | Bike | rr_bike | Bike catalog | createBike, getAvailableBikes, getOwnerBikes |
| **Rental Service** | Rental | rr_rental | Booking system | createRental, uploadSlip, updateStatus |
| **Admin Service** | - | Cross-service | Dashboard | getDashboard |
| **Frontend** | React components | localStorage | UI/UX | Login, Browse, Book, Manage |

---

## 4. USER ROLES AND CAPABILITIES

| Role | Can Do | Cannot Do |
|------|--------|----------|
| **USER** | Browse bikes, Book rentals, Request rides | Create bikes, Manage rentals |
| **OWNER** | Create bikes, Manage rentals, Confirm payment | Book rentals, Drive |
| **DRIVER** | Respond to ride requests, Set availability | Create bikes, Book rentals |
| **ADMIN** | View all data, Full dashboard access | Self-register (created internally) |

---

## 5. AUTHENTICATION & AUTHORIZATION

- **No JWT implementation** - Full user object returned on login
- **Password Storage**: BCrypt hashing via PasswordEncoder
- **Default Admin**: Can login with hardcoded credentials (see AuthService.isDefaultAdminLogin)
- **Session**: Client-side localStorage, no server-side session
- **Authorization**: Frontend checks `currentUser.role`, no backend role checks visible

---

## 6. FILE STORAGE

**Bike Images**:
- Stored as BLOB in Bike entity
- Retrieved via `/api/bikes/{bikeId}/image`
- Multipart upload on bike creation

**Payment Slips**:
- Stored as BLOB in Rental entity (LAZY fetch)
- Retrieved via `/api/rentals/{rentalId}/slip`
- Multipart upload on confirmation

---

## 7. KEY OBSERVATIONS

### Backend Strengths:
✅ Proper microservices separation  
✅ JPA/Hibernate ORM for data persistence  
✅ Single-table inheritance for user hierarchy  
✅ Inter-service communication via RestClient  
✅ Proper repository pattern  

### Backend Concerns:
⚠️ No API authentication/authorization (no security filters)  
⚠️ No JWT tokens (stateless auth missing)  
⚠️ CORS likely needs configuration  
⚠️ File upload validation could be stricter  

### Frontend Strengths:
✅ Clean API abstraction layer  
✅ localStorage for state persistence  
✅ Role-based view switching  
✅ 3D animations for UX  

### Frontend Concerns:
⚠️ Monolithic App.jsx (should be split into components)  
⚠️ No routing library (everything in one component)  
⚠️ Ride-share feature not persisted to backend  
⚠️ No error boundaries or error handling  
⚠️ No token refresh mechanism  
⚠️ localStorage keys hardcoded  

---

## 8. SUGGESTED IMPROVEMENTS

### High Priority:
1. Implement JWT authentication
2. Add API security (Spring Security filters)
3. Split App.jsx into smaller components
4. Add React Router for navigation
5. Add proper error handling
6. Implement CORS configuration

### Medium Priority:
1. Add input validation on frontend
2. Add loading states for API calls
3. Implement refresh token mechanism
4. Add ride-share persistence to backend
5. Add unit tests

### Low Priority:
1. Add logging/monitoring
2. Add caching strategies
3. Optimize database queries
4. Add pagination for large datasets
5. Docker setup refinement
