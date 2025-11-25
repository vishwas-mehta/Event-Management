import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    console.error('Error:', err);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};