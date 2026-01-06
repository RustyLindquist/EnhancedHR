'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Award, Loader2, CheckCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseCredits } from '@/app/actions/course-builder';
import { CourseBadge } from '@/types';

interface CreditsEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentBadges: CourseBadge[];
    onSave: () => void;
}

export default function CreditsEditorPanel({
    isOpen,
    onClose,
    courseId,
    currentBadges,
    onSave
}: CreditsEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // SHRM settings
    const [shrmEnabled, setShrmEnabled] = useState(currentBadges?.includes('SHRM') || false);
    const [shrmActivityId, setShrmActivityId] = useState('');
    const [shrmPdcs, setShrmPdcs] = useState('2');

    // HRCI settings
    const [hrciEnabled, setHrciEnabled] = useState(currentBadges?.includes('HRCI') || false);
    const [hrciProgramId, setHrciProgramId] = useState('');
    const [hrciCredits, setHrciCredits] = useState('1.5');

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            const result = await updateCourseCredits(courseId, {
                shrm_eligible: shrmEnabled,
                shrm_activity_id: shrmActivityId,
                shrm_pdcs: shrmEnabled ? parseFloat(shrmPdcs) || 0 : 0,
                hrci_eligible: hrciEnabled,
                hrci_program_id: hrciProgramId,
                hrci_credits: hrciEnabled ? parseFloat(hrciCredits) || 0 : 0
            });

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save credits');
            }
        });
    }, [courseId, shrmEnabled, shrmActivityId, shrmPdcs, hrciEnabled, hrciProgramId, hrciCredits, onSave]);

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
            title="Edit Credits & Certifications"
            icon={Award}
            iconColor="text-amber-400"
            headerActions={headerActions}
        >
            <div className="max-w-3xl space-y-8">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <p className="text-sm text-slate-400">
                    Configure continuing education credits for HR certifications. Learners will see these credits on the course page.
                </p>

                {/* SHRM Section */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-blue-light/20 flex items-center justify-center">
                                <span className="text-brand-blue-light font-bold text-sm">SHRM</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">SHRM Recertification</h3>
                                <p className="text-xs text-slate-500">Society for Human Resource Management</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={shrmEnabled}
                                onChange={(e) => setShrmEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-light"></div>
                        </label>
                    </div>

                    {shrmEnabled && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Activity ID
                                </label>
                                <input
                                    type="text"
                                    value={shrmActivityId}
                                    onChange={(e) => setShrmActivityId(e.target.value)}
                                    placeholder="e.g., 25-XXXXX"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    PDCs
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={shrmPdcs}
                                    onChange={(e) => setShrmPdcs(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* HRCI Section */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <span className="text-purple-400 font-bold text-sm">HRCI</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">HRCI Credit Hours</h3>
                                <p className="text-xs text-slate-500">HR Certification Institute</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hrciEnabled}
                                onChange={(e) => setHrciEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>

                    {hrciEnabled && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Program ID
                                </label>
                                <input
                                    type="text"
                                    value={hrciProgramId}
                                    onChange={(e) => setHrciProgramId(e.target.value)}
                                    placeholder="e.g., XXXXX"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-purple-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Credit Hours
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={hrciCredits}
                                    onChange={(e) => setHrciCredits(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DropdownPanel>
    );
}
