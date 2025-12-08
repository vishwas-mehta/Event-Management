import fs from 'fs';
import path from 'path';
import { Repository } from 'typeorm';
import { Event } from '../entities/Event.entity';
import { TicketType } from '../entities/TicketType.entity';
import { Booking, BookingStatus } from '../entities/Booking.entity';
import { AppDataSource } from '../config/database';

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
    type: 'navigate' | 'link';
    label: string;
    target: string;
}

interface ChatbotResponse {
    message: string;
    conversationState?: ConversationState;
    suggestions?: string[];
    actions?: ChatbotAction[];
}

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
        if (!userMessage || userMessage.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (userMessage.length > 500) {
            throw new Error('Message too long. Please keep it under 500 characters.');
        }
        if (this.containsPromptInjection(userMessage)) {
            return {
                message: "🚫 I can only answer questions about the Event Management System.",
                suggestions: ['Show me events', 'Help']
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

        // General knowledge-based response
        return this.getKnowledgeBasedResponse(userMessage, userId);
    }

    private containsPromptInjection(message: string): boolean {
        const patterns = [
            /ignore (previous|above) (instructions|prompts)/i,
            /you are now/i,
            /new (instructions|role|system)/i,
            /forget (everything|all|previous)/i,
            /system:|assistant:|user:/i,
            /act as|pretend to be/i,
        ];
        return patterns.some(p => p.test(message));
    }

    private detectIntent(message: string): 'booking' | 'search' | 'cancel' | 'info' {
        const lowerMessage = message.toLowerCase();

        const bookingKeywords = ['book', 'buy ticket', 'purchase', 'reserve', 'get ticket', 'attend', 'book tickets'];
        const searchKeywords = ['find', 'search', 'show', 'list', 'what events', 'upcoming', 'events', 'browse'];
        const cancelKeywords = ['cancel booking', 'cancel ticket', 'cancel reservation'];

        if (cancelKeywords.some(k => lowerMessage.includes(k))) return 'cancel';
        if (bookingKeywords.some(k => lowerMessage.includes(k)) && !lowerMessage.includes('how')) return 'booking';
        if (searchKeywords.some(k => lowerMessage.includes(k))) return 'search';

        return 'info';
    }

    private async handleSearchIntent(message: string, userId?: string): Promise<ChatbotResponse> {
        try {
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
                    message: "😔 There are no upcoming events at the moment.\n\nCheck back later or create your own event!",
                    suggestions: ['Help', 'How do I create an event?'],
                    actions: [
                        { type: 'navigate', label: 'Browse Events', target: '/events' }
                    ]
                };
            }

            let eventList = "🎉 **Upcoming Events**\n\n";
            events.forEach((event, index) => {
                const date = new Date(event.startDateTime).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                });
                const minPrice = event.ticketTypes?.length > 0
                    ? Math.min(...event.ticketTypes.map(t => Number(t.price)))
                    : 0;
                const priceText = minPrice === 0 ? 'Free' : `$${minPrice}`;

                eventList += `**${index + 1}. ${event.title}**\n`;
                eventList += `📅 ${date}  •  📍 ${event.location}\n`;
                eventList += `💰 ${priceText}\n\n`;
            });

            eventList += "📝 Say an event name or number to book!";

            return {
                message: eventList,
                conversationState: {
                    intent: 'booking',
                    step: 'select_event',
                    searchResults: events.map(e => ({ id: e.id, title: e.title }))
                },
                suggestions: events.slice(0, 3).map(e => e.title),
                actions: [
                    { type: 'navigate', label: 'View All Events', target: '/events' }
                ]
            };
        } catch (error) {
            console.error('Search error:', error);
            return {
                message: "😔 Sorry, I had trouble fetching events.\n\nPlease try again or visit the Events page.",
                suggestions: ['Try again', 'Help'],
                actions: [
                    { type: 'navigate', label: 'Go to Events', target: '/events' }
                ]
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
                message: "🔐 **Login Required**\n\nTo book tickets, you need to be logged in.\n\nPlease sign in to your account to continue booking.",
                suggestions: ['Show me events', 'How do I register?'],
                actions: [
                    { type: 'navigate', label: 'Sign In', target: '/login' },
                    { type: 'navigate', label: 'Create Account', target: '/register' }
                ]
            };
        }

        // Check if user mentioned a specific event
        const eventMatch = await this.findEventFromMessage(message);

        if (eventMatch) {
            return await this.showEventForBooking(eventMatch, userId);
        }

        // Start search flow
        return await this.handleSearchIntent(message, userId);
    }

    private async findEventFromMessage(message: string): Promise<Event | null> {
        const lowerMessage = message.toLowerCase();

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

        const availableTickets = event.ticketTypes?.filter(t => t.capacity - t.sold > 0) || [];

        if (availableTickets.length === 0) {
            return {
                message: `😔 **${event.title}** is sold out.\n\nWould you like to see other upcoming events?`,
                suggestions: ['Show me events', 'Help'],
                actions: [
                    { type: 'navigate', label: 'Browse Events', target: '/events' }
                ]
            };
        }

        let ticketInfo = "";
        availableTickets.forEach((ticket, index) => {
            const available = ticket.capacity - ticket.sold;
            const priceText = Number(ticket.price) === 0 ? 'Free' : `$${ticket.price}`;
            ticketInfo += `**${index + 1}. ${ticket.name}** — ${priceText}\n`;
            ticketInfo += `   🎟️ ${available} tickets left\n\n`;
        });

        return {
            message: `🎫 **${event.title}**\n\n📅 ${date}\n⏰ ${time}\n📍 ${event.location}\n\n**Available Tickets:**\n\n${ticketInfo}Which ticket type would you like?`,
            conversationState: {
                intent: 'booking',
                step: 'select_ticket_type',
                eventId: event.id,
                eventName: event.title,
                searchResults: availableTickets.map(t => ({ id: t.id, name: t.name, price: Number(t.price) }))
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
                message: "🔐 You need to be logged in to continue booking.",
                actions: [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

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

        // Check for number
        const numberMatch = message.match(/\b(\d+)\b/);
        if (numberMatch) {
            const index = parseInt(numberMatch[1]) - 1;
            if (index >= 0 && index < searchResults.length) {
                const event = await this.eventRepository.findOne({
                    where: { id: searchResults[index].id },
                    relations: ['ticketTypes']
                });
                if (event) return await this.showEventForBooking(event, userId);
            }
        }

        // Check for name match
        for (const eventRef of searchResults) {
            if (lowerMessage.includes(eventRef.title.toLowerCase())) {
                const event = await this.eventRepository.findOne({
                    where: { id: eventRef.id },
                    relations: ['ticketTypes']
                });
                if (event) return await this.showEventForBooking(event, userId);
            }
        }

        return {
            message: "🤔 I couldn't find that event.\n\nPlease say the event name or number from the list.",
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

        // Check for number
        const numberMatch = message.match(/\b(\d+)\b/);
        if (numberMatch && !lowerMessage.includes('ticket')) {
            const index = parseInt(numberMatch[1]) - 1;
            if (index >= 0 && index < searchResults.length) {
                const ticket = searchResults[index];
                const priceText = ticket.price === 0 ? 'Free' : `$${ticket.price}`;
                return {
                    message: `✅ **${ticket.name}** selected (${priceText} each)\n\n🔢 How many tickets would you like?\n\n(Enter a number from 1-10)`,
                    conversationState: {
                        ...state,
                        step: 'select_quantity',
                        ticketTypeId: ticket.id,
                        ticketTypeName: ticket.name
                    },
                    suggestions: ['1', '2', '4']
                };
            }
        }

        // Check for name match
        for (const ticket of searchResults) {
            if (lowerMessage.includes(ticket.name.toLowerCase())) {
                const priceText = ticket.price === 0 ? 'Free' : `$${ticket.price}`;
                return {
                    message: `✅ **${ticket.name}** selected (${priceText} each)\n\n🔢 How many tickets would you like?`,
                    conversationState: {
                        ...state,
                        step: 'select_quantity',
                        ticketTypeId: ticket.id,
                        ticketTypeName: ticket.name
                    },
                    suggestions: ['1', '2', '4']
                };
            }
        }

        return {
            message: "🤔 I couldn't find that ticket type.\n\nPlease say the ticket name or number.",
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
                message: "🔢 Please enter a number (1-10) for how many tickets you want.",
                conversationState: state,
                suggestions: ['1', '2', '4']
            };
        }

        const quantity = parseInt(numberMatch[1]);
        if (quantity < 1 || quantity > 10) {
            return {
                message: "⚠️ Please select between 1 and 10 tickets.",
                conversationState: state,
                suggestions: ['1', '2', '4']
            };
        }

        const ticketType = await this.ticketTypeRepository.findOne({
            where: { id: state.ticketTypeId }
        });

        if (!ticketType) {
            return {
                message: "😔 That ticket type is no longer available.",
                suggestions: ['Show me events']
            };
        }

        const available = ticketType.capacity - ticketType.sold;
        if (quantity > available) {
            return {
                message: `⚠️ Only ${available} tickets available. Please choose fewer.`,
                conversationState: state,
                suggestions: [`${Math.min(available, 1)}`, `${Math.min(available, 2)}`]
            };
        }

        const totalPrice = Number(ticketType.price) * quantity;
        const totalText = totalPrice === 0 ? 'Free!' : `$${totalPrice.toFixed(2)}`;

        return {
            message: `📋 **Booking Summary**\n\n🎫 **Event:** ${state.eventName}\n🎟️ **Ticket:** ${state.ticketTypeName}\n🔢 **Quantity:** ${quantity}\n💰 **Total:** ${totalText}\n\n✅ Ready to confirm?`,
            conversationState: {
                ...state,
                step: 'confirm_booking',
                quantity
            },
            suggestions: ['Yes, book it!', 'Cancel']
        };
    }

    private async handleBookingConfirmation(
        message: string,
        state: ConversationState,
        userId: string
    ): Promise<ChatbotResponse> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('no') || lowerMessage.includes('cancel') || lowerMessage.includes('stop')) {
            return {
                message: "👍 No problem! Booking cancelled.\n\nWhat else can I help you with?",
                suggestions: ['Show me events', 'Help']
            };
        }

        if (lowerMessage.includes('yes') || lowerMessage.includes('confirm') || lowerMessage.includes('book')) {
            try {
                const booking = await AppDataSource.transaction(async (em) => {
                    const ticketType = await em
                        .getRepository(TicketType)
                        .createQueryBuilder('tt')
                        .setLock('pessimistic_write')
                        .where('tt.id = :id', { id: state.ticketTypeId })
                        .getOne();

                    if (!ticketType) throw new Error('Ticket type not found');

                    const available = ticketType.capacity - ticketType.sold;
                    if (available < state.quantity!) {
                        throw new Error(`Only ${available} tickets left`);
                    }

                    const totalPrice = Number(ticketType.price) * state.quantity!;

                    const newBooking = em.getRepository(Booking).create({
                        userId,
                        eventId: state.eventId,
                        ticketTypeId: state.ticketTypeId,
                        quantity: state.quantity,
                        totalPrice,
                        status: BookingStatus.CONFIRMED,
                    });

                    await em.getRepository(Booking).save(newBooking);

                    ticketType.sold += state.quantity!;
                    await em.getRepository(TicketType).save(ticketType);

                    return newBooking;
                });

                return {
                    message: `🎉 **Booking Confirmed!**\n\nYour tickets for **${state.eventName}** are booked!\n\n📋 **Reference:** ${booking.bookingReference}\n\nYou can view your booking in "My Bookings".\n\nAnything else I can help with?`,
                    suggestions: ['Show me events', 'Help'],
                    actions: [
                        { type: 'navigate', label: 'View My Bookings', target: '/bookings' }
                    ]
                };
            } catch (error: any) {
                console.error('Booking error:', error);
                return {
                    message: `❌ **Booking Failed**\n\n${error.message || 'Please try again.'}\n\nYou can also book directly from the event page.`,
                    suggestions: ['Try again', 'Show me events'],
                    actions: [
                        { type: 'navigate', label: 'Go to Events', target: '/events' }
                    ]
                };
            }
        }

        return {
            message: "🤔 Would you like to confirm this booking?",
            conversationState: state,
            suggestions: ['Yes, book it!', 'Cancel']
        };
    }

    private getKnowledgeBasedResponse(message: string, userId?: string): ChatbotResponse {
        const lowerMessage = message.toLowerCase();

        // Greetings
        if (['hello', 'hi', 'hey', 'hola', 'greetings'].some(g => lowerMessage.includes(g))) {
            return {
                message: "👋 Hello! I'm your event assistant.\n\nI can help you:\n• 🎫 Book tickets\n• 🔍 Find events\n• ❓ Answer questions\n\nWhat would you like to do?",
                suggestions: ['Show me events', 'Book tickets', 'Help']
            };
        }

        // Help
        if (['help', 'what can you do', 'commands', 'options'].some(h => lowerMessage.includes(h))) {
            return {
                message: "🤖 **I can help you with:**\n\n🎫 **Booking** — \"Book tickets\" or \"I want to attend\"\n🔍 **Search** — \"Show me events\" or \"Find concerts\"\n❌ **Cancel** — \"Cancel my booking\"\n❓ **Questions** — Ask me anything!\n\n💡 Try clicking the suggestions below!",
                suggestions: ['Show me events', 'Book tickets', 'How do I register?']
            };
        }

        // Registration / Sign up
        if (['register', 'sign up', 'create account', 'new account'].some(r => lowerMessage.includes(r))) {
            return {
                message: "📝 **How to Create an Account**\n\n1. Click \"Create Account\" below\n2. Choose your role (Attendee or Organizer)\n3. Fill in your details\n4. You're ready to book events!\n\n🎫 Attendees can book events\n🎪 Organizers can create events",
                suggestions: ['Show me events', 'Help'],
                actions: [
                    { type: 'navigate', label: 'Create Account', target: '/register' },
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Login
        if (['login', 'log in', 'sign in', 'signin'].some(l => lowerMessage.includes(l))) {
            return {
                message: "🔐 **Sign In**\n\nClick below to sign in to your account.\n\nForgot your password? Use the reset option on the login page.",
                suggestions: ['Show me events', 'How do I register?'],
                actions: [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Cancel booking
        if (['cancel', 'cancellation'].some(c => lowerMessage.includes(c)) &&
            ['booking', 'ticket', 'reservation'].some(b => lowerMessage.includes(b))) {
            if (!userId) {
                return {
                    message: "🔐 You need to be logged in to manage bookings.",
                    actions: [
                        { type: 'navigate', label: 'Sign In', target: '/login' }
                    ]
                };
            }
            return {
                message: "❌ **Cancel a Booking**\n\nTo cancel a booking:\n\n1. Go to \"My Bookings\"\n2. Find your booking\n3. Click \"Cancel Booking\"\n\n⚠️ Note: Cancellation policies may vary by event.",
                suggestions: ['Show me events', 'Help'],
                actions: [
                    { type: 'navigate', label: 'My Bookings', target: '/bookings' }
                ]
            };
        }

        // Create event
        if (['create event', 'organize', 'host event', 'make event'].some(c => lowerMessage.includes(c))) {
            return {
                message: "🎪 **Create an Event**\n\nTo create an event:\n\n1. Sign up as an Organizer\n2. Go to your Dashboard\n3. Click \"Create Event\"\n4. Fill in the details\n\n✨ Add tickets, set capacity, and publish!",
                suggestions: ['Show me events', 'How do I register?'],
                actions: userId ? [
                    { type: 'navigate', label: 'Go to Dashboard', target: '/dashboard' }
                ] : [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // My bookings
        if (['my booking', 'my ticket', 'my reservation', 'booked'].some(m => lowerMessage.includes(m))) {
            if (!userId) {
                return {
                    message: "🔐 Sign in to view your bookings.",
                    actions: [
                        { type: 'navigate', label: 'Sign In', target: '/login' }
                    ]
                };
            }
            return {
                message: "🎫 **Your Bookings**\n\nView all your tickets and booking history in \"My Bookings\".",
                suggestions: ['Show me events', 'Help'],
                actions: [
                    { type: 'navigate', label: 'View My Bookings', target: '/bookings' }
                ]
            };
        }

        // Thanks
        if (['thank', 'thanks', 'thx', 'awesome', 'great'].some(t => lowerMessage.includes(t))) {
            return {
                message: "😊 You're welcome! Happy to help.\n\nAnything else you'd like to know?",
                suggestions: ['Show me events', 'Help']
            };
        }

        // Default fallback
        return {
            message: "🤔 I'm not sure about that.\n\nI can help you with:\n• Finding and booking events\n• Creating an account\n• Managing your bookings\n\nTry one of the options below!",
            suggestions: ['Show me events', 'Book tickets', 'Help'],
            actions: [
                { type: 'navigate', label: 'Browse Events', target: '/events' }
            ]
        };
    }
}