import 'reflect-metadata';

import app from './app';
import env from './config/env';
import { initializeDatabase } from './config/database';
import { connectRedis } from './config/redis';

const startServer = async () => {
    try {
        await initializeDatabase();
        await connectRedis();
        console.log('✅ Redis cache ready');
        const PORT = env.port || 5000;
        // const PORT = 7000;
        app.listen(PORT, () => {
            console.log(`Event Management Api server started on port ${PORT}`)
        })
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
