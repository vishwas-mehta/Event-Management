# Full-Stack Interview Preparation Guide
## Event Management System

---

# PART 1: TECHNOLOGY Q&A

## Node.js

**Q1: What is Node.js?**
> Node.js is a JavaScript runtime built on Chrome's V8 engine. It allows you to run JavaScript on the server (outside browser).

**Q2: What is the Event Loop in Node.js?**
> The Event Loop handles asynchronous operations. It continuously checks the call stack and callback queue, executing callbacks when the stack is empty. This is why Node.js is non-blocking.

**Q3: What is npm?**
> npm (Node Package Manager) is the default package manager for Node.js. It installs, shares, and manages dependencies in `package.json`.

**Q4: Difference between `require` and `import`?**
> - `require` = CommonJS syntax (older, synchronous)
> - `import` = ES6 module syntax (modern, can be async)
> Node.js traditionally used `require`, but now supports `import` with type: "module" in package.json.

**Q5: What is `package.json`?**
> A file that contains project metadata and all dependencies. Key fields:
> - `name`, `version`: Project identity
> - `scripts`: Commands like `npm run dev`
> - `dependencies`: Production packages
> - `devDependencies`: Development-only packages

---

## Express.js

**Q1: What is Express.js?**
> Express is a minimal, fast web framework for Node.js. It provides routing, middleware support, and HTTP utilities to build APIs.

**Q2: What is Middleware?**
> Middleware is a function that has access to `req`, `res`, and `next`. It can modify request/response, end the cycle, or pass to the next middleware.
```javascript
const myMiddleware = (req, res, next) => {
    console.log('Request received');
    next(); // Pass to next middleware
};
```

**Q3: How does routing work in Express?**
> Routes define endpoints. Each route has a method (GET/POST), path, and handler:
```javascript
app.get('/users', (req, res) => res.send('User list'));
app.post('/users', (req, res) => res.send('User created'));
```

**Q4: What are req.body, req.params, req.query?**
> - `req.body`: POST/PUT data (JSON body)
> - `req.params`: URL path parameters (`/users/:id` → `req.params.id`)
> - `req.query`: Query string (`?page=1` → `req.query.page`)

**Q5: How do you handle errors in Express?**
> Use error-handling middleware (4 parameters):
```javascript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});
```

---

## TypeScript

**Q1: What is TypeScript?**
> TypeScript is a superset of JavaScript that adds static typing. It compiles to plain JavaScript. Catches errors at compile-time instead of runtime.

**Q2: What is a type annotation?**
```typescript
let name: string = 'John';        // Variable
function greet(name: string): void {}  // Function
```

**Q3: What is an interface?**
> Interface defines the shape of an object:
```typescript
interface User {
    id: string;
    name: string;
    email: string;
}
```

**Q4: What is the difference between `interface` and `type`?**
> - `interface`: Can be extended, merged, used for object shapes
> - `type`: More flexible, can define unions, intersections, primitives
> For objects, prefer `interface`. For complex types, use `type`.

**Q5: What is a generic?**
> Generics allow creating reusable components that work with multiple types:
```typescript
function getFirst<T>(arr: T[]): T {
    return arr[0];
}
```

---

## React.js

**Q1: What is React?**
> React is a JavaScript library for building user interfaces using components. It uses a virtual DOM for efficient updates.

**Q2: What is JSX?**
> JSX is JavaScript XML - a syntax extension that lets you write HTML-like code in JavaScript:
```jsx
return <h1>Hello, {name}</h1>;
```

**Q3: What are props and state?**
> - **Props**: Data passed from parent to child (read-only)
> - **State**: Data managed within a component (mutable with setState)

**Q4: What is useState hook?**
```jsx
const [count, setCount] = useState(0);
// count = current value
// setCount = function to update value
// 0 = initial value
```

**Q5: What is useEffect hook?**
> useEffect runs side effects (API calls, subscriptions) after render:
```jsx
useEffect(() => {
    fetchData();  // Runs on mount
}, []);           // Empty array = run once

useEffect(() => {
    fetchData(id);  // Runs when id changes
}, [id]);           // Dependency array
```

**Q6: What is the difference between controlled and uncontrolled components?**
> - **Controlled**: Form input value is controlled by React state
> - **Uncontrolled**: Form input value is controlled by DOM (using ref)

