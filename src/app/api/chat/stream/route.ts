import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getContextForScope } from '@/lib/ai/context';
import { ContextScope, AgentType } from '@/lib/ai/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'EnhancedHR';

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

        // 2. Fetch Context
        const scope: ContextScope = contextScope || { type: 'PLATFORM' };
        const contextItems = await getContextForScope(scope, message);
        const contextString = contextItems.map(item => `[${item.type}] ${item.content}`).join('\n\n');

        // 3. Build messages array with system instruction and context
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

        // 4. Make streaming request to OpenRouter
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
            console.error('OpenRouter streaming error:', errorText);
            return NextResponse.json({ error: `OpenRouter API Error: ${response.status}` }, { status: 500 });
        }

        // 5. Create a TransformStream to process SSE and forward clean text
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let fullResponse = '';

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            // Stream complete - log the interaction
                            try {
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
                                        sources: contextItems.map(c => ({ type: c.type, id: c.id }))
                                    }
                                });
                            } catch (logErr) {
                                console.error('Failed to log AI interaction:', logErr);
                            }
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
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
        });

        // Pipe the response through our transform
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
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
