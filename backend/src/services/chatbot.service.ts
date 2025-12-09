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
        userId?: string,
        userRole?: string
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
            return await this.continueBookingFlow(userMessage, conversationState, userId, userRole);
        }

        // Detect user intent
        const intent = this.detectIntent(userMessage);

        if (intent === 'booking') {
            return await this.handleBookingIntent(userMessage, conversationState, userId, userRole);
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
        userId?: string,
        userRole?: string
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

        // Only attendees can book tickets
        if (userRole && userRole !== 'attendee') {
            return {
                message: "⚠️ **Booking Not Available**\n\nOnly attendee accounts can book tickets.\n\nAdmins and Organizers cannot book tickets for events.",
                suggestions: ['Show me events', 'Help']
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
        userId?: string,
        userRole?: string
    ): Promise<ChatbotResponse> {
        if (!userId) {
            return {
                message: "🔐 You need to be logged in to continue booking.",
                actions: [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Only attendees can book tickets
        if (userRole && userRole !== 'attendee') {
            return {
                message: "⚠️ **Booking Not Available**\n\nOnly attendee accounts can book tickets.\n\nAdmins and Organizers cannot book tickets for events.",
                suggestions: ['Show me events', 'Help']
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
        if (['hello', 'hi', 'hey', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening'].some(g => lowerMessage.includes(g))) {
            return {
                message: "👋 Hello! I'm your event assistant.\n\nI can help you:\n• 🎫 Book tickets\n• 🔍 Find events\n• ❓ Answer questions about the platform\n\nWhat would you like to do?",
                suggestions: ['Show me events', 'Book tickets', 'Help']
            };
        }

        // Help / What can you do
        if (['help', 'what can you do', 'commands', 'options', 'assist'].some(h => lowerMessage.includes(h))) {
            return {
                message: "🤖 **I can help you with:**\n\n🎫 **Booking** — \"Book tickets\" or \"I want to attend\"\n🔍 **Search** — \"Show me events\" or \"Find concerts\"\n❌ **Cancel** — \"Cancel my booking\"\n❓ **FAQs** — Ask about the platform!\n\n**Example Questions:**\n• How do I create an account?\n• What types of events can I find?\n• How do I become an organizer?",
                suggestions: ['Show me events', 'How do I register?', 'What is this app?']
            };
        }

        // About the platform / What is this app
        if (['what is this', 'about', 'platform', 'what does this', 'event management system'].some(a => lowerMessage.includes(a))) {
            return {
                message: "🎪 **About EventHub**\n\nThis is an Event Management System that helps you:\n\n• 🔍 Discover and search events\n• 🎫 Book tickets easily\n• 📋 Manage your bookings\n• 🎪 Create and organize events (for organizers)\n\nWe support concerts, workshops, conferences, sports events, and more!",
                suggestions: ['Show me events', 'How do I register?', 'Help']
            };
        }

        // Registration / Sign up
        if (['register', 'sign up', 'create account', 'new account', 'how to join', 'make account'].some(r => lowerMessage.includes(r))) {
            return {
                message: "📝 **How to Create an Account**\n\n1. Click \"Sign Up\" on the homepage\n2. Choose your role:\n   • **Attendee** — Browse and book events\n   • **Organizer** — Create and manage events\n3. Fill in your name, email, and password\n4. You're ready to go!\n\n🎫 After registering, you can start booking events immediately.",
                suggestions: ['Show me events', 'How to become organizer?'],
                actions: [
                    { type: 'navigate', label: 'Create Account', target: '/register' },
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Login / Sign in
        if (['login', 'log in', 'sign in', 'signin', 'access account'].some(l => lowerMessage.includes(l))) {
            return {
                message: "🔐 **Sign In to Your Account**\n\nClick below to log in.\n\n**Forgot your password?**\nUse the \"Forgot Password\" link on the login page to reset it via email.",
                suggestions: ['Show me events', 'How do I register?'],
                actions: [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Forgot password
        if (['forgot password', 'reset password', 'can\'t login', 'password reset'].some(p => lowerMessage.includes(p))) {
            return {
                message: "🔑 **Reset Your Password**\n\n1. Go to the Login page\n2. Click \"Forgot Password\"\n3. Enter your email address\n4. Check your email for reset instructions\n5. Create a new password\n\nIf you don't receive the email, check your spam folder.",
                suggestions: ['Help', 'Show me events'],
                actions: [
                    { type: 'navigate', label: 'Go to Login', target: '/login' }
                ]
            };
        }

        // How to book / Booking process
        if (['how to book', 'how do i book', 'booking process', 'buy ticket', 'get ticket', 'reserve'].some(b => lowerMessage.includes(b))) {
            return {
                message: "🎫 **How to Book an Event**\n\n1. Browse the Events page\n2. Click on an event you like\n3. Select your ticket type\n4. Choose quantity\n5. Click \"Book Now\"\n\n✅ You'll get a booking confirmation immediately!\n\n⚠️ You must be logged in to book.",
                suggestions: ['Show me events', 'My bookings'],
                actions: [
                    { type: 'navigate', label: 'Browse Events', target: '/events' }
                ]
            };
        }

        // Cancel booking
        if (['cancel', 'cancellation'].some(c => lowerMessage.includes(c)) &&
            ['booking', 'ticket', 'reservation', 'my'].some(b => lowerMessage.includes(b))) {
            if (!userId) {
                return {
                    message: "🔐 You need to be logged in to manage bookings.",
                    actions: [
                        { type: 'navigate', label: 'Sign In', target: '/login' }
                    ]
                };
            }
            return {
                message: "❌ **Cancel a Booking**\n\n1. Go to \"My Bookings\"\n2. Find the event you want to cancel\n3. Click \"Cancel Booking\"\n\n⚠️ **Note:** Cancellation policies may vary by event. Cancelled tickets may free up spots for others on the waitlist.",
                suggestions: ['Show me events', 'My bookings'],
                actions: [
                    { type: 'navigate', label: 'My Bookings', target: '/bookings' }
                ]
            };
        }

        // Limit on bookings
        if (['limit', 'how many can i book', 'maximum booking'].some(l => lowerMessage.includes(l))) {
            return {
                message: "📊 **Booking Limits**\n\nThere's no limit on how many different events you can book!\n\nHowever, each booking may be limited to a certain number of tickets per person (usually up to 10) based on event availability.",
                suggestions: ['Show me events', 'How to book?']
            };
        }

        // Sold out / Full capacity
        if (['sold out', 'full', 'no tickets', 'capacity'].some(s => lowerMessage.includes(s))) {
            return {
                message: "🚫 **Sold Out Events**\n\nWhen an event reaches full capacity:\n• The \"Book Now\" button is disabled\n• Event shows as \"Sold Out\"\n\n💡 **Tip:** You may be able to join a waitlist. If someone cancels, spots may open up!",
                suggestions: ['Show me events', 'Help']
            };
        }

        // Notifications / Reminders
        if (['notification', 'reminder', 'alert', 'email'].some(n => lowerMessage.includes(n))) {
            return {
                message: "🔔 **Notifications & Reminders**\n\nYes! You'll receive:\n• Booking confirmation emails\n• Event reminders before your events\n• Updates if event details change\n\nMake sure your email is correct in your profile!",
                suggestions: ['My bookings', 'Help']
            };
        }

        // Past bookings / History
        if (['past booking', 'booking history', 'previous event', 'attended'].some(p => lowerMessage.includes(p))) {
            return {
                message: "📜 **Booking History**\n\nYou can see all your past and upcoming bookings in \"My Bookings\".\n\nThis includes:\n• Event details\n• Booking reference\n• Status (confirmed, cancelled, attended)",
                suggestions: ['My bookings', 'Show me events'],
                actions: userId ? [
                    { type: 'navigate', label: 'View My Bookings', target: '/bookings' }
                ] : [
                    { type: 'navigate', label: 'Sign In', target: '/login' }
                ]
            };
        }

        // Create event / Become organizer
        if (['create event', 'organize', 'host event', 'make event', 'become organizer', 'organizer account'].some(c => lowerMessage.includes(c))) {
            return {
                message: "🎪 **Creating Events**\n\nTo create an event, you need an **Organizer account**.\n\n**Steps:**\n1. Register as an Organizer (or request upgrade)\n2. Go to your Dashboard\n3. Click \"Create Event\"\n4. Fill in: title, description, date, location, capacity\n5. Add ticket types and publish!\n\n✨ You can track attendees and bookings from your dashboard.",
                suggestions: ['How do I register?', 'Show me events'],
                actions: userId ? [
                    { type: 'navigate', label: 'Go to Dashboard', target: '/dashboard' }
                ] : [
                    { type: 'navigate', label: 'Register', target: '/register' }
                ]
            };
        }

        // Edit event
        if (['edit event', 'update event', 'change event', 'modify event'].some(e => lowerMessage.includes(e))) {
            return {
                message: "✏️ **Editing Events**\n\nOrganizers can edit their events anytime before the event ends.\n\n**You can update:**\n• Title and description\n• Date, time, location\n• Capacity\n• Ticket types\n\n⚠️ Note: You cannot edit events that have already concluded.",
                suggestions: ['How to create event?', 'Help']
            };
        }

        // View attendees
        if (['view attendee', 'attendee list', 'see attendee', 'who registered', 'participant'].some(a => lowerMessage.includes(a))) {
            return {
                message: "👥 **View Attendees**\n\nOrganizers can view all registered attendees:\n\n1. Go to your Dashboard\n2. Click \"Manage\" on your event\n3. Go to \"Attendees\" tab\n\nYou'll see names, emails, booking references, and ticket quantities.",
                suggestions: ['How to create event?', 'Help']
            };
        }

        // Delete event
        if (['delete event', 'remove event', 'cancel event'].some(d => lowerMessage.includes(d))) {
            return {
                message: "🗑️ **Deleting Events**\n\nOrganizers can delete their own events:\n\n1. Go to your Dashboard\n2. Click \"Manage\" on the event\n3. Click \"Delete Event\"\n\n⚠️ Consider the impact on attendees who have already booked before deleting.",
                suggestions: ['How to create event?', 'Help']
            };
        }

        // Change capacity
        if (['change capacity', 'update capacity', 'increase capacity', 'more tickets'].some(c => lowerMessage.includes(c))) {
            return {
                message: "📊 **Changing Event Capacity**\n\nOrganizers can update capacity in the event edit page.\n\n⚠️ **Note:** Reducing capacity below current bookings may cause issues. It's best to only increase capacity.",
                suggestions: ['How to edit event?', 'Help']
            };
        }

        // User roles
        if (['what role', 'types of user', 'attendee vs organizer', 'role'].some(r => lowerMessage.includes(r))) {
            return {
                message: "👤 **User Roles**\n\n**🎫 Attendee**\n• Browse and search events\n• Book tickets\n• Manage bookings\n\n**🎪 Organizer**\n• All attendee features\n• Create and manage events\n• View attendee lists\n\n**👑 Administrator**\n• Full platform control\n• User management\n• Content moderation",
                suggestions: ['How to register?', 'How to become organizer?']
            };
        }

        // Switch role
        if (['switch role', 'change role', 'upgrade account', 'become organizer'].some(s => lowerMessage.includes(s))) {
            return {
                message: "🔄 **Changing Your Role**\n\nTo switch from Attendee to Organizer:\n• Contact an Administrator\n• Or use the role request feature if available\n\nAdmins can update user roles from the admin panel.",
                suggestions: ['What are user roles?', 'Help']
            };
        }

        // Login problems / Troubleshooting
        if (['can\'t login', 'cant login', 'login problem', 'login error', 'access issue'].some(l => lowerMessage.includes(l))) {
            return {
                message: "🔧 **Login Troubleshooting**\n\n1. Check you're using the correct email\n2. Ensure your password is correct\n3. Make sure your internet is stable\n4. Try \"Forgot Password\" to reset\n5. Clear your browser cache\n\nIf issues persist, contact support.",
                suggestions: ['Forgot password', 'Help']
            };
        }

        // Booking not showing
        if (['booking not showing', 'can\'t see booking', 'booking missing', 'where is my booking'].some(b => lowerMessage.includes(b))) {
            return {
                message: "🔍 **Can't Find Your Booking?**\n\n1. Try refreshing the page\n2. Make sure you're logged in\n3. Check your email for confirmation\n\nIf the booking isn't there, it may not have completed successfully. Try booking again.",
                suggestions: ['My bookings', 'Help']
            };
        }

        // Supported browsers
        if (['browser', 'chrome', 'firefox', 'safari', 'edge', 'supported'].some(b => lowerMessage.includes(b))) {
            return {
                message: "🌐 **Supported Browsers**\n\nThe platform works best on modern browsers:\n• Google Chrome\n• Mozilla Firefox\n• Safari\n• Microsoft Edge\n\n📱 It's also mobile-friendly!",
                suggestions: ['Help', 'Show me events']
            };
        }

        // Mobile / Responsive
        if (['mobile', 'phone', 'tablet', 'responsive', 'app'].some(m => lowerMessage.includes(m))) {
            return {
                message: "📱 **Mobile Access**\n\nYes! The platform is fully responsive and works great on:\n• Smartphones\n• Tablets\n• Laptops and desktops\n\nNo app download required — just use your browser!",
                suggestions: ['Show me events', 'Help']
            };
        }

        // Admin functions
        if (['admin', 'administrator', 'moderat'].some(a => lowerMessage.includes(a))) {
            return {
                message: "👑 **Administrator Functions**\n\nAdministrators can:\n• Manage all events\n• View and manage all users\n• Change user roles\n• Suspend or remove accounts\n• Moderate event content\n• View system analytics\n\nFor admin support, use the admin contact system.",
                suggestions: ['What are user roles?', 'Help']
            };
        }

        // Free / Pricing
        if (['free', 'cost', 'price', 'pay', 'fee'].some(f => lowerMessage.includes(f))) {
            return {
                message: "💰 **Pricing**\n\nThe platform is **free to use**!\n\n• Creating an account: Free\n• Browsing events: Free\n• Booking: Free (some events may have ticket prices)\n\nCurrently, all events on this platform are **free to attend**! 🎉",
                suggestions: ['Show me events', 'Help']
            };
        }

        // Search events
        if (['search', 'find event', 'look for', 'filter'].some(s => lowerMessage.includes(s))) {
            return {
                message: "🔍 **Searching Events**\n\nYou can search and filter events by:\n• Event name or keywords\n• Category (concerts, workshops, etc.)\n• Location\n• Date range\n• Availability\n\nUse the search bar and filters on the Events page!",
                suggestions: ['Show me events', 'Categories'],
                actions: [
                    { type: 'navigate', label: 'Browse Events', target: '/events' }
                ]
            };
        }

        // Event types / Categories
        if (['type of event', 'categories', 'what kind', 'genres', 'concerts', 'workshops', 'conference'].some(t => lowerMessage.includes(t))) {
            return {
                message: "🎭 **Event Types**\n\nYou can find all kinds of events:\n• 🎵 Concerts & Music\n• 🎓 Workshops & Classes\n• 💼 Conferences & Seminars\n• 🏃 Sports Events\n• 🎉 Meetups & Networking\n• 💻 Webinars (Virtual Events)\n• And more!",
                suggestions: ['Show me events', 'Search events']
            };
        }

        // Virtual / Online events
        if (['virtual', 'online', 'webinar', 'remote', 'zoom', 'meet'].some(v => lowerMessage.includes(v))) {
            return {
                message: "💻 **Virtual Events**\n\nYes! Organizers can create online/virtual events.\n\nFor virtual events, the organizer provides meeting links (Zoom, Google Meet, etc.) in the event details.\n\nCheck the event description for joining instructions!",
                suggestions: ['Show me events', 'Help']
            };
        }

        // My bookings
        if (['my booking', 'my ticket', 'my reservation', 'booked', 'where are my'].some(m => lowerMessage.includes(m))) {
            if (!userId) {
                return {
                    message: "🔐 Sign in to view your bookings.",
                    actions: [
                        { type: 'navigate', label: 'Sign In', target: '/login' }
                    ]
                };
            }
            return {
                message: "🎫 **Your Bookings**\n\nView all your tickets and booking history in \"My Bookings\".\n\nYou can see:\n• Upcoming events\n• Past events\n• Booking status\n• Cancel bookings",
                suggestions: ['Show me events', 'Help'],
                actions: [
                    { type: 'navigate', label: 'View My Bookings', target: '/bookings' }
                ]
            };
        }

        // Contact / Support
        if (['contact', 'support', 'help desk', 'customer service', 'reach out'].some(c => lowerMessage.includes(c))) {
            return {
                message: "📞 **Need Help?**\n\nFor support:\n• Check this FAQ section\n• Use the Help & Support section in the app\n• Contact support through the contact form\n\nFor urgent issues or abuse reports, administrators can be reached through the admin contact system.",
                suggestions: ['Help', 'Show me events']
            };
        }

        // Thanks
        if (['thank', 'thanks', 'thx', 'awesome', 'great', 'perfect', 'cool'].some(t => lowerMessage.includes(t))) {
            return {
                message: "😊 You're welcome! Happy to help.\n\nAnything else you'd like to know?",
                suggestions: ['Show me events', 'Help']
            };
        }

        // Goodbye
        if (['bye', 'goodbye', 'see you', 'later', 'exit', 'quit'].some(b => lowerMessage.includes(b))) {
            return {
                message: "👋 Goodbye! Have a great time at your events!\n\nCome back anytime you need help.",
                suggestions: ['Show me events']
            };
        }

        // Out of context detection - reject unrelated questions
        const outOfContextPatterns = [
            'weather', 'joke', 'story', 'cook', 'recipe', 'game', 'movie', 'music',
            'news', 'politics', 'sports score', 'stock', 'crypto', 'bitcoin',
            'relationship', 'dating', 'math', 'calculate', 'code', 'programming',
            'translate', 'language', 'country', 'capital', 'president', 'celebrity'
        ];

        if (outOfContextPatterns.some(p => lowerMessage.includes(p))) {
            return {
                message: "🚫 I can only help with questions about this Event Management platform.\n\nI can assist you with:\n• Finding and booking events\n• Account questions\n• Platform features\n\nWhat can I help you with?",
                suggestions: ['Show me events', 'Help', 'How to book?']
            };
        }

        // Default fallback - friendly and helpful
        return {
            message: "🤔 I'm not quite sure about that.\n\n**I can help you with:**\n• 🎫 Finding and booking events\n• 📝 Account registration & login\n• ❓ Platform FAQs\n• 🎪 Event creation (for organizers)\n\nTry asking something like:\n• \"How do I book an event?\"\n• \"Show me events\"\n• \"How do I become an organizer?\"",
            suggestions: ['Show me events', 'Help', 'How to book?'],
            actions: [
                { type: 'navigate', label: 'Browse Events', target: '/events' }
            ]
        };
    }
}