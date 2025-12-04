import { Router } from "express";
import { OrganizerController } from "../controllers/organizer.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, checkOrganizerStatus } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User.entity";

const router = Router();
const organizerController = new OrganizerController();

router.use(authenticate, authorize([UserRole.ORGANIZER]), checkOrganizerStatus);

router.get('/dashboard', organizerController.getDashboard);

router.get('/events', organizerController.getMyEvents);
router.post('/events', organizerController.createEvent);
router.get('/events/:id', organizerController.getEventById);
router.put('/events/:id', organizerController.updateEvent);
router.delete('/events/:id', organizerController.deleteEvent);

router.get('/events/:id/bookings', organizerController.getEventAttendees);

router.post('/events/:eventId/ticket-types', organizerController.createTicketType);
router.put('/events/:eventId/ticket-types/:ticketTypeId', organizerController.updateTicketType);
router.delete('/events/:eventId/ticket-types/:ticketTypeId', organizerController.deleteTicketType);

export default router;