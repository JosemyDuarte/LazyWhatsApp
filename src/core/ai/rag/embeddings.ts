import { pipeline, env } from '@xenova/transformers';

// Configuration for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Define Singleton to avoid multiple pipeline initializations
let embeddingPipeline: any = null;

export class EmbeddingsEngine {
    private modelName: string;

    constructor(modelName: string = 'Xenova/all-MiniLM-L6-v2') {
        this.modelName = modelName;
    }

    async init(): Promise<void> {
        if (!embeddingPipeline) {
            console.log('Initializing embedding pipeline...');
            embeddingPipeline = await pipeline('feature-extraction', this.modelName);
            console.log('Embedding pipeline initialized.');
        }
    }

    async generate(texts: string[]): Promise<number[][]> {
        if (!embeddingPipeline) {
            await this.init();
        }

        const embeddings: number[][] = [];

        // Process sequentially to avoid memory spikes in browser
        for (const text of texts) {
            // Normalize text
            const output = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
            // Convert Tensor to array
            embeddings.push(Array.from(output.data));
        }

        return embeddings;
    }
}
