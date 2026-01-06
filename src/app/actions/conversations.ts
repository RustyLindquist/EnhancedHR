'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Conversation, ToolConversation } from '@/types';

export async function fetchConversationsAction(): Promise<(Conversation | ToolConversation)[]> {
    const admin = createAdminClient();
    const supabase = await createClient(); // For getting current user session securely

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Fetch Conversations (Base)
    // We avoid the join here to ensure we get ALL conversations, even if the join was causing issues.
    const { data: conversations, error: convError } = await admin
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (convError) {
        console.error("Failed to fetch conversations from DB", convError);
        return [];
    }

    if (!conversations || conversations.length === 0) {
        return [];
    }

    // 2. Fetch Messages for these conversations
    const conversationIds = conversations.map((c: any) => c.id);
    
    // We perform a second query to get messages. This guarantees we don't lose conversations 
    // just because they might have weird join behavior or no messages (though left join should have worked).
    // This also allows us to be precise about what we fetch.
    const { data: messages, error: msgError } = await admin
        .from('conversation_messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true }); // Get them in order

    if (msgError) {
        console.error("Failed to fetch conversation messages", msgError);
        // We can still return conversations, just without messages
    }

    // 3. Map/Merge
    const messagesByConvId: Record<string, any[]> = {};
    if (messages) {
        messages.forEach((msg: any) => {
            if (!messagesByConvId[msg.conversation_id]) {
                messagesByConvId[msg.conversation_id] = [];
            }
            messagesByConvId[msg.conversation_id].push(msg);
        });
    }

    // 4. Map DB records to UI Conversation or ToolConversation type
    const mappedConversations = conversations.map((c: any) => {
        const sortedMessages = messagesByConvId[c.id] || [];

        // No need to sort again if we ordered by created_at in query,
        // but sorting in memory is cheap for safety.
        sortedMessages.sort((a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const lastMsgContent = sortedMessages.length > 0
            ? sortedMessages[sortedMessages.length - 1].content
            : '';

        const collections = c.metadata?.collection_ids || [];
        const isSaved = (c.metadata?.collection_ids?.length || 0) > 0 || c.is_saved;

        // Check if this is a tool conversation
        if (c.metadata?.is_tool_conversation) {
            return {
                type: 'TOOL_CONVERSATION' as const,
                id: c.id,
                title: c.title,
                created_at: c.created_at,
                updated_at: c.updated_at,
                lastMessage: lastMsgContent,
                messages: sortedMessages,
                tool_id: c.metadata?.tool_id || '',
                tool_slug: c.metadata?.tool_slug || '',
                tool_title: c.metadata?.tool_title || '',
                collections,
                isSaved,
            } as ToolConversation;
        }

        // Regular conversation
        return {
            ...c,
            type: 'CONVERSATION' as const,
            lastMessage: lastMsgContent,
            messages: sortedMessages,
            collections,
            isSaved,
        } as Conversation;
    });

    return mappedConversations;
}
