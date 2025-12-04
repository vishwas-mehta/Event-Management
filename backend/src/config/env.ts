import dotenv from 'dotenv';

dotenv.config();

const env={
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'event_management',
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@eventapp.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
        lastName: process.env.ADMIN_LAST_NAME || 'User',
    },
};
export default env;