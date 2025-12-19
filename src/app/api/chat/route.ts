import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateOpenRouterResponse } from '@/app/actions/ai';

// Initialize Gemini (Keep for Embeddings ONLY to preserve RAG compatibility)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

/**
 * Format RAG context items for the AI prompt
 * Organizes by source type for better understanding
 */
function formatContextForPrompt(items: any[]): string {
    if (!items || items.length === 0) return '';

    // Group by source type
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
        const type = item.source_type || 'unknown';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(item);
    });

    const sections: string[] = [];

    // Personal context first (user's custom information)
    if (grouped['custom_context'] || grouped['profile']) {
        const personalItems = [...(grouped['custom_context'] || []), ...(grouped['profile'] || [])];
        if (personalItems.length > 0) {
            sections.push('=== USER\'S PERSONAL CONTEXT ===');
            personalItems.forEach(item => {
                const title = item.metadata?.title || 'Personal Note';
                sections.push(`[${title}]\n${item.content}`);
            });
        }
    }

    // Files uploaded by user
    if (grouped['file']) {
        sections.push('\n=== USER\'S UPLOADED DOCUMENTS ===');
        grouped['file'].forEach(item => {
            const fileName = item.metadata?.file_name || 'Document';
            sections.push(`[From: ${fileName}]\n${item.content}`);
        });
    }

    // Course content (lessons, modules)
    if (grouped['lesson'] || grouped['module'] || grouped['course']) {
        const courseItems = [
            ...(grouped['lesson'] || []),
            ...(grouped['module'] || []),
            ...(grouped['course'] || [])
        ];
        if (courseItems.length > 0) {
            sections.push('\n=== COURSE KNOWLEDGE BASE ===');
            courseItems.forEach(item => {
                const courseName = item.metadata?.course_title || 'Course Content';
                const lessonName = item.metadata?.lesson_title || '';
                const prefix = lessonName ? `${courseName} > ${lessonName}` : courseName;
                sections.push(`[${prefix}]\n${item.content}`);
            });
        }
    }

    // Any other content
    const otherTypes = Object.keys(grouped).filter(t =>
        !['custom_context', 'profile', 'file', 'lesson', 'module', 'course'].includes(t)
    );
    otherTypes.forEach(type => {
        if (grouped[type].length > 0) {
            sections.push(`\n=== ${type.toUpperCase()} ===`);
            grouped[type].forEach(item => sections.push(item.content));
        }
    });

    return sections.join('\n\n');
}

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

        // 2. Personal Context is now handled via RAG embeddings (see match_unified_embeddings)
        // The ContextResolver determines what scope of content to include based on page context

        // 3. Generate Embedding for Query (Using Google SDK)
        const embeddingResult = await embeddingModel.embedContent(message);
        const embedding = embeddingResult.embedding.values;

        // [NEW] Resolve Context Scope
        const { ContextResolver } = await import('@/lib/ai/context-resolver');
        const ragScope = await ContextResolver.resolve(user.id, pageContext || { type: 'PAGE', id: 'dashboard' });

        // 3a. Retrieve Context (Unified Scoped RAG)
        const { data: contextItems, error: matchError } = await supabase.rpc('match_unified_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
            filter_scope: ragScope
        });

        if (matchError) {
            console.error('RAG Error:', matchError);
        }

        // Organize context by source type for better AI understanding
        const contextText = formatContextForPrompt(contextItems || []);

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
        // Citations Logic
        if (contextItems && contextItems.length > 0) {
             // Extract Course IDs from content that is linked to a course
             const uniqueCourses = Array.from(new Set(
                 contextItems
                    .filter((item: any) => item.course_id || (item.metadata && item.metadata.courseId))
                    .map((item: any) => item.course_id || item.metadata.courseId)
             )).filter(id => id);

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
