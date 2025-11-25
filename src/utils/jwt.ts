import jwt from 'jsonwebtoken';
import env from '../config/env';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    });
};
export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, env.jwt.secret) as JWTPayload;
};