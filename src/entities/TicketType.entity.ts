import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Event } from './Event.entity';
import { Booking } from './Booking.entity';

@Entity('ticket_types')
export class TicketType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_id' })
    eventId: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'int', default: 0 })
    sold: number;

    @Column({ name: 'dynamic_pricing', type: 'jsonb', nullable: true })
    dynamicPricing: {
        type: string;
        originalPrice?: number;
        endDate?: string;
        discountPercent?: number;
    } | null;

    @Column({ name: 'sales_start_date', type: 'timestamp', nullable: true })
    salesStartDate: Date;

    @Column({ name: 'sales_end_date', type: 'timestamp', nullable: true })
    salesEndDate: Date;

    @ManyToOne(() => Event, (event) => event.ticketTypes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @OneToMany(() => Booking, (booking) => booking.ticketType)
    bookings: Booking[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Virtual property for available tickets
    get available(): number {
        return this.capacity - this.sold;
    }

    // Virtual property to check if ticket is free
    get isFree(): boolean {
        return this.price === 0;
    }
}
