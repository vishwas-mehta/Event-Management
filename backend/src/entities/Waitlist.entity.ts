import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Event } from './Event.entity';
import { TicketType } from './TicketType.entity';

export enum WaitlistStatus {
    WAITING = 'waiting',
    NOTIFIED = 'notified',
    CONVERTED = 'converted',
    EXPIRED = 'expired',
}

@Entity('waitlists')
@Unique(['userId', 'eventId', 'ticketTypeId'])
export class Waitlist {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'event_id' })
    eventId: string;

    @Column({ name: 'ticket_type_id', nullable: true })
    ticketTypeId: string;

    @Column({ type: 'int' })
    position: number;

    @Column({
        type: 'enum',
        enum: WaitlistStatus,
        default: WaitlistStatus.WAITING,
    })
    status: WaitlistStatus;

    @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt: Date;

    @Column({ name: 'notified_at', type: 'timestamp', nullable: true })
    notifiedAt: Date;

    @ManyToOne(() => User, (user) => user.waitlists)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, (event) => event.waitlists)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => TicketType, { nullable: true })
    @JoinColumn({ name: 'ticket_type_id' })
    ticketType: TicketType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
