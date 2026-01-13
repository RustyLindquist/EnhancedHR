'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { User, Search, Loader2, CheckCircle, X, UserCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { getApprovedExperts, assignCourseExpert, ExpertOption } from '@/app/actions/course-builder';

interface ExpertAssignmentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentExpertId?: string;
    currentExpertName?: string;
    currentIsStandalone?: boolean;
    onSave: () => void;
}

export default function ExpertAssignmentPanel({
    isOpen,
    onClose,
    courseId,
    currentExpertId,
    currentExpertName,
    currentIsStandalone,
    onSave
}: ExpertAssignmentPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [experts, setExperts] = useState<ExpertOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExpertId, setSelectedExpertId] = useState<string | null>(currentExpertId || null);
    const [selectedIsStandalone, setSelectedIsStandalone] = useState<boolean>(currentIsStandalone || false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch experts on mount
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getApprovedExperts().then((data) => {
                setExperts(data);
                setLoading(false);
            });
        }
    }, [isOpen]);

    // Filter experts by search query
    const filteredExperts = experts.filter(expert => {
        const name = expert.full_name?.toLowerCase() || '';
        const title = expert.expert_title?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || title.includes(query);
    });

    const handleSelectExpert = (expert: ExpertOption) => {
        setSelectedExpertId(expert.id);
        setSelectedIsStandalone(expert.isStandalone);
    };

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            const result = await assignCourseExpert(courseId, selectedExpertId, selectedIsStandalone);
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to assign expert');
            }
        });
    }, [courseId, selectedExpertId, selectedIsStandalone, onSave]);

    const handleRemoveExpert = useCallback(() => {
        setSelectedExpertId(null);
        setSelectedIsStandalone(false);
    }, []);

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    // Get selected expert details
    const selectedExpert = experts.find(e => e.id === selectedExpertId);

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Expert"
            icon={User}
            iconColor="text-brand-blue-light"
            headerActions={headerActions}
        >
            <div className="max-w-2xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <p className="text-sm text-slate-400">
                    Assign an approved expert to this course. Their profile information will be displayed on the course page.
                </p>

                {/* Current Selection */}
                {selectedExpertId && selectedExpert && (
                    <div className={`p-4 rounded-xl ${selectedIsStandalone
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-brand-blue-light/10 border border-brand-blue-light/30'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full overflow-hidden bg-slate-800 border ${selectedIsStandalone ? 'border-amber-500/30' : 'border-brand-blue-light/30'
                                    }`}>
                                    {selectedExpert.avatar_url ? (
                                        <img
                                            src={selectedExpert.avatar_url}
                                            alt={selectedExpert.full_name || ''}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                                            {selectedExpert.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{selectedExpert.full_name}</h4>
                                        {selectedIsStandalone && (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                <UserCircle size={10} /> Standalone
                                            </span>
                                        )}
                                    </div>
                                    {selectedExpert.expert_title && (
                                        <p className={`text-sm ${selectedIsStandalone ? 'text-amber-400' : 'text-brand-blue-light'}`}>
                                            {selectedExpert.expert_title}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveExpert}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Search Experts
                    </label>
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or title..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                        />
                    </div>
                </div>

                {/* Expert List */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Available Experts ({filteredExperts.length})
                    </label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto dropdown-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-slate-500">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        ) : filteredExperts.length > 0 ? (
                            filteredExperts.map((expert) => {
                                const isSelected = selectedExpertId === expert.id && selectedIsStandalone === expert.isStandalone;
                                return (
                                    <button
                                        key={`${expert.id}-${expert.isStandalone ? 'standalone' : 'regular'}`}
                                        onClick={() => handleSelectExpert(expert)}
                                        className={`
                                            w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                            ${isSelected
                                                ? expert.isStandalone
                                                    ? 'bg-amber-500/10 border-amber-500/30'
                                                    : 'bg-brand-blue-light/10 border-brand-blue-light/30'
                                                : expert.isStandalone
                                                    ? 'bg-white/5 border-amber-500/10 hover:border-amber-500/30'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${expert.isStandalone
                                            ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30'
                                            : 'bg-slate-800'
                                            }`}>
                                            {expert.avatar_url ? (
                                                <img
                                                    src={expert.avatar_url}
                                                    alt={expert.full_name || ''}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                                                    {expert.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-white truncate">{expert.full_name}</h4>
                                                {expert.isStandalone && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                                                        <UserCircle size={10} /> Standalone
                                                    </span>
                                                )}
                                            </div>
                                            {expert.expert_title && (
                                                <p className="text-xs text-slate-400 truncate">{expert.expert_title}</p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <CheckCircle size={18} className={`${expert.isStandalone ? 'text-amber-400' : 'text-brand-blue-light'} flex-shrink-0`} />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                <User size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery ? 'No experts match your search' : 'No approved experts found'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
