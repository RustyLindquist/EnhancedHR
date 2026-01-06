'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Loader2, BookOpen, Layers, PlayCircle, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { assignContent } from '@/app/actions/assignments';

type ContentType = 'course' | 'module' | 'lesson' | 'resource';

interface ContentPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    assigneeType: 'user' | 'group' | 'org';
    assigneeId: string;
    onSuccess: () => void;
    defaultAssignmentType?: 'required' | 'recommended';
}

interface ContentItem {
    id: string;
    title: string;
    description?: string;
    subtitle?: string; // For showing parent context (course name, module name)
    type: ContentType;
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: typeof BookOpen; color: string }> = {
    course: { label: 'Courses', icon: BookOpen, color: 'text-brand-blue-light' },
    module: { label: 'Modules', icon: Layers, color: 'text-purple-400' },
    lesson: { label: 'Lessons', icon: PlayCircle, color: 'text-emerald-400' },
    resource: { label: 'Resources', icon: FileText, color: 'text-orange-400' }
};

const ContentPickerModal: React.FC<ContentPickerModalProps> = ({ isOpen, onClose, assigneeType, assigneeId, onSuccess, defaultAssignmentType = 'recommended' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Map<string, ContentType>>(new Map()); // id -> type
    const [assignmentType, setAssignmentType] = useState<'required' | 'recommended'>(defaultAssignmentType);
    const [submitting, setSubmitting] = useState(false);
    const [contentType, setContentType] = useState<ContentType>('course');

    // Reset assignment type when defaultAssignmentType changes
    useEffect(() => {
        setAssignmentType(defaultAssignmentType);
    }, [defaultAssignmentType]);

    // Reset selection when content type changes
    useEffect(() => {
        setSelectedItems(new Map());
    }, [contentType]);

    // Search content based on type
    useEffect(() => {
        if (!isOpen) return;

        const fetchContent = async () => {
            setLoading(true);
            const supabase = createClient();
            let items: ContentItem[] = [];

            try {
                if (contentType === 'course') {
                    let query = supabase.from('courses').select('id, title, description').limit(20);
                    if (searchTerm) {
                        query = query.ilike('title', `%${searchTerm}%`);
                    }
                    const { data } = await query;
                    items = (data || []).map(c => ({
                        id: c.id.toString(),
                        title: c.title,
                        description: c.description || undefined,
                        type: 'course' as ContentType
                    }));
                } else if (contentType === 'module') {
                    // Fetch modules with their course titles
                    let query = supabase
                        .from('modules')
                        .select('id, title, description, duration, course_id, courses(title)')
                        .limit(20);
                    if (searchTerm) {
                        query = query.ilike('title', `%${searchTerm}%`);
                    }
                    const { data } = await query;
                    items = (data || []).map((m: any) => ({
                        id: m.id,
                        title: m.title,
                        description: m.duration ? `Duration: ${m.duration}` : m.description || undefined,
                        subtitle: m.courses?.title || 'Unknown Course',
                        type: 'module' as ContentType
                    }));
                } else if (contentType === 'lesson') {
                    // Fetch lessons with their module and course context
                    let query = supabase
                        .from('lessons')
                        .select('id, title, duration, type, module_id, modules(title, courses(title))')
                        .limit(20);
                    if (searchTerm) {
                        query = query.ilike('title', `%${searchTerm}%`);
                    }
                    const { data } = await query;
                    items = (data || []).map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        description: l.duration ? `${l.type || 'video'} • ${l.duration}` : l.type || 'video',
                        subtitle: l.modules?.courses?.title
                            ? `${l.modules.courses.title} → ${l.modules.title}`
                            : l.modules?.title || 'Unknown Module',
                        type: 'lesson' as ContentType
                    }));
                } else if (contentType === 'resource') {
                    // Fetch resources with their course context
                    let query = supabase
                        .from('resources')
                        .select('id, title, type, size, course_id, courses(title)')
                        .limit(20);
                    if (searchTerm) {
                        query = query.ilike('title', `%${searchTerm}%`);
                    }
                    const { data } = await query;
                    items = (data || []).map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        description: `${r.type}${r.size ? ` • ${r.size}` : ''}`,
                        subtitle: r.courses?.title || 'Unknown Course',
                        type: 'resource' as ContentType
                    }));
                }
            } catch (error) {
                console.error('Error fetching content:', error);
            }

            setResults(items);
            setLoading(false);
        };

        const debounce = setTimeout(fetchContent, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, isOpen, contentType]);

    const toggleSelection = (id: string, type: ContentType) => {
        setSelectedItems(prev => {
            const newMap = new Map(prev);
            if (newMap.has(id)) {
                newMap.delete(id);
            } else {
                newMap.set(id, type);
            }
            return newMap;
        });
    };

    const handleAssign = async () => {
        if (selectedItems.size === 0) return;
        setSubmitting(true);

        let successCount = 0;
        let failCount = 0;

        for (const [contentId, type] of selectedItems.entries()) {
            const res = await assignContent(assigneeType, assigneeId, type, contentId, assignmentType);
            if (res.success) {
                successCount++;
            } else {
                failCount++;
            }
        }

        setSubmitting(false);
        if (failCount === 0) {
            setSelectedItems(new Map());
            onSuccess();
            onClose();
        } else {
            alert(`Assigned ${successCount} items. ${failCount} failed.`);
            if (successCount > 0) {
                onSuccess();
            }
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const config = CONTENT_TYPE_CONFIG[contentType];

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" style={{ isolation: 'isolate' }}>
            <div className="bg-[#0F141C] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Assign Content</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Type Selector */}
                <div className="p-3 border-b border-white/10">
                    <div className="flex gap-1 p-1 bg-black/30 rounded-lg">
                        {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((type) => {
                            const typeConfig = CONTENT_TYPE_CONFIG[type];
                            const Icon = typeConfig.icon;
                            const isActive = contentType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setContentType(type)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                                        isActive
                                            ? `bg-white/10 ${typeConfig.color}`
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span className="hidden sm:inline">{typeConfig.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${config.label.toLowerCase()}...`}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue-light/20 focus:border-brand-blue-light/50 placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-2 dropdown-scrollbar min-h-[200px]">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-slate-500" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <config.icon size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No {config.label.toLowerCase()} found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map(item => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleSelection(item.id, item.type)}
                                        className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${isSelected
                                            ? 'bg-brand-blue-light/10 border border-brand-blue-light/20 ring-1 ring-brand-blue-light/20'
                                            : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-brand-blue-light border-brand-blue-light' : 'border-slate-500'}`}>
                                            {isSelected && <Check size={12} className="text-brand-black" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-brand-blue-light' : 'text-slate-300'}`}>
                                                {item.title}
                                            </div>
                                            {item.subtitle && (
                                                <div className={`text-[10px] uppercase tracking-wider mt-0.5 truncate ${config.color} opacity-70`}>
                                                    {item.subtitle}
                                                </div>
                                            )}
                                            {item.description && (
                                                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 space-y-4">
                    {/* Assignment Type Toggle */}
                    <div className="flex gap-2 p-1 bg-[#0F141C] border border-white/10 rounded-lg max-w-fit">
                        <button
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${assignmentType === 'recommended' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setAssignmentType('recommended')}
                        >
                            Suggested
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${assignmentType === 'required' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setAssignmentType('required')}
                        >
                            Required
                        </button>
                    </div>

                    {/* Assign Button */}
                    <button
                        onClick={handleAssign}
                        disabled={selectedItems.size === 0 || submitting}
                        className="w-full py-2.5 bg-brand-blue-light text-brand-black rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {submitting ? 'Assigning...' : `Assign ${selectedItems.size > 0 ? `(${selectedItems.size})` : 'Content'}`}
                    </button>
                </div>
            </div>
        </div>
    );

    // Use portal to render at document body level, escaping any parent stacking contexts
    return createPortal(modalContent, document.body);
};

export default ContentPickerModal;
