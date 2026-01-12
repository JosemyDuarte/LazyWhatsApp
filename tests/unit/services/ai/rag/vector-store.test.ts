import { describe, it, expect, beforeEach } from 'vitest';
import { VectorStore } from '../../../../../src/services/ai/rag/vector-store';

describe('VectorStore', () => {
    let store: VectorStore;

    beforeEach(() => {
        store = new VectorStore();
    });

    it('should add documents and search them', async () => {
        const messages = [
            { content: 'Hello world', sender: 'Alice', timestamp: new Date() },
            { content: 'React is a library', sender: 'Bob', timestamp: new Date() },
            { content: 'Vue is also cool', sender: 'Charlie', timestamp: new Date() },
        ];

        // Mock vectors: simple 2D vectors for easy similarity check
        // "Hello world" -> [1, 0]
        // "React..." -> [0, 1]
        // "Vue..." -> [0, 0.9]
        const vectors = [
            [1, 0],
            [0, 1],
            [0, 0.9]
        ];

        await store.addDocuments(messages, vectors);

        // Query close to "Hello world"
        const results1 = await store.search([1, 0], 1);
        expect(results1).toHaveLength(1);
        expect(results1[0].content).toBe('Hello world');
        expect(results1[0].score).toBeCloseTo(1);

        // Query close to "React"
        const results2 = await store.search([0, 1], 2);
        expect(results2).toHaveLength(2);
        expect(results2[0].content).toBe('React is a library'); // Sc 1.0
        expect(results2[1].content).toBe('Vue is also cool'); // High similarity with [0, 1]
        expect(results2[1].score).toBeGreaterThan(0.8);
    });

    it('should handle empty store', async () => {
        const results = await store.search([1, 1]);
        expect(results).toHaveLength(0);
    });

    it('should clear documents', async () => {
        await store.addDocuments([{ content: 'test', sender: 'me', timestamp: new Date() }], [[1]]);
        store.clear();
        const results = await store.search([1]);
        expect(results).toHaveLength(0);
    });
});