**Q7: What is Context API?**
> Context provides a way to pass data through the component tree without passing props at every level. Used for global state like auth, theme.

---

## React Router

**Q1: What is React Router?**
> React Router is a library for handling navigation/routing in React SPAs. It maps URLs to components.

**Q2: Basic routing setup?**
```jsx
<BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetails />} />
    </Routes>
</BrowserRouter>
```

**Q3: How to get URL parameters?**
```jsx
import { useParams } from 'react-router-dom';

const EventDetails = () => {
    const { id } = useParams();  // Gets :id from URL
};
```

**Q4: How to navigate programmatically?**
```jsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate('/events');  // Go to /events
    };
};
```

**Q5: What are protected routes?**
> Routes that require authentication. Redirect to login if not authenticated:
```jsx
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};
```

---

## Axios

**Q1: What is Axios?**
> Axios is a promise-based HTTP client for making API requests. It works in browser and Node.js.

**Q2: Basic GET and POST requests?**
```javascript
// GET
const response = await axios.get('/api/events');

// POST
const response = await axios.post('/api/events', { title: 'Concert' });
```

**Q3: What are Axios interceptors?**
> Interceptors run before request is sent or after response is received:
```javascript
axios.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

**Q4: How to handle errors in Axios?**
```javascript
try {
    const response = await axios.get('/api/data');
} catch (error) {
    if (error.response) {
        // Server responded with error (4xx, 5xx)
        console.log(error.response.status);
    } else if (error.request) {
        // No response received
    } else {
        // Request setup error
    }
}
```

---

## Redis

**Q1: What is Redis?**
> Redis is an in-memory data store used as a database, cache, and message broker. It's extremely fast because data is in memory.

**Q2: Why use Redis for caching?**
> - Speed: Memory is 1000x faster than disk
> - Reduces database load
> - Improves API response times
> - Supports key expiration (TTL)

**Q3: How is Redis used in this application?**
> The Event Management System uses Redis to cache:
> - Event lists (avoids repeated database queries)
> - Category lists
> Cache is invalidated when data changes.

**Q4: Basic Redis operations?**
```javascript
await redis.set('key', 'value');           // Store
await redis.get('key');                     // Retrieve
await redis.setex('key', 3600, 'value');   // Store with 1 hour expiry
await redis.del('key');                     // Delete
```

---

## TypeORM

**Q1: What is TypeORM?**
> TypeORM is an ORM (Object-Relational Mapper) for TypeScript/JavaScript. It lets you work with databases using TypeScript classes instead of raw SQL.

**Q2: What is an Entity?**
> Entity is a class that maps to a database table:
```typescript
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;
}
```

**Q3: What are Relations in TypeORM?**
> - `@OneToOne`: One user has one profile
> - `@OneToMany`: One user has many bookings
> - `@ManyToOne`: Many bookings belong to one user
> - `@ManyToMany`: Many users attend many events

**Q4: How to query with TypeORM?**
```typescript
// Simple find
const user = await userRepository.findOne({ where: { id } });

// With relations
const booking = await bookingRepository.find({
    where: { userId },
    relations: ['event', 'ticketType']
});

// Query builder
const events = await eventRepository
    .createQueryBuilder('event')
    .where('event.isPublished = :pub', { pub: true })
    .orderBy('event.startDateTime', 'ASC')
    .getMany();
```

**Q5: What is a Transaction?**
> Transaction ensures multiple operations succeed or fail together:
```typescript
await AppDataSource.transaction(async (manager) => {
    await manager.save(booking);
    await manager.save(ticketType);
    // If any fails, all are rolled back
});
```

---

## JWT (JSON Web Token)

**Q1: What is JWT?**
> JWT is a compact, self-contained way to securely transmit information as a JSON object. Used for authentication.

**Q2: Structure of JWT?**
> Three parts separated by dots: `header.payload.signature`
> - Header: Algorithm and token type
> - Payload: User data (id, role, expiry)
> - Signature: Verification that token wasn't modified

**Q3: How is JWT used for authentication?**
> 1. User logs in → Server creates JWT with user info
> 2. JWT sent to client → Stored in localStorage
> 3. Client sends JWT in Authorization header
> 4. Server verifies JWT → Grants access

**Q4: JWT vs Session-based auth?**
> - JWT: Stateless, stored on client, scalable
> - Session: Stateful, stored on server, simpler

---

## bcrypt

**Q1: What is bcrypt?**
> bcrypt is a password hashing library. It converts passwords into irreversible hashes for secure storage.

**Q2: How to hash and compare passwords?**
```javascript
// Hash (during registration)
const hashedPassword = await bcrypt.hash(password, 10);

