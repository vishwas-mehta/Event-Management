import { Router } from "express";
import { AttendeeController } from "../controllers/attendee.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User.entity";

const router = Router();
const attendeeController = new AttendeeController();


router.use(authenticate, authorize([UserRole.ATTENDEE]));


// Bookings
router.post('/bookings', attendeeController.bookTicket);
router.get('/bookings', attendeeController.getMyBookings);
router.get('/bookings/:id', attendeeController.getBookingById);
router.delete('/bookings/:id', attendeeController.cancelBooking);
router.post('/bookings/:id/attend', attendeeController.markAttendance);

// Reviews
router.post('/events/:eventId/reviews', attendeeController.createReview);
router.put('/reviews/:id', attendeeController.updateReview);
router.delete('/reviews/:id', attendeeController.deleteReview);

// Waitlist
router.post('/events/:eventId/waitlist', attendeeController.joinWaitlist);
router.delete('/events/:eventId/waitlist', attendeeController.leaveWaitlist);
router.get('/waitlist', attendeeController.getMyWaitlists);

// export the router
export default router;