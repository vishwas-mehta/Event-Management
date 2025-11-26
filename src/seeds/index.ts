import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User.entity';
import { Category } from '../entities/Category.entity';
import { hashPassword } from '../utils/password';
import env from '../config/env';

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Initialize database connection
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepository = AppDataSource.getRepository(User);
        const categoryRepository = AppDataSource.getRepository(Category);

        // Seed Admin User
        const existingAdmin = await userRepository.findOne({
            where: { email: env.admin.email },
        });

        if (!existingAdmin) {
            const hashedPassword = await hashPassword(env.admin.password);

            const admin = userRepository.create({
                email: env.admin.email,
                password: hashedPassword,
                firstName: env.admin.firstName,
                lastName: env.admin.lastName,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
            });

            await userRepository.save(admin);
            console.log(`✅ Admin user created: ${admin.email}`);
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Seed Categories
        const categories = [
            { name: 'Technology', slug: 'technology', description: 'Tech conferences, workshops, and meetups', icon: '💻' },
            { name: 'Music', slug: 'music', description: 'Concerts, festivals, and live performances', icon: '🎵' },
            { name: 'Sports', slug: 'sports', description: 'Sports events and competitions', icon: '⚽' },
            { name: 'Business', slug: 'business', description: 'Business conferences and networking events', icon: '💼' },
            { name: 'Art & Culture', slug: 'art-culture', description: 'Art exhibitions and cultural events', icon: '🎨' },
            { name: 'Food & Drink', slug: 'food-drink', description: 'Food festivals and culinary experiences', icon: '🍔' },
            { name: 'Health & Wellness', slug: 'health-wellness', description: 'Fitness, yoga, and wellness events', icon: '🧘' },
            { name: 'Education', slug: 'education', description: 'Workshops, seminars, and educational programs', icon: '📚' },
            { name: 'Entertainment', slug: 'entertainment', description: 'Shows, comedy, and entertainment events', icon: '🎭' },
            { name: 'Community', slug: 'community', description: 'Community gatherings and social events', icon: '👥' },
        ];

        for (const cat of categories) {
            const existing = await categoryRepository.findOne({ where: { slug: cat.slug } });

            if (!existing) {
                const category = categoryRepository.create(cat);
                await categoryRepository.save(category);
                console.log(`✅ Category created: ${cat.name}`);
            }
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📋 Login Credentials:');
        console.log(`   Email: ${env.admin.email}`);
        console.log(`   Password: ${env.admin.password}`);
        console.log('\n⚠️  Please change the admin password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