// Compare (during login)
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
```

**Q3: What is salt rounds?**
> Salt rounds (10 in above example) determine how many times the algorithm runs. Higher = more secure but slower. 10-12 is recommended.

---

# PART 2: APPLICATION-SPECIFIC Q&A

**Q1: Explain the architecture of your Event Management System.**
> - Frontend: React.js with TypeScript, React Router for navigation
> - Backend: Node.js with Express.js, TypeScript
> - Database: PostgreSQL with TypeORM
> - Caching: Redis for event/category caching
> - Auth: JWT-based authentication with role-based access

**Q2: What are the different user roles?**
> - **Admin**: Manages platform, approves organizers, handles reports
> - **Organizer**: Creates and manages events, views attendees
> - **Attendee**: Books tickets, writes reviews, joins waitlists

**Q3: How does authentication work?**
> 1. User registers → Password hashed with bcrypt → Stored in DB
> 2. User logs in → Password compared → JWT generated
> 3. JWT sent with each request in Authorization header
> 4. Backend verifies JWT → Extracts userId, role
> 5. Middleware checks role for protected routes

**Q4: How does the booking flow work?**
> 1. Attendee selects event and ticket type
> 2. Chooses quantity
> 3. For paid tickets: Payment modal shown
> 4. API call: POST /api/attendee/bookings
> 5. Backend: Transaction with row locking
> 6. Creates booking + Updates sold count atomically

**Q5: What is early bird pricing?**
> Dynamic pricing stored in `dynamicPricing` JSONB column:
```json
{
    "type": "early_bird",
    "earlyBirdQuantity": 20,
    "earlyBirdPrice": 49.99,
    "originalPrice": 99.99
}
```
> First 20 tickets at $49.99, rest at $99.99. Tracked by `sold` count.

**Q6: How does the chatbot work?**
> - Frontend: React component with conversation state
> - API: POST /api/chatbot/chat (optionalAuthenticate)
> - Backend: Intent detection → Multi-step booking flow
> - State machine: select_event → select_ticket → quantity → confirm
> - Not AI-based - uses pattern matching and keywords

**Q7: How do you handle race conditions in booking?**
> Using pessimistic locking in transaction:
```typescript
const ticketType = await manager
    .createQueryBuilder()
    .setLock('pessimistic_write')  // LOCK row
    .where('id = :id', { id })
    .getOne();
```

**Q8: What middleware do you use?**
> - `authenticate`: Verifies JWT, blocks if invalid
> - `authorize([roles])`: Checks user role
> - `optionalAuthenticate`: Passes user info if logged in, continues if not
> - `checkOrganizerStatus`: Ensures organizer is approved (not pending)

**Q9: How is caching implemented?**
> - Redis stores event lists with key `events:list`
> - Cache invalidated on create/update/delete
> - TTL (time-to-live) for automatic expiry

**Q10: How does the waitlist work?**
> - When tickets sold out, user joins waitlist
> - Position tracked in queue
> - When booking cancelled, waitlist users notified
> - First in queue gets priority

---

# PART 3: DATABASE DESIGN

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   USERS     │         │ CATEGORIES  │         │    EVENTS    │
├─────────────┤         ├─────────────┤         ├──────────────┤
│ id (PK)     │         │ id (PK)     │         │ id (PK)      │
│ email       │         │ name        │◄────────│ category_id  │
│ password    │◄────────│ slug        │         │ organizer_id │────┐
│ firstName   │    │    └─────────────┘         │ title        │    │
│ lastName    │    │                            │ description  │    │
│ role        │    │                            │ startDateTime│    │
│ status      │    │                            │ location     │    │
└─────────────┘    │                            │ capacity     │    │
      │            │                            └──────────────┘    │
      │            │                                   │            │
      │            │                                   │ 1:N        │
      │            │                                   ▼            │
      │            │                            ┌──────────────┐    │
      │            │                            │ TICKET_TYPES │    │
      │            │                            ├──────────────┤    │
      │            │                            │ id (PK)      │    │
      │            │                            │ event_id (FK)│    │
      │            │                            │ name         │    │
      │            │                            │ price        │    │
      │            │                            │ capacity     │    │
      │            │                            │ sold         │    │
      │            │                            │dynamicPricing│    │
      │            │                            └──────────────┘    │
      │            │                                   │            │
      │ 1:N        └───────────────────────┐          │            │
      ▼                                    │          │            │
┌─────────────┐                            │          │            │
│  BOOKINGS   │◄───────────────────────────┼──────────┘            │
├─────────────┤                            │                       │
│ id (PK)     │                            │                       │
│ user_id (FK)│────────────────────────────┘                       │
│ event_id    │                                                    │
│ticket_type_id                                                    │
│ quantity    │                                                    │
│ totalPrice  │                                                    │
│ status      │                                                    │
│bookingRef   │                                                    │
└─────────────┘                                                    │
                                                                   │
┌─────────────┐    ┌─────────────┐    ┌────────────────┐          │
│   REVIEWS   │    │  WAITLISTS  │    │ REPORTED_EVENTS│          │
├─────────────┤    ├─────────────┤    ├────────────────┤          │
│ id (PK)     │    │ id (PK)     │    │ id (PK)        │          │
│ user_id (FK)│    │ user_id (FK)│    │ event_id (FK)  │──────────┘
│ event_id    │    │ event_id    │    │ reportedBy (FK)│
│ rating      │    │ticket_type_id   │ reason         │
│ comment     │    │ position    │    │ status         │
└─────────────┘    │ status      │    └────────────────┘
                   └─────────────┘
```

