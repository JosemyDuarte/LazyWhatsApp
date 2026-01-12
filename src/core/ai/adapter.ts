export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface ILLMAdapter {
    id: string;
    name: string;

    chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
    streamChat?(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string>;

    isAvailable(): Promise<boolean>;
}

export type LLMProvider = 'ollama' | 'cloudflare' | 'gemini' | 'claude';
