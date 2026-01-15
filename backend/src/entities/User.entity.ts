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

/**
 * Enum representing the possible roles a user can have in the system.
 * @enum {string}
 */
export enum UserRole {
    /** System administrator with full access */
    ADMIN = 'admin',
    /** Event organizer who can create and manage events */
    ORGANIZER = 'organizer',
    /** Regular user who can attend events */
    ATTENDEE = 'attendee',
}

/**
 * Enum representing the account status of a user.
 * @enum {string}
 */
export enum UserStatus {
    /** Account is active and fully functional */
    ACTIVE = 'active',
    /** Account is pending verification or activation */
    PENDING = 'pending',
    /** Account has been blocked by an administrator */
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