## Table Details

### USERS
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR | Unique email |
| password | VARCHAR | Bcrypt hashed |
| firstName | VARCHAR | User's first name |
| lastName | VARCHAR | User's last name |
| role | ENUM | 'admin', 'organizer', 'attendee' |
| status | ENUM | 'active', 'pending', 'blocked' |

### EVENTS
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organizer_id | UUID | FK → users |
| category_id | UUID | FK → categories |
| title | VARCHAR | Event name |
| start_date_time | TIMESTAMP | When event starts |
| location | VARCHAR | Venue |
| capacity | INT | Total capacity |
| is_published | BOOLEAN | Visible to public? |

### TICKET_TYPES
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | FK → events |
| name | VARCHAR | 'Regular', 'VIP' |
| price | DECIMAL | Ticket price |
| capacity | INT | Available tickets |
| sold | INT | Tickets sold (starts 0) |
| dynamic_pricing | JSONB | Early bird config |

### BOOKINGS
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| event_id | UUID | FK → events |
| ticket_type_id | UUID | FK → ticket_types |
| quantity | INT | Tickets booked |
| total_price | DECIMAL | Total amount |
| status | ENUM | 'confirmed', 'cancelled', 'attended' |
| booking_reference | VARCHAR | Unique ref: EVT-20240115-1234 |

---

# PART 4: SQL PRACTICE QUESTIONS

## BASIC LEVEL (15 Questions)

**Q1: Get all users**
```sql
SELECT * FROM users;
```

**Q2: Get all events that are published**
```sql
SELECT * FROM events WHERE is_published = true;
```

**Q3: Get user by email**
```sql
SELECT * FROM users WHERE email = 'john@email.com';
```

**Q4: Count total users**
```sql
SELECT COUNT(*) FROM users;
```

**Q5: Get events ordered by date (newest first)**
```sql
SELECT * FROM events ORDER BY start_date_time DESC;
```

**Q6: Get first 10 events**
```sql
SELECT * FROM events LIMIT 10;
```

**Q7: Get events after today**
```sql
SELECT * FROM events WHERE start_date_time > NOW();
```

**Q8: Insert a new category**
```sql
INSERT INTO categories (id, name, slug) VALUES (uuid_generate_v4(), 'Music', 'music');
```

**Q9: Update user status to active**
```sql
UPDATE users SET status = 'active' WHERE id = 'user-uuid';
```

**Q10: Delete a booking**
```sql
DELETE FROM bookings WHERE id = 'booking-uuid';
```

**Q11: Get all bookings for a user**
```sql
SELECT * FROM bookings WHERE user_id = 'user-uuid';
```

**Q12: Count events in each category**
```sql
SELECT category_id, COUNT(*) FROM events GROUP BY category_id;
```

