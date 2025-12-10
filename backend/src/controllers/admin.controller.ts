import { Request, Response, NextFunction } from 'express';
import { Not, Repository } from 'typeorm';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseBuilder';
import { User, UserRole, UserStatus } from '../entities/User.entity';
import { Event } from '../entities/Event.entity';
import { AppDataSource } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/AppError';
import { ReportedEvent, ReportStatus } from '../entities/ReportedEvent.entity';

export class AdminController {
    private userRepository: Repository<User>;
    private eventRepository: Repository<Event>;
    private reportRepository: Repository<ReportedEvent>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.eventRepository = AppDataSource.getRepository(Event);
        this.reportRepository = AppDataSource.getRepository(ReportedEvent);
    }

    getDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const totalUsers = await this.userRepository.count();
        const totalOrganizers = await this.userRepository.count({
            where: {
                role: UserRole.ORGANIZER, status: UserStatus.ACTIVE
            }
        });

        const pendingOrganizers = await this.userRepository.count({
            where: { role: UserRole.ORGANIZER, status: UserStatus.PENDING }
        });

        const totalAttendees = await this.userRepository.count({
            where: { role: UserRole.ATTENDEE }
        });

        const totalEvents = await this.eventRepository.count();

        const reportedEvents = await this.reportRepository.count({
            where: { status: ReportStatus.PENDING }
        });

        const stats = {
            totalUsers,
            totalOrganizers,
            totalAttendees,
            pendingOrganizers,
            totalEvents,
            reportedEvents,
        };

        return sendSuccess(res, stats, 'Dashboard Statistics Received');
    });

    getPendingOrganizers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const organizers = await this.userRepository.find({
            where: {
                role: UserRole.ORGANIZER,
                status: UserStatus.PENDING,
            },
            select: ['id', 'email', 'firstName', 'lastName', 'phoneNumber', 'createdAt'],
            order: { createdAt: 'ASC' },
        });

        return sendSuccess(res, { organizers }, 'Pending Organizers Retrieved');
    });

    approveOrganizer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundError("User Not Found");
        }

        if (user.role !== UserRole.ORGANIZER) {
            throw new ForbiddenError("User is not an organizer");
        }

        if (user.status !== UserStatus.PENDING) {

            throw new ForbiddenError("User is not pending approval");
        }

        user.status = UserStatus.ACTIVE;

        await this.userRepository.save(user);

        return sendSuccess(res, { message: 'Organizer Approved Successfully' }, 'Organizer Approved Successfully');

    });

    rejectOrganizer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundError("User Not Found");
        }

        if (user.role !== UserRole.ORGANIZER) {
            throw new ForbiddenError("User is not an organizer");
        }

        if (user.status !== UserStatus.PENDING) {
            throw new ForbiddenError("User is not pending approval");
        }

        await this.userRepository.remove(user);

        return sendSuccess(res, { message: 'Organizer Rejected and account deleted' }, 'Organizer Rejected and account deleted');
    });

    getReportedEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const reports = await this.reportRepository.find({
            where: { status: ReportStatus.PENDING },
            relations: ['event', 'event.organizer', 'reportedBy'],
            order: { createdAt: 'DESC' },
        });

        return sendSuccess(res, { reports }, 'Reported Events Retrieved');
    });

    resolveReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const report = await this.reportRepository.findOne({
            where: { id },
            relations: ['event'],
        });

        if (!report) {
            throw new NotFoundError("Report Not Found");
        }
        report.status = ReportStatus.RESOLVED;
        report.adminNotes = adminNotes;
        report.resolvedAt = new Date();

        await this.reportRepository.save(report);

        return sendSuccess(res, { message: 'Report Resolved Successfully' }, 'Report Resolved Successfully');
    });

    deleteEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const event = await this.eventRepository.findOne({ where: { id } });

        if (!event) {
            throw new NotFoundError('Event Not Found');
        }

        await this.eventRepository.remove(event);

        return sendSuccess(res, { message: 'Event Deleted Successfully' }, 'Event Deleted Successfully');
    });

    getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const [users, total] = await this.userRepository.findAndCount({
            select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        const result = {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        return sendSuccess(res, result, 'Users Retrieved Successfully');
    });
    updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        // Validation
        if (!status || !['active', 'blocked', 'pending'].includes(status)) {
            throw new ValidationError('Status must be active, blocked, or pending');
        }

        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        user.status = status as UserStatus;
        await this.userRepository.save(user);

        return sendSuccess(res, { message: `User status updated to ${status}` }, `User status updated to ${status}`);
    });
}
