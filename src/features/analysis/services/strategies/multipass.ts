import type { ChatMessage, AnalysisConfiguration } from '@features/chat/types';
import type { ILLMAdapter, LLMMessage } from '@core/ai/adapter';
import { BaseAnalysisStrategy } from './base';

export class MultiPassStrategy extends BaseAnalysisStrategy {
    readonly name = 'multi-pass';

    protected async *runAnalysis(
        messages: ChatMessage[],
        adapter: ILLMAdapter,
        config: AnalysisConfiguration
    ): AsyncGenerator<string> {
        const chunkSize = config.chunkSize || 50;
        const chunks = this.chunkMessages(messages, chunkSize);

        const chunkSummaries: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
            const percent = Math.round(((i + 1) / (chunks.length + 1)) * 100);
            yield this.yieldProgress(percent, `Summarizing segment ${i + 1}/${chunks.length}...`);

            const summary = await this.summarizeChunk(chunks[i], adapter);
            chunkSummaries.push(summary);
        }

        yield this.yieldProgress(95, 'Synthesizing final report...');

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `You are a Senior Conversation Analyst. You are receiving a chronological sequence of extracted data logs from a group chat.
Your goal is to reconstruct the full narrative and generate a "WhatsAI Insight Report".

Rules for Synthesis:
1. Merge Related Threads: Connect [TOPIC] entries from different segments that refer to the same subject.
2. Track Progression: If an issue is raised in segment 1 and resolved in segment 5, present the full timeline.
3. Consolidate Lists: Group all [INFO] items into dedicated sections.
4. Final Output Format:
   - 🎯 **Executive Summary**: High-level overview.
   - 🧵 **Key Discussions**: Detailed breakdown of major threads.
   - 📅 **Resources**: Dates, links, and locations found.
   - **Sentiment Analysis**: A brief note on the group's collective mood and any other insights you find useful to know for someone reading this chat.`
            },
            {
                role: 'user',
                content: `Here are the sequential data logs. Synthesize the final report:\n\n${chunkSummaries.join('\n\n=== NEXT SEGMENT LOG ===\n\n')}`
            }
        ];

        if (adapter.streamChat) {
            yield* adapter.streamChat(prompt);
        } else {
            const response = await adapter.chat(prompt);
            yield response.content;
        }
    }

    private chunkMessages(messages: ChatMessage[], size: number): ChatMessage[][] {
        const chunks = [];
        for (let i = 0; i < messages.length; i += size) {
            chunks.push(messages.slice(i, i + size));
        }
        return chunks;
    }

    private async summarizeChunk(chunk: ChatMessage[], adapter: ILLMAdapter): Promise<string> {
        const context = this.formatContext(chunk);

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `You are a Context Extraction Engine processing a fragment of a long group chat.
Your goal is NOT to write a fluent summary, but to EXTRACT specific entities and events for downstream synthesis.
Ignore system messages (e.g., "messages are encrypted", "user joined").

Output a structured log using these tags:
- [TOPIC]: Subject of discussion (Status: Open/Resolved)
- [DECISION]: Agreement reached
- [INFO]: Concrete data (Dates, Addresses, Links, Passwords)
- [SENTIMENT]: Brief mood of this segment

If nothing significant happens, output "NO_SIGNIFICANT_DATA".`
            },
            {
                role: 'user',
                content: `Extract data from this segment:\n\n${context}`
            }
        ];
        const response = await adapter.chat(prompt);
        return response.content;
    }
}
