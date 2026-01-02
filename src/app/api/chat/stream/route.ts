import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContextResolver } from '@/lib/ai/context-resolver';
import { generateQueryEmbedding } from '@/lib/ai/embedding';
import { extractInsights, stripInsightTags } from '@/lib/ai/insight-analyzer';
import { processInsight, getInsightSettings } from '@/app/actions/insights';
import { generateFollowUpSuggestions } from '@/lib/ai/quick-ai';
import { getCachedPricing, calculateCost } from '@/app/actions/cost-analytics';
import type { ExtractedInsight, PendingInsight, InsightFollowUp } from '@/types/insights';

/**
 * Token usage tracking for cost analytics
 */
interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

/**
 * Special delimiter for insight metadata at end of stream.
 * Client should parse this out to extract insight data.
 */
export const INSIGHT_META_START = '\n\n<!--__INSIGHT_META__:';
export const INSIGHT_META_END = ':__END_META__-->';

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

    // Course resources (PDFs, documents, links attached to courses)
    if (grouped['resource']) {
        sections.push('\n=== COURSE RESOURCES ===');
        grouped['resource'].forEach(item => {
            const resourceTitle = item.metadata?.resource_title || 'Resource';
            const resourceType = item.metadata?.resource_type || '';
            const prefix = resourceType ? `${resourceTitle} (${resourceType})` : resourceTitle;
            sections.push(`[${prefix}]\n${item.content}`);
        });
    }

    // Any other content
    const otherTypes = Object.keys(grouped).filter(t =>
        !['custom_context', 'profile', 'file', 'lesson', 'module', 'course', 'resource'].includes(t)
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
            .select('system_instruction, insight_instructions, model')
            .eq('agent_type', agentType)
            .single();

        // Concatenate base prompt with insight instructions if present
        const baseInstruction = promptData?.system_instruction || 'You are a helpful AI assistant.';
        const insightInstructions = promptData?.insight_instructions || '';
        const systemInstruction = insightInstructions
            ? `${baseInstruction}\n\n${insightInstructions}`
            : baseInstruction;
        const model = promptData?.model || 'google/gemini-2.0-flash-001';

        // Fetch user's org_id for multi-tenant analytics
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();
        const userOrgId = userProfile?.org_id || null;

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

        // Track pending insights for response
        let pendingInsightsForResponse: PendingInsight[] = [];
        let autoSavedCount = 0;
        let followUpSuggestions: InsightFollowUp[] = [];

        // Token usage tracking for cost analytics
        let tokenUsage: TokenUsage = {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        };

        // Log helper & Enhanced Insight Extraction
        // Returns metadata string to append to stream
        const logInteractionAndGetMetadata = async (): Promise<string> => {
            try {
                // 1. Calculate cost using cached pricing
                let costUsd = 0;
                try {
                    const pricing = await getCachedPricing(model);
                    costUsd = await calculateCost(
                        tokenUsage.prompt_tokens,
                        tokenUsage.completion_tokens,
                        pricing
                    );
                } catch (pricingError) {
                    console.warn('[Stream API] Could not calculate cost:', pricingError);
                }

                // 2. Log Interaction with token counts and cost
                await supabase.from('ai_logs').insert({
                    user_id: user.id,
                    conversation_id: conversationId || null,
                    agent_type: agentType,
                    page_context: pageContext || 'streaming_chat',
                    prompt: message,
                    response: fullResponse,
                    prompt_tokens: tokenUsage.prompt_tokens || null,
                    completion_tokens: tokenUsage.completion_tokens || null,
                    total_tokens: tokenUsage.total_tokens || null,
                    model_id: model,
                    cost_usd: costUsd || null,
                    org_id: userOrgId,
                    metadata: {
                        model,
                        streaming: true,
                        isDeveloper: isDeveloperModel(model),
                        sources: (contextItems || []).map((c: any) => ({ type: c.source_type, id: c.source_id }))
                    }
                });

                // 2. Get user's insight settings
                const settings = await getInsightSettings();
                const autoSave = settings.autoInsights;

                // 3. Extract Insights using enhanced analyzer
                const extractedInsights = extractInsights(fullResponse, agentType, conversationId);

                if (extractedInsights.length > 0) {
                    console.log(`[Stream API] Extracted ${extractedInsights.length} insights`);

                    // Process each insight
                    for (const insight of extractedInsights) {
                        const result = await processInsight(insight, autoSave);

                        if (result.action === 'pending') {
                            // User needs to approve - add to pending list
                            pendingInsightsForResponse.push({
                                id: crypto.randomUUID(),
                                insight,
                                status: 'pending',
                                createdAt: new Date().toISOString(),
                            });
                        } else if (result.action === 'saved' && autoSave) {
                            // Auto-saved - count for notification
                            autoSavedCount++;
                            pendingInsightsForResponse.push({
                                id: result.insightId || crypto.randomUUID(),
                                insight,
                                status: 'saved',
                                createdAt: new Date().toISOString(),
                            });
                        }
                        // 'skipped' and 'merged' don't need UI notification
                    }
                }

                // 4. Generate follow-up suggestions if we have insights in context
                // Get insight summary from context items
                const insightItems = (contextItems || []).filter(
                    (item: any) => item.metadata?.item_type === 'AI_INSIGHT'
                );
                if (insightItems.length > 0) {
                    const insightSummary = insightItems
                        .map((item: any) => {
                            const category = item.metadata?.category || 'context';
                            return `[${category}] ${item.content}`;
                        })
                        .join('\n');

                    const suggestions = await generateFollowUpSuggestions(
                        message,
                        stripInsightTags(fullResponse).substring(0, 500),
                        insightSummary
                    );

                    followUpSuggestions = suggestions.map((prompt, idx) => ({
                        prompt,
                        category: insightItems[idx % insightItems.length]?.metadata?.category,
                    }));
                }

                // 5. Build metadata object
                const metadata = {
                    pendingInsights: pendingInsightsForResponse,
                    autoSavedCount,
                    isAutoMode: autoSave,
                    followUpSuggestions,
                };

                // Only return metadata if there's something to show
                if (pendingInsightsForResponse.length > 0 || followUpSuggestions.length > 0) {
                    return `${INSIGHT_META_START}${JSON.stringify(metadata)}${INSIGHT_META_END}`;
                }

                return '';

            } catch (logErr) {
                console.error('Failed to log AI interaction or process insights:', logErr);
                return '';
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

                                // Capture token usage from Gemini response
                                // Gemini uses usageMetadata field
                                if (parsed.usageMetadata) {
                                    tokenUsage = {
                                        prompt_tokens: parsed.usageMetadata.promptTokenCount || 0,
                                        completion_tokens: parsed.usageMetadata.candidatesTokenCount || 0,
                                        total_tokens: parsed.usageMetadata.totalTokenCount || 0
                                    };
                                }

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
                async flush(controller) {
                    // Log token usage for debugging
                    if (tokenUsage.total_tokens > 0) {
                        console.log('[Stream API] Token usage captured (Gemini):', tokenUsage);
                    }

                    // Process insights and get metadata to append
                    const metadata = await logInteractionAndGetMetadata();
                    if (metadata) {
                        controller.enqueue(encoder.encode(metadata));
                    }
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

                            // Capture token usage from OpenRouter response
                            // Usage data comes in the response chunks
                            if (parsed.usage) {
                                tokenUsage = {
                                    prompt_tokens: parsed.usage.prompt_tokens || 0,
                                    completion_tokens: parsed.usage.completion_tokens || 0,
                                    total_tokens: parsed.usage.total_tokens || 0
                                };
                            }

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
            async flush(controller) {
                // Log token usage for debugging
                if (tokenUsage.total_tokens > 0) {
                    console.log('[Stream API] Token usage captured:', tokenUsage);
                }

                // Process insights and get metadata to append
                const metadata = await logInteractionAndGetMetadata();
                if (metadata) {
                    controller.enqueue(encoder.encode(metadata));
                }
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
