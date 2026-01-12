import type { ILLMAdapter, LLMMessage, LLMOptions, LLMResponse } from '../adapter';

export class CloudflareAdapter implements ILLMAdapter {
    id = 'cloudflare';
    name = 'Cloudflare Workers AI';
    private accountId: string;
    private apiToken: string;

    constructor(accountId: string, apiToken: string) {
        this.accountId = accountId;
        this.apiToken = apiToken;
    }

    async isAvailable(): Promise<boolean> {
        return !!(this.accountId && this.apiToken);
    }

    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    stream: false,
                }),
            }
        );

        if (!response.ok) throw new Error('Cloudflare AI request failed');
        const data = await response.json();

        return {
            content: data.result.response,
        };
    }
}
