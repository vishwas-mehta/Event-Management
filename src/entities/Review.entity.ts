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
@Entity('reviews')
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
    @Column({ type: 'simple-array', nullable: true })
    images: string[];
    @ManyToOne(() => User, (user) => user.reviews)
    @JoinColumn({ name: 'user_id' })
    user: User;
    @ManyToOne(() => Event, (event) => event.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}