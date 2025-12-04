import { Response } from 'express';

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    error: string,
    statusCode: number = 500
): Response => {
    const response: ApiResponse = {
        success: false,
        error,
    };

    return res.status(statusCode).json(response);
};
