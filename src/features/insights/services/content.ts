import type { ChatMessage, ContentStats } from '@features/chat/types';

/**
 * Calculates content and style metrics.
 * FR-007: Emoji Usage Frequency
 * FR-008: Link Sharing Count
 * FR-010: Vocabulary Richness
 */
export function calculateContentStats(messages: ChatMessage[]): ContentStats {
    const stats: ContentStats = {
        topEmojisPerUser: {},
        topReactionEmojis: [],
        linkSharingCountPerUser: {},
        vocabularyRichnessPerUser: {},
        topDomains: []
    };

    const domainCounts: Record<string, number> = {};

    const userMessages = messages.filter(m => m.sender !== null);
    const mediaPatterns = [/<Media omitted>/i, /omitted/i, /\(file attached\)/i];


    // Basic set of English stop words
    const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'their', 'our']);

    // Robust Emoji regex using Unicode Property Escapes
    // Matches any character that is an extended pictographic (emojis, etc.)
    const ALL_EMOJIS_REGEX = /\p{Extended_Pictographic}/gu;
    const IS_EMOJI_TEST_REGEX = /\p{Extended_Pictographic}/u;

    const LINK_REGEX = /https?:\/\/[^\s]+/g;
    // Reaction patterns:
    // 1. Reacted "😂" to "Message"
    // 2. Reacted to "Message" with "😂"
    // 3. Reacted with "😂" to "Message" (possible variation)
    // 4. "😂" to "Message" (minimalist export)
    const REACTION_REGEX_1 = /Reacted\s+["“]([^"”]+)["”]\s+to/i; // "😂" to
    const REACTION_REGEX_2 = /Reacted\s+to\s+["“][^"”]+["”]\s+with\s+["“]([^"”]+)["”]/i; // with "😂"
    const REACTION_REGEX_3 = /Reacted\s+with\s+["“]([^"”]+)["”]\s+to/i; // with "😂"

    const userTokenSets: Record<string, Set<string>> = {};
    const userEmojiCounts: Record<string, Record<string, number>> = {};
    const reactionEmojiCounts: Record<string, number> = {};

    for (const msg of userMessages) {
        const sender = msg.sender!;
        const isMedia = mediaPatterns.some(p => p.test(msg.content));
        if (isMedia) continue;

        // FR-008: Links and Domain Tracking
        const links = msg.content.match(LINK_REGEX);
        if (links) {
            stats.linkSharingCountPerUser[sender] = (stats.linkSharingCountPerUser[sender] || 0) + links.length;
            // Extract and count domains
            for (const link of links) {
                try {
                    const url = new URL(link);
                    const domain = url.hostname.replace(/^www\./, '');
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                } catch {
                    // Invalid URL, skip
                }
            }
        }

        // FR-007: Emojis
        const emojis = msg.content.match(ALL_EMOJIS_REGEX);

        // Check for reaction message
        const reactionMatch1 = msg.content.match(REACTION_REGEX_1);
        const reactionMatch2 = msg.content.match(REACTION_REGEX_2);
        const reactionMatch3 = msg.content.match(REACTION_REGEX_3);
        const reactionEmojiChar = reactionMatch1 ? reactionMatch1[1] : (reactionMatch2 ? reactionMatch2[1] : (reactionMatch3 ? reactionMatch3[1] : null));

        if (reactionEmojiChar && IS_EMOJI_TEST_REGEX.test(reactionEmojiChar)) {
            // It's a reaction message, count for topReactionEmojis
            reactionEmojiCounts[reactionEmojiChar] = (reactionEmojiCounts[reactionEmojiChar] || 0) + 1;
        } else if (emojis) {

            // Regular message content emojis
            if (!userEmojiCounts[sender]) userEmojiCounts[sender] = {};
            for (const emoji of emojis) {
                userEmojiCounts[sender][emoji] = (userEmojiCounts[sender][emoji] || 0) + 1;
            }
        }

        // FR-010: Vocabulary Richness
        if (!userTokenSets[sender]) userTokenSets[sender] = new Set();
        const tokens = msg.content.toLowerCase().split(/[^\w]+/).filter(Boolean);
        for (const token of tokens) {
            if (!STOP_WORDS.has(token) && isNaN(Number(token))) {
                userTokenSets[sender].add(token);
            }
        }
    }

    // Aggregate Top Emojis
    for (const [sender, counts] of Object.entries(userEmojiCounts)) {
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([emoji, count]) => ({ emoji, count }));
        stats.topEmojisPerUser[sender] = sorted;
    }

    // Aggregate Top Reaction Emojis
    stats.topReactionEmojis = Object.entries(reactionEmojiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5
        .map(([emoji, count]) => ({ emoji, count }));

    // Aggregate Vocabulary
    for (const [sender, tokenSet] of Object.entries(userTokenSets)) {
        stats.vocabularyRichnessPerUser[sender] = tokenSet.size;
    }

    // Aggregate Top Domains
    stats.topDomains = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count }));

    return stats;
}
