import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
export interface AuthRequest extends Request {
    user?: User;
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        throw new AppError('Not authorized to access this route', 401);
    }
    try {
        const decoded = verifyToken(token);
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        req.user = user;
        next();
    } catch (error) {
        throw new AppError('Not authorized to access this route', 401);
    }
});