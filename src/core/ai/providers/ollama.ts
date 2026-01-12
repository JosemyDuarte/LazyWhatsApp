import type { ILLMAdapter, LLMMessage, LLMOptions, LLMResponse } from '../adapter';

export class OllamaAdapter implements ILLMAdapter {
    id = 'ollama';
    name = 'Ollama (Local)';
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
                options: {
                    temperature: options?.temperature || 0.7,
                },
            }),
        });

        if (!response.ok) throw new Error('Ollama request failed');
        const data = await response.json();

        return {
            content: data.message.content,
        };
    }

    async *streamChat(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: true,
                options: {
                    temperature: options?.temperature || 0.7,
                },
            }),
        });

        if (!response.ok) throw new Error('Ollama streaming failed');
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) yield json.message.content;
                } catch {
                    // Incomplete fragment
                }
            }
        }
    }
}
