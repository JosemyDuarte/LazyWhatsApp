import type { ChatMessage } from '@features/chat/types';

export interface ControversyPeak {
    startTime: number;
    endTime: number;
    messageCount: number;
    messages: ChatMessage[];
    summary?: string; // To be filled by LLM
}

export function detectControversyPeaks(messages: ChatMessage[], windowMs: number = 3600000): ControversyPeak[] {
    // windowMs default 1 hour
    const peaks: ControversyPeak[] = [];
    if (messages.length === 0) return peaks;


    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // Find window of messages starting from here
        const windowMessages = [];
        for (let j = i; j < messages.length; j++) {
            if (messages[j].timestamp - msg.timestamp <= windowMs) {
                windowMessages.push(messages[j]);
            } else {
                break;
            }
        }

        // If density > threshold (e.g. 10 messages in 10 mins)
        if (windowMessages.length >= 10) {
            const peak: ControversyPeak = {
                startTime: windowMessages[0].timestamp,
                endTime: windowMessages[windowMessages.length - 1].timestamp,
                messageCount: windowMessages.length,
                messages: windowMessages,
            };

            // Simple deduplication: don't add overlapping peaks if they are smaller
            const lastPeak = peaks[peaks.length - 1];
            if (lastPeak && peak.startTime < lastPeak.endTime) {
                if (peak.messageCount > lastPeak.messageCount) {
                    peaks[peaks.length - 1] = peak;
                }
            } else {
                peaks.push(peak);
            }

            // Skip ahead to end of window to find next distinct peak
            i += Math.floor(windowMessages.length / 2);
        }
    }

    return peaks.sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
}