**Q13: Get events with free tickets (price = 0)**
```sql
SELECT DISTINCT e.* FROM events e
JOIN ticket_types t ON e.id = t.event_id
WHERE t.price = 0;
```

**Q14: Get average rating for an event**
```sql
SELECT AVG(rating) FROM reviews WHERE event_id = 'event-uuid';
```

**Q15: Check if email exists**
```sql
SELECT EXISTS(SELECT 1 FROM users WHERE email = 'test@email.com');
```

---

## MEDIUM LEVEL (15 Questions)

**Q1: Get events with category name (JOIN)**
```sql
SELECT e.title, e.start_date_time, c.name AS category
FROM events e
INNER JOIN categories c ON e.category_id = c.id
WHERE e.is_published = true;
```

**Q2: Get user's bookings with event details**
```sql
SELECT b.id, b.quantity, b.total_price, e.title, t.name AS ticket
FROM bookings b
JOIN events e ON b.event_id = e.id
JOIN ticket_types t ON b.ticket_type_id = t.id
WHERE b.user_id = 'user-uuid'
ORDER BY b.created_at DESC;
```

**Q3: Count bookings per event**
```sql
SELECT e.title, COUNT(b.id) AS booking_count, SUM(b.quantity) AS total_tickets
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id
GROUP BY e.id, e.title;
```

**Q4: Get organizer's total revenue**
```sql
SELECT SUM(b.total_price) AS total_revenue
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = 'organizer-uuid'
AND b.status = 'confirmed';
```

**Q5: Get ticket availability**
```sql
SELECT name, capacity, sold, (capacity - sold) AS available
FROM ticket_types
WHERE event_id = 'event-uuid';
```

**Q6: Get events with no bookings**
```sql
SELECT e.*
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id
WHERE b.id IS NULL;
```

**Q7: Get top 5 most booked events**
```sql
SELECT e.title, SUM(b.quantity) AS total_booked
FROM events e
JOIN bookings b ON e.id = b.event_id
WHERE b.status = 'confirmed'
GROUP BY e.id, e.title
ORDER BY total_booked DESC
LIMIT 5;
```

**Q8: Get pending organizers**
```sql
SELECT id, email, first_name, last_name, created_at
FROM users
WHERE role = 'organizer' AND status = 'pending'
ORDER BY created_at ASC;
```

**Q9: Update ticket sold count after booking**
```sql
UPDATE ticket_types
SET sold = sold + 2
WHERE id = 'ticket-uuid';
```

**Q10: Cancel booking and restore tickets (Transaction)**
```sql
BEGIN;
UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = 'booking-uuid';
UPDATE ticket_types SET sold = sold - 2 WHERE id = 'ticket-uuid';
COMMIT;
```

**Q11: Get events happening this week**
```sql
SELECT * FROM events
WHERE start_date_time >= NOW()
AND start_date_time < NOW() + INTERVAL '7 days'
AND is_published = true;
```

**Q12: Get users who never booked**
```sql
SELECT u.*
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.role = 'attendee' AND b.id IS NULL;
```

**Q13: Get event with highest average rating**
```sql
SELECT e.title, AVG(r.rating) AS avg_rating
FROM events e
JOIN reviews r ON e.id = r.event_id
GROUP BY e.id, e.title
ORDER BY avg_rating DESC
LIMIT 1;
```

**Q14: Get all attendees for an event**
```sql
SELECT u.first_name, u.last_name, u.email, b.quantity, t.name AS ticket
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN ticket_types t ON b.ticket_type_id = t.id
WHERE b.event_id = 'event-uuid' AND b.status = 'confirmed';
```

**Q15: Dashboard stats query**
```sql
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'organizer' AND status = 'active') AS organizers,
    (SELECT COUNT(*) FROM users WHERE role = 'organizer' AND status = 'pending') AS pending_organizers,
    (SELECT COUNT(*) FROM events WHERE is_published = true) AS total_events,
    (SELECT COUNT(*) FROM reported_events WHERE status = 'pending') AS pending_reports;
```

---

## TypeORM Equivalents

**Basic: Find all users**
```typescript
const users = await userRepository.find();
```

**Basic: Find by condition**
```typescript
const user = await userRepository.findOne({ where: { email: 'john@email.com' } });
```

**Basic: Count**
```typescript
const count = await userRepository.count({ where: { role: UserRole.ATTENDEE } });
```

