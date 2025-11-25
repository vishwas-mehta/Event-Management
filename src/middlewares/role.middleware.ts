import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/AppError';
import { UserRole } from '../entities/User.entity';
export const authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new AppError(
                `User role ${req.user?.role} is not authorized to access this route`,
                403
            );
        }
        next();
    };
};