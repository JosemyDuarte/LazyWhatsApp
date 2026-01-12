import type { ChatMessage, AnalysisConfiguration } from '@features/chat/types';
import type { ILLMAdapter } from '@core/ai/adapter';

export interface IAnalysisStrategy {
    readonly name: string;
    execute(messages: ChatMessage[], adapter: ILLMAdapter, config: AnalysisConfiguration): Promise<string>;
    stream?(messages: ChatMessage[], adapter: ILLMAdapter, config: AnalysisConfiguration): AsyncGenerator<string>;
}

export abstract class BaseAnalysisStrategy implements IAnalysisStrategy {
    abstract readonly name: string;

    /**
     * Core analysis logic to be implemented by strategies.
     * Should yield partial results (chunks) or progress markers.
     */
    protected abstract runAnalysis(
        messages: ChatMessage[],
        adapter: ILLMAdapter,
        config: AnalysisConfiguration
    ): AsyncGenerator<string>;

    /**
     * Standard implementation of execute that consumes the stream.
     * Filters out progress markers and returns the final text.
     */
    async execute(messages: ChatMessage[], adapter: ILLMAdapter, config: AnalysisConfiguration): Promise<string> {
        const stream = this.runAnalysis(messages, adapter, config);
        let result = '';

        for await (const chunk of stream) {
            // Filter out progress markers from the final result
            if (!chunk.startsWith('[PROGRESS]')) {
                result += chunk;
            }
        }

        return result;
    }

    /**
     * Standard implementation of stream that delegates to runAnalysis.
     * Passes through all chunks including progress markers.
     */
    async *stream(messages: ChatMessage[], adapter: ILLMAdapter, config: AnalysisConfiguration): AsyncGenerator<string> {
        yield* this.runAnalysis(messages, adapter, config);
    }

    /**
     * Helper to format messages into a standard context string.
     * Format: "Sender: Content"
     */
    protected formatContext(messages: ChatMessage[]): string {
        return messages
            .map((m) => `${m.sender || 'System'}: ${m.content}`)
            .join('\n');
    }

    /**
     * Helper to create a standard progress marker.
     * Format: "[PROGRESS]:<percentage>:<message>"
     */
    protected yieldProgress(percentage: number, message: string): string {
        return `[PROGRESS]:${percentage}:${message}`;
    }
}
