import { describe, it, expect } from 'vitest';
import { calculateTimingStats } from '../../src/services/insights/temporal';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateTimingStats', () => {
    it('should calculate heatmap correctly', () => {
        const messages: ChatMessage[] = [
            // Wednesday (3), 10:00
            { id: '1', date: '10/01/24', time: '10:00', sender: 'User A', content: 'Hi', timestamp: new Date(2024, 0, 10, 10, 0).getTime() },
            // Wednesday (3), 10:30
            { id: '2', date: '10/01/24', time: '10:30', sender: 'User B', content: 'Hello', timestamp: new Date(2024, 0, 10, 10, 30).getTime() },
            // Thursday (4), 14:00
            { id: '3', date: '11/01/24', time: '14:00', sender: 'User A', content: 'Hey', timestamp: new Date(2024, 0, 11, 14, 0).getTime() },
        ];

        const stats = calculateTimingStats(messages);

        expect(stats.activityHeatmap.hour[10]).toBe(2);
        expect(stats.activityHeatmap.hour[14]).toBe(1);
        expect(stats.activityHeatmap.day[3]).toBe(2); // Wednesday
        expect(stats.activityHeatmap.day[4]).toBe(1); // Thursday
    });

    it('should identify conversation starters', () => {
        const messages: ChatMessage[] = [
            // Starter
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Hi', timestamp: 1704099600000 },
            // Response
            { id: '2', date: '01/01/24', time: '10:05', sender: 'User B', content: 'Hi', timestamp: 1704099900000 },
            // Starter (> 6h gap)
            { id: '3', date: '01/01/24', time: '18:00', sender: 'User B', content: 'Anyone here?', timestamp: 1704128400000 },
        ];

        const stats = calculateTimingStats(messages);

        expect(stats.conversationStarters['User A']).toBe(1);
        expect(stats.conversationStarters['User B']).toBe(1);
    });

    it('should calculate average response time', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Q1', timestamp: 100000 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User B', content: 'A1', timestamp: 160000 }, // 60s
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User A', content: 'Q2', timestamp: 200000 }, // 40s
            { id: '4', date: '01/01/24', time: '10:03', sender: 'User B', content: 'A2', timestamp: 280000 }, // 80s
        ];

        const stats = calculateTimingStats(messages);

        // User B: (60 + 80) / 2 = 70s
        expect(stats.averageResponseTimePerUser['User B']).toBe(70);
        // User A: (40) / 1 = 40s
        expect(stats.averageResponseTimePerUser['User A']).toBe(40);
    });
});
