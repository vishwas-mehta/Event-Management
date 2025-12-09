import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseBuilder';
import { Event } from '../entities/Event.entity';
import { Category } from '../entities/Category.entity';
import { TicketType } from '../entities/TicketType.entity';
import { AppDataSource } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/AppError';

export class OrganizerController {
    private eventRepository: Repository<Event>;
    private categoryRepository: Repository<Category>;
    private ticketTypeRepository: Repository<TicketType>;

    constructor() {
        this.eventRepository = AppDataSource.getRepository(Event);
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.ticketTypeRepository = AppDataSource.getRepository(TicketType);
    }

    getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const organizerId = req.user!.userId;

        const events = await this.eventRepository.find({
            where: { organizerId },
            relations: ['category', 'ticketTypes', 'bookings', 'reviews', 'reviews.user'],
            order: { createdAt: 'DESC' },
        });

        // Calculate statistics
        const totalEvents = events.length;
        const totalBookings = events.reduce((sum, e) => sum + (e.bookings?.length || 0), 0);
        const upcomingEvents = events.filter(
            (e) => new Date(e.startDateTime) > new Date()
        ).length;

        return sendSuccess(
            res,
            {
                stats: {
                    totalEvents,
                    totalBookings,
                    upcomingEvents,
                },
                events,
            },
            'Dashboard data retrieved'
        );
    });

    getMyEvents = asyncHandler(async (req: Request, res: Response) => {
        const organizerId = req.user!.userId;

        const events = await this.eventRepository.find({
            where: { organizerId },
            relations: ['category', 'ticketTypes', 'bookings'],
            order: { createdAt: 'DESC' },
        });

        return sendSuccess(res, { events }, 'Your events retrieved');
    });

    createEvent = asyncHandler(async (req: Request, res: Response) => {
        const organizerId = req.user!.userId;
        const { ticketTypes: ticketTypesData, ...eventData } = req.body;

        // Validate category exists
        const category = await this.categoryRepository.findOne({
            where: { id: eventData.categoryId },
        });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        // Validate dates
        const startDate = new Date(eventData.startDateTime);
        const endDate = new Date(eventData.endDateTime);

        if (endDate <= startDate) {
            throw new ValidationError('End date must be after start date');
        }

        // Create and save event
        const newEvent = (await this.eventRepository.save(
            this.eventRepository.create({
                ...eventData,
                organizerId,
            })
        )) as unknown as Event;

        // Create ticket types from request, or default if not provided
        if (ticketTypesData && Array.isArray(ticketTypesData) && ticketTypesData.length > 0) {
            // Validate and create provided ticket types
            let totalTicketCapacity = 0;
            for (const ticketData of ticketTypesData) {
                if (!ticketData.name || !ticketData.capacity) {
                    continue; // Skip incomplete ticket types
                }
                totalTicketCapacity += Number(ticketData.capacity);
                await this.ticketTypeRepository.save(
                    this.ticketTypeRepository.create({
                        eventId: newEvent.id,
                        name: ticketData.name,
                        description: ticketData.description || '',
                        price: Number(ticketData.price) || 0,
                        capacity: Number(ticketData.capacity),
                        sold: 0,
                    })
                );
            }

            // Update event capacity to match total ticket capacity if different
            if (totalTicketCapacity > 0 && totalTicketCapacity !== eventData.capacity) {
                await this.eventRepository.update(newEvent.id, { capacity: totalTicketCapacity });
            }
        } else {
            // Fallback: create default ticket type
            await this.ticketTypeRepository.save(
                this.ticketTypeRepository.create({
                    eventId: newEvent.id,
                    name: 'General Admission',
                    description: 'Standard entry ticket',
                    price: 0,
                    capacity: eventData.capacity || 100,
                    sold: 0,
                })
            );
        }

        // Load relations
        const createdEvent = await this.eventRepository.findOne({
            where: { id: newEvent.id },
            relations: ['category', 'organizer', 'ticketTypes'],
        });

        return sendSuccess(res, { event: createdEvent }, 'Event created successfully', 201);
    });

    getEventById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizerId = req.user!.userId;

        const event = await this.eventRepository.findOne({
            where: { id, organizerId },
            relations: ['category', 'ticketTypes', 'bookings', 'reviews'],
        });

        if (!event) {
            throw new NotFoundError('Event not found');
        }

        return sendSuccess(res, { event }, 'Event details retrieved');
    });

    updateEvent = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizerId = req.user!.userId;
        const updateData = req.body;

        const event = await this.eventRepository.findOne({
            where: { id, organizerId },
        });

        if (!event) {
            throw new NotFoundError('Event not found or you do not have permission');
        }

        // If category is being updated, validate it exists
        if (updateData.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: updateData.categoryId },
            });

            if (!category) {
                throw new NotFoundError('Category not found');
            }
        }

        // Validate dates if both are provided
        if (updateData.startDateTime && updateData.endDateTime) {
            const startDate = new Date(updateData.startDateTime);
            const endDate = new Date(updateData.endDateTime);

            if (endDate <= startDate) {
                throw new ValidationError('End date must be after start date');
            }
        }

        Object.assign(event, updateData);
        await this.eventRepository.save(event);

        const updatedEvent = await this.eventRepository.findOne({
            where: { id },
            relations: ['category', 'ticketTypes'],
        });

        return sendSuccess(res, { event: updatedEvent }, 'Event updated successfully');
    });

    deleteEvent = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizerId = req.user!.userId;

        const event = await this.eventRepository.findOne({
            where: { id, organizerId },
            relations: ['ticketTypes', 'bookings'],
        });

        if (!event) {
            throw new NotFoundError('Event not found or you do not have permission');
        }

        // Delete all related records in a transaction
        await AppDataSource.transaction(async (manager) => {
            // Delete bookings first
            if (event.bookings && event.bookings.length > 0) {
                await manager.remove(event.bookings);
            }
            // Delete ticket types
            if (event.ticketTypes && event.ticketTypes.length > 0) {
                await manager.remove(event.ticketTypes);
            }
            // Finally delete the event
            await manager.remove(event);
        });

        return sendSuccess(res, { message: 'Event deleted successfully' }, 'Event deleted successfully');
    });

    getEventAttendees = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const organizerId = req.user!.userId;

        const event = await this.eventRepository.findOne({
            where: { id, organizerId },
            relations: ['bookings', 'bookings.user', 'bookings.ticketType'],
        });

        if (!event) {
            throw new NotFoundError('Event not found or you do not have permission');
        }

        const attendees = event.bookings.map((booking) => ({
            id: booking.id,
            bookingReference: booking.bookingReference,
            user: {
                id: booking.user.id,
                firstName: booking.user.firstName,
                lastName: booking.user.lastName,
                email: booking.user.email,
            },
            ticketType: booking.ticketType.name,
            quantity: booking.quantity,
            status: booking.status,
            bookedAt: booking.bookedAt,
            attendedAt: booking.attendedAt,
        }));

        return sendSuccess(res, { attendees }, 'Event attendees retrieved');
    });

    createTicketType = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const organizerId = req.user!.userId;
        const ticketData = req.body;

        // Verify event belongs to organizer
        const event = await this.eventRepository.findOne({
            where: { id: eventId, organizerId },
        });

        if (!event) {
            throw new NotFoundError('Event not found or you do not have permission');
        }

        // Validate sales dates if provided
        if (ticketData.salesStartDate && ticketData.salesEndDate) {
            const startDate = new Date(ticketData.salesStartDate);
            const endDate = new Date(ticketData.salesEndDate);

            if (endDate <= startDate) {
                throw new ValidationError('Sales end date must be after sales start date');
            }
        }

        const ticketType = this.ticketTypeRepository.create({
            ...ticketData,
            eventId,
            price: 0, // All events are free for now
        });

        await this.ticketTypeRepository.save(ticketType);

        return sendSuccess(res, { ticketType }, 'Ticket type created successfully', 201);
    });

    updateTicketType = asyncHandler(async (req: Request, res: Response) => {
        const { ticketTypeId } = req.params;
        const organizerId = req.user!.userId;
        const updateData = req.body;

        const ticketType = await this.ticketTypeRepository.findOne({
            where: { id: ticketTypeId },
            relations: ['event'],
        });

        if (!ticketType) {
            throw new NotFoundError('Ticket type not found');
        }

        if (ticketType.event.organizerId !== organizerId) {
            throw new ForbiddenError('You do not have permission to update this ticket type');
        }

        // Don't allow reducing capacity below sold tickets
        if (updateData.capacity !== undefined && updateData.capacity < ticketType.sold) {
            throw new ValidationError(
                `Cannot reduce capacity below ${ticketType.sold} (tickets already sold)`
            );
        }

        // Allow price updates (for paid tickets)

        Object.assign(ticketType, updateData);
        await this.ticketTypeRepository.save(ticketType);

        return sendSuccess(res, { ticketType }, 'Ticket type updated successfully');
    });

    deleteTicketType = asyncHandler(async (req: Request, res: Response) => {
        const { ticketTypeId } = req.params;
        const organizerId = req.user!.userId;

        const ticketType = await this.ticketTypeRepository.findOne({
            where: { id: ticketTypeId },
            relations: ['event'],
        });

        if (!ticketType) {
            throw new NotFoundError('Ticket type not found');
        }

        if (ticketType.event.organizerId !== organizerId) {
            throw new ForbiddenError('You do not have permission to delete this ticket type');
        }

        // Check if any tickets have been sold
        if (ticketType.sold > 0) {
            throw new ValidationError(
                'Cannot delete ticket type with sold tickets. Please cancel all bookings first.'
            );
        }

        await this.ticketTypeRepository.remove(ticketType);

        return sendSuccess(res, { message: 'Ticket type deleted successfully' }, 'Ticket type deleted successfully');
    });
}
