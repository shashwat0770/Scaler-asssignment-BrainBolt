import mongoose from 'mongoose';
import { config } from '../config';
import { Question } from '../models/Question';
import { seedQuestions } from './questions';

export async function seedDatabase(): Promise<void> {
    try {
        const existingCount = await Question.countDocuments();
        if (existingCount > 0) {
            console.log(`📚 Database already has ${existingCount} questions, skipping seed`);
            return;
        }

        console.log('🌱 Seeding database with questions...');
        await Question.insertMany(seedQuestions);
        console.log(`✅ Seeded ${seedQuestions.length} questions successfully`);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        throw error;
    }
}

// Run as standalone script
if (require.main === module) {
    (async () => {
        await mongoose.connect(config.mongodbUri);
        await seedDatabase();
        await mongoose.disconnect();
        console.log('Done!');
        process.exit(0);
    })();
}
