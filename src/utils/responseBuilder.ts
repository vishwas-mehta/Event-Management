import { Response } from 'express';
export const successResponse = (
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
export const errorResponse = (
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 500,
    errors: any = null
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};