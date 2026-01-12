import type { IndexPayload } from './contracts';

interface VectorDocument {
    id: string;
    vector: number[];
    content: string;
    metadata: {
        sender: string;
        timestamp: Date;
    };
}

export class VectorStore {
    private documents: VectorDocument[] = [];

    constructor() { }

    async addDocuments(items: IndexPayload['messages'], vectors: number[][]): Promise<void> {
        if (items.length !== vectors.length) {
            throw new Error('Number of items and vectors must match');
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const vector = vectors[i];
            this.documents.push({
                id: crypto.randomUUID(),
                vector,
                content: item.content,
                metadata: {
                    sender: item.sender,
                    timestamp: new Date(item.timestamp), // Ensure date object
                }
            });
        }
    }

    async search(queryVector: number[], k: number = 3): Promise<{ content: string; score: number; metadata: any }[]> {
        if (this.documents.length === 0) {
            return [];
        }

        const results = this.documents.map(doc => ({
            ...doc,
            score: this.cosineSimilarity(queryVector, doc.vector)
        }));

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, k).map(r => ({
            content: r.content,
            score: r.score,
            metadata: r.metadata
        }));
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    clear(): void {
        this.documents = [];
    }
}
