import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const decoded = verifyToken(token);
        req.user = decoded;

        next();
    } catch (error) {
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

/**
 * Optional authentication middleware - verifies token if present, but continues without error if missing
 * Used for endpoints that work for both authenticated and guest users (like chatbot)
 */
export const optionalAuthenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            req.user = decoded;
        }
        // If no token or invalid token, just continue without user
        next();
    } catch (error) {
        // Invalid token - continue without user instead of throwing error
        next();
    }
};
