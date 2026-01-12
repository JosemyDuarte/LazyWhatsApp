import type { ChatMessage, AnalysisConfiguration } from '@features/chat/types';
import type { ILLMAdapter, LLMMessage } from '@core/ai/adapter';
import { BaseAnalysisStrategy } from './base';
import { detectControversyPeaks } from '@features/insights/services/controversy';

export class HybridStrategy extends BaseAnalysisStrategy {
    readonly name = 'hybrid';

    protected async *runAnalysis(
        messages: ChatMessage[],
        adapter: ILLMAdapter,
        config: AnalysisConfiguration
    ): AsyncGenerator<string> {
        // Step 1: Identify Key Peaks
        yield this.yieldProgress(10, 'Detecting conversation peaks...');
        const peaks = detectControversyPeaks(messages);

        // Step 2: Select Context
        // Take top 3 peaks + last 50 messages (to ensure closure/recent context)
        const topPeaks = peaks.slice(0, 3);
        const recentMessages = messages.slice(-50);

        const keyMessagesMap = new Map<string, ChatMessage>();

        // Add peak messages
        topPeaks.forEach(peak => {
            peak.messages.forEach(msg => keyMessagesMap.set(msg.id, msg));
        });

        // Add recent messages
        recentMessages.forEach(msg => keyMessagesMap.set(msg.id, msg));

        const selectedMessages = Array.from(keyMessagesMap.values())
            .sort((a, b) => a.timestamp - b.timestamp);

        const context = this.formatContext(selectedMessages);

        yield this.yieldProgress(40, `Analyzing ${topPeaks.length} key topics and recent context...`);

        // Step 3: LLM Analysis
        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `
You are an expert Conversation Analyst. You are analyzing the most active segments and the conclusion of a WhatsApp chat.
Your goal is to provide a report that allows someone that has no knowledge of the chat to understand the most important aspects of the conversation.

Focus on:
1. **Key Controversies/Spikes**: What caused the most activity?
2. **Highlights**: What's the most important information shared during the chat? 
3. **Action Items**: What actions or conclusions were taken during the chat?

Format:
- 📊 **Activity Drivers**: Why people were messaging so much.
- 📅 **Information Repository**: List any specific dates, addresses, links, or contact info shared during the chat.
- 🤔 **Insights**: Insights you find useful to know for someone without knowledge of the chat.
`
            },
            {
                role: 'user',
                content: `Analyze these key segments (chronologically ordered):\n\n${context}`
            }
        ];

        if (adapter.streamChat) {
            yield* adapter.streamChat(prompt);
        } else {
            const response = await adapter.chat(prompt);
            yield response.content;
        }
    }
}
