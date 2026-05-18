# Architecture Diagrams

## 1. Microservices Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                                                                   │
│  ├─ App.jsx (Main component - state, routing)                   │
│  ├─ Antigravity.jsx (3D animation)                              │
│  ├─ api.js (API client)                                         │
│  └─ styles.css (All styling)                                    │
│                                                                   │
│  State: currentUser, bikes, rentals, drivers, forms             │
│  Storage: localStorage (ride-renting-user, ride-share-requests) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (Port 8080)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          API Gateway (Spring Cloud Gateway)                      │
│                      Port: 8080                                  │
│                                                                   │
│  Routes requests to microservices                               │
└─────────────────────────────────────────────────────────────────┘
     │              │              │              │
     │              │              │              │
     ▼              ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Auth   │   │  Bike   │   │ Rental  │   │ Admin   │
│ Service │   │ Service │   │ Service │   │ Service │
│         │   │         │   │         │   │         │
│Port8081 │   │Port8082 │   │Port8083 │   │Port8084 │
└────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
     │             │             │             │
     ▼             ▼             ▼             ▼
  ┌──────┐      ┌──────┐      ┌──────┐     ┌──────┐
  │rr_  │      │rr_   │      │rr_   │     │Cross-│
  │auth │      │bike  │      │rental│     │Service
  │ DB  │      │ DB   │      │ DB   │     │Calls │
  └──────┘      └──────┘      └──────┘     └──────┘
```

## 2. Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  rr_auth Database                                                │
├─────────────────────────────────────────────────────────────────┤
│  TABLE: users (Single Table Inheritance)                        │
│  ├─ id (PK, Long)                                               │
│  ├─ username (unique, String)                                   │
│  ├─ email (unique, String)                                      │
│  ├─ fullName (String)                                           │
│  ├─ passwordHash (String) - BCrypt encrypted                    │
│  ├─ role (enum: USER, OWNER, DRIVER, ADMIN)                     │
│  ├─ phoneNumber (String)                                        │
│  ├─ active (boolean)                                            │
│  └─ DISCRIMINATOR (computed from role)                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  rr_bike Database                                                │
├─────────────────────────────────────────────────────────────────┤
│  TABLE: bikes                                                   │
│  ├─ id (PK, Long)                                               │
│  ├─ ownerId (FK→users.id in rr_auth)                            │
│  ├─ ownerName (String)                                          │
│  ├─ brand, model (String)                                       │
│  ├─ registrationNumber (unique, String)                         │
│  ├─ engineCapacityCc (Integer)                                  │
│  ├─ hourlyRate (BigDecimal 10,2)                                │
│  ├─ description (String 1500 chars)                             │
│  ├─ location (String)                                           │
│  ├─ imageUrl, imageData (BLOB)                                  │
│  ├─ imageOriginalFileName, imageContentType                     │
│  └─ status (enum: AVAILABLE, RENTED, UNAVAILABLE)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  rr_rental Database                                              │
├─────────────────────────────────────────────────────────────────┤
│  TABLE: rentals                                                 │
│  ├─ id (PK, Long)                                               │
│  ├─ bikeId (FK→bikes.id in rr_bike)                             │
│  ├─ bikeName, ownerId, userId (Long, String)                    │
│  ├─ hoursBooked (Integer)                                       │
│  ├─ hourlyRate, totalAmount (BigDecimal 10,2)                   │
│  ├─ status (enum: PENDING_PAYMENT, PAYMENT_CONFIRMED,           │
│  │            AWAITING_PICKUP, COMPLETED, CANCELLED)            │
│  ├─ pickupTime, returnTime (LocalDateTime)                      │
│  ├─ paymentReference (String)                                   │
│  ├─ paymentSlip (BLOB, LAZY)                                    │
│  ├─ slipUploadedBy (enum: USER, OWNER)                          │
│  ├─ slipOriginalFileName, slipContentType                       │
│  └─ notes (String 1000 chars)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Authentication Flow

```
┌──────────────────┐
│  Frontend        │
│  Login/Register  │
└────────┬─────────┘
         │
         │ JSON request
         │ (username/email, password, role)
         ▼
