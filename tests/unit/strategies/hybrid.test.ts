import { describe, it, expect, vi } from 'vitest';
import { HybridStrategy } from '../../../src/services/ai/strategies/hybrid';
import type { ChatMessage, AnalysisConfiguration } from '../../../src/types/chat';
import type { ILLMAdapter } from '../../../src/services/ai/adapter';

describe('HybridStrategy', () => {
    const mockAdapter: ILLMAdapter = {
        name: 'mock',
        id: 'mock-id',
        chat: vi.fn().mockResolvedValue({ content: 'Hybrid Summary' }),
        isAvailable: vi.fn().mockResolvedValue(true)
    };

    // Create a scenario:
    // 1. Ancient dense cluster (Peak 1): Messages 0-19
    // 2. Quiet period: Message 20 (isolated)
    // 3. Recent dense cluster (Recent): Messages 21-70
    const mockMessages: ChatMessage[] = [];

    // Cluster 1: 0-19 (20 messages in 20 seconds)
    for (let i = 0; i < 20; i++) {
        mockMessages.push({
            id: `m${i}`,
            timestamp: i * 1000,
            content: `msg ${i}`,
            sender: 'User',
            date: '2023-01-01',
            time: '00:00'
        });
    }

    // Isolated message: 2 hours later
    mockMessages.push({
        id: `m20`,
        timestamp: 7200000, // 2 hours
        content: `msg 20`,
        sender: 'User',
        date: '2023-01-01',
        time: '02:00'
    });

    // Recent Cluster: 21-70 (50 messages) starts 4 hours later
    for (let i = 21; i <= 70; i++) {
        mockMessages.push({
            id: `m${i}`,
            timestamp: 14400000 + (i * 1000), // 4 hours + offset
            content: `msg ${i}`,
            sender: 'User',
            date: '2023-01-01',
            time: '04:00'
        });
    }

    it('should combine peaks and recent messages in context', async () => {
        const strategy = new HybridStrategy();
        const config: AnalysisConfiguration = { strategy: 'hybrid' };

        await strategy.execute(mockMessages, mockAdapter, config);

        expect(mockAdapter.chat).toHaveBeenCalled();
        const prompt = (mockAdapter.chat as any).mock.calls[0][0];
        const userContent = prompt[1].content;

        // Peak messages (from first cluster) should be present
        expect(userContent).toContain('msg 0');
        expect(userContent).toContain('msg 19');

        // Recent messages (last 50, from second cluster) should be present
        expect(userContent).toContain('msg 70');

        // The isolated message (msg 20) should be missing because:
        // 1. It's not in a peak (density < 10)
        // 2. It's not in the last 50 (last 50 are 21-70)
        expect(userContent).not.toContain('msg 20');
    });

    it('should emit specific progress signals', async () => {
        const strategy = new HybridStrategy();
        const config: AnalysisConfiguration = { strategy: 'hybrid' };

        const chunks: string[] = [];
        for await (const chunk of strategy.stream(mockMessages, mockAdapter, config)) {
            chunks.push(chunk);
        }

        const progress = chunks.filter(c => c.startsWith('[PROGRESS]'));
        expect(progress.length).toBeGreaterThan(0);
        expect(progress[0]).toContain('Detecting conversation peaks');
        expect(progress[1]).toContain('Analyzing 2 key topics'); // 2 peaks found (0-19 and 21-70)
    });
});
