import { ChatParser } from '@core/parser/chat-parser';
import { calculateBasicStats } from '@features/insights/services/stats';
import { calculateEngagement } from '@features/insights/services/engagement';
import { detectControversyPeaks } from '@features/insights/services/controversy';
import { filterMessagesByDate } from '@features/insights/services/filter';
import { calculateVolumeStats } from '@features/insights/services/volume';
import { calculateTimingStats } from '@features/insights/services/temporal';
import { calculateContentStats } from '@features/insights/services/content';
import { calculateNetworkStats } from '@features/insights/services/network';
import type { ChatMessage, AnalysisConfiguration, ChatMetrics } from '@features/chat/types';

const parser = new ChatParser();
let allMessages: ChatMessage[] = [];

function calculateAllMetrics(messages: ChatMessage[]): ChatMetrics {
    return {
        volume: calculateVolumeStats(messages),
        timing: calculateTimingStats(messages),
        content: calculateContentStats(messages),
        network: calculateNetworkStats(messages)
    };
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'PARSE_FILE':
            try {
                if (typeof payload !== 'string') {
                    throw new Error('Payload must be a string');
                }

                self.postMessage({ type: 'PROGRESS', payload: 10 });
                const result = await parser.parse(payload);
                allMessages = result.messages;

                self.postMessage({ type: 'PROGRESS', payload: 40 });
                const stats = calculateBasicStats(allMessages);

                self.postMessage({ type: 'PROGRESS', payload: 60 });
                const engagement = calculateEngagement(allMessages);

                self.postMessage({ type: 'PROGRESS', payload: 75 });
                const peaks = detectControversyPeaks(allMessages);

                self.postMessage({ type: 'PROGRESS', payload: 90 });
                const metrics = calculateAllMetrics(allMessages);

                self.postMessage({
                    type: 'COMPLETE', payload: {
                        ...result,
                        insights: { stats, engagement, peaks, metrics }
                    }
                });
            } catch (error) {
                self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
            }
            break;

        case 'FILTER_RANGE':
            try {
                const config = payload as AnalysisConfiguration;
                const filteredMessages = filterMessagesByDate(allMessages, config);

                const stats = calculateBasicStats(filteredMessages);
                const engagement = calculateEngagement(filteredMessages);
                const peaks = detectControversyPeaks(filteredMessages);
                const metrics = calculateAllMetrics(filteredMessages);

                self.postMessage({
                    type: 'RANGE_UPDATED', payload: {
                        insights: { stats, engagement, peaks, metrics },
                        messageCount: filteredMessages.length,
                        messages: filteredMessages
                    }
                });
            } catch (error) {
                self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
            }
            break;

        case 'GET_FILTERED_MESSAGES':
            const filtered = filterMessagesByDate(allMessages, payload as AnalysisConfiguration);
            self.postMessage({ type: 'MESSAGES_DATA', payload: filtered });
            break;

        default:
            console.warn(`Unknown message type: ${type}`);
    }
};

export { };
