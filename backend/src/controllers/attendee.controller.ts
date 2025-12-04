import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseBuilder';
import { TicketType } from '../entities/TicketType.entity';
import { Event } from '../entities/Event.entity';
import { Booking, BookingStatus } from '../entities/Booking.entity';
import { Review } from '../entities/Review.entity';
import { Waitlist, WaitlistStatus } from '../entities/Waitlist.entity';
import { AppDataSource } from '../config/database';
import {
    NotFoundError,
    ForbiddenError,
    ValidationError,
    ConflictError,
} from '../utils/AppError';

export class AttendeeController {
    private ticketTypeRepository: Repository<TicketType>;
    private eventRepository: Repository<Event>;
    private bookingRepository: Repository<Booking>;
    private reviewRepository: Repository<Review>;
    private waitlistRepository: Repository<Waitlist>;

    constructor() {
        this.ticketTypeRepository = AppDataSource.getRepository(TicketType);
        this.eventRepository = AppDataSource.getRepository(Event);
        this.bookingRepository = AppDataSource.getRepository(Booking);
        this.reviewRepository = AppDataSource.getRepository(Review);
        this.waitlistRepository = AppDataSource.getRepository(Waitlist);
    }

    // Booking endpoints
    bookTicket = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { eventId, ticketTypeId, quantity } = req.body;

        // Validation
        if (!eventId || !ticketTypeId || !quantity) {
            throw new ValidationError('Event ID, Ticket Type ID, and quantity are required');
        }
        if (quantity < 1) {
            throw new ValidationError('Quantity must be at least 1');
        }

        // Use transaction to prevent race conditions and overbooking
        const booking = await AppDataSource.transaction(async (transactionalEntityManager) => {
            // Lock the ticket type row for update
            const ticketType = await transactionalEntityManager
                .getRepository(TicketType)
                .createQueryBuilder('ticketType')
                .setLock('pessimistic_write')
                .where('ticketType.id = :id', { id: ticketTypeId })
                .getOne();

            if (!ticketType) {
                throw new NotFoundError('Ticket type not found');
            }

            // Check if event exists and is published
            const event = await transactionalEntityManager
                .getRepository(Event)
                .findOne({ where: { id: eventId } });

            if (!event) {
                throw new NotFoundError('Event not found');
            }

            if (!event.isPublished) {
                throw new ValidationError('This event is not available for booking');
            }

            // Check if event has already passed
            if (new Date(event.startDateTime) < new Date()) {
                throw new ValidationError('Cannot book tickets for past events');
            }

            // Check sales period
            const now = new Date();
            if (ticketType.salesStartDate && new Date(ticketType.salesStartDate) > now) {
                throw new ValidationError('Ticket sales have not started yet');
            }

            if (ticketType.salesEndDate && new Date(ticketType.salesEndDate) < now) {
                throw new ValidationError('Ticket sales have ended');
            }

            // Check availability
            const available = ticketType.capacity - ticketType.sold;
            if (available < quantity) {
                throw new ValidationError(
                    `Only ${available} tickets available. Cannot book ${quantity} tickets.`
                );
            }

            // Calculate total price (apply dynamic pricing if applicable)
            let effectivePrice = ticketType.price;
            if (ticketType.dynamicPricing) {
                const dp = ticketType.dynamicPricing;
                if (dp.type === 'early_bird' && dp.endDate) {
                    if (new Date(dp.endDate) > now) {
                        effectivePrice = ticketType.price; // Already discounted price
                    } else if (dp.originalPrice) {
                        effectivePrice = dp.originalPrice; // Revert to original price
                    }
                }
            }

            const totalPrice = effectivePrice * quantity;

            // Create booking
            const newBooking = transactionalEntityManager.getRepository(Booking).create({
                userId,
                eventId,
                ticketTypeId,
                quantity,
                totalPrice,
                status: BookingStatus.CONFIRMED,
            });

            await transactionalEntityManager.getRepository(Booking).save(newBooking);

            // Update sold count
            ticketType.sold += quantity;
            await transactionalEntityManager.getRepository(TicketType).save(ticketType);

            return newBooking;
        });

