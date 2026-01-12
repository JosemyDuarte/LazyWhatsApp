import { describe, it, expect } from 'vitest';
import { calculateNetworkStats } from '../../src/services/insights/network';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateNetworkStats', () => {
    it('should calculate reply rates correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Q1', timestamp: 100 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User B', content: 'A1', timestamp: 200, replyToId: '1' },
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User B', content: 'A2', timestamp: 300 }, // Not a reply
        ];

        const stats = calculateNetworkStats(messages);

        expect(stats.replyRatePerUser['User B']).toBe(0.5);
        expect(stats.replyRatePerUser['User A']).toBe(0);
    });

    it('should build mention matrix correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Hey @User B', timestamp: 100 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User B', content: 'Yes @User A?', timestamp: 200 },
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User A', content: 'Did @User B see this?', timestamp: 300 },
        ];

        const stats = calculateNetworkStats(messages);

        expect(stats.mentionMatrix['User A']['User B']).toBe(2);
        expect(stats.mentionMatrix['User B']['User A']).toBe(1);
    });
});
