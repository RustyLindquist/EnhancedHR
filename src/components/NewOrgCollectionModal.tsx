'use client';

import React, { useState } from 'react';
import { X, Save, Building, Layers } from 'lucide-react';

interface NewOrgCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const COLOR_OPTIONS = [
    { color: '#64748B', name: 'Slate' },
    { color: '#3B82F6', name: 'Blue' },
    { color: '#8B5CF6', name: 'Purple' },
    { color: '#22C55E', name: 'Green' },
    { color: '#F97316', name: 'Orange' },
    { color: '#EF4444', name: 'Red' },
];

export default function NewOrgCollectionModal({ isOpen, onClose, onSuccess }: NewOrgCollectionModalProps) {
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Please enter a collection name');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { createOrgCollection } = await import('@/app/actions/org');
            const result = await createOrgCollection(name.trim(), selectedColor);

            if (result.success) {
                onSuccess();
                onClose();
                setName('');
                setSelectedColor(COLOR_OPTIONS[0].color);
            } else {
                setError(result.error || 'Failed to create collection');
            }
        } catch (err) {
            setError('An error occurred while creating the collection');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-500/10">
                            <Building size={20} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">New Company Collection</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Collection Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Onboarding Essentials"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Color
                        </label>
                        <div className="flex gap-3">
                            {COLOR_OPTIONS.map((option) => (
                                <button
                                    key={option.color}
                                    onClick={() => setSelectedColor(option.color)}
                                    className={`
                                        w-10 h-10 rounded-full border-2 transition-all
                                        ${selectedColor === option.color
                                            ? 'border-white scale-110 shadow-lg'
                                            : 'border-transparent hover:scale-105'}
                                    `}
                                    style={{ backgroundColor: option.color }}
                                    title={option.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Layers size={18} className="text-brand-blue-light mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300">
                                    Company collections are visible to all members of your organization.
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Only org admins can add or remove content.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full text-sm font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim()}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-brand-blue-light text-brand-black font-bold text-sm uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating...' : (
                            <>
                                <Save size={14} /> Create
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
