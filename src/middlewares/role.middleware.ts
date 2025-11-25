import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '../entities/User.entity';
import { ForbiddenError } from '../utils/AppError';

export const authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new ForbiddenError('User not authenticated');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError(
                `Access denied. Required roles: ${allowedRoles.join(', ')}`
            );
        }

        next();
    };
};

export const checkOrganizerStatus = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        throw new ForbiddenError('User not authenticated');
    }

    if (req.user.role === UserRole.ORGANIZER && req.user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenError(
            'Your organizer account is pending approval. Please wait for admin approval.'
        );
    }

    next();
};
