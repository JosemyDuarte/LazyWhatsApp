import type { ChatMessage, TimingStats } from '@features/chat/types';

/**
 * Calculates temporal dynamics metrics.
 * FR-004: Activity Heatmap
 * FR-005: Conversation Starters (> 6h gap)
 * FR-006: Average Response Time
 */
export function calculateTimingStats(messages: ChatMessage[]): TimingStats {
    const stats: TimingStats = {
        activityHeatmap: {
            hour: Array(24).fill(0),
            day: Array(7).fill(0)
        },
        timeline: {},
        conversationStarters: {},
        averageResponseTimePerUser: {}
    };

    if (messages.length === 0) return stats;

    const STARTER_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours in ms
    const userMessages = messages.filter(m => m.sender !== null);

    const userResponseTimes: Record<string, number[]> = {};
    let lastMessageTime = 0;

    for (let i = 0; i < userMessages.length; i++) {
        const msg = userMessages[i];
        const date = new Date(msg.timestamp);

        // FR-004: Heatmap
        if (!isNaN(date.getTime())) {
            stats.activityHeatmap.hour[date.getHours()]++;
            stats.activityHeatmap.day[date.getDay()]++;

            const dateKey = date.toISOString().split('T')[0];
            stats.timeline[dateKey] = (stats.timeline[dateKey] || 0) + 1;
        }

        // FR-005 & FR-006: Starters and Response Time
        if (i > 0) {
            const gap = msg.timestamp - lastMessageTime;

            if (gap > STARTER_THRESHOLD) {
                // Conversation starter
                const sender = msg.sender!;
                stats.conversationStarters[sender] = (stats.conversationStarters[sender] || 0) + 1;
            } else {
                // Response time (only if gap is small enough to be a response, e.g. < 2h?)
                // Spec says "delta between a message and its predecessor".
                // We'll exclude huge gaps from average response time to avoid skewing.
                const RESPONSE_MAX = 2 * 60 * 60 * 1000; // 2 hours
                if (gap < RESPONSE_MAX) {
                    const sender = msg.sender!;
                    if (!userResponseTimes[sender]) userResponseTimes[sender] = [];
                    userResponseTimes[sender].push(gap);
                }
            }
        } else {
            // First message is always a starter
            const sender = msg.sender!;
            stats.conversationStarters[sender] = (stats.conversationStarters[sender] || 0) + 1;
        }

        lastMessageTime = msg.timestamp;
    }

    // Calculate averages
    for (const [sender, times] of Object.entries(userResponseTimes)) {
        if (times.length > 0) {
            const sum = times.reduce((a, b) => a + b, 0);
            stats.averageResponseTimePerUser[sender] = Math.round((sum / times.length) / 1000); // to seconds
        }
    }

    return stats;
}
