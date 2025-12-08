// Types for User
export enum UserRole {
    ADMIN = 'admin',
    ORGANIZER = 'organizer',
    ATTENDEE = 'attendee',
}

export enum UserStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    BLOCKED = 'blocked',
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    phoneNumber?: string;
    profileImage?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Types for Category
export interface CategoryType {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
}

// Types for TicketType
export interface TicketType {
    id: string;
    eventId: string;
    name: string;
    description?: string;
    price: number;
    capacity: number;
    sold: number;
    available?: number;
    isFree?: boolean;
    dynamicPricing?: {
        type: string;
        originalPrice?: number;
        endDate?: string;
        discountPercent?: number;
    };
    salesStartDate?: string;
    salesEndDate?: string;
}

// Types for Event
export interface EventType {
    id: string;
    organizerId: string;
    categoryId: string;
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    bannerImage?: string;
    teaserVideo?: string;
    location: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    isPublished: boolean;
    isReported?: boolean;
    reportReason?: string;
    organizer?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    };
    category?: CategoryType;
    ticketTypes?: TicketType[];
    reviews?: ReviewType[];
    averageRating?: number;
    totalReviews?: number;
    createdAt?: string;
    updatedAt?: string;
}

// Types for Booking
export enum BookingStatus {
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    ATTENDED = 'attended',
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export interface BookingType {
    id: string;
    userId: string;
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    totalPrice: number;
    status: BookingStatus;
    bookingReference: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    bookedAt: string;
    cancelledAt?: string;
    attendedAt?: string;
    event?: EventType;
    ticketType?: TicketType;
    user?: User;
}

// Types for Review
export interface ReviewType {
    id: string;
    userId: string;
    eventId: string;
    rating: number;
    comment?: string;
    mediaFiles?: string[];
    isVerifiedAttendee: boolean;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage?: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Types for Reported Event
export interface ReportedEvent {
    id: string;
    eventId: string;
    reportedById: string;
    reason: string;
    status: string;
    event?: EventType;
    reportedBy?: User;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message: string;
    error?: {
        message: string;
        statusCode: number;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Event Filters
export interface EventFilters {
    search?: string;
    category?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    minPrice?: number;
    maxPrice?: number;
    isFree?: boolean;
    hasAvailability?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'popularity' | 'price';
    order?: 'ASC' | 'DESC';
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'organizer' | 'attendee';
    phoneNumber?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Auth Context Types
export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

// Dashboard Stats
export interface OrganizerDashboardStats {
    stats: {
        totalEvents: number;
        totalBookings: number;
        upcomingEvents: number;
    };
    events: EventType[];
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalOrganizers: number;
    pendingOrganizers: number;
    totalAttendees: number;
    totalEvents: number;
    reportedEvents: number;
}

// Form Data Types
export interface EventFormData {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
    address?: string;
    categoryId: string;
    capacity: number;
    bannerImage?: string;
    teaserVideo?: string;
    isPublished: boolean;
}

export interface TicketTypeFormData {
    name: string;
    description?: string;
    price: number;
    capacity: number;
    salesStartDate?: string;
    salesEndDate?: string;
    dynamicPricing?: {
        type: string;
        originalPrice?: number;
        endDate?: string;
        discountPercent?: number;
    };
}

export interface BookingFormData {
    eventId: string;
    ticketTypeId: string;
    quantity: number;
}

export interface ReviewFormData {
    rating: number;
    comment?: string;
    mediaFiles?: string[];
}
