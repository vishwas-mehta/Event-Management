import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from './Event.entity';
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
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;
    @Column({ type: 'int' })
    quantity: number;
    @Column({ name: 'sold_count', type: 'int', default: 0 })
    soldCount: number;
    @Column({ name: 'is_active', default: true })
    isActive: boolean;
    @ManyToOne(() => Event, (event) => event.ticketTypes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}