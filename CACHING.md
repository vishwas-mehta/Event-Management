# Redis Caching Implementation Guide

This document explains how Redis caching is implemented in the Event Management System backend.

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Cache Service API](#cache-service-api)
5. [What's Cached](#whats-cached)
6. [Cache Invalidation](#cache-invalidation)
7. [Request Flow Diagram](#request-flow-diagram)
8. [Testing Caching](#testing-caching)
9. [Troubleshooting](#troubleshooting)

---

## Overview

We use **Redis** as an in-memory cache layer between the API and PostgreSQL database. This reduces database load and improves response times for frequently accessed data.

**Key Benefits:**
- Faster response times (Redis is in-memory, ~1ms vs ~50ms for DB)
- Reduced database load
- Scalable across multiple server instances
- Persistent across server restarts

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │ ───▶ │   Express   │ ───▶ │   Redis     │
│  (Browser)  │      │   Server    │      │   Cache     │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                    │
                            │  Cache Miss        │ Cache Hit
                            ▼                    ▼
                     ┌─────────────┐      (Return cached
                     │  PostgreSQL │       response)
                     │   Database  │
                     └─────────────┘
```

---

## Setup & Configuration

### 1. Redis Server

Redis must be running locally or on a remote server.

```bash
# Mac: Install & start
brew install redis
brew services start redis

# Verify running
redis-cli ping
# Output: PONG
```

### 2. Environment Variable

In `backend/.env`:
```env
REDIS_URL=redis://localhost:6379
```

### 3. Files Structure

```
backend/src/
├── config/
│   └── redis.ts          # Redis connection setup
├── services/
│   └── cache.service.ts  # Cache utility functions
├── controllers/
│   ├── event.controller.ts      # Uses caching
│   ├── organizer.controller.ts  # Invalidates cache
│   └── attendee.controller.ts   # Invalidates cache
└── server.ts             # Initializes Redis on startup
```

---

## File Details

### `config/redis.ts` - Connection Setup

```typescript
import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on('error', (err) => console.error('Redis error', err));
redisClient.on('connect', () => console.log('Redis connected'));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;
```

### `server.ts` - Initialization

```typescript
import { connectRedis } from './config/redis';

const startServer = async() => {
    await initializeDatabase();
    await connectRedis();  // ← Connect Redis after DB
    console.log('✅ Redis cache ready');
    
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
};
```

---

## Cache Service API

### `services/cache.service.ts`

```typescript
import redisClient from '../config/redis';

// Cache key prefixes for organization
export const CacheKeys = {
    EVENTS_LIST: 'events:list:',     // + filter hash
    EVENT_SINGLE: 'events:single:',  // + event ID  
    CATEGORIES: 'categories:all',
};

export const cacheService = {
    // Get from cache (returns null if not found)
    get: async <T>(key: string): Promise<T | null> => {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    },

    // Set with TTL (time-to-live in seconds)
    set: async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    },

    // Delete specific key
    del: async (key: string): Promise<void> => {
        await redisClient.del(key);
    },

    // Delete all keys matching pattern
    delByPattern: async (pattern: string): Promise<void> => {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    },

    // Clear all cache
    flush: async (): Promise<void> => {
        await redisClient.flushDb();
    },
};
```

---

## What's Cached

| Endpoint | Cache Key | TTL | Reason |
|----------|-----------|-----|--------|
| `GET /api/events` | `events:list:<hash>` | 60s | List changes with bookings |
| `GET /api/events/:id` | `events:single:<id>` | 120s | Detail page data |
| `GET /api/events/categories` | `categories:all` | 3600s (1hr) | Rarely changes |

### Key Generation

For event lists, we hash the query parameters to create unique cache keys:

```typescript
import crypto from 'crypto';

const cacheKey = CacheKeys.EVENTS_LIST + 
    crypto.createHash('md5')
        .update(JSON.stringify(req.query))
        .digest('hex');

// Example: "events:list:a1b2c3d4e5f6..."
```

This means different filter combinations get their own cache entries.

---

## Cache Invalidation

Cache must be cleared when data changes. Here's when we invalidate:

### On Event Changes (organizer.controller.ts)

| Action | Cache Cleared |
|--------|---------------|
| Create Event | All event lists |
| Update Event | That event + all lists |
| Delete Event | That event + all lists |

```typescript
// After creating event
await cacheService.delByPattern(CacheKeys.EVENTS_LIST + '*');

// After updating/deleting event
await cacheService.del(CacheKeys.EVENT_SINGLE + id);
await cacheService.delByPattern(CacheKeys.EVENTS_LIST + '*');
```

### On Bookings (attendee.controller.ts)

| Action | Cache Cleared |
|--------|---------------|
| Book Ticket | That event (ticket count changed) |
| Cancel Booking | That event (ticket count changed) |

```typescript
await cacheService.del(CacheKeys.EVENT_SINGLE + eventId);
```

---

## Request Flow Diagram

### Cache HIT (Fast Path)
```
1. Client requests GET /api/events
2. Controller checks: cacheService.get(cacheKey)
3. Redis returns cached data ✓
4. Controller returns cached response
5. Response includes: "message": "Events retrieved (cached)"
```

### Cache MISS (Slow Path)
```
1. Client requests GET /api/events  
2. Controller checks: cacheService.get(cacheKey)
3. Redis returns null (no cache)
4. Controller queries PostgreSQL database
5. Controller stores result: cacheService.set(cacheKey, data, TTL)
6. Controller returns fresh response
7. Response includes: "message": "Events retrieved successfully"
```

---

## Testing Caching

### 1. Check Response Message

```bash
# First request (from DB)
curl http://localhost:5000/api/events/categories
# "message": "Categories retrieved"

# Second request (from cache)
curl http://localhost:5000/api/events/categories
# "message": "Categories retrieved (cached)"
```

### 2. Inspect Redis Directly

```bash
# See all cached keys
redis-cli keys "*"

# Check TTL remaining (in seconds)
redis-cli ttl "categories:all"

# View cached value
redis-cli get "categories:all"

# Delete a key to force refresh
redis-cli del "categories:all"

# Clear all cache
redis-cli flushdb
```

### 3. Monitor Redis in Real-time

```bash
redis-cli monitor
# Shows all Redis commands as they execute
```

---

## Troubleshooting

### Redis Not Connected

**Symptom:** Error on startup, no caching

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running
brew services start redis
```

### Cache Not Being Used

**Check:**
1. Is `REDIS_URL` set in `.env`?
2. Is `connectRedis()` called in `server.ts`?
3. Does controller import `cacheService`?

### Stale Data

If data seems outdated:
```bash
# Clear all cache
redis-cli flushdb
```

Or check that invalidation is happening on writes.

---

## Key Takeaways

1. **Redis stores JSON strings** - We `JSON.stringify()` on set, `JSON.parse()` on get
2. **TTL is in seconds** - After TTL expires, key is auto-deleted
3. **Pattern deletion** - Use `keys "pattern*"` then `del` for batch invalidation
4. **Always invalidate on writes** - Or users see stale data
5. **Different responses tell you** - "(cached)" suffix means cache hit

---

## Common Redis CLI Commands

```bash
redis-cli ping              # Test connection
redis-cli keys "*"          # List all keys
redis-cli get <key>         # Get value
redis-cli ttl <key>         # Time remaining
redis-cli del <key>         # Delete key
redis-cli flushdb           # Clear all
redis-cli monitor           # Watch live
redis-cli info memory       # Memory usage
```
