import type { ChatMessage, AnalysisConfiguration } from '@features/chat/types';

/**
 * Filters chat messages based on the provided date range in the configuration.
 */
export function filterMessagesByDate(messages: ChatMessage[], config: AnalysisConfiguration): ChatMessage[] {
    if (!config.dateRange) return messages;

    const { start, end } = config.dateRange;
    return messages.filter((msg) => msg.timestamp >= start && msg.timestamp <= end);
}
