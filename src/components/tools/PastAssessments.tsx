'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, History } from 'lucide-react';
import { ToolConversation, Collection } from '@/types';
import { fetchToolConversationsBySlugAction, deleteToolConversationAction } from '@/app/actions/tools';
import UniversalCard from '@/components/cards/UniversalCard';
import AddCollectionModal from '@/components/AddCollectionModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { addToolConversationToCollectionAction, removeToolConversationFromCollectionAction } from '@/app/actions/collections';
import { createClient } from '@/lib/supabase/client';

interface PastAssessmentsProps {
    toolSlug: string;
    onSelectConversation: (id: string) => void;
}

const PastAssessments: React.FC<PastAssessmentsProps> = ({
    toolSlug,
    onSelectConversation
}) => {
    const [conversations, setConversations] = useState<ToolConversation[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ToolConversation | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<ToolConversation | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch conversations
                const data = await fetchToolConversationsBySlugAction(toolSlug);
                setConversations(data);

                // Fetch user's collections
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userCollections } = await supabase
                        .from('user_collections')
                        .select('id, label, color, is_custom')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: true });

                    if (userCollections) {
                        setCollections(userCollections.map(c => ({
                            id: c.id,
                            label: c.label,
                            color: c.color,
                            isCustom: c.is_custom
                        })));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
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

    const handleAddToCollection = (conversation: ToolConversation) => {
        setSelectedConversation(conversation);
        setShowCollectionModal(true);
    };

    const handleSaveToCollections = async (selectedIds: string[], newCollection?: { label: string; color: string }) => {
        if (!selectedConversation) return;

        try {
            // Get current collection IDs
            const currentIds = selectedConversation.collections || [];

            // Add to new collections
            for (const collectionId of selectedIds) {
                if (!currentIds.includes(collectionId)) {
                    await addToolConversationToCollectionAction(selectedConversation.id, collectionId);
                }
            }

            // Remove from unselected collections
            for (const collectionId of currentIds) {
                if (!selectedIds.includes(collectionId)) {
                    await removeToolConversationFromCollectionAction(selectedConversation.id, collectionId);
                }
            }

            // Update local state
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation.id
                    ? { ...conv, collections: selectedIds, isSaved: selectedIds.length > 0 }
                    : conv
            ));
        } catch (error) {
            console.error('Failed to update collections:', error);
        }
    };

    const handleDeleteInitiate = (conversation: ToolConversation) => {
        setConversationToDelete(conversation);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!conversationToDelete) return;

        try {
            const success = await deleteToolConversationAction(conversationToDelete.id);
            if (success) {
                setConversations(prev => prev.filter(c => c.id !== conversationToDelete.id));
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        } finally {
            setShowDeleteModal(false);
            setConversationToDelete(null);
        }
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
                        onRemove={() => handleDeleteInitiate(conversation)}
                        onAdd={() => handleAddToCollection(conversation)}
                    />
                ))}
            </div>

            {/* Add to Collection Modal */}
            {showCollectionModal && selectedConversation && (
                <AddCollectionModal
                    item={{
                        type: 'TOOL_CONVERSATION',
                        id: selectedConversation.id,
                        title: selectedConversation.title,
                        collections: selectedConversation.collections || []
                    } as any}
                    availableCollections={collections}
                    onClose={() => {
                        setShowCollectionModal(false);
                        setSelectedConversation(null);
                    }}
                    onSave={handleSaveToCollections}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setConversationToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Assessment?"
                itemTitle={conversationToDelete?.title || 'Assessment'}
                description="This will permanently delete this assessment and all associated data. This action cannot be undone."
                confirmText="Delete Assessment"
            />
        </div>
    );
};

export default PastAssessments;
