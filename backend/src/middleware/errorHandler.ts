import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error('Unhandled error:', err);

    if (err.name === 'ValidationError') {
        res.status(400).json({ error: 'Validation error', message: err.message });
        return;
    }

    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        res.status(409).json({ error: 'Duplicate entry', message: 'Resource already exists' });
        return;
    }

    res.status(500).json({ error: 'Internal server error', message: 'Something went wrong' });
}
