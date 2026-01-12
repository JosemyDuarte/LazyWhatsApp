import type { ChatMessage } from '@features/chat/types';

export interface EngagementStats {
    topRepliedTo: { name: string; count: number }[];
    peakEngagementHour: string | null;
    averageResponseTime: number; // in seconds
}

export function calculateEngagement(messages: ChatMessage[]): EngagementStats {
    const stats: EngagementStats = {
        topRepliedTo: [],
        peakEngagementHour: null,
        averageResponseTime: 0,
    };

    if (messages.length < 2) return stats;

    // Ensure messages are sorted by timestamp for correct diff calculation
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    const responseTimes: number[] = [];
    const replyCounts: Record<string, number> = {};

    for (let i = 1; i < sortedMessages.length; i++) {
        const prev = sortedMessages[i - 1];
        const curr = sortedMessages[i];

        // Simple reply detection: different sender within 5 minutes
        if (prev.sender && curr.sender && prev.sender !== curr.sender) {
            const diff = (curr.timestamp - prev.timestamp) / 1000;
            if (diff < 300) { // 5 minutes
                responseTimes.push(diff);
                replyCounts[prev.sender] = (replyCounts[prev.sender] || 0) + 1;
            }
        }
    }

    if (responseTimes.length > 0) {
        stats.averageResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    }

    const replies = Object.entries(replyCounts);
    stats.topRepliedTo = replies
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return stats;
}
