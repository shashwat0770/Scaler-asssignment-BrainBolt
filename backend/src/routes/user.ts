import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { UserState } from '../models/UserState';

const router = Router();

// POST /v1/user/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username } = req.body;
        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const trimmed = username.trim().toLowerCase();
        if (trimmed.length > 30) {
            return res.status(400).json({ error: 'Username must be 30 characters or less' });
        }

        // Find or create user
        let user = await User.findOne({ username: trimmed });
        if (!user) {
            user = await User.create({ username: trimmed });
            // Create initial user state
            await UserState.create({ userId: user._id });
        }

        res.json({
            userId: user._id.toString(),
            username: user.username,
            createdAt: user.createdAt,
        });
    } catch (error: any) {
        if (error.code === 11000) {
            // Race condition - user was just created by another request
            const user = await User.findOne({ username: req.body.username.trim().toLowerCase() });
            if (user) {
                return res.json({
                    userId: user._id.toString(),
                    username: user.username,
                    createdAt: user.createdAt,
                });
            }
        }
        next(error);
    }
});

// GET /v1/user/:userId
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            userId: user._id.toString(),
            username: user.username,
            createdAt: user.createdAt,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
