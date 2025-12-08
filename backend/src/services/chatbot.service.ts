import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { Repository } from 'typeorm';
import { Event } from '../entities/Event.entity';
import { TicketType } from '../entities/TicketType.entity';
import { Booking, BookingStatus } from '../entities/Booking.entity';
import { AppDataSource } from '../config/database';

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
    private eventRepository: Repository<Event>;
    private ticketTypeRepository: Repository<TicketType>;
    private bookingRepository: Repository<Booking>;

    constructor() {
        const knowledgePath = path.join(__dirname, '../knowledge/chatbot_knowledge.txt');
        this.knowledgeBase = fs.readFileSync(knowledgePath, 'utf-8');
        this.eventRepository = AppDataSource.getRepository(Event);
        this.ticketTypeRepository = AppDataSource.getRepository(TicketType);
        this.bookingRepository = AppDataSource.getRepository(Booking);
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
        if (this.containsPromptInjection(userMessage)) {
            return {
                message: "I can only answer questions about the Event Management System. Please ask a relevant question."
            };
        }

        // Check for active conversation state
        if (conversationState && conversationState.intent === 'booking' && conversationState.step) {
            return await this.continueBookingFlow(userMessage, conversationState, userId);
        }

        // Detect user intent
        const intent = this.detectIntent(userMessage);

        if (intent === 'booking') {
            return await this.handleBookingIntent(userMessage, conversationState, userId);
        }

        if (intent === 'search') {
            return await this.handleSearchIntent(userMessage, userId);
        }

        // For general info/questions, use the fallback knowledge base response
        const fallbackMessage = this.getKnowledgeBasedResponse(userMessage);
        return { message: fallbackMessage };
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

    private detectIntent(message: string): 'booking' | 'search' | 'cancel' | 'info' | null {
        const lowerMessage = message.toLowerCase();

        const bookingKeywords = ['book', 'buy ticket', 'purchase ticket', 'reserve', 'get ticket', 'i want to attend'];
        const hasBookingIntent = bookingKeywords.some(keyword => lowerMessage.includes(keyword));

        const searchKeywords = ['find event', 'search event', 'show me event', 'list event', 'what events', 'any concerts', 'upcoming', 'show me upcoming'];
        const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));

        const cancelKeywords = ['cancel booking', 'cancel ticket', 'cancel my reservation'];
        const hasCancelIntent = cancelKeywords.some(keyword => lowerMessage.includes(keyword));

        if (hasCancelIntent) return 'cancel';
        if (hasBookingIntent && !lowerMessage.includes('how')) return 'booking';
        if (hasSearchIntent) return 'search';

        return 'info';
    }

    private async handleSearchIntent(
        message: string,
        userId?: string
    ): Promise<ChatbotResponse> {
        try {
            // Get upcoming published events
            const events = await this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.category', 'category')
                .leftJoinAndSelect('event.ticketTypes', 'ticketTypes')
                .where('event.isPublished = :isPublished', { isPublished: true })
                .andWhere('event.startDateTime > :now', { now: new Date() })
                .orderBy('event.startDateTime', 'ASC')
                .take(5)
                .getMany();

            if (events.length === 0) {
                return {
                    message: "There are no upcoming events at the moment. Check back later!",
                    suggestions: ["How do I create an account?", "What is this application about?"]
                };
            }

            let eventList = "Here are some upcoming events:\n\n";
            events.forEach((event, index) => {
                const date = new Date(event.startDateTime).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                });
                const minPrice = event.ticketTypes?.length > 0
                    ? Math.min(...event.ticketTypes.map(t => Number(t.price)))
                    : 0;
                eventList += `${index + 1}. **${event.title}**\n`;
                eventList += `   📅 ${date} | 📍 ${event.location}\n`;
                eventList += `   💰 Starting from $${minPrice}\n\n`;
            });

            eventList += "Would you like to book tickets for any of these events? Just tell me the event name or number!";

            return {
                message: eventList,
                conversationState: {
                    intent: 'booking',
                    step: 'select_event',
                    searchResults: events.map(e => ({ id: e.id, title: e.title }))
                },
                suggestions: events.slice(0, 3).map(e => `Book ${e.title}`)
            };
        } catch (error) {
            console.error('Search error:', error);
            return {
                message: "Sorry, I had trouble fetching events. Please try again or visit the Events page.",
                suggestions: ["Show me upcoming events", "How do I book tickets?"]
            };
        }
    }

    private async handleBookingIntent(
        message: string,
        state: ConversationState | null,
        userId?: string
    ): Promise<ChatbotResponse> {
        if (!userId) {
            return {
                message: "To book tickets, you need to be logged in. Please log in to your account and try again.",
                suggestions: ["How do I create an account?", "Show me upcoming events"]
            };
        }

        // Check if user mentioned a specific event
        const eventMatch = await this.findEventFromMessage(message);

        if (eventMatch) {
            return await this.showEventForBooking(eventMatch, userId);
        }

        // Start search flow if no specific event mentioned
        return await this.handleSearchIntent(message, userId);
    }

    private async findEventFromMessage(message: string): Promise<Event | null> {
        const lowerMessage = message.toLowerCase();

        // Search for event by title
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.ticketTypes', 'ticketTypes')
            .where('event.isPublished = :isPublished', { isPublished: true })
            .andWhere('event.startDateTime > :now', { now: new Date() })
            .getMany();

        for (const event of events) {
            if (lowerMessage.includes(event.title.toLowerCase())) {
                return event;
            }
        }

        return null;
    }

    private async showEventForBooking(event: Event, userId: string): Promise<ChatbotResponse> {
        const date = new Date(event.startDateTime).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
        const time = new Date(event.startDateTime).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
        });

        let ticketInfo = "";
        const availableTickets = event.ticketTypes?.filter(t => t.capacity - t.sold > 0) || [];

        if (availableTickets.length === 0) {
            return {
                message: `Sorry, **${event.title}** is sold out. Would you like to see other events?`,
                suggestions: ["Show me upcoming events", "Join the waitlist"]
            };
        }

        ticketInfo = "Available ticket types:\n";
        availableTickets.forEach((ticket, index) => {
            const available = ticket.capacity - ticket.sold;
            ticketInfo += `${index + 1}. **${ticket.name}** - $${ticket.price} (${available} available)\n`;
        });

        return {
            message: `Great choice! Here are the details for **${event.title}**:\n\n📅 **Date:** ${date}\n⏰ **Time:** ${time}\n📍 **Location:** ${event.location}\n\n${ticketInfo}\nWhich ticket type would you like? Just say the name or number.`,
            conversationState: {
                intent: 'booking',
                step: 'select_ticket_type',
                eventId: event.id,
                eventName: event.title,
                searchResults: availableTickets.map(t => ({ id: t.id, name: t.name, price: t.price }))
            },
            suggestions: availableTickets.slice(0, 3).map(t => t.name)
        };
    }

    private async continueBookingFlow(
        message: string,
        state: ConversationState,
        userId?: string
    ): Promise<ChatbotResponse> {
        if (!userId) {
            return {
                message: "To book tickets, you need to be logged in. Please log in and try again.",
                suggestions: ["How do I create an account?"]
            };
        }

        const lowerMessage = message.toLowerCase();

        switch (state.step) {
            case 'select_event':
                return await this.handleEventSelection(message, state, userId);

            case 'select_ticket_type':
                return await this.handleTicketTypeSelection(message, state, userId);

            case 'select_quantity':
                return await this.handleQuantitySelection(message, state, userId);

            case 'confirm_booking':
                return await this.handleBookingConfirmation(message, state, userId);

            default:
                return await this.handleSearchIntent(message, userId);
        }
    }

    private async handleEventSelection(
        message: string,
        state: ConversationState,
        userId: string
    ): Promise<ChatbotResponse> {
        const lowerMessage = message.toLowerCase();
        const searchResults = state.searchResults || [];

        // Check for event number (1, 2, 3, etc.)
        const numberMatch = message.match(/\b(\d+)\b/);
        if (numberMatch) {
            const index = parseInt(numberMatch[1]) - 1;
            if (index >= 0 && index < searchResults.length) {
                const selectedEvent = await this.eventRepository.findOne({
                    where: { id: searchResults[index].id },
                    relations: ['ticketTypes']
                });
                if (selectedEvent) {
                    return await this.showEventForBooking(selectedEvent, userId);
                }
            }
        }

        // Check for event name match
        for (const eventRef of searchResults) {
            if (lowerMessage.includes(eventRef.title.toLowerCase()) ||
                lowerMessage.includes('book ' + eventRef.title.toLowerCase())) {
                const event = await this.eventRepository.findOne({
                    where: { id: eventRef.id },
                    relations: ['ticketTypes']
                });
                if (event) {
                    return await this.showEventForBooking(event, userId);
                }
            }
        }

        return {
            message: "I couldn't find that event. Please select from the list above by saying the event name or number.",
            conversationState: state,
            suggestions: searchResults.slice(0, 3).map((e: any) => e.title)
        };
    }

    private async handleTicketTypeSelection(
        message: string,
        state: ConversationState,
        userId: string
    ): Promise<ChatbotResponse> {
        const lowerMessage = message.toLowerCase();
        const searchResults = state.searchResults || [];

        // Check for number selection
        const numberMatch = message.match(/\b(\d+)\b/);
        if (numberMatch && !lowerMessage.includes('ticket')) {
            const index = parseInt(numberMatch[1]) - 1;
            if (index >= 0 && index < searchResults.length) {
                const selectedTicket = searchResults[index];
                return {
                    message: `Great! You selected **${selectedTicket.name}** ($${selectedTicket.price} per ticket).\n\nHow many tickets would you like?`,
                    conversationState: {
                        ...state,
                        step: 'select_quantity',
                        ticketTypeId: selectedTicket.id,
                        ticketTypeName: selectedTicket.name
                    },
                    suggestions: ['1 ticket', '2 tickets', '4 tickets']
                };
            }
        }

        // Check for name match
        for (const ticket of searchResults) {
            if (lowerMessage.includes(ticket.name.toLowerCase())) {
                return {
                    message: `Great! You selected **${ticket.name}** ($${ticket.price} per ticket).\n\nHow many tickets would you like?`,
                    conversationState: {
                        ...state,
                        step: 'select_quantity',
                        ticketTypeId: ticket.id,
                        ticketTypeName: ticket.name
                    },
                    suggestions: ['1 ticket', '2 tickets', '4 tickets']
                };
            }
        }

        return {
            message: "I couldn't find that ticket type. Please select from the options above.",
            conversationState: state,
            suggestions: searchResults.slice(0, 3).map((t: any) => t.name)
        };
    }

    private async handleQuantitySelection(
        message: string,
        state: ConversationState,
        userId: string
    ): Promise<ChatbotResponse> {
        const numberMatch = message.match(/\b(\d+)\b/);
        if (!numberMatch) {
            return {
                message: "Please enter a number for how many tickets you want.",
                conversationState: state,
                suggestions: ['1 ticket', '2 tickets', '4 tickets']
            };
        }

        const quantity = parseInt(numberMatch[1]);
        if (quantity < 1 || quantity > 10) {
            return {
                message: "Please select between 1 and 10 tickets.",
                conversationState: state,
                suggestions: ['1 ticket', '2 tickets', '4 tickets']
            };
        }

        // Get ticket type for price calculation
        const ticketType = await this.ticketTypeRepository.findOne({
            where: { id: state.ticketTypeId }
        });

        if (!ticketType) {
            return {
                message: "Sorry, that ticket type is no longer available. Would you like to see other events?",
                suggestions: ["Show me upcoming events"]
            };
        }

        const available = ticketType.capacity - ticketType.sold;
        if (quantity > available) {
            return {
                message: `Sorry, only ${available} tickets are available. Please select a smaller quantity.`,
                conversationState: state,
                suggestions: [`${Math.min(available, 1)} ticket`, `${Math.min(available, 2)} tickets`]
            };
        }

        const totalPrice = Number(ticketType.price) * quantity;

        return {
            message: `Here's your booking summary:\n\n🎫 **Event:** ${state.eventName}\n🎟️ **Ticket Type:** ${state.ticketTypeName}\n🔢 **Quantity:** ${quantity}\n💰 **Total:** $${totalPrice.toFixed(2)}\n\nWould you like to confirm this booking?`,
            conversationState: {
                ...state,
                step: 'confirm_booking',
                quantity
            },
            suggestions: ['Yes, confirm booking', 'No, cancel']
        };
    }

    private async handleBookingConfirmation(
        message: string,
        state: ConversationState,
        userId: string
    ): Promise<ChatbotResponse> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('no') || lowerMessage.includes('cancel')) {
            return {
                message: "No problem! Your booking has been cancelled. Would you like to browse other events?",
                suggestions: ["Show me upcoming events", "I want to book tickets"]
            };
        }

        if (lowerMessage.includes('yes') || lowerMessage.includes('confirm')) {
            try {
                // Create the booking using transaction
                const booking = await AppDataSource.transaction(async (transactionalEntityManager) => {
                    const ticketType = await transactionalEntityManager
                        .getRepository(TicketType)
                        .createQueryBuilder('ticketType')
                        .setLock('pessimistic_write')
                        .where('ticketType.id = :id', { id: state.ticketTypeId })
                        .getOne();

                    if (!ticketType) {
                        throw new Error('Ticket type not found');
                    }

                    const available = ticketType.capacity - ticketType.sold;
                    if (available < state.quantity!) {
                        throw new Error(`Only ${available} tickets available`);
                    }

                    const totalPrice = Number(ticketType.price) * state.quantity!;

                    const newBooking = transactionalEntityManager.getRepository(Booking).create({
                        userId,
                        eventId: state.eventId,
                        ticketTypeId: state.ticketTypeId,
                        quantity: state.quantity,
                        totalPrice,
                        status: BookingStatus.CONFIRMED,
                    });

                    await transactionalEntityManager.getRepository(Booking).save(newBooking);

                    ticketType.sold += state.quantity!;
                    await transactionalEntityManager.getRepository(TicketType).save(ticketType);

                    return newBooking;
                });

                return {
                    message: `🎉 **Booking Confirmed!**\n\nYour tickets for **${state.eventName}** have been booked successfully!\n\n📋 **Booking Reference:** ${booking.bookingReference}\n\nYou can view your booking details in the "My Bookings" section of your account.\n\nIs there anything else I can help you with?`,
                    suggestions: ["Show me upcoming events", "How do I cancel a booking?"]
                };
            } catch (error: any) {
                console.error('Booking error:', error);
                return {
                    message: `Sorry, I couldn't complete your booking. ${error.message || 'Please try again or book through the Events page.'}`,
                    suggestions: ["Show me upcoming events", "Try booking again"]
                };
            }
        }

        return {
            message: "Please confirm if you'd like to proceed with the booking.",
            conversationState: state,
            suggestions: ['Yes, confirm booking', 'No, cancel']
        };
    }

    private getKnowledgeBasedResponse(message: string): string {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('book') && (lowerMessage.includes('event') || lowerMessage.includes('ticket'))) {
            return 'To book an event, navigate to the Events page, browse or search for an event you\'re interested in, click on it to view details, and then click the "Book Now" button. You must be logged in to book events. Or just tell me "I want to book tickets" and I\'ll help you!';
        }

        if (lowerMessage.includes('cancel') && (lowerMessage.includes('book') || lowerMessage.includes('ticket'))) {
            return 'Yes, you can cancel your booking. Go to the "My Bookings" page, find the event you want to cancel, and click the "Cancel Booking" button. Cancellation policies may vary by event.';
        }

        if (lowerMessage.includes('create') && lowerMessage.includes('event')) {
            return 'To create an event, you must be logged in with an Organizer account. Go to your Dashboard and click "Create Event", then fill in all the required details.';
        }

        if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('account')) {
            return 'To register for an account, click "Sign Up" or "Register" on the homepage, choose your role (Attendee or Organizer), and fill in your details.';
        }

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return 'Hello! I\'m your Event Management System assistant. I can help you book tickets, find events, and answer questions. What would you like to do?';
        }

        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return 'I can help you with:\n• Booking tickets for events\n• Searching for upcoming events\n• Account and profile questions\n• General information about the platform\n\nJust ask me anything!';
        }

        return 'I can help you with questions about booking events, creating events, managing your account, and using the Event Management System. Would you like to see upcoming events or book tickets?';
    }
}