import { createClient } from '@/lib/supabase/client';
import { generateOpenRouterResponse } from '@/app/actions/ai';
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

    // Prepare messages for the new generateOpenRouterResponse signature
    // Note: generateOpenRouterResponse takes (model, prompt, history, metadata)
    // It constructs the messages internally from history + prompt.
    // So we don't need to construct 'messages' array here for the call, 
    // but we might need it for other things if we were calling the API directly.
    
    const metadata = {
        agentType,
        conversationId,
        pageContext,
        contextItems,
    };

    const { data: { user } } = await supabase.auth.getUser();
    
    // 3. Construct Full Prompt
    const fullPrompt = `
SYSTEM INSTRUCTION:
${systemInstruction}

CONTEXT:
${contextString}

USER QUESTION:
${userMessage}
    `.trim();

        // 5. Generate Response
        // Use Server Action to avoid exposing API key and CORS issues
    // 4. Generate Response (Server Action)
    // We pass userId for logging fallback on server, but we will also log on client to be safe
    let responseText = "";
    try {
        responseText = await generateOpenRouterResponse(model, userMessage, history, {
            ...metadata,
            userId: user?.id
        });
    } catch (error) {
        console.error("OpenRouter API Error:", error);
        return {
            text: "I apologize, but I'm having trouble connecting to my brain right now. Please try again in a moment.",
            sources: []
        };
    }

    // 5. Log Interaction (Client-Side for reliability)
    // We log here because server-side auth is flaky, but client-side auth is working.
    if (user && responseText) {
        try {
            const { error: logError } = await supabase.from('ai_logs').insert({
                user_id: user.id,
                conversation_id: conversationId,
                agent_type: agentType,
                page_context: pageContext || 'Unknown Context',
                prompt: userMessage,
                response: responseText,
                metadata: {
                    ...metadata,
                    model: model,
                    tokens: responseText.length / 4 // Rough estimate
                }
            });

            if (logError) {
                console.error("Failed to save AI log (client-side):", logError);
            }
        } catch (err) {
            console.error("Error saving AI log:", err);
        }
    }

    // 6. Check for Insights (AI Memory)
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


    return {
        text: responseText,
        sources: contextItems // Return sources for citation
    };
}
