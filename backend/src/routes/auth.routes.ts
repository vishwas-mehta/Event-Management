import { Router } from "express";
import {AuthController} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);

export default router;

