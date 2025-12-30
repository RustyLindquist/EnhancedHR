'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { CheckCircle, Plus, X, Loader2, GripVertical } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseSkills } from '@/app/actions/course-builder';

interface SkillsEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentSkills: string[];
    onSave: () => void;
}

export default function SkillsEditorPanel({
    isOpen,
    onClose,
    courseId,
    currentSkills,
    onSave
}: SkillsEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [skills, setSkills] = useState<string[]>(currentSkills);
    const [newSkill, setNewSkill] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAddSkill = useCallback(() => {
        const trimmed = newSkill.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills(prev => [...prev, trimmed]);
            setNewSkill('');
        }
    }, [newSkill, skills]);

    const handleRemoveSkill = useCallback((index: number) => {
        setSkills(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    }, [handleAddSkill]);

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            const result = await updateCourseSkills(courseId, skills);
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save skills');
            }
        });
    }, [courseId, skills, onSave]);

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

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Skills"
            icon={CheckCircle}
            iconColor="text-emerald-400"
            headerActions={headerActions}
        >
            <div className="max-w-2xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <p className="text-sm text-slate-400">
                    Add the key skills learners will gain from this course. These appear on the course description page.
                </p>

                {/* Add New Skill */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Add Skill
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Strategic HR Planning"
                            className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                        />
                        <button
                            onClick={handleAddSkill}
                            disabled={!newSkill.trim()}
                            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Skills List */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Current Skills ({skills.length})
                    </label>
                    <div className="space-y-2">
                        {skills.length > 0 ? (
                            skills.map((skill, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group"
                                >
                                    <GripVertical size={16} className="text-slate-600 cursor-move" />
                                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                                    <span className="flex-1 text-white">{skill}</span>
                                    <button
                                        onClick={() => handleRemoveSkill(index)}
                                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                <CheckCircle size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No skills added yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
