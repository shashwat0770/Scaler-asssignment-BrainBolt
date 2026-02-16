import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', message: 'Please try again later' },
});

// Stricter rate limit for answer submissions
export const answerRateLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // max 5 answers per 10 seconds
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many answers submitted', message: 'Slow down' },
});
