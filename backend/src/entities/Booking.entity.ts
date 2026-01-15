import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
} from 'typeorm';
import { User } from './User.entity';
import { Event } from './Event.entity';
import { TicketType } from './TicketType.entity';

/**
 * Enum representing the possible statuses of a booking.
 * @enum {string}
 */
export enum BookingStatus {
    /** Booking is confirmed and active */
    CONFIRMED = 'confirmed',
    /** Booking has been cancelled by the user */
    CANCELLED = 'cancelled',
    /** User has attended the event */
    ATTENDED = 'attended',
}

/**
 * Enum representing the payment status for a booking.
 * @enum {string}
 */
export enum PaymentStatus {
    /** Payment is pending processing */
    PENDING = 'pending',
    /** Payment has been successfully completed */
    COMPLETED = 'completed',
    /** Payment processing failed */
    FAILED = 'failed',
    /** Payment has been refunded to the user */
    REFUNDED = 'refunded',
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'event_id' })
    eventId: string;

    @Column({ name: 'ticket_type_id' })
    ticketTypeId: string;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.CONFIRMED,
    })
    status: BookingStatus;

    @Column({ name: 'booking_reference', unique: true })
    bookingReference: string;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.COMPLETED,
    })
    paymentStatus: PaymentStatus;

    @Column({ name: 'payment_method', nullable: true })
    paymentMethod: string;

    @Column({ name: 'booked_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    bookedAt: Date;

    @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
    cancelledAt: Date;

    @Column({ name: 'attended_at', type: 'timestamp', nullable: true })
    attendedAt: Date;

    @ManyToOne(() => User, (user) => user.bookings)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, (event) => event.bookings)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => TicketType, (ticketType) => ticketType.bookings)
    @JoinColumn({ name: 'ticket_type_id' })
    ticketType: TicketType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @BeforeInsert()
    generateBookingReference() {
        // Generate a unique booking reference: EVT-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        this.bookingReference = `EVT-${dateStr}-${random}`;
    }
}
