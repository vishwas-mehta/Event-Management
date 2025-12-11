# AI Usage Declaration - EventHub Event Management System

## Introduction

This document declares the extent of AI/LLM assistance used in developing this full-stack Event Management System. Each component's AI involvement is transparently documented below.

**Project:** EventHub - Event Management System  
**Tech Stack:** TypeScript, React, Express.js, PostgreSQL, TypeORM, Redis, JWT  
**Developer:** Vishwas Mehta

---

## AI Usage Quantification Table

### Frontend (React - 40%)

| Component / Module | Description / Scope | Weight (%) | AI Usage (%) | AI Contribution | Example of AI Use |
|-------------------|---------------------|------------|--------------|-----------------|-------------------|
| Components (/components) | Reusable UI pieces like Navbar, Footer, Chatbot, Cards | 10 | 25 | 2.5% | AI assisted with Bootstrap styling patterns |
| Pages (/pages) | Core screens - Home, Events, Dashboard, Profile | 15 | 20 | 3.0% | AI scaffolded initial page structure |
| Services (/services) | API interaction layer with Axios | 5 | 15 | 0.75% | AI helped with axios interceptor setup |
| Context / Hooks (/context) | AuthContext, state management | 5 | 20 | 1.0% | AI assisted with context boilerplate |
| Main setup (App.tsx, main.tsx) | Routing, component tree setup | 5 | 10 | 0.5% | AI helped with React Router setup |

**Frontend AI Total: ~7.75%**

---

### Backend (Express + TypeORM - 50%)

| Component / Module | Description / Scope | Weight (%) | AI Usage (%) | AI Contribution | Example of AI Use |
|-------------------|---------------------|------------|--------------|-----------------|-------------------|
| Entities (/entities) | Database models - User, Event, Booking, Review, etc. | 10 | 70 | 7.0% | AI generated TypeORM entity definitions and decorators |
| Controllers (/controllers) | API endpoints, request handling | 15 | 15 | 2.25% | Manually written with minor AI syntax help |
| Services (/services) | Business logic - Chatbot, Cache service | 10 | 20 | 2.0% | AI assisted with Gemini API integration |
| Routes (/routes) | Route definitions and middleware wiring | 5 | 10 | 0.5% | Manually structured, AI minor help |
| Middlewares (/middlewares) | Auth, validation, error handlers | 5 | 15 | 0.75% | AI helped with JWT verification pattern |
| Utils (/utils) | Helper functions, response builders | 5 | 10 | 0.5% | Mostly manual, AI formatted responses |

**Backend AI Total: ~13.0%**

---

### Infrastructure / Optional (10%)

| Component / Module | Description / Scope | Weight (%) | AI Usage (%) | AI Contribution | Example of AI Use |
|-------------------|---------------------|------------|--------------|-----------------|-------------------|
| Database Config (database.ts) | TypeORM + PostgreSQL setup | 4 | 25 | 1.0% | AI assisted with DataSource configuration |
| Redis Config (redis.ts) | Redis caching setup | 3 | 30 | 0.9% | AI helped with Redis client setup |
| App & Server Setup (app.ts, server.ts) | Express initialization and route mounting | 3 | 15 | 0.45% | Manual setup with AI formatting help |

**Infrastructure AI Total: ~2.35%**

---

## Total AI Usage Calculation

| Category | Weight | AI Contribution |
|----------|--------|-----------------|
| Frontend | 40% | 7.75% |
| Backend | 50% | 13.0% |
| Infrastructure | 10% | 2.35% |

### **Total AI Usage: ~23.1%**

---

## Declaration Note

I, **Vishwas Mehta**, declare that:

**AI-Assisted Components:**
- TypeORM Entity definitions (decorators, relations, validation)
- Initial Bootstrap component styling
- Gemini API integration for chatbot
- Redis client configuration

**Manually Developed (No/Minimal AI):**
- Core business logic in controllers
- Transaction-based booking with capacity control
- Role-based access control implementation
- Multi-turn chatbot conversation flow logic
- Review verification system
- Organizer approval workflow

**Tools Used:** GitHub Copilot, ChatGPT (for syntax/debugging)

**Approximate AI Contribution:** ~23%

Maintaining transparency in AI usage ensures fair evaluation and academic integrity.
