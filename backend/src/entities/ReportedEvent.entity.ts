import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from './Event.entity';
import { User } from './User.entity';

export enum ReportStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    RESOLVED = 'resolved',
}

@Entity('reported_events')
export class ReportedEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_id' })
    eventId: string;

    @Column({ name: 'reported_by_id' })
    reportedById: string;

    @Column({ type: 'text' })
    reason: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @Column({ name: 'admin_notes', type: 'text', nullable: true })
    adminNotes: string;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @ManyToOne(() => Event, (event) => event.reports)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => User, (user) => user.reportedEvents)
    @JoinColumn({ name: 'reported_by_id' })
    reportedBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
