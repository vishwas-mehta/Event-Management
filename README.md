# 🎫 Event Management System

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)

**A production-ready, full-stack event management platform built with the MERN stack + TypeScript**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Testing Workflow](#-testing-workflow)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

The **Event Management System** is a comprehensive, production-ready platform that enables seamless event creation, management, and booking. Built with modern web technologies and best practices, it features a robust multi-role architecture supporting Admins, Event Organizers, and Attendees.

### 🎯 Key Highlights

- **Full-Stack TypeScript** - Type-safe development from database to UI
- **Multi-Role Architecture** - Admin, Organizer, and Attendee roles with fine-grained permissions
- **Advanced Ticketing System** - Support for multiple ticket types, pricing tiers, and capacity management
- **Real-Time Availability** - Prevent overbooking with database transactions
- **Smart Event Discovery** - Advanced search, filtering, and pagination
- **Review System** - Verified attendee reviews with ratings
- **Responsive Design** - Mobile-first UI with React Bootstrap
- **Production-Ready** - JWT authentication, input validation, error handling, and security best practices

---

## ✨ Features

### 👥 Multi-Role System

#### 🔐 Admin
- **Dashboard Analytics** - View platform statistics and metrics
- **User Management** - Manage all users, update statuses, and permissions
- **Organizer Approval** - Review and approve/reject organizer registrations
- **Event Moderation** - Handle reported events and content moderation
- **System Oversight** - Monitor platform health and activity

#### 🎪 Event Organizer
- **Event Creation** - Create events with rich details (title, description, dates, location, categories)
- **Ticket Management** - Create multiple ticket types with different pricing and capacities
- **Attendee Management** - View and manage event attendees
- **Dashboard Analytics** - Track bookings, revenue, and event performance
- **Event Editing** - Update event details and ticket information
- **Approval Workflow** - Registration requires admin approval for quality control

#### 🎟️ Attendee
- **Event Discovery** - Browse events with advanced search and filters
- **Smart Filtering** - Filter by category, location, date range, price, and availability
- **Ticket Booking** - Book tickets with real-time availability checking
- **Booking Management** - View, manage, and cancel bookings
- **Attendance Tracking** - Mark attendance at events
- **Review System** - Leave reviews and ratings for attended events
- **Waitlist** - Join waitlists for sold-out events

### 🚀 Core Functionality

- **🔍 Advanced Search** - Full-text search across events with multiple filters
- **📊 Pagination** - Efficient data loading with customizable page sizes
- **🎫 Dynamic Pricing** - Support for free and paid tickets
- **⏳ Waitlist System** - Queue management for sold-out events
- **⭐ Review System** - Verified attendee reviews with media support
- **🔐 JWT Authentication** - Secure token-based authentication
- **🛡️ Role-Based Access Control (RBAC)** - Fine-grained permissions
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🔔 Real-Time Updates** - Live availability and booking status
- **📈 Analytics Dashboard** - Comprehensive metrics for organizers and admins

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL (v13+)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator, class-validator
- **Security:** CORS, helmet (recommended for production)

### Frontend
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM v7
- **UI Framework:** React Bootstrap 2.10
- **Icons:** Bootstrap Icons
- **HTTP Client:** Axios
- **Form Management:** React Hook Form
- **Date Handling:** date-fns
- **State Management:** React Context API

### Development Tools
- **Package Manager:** npm
- **Dev Server:** ts-node-dev (backend), Vite (frontend)
- **Type Checking:** TypeScript strict mode
- **Linting:** ESLint
- **Version Control:** Git

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Admin    │  │ Organizer  │  │  Attendee  │            │
│  │    UI      │  │     UI     │  │     UI     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                         ↓                                    │
│              React + TypeScript + Vite                       │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js Middleware Stack                         │  │
│  │  • CORS  • JWT Auth  • Validation  • Error Handler  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Auth     │  │   Event    │  │  Booking   │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Admin    │  │  Review    │  │  Waitlist  │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│                        TypeORM                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Entities: User, Event, Booking, Review, Category   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│                      PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action → React Component → API Call (Axios) 
    → Express Route → Middleware (Auth/Validation) 
    → Controller → Service Layer → TypeORM Repository 
    → PostgreSQL → Response Chain (reverse)
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** >= 16.x ([Download](https://nodejs.org/))
- **PostgreSQL** >= 13.x ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/event-management-system.git
cd event-management-system
```

#### 2. Backend Setup

```bash
# Install backend dependencies
npm install

# Create PostgreSQL database
psql -U postgres
CREATE DATABASE event_management;
\q

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Seed the database (creates admin user and categories)
npm run seed
```

**Default Admin Credentials:**
- Email: `admin@eventapp.com`
- Password: `Admin@123456`

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if needed (default: VITE_API_URL=http://localhost:5000/api)
```

#### 4. Run the Application

**Terminal 1 - Backend:**
```bash
# From project root
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
# From frontend directory
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

#### 5. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All authenticated routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints Overview

#### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user | Private |
| PUT | `/profile` | Update profile | Private |
| POST | `/logout` | Logout user | Private |

#### 👑 Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard statistics |
| GET | `/pending-organizers` | List pending organizer approvals |
| POST | `/organizers/:id/approve` | Approve organizer |
| POST | `/organizers/:id/reject` | Reject organizer |
| GET | `/reported-events` | List reported events |
| POST | `/reports/:id/resolve` | Resolve event report |
| DELETE | `/events/:id` | Delete any event |
| GET | `/users` | List all users |
| PATCH | `/users/:id/status` | Update user status |

#### 🎪 Organizer (`/api/organizer`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Organizer dashboard |
| GET | `/events` | List my events |
| POST | `/events` | Create new event |
| GET | `/events/:id` | Get event details |
| PUT | `/events/:id` | Update event |
| DELETE | `/events/:id` | Delete event |
| GET | `/events/:id/attendees` | List event attendees |
| POST | `/events/:eventId/ticket-types` | Add ticket type |
| PUT | `/ticket-types/:id` | Update ticket type |
| DELETE | `/ticket-types/:id` | Delete ticket type |

#### 🎟️ Events (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List/search events | Public |
| GET | `/:id` | Get event details | Public |
| GET | `/categories` | List categories | Public |
| POST | `/:id/report` | Report event | Attendee |
| GET | `/:eventId/reviews` | Get reviews | Public |

#### 🎫 Attendee (`/api/attendee`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Book tickets |
| GET | `/bookings` | List my bookings |
| GET | `/bookings/:id` | Get booking details |
| DELETE | `/bookings/:id` | Cancel booking |
| POST | `/bookings/:id/attend` | Mark attendance |
| POST | `/events/:eventId/reviews` | Create review |
| PUT | `/reviews/:id` | Update review |
| DELETE | `/reviews/:id` | Delete review |
| POST | `/events/:eventId/waitlist` | Join waitlist |
| DELETE | `/events/:eventId/waitlist` | Leave waitlist |
| GET | `/waitlists` | List my waitlists |

### Example API Calls

#### Register as Organizer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "organizer",
    "phoneNumber": "+1234567890"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eventapp.com",
    "password": "Admin@123456"
  }'
```

#### Create Event (Organizer)
```bash
curl -X POST http://localhost:5000/api/organizer/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2025",
    "description": "Annual technology conference",
    "startDateTime": "2025-06-01T09:00:00Z",
    "endDateTime": "2025-06-01T18:00:00Z",
    "location": "San Francisco",
    "categoryId": "<category_uuid>",
    "capacity": 500,
    "bannerImage": "https://example.com/banner.jpg"
  }'
```

#### Search Events
```bash
curl "http://localhost:5000/api/events?search=tech&category=technology&page=1&limit=10"
```

For complete API documentation, see [API_REFERENCE.md](./API_REFERENCE.md)

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │         │    Event     │         │  Category   │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │────┐    │ id (PK)      │    ┌────│ id (PK)     │
│ email       │    │    │ title        │    │    │ name        │
│ password    │    │    │ description  │    │    │ description │
│ firstName   │    │    │ startDateTime│    │    │ slug        │
│ lastName    │    │    │ endDateTime  │    │    └─────────────┘
│ role        │    │    │ location     │    │
│ status      │    │    │ capacity     │    │
│ phoneNumber │    │    │ organizerId ─┼────┘
└─────────────┘    │    │ categoryId ──┼────────┘
                   │    │ bannerImage  │
                   │    │ isPublished  │
                   │    └──────────────┘
                   │           │
                   │           │
                   │    ┌──────────────┐
                   │    │ TicketType   │
                   │    ├──────────────┤
                   │    │ id (PK)      │
                   │    │ eventId (FK) │
                   │    │ name         │
                   │    │ price        │
                   │    │ capacity     │
                   │    │ available    │
                   │    └──────────────┘
                   │           │
                   │           │
                   │    ┌──────────────┐
                   └────│   Booking    │
                        ├──────────────┤
                        │ id (PK)      │
                        │ userId (FK)  │
                        │ eventId (FK) │
                        │ ticketTypeId │
                        │ quantity     │
                        │ totalPrice   │
                        │ status       │
                        │ reference    │
                        └──────────────┘
                               │
                               │
                        ┌──────────────┐
                        │    Review    │
                        ├──────────────┤
                        │ id (PK)      │
                        │ userId (FK)  │
                        │ eventId (FK) │
                        │ rating       │
                        │ comment      │
                        │ images       │
                        └──────────────┘
```

### Main Entities

- **User** - All system users (Admin, Organizer, Attendee)
- **Event** - Event information and details
- **Category** - Event categories (Music, Sports, Technology, etc.)
- **TicketType** - Multiple ticket types per event with pricing
- **Booking** - Ticket bookings with capacity management
- **Review** - Verified attendee reviews with ratings
- **Waitlist** - Queue for sold-out events
- **ReportedEvent** - Event reports for moderation

For detailed entity documentation, see [DATABASE_ENTITIES_GUIDE.md](./DATABASE_ENTITIES_GUIDE.md)

---

## 📁 Project Structure

```
event-management-system/
├── backend/
│   ├── src/
│   │   ├── config/              # Database & environment configuration
│   │   │   ├── database.ts      # TypeORM data source
│   │   │   └── environment.ts   # Environment variables
│   │   ├── entities/            # TypeORM entities
│   │   │   ├── User.ts
│   │   │   ├── Event.ts
│   │   │   ├── Category.ts
│   │   │   ├── TicketType.ts
│   │   │   ├── Booking.ts
│   │   │   ├── Review.ts
│   │   │   ├── Waitlist.ts
│   │   │   └── ReportedEvent.ts
│   │   ├── controllers/         # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── organizer.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   └── attendee.controller.ts
│   │   ├── services/            # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── organizer.service.ts
│   │   │   ├── event.service.ts
│   │   │   └── attendee.service.ts
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── organizer.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   └── attendee.routes.ts
│   │   ├── middlewares/         # Express middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── validators/          # Input validation schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── event.validator.ts
│   │   │   └── booking.validator.ts
│   │   ├── utils/               # Helper functions
│   │   │   ├── jwt.util.ts
│   │   │   └── password.util.ts
│   │   ├── seeds/               # Database seeders
│   │   │   └── index.ts
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Server entry point
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # API integration layer
│   │   │   ├── axios.ts         # Axios instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── events.api.ts
│   │   │   ├── organizer.api.ts
│   │   │   ├── attendee.api.ts
│   │   │   └── admin.api.ts
│   │   ├── components/          # Reusable components
│   │   │   ├── Common/
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── ErrorAlert.tsx
│   │   │   │   └── Pagination.tsx
│   │   │   ├── Events/
│   │   │   │   └── EventCard.tsx
│   │   │   └── Layout/
│   │   │       ├── Navbar.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── MainLayout.tsx
│   │   ├── contexts/            # React Contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/               # Page components
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── Home/
│   │   │   │   └── HomePage.tsx
│   │   │   ├── Events/
│   │   │   │   ├── EventsPage.tsx
│   │   │   │   └── EventDetailsPage.tsx
│   │   │   ├── Admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── PendingOrganizersPage.tsx
│   │   │   │   ├── ManageUsersPage.tsx
│   │   │   │   └── ReportedEventsPage.tsx
│   │   │   ├── Organizer/
│   │   │   │   ├── OrganizerDashboard.tsx
│   │   │   │   ├── CreateEventPage.tsx
│   │   │   │   ├── EditEventPage.tsx
│   │   │   │   └── ManageEventPage.tsx
│   │   │   └── Attendee/
│   │   │       ├── AttendeeDashboard.tsx
│   │   │       └── MyBookingsPage.tsx
│   │   ├── types/               # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── dateFormat.ts
│   │   │   ├── priceFormat.ts
│   │   │   └── validation.ts
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json
│   ├── vite.config.ts           # Vite configuration
│   └── tsconfig.json            # TypeScript config
│
├── docs/                        # Additional documentation
│   ├── API_REFERENCE.md
│   ├── DATABASE_ENTITIES_GUIDE.md
│   ├── FRONTEND_COMPLETE_GUIDE.md
│   └── TROUBLESHOOTING_GUIDE.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=event_management
DB_SYNCHRONIZE=true  # Set to false in production!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ **Security Note:** Never commit `.env` files to version control. Use `.env.example` as a template.

---

## 🧪 Testing Workflow

Follow this workflow to test all features:

### 1. Admin Setup
```bash
# Use seeded admin credentials
Email: admin@eventapp.com
Password: Admin@123456
```

### 2. Register as Organizer
1. Navigate to `/register`
2. Select "Event Organizer" role
3. Fill in details and submit
4. Note: Account will be in "pending" status

### 3. Admin Approves Organizer
1. Login as admin
2. Navigate to "Pending Organizers"
3. Approve the organizer registration

### 4. Organizer Creates Event
1. Login as organizer
2. Navigate to "Create Event"
3. Fill in event details
4. Submit (auto-creates default ticket)

### 5. Register as Attendee
1. Logout
2. Register with "Attendee" role
3. Auto-approved and logged in

### 6. Attendee Books Tickets
1. Browse events
2. Click on event
3. Select ticket type and quantity
4. Confirm booking

### 7. Mark Attendance & Review
1. Navigate to "My Bookings"
2. Mark attendance for past events
3. Leave a review with rating

---

## 🚀 Deployment

### Production Checklist

#### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Use database migrations for schema changes
- [ ] Configure proper CORS origin
- [ ] Use strong JWT secret (generate with `openssl rand -base64 32`)
- [ ] Enable SSL for database connection
- [ ] Set up proper logging (Winston, Morgan)
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up monitoring (PM2, New Relic, DataDog)
- [ ] Configure environment variables securely
- [ ] Enable helmet for security headers
- [ ] Set up automated backups

#### Frontend
- [ ] Build production bundle (`npm run build`)
- [ ] Configure production API URL
- [ ] Enable source maps for debugging
- [ ] Optimize images and assets
- [ ] Configure CDN for static assets
- [ ] Set up error tracking (Sentry)
- [ ] Enable HTTPS
- [ ] Configure caching headers
- [ ] Optimize bundle size

### Deployment Platforms

#### Backend
- **Heroku** - Easy deployment with PostgreSQL add-on
- **DigitalOcean** - App Platform or Droplet
- **AWS** - EC2, RDS, Elastic Beanstalk
- **Railway** - Modern deployment platform
- **Render** - Free tier available

#### Frontend
- **Vercel** - Optimized for Vite/React
- **Netlify** - Easy continuous deployment
- **AWS S3 + CloudFront** - Scalable static hosting
- **GitHub Pages** - Free for public repos

#### Database
- **Heroku Postgres** - Managed PostgreSQL
- **AWS RDS** - Fully managed database
- **DigitalOcean Managed Databases**
- **ElephantSQL** - PostgreSQL as a service

---

## 🛡️ Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access Control** - Fine-grained permissions
- ✅ **Input Validation** - express-validator + class-validator
- ✅ **SQL Injection Prevention** - TypeORM parameterized queries
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **HTTP-Only Cookies** - (Recommended for production)
- ✅ **Rate Limiting** - (Recommended for production)
- ✅ **Helmet.js** - (Recommended for production)

---

## 📖 Additional Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete API endpoint documentation
- **[Database Guide](./DATABASE_ENTITIES_GUIDE.md)** - Entity relationships and schema
- **[Frontend Guide](./FRONTEND_COMPLETE_GUIDE.md)** - Frontend architecture and components
- **[Application Flow](./APPLICATION_FLOW.md)** - Request/response flow diagrams
- **[Troubleshooting](./TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Event Management System**

Built with ❤️ using TypeScript, React, Node.js, and PostgreSQL

---

## 🙏 Acknowledgments

- React Bootstrap for UI components
- TypeORM for excellent database abstraction
- Vite for blazing-fast development experience
- The open-source community for amazing tools and libraries

---

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- Review the [API Documentation](./API_REFERENCE.md)

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with TypeScript and ☕

</div>
