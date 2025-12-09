import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../entities/User.entity';

const router = Router();
const adminController = new AdminController();

router.use(authenticate, authorize([UserRole.ADMIN]));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Organizer management
router.get('/pending-organizers', adminController.getPendingOrganizers);
router.post('/organizers/:id/approve', adminController.approveOrganizer);
router.post('/organizers/:id/reject', adminController.rejectOrganizer);

// Reported Events
router.get('/reported-events', adminController.getReportedEvents);
router.post('/reported-events/:id/resolve', adminController.resolveReport);

// Event management
router.delete('/events/:id', adminController.deleteEvent);

export default router;