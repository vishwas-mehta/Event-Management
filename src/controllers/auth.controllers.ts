import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseBuilder';
import { User, UserRole, UserStatus } from '../entities/User.entity';
import { AppDataSource } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../utils/AppError';

export class AuthController {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    // Basic validation helper
    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    register = asyncHandler(async (req: Request, res: Response) => {
        const { email, password, firstName, lastName, role, phoneNumber } = req.body;

        // Validation
        if (!email || !this.validateEmail(email)) {
            throw new ValidationError('Please provide a valid email');
        }
        if (!password || password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters long');
        }
        if (!firstName) {
            throw new ValidationError('First name is required');
        }
        if (!lastName) {
            throw new ValidationError('Last name is required');
        }
        if (!role || !['organizer', 'attendee'].includes(role)) {
            throw new ValidationError('Role must be either organizer or attendee');
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Determine initial status
        const status = role === UserRole.ORGANIZER ? UserStatus.PENDING : UserStatus.ACTIVE;

        // Create user
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role as UserRole,
            status,
            phoneNumber,
        });

        await this.userRepository.save(user);

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        const message =
            user.role === UserRole.ORGANIZER && user.status === 'pending'
                ? 'Registration successful. Your organizer account is pending admin approval.'
                : 'Registration successful';

        return sendSuccess(res, { user: userWithoutPassword, token }, message, 201);
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Validation
        if (!email || !this.validateEmail(email)) {
            throw new ValidationError('Please provide a valid email');
        }
        if (!password) {
            throw new ValidationError('Password is required');
        }

        // Find user
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if user is blocked
        if (user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedError('Your account has been blocked');
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
    });

    getMe = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;

        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return sendSuccess(res, { user: userWithoutPassword }, 'User profile retrieved');
    });

    updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { firstName, lastName, phoneNumber, profileImage } = req.body;

        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await this.userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;
        return sendSuccess(res, { user: userWithoutPassword }, 'Profile updated successfully');
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        // In a stateless JWT system, logout is handled client-side by removing the token
        return sendSuccess(res, null, 'Logout successful');
    });
}
