import type { ChatMessage, ParseResult } from '@features/chat/types';
import { WHATSAPP_PATTERNS } from './patterns';

export class ChatParser {
    private messages: ChatMessage[] = [];
    private totalLines = 0;
    private failedLines = 0;
    private dateFormat: 'DD/MM/YY' | 'MM/DD/YY' | 'unknown' = 'unknown';

    async parse(text: string): Promise<ParseResult> {
        const lines = text.split(/\r?\n/);
        this.totalLines = lines.length;
        this.messages = [];
        this.failedLines = 0;
        this.dateFormat = 'unknown';

        // Pre-scan first 100 lines to detect date format
        this.detectDateFormat(lines.slice(0, 100));

        let currentMessage: ChatMessage | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Check if this line starts a new message
            const iOSMatch = line.match(WHATSAPP_PATTERNS.iOS);
            const AndroidMatch = line.match(WHATSAPP_PATTERNS.Android);

            if (iOSMatch) {
                if (currentMessage) this.messages.push(currentMessage);
                currentMessage = this.createMessage(iOSMatch[1], iOSMatch[2], iOSMatch[3], iOSMatch[4]);
            } else if (AndroidMatch) {
                if (currentMessage) this.messages.push(currentMessage);
                currentMessage = this.createMessage(AndroidMatch[1], AndroidMatch[2], AndroidMatch[3], AndroidMatch[4]);
            } else {
                // Not a new message start, check if it's a multi-line continuation
                if (currentMessage) {
                    currentMessage.content += '\n' + line;
                } else {
                    // Check if it's a system message
                    const systemIOSMatch = line.match(WHATSAPP_PATTERNS.systemIOS);
                    const systemAndroidMatch = line.match(WHATSAPP_PATTERNS.systemAndroid);

                    if (systemIOSMatch) {
                        currentMessage = this.createMessage(systemIOSMatch[1], systemIOSMatch[2], null, systemIOSMatch[3]);
                    } else if (systemAndroidMatch) {
                        currentMessage = this.createMessage(systemAndroidMatch[1], systemAndroidMatch[2], null, systemAndroidMatch[3]);
                    } else {
                        this.failedLines++;
                    }
                }
            }
        }

        if (currentMessage) this.messages.push(currentMessage);

        return {
            messages: this.messages,
            stats: {
                totalLines: this.totalLines,
                parsedMessages: this.messages.length,
                failedLines: this.failedLines,
            },
        };
    }

    private detectDateFormat(lines: string[]) {
        for (const line of lines) {
            const iOSMatch = line.match(WHATSAPP_PATTERNS.iOS) || line.match(WHATSAPP_PATTERNS.systemIOS);
            const AndroidMatch = line.match(WHATSAPP_PATTERNS.Android) || line.match(WHATSAPP_PATTERNS.systemAndroid);
            const dateStr = iOSMatch ? iOSMatch[1] : (AndroidMatch ? AndroidMatch[1] : null);

            if (dateStr) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const first = parseInt(parts[0], 10);
                    const second = parseInt(parts[1], 10);

                    if (first > 12) {
                        this.dateFormat = 'DD/MM/YY';
                        return;
                    }
                    if (second > 12) {
                        this.dateFormat = 'MM/DD/YY';
                        return;
                    }
                }
            }
        }
        // If still unknown after scan, default to DD/MM/YY as it's more common globally
        this.dateFormat = 'DD/MM/YY';
    }

    private createMessage(date: string, time: string, sender: string | null, content: string): ChatMessage {
        let timestamp = 0;
        const dateParts = date.split('/');

        if (dateParts.length === 3) {
            let day, month, year;
            if (this.dateFormat === 'MM/DD/YY') {
                month = parseInt(dateParts[0], 10) - 1;
                day = parseInt(dateParts[1], 10);
            } else {
                day = parseInt(dateParts[0], 10);
                month = parseInt(dateParts[1], 10) - 1;
            }

            year = parseInt(dateParts[2], 10);
            if (year < 100) {
                year += year < 70 ? 2000 : 1900; // Basic 2-digit year handling
            }

            // Time parsing
            let hours = 0, minutes = 0, seconds = 0;
            const isPM = time.toUpperCase().includes('PM');
            const isAM = time.toUpperCase().includes('AM');

            const timeClean = time.replace(/\s*[AP]M/i, '').trim();
            const timeParts = timeClean.split(':');

            if (timeParts.length >= 2) {
                hours = parseInt(timeParts[0], 10);
                minutes = parseInt(timeParts[1], 10);
                if (timeParts.length === 3) {
                    seconds = parseInt(timeParts[2], 10);
                }

                if (isPM && hours < 12) hours += 12;
                if (isAM && hours === 12) hours = 0;
            }

            const d = new Date(year, month, day, hours, minutes, seconds);
            if (!isNaN(d.getTime())) {
                timestamp = d.getTime();
            }
        }

        return {
            id: crypto.randomUUID(),
            date,
            time,
            sender,
            content,
            timestamp,
        };
    }
}
