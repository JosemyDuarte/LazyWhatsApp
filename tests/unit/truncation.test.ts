import { describe, it, expect, vi } from 'vitest';
import { TruncationStrategy } from '../../src/services/ai/strategies/truncation';
import type { ChatMessage, AnalysisConfiguration } from '../../src/types/chat';
import type { ILLMAdapter } from '../../src/services/ai/adapter';

describe('TruncationStrategy', () => {
    const mockAdapter: ILLMAdapter = {
        name: 'ollama',
        id: 'ollama-mock',
        chat: vi.fn().mockResolvedValue({ content: 'Summary' }),
        isAvailable: vi.fn().mockResolvedValue(true)
    };

    const mockMessages: ChatMessage[] = Array.from({ length: 200 }, (_, i) => ({
        id: `m${i}`,
        timestamp: i * 1000,
        content: `msg ${i}`,
        sender: 'User',
        date: '2023-01-01',
        time: '00:00'
    }));

    it('should truncate to default recent count (100)', async () => {
        const strategy = new TruncationStrategy();
        const config: AnalysisConfiguration = { strategy: 'truncation' };

        await strategy.execute(mockMessages, mockAdapter, config);

        expect(mockAdapter.chat).toHaveBeenCalled();
        const call = (mockAdapter.chat as any).mock.calls[0][0];
        const userMsg = call[1].content;
        expect(userMsg).toContain('msg 100');
        expect(userMsg).not.toContain('msg 99');
    });

    it('should respect custom recent count', async () => {
        const strategy = new TruncationStrategy();
        const config: AnalysisConfiguration = { strategy: 'truncation', recentCount: 50 };

        await strategy.execute(mockMessages, mockAdapter, config);

        const call = (mockAdapter.chat as any).mock.calls[1][0];
        const userMsg = call[1].content;
        expect(userMsg).toContain('msg 150');
        expect(userMsg).not.toContain('msg 149');
    });

    it('should emit progress signals during streaming', async () => {
        const strategy = new TruncationStrategy();
        const config: AnalysisConfiguration = { strategy: 'truncation' };

        const chunks: string[] = [];
        for await (const chunk of strategy.stream(mockMessages, mockAdapter, config)) {
            chunks.push(chunk);
        }

        const progress = chunks.filter(c => c.startsWith('[PROGRESS]'));
        expect(progress.length).toBeGreaterThan(0);
        // We expect at least start progress
        expect(progress[0]).toContain(':0:');
    });
});
