'use client';

import React from 'react';
import UniversalCard from '@/components/cards/UniversalCard';
import { Building } from 'lucide-react';
import { CardType, CARD_TYPE_CONFIGS } from '@/components/cards/cardTypeConfigs';

interface OrgHubItem {
    id: string;
    cardType: CardType;
    title: string;
    description: string;
    meta?: string;
}

interface MyOrganizationHubProps {
    orgMemberCount: number;
    orgCollectionsCount: number;
    isOrgAdmin: boolean;
    hasOrgCourses: boolean;
    viewMode: 'grid' | 'list';
    onSelectCollection: (id: string) => void;
    onNavigateToOrgCourses: () => void;
}

export default function MyOrganizationHub({
    orgMemberCount,
    orgCollectionsCount,
    isOrgAdmin,
    hasOrgCourses,
    viewMode,
    onSelectCollection,
    onNavigateToOrgCourses
}: MyOrganizationHubProps) {
    const allItems: (OrgHubItem & { visible: boolean; onClick: () => void })[] = [
        {
            id: 'users-groups',
            cardType: 'USERS_GROUPS',
            title: 'Users and Groups',
            description: 'Manage team members, groups, and organizational structure.',
            meta: `${orgMemberCount} member${orgMemberCount !== 1 ? 's' : ''}`,
            visible: true,
            onClick: () => onSelectCollection('users-groups'),
        },
        {
            id: 'org-analytics',
            cardType: 'ORG_ANALYTICS',
            title: 'Analytics',
            description: 'View organizational learning metrics, engagement, and progress.',
            visible: isOrgAdmin,
            onClick: () => onSelectCollection('org-analytics'),
        },
        {
            id: 'org-courses',
            cardType: 'ORG_COURSE',
            title: 'Organization Courses',
            description: isOrgAdmin ? 'Create and manage courses for your organization.' : 'Browse courses assigned to your organization.',
            visible: isOrgAdmin || hasOrgCourses,
            onClick: onNavigateToOrgCourses,
        },
        {
            id: 'org-collections',
            cardType: 'ORG_COLLECTION',
            title: 'Org Collections',
            description: 'Curated collections shared across your organization.',
            meta: `${orgCollectionsCount} collection${orgCollectionsCount !== 1 ? 's' : ''}`,
            visible: true,
            onClick: () => onSelectCollection('org-collections'),
        },
        {
            id: 'assigned-learning',
            cardType: 'ASSIGNED_LEARNING',
            title: 'My Assigned Learning',
            description: 'Required and recommended courses assigned to you.',
            visible: true,
            onClick: () => onSelectCollection('assigned-learning'),
        },
    ];

    const visibleItems = allItems.filter(item => item.visible);

    if (visibleItems.length === 0) {
        return (
            <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                <div className="text-slate-500 p-10 flex flex-col items-center">
                    <p className="text-lg mb-2">No organization features available.</p>
                    <p className="text-sm">Organization features will appear here when configured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
            {viewMode === 'grid' ? (
                <div className="grid gap-8 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {visibleItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <UniversalCard
                                type={item.cardType}
                                title={item.title}
                                description={item.description}
                                meta={item.meta}
                                onAction={item.onClick}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2 pb-20">
                    {visibleItems.map((item, index) => {
                        const config = CARD_TYPE_CONFIGS[item.cardType];
                        const Icon = config?.icon || Building;
                        return (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 group animate-fade-in-up text-left"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${config?.bodyColor || 'bg-white/5'} group-hover:brightness-125`}>
                                    <Icon size={18} className={config?.labelColor || 'text-slate-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                                </div>
                                {item.meta && (
                                    <span className="text-xs text-slate-500 flex-shrink-0">{item.meta}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            {visibleItems.length > 0 && (
                <div className="col-span-full flex flex-col items-center justify-center pt-20 pb-10 opacity-60">
                    <div className="mb-6 relative w-32 h-32">
                        <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                        <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                            <Building className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
                        My Organization
                    </p>
                    <p className="text-slate-600 text-[10px] mt-1 max-w-sm text-center">
                        Your organization hub. Access team management, analytics, courses, and collections.
                    </p>
                </div>
            )}
        </div>
    );
}
