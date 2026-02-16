import { Router, Request, Response, NextFunction } from 'express';
import { getScoreLeaderboard, getStreakLeaderboard } from '../services/leaderboardService';
import { sseManager } from '../services/sseManager';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /v1/leaderboard/score
router.get('/score', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        const result = await getScoreLeaderboard(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /v1/leaderboard/streak
router.get('/streak', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        const result = await getStreakLeaderboard(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /v1/leaderboard/stream - SSE endpoint for live updates
router.get('/stream', (req: Request, res: Response) => {
    const clientId = (req.query.clientId as string) || uuidv4();
    sseManager.addClient(clientId, res);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`:heartbeat\n\n`);
        } catch {
            clearInterval(heartbeat);
        }
    }, 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
    });
});

export default router;
