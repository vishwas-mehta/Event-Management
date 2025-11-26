import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Event } from './Event.entity';
import { Booking } from './Booking.entity';
import { Review } from './Review.entity';
import { Waitlist } from './Waitlist.entity';
import { ReportedEvent } from './ReportedEvent.entity';

export enum UserRole {
    ADMIN = 'admin',
    ORGANIZER = 'organizer',
    ATTENDEE = 'attendee',
}

export enum UserStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    BLOCKED = 'blocked',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name' })
    lastName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.ATTENDEE,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @Column({ name: 'phone_number', nullable: true })
    phoneNumber: string;

    @Column({ name: 'profile_image', nullable: true })
    profileImage: string;

    @OneToMany(() => Event, (event) => event.organizer)
    events: Event[];

    @OneToMany(() => Booking, (booking) => booking.user)
    bookings: Booking[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @OneToMany(() => Waitlist, (waitlist) => waitlist.user)
    waitlists: Waitlist[];

    @OneToMany(() => ReportedEvent, (report) => report.reportedBy)
    reportedEvents: ReportedEvent[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
