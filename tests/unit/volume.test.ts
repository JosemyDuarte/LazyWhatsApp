import { describe, it, expect } from 'vitest';
import { calculateVolumeStats } from '../../src/services/insights/volume';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateVolumeStats', () => {
    it('should calculate basic counts correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Hello', timestamp: 1704099600000 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User A', content: 'World', timestamp: 1704099660000 },
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User B', content: 'Hi there', timestamp: 1704099720000 },
        ];

        const stats = calculateVolumeStats(messages);

        expect(stats.totalMessages).toBe(3);
        expect(stats.messageCountPerUser['User A']).toBe(2);
        expect(stats.messageCountPerUser['User B']).toBe(1);
    });

    it('should identify media messages', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: '<Media omitted>', timestamp: 1704099600000 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User B', content: 'image omitted', timestamp: 1704099660000 },
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User A', content: 'Just a text', timestamp: 1704099720000 },
            { id: '4', date: '01/01/24', time: '10:03', sender: 'User B', content: 'file.pdf (file attached)', timestamp: 1704099780000 },
        ];

        const stats = calculateVolumeStats(messages);

        expect(stats.totalMedia).toBe(3);
        expect(stats.mediaCountPerUser['User A']).toBe(1);
        expect(stats.mediaCountPerUser['User B']).toBe(2);
        expect(stats.messageCountPerUser['User A']).toBe(2);
        expect(stats.messageCountPerUser['User B']).toBe(2);
    });

    it('should calculate average message length correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'One two three', timestamp: 1704099600000 }, // 13 chars, 3 words
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User A', content: 'Four five', timestamp: 1704099660000 },    // 9 chars, 2 words
            { id: '3', date: '01/01/24', time: '10:02', sender: 'User B', content: 'Hello', timestamp: 1704099720000 },       // 5 chars, 1 word
        ];

        const stats = calculateVolumeStats(messages);

        // User A: (13+9)/2 = 11 chars, (3+2)/2 = 2.5 -> 3 words (Math.round)
        expect(stats.averageMessageLengthPerUser['User A']).toEqual({
            characters: 11,
            words: 3
        });
        expect(stats.averageMessageLengthPerUser['User B']).toEqual({
            characters: 5,
            words: 1
        });
    });

    it('should exclude system messages from counts', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Hi', timestamp: 1704099600000 },
            { id: '2', date: '01/01/24', time: '10:01', sender: null, content: 'Messages are encrypted', timestamp: 1704099660000 },
        ];

        const stats = calculateVolumeStats(messages);

        expect(stats.totalMessages).toBe(1);
        expect(stats.messageCountPerUser['User A']).toBe(1);
        expect(stats.messageCountPerUser[null as any]).toBeUndefined();
    });

    it('should handle empty messages gracefully', () => {
        const stats = calculateVolumeStats([]);
        expect(stats.totalMessages).toBe(0);
        expect(stats.totalMedia).toBe(0);
        expect(Object.keys(stats.messageCountPerUser)).toHaveLength(0);
    });
});
