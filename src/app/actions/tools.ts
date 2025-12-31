'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Tool, ToolConversation } from '@/types';

/**
 * Fetch all active tools for display in the Tools collection
 */
export async function fetchToolsAction(): Promise<Tool[]> {
    const admin = createAdminClient();

    const { data: tools, error } = await admin
        .from('tools')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Failed to fetch tools:', error);
        return [];
    }

    return (tools || []).map((tool: any) => ({
        type: 'TOOL' as const,
        id: tool.id,
        slug: tool.slug,
        title: tool.title,
        description: tool.description,
        agent_type: tool.agent_type,
        icon_name: tool.icon_name,
        is_active: tool.is_active,
        display_order: tool.display_order,
        created_at: tool.created_at,
    }));
}

/**
 * Fetch a single tool by slug
 */
export async function fetchToolBySlugAction(slug: string): Promise<Tool | null> {
    const admin = createAdminClient();

    const { data: tool, error } = await admin
        .from('tools')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !tool) {
        console.error('Failed to fetch tool by slug:', error);
        return null;
    }

    return {
        type: 'TOOL' as const,
        id: tool.id,
        slug: tool.slug,
        title: tool.title,
        description: tool.description,
        agent_type: tool.agent_type,
        icon_name: tool.icon_name,
        is_active: tool.is_active,
        display_order: tool.display_order,
        created_at: tool.created_at,
    };
}

/**
 * Create a new conversation for a tool
 * Returns the conversation ID if successful
 */
export async function createToolConversationAction(
    toolId: string,
    toolSlug: string,
    toolTitle: string,
    agentType: string,
    title?: string
): Promise<string | null> {
    const admin = createAdminClient();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const conversationTitle = title || `${toolTitle} - ${new Date().toLocaleDateString()}`;

    const { data: conversation, error } = await admin
        .from('conversations')
        .insert({
            user_id: user.id,
            title: conversationTitle,
            metadata: {
                tool_id: toolId,
                tool_slug: toolSlug,
                tool_title: toolTitle,
                agent_type: agentType,
                is_tool_conversation: true,
                contextScope: { type: 'TOOL', id: toolSlug }
            }
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create tool conversation:', error);
        return null;
    }

    return conversation?.id || null;
}

/**
 * Fetch all tool conversations for the current user
 */
export async function fetchToolConversationsAction(): Promise<ToolConversation[]> {
    const admin = createAdminClient();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch conversations that have is_tool_conversation: true in metadata
    const { data: conversations, error } = await admin
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .not('metadata->is_tool_conversation', 'is', null)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch tool conversations:', error);
        return [];
    }

    if (!conversations || conversations.length === 0) {
        return [];
    }

    // Fetch last messages for these conversations
    const conversationIds = conversations.map((c: any) => c.id);

    const { data: messages } = await admin
        .from('conversation_messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    // Get last message per conversation
    const lastMessageByConvId: Record<string, string> = {};
    if (messages) {
        messages.forEach((msg: any) => {
            if (!lastMessageByConvId[msg.conversation_id]) {
                lastMessageByConvId[msg.conversation_id] = msg.content;
            }
        });
    }

    return conversations
        .filter((c: any) => c.metadata?.is_tool_conversation === true)
        .map((c: any) => ({
            type: 'TOOL_CONVERSATION' as const,
            id: c.id,
            title: c.title,
            created_at: c.created_at,
            updated_at: c.updated_at,
            lastMessage: lastMessageByConvId[c.id] || '',
            tool_id: c.metadata?.tool_id || '',
            tool_slug: c.metadata?.tool_slug || '',
            tool_title: c.metadata?.tool_title || '',
            collections: c.metadata?.collection_ids || [],
            isSaved: (c.metadata?.collection_ids?.length || 0) > 0 || c.is_saved,
        }));
}

/**
 * Fetch tool conversations for a specific tool by slug
 */
export async function fetchToolConversationsBySlugAction(toolSlug: string): Promise<ToolConversation[]> {
    const admin = createAdminClient();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch conversations for this specific tool
    const { data: conversations, error } = await admin
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .not('metadata->is_tool_conversation', 'is', null)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch tool conversations by slug:', error);
        return [];
    }

    if (!conversations || conversations.length === 0) {
        return [];
    }

    // Filter by tool_slug in metadata (JSON containment filter isn't reliable)
    const filteredConversations = conversations.filter(
        (c: any) => c.metadata?.tool_slug === toolSlug && c.metadata?.is_tool_conversation === true
    );

    if (filteredConversations.length === 0) {
        return [];
    }

    // Fetch last messages for these conversations
    const conversationIds = filteredConversations.map((c: any) => c.id);

    const { data: messages } = await admin
        .from('conversation_messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    // Get last message per conversation
    const lastMessageByConvId: Record<string, string> = {};
    if (messages) {
        messages.forEach((msg: any) => {
            if (!lastMessageByConvId[msg.conversation_id]) {
                lastMessageByConvId[msg.conversation_id] = msg.content;
            }
        });
    }

    return filteredConversations.map((c: any) => ({
        type: 'TOOL_CONVERSATION' as const,
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        updated_at: c.updated_at,
        lastMessage: lastMessageByConvId[c.id] || '',
        tool_id: c.metadata?.tool_id || '',
        tool_slug: c.metadata?.tool_slug || '',
        tool_title: c.metadata?.tool_title || '',
        role_title: c.metadata?.role_title || '',
        collections: c.metadata?.collection_ids || [],
        isSaved: (c.metadata?.collection_ids?.length || 0) > 0 || c.is_saved,
    }));
}

/**
 * Fetch a specific tool conversation by ID
 */
export async function fetchToolConversationByIdAction(conversationId: string): Promise<ToolConversation | null> {
    const admin = createAdminClient();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: conversation, error } = await admin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (error || !conversation) {
        console.error('Failed to fetch tool conversation:', error);
        return null;
    }

    if (!conversation.metadata?.is_tool_conversation) {
        return null; // Not a tool conversation
    }

    // Fetch messages
    const { data: messages } = await admin
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    const lastMessage = messages && messages.length > 0
        ? messages[messages.length - 1].content
        : '';

    return {
        type: 'TOOL_CONVERSATION' as const,
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        lastMessage,
        messages: messages?.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
        })),
        tool_id: conversation.metadata?.tool_id || '',
        tool_slug: conversation.metadata?.tool_slug || '',
        tool_title: conversation.metadata?.tool_title || '',
        collections: conversation.metadata?.collection_ids || [],
        isSaved: (conversation.metadata?.collection_ids?.length || 0) > 0 || conversation.is_saved,
    };
}
