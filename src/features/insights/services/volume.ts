import type { ChatMessage, VolumeStats } from '@features/chat/types';

/**
 * Calculates volume and participation metrics.
 * FR-001: Message Count per User
 * FR-002: Average Message Length per User
 * FR-003: Media & File Count per User
 */
export function calculateVolumeStats(messages: ChatMessage[]): VolumeStats {
    const stats: VolumeStats = {
        messageCountPerUser: {},
        averageMessageLengthPerUser: {},
        mediaCountPerUser: {},
        totalMessages: 0,
        totalMedia: 0
    };

    // Filter out system messages
    const userMessages = messages.filter(m => m.sender !== null);
    stats.totalMessages = userMessages.length;

    // Media detection patterns
    // WhatsApp exports vary between iOS and Android
    const mediaPatterns = [
        /<Media omitted>/i,
        /omitted/i,         // iOS: "image omitted", "video omitted", etc.
        /\(file attached\)/i, // Android: "(file attached)"
        /Ptt \(file attached\)/i // Android Voice Notes
    ];

    const userStatsMap: Record<string, { count: number; totalChars: number; totalWords: number; mediaCount: number }> = {};

    for (const msg of userMessages) {
        const sender = msg.sender!;
        if (!userStatsMap[sender]) {
            userStatsMap[sender] = { count: 0, totalChars: 0, totalWords: 0, mediaCount: 0 };
        }

        const isMedia = mediaPatterns.some(p => p.test(msg.content));

        if (isMedia) {
            userStatsMap[sender].mediaCount++;
            stats.totalMedia++;
        } else {
            userStatsMap[sender].count++;
            userStatsMap[sender].totalChars += msg.content.length;
            userStatsMap[sender].totalWords += msg.content.trim().split(/\s+/).filter(Boolean).length;
        }
    }

    for (const [sender, data] of Object.entries(userStatsMap)) {
        // Total message count (including media)
        stats.messageCountPerUser[sender] = data.count + data.mediaCount;
        stats.mediaCountPerUser[sender] = data.mediaCount;

        // Average length calculations from text messages only
        if (data.count > 0) {
            stats.averageMessageLengthPerUser[sender] = {
                characters: Math.round(data.totalChars / data.count),
                words: Math.round(data.totalWords / data.count)
            };
        } else {
            stats.averageMessageLengthPerUser[sender] = { characters: 0, words: 0 };
        }
    }

    return stats;
}
