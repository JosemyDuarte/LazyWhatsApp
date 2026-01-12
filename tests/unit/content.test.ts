import { describe, it, expect } from 'vitest';
import { calculateContentStats } from '../../src/services/insights/content';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateContentStats', () => {
    it('should count links correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Check this: https://google.com and http://github.com', timestamp: 100 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User B', content: 'No links here', timestamp: 200 },
        ];

        const stats = calculateContentStats(messages);

        expect(stats.linkSharingCountPerUser['User A']).toBe(2);
        expect(stats.linkSharingCountPerUser['User B']).toBeUndefined();
    });

    it('should count emojis and return top ones', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'Happy 😊😊', timestamp: 100 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User A', content: 'Sad 😢', timestamp: 200 },
        ];

        const stats = calculateContentStats(messages);

        expect(stats.topEmojisPerUser['User A']).toContainEqual({ emoji: '😊', count: 2 });
        expect(stats.topEmojisPerUser['User A']).toContainEqual({ emoji: '😢', count: 1 });
    });

    it('should calculate vocabulary richness', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/24', time: '10:00', sender: 'User A', content: 'The quick brown fox', timestamp: 100 },
            { id: '2', date: '01/01/24', time: '10:01', sender: 'User A', content: 'The jumpy fox', timestamp: 200 },
        ];

        // Unique tokens ignoring stop words (the): quick, brown, fox, jumpy
        const stats = calculateContentStats(messages);

        expect(stats.vocabularyRichnessPerUser['User A']).toBe(4);
    });
});
