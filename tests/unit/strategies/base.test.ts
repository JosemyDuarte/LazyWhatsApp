import { describe, it, expect, vi } from 'vitest';
import { BaseAnalysisStrategy } from '../../../src/services/ai/strategies/base';
import type { ChatMessage, AnalysisConfiguration } from '../../../src/types/chat';
import type { ILLMAdapter } from '../../../src/services/ai/adapter';

// Concrete implementation for testing
class TestStrategy extends BaseAnalysisStrategy {
    readonly name = 'test-strategy';

    constructor(private mockResponse: string = 'Final Result') {
        super();
    }

    async *runAnalysis(
        messages: ChatMessage[],
        adapter: ILLMAdapter,
        config: AnalysisConfiguration
    ): AsyncGenerator<string> {
        // Yield context to verify formatContext helper
        yield this.formatContext(messages);

        // Yield progress to verify yieldProgress helper
        yield this.yieldProgress(50, 'Processing');

        // Simulate adapter call
        await adapter.chat([{ role: 'user', content: 'test' }]);

        // Yield final result
        yield this.mockResponse;
    }
}

describe('BaseAnalysisStrategy', () => {
    const mockAdapter: ILLMAdapter = {
        name: 'mock',
        id: 'mock-id',
        chat: vi.fn().mockResolvedValue({ content: 'Mock Reply' }),
        isAvailable: vi.fn().mockResolvedValue(true)
    };

    const mockMessages: ChatMessage[] = [
        { id: '1', sender: 'Alice', content: 'Hello', timestamp: 1000, date: '2023-01-01', time: '10:00' },
        { id: '2', sender: 'Bob', content: 'Hi', timestamp: 2000, date: '2023-01-01', time: '10:01' }
    ];

    const config: AnalysisConfiguration = { strategy: 'test' as any };

    it('execute should filter out progress and return accumulated text', async () => {
        const strategy = new TestStrategy('Final Result');
        const result = await strategy.execute(mockMessages, mockAdapter, config);

        // Expected: Context + Final Result (Progress filtered out)
        const expectedContext = 'Alice: Hello\nBob: Hi';
        expect(result).toBe(expectedContext + 'Final Result');
    });

    it('stream should yield all chunks including progress', async () => {
        const strategy = new TestStrategy('Final Result');
        const chunks: string[] = [];

        for await (const chunk of strategy.stream(mockMessages, mockAdapter, config)) {
            chunks.push(chunk);
        }

        expect(chunks).toHaveLength(3);
        expect(chunks[0]).toBe('Alice: Hello\nBob: Hi');
        expect(chunks[1]).toBe('[PROGRESS]:50:Processing');
        expect(chunks[2]).toBe('Final Result');
    });
});
