import { createClient } from '@/lib/supabase/client';
import { getOpenRouterResponse } from '../openrouter';
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
    
    // 1. Fetch System Prompt and Model
    const { data: promptData } = await supabase
        .from('ai_system_prompts')
        .select('system_instruction, model')
        .eq('agent_type', agentType)
        .single();
    
    const systemInstruction = promptData?.system_instruction || 'You are a helpful AI assistant.';
    const model = promptData?.model || 'google/gemini-2.0-flash-001'; // Default fallback

    // 2. Fetch Context
    const contextItems = await getContextForScope(scope, userMessage);
    const contextString = contextItems.map(item => `[${item.type}] ${item.content}`).join('\n\n');

    // 3. Construct Full Prompt
    const fullPrompt = `
SYSTEM INSTRUCTION:
${systemInstruction}

CONTEXT:
${contextString}

USER QUESTION:
${userMessage}
    `.trim();

    // 4. Call LLM (OpenRouter)
    let responseText = await getOpenRouterResponse(model, fullPrompt, history);

    // 5. Check for Insights (AI Memory)
    const insightMatch = responseText.match(/<INSIGHT>([\s\S]*?)<\/INSIGHT>/);
    if (insightMatch && insightMatch[1]) {
        const newInsight = insightMatch[1].trim();
        
        // Remove the tag from the response shown to user
        responseText = responseText.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/, '').trim();

        // Save to profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Fetch existing insights first
            const { data: profile } = await supabase
                .from('profiles')
                .select('ai_insights')
                .eq('id', user.id)
                .single();
            
            const currentInsights = (profile?.ai_insights as string[]) || [];
            
            // Avoid duplicates
            if (!currentInsights.includes(newInsight)) {
                const updatedInsights = [...currentInsights, newInsight];
                
                await supabase
                    .from('profiles')
                    .update({ ai_insights: updatedInsights })
                    .eq('id', user.id);
            }
        }
    }

    // 6. Log to ai_logs
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
                    model: model,
                    insight_extracted: insightMatch ? insightMatch[1].trim() : null
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
