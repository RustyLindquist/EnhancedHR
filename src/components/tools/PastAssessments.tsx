'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, History } from 'lucide-react';
import { ToolConversation } from '@/types';
import { fetchToolConversationsBySlugAction } from '@/app/actions/tools';
import UniversalCard from '@/components/cards/UniversalCard';

interface PastAssessmentsProps {
    toolSlug: string;
    onSelectConversation: (id: string) => void;
}

const PastAssessments: React.FC<PastAssessmentsProps> = ({
    toolSlug,
    onSelectConversation
}) => {
    const [conversations, setConversations] = useState<ToolConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const data = await fetchToolConversationsBySlugAction(toolSlug);
                setConversations(data);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [toolSlug]);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const truncateMessage = (message: string, maxLength: number = 100): string => {
        if (!message) return 'No messages yet';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-teal-400" size={32} />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-5">
                    <History className="text-slate-400" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Past Assessments</h3>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    Your completed role disruption assessments will appear here.
                    Start a new assessment to begin analyzing how AI will impact any role.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Your Past Assessments</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {conversations.length} assessment{conversations.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conversations.map((conversation) => (
                    <UniversalCard
                        key={conversation.id}
                        type="TOOL_CONVERSATION"
                        title={(conversation as any).role_title || conversation.title}
                        description={truncateMessage(conversation.lastMessage || '')}
                        meta={conversation.updated_at ? formatDate(conversation.updated_at) : undefined}
                        onAction={() => onSelectConversation(conversation.id)}
                        collections={conversation.collections}
                    />
                ))}
            </div>
        </div>
    );
};

export default PastAssessments;
