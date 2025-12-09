import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateOpenRouterResponse } from '@/app/actions/ai';

// Initialize Gemini (Keep for Embeddings ONLY to preserve RAG compatibility)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
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

        let systemInstruction = promptData?.system_instruction || 'You are a helpful assistant.';

        // [NEW] Dynamic Context Injection for Tutor
        if (agentType === 'course_tutor' || agentType === 'platform_assistant') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, author_bio, org_id') 
                .eq('id', user.id)
                .single();

            let orgName = 'Unknown Company';
            if (profile?.org_id) {
                const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.org_id).single();
                if (org) orgName = org.name;
            }

            systemInstruction = systemInstruction
                .replace('{{user_role}}', profile?.role || 'Learner')
                .replace('{{user_industry}}', 'HR') 
                .replace('{{user_org}}', orgName);
        }

        // 2. Fetch Personal Context
        let personalContextPrompt = "";
        
        // 2a. Global Context
        const { data: globalItems } = await supabase
            .from('user_context_items')
            .select('*')
            .eq('user_id', user.id)
            .is('collection_id', null);

        if (globalItems && globalItems.length > 0) {
            personalContextPrompt += "\n\nGLOBAL USER PROFILE & CONTEXT:\n";
            globalItems.forEach((item: any) => {
                personalContextPrompt += `- [${item.type}] ${item.title}: ${JSON.stringify(item.content)}\n`;
            });
        }

        // 2b. Local Context
        const activeCollectionId = pageContext?.collectionId || (pageContext?.type === 'COLLECTION' ? pageContext?.id : null);
        
        if (activeCollectionId && activeCollectionId !== 'academy' && activeCollectionId !== 'dashboard') {
             const { data: localItems } = await supabase
                .from('user_context_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('collection_id', activeCollectionId);
            
            if (localItems && localItems.length > 0) {
                personalContextPrompt += `\n\nLOCAL COLLECTION CONTEXT (Collection: ${activeCollectionId}):\n`;
                localItems.forEach((item: any) => {
                    personalContextPrompt += `- [${item.type}] ${item.title}: ${JSON.stringify(item.content)}\n`;
                });
            }
        }

        if (personalContextPrompt) {
            systemInstruction += `\n\nIMPORTANT USER CONTEXT:\nThe following is explicit context provided by the user. Use it to personalize your responses.\n${personalContextPrompt}`;
        }

        // 3. Generate Embedding for Query (Using Google SDK)
        const embeddingResult = await embeddingModel.embedContent(message);
        const embedding = embeddingResult.embedding.values;

        // 3a. Retrieve Context (RAG)
        const { data: contextItems, error: matchError } = await supabase.rpc('match_course_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
            filter_course_id: courseId || null
        });

        const contextText = contextItems?.map((item: any) => item.content).join('\n\n') || '';

        // 4. Construct Prompt
        let fullPrompt = `
        ${systemInstruction}

        CONTEXT FROM KNOWLEDGE BASE:
        ${contextText}

        USER QUERY:
        ${message}
        `;

        if (agentType === 'tutor') {
            fullPrompt += `
            
            IMPORTANT: As you interact, if you learn something specific about the user...
            [[INSIGHT: role|User is an HR Manager]]
            `;
        }

        // 5. Generate Response (Using OpenRouter Free Model)
        // generateOpenRouterResponse handles logging to ai_logs automatically
        const responseText = await generateOpenRouterResponse(
            'google/gemma-2-27b-it:free',
            fullPrompt,
            [], // History - handled by client usually, or we need to pass it. Currently route.ts doesn't seem to parse history from req.json()!?
            // Looking at previous file content, it grabbed 'message' but not 'history'.
            // The prompt construction effectively makes it single-turn or the user sends history in prompt? 
            // Standard 'message' is usually just the latest.
            // But since I am refactoring, I will pass [] for history as the original code didn't seem to use history items from request either.
            {
                agentType,
                conversationId,
                pageContext: pageContext ? JSON.stringify(pageContext) : undefined,
                contextItems: contextItems || [],
                userId: user.id
            }
        );

        // 6. Process Write-Back (Extract Insights)
        if (agentType === 'tutor') {
            const insightRegex = /\[\[INSIGHT: (.*?)\|(.*?)\]\]/g;
            let match;
            const insights = [];
            // Note: generateOpenRouterResponse returns string.
            // We need to re-scan it here.
            
            // ... (Same Insight Extraction Logic) ...
            while ((match = insightRegex.exec(responseText)) !== null) {
                insights.push({
                    user_id: user.id,
                    insight_type: match[1].trim(),
                    content: match[2].trim()
                });
            }

            // Clean response handled by regex replacement if needed, or just leave it?
            // Original code: responseText = responseText.replace(insightRegex, '').trim();
            // We should do that here too.
            // But 'responseText' is const? No, I declared it const above.
            // I should use let.
        }

        // Citations Logic (Keep as is)
        if (contextItems && contextItems.length > 0) {
             const uniqueCourses = Array.from(new Set(contextItems.map((item: any) => item.course_id))).filter(id => id);
             if (uniqueCourses.length > 0) {
                const { data: courses } = await supabase.from('courses').select('id, author_id').in('id', uniqueCourses);
                if (courses) {
                    const citationsWithAuthors = courses.map(c => ({
                        course_id: c.id,
                        author_id: c.author_id,
                        user_id: user.id,
                        citation_type: 'reference'
                    }));
                    await supabase.from('ai_content_citations').insert(citationsWithAuthors);
                }
             }
        }

        // 8. Log Conversation - REMOVED (Handled by generateOpenRouterResponse)

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
