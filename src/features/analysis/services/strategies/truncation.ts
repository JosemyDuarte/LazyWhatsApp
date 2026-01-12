import type { ChatMessage, AnalysisConfiguration } from '@features/chat/types';
import type { ILLMAdapter, LLMMessage } from '@core/ai/adapter';
import { BaseAnalysisStrategy } from './base';

export class TruncationStrategy extends BaseAnalysisStrategy {
    readonly name = 'truncation';

    protected async *runAnalysis(
        messages: ChatMessage[],
        adapter: ILLMAdapter,
        config: AnalysisConfiguration
    ): AsyncGenerator<string> {
        const count = config.recentCount || 100;

        yield this.yieldProgress(0, 'Preprocessing messages...');

        const recentMessages = messages.slice(-count);
        const context = this.formatContext(recentMessages);

        yield this.yieldProgress(50, 'Analyzing recent conversation...');

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: 'You are summarizing the most recent segment of a chat. Provide a concise TL;DR and key points.'
            },
            {
                role: 'user',
                content: `Analyze these recent messages:\n\n${context}`
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
