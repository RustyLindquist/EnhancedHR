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

        const { message, courseId, agentType, conversationId, pageContext } = await req.json();

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
        let fullPrompt = `
        ${systemInstruction}

        CONTEXT FROM KNOWLEDGE BASE:
        ${contextText}

        USER QUERY:
        ${message}
        `;

        // Add Write-Back Instruction for Tutor
        if (agentType === 'tutor') {
            fullPrompt += `
            
            IMPORTANT: As you interact, if you learn something specific about the user (e.g., their job role, a specific knowledge gap, a learning goal, or a preference), output it at the very end of your response in this hidden format:
            [[INSIGHT: role|User is an HR Manager]]
            [[INSIGHT: gap|User struggles with conflict resolution]]
            
            Only output this if you are confident. Do not mention this to the user.
            `;
        }

        // 5. Generate Response
        const result = await model.generateContent(fullPrompt);
        let responseText = result.response.text();

        // 6. Process Write-Back (Extract Insights)
        if (agentType === 'tutor') {
            const insightRegex = /\[\[INSIGHT: (.*?)\|(.*?)\]\]/g;
            let match;
            const insights = [];

            while ((match = insightRegex.exec(responseText)) !== null) {
                insights.push({
                    user_id: user.id,
                    insight_type: match[1].trim(),
                    content: match[2].trim()
                });
            }

            // Remove insights from response
            responseText = responseText.replace(insightRegex, '').trim();

            // Save to DB
            if (insights.length > 0) {
                const { error: memoryError } = await supabase
                    .from('user_ai_memory')
                    .insert(insights);
                if (memoryError) console.error('Error saving AI memory:', memoryError);
            }
        }

        // 7. Log Attribution (Payouts)
        if (contextItems && contextItems.length > 0) {
            // Group by course to avoid duplicate citations for same course in one query
            const uniqueCourses = Array.from(new Set(contextItems.map((item: any) => item.course_id))).filter(id => id);

            const citations = uniqueCourses.map(cId => ({
                course_id: cId,
                author_id: user.id, // Placeholder: In real app, we need to fetch author_id from course. 
                // For now, we'll skip author_id or fetch it. 
                // Actually, let's just insert course_id and let a trigger or join handle author.
                // But our schema requires author_id.
                // Let's fetch course authors quickly.
                user_id: user.id,
                citation_type: 'reference'
            }));

            // We need author_ids. Let's fetch them.
            if (uniqueCourses.length > 0) {
                const { data: courses } = await supabase
                    .from('courses')
                    .select('id, author_id')
                    .in('id', uniqueCourses);

                if (courses) {
                    const citationsWithAuthors = courses.map(c => ({
                        course_id: c.id,
                        author_id: c.author_id,
                        user_id: user.id,
                        citation_type: 'reference'
                    }));

                    const { error: citationError } = await supabase
                        .from('ai_content_citations')
                        .insert(citationsWithAuthors);

                    if (citationError) console.error('Error logging citations:', citationError);
                }
            }
        }

        // 8. Log Conversation to ai_logs
        const { error: logError } = await supabase
            .from('ai_logs')
            .insert({
                user_id: user.id,
                conversation_id: conversationId || null,
                agent_type: agentType,
                page_context: pageContext || null,
                prompt: message,
                response: responseText,
                metadata: {
                    sources: contextItems || [],
                    model: 'gemini-1.5-pro'
                }
            });

        if (logError) {
            console.error('Error logging to ai_logs:', logError);
        }

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
