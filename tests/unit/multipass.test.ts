import { describe, it, expect, vi } from 'vitest';
import { MultiPassStrategy } from '../../src/services/ai/strategies/multipass';
import type { ChatMessage, AnalysisConfiguration } from '../../src/types/chat';
import type { ILLMAdapter } from '../../src/services/ai/adapter';

describe('MultiPassStrategy', () => {
    const mockAdapter: ILLMAdapter = {
        name: 'ollama',
        id: 'ollama-mock',
        chat: vi.fn().mockImplementation(async (messages) => {
            if (messages[0].content.includes('Context Extraction Engine')) {
                return { content: 'Segment Summary' };
            }
            if (messages[0].content.includes('Senior Conversation Analyst')) {
                return { content: 'Synthesized Final Report' };
            }
            return { content: 'Default' };
        }),
        isAvailable: vi.fn().mockResolvedValue(true)
    };

    const mockMessages: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: `m${i}`,
        timestamp: i * 1000,
        content: `msg ${i}`,
        sender: 'User',
        date: '2023-01-01',
        time: '00:00'
    }));

    it('should chunk messages and synthesize result', async () => {
        const strategy = new MultiPassStrategy();
        const config: AnalysisConfiguration = {
            strategy: 'multi-pass',
            chunkSize: 5
        };

        const result = await strategy.execute(mockMessages, mockAdapter, config);

        // 15 messages / 5 size = 3 chunks
        // 3 calls to summarizeChunk + 1 call to synthesizeSummaries = 4 total calls
        expect(mockAdapter.chat).toHaveBeenCalledTimes(4);
        expect(result).toBe('Synthesized Final Report');
    });

    it('should support streaming with progress signals', async () => {
        const strategy = new MultiPassStrategy();
        const config: AnalysisConfiguration = {
            strategy: 'multi-pass',
            chunkSize: 10
        };

        const chunks: string[] = [];
        for await (const chunk of strategy.stream(mockMessages, mockAdapter, config)) {
            chunks.push(chunk);
        }

        // chunk 1 progress + chunk 2 progress + synthesis progress + final content chunk
        // 15 msgs / 10 size = 2 chunks
        expect(chunks[0]).toContain('Summarizing segment 1/2');
        expect(chunks[1]).toContain('Summarizing segment 2/2');
        expect(chunks[2]).toContain('Synthesizing final report');
        expect(chunks[chunks.length - 1]).toBe('Synthesized Final Report');
    });
});