**Medium: With relations**
```typescript
const bookings = await bookingRepository.find({
    where: { userId: 'user-uuid' },
    relations: ['event', 'ticketType'],
    order: { createdAt: 'DESC' }
});
```

**Medium: Query Builder**
```typescript
const events = await eventRepository
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.category', 'category')
    .where('event.isPublished = :pub', { pub: true })
    .andWhere('event.startDateTime > :now', { now: new Date() })
    .orderBy('event.startDateTime', 'ASC')
    .take(10)
    .getMany();
```

**Medium: Transaction**
```typescript
await AppDataSource.transaction(async (manager) => {
    const booking = manager.create(Booking, { ... });
    await manager.save(booking);
    
    await manager.update(TicketType, { id: ticketId }, { sold: () => 'sold + 1' });
});
```

---

# PART 5: JS CONTROLLER FUNCTIONS

## BASIC LEVEL

### 1. Get All Items
```typescript
const getEvents = async (req: Request, res: Response) => {
    try {
        // Fetch from database
        const events = await eventRepository.find({
            where: { isPublished: true },
            relations: ['category']
        });
        
        // Send response
        return res.status(200).json({
            success: true,
            data: { events }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch events'
        });
    }
};
```

### 2. Get Single Item by ID
```typescript
const getEventById = async (req: Request, res: Response) => {
    try {
        // Get ID from URL params
        const { id } = req.params;
        
        // Find in database
        const event = await eventRepository.findOne({
            where: { id },
            relations: ['category', 'ticketTypes', 'organizer']
        });
        
        // Check if exists
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: { event }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch event'
        });
    }
};
```

### 3. Create New Item
```typescript
const createCategory = async (req: Request, res: Response) => {
    try {
        // Get data from body
        const { name, description } = req.body;
        
        // Validate
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }
        
        // Create and save
        const category = categoryRepository.create({
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description
        });
        
        await categoryRepository.save(category);
        
        return res.status(201).json({
            success: true,
            message: 'Category created',
            data: { category }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
};
```

---

## ADVANCED LEVEL

### 4. Book Ticket (Transaction + Locking)
```typescript
const bookTicket = async (req: Request, res: Response) => {
    try {
        // Get user from JWT
        const userId = req.user.userId;
        
        // Get data from body
        const { eventId, ticketTypeId, quantity } = req.body;
        
        // Validate input
        if (!eventId || !ticketTypeId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        if (quantity < 1 || quantity > 10) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 10'
            });
        }
        
        // Use transaction for data integrity
        const booking = await AppDataSource.transaction(async (manager) => {
            // Lock ticket type row to prevent race conditions
            const ticketType = await manager
                .getRepository(TicketType)
                .createQueryBuilder('tt')
                .setLock('pessimistic_write')
                .where('tt.id = :id', { id: ticketTypeId })
                .getOne();
            
            if (!ticketType) {
                throw new Error('Ticket type not found');
            }
            
            // Check availability
            const available = ticketType.capacity - ticketType.sold;
            if (available < quantity) {
                throw new Error(`Only ${available} tickets available`);
            }
            
            // Validate event
            const event = await manager.getRepository(Event).findOne({
                where: { id: eventId }
            });
            
            if (!event || !event.isPublished) {
                throw new Error('Event not available');
            }
            
            if (new Date(event.startDateTime) < new Date()) {
                throw new Error('Cannot book past events');
            }
            
            // Calculate price
            const totalPrice = Number(ticketType.price) * quantity;
            
            // Create booking
            const newBooking = manager.getRepository(Booking).create({
                userId,
                eventId,
                ticketTypeId,
                quantity,
                totalPrice,
                status: BookingStatus.CONFIRMED
            });
            
            await manager.getRepository(Booking).save(newBooking);
            
            // Update sold count
            ticketType.sold += quantity;
            await manager.getRepository(TicketType).save(ticketType);
            
            return newBooking;
        });
        
        return res.status(201).json({
            success: true,
            message: 'Booking successful',
            data: { booking }
        });
        
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Booking failed'
        });
    }
};
```