┌──────────────────────────────┐
│  API Gateway (8080)          │
│  Route /api/auth/* to 8081   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Auth Service (8081)         │
│                              │
│  AuthController              │
│  ├─ POST /register           │
│  └─ POST /login              │
│                              │
│  AuthService                 │
│  ├─ Validate credentials     │
│  ├─ Create/Find UserAccount  │
│  ├─ Hash password (BCrypt)   │
│  └─ Return UserResponse      │
└────────┬─────────────────────┘
         │
         │ Query/Save
         ▼
    ┌────────────┐
    │ rr_auth DB │
    │  users TB  │
    └────────────┘
         │
         │ JSON response
         │ UserResponse: {id, username, email, role, ...}
         ▼
┌──────────────────┐
│  Frontend        │
│                  │
│  1. Store user   │
│     in localStorage
│  2. Set currentUser
│  3. Load role    │
│     specific data
└──────────────────┘
```

## 4. Bike Creation & Rental Flow

```
BIKE CREATION FLOW:
─────────────────

Owner User                API Gateway              Bike Service          Database
     │                         │                       │                    │
     │─ Fill bike form ───────→│                       │                    │
     │ + Select image file     │                       │                    │
     │                         │─ POST /api/bikes ────→│                    │
     │                         │ (multipart form-data) │                    │
     │                         │                       │─ Validate ────────→│
     │                         │                       │ (registration #)   │
     │                         │                       │←─ OK/CONFLICT ─────│
     │                         │                       │                    │
     │                         │                       │─ Save Bike ───────→│
     │                         │                       │ (imageData as BLOB)│
     │                         │                       │←─ Saved (ID) ──────│
     │                         │                       │                    │
     │                         │←─ BikeResponse ──────│
     │←─ BikeResponse ────────│
     │ (with image URL)        │


RENTAL CREATION FLOW:
────────────────────

User                API Gateway          Rental Service        Bike Service
 │                        │                    │                    │
 │─ Submit rental ───────→│                    │                    │
 │ (bikeId, hours,        │                    │                    │
 │  pickup time)          │                    │                    │
 │                        │─ POST /rentals ───→│                    │
 │                        │                    │                    │
 │                        │                    │─ GET pricing ─────→│
 │                        │                    │ /bikes/{id}/pricing │
 │                        │                    │←─ BikePricingResp ─│
 │                        │                    │                    │
 │                        │                    │ Calculate total:   │
 │                        │                    │ hourlyRate × hours │
 │                        │                    │                    │
 │                        │                    │─ Update bike status→
 │                        │                    │ (AVAILABLE→RENTED) │
 │                        │                    │                    │
 │                        │                    │─ Save Rental ─────→
 │                        │                    │ (status: PENDING_PAYMENT)
 │                        │←─ RentalResponse ──│
 │←─ RentalResponse ─────│
 │ (with rental details)
 │
 │─ Upload payment slip ──→ (multipart)
 │ (PDF/Image file)        PATCH /rentals/{id}/slip
 │
 │ (Owner confirms)──────→ PATCH /rentals/{id}/status
 │                        (status: PAYMENT_CONFIRMED)
 │
 │←─ Rental confirmed ────
```

## 5. Service Layer Communication

```
┌─────────────────────────────┐
│   Client Requests           │
└──────────────┬──────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  API Gateway         │
    │  (Port 8080)         │
    └──────────────────────┘
          │  │  │  │
    ┌─────┘  │  │  └─────────────┐
    │        │  │                │
    ▼        ▼  ▼                ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │ Bike   │ │ Rental │ │ Admin  │
│Service │ │Service │ │Service │ │Service │
│(8081)  │ │(8082)  │ │(8083)  │ │(8084)  │
└────────┘ └────────┘ └────────┘ └────────┘
           │          │          │
           │ RestClient calls:   │
           │                     │
    Rental ←─ Get Bike Pricing ──┘
    Service                       
      │
    Admin ←─ Aggregate Stats ─→ All Services
    Service

Service Communication Pattern:
- RestClient.Builder (Spring 6+)
- Base URL from application.yml (services.*.url)
- Direct HTTP calls between services
- No message queues or event bus
```

## 6. Frontend Component Hierarchy (Current Monolithic)

```
App.jsx (Root Component)
│
├─ State Management (50+ useState hooks)
│  ├─ authMode, currentUser
│  ├─ bikes, ownerBikes, drivers
│  ├─ rentals, dashboard
│  ├─ forms (register, bike, rental, rideShare)
│  └─ UI state (videos, views, feedback)
│
├─ useEffect Hooks
│  ├─ Load bikes on mount
│  ├─ Hydrate role data on user change
│  ├─ Handle image preview
│  └─ localStorage sync
│
├─ Sub-components
│  ├─ IntroVideo (Video overlay)
│  └─ Antigravity (3D particle animation)
│
└─ Render Logic (1000+ lines)
   ├─ Intro screen
   ├─ Auth forms (login/register)
   ├─ Role-based views:
   │  ├─ USER: Browse bikes, create rentals, ride-share
   │  ├─ OWNER: Manage bikes, manage rentals
   │  ├─ DRIVER: Ride-share management
   │  └─ ADMIN: Dashboard, statistics
   └─ Modals/Overlays
```

## 7. Data Flow Summary

```
DATA PERSISTENCE:
─────────────────

Frontend (React)
    │
    ├─ localStorage (persistent)
    │  ├─ ride-renting-user (currentUser)
    │  ├─ ride-share-requests (local simulation)
    │  └─ driver-availability (local simulation)
    │
    └─ API Calls (transient)
       └─ HTTP/JSON to Backend Services
          │
          ├─ Auth Service → MySQL (rr_auth)
          │  └─ User authentication, profile
          │
          ├─ Bike Service → MySQL (rr_bike)
          │  └─ Bike catalog, images (BLOB)
          │
          └─ Rental Service → MySQL (rr_rental)
             └─ Booking, payment slips (BLOB)
```

## 8. Security Architecture (Current)

```
┌──────────────────────────────────────────┐
│         SECURITY CONCERNS                │
├──────────────────────────────────────────┤
│                                          │
│  ❌ NO JWT tokens                       │
│  ❌ NO Bearer authorization headers     │
│  ❌ NO Spring Security filters          │
│  ❌ NO CORS configuration               │
│  ❌ NO rate limiting                    │
│  ❌ NO input validation on backend      │
│  ❌ Passwords hashed (✓ BCrypt) but     │
│     no additional checks                 │
│                                          │
│  ✓ Password encryption (BCrypt)         │
│  ✓ Input validation (Jakarta Bean Val)  │
│  ✓ HTTP error codes (401, 409, 400)     │
│                                          │
│  RECOMMENDATION:                         │
│  → Implement JWT authentication         │
│  → Add Spring Security config           │
│  → Add CORS headers                     │
│  → Add request/response logging         │
└──────────────────────────────────────────┘
```

## 9. User Role Access Matrix

```
┌─────────────┬────────┬────────┬────────┬────────┐
│ Resource    │ USER   │ OWNER  │ DRIVER │ ADMIN  │
├─────────────┼────────┼────────┼────────┼────────┤
│ Browse Bikes│   ✓    │   ✓    │   ✓    │   ✓    │
│ Create Bike │   ✗    │   ✓    │   ✗    │   ✓    │
│ Manage Bike │   ✗    │   ✓    │   ✗    │   ✓    │
│ Create Rent │   ✓    │   ✗    │   ✗    │   ✗    │
│ Manage Rent │   ✓    │   ✓    │   ✗    │   ✓    │
│ Upload Slip │   ✓    │   ✓    │   ✗    │   ✓    │
│ View Driver │   ✓    │   ✗    │   ✗    │   ✓    │
│ Ride-Share  │   ✓    │   ✗    │   ✓    │   ✗    │
│ Dashboard   │   ✗    │   ✗    │   ✗    │   ✓    │
│ View Users  │   ✗    │   ✗    │   ✗    │   ✓    │
└─────────────┴────────┴────────┴────────┴────────┘
```

Note: ✓ Frontend allows, ✗ Frontend hides
      (No server-side role enforcement)
