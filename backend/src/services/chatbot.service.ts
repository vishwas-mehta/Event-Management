import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Interfaces for conversation state and responses
interface ConversationState {
    intent?: 'booking' | 'search' | 'cancel' | 'info';
    step?: string;
    eventId?: string;
    eventName?: string;
    ticketTypeId?: string;
    ticketTypeName?: string;
    quantity?: number;
    searchResults?: any[];
}

interface ChatbotAction {
    type: 'book_ticket' | 'search_events' | 'show_event_details';
    data: any;
    requiresAuth: boolean;
}

interface ChatbotResponse {
    message: string;
    action?: ChatbotAction;
    conversationState?: ConversationState;
    suggestions?: string[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class ChatbotService {
    private knowledgeBase: string;

    constructor() {
        // Load knowledge base on initialization
        const knowledgePath = path.join(__dirname, '../knowledge/chatbot_knowledge.txt');
        this.knowledgeBase = fs.readFileSync(knowledgePath, 'utf-8');
    }

    async chat(
        userMessage: string,
        conversationHistory: any[] = [],
        conversationState: ConversationState | null = null,
        userId?: string
    ): Promise<ChatbotResponse> {
        // Security: Input validation
        if (!userMessage || userMessage.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (userMessage.length > 500) {
            throw new Error('Message too long. Please keep it under 500 characters.');
        }
        // Security: Check for prompt injection attempts
        if (this.containsPromptInjection(userMessage)) {
            return {
                message: "I can only answer questions about the Event Management System. Please ask a relevant question."
            };
        }

        // Detect user intent
        const intent = this.detectIntent(userMessage);

        // Handle booking intent with multi-turn conversation
        if (intent === 'booking') {
            return await this.handleBookingIntent(userMessage, conversationState, userId);
        }

        // Handle search intent
        if (intent === 'search') {
            return await this.handleSearchIntent(userMessage, userId);
        }

        // For general info/questions, use the fallback knowledge base response
        const fallbackMessage = this.getKnowledgeBasedResponse(userMessage);
        return { message: fallbackMessage };
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

    private getKnowledgeBasedResponse(message: string): string {
        const lowerMessage = message.toLowerCase();
        const kb = this.knowledgeBase.toLowerCase();

        // Search for relevant sections in knowledge base
        if (lowerMessage.includes('book') && (lowerMessage.includes('event') || lowerMessage.includes('ticket'))) {
            if (kb.includes('q: how do i book an event?')) {
                return 'To book an event, navigate to the Events page, browse or search for an event you\'re interested in, click on it to view details, and then click the "Book Now" button. You must be logged in to book events.';
            }
            return 'You can book events by finding the event you like and clicking the "Book Now" button. Make sure you\'re logged in first!';
        }

        if (lowerMessage.includes('cancel') && (lowerMessage.includes('book') || lowerMessage.includes('ticket'))) {
            return 'Yes, you can cancel your booking. Go to the "My Bookings" page, find the event you want to cancel, and click the "Cancel Booking" button. Cancellation policies may vary by event.';
        }

        if (lowerMessage.includes('create') && lowerMessage.includes('event')) {
            return 'To create an event, you must be logged in with an Organizer account. Go to your Dashboard and click "Create Event", then fill in all the required details including title, description, date, time, location, and capacity.';
        }

        if (lowerMessage.includes('organizer') || lowerMessage.includes('create event')) {
            return 'To become an Organizer, you can register with an Organizer account during signup. Organizers can create events, manage attendees, and track bookings for their events.';
        }

        if (lowerMessage.includes('attendee') || lowerMessage.includes('view') && lowerMessage.includes('attendee')) {
            return 'As an organizer, you can view attendees for your event by going to "My Events" in your dashboard, selecting the event, and clicking "View Attendees" or "Attendee List" to see all registered participants.';
        }

        if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('account')) {
            return 'To register for an account, click "Sign Up" or "Register" on the homepage, choose your role (Attendee or Organizer), and fill in your details including name, email, and password.';
        }

        if (lowerMessage.includes('login') || lowerMessage.includes('log in') || lowerMessage.includes('password')) {
            if (lowerMessage.includes('forget') || lowerMessage.includes('forgot') || lowerMessage.includes('reset')) {
                return 'If you forgot your password, use the "Forgot Password" option on the login page. Enter your email address and follow the instructions sent to reset your password.';
            }
            return 'You can log in using your email and password. If you encounter issues, ensure your credentials are correct and your internet connection is stable.';
        }

        if (lowerMessage.includes('search') || lowerMessage.includes('find') && lowerMessage.includes('event')) {
            return 'Use the search bar on the Events page to find events. You can search by event name, category, location, or date. Filters are also available to narrow down results.';
        }

        if (lowerMessage.includes('capacity') || lowerMessage.includes('full') || lowerMessage.includes('sold out')) {
            return 'If an event reaches full capacity, the booking button will be disabled and marked as "Full" or "Sold Out". You won\'t be able to book until capacity opens up.';
        }

        if (lowerMessage.includes('admin')) {
            return 'Administrators have full access to manage all events, user accounts, and system settings. They can moderate content, view analytics, and delete or modify any event for safety purposes.';
        }

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return 'Hello! I\'m your Event Management System assistant. I can help you with:\n• Booking and managing event tickets\n• Creating and organizing events\n• Account and profile management\n• Searching and browsing events\n\nWhat would you like to know?';
        }

        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return 'I can help you with questions about:\n• Booking tickets for events\n• Creating and managing events as an organizer\n• Account registration and login\n• Searching for events\n• Managing your bookings\n• Understanding user roles (Attendee, Organizer, Admin)\n\nJust ask me anything about the Event Management System!';
        }

        if (lowerMessage.includes('what') && lowerMessage.includes('app') || lowerMessage.includes('about')) {
            return 'This is an Event Management System that helps users discover, book, organize, and manage events. You can browse events, book tickets, create your own events as an organizer, and manage everything through a user-friendly interface. The platform supports Attendees, Organizers, and Administrators.';
        }

        // Default response
        return 'I can help you with questions about booking events, creating events, managing your account, and using the Event Management System. Could you please ask a more specific question about events, bookings, or your account?';
    }

    /**
     * Detect user intent from their message
     */
    private detectIntent(message: string): 'booking' | 'search' | 'cancel' | 'info' | null {
        const lowerMessage = message.toLowerCase();

        // Booking intent keywords
        const bookingKeywords = ['book', 'buy ticket', 'purchase ticket', 'reserve', 'get ticket', 'i want to attend'];
        const hasBookingIntent = bookingKeywords.some(keyword => lowerMessage.includes(keyword));

        // Search intent keywords
        const searchKeywords = ['find event', 'search event', 'show me event', 'list event', 'what events', 'any concerts', 'upcoming'];
        const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));

