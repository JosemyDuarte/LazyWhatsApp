import type { ILLMAdapter, LLMMessage } from './adapter';
import type { ControversyPeak } from '@features/insights/services/controversy';
import type { ChatMessage, AnalysisConfiguration, InsightReport } from '@features/chat/types';
import { TruncationStrategy } from '@features/analysis/services/strategies/truncation';
import { MultiPassStrategy } from '@features/analysis/services/strategies/multipass';
import { HybridStrategy } from '@features/analysis/services/strategies/hybrid';
import { ragService } from './rag/service';

export class AIOrchestrator {
    constructor(private adapter: ILLMAdapter) { }

    async indexChat(messages: ChatMessage[]): Promise<void> {
        // Transform ChatMessage to format expected by RAG (content, sender, timestamp)
        // RAG expects { content, sender, timestamp } which ChatMessage has.
        // We might want to filter or format.
        const ragMessages = messages.map(m => ({
            content: m.content,
            sender: m.sender || 'System',
            timestamp: new Date(m.timestamp)
        }));
        await ragService.index({ messages: ragMessages });
    }

    async answerQuestion(question: string): Promise<{ answer: string; citations: any[] }> {
        const results = await ragService.query({ text: question, k: 5 });

        const context = results.map(r => `[${r.metadata.sender}]: ${r.content}`).join('\n');

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `You are a helpful assistant analyzing a WhatsApp chat history.
Use the following context to answer the user's question.
If the answer is not in the context, politely say you couldn't find that information in the chat.
Context:
${context}`
            },
            {
                role: 'user',
                content: question
            }
        ];

        const response = await this.adapter.chat(prompt);
        return {
            answer: response.content,
            citations: results.map(r => ({ ...r.metadata, content: r.content, score: r.score }))
        };
    }

    async analyze(messages: ChatMessage[], config: AnalysisConfiguration): Promise<InsightReport> {
        if (config.strategy === 'truncation') {
            const strategy = new TruncationStrategy();
            const summaryContent = await strategy.execute(messages, this.adapter, config);
            return {
                stats: {},
                engagement: {},
                peaks: [],
                strategy: 'truncation',
                summary: {
                    content: summaryContent,
                    isSynthesized: false
                }
            };
        }

        if (config.strategy === 'multi-pass') {
            const strategy = new MultiPassStrategy();
            const summaryContent = await strategy.execute(messages, this.adapter, config);
            return {
                stats: {},
                engagement: {},
                peaks: [],
                strategy: 'multi-pass',
                summary: {
                    content: summaryContent,
                    isSynthesized: true
                }
            };
        }

        if (config.strategy === 'hybrid') {
            const strategy = new HybridStrategy();
            const summaryContent = await strategy.execute(messages, this.adapter, config);
            return {
                stats: {},
                engagement: {},
                peaks: [],
                strategy: 'hybrid',
                summary: {
                    content: summaryContent,
                    isSynthesized: true
                }
            };
        }

        throw new Error(`Strategy ${config.strategy} not yet implemented`);
    }

    async *streamAnalysis(messages: ChatMessage[], config: AnalysisConfiguration): AsyncGenerator<string> {
        if (config.strategy === 'truncation') {
            const strategy = new TruncationStrategy();
            yield* strategy.stream(messages, this.adapter, config);
            return;
        }

        if (config.strategy === 'multi-pass') {
            const strategy = new MultiPassStrategy();
            yield* strategy.stream(messages, this.adapter, config);
            return;
        }

        if (config.strategy === 'hybrid') {
            const strategy = new HybridStrategy();
            yield* strategy.stream(messages, this.adapter, config);
            return;
        }
        throw new Error(`Strategy ${config.strategy} not yet implemented`);
    }

    async summarizeControversy(peak: ControversyPeak): Promise<string> {
        const context = peak.messages
            .slice(0, 50) // Limit context
            .map((m) => `${m.sender || 'System'}: ${m.content}`)
            .join('\n');
        // ... existing code ...

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `
You are an expert Communications Analyst and Secretary. Your goal is to ingest long, messy WhatsApp chat exports and transform them into highly organized, scannable, and actionable summaries.

Operational Rules:
1. DATA CLEANING: Automatically filter out system noise such as "Media omitted," "Messages are end-to-end encrypted," "Missed voice call," and "User added/removed."
2. ATTRIBUTION: When summarizing a point, attribute it to the specific participant (e.g., "John suggested..." or "The group agreed with Sarah...").
3. CONTEXTUAL GROUPING: Do not summarize chronologically. Instead, group messages by "Topic Threads" even if those threads were interrupted by other conversations.
4. TONE: Maintain a professional, neutral, and objective tone.
5. NO HALLUCINATIONS: If a decision was not reached or a topic was left open, explicitly state that it remains "Unresolved."
`
            },
            {
                role: 'user',
                content: `
Please analyze the following WhatsApp chat export. 

### Desired Output Format:
1. **TL;DR:** A one-paragraph "Too Long; Didn't Read" of the entire conversation.
2. **Key Discussion Threads:** Summarize each major topic discussed. For each thread, include:
   - Topic Name
   - Main Participants
   - Key Points / Perspectives
   - Resolution/Outcome
3. **Information Repository:** List any specific dates, addresses, links, or contact info shared during the chat.
4. **Sentiment Analysis:** A brief note on the group's collective mood and any other insights you find useful to know for someone reading this chat.

### Raw Chat Data:
${context}`,
            },
        ];

        try {
            const response = await this.adapter.chat(prompt);
            return response.content;
        } catch (error) {
            console.error('LLM Summary failed:', error);
            return 'Could not generate summary.';
        }
    }

    async *streamSummary(peak: ControversyPeak): AsyncGenerator<string> {
        if (!this.adapter.streamChat) {
            yield await this.summarizeControversy(peak);
            return;
        }

        const context = peak.messages
            .slice(0, 50)
            .map((m) => `${m.sender || 'System'}: ${m.content}`)
            .join('\n');

        const prompt: LLMMessage[] = [
            {
                role: 'system',
                content: `
You are an expert chat analyzer. Summarize the following chat segment. Identify the main topic and provide any insights you find useful to know for someone reading this chat.

Operational Rules:
1. DATA CLEANING: Automatically filter out system noise such as "Media omitted," "Messages are end-to-end encrypted," "Missed voice call," and "User added/removed."
2. ATTRIBUTION: When summarizing a point, attribute it to the specific participant (e.g., "John suggested..." or "The group agreed with Sarah...").
3. CONTEXTUAL GROUPING: Do not summarize chronologically. Instead, group messages by "Topic Threads" even if those threads were interrupted by other conversations.
4. TONE: Maintain a professional, neutral, and objective tone.
5. NO HALLUCINATIONS: If a decision was not reached or a topic was left open, explicitly state that it remains "Unresolved."
                `,
            },
            {
                role: 'user',
                content: `
Please analyze the following WhatsApp chat export. 

### Desired Output Format:
1. **TL;DR:** A one-paragraph "Too Long; Didn't Read" of the entire conversation.
2. **Key Discussion Threads:** Summarize each major topic discussed. For each thread, include:
   - Topic Name
   - Main Participants
   - Key Points / Perspectives
   - Resolution/Outcome
3. **Action Item Tracker:** A checklist of tasks assigned to specific people with any mentioned deadlines.
4. **Information Repository:** List any specific dates, addresses, links, or contact info shared during the chat.
5. **Sentiment Analysis:** A brief note on the group's collective mood.

### Raw Chat Data:
${context}`,
            },
        ];

        yield* this.adapter.streamChat(prompt);
    }
}
