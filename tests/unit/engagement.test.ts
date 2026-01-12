import { describe, it, expect } from 'vitest';
import { calculateEngagement } from '../../src/services/insights/engagement';
import type { ChatMessage } from '../../src/types/chat';

describe('calculateEngagement', () => {
    it('should calculate top 5 most replied to correctly', () => {
        const now = Date.now();
        const messages: ChatMessage[] = [
            { id: '1', date: '21/01/24', time: '13:00', timestamp: now, sender: 'Alice', content: 'Q1' },
            { id: '2', date: '21/01/24', time: '13:01', timestamp: now + 1000, sender: 'Bob', content: 'A1' },
            { id: '3', date: '21/01/24', time: '13:02', timestamp: now + 2000, sender: 'Alice', content: 'Q2' },
            { id: '4', date: '21/01/24', time: '13:03', timestamp: now + 3000, sender: 'Bob', content: 'A2' },
            { id: '5', date: '21/01/24', time: '13:04', timestamp: now + 4000, sender: 'Charlie', content: 'Q3' },
            { id: '6', date: '21/01/24', time: '13:05', timestamp: now + 5000, sender: 'Alice', content: 'A3' },
        ];

        const engagement = calculateEngagement(messages);

        // Bob replied to Alice twice (Alice is replied to)
        // Alice replied to Charlie once (Charlie is replied to)
        // Every different speaker after the first one is a reply
        expect(engagement.topRepliedTo).toHaveLength(3);
        expect(engagement.topRepliedTo[0]).toEqual({ name: 'Alice', count: 2 });
        expect(engagement.topRepliedTo[1]).toEqual({ name: 'Bob', count: 2 });
        expect(engagement.topRepliedTo[2]).toEqual({ name: 'Charlie', count: 1 });
    });
});
