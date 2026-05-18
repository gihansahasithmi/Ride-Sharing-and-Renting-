# Ride-Sharing and Renting Platform - Complete Documentation

## 📚 Documentation Index

This project includes comprehensive documentation covering architecture, codebase structure, and UML diagrams.

### 1. [README.md](README.md)
- Project overview and quick start guide
- Installation instructions
- Running the application

### 2. [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
Contains ASCII-style architecture diagrams:
- Microservices architecture overview
- Database schema overview
- Authentication flow
- Bike creation & rental flow
- Service layer communication
- Frontend component hierarchy
- Data flow summary
- Security architecture
- User role access matrix

### 3. [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md)
Detailed codebase documentation:
- **Backend Architecture**
  - Auth Service (Port 8081) - User management
  - Bike Service (Port 8082) - Bike catalog
  - Rental Service (Port 8083) - Booking system
  - Admin Service (Port 8084) - Dashboard
  - Gateway Service (Port 8080) - API routing
  
- **Frontend Architecture**
  - React component structure
  - State management approach
  - API client implementation
  - Role-based views
  
- **Database Configuration**
  - MySQL schema details
  - Hibernate settings
  - BLOB storage for images

- **Summary Tables**
  - Component overview
  - User roles and capabilities
  - Authentication & authorization
  - File storage strategy

### 4. [UML_DIAGRAMS.md](UML_DIAGRAMS.md) ⭐ NEW
Comprehensive UML diagrams in Mermaid format:

#### Class Diagrams
- Auth Service domain model (UserAccount hierarchy)
- Bike Service domain model
- Rental Service domain model
- Service layer architecture
- DTO (Data Transfer Object) classes

#### Sequence Diagrams
- User registration and login flow
- Bike creation and listing flow
- Rental creation and payment flow
- Admin dashboard flow

#### Architecture Diagrams
- Component diagram (microservices)
- Deployment diagram
- API request/response flow
- Technology stack overview

#### Entity-Relationship Diagram
- Database schema with all tables and relationships
- Primary keys, foreign keys, constraints

#### Use Case Diagram
- All user roles and their capabilities
- System use cases

#### State Diagrams
- Rental status state machine
- Bike status state machine
- User authentication state machine

---

## 📋 Quick Navigation

