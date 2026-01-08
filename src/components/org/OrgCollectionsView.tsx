'use client';

import React, { useState } from 'react';
import UniversalCard from '@/components/cards/UniversalCard';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Building, Lightbulb } from 'lucide-react';

interface OrgCollectionInfo {
    id: string;
    label: string;
    color: string;
    item_count: number;
}

interface OrgCollectionsViewProps {
    collections: OrgCollectionInfo[];
    isLoading: boolean;
    onCollectionSelect: (collectionId: string) => void;
    onDelete?: (collectionId: string) => void;
    isOrgAdmin?: boolean;
}

export default function OrgCollectionsView({
    collections,
    isLoading,
    onCollectionSelect,
    onDelete,
    isOrgAdmin
}: OrgCollectionsViewProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<OrgCollectionInfo | null>(null);

    const handleDeleteClick = (collection: OrgCollectionInfo) => {
        setCollectionToDelete(collection);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (collectionToDelete && onDelete) {
            onDelete(collectionToDelete.id);
        }
        setShowDeleteModal(false);
        setCollectionToDelete(null);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setCollectionToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                <div className="text-white p-10 font-bold">Loading collections...</div>
            </div>
        );
    }

    return (
        <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
            {/* Collections Grid */}
            {collections.length > 0 && (
                <div className="grid gap-8 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {collections.map((collection, index) => (
                        <div
                            key={collection.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <UniversalCard
                                type="ORG_COLLECTION"
                                title={collection.label}
                                meta={`${collection.item_count} ${collection.item_count === 1 ? 'item' : 'items'}`}
                                onAction={() => onCollectionSelect(`org-collection-${collection.id}`)}
                                onRemove={isOrgAdmin && onDelete ? () => handleDeleteClick(collection) : undefined}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Help Text / About Section - always shown with gap after cards */}
            <div className={`max-w-3xl animate-fade-in mx-auto ${collections.length > 0 ? 'mt-[100px]' : ''}`}>

                {/* Visual Header - Icon, Title, Subtitle */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <div className="mb-6 relative w-32 h-32">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                        <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                            <Building className="text-blue-400 w-full h-full" strokeWidth={1} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                        Company Collections
                    </p>
                    <p className="text-slate-500 text-sm mt-2 max-w-md text-center leading-relaxed">
                        Curated learning paths created by your organization for teams, departments, and roles.
                    </p>
                </div>

                <div className="text-slate-400 text-lg space-y-6 leading-relaxed font-light mb-10 text-center">
                    <p>
                        This is where your organization can create custom collections. They can add courses and content to a collection, assign employees to that collection, and even designate content within that collection as required learning.
                    </p>
                    <p>
                        Each collection can have its own users, so you can create a collection for leaders, or for a particular department or role, or even create a recommended learning path.
                    </p>
                </div>

                {/* Pro Tip Box */}
                <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-6 text-left relative overflow-hidden group hover:bg-brand-blue-light/10 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-blue-light/10 rounded-full blur-2xl group-hover:bg-brand-blue-light/20 transition-colors"></div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 bg-brand-blue-light/10 rounded-lg text-brand-blue-light flex-shrink-0">
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <h3 className="text-brand-blue-light font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                                Pro Tip
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                You could create a series of Collections, each representing a "level of achievement". Once an employee completes all the courses in a Collection, they earn a reward, and can begin on the "Level 2" Collection.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-slate-400 text-lg italic border-t border-brand-blue-light/10 pt-6 mt-6 text-center">
                    Company Collections give you lots of flexibility in how you expose and recommend content to the people in your organization.
                </p>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onCancel={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Collection?"
                itemTitle={collectionToDelete?.label || 'Collection'}
                description={
                    <>
                        This will permanently delete this company collection and remove all items from it.
                        {collectionToDelete && collectionToDelete.item_count > 0 && (
                            <span className="block mt-2 font-medium">
                                This collection contains {collectionToDelete.item_count} {collectionToDelete.item_count === 1 ? 'item' : 'items'}.
                            </span>
                        )}
                        <span className="block mt-2">This action cannot be undone.</span>
                    </>
                }
                confirmText="Delete Collection"
            />
        </div>
    );
}
