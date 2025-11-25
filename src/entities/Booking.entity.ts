import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Event } from './Event.entity';
import { TicketType } from './TicketType.entity';
export enum BookingStatus {
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    ATTENDED = 'attended',
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
    @Column({ type: 'int' })
    quantity: number;
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;
    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.CONFIRMED,
    })
    status: BookingStatus;
    @Column({ name: 'booking_code', unique: true })
    bookingCode: string;
    @Column({ name: 'attended_at', type: 'timestamp', nullable: true })
    attendedAt: Date;
    @ManyToOne(() => User, (user) => user.bookings)
    @JoinColumn({ name: 'user_id' })
    user: User;
    @ManyToOne(() => Event, (event) => event.bookings)
    @JoinColumn({ name: 'event_id' })
    event: Event;
    @ManyToOne(() => TicketType)
    @JoinColumn({ name: 'ticket_type_id' })
    ticketType: TicketType;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}