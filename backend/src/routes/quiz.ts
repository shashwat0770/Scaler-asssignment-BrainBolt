import { Router, Request, Response, NextFunction } from 'express';
import { getNextQuestion, submitAnswer, getUserMetrics } from '../services/quizService';
import { answerRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /v1/quiz/next
router.get('/next', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const result = await getNextQuestion(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /v1/quiz/answer
router.post('/answer', answerRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, questionId, answer, stateVersion, answerIdempotencyKey } = req.body;

        if (!userId || !questionId || answer === undefined || stateVersion === undefined || !answerIdempotencyKey) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'questionId', 'answer', 'stateVersion', 'answerIdempotencyKey'],
            });
        }

        const result = await submitAnswer(userId, questionId, answer, stateVersion, answerIdempotencyKey);
        res.json(result);
    } catch (error: any) {
        if (error.message === 'Question not found') {
            return res.status(404).json({ error: 'Question not found' });
        }
        if (error.message === 'User state not found') {
            return res.status(404).json({ error: 'User state not found' });
        }
        next(error);
    }
});

// GET /v1/quiz/metrics
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const result = await getUserMetrics(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
