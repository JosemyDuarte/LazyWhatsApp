import { describe, it, expect } from 'vitest';
import { calculateBasicStats } from '../../src/services/insights/stats';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateBasicStats', () => {
    it('should calculate top 5 speakers correctly', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '21/01/24', time: '13:00', timestamp: Date.now(), sender: 'Alice', content: 'Hi' },
            { id: '2', date: '21/01/24', time: '13:01', timestamp: Date.now(), sender: 'Alice', content: 'How are you?' },
            { id: '3', date: '21/01/24', time: '13:02', timestamp: Date.now(), sender: 'Bob', content: 'I am good' },
            { id: '4', date: '21/01/24', time: '13:03', timestamp: Date.now(), sender: 'Alice', content: 'Nice' },
            { id: '5', date: '21/01/24', time: '13:04', timestamp: Date.now(), sender: 'Charlie', content: 'Hello' },
            { id: '6', date: '21/01/24', time: '13:05', timestamp: Date.now(), sender: 'Charlie', content: 'Test' },
        ];

        const stats = calculateBasicStats(messages);

        expect(stats.totalMessages).toBe(6);
        expect(stats.uniqueSenders).toBe(3);
        expect(stats.topSpeakers).toHaveLength(3);
        expect(stats.topSpeakers[0]).toEqual({ name: 'Alice', count: 3 });
        expect(stats.topSpeakers[1]).toEqual({ name: 'Charlie', count: 2 });
        expect(stats.topSpeakers[2]).toEqual({ name: 'Bob', count: 1 });
    });

    it('should limit to top 5 speakers', () => {
        const messages: ChatMessage[] = [];
        const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        names.forEach((name, i) => {
            for (let j = 0; j < (10 - i); j++) {
                messages.push({
                    id: `${name}-${j}`,
                    date: '21/01/24',
                    time: '13:00',
                    timestamp: Date.now(),
                    sender: name,
                    content: 'msg'
                });
            }
        });

        const stats = calculateBasicStats(messages);
        expect(stats.topSpeakers).toHaveLength(5);
        expect(stats.topSpeakers[0].name).toBe('A');
        expect(stats.topSpeakers[4].name).toBe('E');
    });
    it('should calculate most used emojis', () => {
        const messages: ChatMessage[] = [
            { id: '1', date: '21/01/24', time: '13:00', timestamp: Date.now(), sender: 'Alice', content: 'Hi 😀' },
            { id: '2', date: '21/01/24', time: '13:01', timestamp: Date.now(), sender: 'Bob', content: 'Hello 😀' },
            { id: '3', date: '21/01/24', time: '13:02', timestamp: Date.now(), sender: 'Alice', content: 'Cool 😎' },
            { id: '4', date: '21/01/24', time: '13:03', timestamp: Date.now(), sender: 'Charlie', content: 'Funny 😂 😂' },
            { id: '5', date: '21/01/24', time: '13:04', timestamp: Date.now(), sender: 'Bob', content: 'Yes 😂' },
        ];

        const stats = calculateBasicStats(messages);

        expect(stats.mostUsedEmojis).toHaveLength(3);
        expect(stats.mostUsedEmojis[0]).toEqual({ emoji: '😂', count: 3 });
        expect(stats.mostUsedEmojis[1]).toEqual({ emoji: '😀', count: 2 });
        expect(stats.mostUsedEmojis[2]).toEqual({ emoji: '😎', count: 1 });
    });
});
