import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { transcript, courseId, lessonId } = await req.json();

        if (!transcript || !courseId) {
            throw new Error('Missing transcript or courseId');
        }

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') ?? '');
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Chunking Logic (Simple split by paragraphs or max chars)
        const chunks = chunkText(transcript, 1000); // ~1000 chars per chunk

        console.log(`Processing ${chunks.length} chunks for course ${courseId}...`);

        for (const chunk of chunks) {
            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values;

            const { error } = await supabaseClient
                .from('course_embeddings')
                .insert({
                    course_id: courseId,
                    lesson_id: lessonId || null,
                    content: chunk,
                    embedding: embedding,
                    metadata: { source: 'transcript' }
                });

            if (error) {
                console.error('Error inserting embedding:', error);
                throw error;
            }
        }

        return new Response(
            JSON.stringify({ success: true, chunksProcessed: chunks.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

function chunkText(text: string, chunkSize: number): string[] {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    return chunks;
}