        // Cancel intent keywords
        const cancelKeywords = ['cancel booking', 'cancel ticket', 'cancel my reservation'];
        const hasCancelIntent = cancelKeywords.some(keyword => lowerMessage.includes(keyword));

        // Prioritize intents: cancel > booking > search
        if (hasCancelIntent) return 'cancel';
        if (hasBookingIntent && !lowerMessage.includes('how')) return 'booking';  // Exclude "how to book" questions
        if (hasSearchIntent) return 'search';

        return 'info';  // Default to info/questions
    }

    /**
     * Handle booking intent with multi-turn conversation
     */
    private async handleBookingIntent(
        message: string,
        state: ConversationState | null,
        userId?: string
    ): Promise<ChatbotResponse> {
        // Check if user is authenticated
        if (!userId) {
            return {
                message: "To book tickets, you need to be logged in. Please log in to your account and try again.",
                suggestions: ["How do I create an account?", "What events are available?"]
            };
        }

        // Initialize state if not present
        const currentState: ConversationState = state || { intent: 'booking' };

        // TODO: Implement full multi-turn booking flow in next phase
        // For now, provide a helpful message
        return {
            message: "I'd love to help you book tickets! This feature is currently being enhanced. For now, please use the 'Events' page to browse and book tickets. Just click on any event and then click the 'Book Now' button.",
            conversationState: currentState,
            suggestions: ["Show me upcoming events", "What types of events are available?"]
        };
    }

    /**
     * Handle search intent - find events based on user query
     */
    private async handleSearchIntent(
        message: string,
        userId?: string
    ): Promise<ChatbotResponse> {
        // TODO: Implement actual event search using EventController/Repository in next phase
        // For now, provide helpful guidance
        return {
            message: "I can help you find events! You can browse all available events on the Events page, or search by:\n• Event name or keyword\n• Category (concerts, sports, festivals, etc.)\n• Location\n• Date range\n\nWhat kind of event are you looking for?",
            suggestions: ["Show me concerts", "Events this weekend", "Free events"]
        };
    }
}