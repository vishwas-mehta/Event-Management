import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Event } from './Event.entity';

/**
 * Review Entity - Represents a user's review of an attended event.
 * Users can only review events they have attended, and each user
 * can only submit one review per event (enforced by unique constraint).
 */
@Entity('reviews')
@Unique(['userId', 'eventId'])
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'event_id' })
    eventId: string;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ name: 'media_files', type: 'jsonb', nullable: true })
    mediaFiles: string[] | null;

    @Column({ name: 'is_verified_attendee', default: true })
    isVerifiedAttendee: boolean;

    @ManyToOne(() => User, (user) => user.reviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, (event) => event.reviews)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
