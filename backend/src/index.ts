import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDB } from './db';
import { connectRedis } from './redis';
import { seedDatabase } from './seed/runSeed';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import quizRoutes from './routes/quiz';
import leaderboardRoutes from './routes/leaderboard';
import userRoutes from './routes/user';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/v1/quiz', quizRoutes);
app.use('/v1/leaderboard', leaderboardRoutes);
app.use('/v1/user', userRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
    try {
        // Connect to MongoDB
        await connectDB();

        // Connect to Redis (non-blocking)
        await connectRedis();

        // Seed database
        await seedDatabase();

        app.listen(config.port, () => {
            console.log(`🚀 BrainBolt API running on port ${config.port}`);
            console.log(`📋 Environment: ${config.nodeEnv}`);
            console.log(`🔗 CORS Origin: ${config.corsOrigin}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();

export default app;
