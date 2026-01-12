import type { ChatMessage } from '@features/chat/types';

export interface ChatStats {
    totalMessages: number;
    uniqueSenders: number;
    messagesPerSender: Record<string, number>;
    topSpeakers: { name: string; count: number }[];
    dayDistribution: Record<string, number>; // Monday, Tuesday, etc.
    hourDistribution: Record<string, number>; // 0-23
    firstMessageDate: string;
    lastMessageDate: string;
    mostUsedEmojis: { emoji: string; count: number }[];
}

export function calculateBasicStats(messages: ChatMessage[]): ChatStats {
    const stats: ChatStats = {
        totalMessages: messages.length,
        uniqueSenders: 0,
        messagesPerSender: {},
        topSpeakers: [],
        dayDistribution: {},
        hourDistribution: {},
        firstMessageDate: '',
        lastMessageDate: '',
        mostUsedEmojis: [],
    };

    if (messages.length === 0) return stats;

    let minTs = Infinity;
    let maxTs = -Infinity;
    const emojiCounts: Record<string, number> = {};

    messages.forEach((msg) => {
        if (msg.timestamp < minTs) minTs = msg.timestamp;
        if (msg.timestamp > maxTs) maxTs = msg.timestamp;
        if (msg.sender) {
            stats.messagesPerSender[msg.sender] = (stats.messagesPerSender[msg.sender] || 0) + 1;
        }

        const date = new Date(msg.timestamp);
        if (!isNaN(date.getTime())) {
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = date.getHours().toString();

            stats.dayDistribution[day] = (stats.dayDistribution[day] || 0) + 1;
            stats.hourDistribution[hour] = (stats.hourDistribution[hour] || 0) + 1;
        }

        // Extract emojis using a broad regex range for emoji characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
        const matches = msg.content.match(emojiRegex);
        if (matches) {
            matches.forEach(emoji => {
                emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            });
        }
    });

    const senders = Object.entries(stats.messagesPerSender);
    stats.uniqueSenders = senders.length;

    stats.topSpeakers = senders
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    stats.mostUsedEmojis = Object.entries(emojiCounts)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    if (minTs !== Infinity) {
        stats.firstMessageDate = new Date(minTs).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
    if (maxTs !== -Infinity) {
        stats.lastMessageDate = new Date(maxTs).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    return stats;
}