        return sendSuccess(res, { booking }, 'Ticket booked successfully', 201);
    });

    getMyBookings = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;

        const bookings = await this.bookingRepository.find({
            where: { userId },
            relations: ['event', 'event.category', 'ticketType'],
            order: { createdAt: 'DESC' },
        });

        return sendSuccess(res, { bookings }, 'Your bookings retrieved');
    });

    getBookingById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.userId;

        const booking = await this.bookingRepository.findOne({
            where: { id, userId },
            relations: ['event', 'ticketType'],
        });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        return sendSuccess(res, { booking }, 'Booking details retrieved');
    });

    cancelBooking = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.userId;

        const result = await AppDataSource.transaction(async (transactionalEntityManager) => {
            const booking = await transactionalEntityManager
                .getRepository(Booking)
                .findOne({
                    where: { id, userId },
                    relations: ['event', 'ticketType'],
                });

            if (!booking) {
                throw new NotFoundError('Booking not found');
            }

            if (booking.status === BookingStatus.CANCELLED) {
                throw new ValidationError('Booking is already cancelled');
            }

            // Check if event has already started
            if (new Date(booking.event.startDateTime) < new Date()) {
                throw new ValidationError('Cannot cancel booking for events that have already started');
            }

            // Lock ticket type for update
            const ticketType = await transactionalEntityManager
                .getRepository(TicketType)
                .createQueryBuilder('ticketType')
                .setLock('pessimistic_write')
                .where('ticketType.id = :id', { id: booking.ticketTypeId })
                .getOne();

            if (!ticketType) {
                throw new NotFoundError('Ticket type not found');
            }

            // Update booking status
            booking.status = BookingStatus.CANCELLED;
            booking.cancelledAt = new Date();
            await transactionalEntityManager.getRepository(Booking).save(booking);

            // Restore ticket capacity
            ticketType.sold -= booking.quantity;
            await transactionalEntityManager.getRepository(TicketType).save(ticketType);

            // Notify waitlist users (simplified - just return info)
            const waitlistUsers = await transactionalEntityManager
                .getRepository(Waitlist)
                .find({
                    where: {
                        eventId: booking.eventId,
                        ticketTypeId: booking.ticketTypeId,
                        status: WaitlistStatus.WAITING,
                    },
                    order: { position: 'ASC' },
                    take: booking.quantity,
                });

            return {
                message: 'Booking cancelled successfully',
                waitlistNotified: waitlistUsers.length,
            };
        });

        return sendSuccess(res, result, result.message);
    });

    markAttendance = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.userId;

        const booking = await this.bookingRepository.findOne({
            where: { id, userId },
            relations: ['event'],
        });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new ValidationError('Cannot mark attendance for cancelled booking');
        }

        // Check if event has started
        const now = new Date();
        const eventStart = new Date(booking.event.startDateTime);

        if (eventStart > now) {
            throw new ValidationError('Event has not started yet');
        }

        booking.status = BookingStatus.ATTENDED;
        booking.attendedAt = new Date();
        await this.bookingRepository.save(booking);

        return sendSuccess(res, { message: 'Attendance marked successfully' }, 'Attendance marked successfully');
    });

    // Review endpoints
    createReview = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const userId = req.user!.userId;
        const { rating, comment, mediaFiles } = req.body;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            throw new ValidationError('Rating must be between 1 and 5');
        }

        // Check if user has already reviewed this event
        const existingReview = await this.reviewRepository.findOne({
            where: { userId, eventId },
        });

        if (existingReview) {
            throw new ConflictError('You have already reviewed this event');
        }

        // Verify user attended the event
        const attendedBooking = await this.bookingRepository.findOne({
            where: {
                userId,
                eventId,
                status: BookingStatus.ATTENDED,
            },
        });

        if (!attendedBooking) {
            throw new ForbiddenError(
                'You can only review events you have attended. Please mark your attendance first.'
            );
        }

        // Create review
        const review = this.reviewRepository.create({
            userId,
            eventId,
            rating,
            comment,
            mediaFiles,
            isVerifiedAttendee: true,
        });

        await this.reviewRepository.save(review);

        const savedReview = await this.reviewRepository.findOne({
            where: { id: review.id },
            relations: ['user'],
        });

        return sendSuccess(res, { review: savedReview }, 'Review created successfully', 201);
    });

    updateReview = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.userId;
        const { rating, comment, mediaFiles } = req.body;

        const review = await this.reviewRepository.findOne({
            where: { id, userId },
        });

        if (!review) {
            throw new NotFoundError('Review not found or you do not have permission');
        }

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                throw new ValidationError('Rating must be between 1 and 5');
            }
            review.rating = rating;
        }
        if (comment !== undefined) review.comment = comment;
        if (mediaFiles !== undefined) review.mediaFiles = mediaFiles;

        await this.reviewRepository.save(review);

        const updated = await this.reviewRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        return sendSuccess(res, { review: updated }, 'Review updated successfully');
    });

    deleteReview = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user!.userId;

        const review = await this.reviewRepository.findOne({
            where: { id, userId },
        });

        if (!review) {
            throw new NotFoundError('Review not found or you do not have permission');
        }

        await this.reviewRepository.remove(review);

        return sendSuccess(res, { message: 'Review deleted successfully' }, 'Review deleted successfully');
    });

    getEventReviews = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const [reviews, total] = await this.reviewRepository.findAndCount({
            where: { eventId },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        // Calculate average rating
        const avgRating =
            total > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
                : 0;

        const result = {
            reviews: reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                mediaFiles: review.mediaFiles,
                isVerifiedAttendee: review.isVerifiedAttendee,
                user: {
                    id: review.user.id,
                    firstName: review.user.firstName,
                    lastName: review.user.lastName,
                    profileImage: review.user.profileImage,
                },
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            averageRating: avgRating,
        };

        return sendSuccess(res, result, 'Event reviews retrieved');
    });

    // Waitlist endpoints
    joinWaitlist = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const userId = req.user!.userId;
        const { ticketTypeId } = req.body;

        // Check if event exists
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
        });

        if (!event) {
            throw new NotFoundError('Event not found');
        }

        // Check if already on waitlist
        const existingWaitlist = await this.waitlistRepository.findOne({
            where: {
                userId,
                eventId,
                ticketTypeId: ticketTypeId || null,
            },
        });

        if (existingWaitlist) {
            throw new ConflictError('You are already on the waitlist for this event/ticket');
        }

        // Get current position (last position + 1)
        const lastPosition = await this.waitlistRepository
            .createQueryBuilder('waitlist')
            .where('waitlist.eventId = :eventId', { eventId })
            .andWhere(ticketTypeId
                ? 'waitlist.ticketTypeId = :ticketTypeId'
                : 'waitlist.ticketTypeId IS NULL',
                { ticketTypeId })
            .orderBy('waitlist.position', 'DESC')
            .getOne();

        const position = lastPosition ? lastPosition.position + 1 : 1;

        // Create waitlist entry
        const waitlist = this.waitlistRepository.create({
            userId,
            eventId,
            ticketTypeId: ticketTypeId || null,
            position,
            status: WaitlistStatus.WAITING,
        });

        await this.waitlistRepository.save(waitlist);

        return sendSuccess(
            res,
            { message: 'Successfully joined waitlist', position },
            'Successfully joined waitlist',
            201
        );
    });

    leaveWaitlist = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const userId = req.user!.userId;

        const waitlist = await this.waitlistRepository.findOne({
            where: { userId, eventId },
        });

        if (!waitlist) {
            throw new NotFoundError('Waitlist entry not found');
        }

        await this.waitlistRepository.remove(waitlist);

        return sendSuccess(res, { message: 'Successfully left waitlist' }, 'Successfully left waitlist');
    });

    getMyWaitlists = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;

        const waitlists = await this.waitlistRepository.find({
            where: { userId },
            relations: ['event', 'ticketType'],
            order: { createdAt: 'DESC' },
        });

        return sendSuccess(res, { waitlists }, 'Your waitlists retrieved');
    });
}
