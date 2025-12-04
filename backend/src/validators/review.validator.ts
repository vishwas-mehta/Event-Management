import { body } from 'express-validator';
export const createReviewValidator = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().isLength({ max: 1000 }),
];