import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { AttendeeController } from '../controllers/attendee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();
const eventController = new EventController();
const attendeeController = new AttendeeController();

// Public routes
router.get('/', eventController.getEvents);
router.get('/categories', eventController.getCategories);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post(
    '/:id/report',
    authenticate,
    authorize([UserRole.ATTENDEE]),
    eventController.reportEvent
);

// Review routes (public read, protected write)
router.get('/:eventId/reviews', attendeeController.getEventReviews);

export default router;
