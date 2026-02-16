import { Response } from 'express';

class SSEManager {
    private clients: Map<string, Response> = new Map();

    addClient(clientId: string, res: Response): void {
        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

        this.clients.set(clientId, res);

        // Remove client on disconnect
        res.on('close', () => {
            this.clients.delete(clientId);
        });
    }

    broadcast(event: string, data: any): void {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        this.clients.forEach((client) => {
            try {
                client.write(message);
            } catch {
                // client disconnected
            }
        });
    }

    sendToClient(clientId: string, event: string, data: any): void {
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            } catch {
                this.clients.delete(clientId);
            }
        }
    }

    getClientCount(): number {
        return this.clients.size;
    }
}

export const sseManager = new SSEManager();
