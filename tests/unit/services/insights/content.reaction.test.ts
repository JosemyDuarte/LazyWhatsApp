import { describe, it, expect } from 'vitest';
import { calculateContentStats } from '../../../../src/services/insights/content';
import type { ChatMessage } from '../../../../src/types/chat';

describe('calculateContentStats - Reactions', () => {
    it('should correctly count reaction emojis from multiple formats', () => {
        const messages: ChatMessage[] = [

            { id: '1', date: '01/01/2024', time: '12:00', sender: 'Alice', content: 'Reacted "😂" to "Hello"', timestamp: 1 },
            { id: '2', date: '01/01/2024', time: '12:01', sender: 'Bob', content: 'Reacted to "World!" with "👍"', timestamp: 2 },
            { id: '3', date: '01/01/2024', time: '12:02', sender: 'Charlie', content: 'Reacted with "❤️" to "Message"', timestamp: 3 },
            { id: '4', date: '01/01/2024', time: '12:03', sender: 'Dave', content: 'reacted "🔥" to "text"', timestamp: 4 },
            // Regression tests: Should NOT match punctuation
            { id: '5', date: '01/01/2024', time: '12:04', sender: 'Eve', content: 'Reacted with "..." to "text"', timestamp: 5 },
            { id: '6', date: '01/01/2024', time: '12:05', sender: 'Frank', content: 'Reacted with "," to "text"', timestamp: 6 }

        ];

        const stats = calculateContentStats(messages);

        expect(stats.topReactionEmojis.length).toBeGreaterThan(0);
        expect(stats.topReactionEmojis).toEqual([
            { emoji: '😂', count: 1 },
            { emoji: '👍', count: 1 },
            { emoji: '❤️', count: 1 },
            { emoji: '🔥', count: 1 }
        ]);
    });

    it('should fallback to regular emojis if no reactions found (tested indirectly via null return)', () => {
        // Logic for fallback is in UI, but we can verify stats are empty here if no reactions
        const messages: ChatMessage[] = [
            { id: '1', date: '01/01/2024', time: '12:00', sender: 'Alice', content: 'Hello 😂', timestamp: 1 }
        ];
        const stats = calculateContentStats(messages);
        expect(stats.topReactionEmojis).toEqual([]);
        expect(stats.topEmojisPerUser['Alice']).toBeDefined();
    });
});