### For Architecture Understanding
1. Start with [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Section 1 (Microservices)
2. Review [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Component & Deployment Diagrams
3. Study [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Technology Stack sections

### For API Development
1. Read [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) - Microservices API Endpoints
2. Review [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Sequence Diagrams
3. Check [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - API Request/Response Flow

### For Database Development
1. Check [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) - Database Configuration
2. Review [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Entity-Relationship Diagram
3. Study [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Section 2 (Database Schema)

### For Frontend Development
1. Read [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) - Frontend Architecture
2. Review [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Section 6 (Frontend Hierarchy)
3. Check [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Frontend Technology Stack

### For User Requirements
1. Review [UML_DIAGRAMS.md](UML_DIAGRAMS.md) - Use Case Diagram
2. Check [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) - User Roles and Capabilities
3. Study [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Section 9 (Role Access Matrix)

---

## 🏗️ System Architecture Overview

### Technology Stack

**Backend:**
- Java 17+ with Spring Boot 3.x
- Spring Cloud Gateway for API routing
- Spring Data JPA with Hibernate
- MySQL 5.7+ database
- Maven for build management
- Docker for containerization

**Frontend:**
- React 18.x with Hooks
- Vite as build tool
- Three.js for 3D animations
- Vanilla CSS styling
- localStorage for client-side persistence

### Microservices

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| Auth Service | 8081 | rr_auth | User authentication and management |
| Bike Service | 8082 | rr_bike | Bike catalog and inventory |
| Rental Service | 8083 | rr_rental | Rental bookings and payments |
| Admin Service | 8084 | - | Dashboard and statistics |
| Gateway | 8080 | - | API routing and load balancing |

### User Roles

- **USER** - Browse bikes, create rentals, request rides
- **OWNER** - Create bike listings, manage rentals, confirm payments
- **DRIVER** - Offer ride services, set availability
- **ADMIN** - View system dashboard, manage all resources

---

## 🔄 Key Workflows

### Authentication
1. User registers/logs in via React frontend
2. Credentials sent to Auth Service (8081)
3. Password verified with BCrypt hashing
4. UserResponse returned with user ID and role
5. User data stored in localStorage
6. Role-specific views loaded

### Bike Management
1. Owner creates bike listing with image
2. Image uploaded as multipart form-data
3. Image stored as BLOB in rr_bike database
4. Image retrieved via dedicated endpoint
5. Available bikes displayed to all users

### Rental Process
1. User selects bike and booking details
2. Rental created with PENDING_PAYMENT status
3. Bike status updated to RENTED
4. User uploads payment slip as BLOB
5. Owner reviews and confirms payment
6. Rental moves to AWAITING_PICKUP status
7. After rental period, status updated to COMPLETED

### Admin Dashboard
1. Admin accesses dashboard
2. Admin Service aggregates data from all services
3. Statistics calculated and displayed
4. Admin can view all users, bikes, rentals

---

## 📊 Database Schema Summary

### rr_auth Database
**users table** (Single Table Inheritance)
- Stores users of all roles (USER, OWNER, DRIVER, ADMIN)
- Password hashed with BCrypt
- Role discriminator determines user type

### rr_bike Database
**bikes table**
- Bike listings with all specifications
- Images stored as BLOB
- Hourly rate and availability status
- References owner from rr_auth

### rr_rental Database
**rentals table**
- Rental bookings with status tracking
- Payment slips stored as BLOB (lazy loaded)
- References bike from rr_bike and users from rr_auth
- Tracks rental progress through multiple states

---

## 🔐 Security Notes

**Current Implementation:**
- ✅ Password hashing with BCrypt
- ✅ Input validation with Jakarta Bean Validation
- ✅ HTTP error codes (401, 409, 400)

**Recommended Improvements:**
- ❌ No JWT authentication (currently returns full user object)
- ❌ No Spring Security filters configured
- ❌ No CORS headers
- ❌ No rate limiting
- ❌ No server-side role enforcement

See [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md#8-security-architecturecurrent) for details.

---

## 🚀 Getting Started

### Setup & Development

1. **Backend Setup**
   ```bash
   cd RideRenting
   mvn clean install
   docker-compose up  # Starts all services
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev  # Starts React dev server
   ```

3. **Access Application**
   - Frontend: http://localhost:5173 (or Vite port)
   - API Gateway: http://localhost:8080
   - Auth Service: http://localhost:8081
   - Bike Service: http://localhost:8082
   - Rental Service: http://localhost:8083
   - Admin Service: http://localhost:8084

### Testing Accounts

**Default Admin:**
- Username: admin
- Password: admin123 (if configured)

**Create Test Users:**
1. Use frontend registration form
2. Roles: USER, OWNER, DRIVER (ADMIN must be created manually)

---

## 📈 Key Observations

### Strengths ✅
- Clean microservices separation
- Proper ORM implementation
- Single-table inheritance for user hierarchy
- Image/file storage as BLOB
- Role-based frontend views
- API client abstraction layer
- localStorage for state persistence
- Docker containerization

### Areas for Improvement ⚠️
- No JWT authentication (currently returns full user object)
- No Spring Security filters
- Monolithic App.jsx (needs component splitting)
- No React Router (single-page app)
- Ride-share feature not persisted to backend
- No error boundaries or error handling
- No backend role enforcement
- Limited input validation on backend

---

## 📝 Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| README.md | 1.0 | May 8, 2026 | ✅ Complete |
| ARCHITECTURE_DIAGRAMS.md | 1.0 | May 8, 2026 | ✅ Complete |
| CODEBASE_STRUCTURE.md | 1.0 | May 8, 2026 | ✅ Complete |
| UML_DIAGRAMS.md | 1.0 | May 8, 2026 | ✅ Complete |

---

## 👥 Contributing

When making changes to the system:
1. Update relevant documentation files
2. Add UML diagrams if adding new features
3. Update sequence diagrams for new workflows
4. Keep class diagrams current with code changes

---

## 📞 Support

For questions about:
- **Architecture** - See [UML_DIAGRAMS.md](UML_DIAGRAMS.md)
- **Specific Services** - See [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md)
- **Workflows** - See [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- **Database** - See [UML_DIAGRAMS.md](UML_DIAGRAMS.md#entity-relationship-diagram)
- **API Endpoints** - See [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md)

---

## 📦 Documentation Files Location

```
project-root/
├── README.md                          # Project overview
├── ARCHITECTURE_DIAGRAMS.md           # ASCII architecture diagrams
├── CODEBASE_STRUCTURE.md              # Detailed codebase documentation
├── UML_DIAGRAMS.md                    # Complete UML diagrams (NEW)
├── DOCUMENTATION_INDEX.md             # This file (NEW)
├── RideRenting/
│   ├── backend/
│   │   ├── auth-service/
│   │   ├── bike-service/
│   │   ├── rental-service/
│   │   ├── admin-service/
│   │   └── gateway-service/
│   └── frontend/
└── docker-compose.yml
```

---

## 🎯 Next Steps

1. **For New Developers**
   - Read this documentation index first
   - Study the UML diagrams to understand architecture
   - Review the relevant service documentation
   - Set up local development environment

2. **For Feature Development**
   - Review use case diagram for feature scope
   - Check sequence diagrams for workflow
   - Review class diagrams for data models
   - Update documentation after implementation

3. **For System Improvements**
   - Review "Areas for Improvement" section
   - Consult UML diagrams for impact analysis
   - Test changes against all documented workflows
   - Update diagrams to reflect changes

---

*Last Updated: May 8, 2026*  
*Documentation Format: Markdown with Mermaid Diagrams*  
*All UML diagrams are rendered as Mermaid code blocks*
