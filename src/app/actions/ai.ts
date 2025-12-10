'use server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'EnhancedHR';

export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

// Helper to fetch and interpolate prompts from Prompt Library
export async function getBackendPrompt(key: string, variables: Record<string, string>): Promise<{ text: string, model: string | null }> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
        .from('ai_prompt_library')
        .select('prompt_text, model')
        .eq('key', key)
        .single();

    if (!data) {
        console.warn(`[getBackendPrompt] Prompt key '${key}' not found. Using empty string.`);
        return { text: '', model: null };
    }

    let interpolated = data.prompt_text;
    for (const [varName, value] of Object.entries(variables)) {
        // Replace {varName} or { varName } globally
        interpolated = interpolated.replace(new RegExp(`\\{\\s*${varName}\\s*\\}`, 'g'), value);
    }

    return { text: interpolated, model: data.model };
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
    if (!OPENROUTER_API_KEY) {
        console.warn("Missing OPENROUTER_API_KEY environment variable.");
        return [];
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        return [];
    }
}

export async function generateOpenRouterResponse(
    model: string,
    prompt: string,
    history: { role: "user" | "model", parts: string }[] = [],
    metadata?: {
        agentType?: string;
        conversationId?: string;
        pageContext?: string;
        contextItems?: any[];
        userId?: string;
    }
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("Missing OPENROUTER_API_KEY environment variable.");
    }

    try {
        const messages = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts
        }));

        // Add the current prompt as the last user message
        messages.push({ role: 'user', content: prompt });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": messages,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.choices[0].message.content || "";

        // Log to ai_logs (Server-side)
        if (metadata?.agentType) {
            console.log('[AI Action] Attempting to log to ai_logs. Metadata:', metadata);
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('[AI Action] Auth error:', authError);
            }

            let userIdToLog = user?.id;
            let dbClient = supabase;

            // Fallback: If no user on server but userId passed from client, use Admin Client
            if (!userIdToLog && metadata.userId) {
                console.warn('[AI Action] No user session found, using passed userId with Admin Client.');
                const { createAdminClient } = await import('@/lib/supabase/admin');
                dbClient = createAdminClient();
                userIdToLog = metadata.userId;
            }

            if (userIdToLog) {
                console.log('[AI Action] Logging for user:', userIdToLog);
                const { error: insertError } = await dbClient.from('ai_logs').insert({
                    user_id: userIdToLog,
                    conversation_id: metadata.conversationId || null,
                    agent_type: metadata.agentType,
                    page_context: metadata.pageContext || null,
                    prompt: prompt,
                    response: responseText,
                    metadata: {
                        sources: metadata.contextItems || [],
                        model: model
                    }
                });
                
                if (insertError) {
                    console.error('[AI Action] Insert error:', insertError);
                } else {
                    console.log('[AI Action] Successfully logged to ai_logs');
                }
            } else {
                console.warn('[AI Action] No user found (session or passed), skipping log.');
            }
        } else {
            console.warn('[AI Action] No agentType provided in metadata, skipping log.');
        }

        return responseText;
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        throw error;
    }
}
