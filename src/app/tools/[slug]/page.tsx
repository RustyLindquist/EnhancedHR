import { notFound } from 'next/navigation';
import { fetchToolBySlugAction, fetchToolConversationByIdAction } from '@/app/actions/tools';
import ToolChatInterface from '@/components/tools/ToolChatInterface';
import RoleDisruptionTool from '@/components/tools/RoleDisruptionTool';
import StandardPageLayout from '@/components/StandardPageLayout';
import ToolPageLayout from '@/components/ToolPageLayout';

interface ToolPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ conversationId?: string }>;
}

export default async function ToolPage({ params, searchParams }: ToolPageProps) {
    const { slug } = await params;
    const { conversationId } = await searchParams;

    const tool = await fetchToolBySlugAction(slug);

    if (!tool) {
        notFound();
    }

    // Fetch existing conversation if ID provided
    let initialMessages: any[] = [];
    if (conversationId) {
        const conversation = await fetchToolConversationByIdAction(conversationId);
        if (conversation?.messages) {
            initialMessages = conversation.messages;
        }
    }

    // Role Disruption Forecasting uses enhanced layout with NotesPanel
    if (slug === 'role-disruption-forecasting') {
        return (
            <ToolPageLayout activeNavId="tools">
                <RoleDisruptionTool
                    tool={tool}
                    conversationId={conversationId}
                    initialMessages={initialMessages}
                />
            </ToolPageLayout>
        );
    }

    // Default for other tools: Standard layout with basic chat interface
    return (
        <StandardPageLayout activeNavId="tools">
            <div className="h-full w-full">
                <ToolChatInterface
                    tool={tool}
                    conversationId={conversationId}
                    initialMessages={initialMessages}
                />
            </div>
        </StandardPageLayout>
    );
}
