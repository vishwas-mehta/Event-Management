import { body } from 'express-validator';
export const createEventValidator = [
    body('title').notEmpty().withMessage('Event title is required'),
    body('description').notEmpty().withMessage('Event description required'),
    body('startDateTime').isISO8601().withMessage('Valid start date required'),
    body('endDateTime').isISO8601().withMessage('Valid end date required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('categoryId').isUUID().withMessage('Valid category ID required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be positive'),
];