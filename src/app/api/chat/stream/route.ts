import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContextResolver } from '@/lib/ai/context-resolver';
import { generateQueryEmbedding } from '@/lib/ai/embedding';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'EnhancedHR';

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

// Developer models use direct Gemini API (format: gemini-xxx)
// Production models use OpenRouter (format: provider/model-name)
function isDeveloperModel(model: string): boolean {
    return model.startsWith('gemini-') && !model.includes('/');
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            message, 
            agentType, 
            contextScope, 
            history = [],
            conversationId,
            pageContext 
        } = await req.json();

        if (!message || !agentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch System Prompt and Model
        const { data: promptData } = await supabase
            .from('ai_system_prompts')
            .select('system_instruction, model')
            .eq('agent_type', agentType)
            .single();

        const systemInstruction = promptData?.system_instruction || 'You are a helpful AI assistant.';
        const model = promptData?.model || 'google/gemini-2.0-flash-001';

        // 2. Generate embedding for the user's query (uses model from ai_prompt_library)
        const queryEmbedding = await generateQueryEmbedding(message);

        // 3. Resolve RAG scope based on agent type and page context
        // Include agentType in pageContext for proper scope resolution
        const enhancedPageContext = {
            ...(pageContext || { type: 'PAGE', id: 'dashboard' }),
            agentType
        };
        const ragScope = await ContextResolver.resolve(user.id, enhancedPageContext);

        // 4. Fetch context using unified embeddings RAG
        const { data: contextItems, error: ragError } = await supabase.rpc('match_unified_embeddings', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 8,
            filter_scope: ragScope
        });

        if (ragError) {
            console.error('[Stream API] RAG Error:', ragError);
        }

        // Format context for the prompt with proper organization
        const contextString = formatContextForPrompt(contextItems || []);

        const encoder = new TextEncoder();
        let fullResponse = '';

        // Log helper & Insight Extraction
        const logInteraction = async () => {
            try {
                // 1. Log Interaction
                await supabase.from('ai_logs').insert({
                    user_id: user.id,
                    conversation_id: conversationId || null,
                    agent_type: agentType,
                    page_context: pageContext || 'streaming_chat',
                    prompt: message,
                    response: fullResponse,
                    metadata: {
                        model,
                        streaming: true,
                        isDeveloper: isDeveloperModel(model),
                        sources: (contextItems || []).map((c: any) => ({ type: c.source_type, id: c.source_id }))
                    }
                });

                // 2. Extract & Save Insights
                // Format 1: [[INSIGHT: type|content]]
                const bracketRegex = /\[\[INSIGHT:\s*(.*?)\|(.*?)\]\]/g;
                // Format 2: <INSIGHT>content</INSIGHT>
                const tagRegex = /<INSIGHT>([\s\S]*?)<\/INSIGHT>/g;

                const insights = [];
                let match;

                // Process Bracket Format
                while ((match = bracketRegex.exec(fullResponse)) !== null) {
                    insights.push({
                        user_id: user.id,
                        collection_id: null, // Global context by default for Tutor
                        type: 'insight', 
                        title: `Insight: ${match[1].trim()}`,
                        content: match[2].trim(),
                        created_at: new Date().toISOString()
                    });
                }

                // Process Tag Format
                while ((match = tagRegex.exec(fullResponse)) !== null) {
                    insights.push({
                        user_id: user.id,
                        collection_id: null,
                        type: 'insight',
                        title: 'New Insight',
                        content: match[1].trim(),
                        created_at: new Date().toISOString()
                    });
                }

                if (insights.length > 0) {
                    console.log(`[Stream API] Saving ${insights.length} extracted insights.`);
                    const { error } = await supabase.from('user_context_items').insert(insights);
                    if (error) console.error('Failed to save insights:', error);
                }

            } catch (logErr) {
                console.error('Failed to log AI interaction or save insights:', logErr);
            }
        };

        // ========== GEMINI DEVELOPER MODELS ==========
        console.log('[Stream API] Request received:', { 
            agentType, 
            model, 
            isDeveloper: isDeveloperModel(model),
            historyLength: history.length,
            messagePreview: message.substring(0, 100)
        });
        
        if (isDeveloperModel(model)) {
            console.log('[Stream API] Using Gemini API for developer model:', model);
            console.log('[Stream API] GEMINI_API_KEY set:', !!GEMINI_API_KEY, 'length:', GEMINI_API_KEY.length);
            if (!GEMINI_API_KEY) {
                return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
            }

            // Build Gemini request
            const geminiHistory = history.map((h: { role: string; parts: string }) => ({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.parts }]
            }));

            const geminiRequest = {
                contents: [
                    ...geminiHistory,
                    { role: 'user', parts: [{ text: message }] }
                ],
                systemInstruction: {
                    parts: [{ text: `${systemInstruction}\n\nCONTEXT:\n${contextString}` }]
                },
                generationConfig: {
                    maxOutputTokens: 8192
                }
            };

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
            
            console.log('[Stream API] Gemini request:', {
                url: geminiUrl.replace(GEMINI_API_KEY, '[REDACTED]'),
                contentsLength: geminiRequest.contents.length,
                firstContent: JSON.stringify(geminiRequest.contents[0]).substring(0, 200),
                systemInstructionLength: geminiRequest.systemInstruction.parts[0].text.length
            });
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiRequest)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini streaming error:', {
                    status: response.status,
                    statusText: response.statusText,
                    model: model,
                    url: geminiUrl.replace(GEMINI_API_KEY, '[REDACTED]'),
                    error: errorText
                });
                return NextResponse.json({ 
                    error: `Gemini API Error: ${response.status} - ${errorText.substring(0, 200)}` 
                }, { status: 500 });
            }

            const decoder = new TextDecoder();
            const transformStream = new TransformStream({
                async transform(chunk, controller) {
                    const text = decoder.decode(chunk);
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (!data) continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (content) {
                                    fullResponse += content;
                                    controller.enqueue(encoder.encode(content));
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                },
                async flush() {
                    await logInteraction();
                }
            });

            const stream = response.body?.pipeThrough(transformStream);
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        }

        // ========== OPENROUTER PRODUCTION MODELS ==========
        console.log('[Stream API] Using OpenRouter for production model:', model);
        console.log('[Stream API] OPENROUTER_API_KEY set:', !!OPENROUTER_API_KEY, 'length:', OPENROUTER_API_KEY.length);
        
        const systemMessage = {
            role: 'system',
            content: `${systemInstruction}\n\nCONTEXT:\n${contextString}`
        };

        const formattedHistory = history.map((h: { role: string; parts: string }) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts
        }));

        const messages = [
            systemMessage,
            ...formattedHistory,
            { role: 'user', content: message }
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter streaming error:', {
                status: response.status,
                statusText: response.statusText,
                model,
                error: errorText
            });
            
            // Parse error for better user feedback
            let errorMessage = `OpenRouter API Error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error?.message) {
                    errorMessage = errorJson.error.message;
                }
                // If 429 rate limit on a free model, suggest adding :free suffix
                if (response.status === 429 && !model.includes(':free')) {
                    errorMessage += ` (Tip: For free models, try adding ':free' to the model name, e.g., '${model}:free')`;
                }
            } catch {
                // Keep default error message
            }
            
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const decoder = new TextDecoder();
        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullResponse += content;
                                controller.enqueue(encoder.encode(content));
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            },
            async flush() {
                await logInteraction();
            }
        });

        const stream = response.body?.pipeThrough(transformStream);
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        console.error('Streaming chat error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            stack: error.stack?.substring(0, 500),
            name: error.name
        }, { status: 500 });
    }
}
