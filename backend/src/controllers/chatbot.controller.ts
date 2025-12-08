import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';
const chatbotService = new ChatbotService();
export class ChatbotController {
    async chat(req: Request, res: Response) {
        try {
            const { message, conversationHistory } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }
            const response = await chatbotService.chat(message, conversationHistory);
            return res.status(200).json({
                success: true,
                response,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.error('Chat error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to process message'
            });
        }
    }
    async health(req: Request, res: Response) {
        return res.status(200).json({
            success: true,
            message: 'Chatbot service is running'
        });
    }
}