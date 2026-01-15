import 'reflect-metadata';
import env from './config/env';
import { Request, Response, NextFunction } from 'express';
import { connectRedis } from './config/redis';

const express = require('express');
const cors = require('cors');

type Application = any;

// Routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import organizerRoutes from './routes/organizer.routes';
import eventRoutes from './routes/event.routes';
import attendeeRoutes from './routes/attendee.routes';
import chatbotRoutes from './routes/chatbot.routes';

// Middleware
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log("request recieved");
    next();
});
// CORS configuration
app.use(
    cors()
    // {
    // origin: env.nodeEnv === 'production' ? process.env.FRONTEND_URL : '*',
    // credentials: true,
    // }
    // )
);


// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Event Management API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendee', attendeeRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;

