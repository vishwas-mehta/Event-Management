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
export enum ReportStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}
@Entity('reported_events')
export class ReportedEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ name: 'event_id' })
    eventId: string;
    @Column({ name: 'reported_by' })
    reportedBy: string;
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
    @ManyToOne(() => Event, (event) => event.reports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
    @ManyToOne(() => User, (user) => user.reportedEvents)
    @JoinColumn({ name: 'reported_by' })
    reportedByUser: User;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}