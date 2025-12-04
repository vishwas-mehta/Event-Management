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

// orgainizer management
router.get('/pending-organizers', adminController.getPendingOrganizers);
router.post('/organizers/:id/approve', adminController.approveOrganizer);
router.post('/organizers/:id/reject', adminController.rejectOrganizer);


// Reported Events
router.get('/reported-events', adminController.getReportedEvents);
router.patch('/users/:id/status', adminController.updateUserStatus);

export default router;