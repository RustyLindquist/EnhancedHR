import { createClient } from '@/lib/supabase/client';
import { getGeminiResponse } from '../gemini';
import { getContextForScope } from './context';
import { AgentType, ContextScope, AgentResponse } from './types';

const supabase = createClient();

export async function getAgentResponse(
    agentType: AgentType,
    userMessage: string,
    scope: ContextScope,
    history: { role: "user" | "model", parts: string }[] = [],
    conversationId?: string,
    pageContext?: string
): Promise<AgentResponse> {
    
    // 1. Fetch System Prompt
    const { data: promptData } = await supabase
        .from('ai_system_prompts')
        .select('system_instruction')
        .eq('agent_type', agentType)
        .single();
    
    const systemInstruction = promptData?.system_instruction || 'You are a helpful AI assistant.';

    // 2. Fetch Context
    const contextItems = await getContextForScope(scope, userMessage);
    const contextString = contextItems.map(item => `[${item.type}] ${item.content}`).join('\n\n');

    // 3. Construct Full Prompt
    // We prepend the system instruction and context to the latest message or as a system message if the API supported it.
    // Gemini API (via our wrapper) takes a prompt and history. We'll prepend context to the current prompt.
    
    const fullPrompt = `
SYSTEM INSTRUCTION:
${systemInstruction}

CONTEXT:
${contextString}

USER QUESTION:
${userMessage}
    `.trim();

    // 4. Call LLM
    const responseText = await getGeminiResponse(fullPrompt, history);

    // 5. Log to ai_logs
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { error: logError } = await supabase
            .from('ai_logs')
            .insert({
                user_id: user.id,
                conversation_id: conversationId || null,
                agent_type: agentType,
                page_context: pageContext || null,
                prompt: userMessage,
                response: responseText,
                metadata: {
                    sources: contextItems || [],
                    model: 'gemini-2.0-flash'
                }
            });
        
        if (logError) {
            console.error('Error logging to ai_logs:', logError);
        }
    }

    return {
        text: responseText,
        sources: contextItems // Return sources for citation
    };
}
