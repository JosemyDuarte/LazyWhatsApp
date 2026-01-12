import type { IRagWorkerRequest, IRagWorkerResponse, IndexPayload, QueryPayload, InitPayload } from './contracts';

class RAGService {
    private worker: Worker | null = null;
    private initPromise: Promise<void> | null = null;
    private initialized = false;

    private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

    constructor() { }

    private getWorker(): Worker {
        if (!this.worker) {
            this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (err) => {
                console.error('RAG Worker Error:', err);
            };
        }
        return this.worker;
    }

    private handleMessage(event: MessageEvent<IRagWorkerResponse>) {
        const { type, payload } = event.data;
        // Simple protocol for now - we might need IDs if we have concurrent requests, 
        // but for now we assume sequential or event-based responses. 
        // Actually, for query/index, we need to map back to request.
        // For 'INIT_DONE', we resolve initPromise.

        // Since the worker is simple request-response without IDs in current contract,
        // we might need to update contract to include request IDs for robustness,
        // but for MVP we can use a queue or just assume singular operations.
        // However, looking at the contract, there are no IDs.
        // For MVP, lets assume we handle via event listeners or singletons.
        // Or better, let's wrap the worker call in a promise that waits for the next specific message type.
    }

    // Improved implementation with One-off listeners for specific types to handle generic responses without IDs
    // This is brittle if multiple requests of same type are in flight, but fine for single-user client-side MVP.
    private sendRequest<T>(type: IRagWorkerRequest['type'], payload: any, expectedResponse: IRagWorkerResponse['type']): Promise<T> {
        const worker = this.getWorker();

        return new Promise((resolve, reject) => {
            const handler = (event: MessageEvent<IRagWorkerResponse>) => {
                const data = event.data;
                if (data.type === expectedResponse) {
                    worker.removeEventListener('message', handler);
                    resolve(data.payload);
                } else if (data.type === 'ERROR') {
                    worker.removeEventListener('message', handler);
                    reject(new Error(data.payload));
                }
            };
            worker.addEventListener('message', handler);
            worker.postMessage({ type, payload });
        });
    }

    async init(config?: InitPayload): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.sendRequest('INIT', config || {}, 'INIT_DONE');
        await this.initPromise;
        this.initialized = true;
    }

    async index(payload: IndexPayload): Promise<{ count: number }> {
        if (!this.initialized) await this.init();
        return this.sendRequest('INDEX', payload, 'INDEX_DONE');
    }

    async query(payload: QueryPayload): Promise<{ content: string; score: number; metadata: any }[]> {
        if (!this.initialized) await this.init();
        return this.sendRequest('QUERY', payload, 'QUERY_RESULT');
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.initialized = false;
            this.initPromise = null;
        }
    }
}

export const ragService = new RAGService();
