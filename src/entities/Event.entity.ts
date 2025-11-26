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
import { User } from './User.entity';
import { Category } from './Category.entity';
import { TicketType } from './TicketType.entity';
import { Booking } from './Booking.entity';
import { Review } from './Review.entity';
import { Waitlist } from './Waitlist.entity';
import { ReportedEvent } from './ReportedEvent.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organizer_id' })
    organizerId: string;

    @Column({ name: 'category_id' })
    categoryId: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'start_date_time', type: 'timestamp' })
    startDateTime: Date;

    @Column({ name: 'end_date_time', type: 'timestamp' })
    endDateTime: Date;

    @Column({ name: 'banner_image', nullable: true })
    bannerImage: string;

    @Column({ name: 'teaser_video', nullable: true })
    teaserVideo: string;

    @Column()
    location: string;

    @Column({ nullable: true })
    address: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ name: 'is_published', default: true })
    isPublished: boolean;

    @Column({ name: 'is_reported', default: false })
    isReported: boolean;

    @Column({ name: 'report_reason', type: 'text', nullable: true })
    reportReason: string;

    @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizer_id' })
    organizer: User;

    @ManyToOne(() => Category, (category) => category.events)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => TicketType, (ticketType) => ticketType.event, { cascade: true })
    ticketTypes: TicketType[];

    @OneToMany(() => Booking, (booking) => booking.event)
    bookings: Booking[];

    @OneToMany(() => Review, (review) => review.event)
    reviews: Review[];

    @OneToMany(() => Waitlist, (waitlist) => waitlist.event)
    waitlists: Waitlist[];

    @OneToMany(() => ReportedEvent, (report) => report.event)
    reports: ReportedEvent[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
