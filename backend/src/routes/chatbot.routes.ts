import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();
const chatbotController = new ChatbotController();

// Optional authentication - chatbot works for both logged-in and guest users
router.post('/chat', optionalAuthenticate, chatbotController.chat.bind(chatbotController));
router.get('/health', chatbotController.health.bind(chatbotController));
export default router;