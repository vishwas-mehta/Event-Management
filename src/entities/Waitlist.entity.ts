import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Event } from './Event.entity';
export enum WaitlistStatus {
    WAITING = 'waiting',
    NOTIFIED = 'notified',
    CONVERTED = 'converted',
}
@Entity('waitlists')
export class Waitlist {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ name: 'user_id' })
    userId: string;
    @Column({ name: 'event_id' })
    eventId: string;
    @Column({
        type: 'enum',
        enum: WaitlistStatus,
        default: WaitlistStatus.WAITING,
    })
    status: WaitlistStatus;
    @Column({ name: 'notified_at', type: 'timestamp', nullable: true })
    notifiedAt: Date;
    @ManyToOne(() => User, (user) => user.waitlists)
    @JoinColumn({ name: 'user_id' })
    user: User;
    @ManyToOne(() => Event, (event) => event.waitlists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}