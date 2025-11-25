import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UserRole, UserStatus } from '../entities/User.entity';

export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.jwt.secret) as JwtPayload;
};
