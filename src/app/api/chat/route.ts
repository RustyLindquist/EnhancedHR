import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, courseId, agentType } = await req.json();

        if (!message || !agentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch System Prompt
        const { data: promptData } = await supabase
            .from('ai_system_prompts')
            .select('system_instruction')
            .eq('agent_type', agentType)
            .single();

        const systemInstruction = promptData?.system_instruction || 'You are a helpful assistant.';

        // 2. Generate Embedding for Query
        const embeddingResult = await embeddingModel.embedContent(message);
        const embedding = embeddingResult.embedding.values;

        // 3. Retrieve Context (RAG)
        const { data: contextItems, error: matchError } = await supabase.rpc('match_course_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.5, // Adjust as needed
            match_count: 5,
            filter_course_id: courseId || null
        });

        if (matchError) {
            console.error('RAG Error:', matchError);
            // Continue without context if RAG fails? Or fail?
            // Let's continue with just the prompt.
        }

        const contextText = contextItems?.map((item: any) => item.content).join('\n\n') || '';

        // 4. Construct Prompt
        const fullPrompt = `
        ${systemInstruction}

        CONTEXT FROM KNOWLEDGE BASE:
        ${contextText}

        USER QUERY:
        ${message}
        `;

        // 5. Generate Response
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // 6. Log Attribution
        if (contextItems && contextItems.length > 0) {
            await supabase.from('ai_attribution_logs').insert({
                user_id: user.id,
                course_id: courseId || null,
                query: message,
                response: responseText, // Optional: Truncate if too long
                sources: contextItems.map((item: any) => item.metadata)
            });
        }

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