### 5. Cancel Booking (Restore Capacity + Notify Waitlist)
```typescript
const cancelBooking = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        
        const result = await AppDataSource.transaction(async (manager) => {
            // Find booking with relations
            const booking = await manager.getRepository(Booking).findOne({
                where: { id, userId },
                relations: ['event', 'ticketType']
            });
            
            if (!booking) {
                throw new Error('Booking not found');
            }
            
            if (booking.userId !== userId) {
                throw new Error('Unauthorized');
            }
            
            if (booking.status === BookingStatus.CANCELLED) {
                throw new Error('Already cancelled');
            }
            
            // Check if event started
            if (new Date(booking.event.startDateTime) < new Date()) {
                throw new Error('Cannot cancel after event starts');
            }
            
            // Lock and update ticket type
            const ticketType = await manager
                .getRepository(TicketType)
                .createQueryBuilder('tt')
                .setLock('pessimistic_write')
                .where('tt.id = :id', { id: booking.ticketTypeId })
                .getOne();
            
            // Update booking status
            booking.status = BookingStatus.CANCELLED;
            booking.cancelledAt = new Date();
            await manager.getRepository(Booking).save(booking);
            
            // Restore capacity
            ticketType!.sold -= booking.quantity;
            await manager.getRepository(TicketType).save(ticketType!);
            
            // Check waitlist
            const waitlistUsers = await manager.getRepository(Waitlist).find({
                where: {
                    eventId: booking.eventId,
                    ticketTypeId: booking.ticketTypeId,
                    status: WaitlistStatus.WAITING
                },
                order: { position: 'ASC' },
                take: booking.quantity
            });
            
            return { 
                cancelled: true, 
                waitlistNotified: waitlistUsers.length 
            };
        });
        
        return res.status(200).json({
            success: true,
            message: 'Booking cancelled',
            data: result
        });
        
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
```

### 6. Create Event with Ticket Types (Nested Creation)
```typescript
const createEvent = async (req: Request, res: Response) => {
    try {
        const organizerId = req.user.userId;
        
        const {
            title,
            description,
            startDateTime,
            endDateTime,
            location,
            categoryId,
            capacity,
            bannerImage,
            ticketTypes  // Array: [{ name, price, capacity }, ...]
        } = req.body;
        
        // Validate required fields
        if (!title || !description || !startDateTime || !location || !categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Validate dates
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        
        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be in future'
            });
        }
        
        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Validate category exists
        const category = await categoryRepository.findOne({
            where: { id: categoryId }
        });
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Create event in transaction
        const event = await AppDataSource.transaction(async (manager) => {
            // Create event
            const newEvent = manager.getRepository(Event).create({
                organizerId,
                categoryId,
                title,
                description,
                startDateTime: start,
                endDateTime: end,
                location,
                capacity: capacity || 100,
                bannerImage,
                isPublished: true
            });
            
            const savedEvent = await manager.getRepository(Event).save(newEvent);
            
            // Create ticket types
            if (ticketTypes && ticketTypes.length > 0) {
                for (const tt of ticketTypes) {
                    const ticketType = manager.getRepository(TicketType).create({
                        eventId: savedEvent.id,
                        name: tt.name,
                        description: tt.description,
                        price: tt.price || 0,
                        capacity: tt.capacity,
                        sold: 0,
                        dynamicPricing: tt.dynamicPricing || null
                    });
                    
                    await manager.getRepository(TicketType).save(ticketType);
                }
            }
            
            return savedEvent;
        });
        
        // Fetch complete event with relations
        const completeEvent = await eventRepository.findOne({
            where: { id: event.id },
            relations: ['category', 'ticketTypes']
        });
        
        return res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: { event: completeEvent }
        });
        
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create event'
        });
    }
};
```

---

# Quick Reference Card

## Response Patterns
```typescript
// Success
res.status(200).json({ success: true, data: { ... } });

// Created
res.status(201).json({ success: true, message: '...', data: { ... } });

// Bad Request
res.status(400).json({ success: false, message: 'Validation error' });

// Not Found
res.status(404).json({ success: false, message: 'Not found' });

// Server Error
res.status(500).json({ success: false, message: 'Server error' });
```

## Common Patterns
```typescript
// Extract from request
const { id } = req.params;           // URL: /events/:id
const { page, limit } = req.query;   // Query: ?page=1&limit=10
const { title, description } = req.body;  // POST/PUT body
const userId = req.user.userId;      // From JWT middleware

// Pagination
const skip = (page - 1) * limit;
const [items, total] = await repository.findAndCount({
    skip,
    take: limit
});
```

---

**Good luck with your interview! 🎯**
