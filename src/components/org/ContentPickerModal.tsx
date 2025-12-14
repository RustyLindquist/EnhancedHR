'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { assignContent } from '@/app/actions/assignments';

interface ContentPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    assigneeType: 'user' | 'group' | 'org';
    assigneeId: string;
    onSuccess: () => void;
}

const ContentPickerModal: React.FC<ContentPickerModalProps> = ({ isOpen, onClose, assigneeType, assigneeId, onSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [assignmentType, setAssignmentType] = useState<'required' | 'recommended'>('recommended');
    const [submitting, setSubmitting] = useState(false);

    // Search courses
    useEffect(() => {
        if (!isOpen) return;

        const fetchCourses = async () => {
            setLoading(true);
            const supabase = createClient();

            let query = supabase.from('courses').select('id, title, description').limit(10);

            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (data) setResults(data);
            setLoading(false);
        };

        const debounce = setTimeout(fetchCourses, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, isOpen]);

    const handleAssign = async () => {
        if (!selectedId) return;
        setSubmitting(true);

        const res = await assignContent(assigneeType, assigneeId, 'course', selectedId, assignmentType);

        setSubmitting(false);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Failed to assign content');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0F141C] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Assign Content</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue-light/20 focus:border-brand-blue-light/50 placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-slate-500" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map(course => (
                                <button
                                    key={course.id}
                                    onClick={() => setSelectedId(course.id)}
                                    className={`w-full text-left p-3 rounded-lg flex items-start justify-between group transition-colors ${selectedId === course.id
                                        ? 'bg-brand-blue-light/10 border border-brand-blue-light/20 ring-1 ring-brand-blue-light/20'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div>
                                        <div className={`text-sm font-medium ${selectedId === course.id ? 'text-brand-blue-light' : 'text-slate-300'}`}>
                                            {course.title}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                            {course.description || 'No description'}
                                        </div>
                                    </div>
                                    {selectedId === course.id && (
                                        <Check size={16} className="text-brand-blue-light mt-0.5" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 space-y-4">
                    <div className="flex gap-2 p-1 bg-[#0F141C] border border-white/10 rounded-lg max-w-fit">
                        <button
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${assignmentType === 'recommended' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setAssignmentType('recommended')}
                        >
                            Recommended
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${assignmentType === 'required' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setAssignmentType('required')}
                        >
                            Required
                        </button>
                    </div>

                    <button
                        onClick={handleAssign}
                        disabled={!selectedId || submitting}
                        className="w-full py-2.5 bg-brand-blue-light text-brand-black rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {submitting ? 'Assigning...' : 'Assign Content'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentPickerModal;
