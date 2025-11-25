import { body } from 'express-validator';
export const createBookingValidator = [
    body('eventId').isUUID().withMessage('Valid event ID required'),
    body('ticketTypeId').isUUID().withMessage('Valid ticket type ID required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];