import type { ChatMessage } from '@features/chat/types';

export interface FilterOptions {
    includeSystemMessages: boolean;
    filterKeywords: string[];
}

export function filterMessages(messages: ChatMessage[], options: FilterOptions): ChatMessage[] {
    return messages.filter((msg) => {
        // Check system messages
        if (!options.includeSystemMessages && msg.sender === null) {
            return false;
        }

        // Check keywords (case-insensitive)
        if (options.filterKeywords.length > 0) {
            const content = msg.content.toLowerCase();
            const hasKeyword = options.filterKeywords.some((keyword) =>
                content.includes(keyword.toLowerCase())
            );
            if (hasKeyword) return false;
        }

        return true;
    });
}
