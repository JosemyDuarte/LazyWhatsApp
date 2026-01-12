import { describe, it, expect } from 'vitest';
import { filterMessagesByDate } from '../../src/services/insights/filter';
import type { ChatMessage, AnalysisConfiguration } from '../../src/types/chat';

describe('filterMessagesByDate', () => {
    const mockMessages: ChatMessage[] = [
        { id: '1', timestamp: 1000, content: 'msg 1', sender: 'A', date: '2023-01-01', time: '00:00' },
        { id: '2', timestamp: 2000, content: 'msg 2', sender: 'B', date: '2023-01-01', time: '00:00' },
        { id: '3', timestamp: 3000, content: 'msg 3', sender: 'A', date: '2023-01-01', time: '00:00' },
    ];

    it('should filter messages within a valid range', () => {
        const config: AnalysisConfiguration = {
            strategy: 'hybrid',
            dateRange: { start: 1500, end: 2500 }
        };
        const result = filterMessagesByDate(mockMessages, config);
        expect(result).toHaveLength(1);
        expect(result[0].timestamp).toBe(2000);
    });

    it('should return all messages if no range is provided', () => {
        const config: AnalysisConfiguration = { strategy: 'hybrid' };
        const result = filterMessagesByDate(mockMessages, config);
        expect(result).toHaveLength(3);
    });

    it('should return empty array for out-of-bounds range', () => {
        const config: AnalysisConfiguration = {
            strategy: 'hybrid',
            dateRange: { start: 5000, end: 6000 }
        };
        const result = filterMessagesByDate(mockMessages, config);
        expect(result).toHaveLength(0);
    });

    it('should handle single message range', () => {
        const config: AnalysisConfiguration = {
            strategy: 'hybrid',
            dateRange: { start: 1000, end: 1000 }
        };
        const result = filterMessagesByDate(mockMessages, config);
        expect(result).toHaveLength(1);
        expect(result[0].timestamp).toBe(1000);
    });
});
