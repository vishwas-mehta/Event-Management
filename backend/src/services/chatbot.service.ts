import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export class ChatbotService {
    private knowledgeBase: string;

    constructor() {
        // Load knowledge base on initialization
        const knowledgePath = path.join(__dirname, '../knowledge/chatbot_knowledge.txt');
        this.knowledgeBase = fs.readFileSync(knowledgePath, 'utf-8');
    }
    async chat(userMessage: string, conversationHistory: any[] = []): Promise<string> {
        // Security: Input validation
        if (!userMessage || userMessage.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (userMessage.length > 500) {
            throw new Error('Message too long. Please keep it under 500 characters.');
        }
        // Security: Check for prompt injection attempts
        if (this.containsPromptInjection(userMessage)) {
            return "I can only answer questions about the Event Management System. Please ask a relevant question.";
        }
        // Build the prompt with context
        const systemPrompt = this.buildSystemPrompt();
        const chatHistory = this.formatHistory(conversationHistory);

        const fullPrompt = `${systemPrompt}\n\n${chatHistory}\n\nUser: ${userMessage}\nAssistant:`;
        try {
            const result = await model.generateContent(fullPrompt);
            const response = result.response.text();

            // Security: Validate response is relevant
            if (this.isResponseIrrelevant(response)) {
                return "I can only help with questions about the Event Management System. Please ask something related to events, bookings, or the application.";
            }
            return response;
        } catch (error) {
            console.error('Chatbot error:', error);
            throw new Error('Failed to generate response');
        }
    }
    private buildSystemPrompt(): string {
        return `You are a helpful assistant for an Event Management System. You can ONLY answer questions about this application.
STRICT RULES:
1. Only answer questions related to the Event Management System
2. Use the knowledge base provided below as your primary source of truth
3. If a question is not related to events, bookings, or this application, politely redirect the user
4. Do not answer questions about other topics, even if the user insists
5. Be concise and helpful
6. If you don't know something, say so - don't make up information
KNOWLEDGE BASE:
${this.knowledgeBase}
Remember: You can ONLY discuss the Event Management System. Stay in character!`;
    }
    private formatHistory(history: any[]): string {
        if (!history || history.length === 0) return '';

        return history
            .slice(-6) // Keep last 6 messages for context
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`)
            .join('\n');
    }
    private containsPromptInjection(message: string): boolean {
        const injectionPatterns = [
            /ignore (previous|above) (instructions|prompts)/i,
            /you are now/i,
            /new (instructions|role|system)/i,
            /forget (everything|all|previous)/i,
            /system:|assistant:|user:/i,
            /act as|pretend to be/i,
        ];
        return injectionPatterns.some(pattern => pattern.test(message));
    }
    private isResponseIrrelevant(response: string): boolean {
        // Check if response seems unrelated to event management
        const relevantKeywords = [
            'event', 'booking', 'ticket', 'organizer', 'attendee',
            'venue', 'registration', 'cancel', 'capacity', 'application'
        ];

        const lowerResponse = response.toLowerCase();
        const hasRelevantKeyword = relevantKeywords.some(keyword =>
            lowerResponse.includes(keyword)
        );
        // If response is long but has no relevant keywords, it might be off-topic
        return !hasRelevantKeyword && response.length > 100;
    }
}