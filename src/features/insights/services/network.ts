import type { ChatMessage, NetworkStats } from '@features/chat/types';

/**
 * Calculates interaction network metrics.
 * FR-009: Reply Rate
 * FR-011: Mention Matrix
 */
export function calculateNetworkStats(messages: ChatMessage[]): NetworkStats {
    const stats: NetworkStats = {
        replyRatePerUser: {},
        mentionMatrix: {}
    };

    const userMessages = messages.filter(m => m.sender !== null);
    const senders = new Set(userMessages.map(m => m.sender!));

    // Create patterns for mentions based on existing senders
    const senderPatterns = Array.from(senders).map(s => ({
        name: s,
        pattern: new RegExp(`@${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    }));

    const userStats: Record<string, { total: number; replies: number }> = {};

    for (const msg of userMessages) {
        const sender = msg.sender!;
        if (!userStats[sender]) userStats[sender] = { total: 0, replies: 0 };

        userStats[sender].total++;

        // FR-009: Reply Rate
        if (msg.replyToId) {
            userStats[sender].replies++;
        }

        // FR-011: Mention Matrix
        // We look for @Name patterns in the content
        for (const { name, pattern } of senderPatterns) {
            if (name === sender) continue; // Skip self-mentions

            if (pattern.test(msg.content)) {
                if (!stats.mentionMatrix[sender]) stats.mentionMatrix[sender] = {};
                stats.mentionMatrix[sender][name] = (stats.mentionMatrix[sender][name] || 0) + 1;
            }
        }
    }

    // Calculate reply rates
    for (const [sender, data] of Object.entries(userStats)) {
        if (data.total > 0) {
            stats.replyRatePerUser[sender] = Number((data.replies / data.total).toFixed(2));
        }
    }

    return stats;
}
