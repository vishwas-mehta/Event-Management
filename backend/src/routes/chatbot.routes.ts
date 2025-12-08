import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
const router = Router();
const chatbotController = new ChatbotController();
// No authentication required - public chatbot
router.post('/chat', chatbotController.chat.bind(chatbotController));
router.get('/health', chatbotController.health.bind(chatbotController));
export default router;