import { describe, it, expect } from 'vitest';
import { ChatParser } from '../../src/services/parser/chat-parser';

describe('ChatParser', () => {
    const parser = new ChatParser();

    it('should parse iOS formatted messages', async () => {
        const chat = `[10/01/24, 13:00:00] Alice: Hello!
[10/01/24, 13:00:05] Bob: Hi there, how are you?
This is a multi-line message.`;

        const result = await parser.parse(chat);
        expect(result.messages.length).toBe(2);
        expect(result.messages[0].sender).toBe('Alice');
        expect(result.messages[1].content).toContain('multi-line message');
    });

    it('should parse Android formatted messages', async () => {
        const chat = `10/01/24, 13:00 - Alice: Hello!
10/01/24, 13:05 - Bob: Hi!`;

        const result = await parser.parse(chat);
        expect(result.messages.length).toBe(2);
        expect(result.messages[0].sender).toBe('Alice');
        expect(result.messages[1].time).toBe('13:05');
    });

    it('should handle system messages', async () => {
        const chat = `[10/01/24, 13:00:00] Messages to this group are now secured with end-to-end encryption.
[10/01/24, 13:00:05] Alice: Hello!`;

        const result = await parser.parse(chat);
        expect(result.messages.length).toBe(2);
        expect(result.messages[0].sender).toBe(null);
        expect(result.messages[1].sender).toBe('Alice');
    });
});
