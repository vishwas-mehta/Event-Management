import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseBuilder';
import { Event } from '../entities/Event.entity';
import { Category } from '../entities/Category.entity';
import { ReportedEvent } from '../entities/ReportedEvent.entity';
import { AppDataSource } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/AppError';

export interface EventFilters {
    search?: string;
    category?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    minPrice?: number;
    maxPrice?: number;
    isFree?: boolean;
    hasAvailability?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'popularity' | 'price';
    order?: 'ASC' | 'DESC';
}

export class EventController {
    private eventRepository: Repository<Event>;
    private categoryRepository: Repository<Category>;
    private reportRepository: Repository<ReportedEvent>;

    constructor() {
        this.eventRepository = AppDataSource.getRepository(Event);
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.reportRepository = AppDataSource.getRepository(ReportedEvent);
    }

    // Public event endpoints
    getEvents = asyncHandler(async (req: Request, res: Response) => {
        const filters: EventFilters = {
            search: req.query.search as string,
            category: req.query.category as string,
            location: req.query.location as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
            isFree: req.query.isFree === 'true',
            hasAvailability: req.query.hasAvailability === 'true',
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            sortBy: req.query.sortBy as 'date' | 'popularity' | 'price',
            order: req.query.order as 'ASC' | 'DESC',
        };

        const {
            search,
            category,
            location,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            isFree,
            hasAvailability,
            page = 1,
            limit = 10,
            sortBy = 'date',
            order = 'ASC',
        } = filters;

        const query = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.category', 'category')
            .leftJoinAndSelect('event.organizer', 'organizer')
            .leftJoinAndSelect('event.ticketTypes', 'ticketTypes')
            .where('event.isPublished = :isPublished', { isPublished: true });

        // Search filter
        if (search) {
            query.andWhere(
                '(event.title ILIKE :search OR event.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Category filter
        if (category) {
            query.andWhere('category.slug = :category', { category });
        }

        // Location filter
        if (location) {
            query.andWhere('event.location ILIKE :location', {
                location: `%${location}%`,
            });
        }

        // Date filters
        if (startDate) {
            query.andWhere('event.startDateTime >= :startDate', { startDate });
        }

        if (endDate) {
            query.andWhere('event.startDateTime <= :endDate', { endDate });
        }

        // Price filters
        if (isFree !== undefined && isFree) {
            query.andWhere('ticketTypes.price = 0');
        } else {
            if (minPrice !== undefined) {
                query.andWhere('ticketTypes.price >= :minPrice', { minPrice });
            }

            if (maxPrice !== undefined) {
                query.andWhere('ticketTypes.price <= :maxPrice', { maxPrice });
            }
        }

        // Availability filter
        if (hasAvailability) {
            query.andWhere('ticketTypes.sold < ticketTypes.capacity');
        }

        // Sorting
        if (sortBy === 'date') {
            query.orderBy('event.startDateTime', order);
        } else if (sortBy === 'price') {
            query.orderBy('ticketTypes.price', order);
        }

        // Pagination
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);

        const [events, total] = await query.getManyAndCount();

        const result = {
            events,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        return sendSuccess(res, result, 'Events retrieved successfully');
    });

    getEventById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const event = await this.eventRepository.findOne({
            where: { id, isPublished: true },
            relations: ['category', 'organizer', 'ticketTypes', 'reviews', 'reviews.user'],
        });

        if (!event) {
            throw new NotFoundError('Event not found');
        }

        // Calculate average rating
        const avgRating =
            event.reviews.length > 0
                ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
                : 0;

        const eventData = {
            ...event,
            averageRating: avgRating,
            totalReviews: event.reviews.length,
        };

        return sendSuccess(res, { event: eventData }, 'Event details retrieved');
    });

    getCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await this.categoryRepository.find({
            order: { name: 'ASC' },
        });

        return sendSuccess(res, { categories }, 'Categories retrieved');
    });

    reportEvent = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;

        // Validation
        if (!reason) {
            throw new ValidationError('Reason is required');
        }

        const event = await this.eventRepository.findOne({
            where: { id },
        });

        if (!event) {
            throw new NotFoundError('Event not found');
        }

        const report = this.reportRepository.create({
            eventId: id,
            reportedById: userId,
            reason,
        });

        await this.reportRepository.save(report);

        // Mark event as reported
        event.isReported = true;
        event.reportReason = reason;
        await this.eventRepository.save(event);

        return sendSuccess(res, { message: 'Event reported successfully' }, 'Event reported successfully');
    });
}
