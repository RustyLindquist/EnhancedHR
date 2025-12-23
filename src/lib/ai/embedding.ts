import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Default embedding model (fallback if database entry not found)
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

// Cache for embedding models to avoid repeated database lookups
const modelCache: Record<string, { model: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the embedding model name for a specific purpose from the database
 * Falls back to default if not configured
 */
async function getEmbeddingModelName(purpose: 'context_item' | 'course_transcript' | 'file_content' | 'query'): Promise<string> {
    const keyMap = {
        'context_item': 'embed_context_item',
        'course_transcript': 'embed_course_transcript',
        'file_content': 'embed_file_content',
        'query': 'embed_query'
    };

    const key = keyMap[purpose];

    try {
        // Dynamic import to avoid circular dependencies
        const { getBackendModel } = await import('@/app/actions/ai');
        const model = await getBackendModel(key);
        return model || DEFAULT_EMBEDDING_MODEL;
    } catch (error) {
        console.warn(`[Embedding] Could not fetch model for ${key}, using default:`, error);
        return DEFAULT_EMBEDDING_MODEL;
    }
}

/**
 * Get or create an embedding model instance (with caching)
 */
function getModelInstance(modelName: string) {
    const now = Date.now();
    const cached = modelCache[modelName];

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.model;
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    modelCache[modelName] = { model, timestamp: now };
    return model;
}

/**
 * Generate embedding for text content
 * Used for context items (notes, profiles, custom text)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const modelName = await getEmbeddingModelName('context_item');
        const model = getModelInstance(modelName);
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return [];
    }
}

/**
 * Generate embedding for course transcript content
 */
export async function generateCourseEmbedding(text: string): Promise<number[]> {
    try {
        const modelName = await getEmbeddingModelName('course_transcript');
        const model = getModelInstance(modelName);
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating course embedding:', error);
        return [];
    }
}

/**
 * Generate embedding for file content
 */
export async function generateFileEmbedding(text: string): Promise<number[]> {
    try {
        const modelName = await getEmbeddingModelName('file_content');
        const model = getModelInstance(modelName);
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating file embedding:', error);
        return [];
    }
}

/**
 * Generate embedding for a search query
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
    try {
        const modelName = await getEmbeddingModelName('query');
        const model = getModelInstance(modelName);
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating query embedding:', error);
        return [];
    }
}
