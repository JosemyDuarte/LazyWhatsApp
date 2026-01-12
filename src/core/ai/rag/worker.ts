import type { IRagWorkerRequest, IRagWorkerResponse } from './contracts';
import { EmbeddingsEngine } from './embeddings';
import { VectorStore } from './vector-store';

const engine = new EmbeddingsEngine();
const store = new VectorStore();

self.onmessage = async (event: MessageEvent<IRagWorkerRequest>) => {
    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'INIT':
                await engine.init();
                postResponse({ type: 'INIT_DONE', payload: null });
                break;

            case 'INDEX':
                // payload is { messages: [...] }
                const messages = payload.messages;
                // Extract text content for embedding
                const texts = messages.map(m => m.content);

                // Generate embeddings
                const embeddings = await engine.generate(texts);

                // Add to store
                await store.addDocuments(messages, embeddings);

                postResponse({ type: 'INDEX_DONE', payload: { count: messages.length } });
                break;

            case 'QUERY':
                // payload is { text, k }
                const { text, k } = payload;
                const queryEmbedding = await engine.generate([text]); // Returns array of arrays

                const results = await store.search(queryEmbedding[0], k || 3);

                postResponse({ type: 'QUERY_RESULT', payload: results });
                break;

            default:
                console.error('Unknown message type:', type);
        }
    } catch (error: any) {
        console.error('RAG Worker Error:', error);
        postResponse({ type: 'ERROR', payload: error.message });
    }
};

function postResponse(response: IRagWorkerResponse) {
    self.postMessage(response);
}
