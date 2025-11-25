import 'reflect-metadata';

import app from './app';
import env from './config/env';
import { initializeDatabase } from './config/database';
import { start } from 'repl';

const startServer = async()  => {
    try {
        await initializeDatabase();
        const PORT = env.port;
        app.listen(PORT, ()=>{
            console.log('Event Management Api server started')
        })
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
