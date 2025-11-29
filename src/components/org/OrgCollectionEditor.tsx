'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft, Layers, Calendar, CheckCircle } from 'lucide-react';

interface OrgCollectionEditorProps {
    collectionId?: string;
    initialData?: any;
    orgId: string;
}

export default function OrgCollectionEditor({ collectionId, initialData, orgId }: OrgCollectionEditorProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        label: initialData?.label || '',
        color: initialData?.color || 'bg-brand-blue-light/20',
        is_required: initialData?.is_required || false,
        due_date: initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_collections')
                .upsert({
                    id: collectionId === 'new' ? undefined : collectionId,
                    org_id: orgId,
                    label: formData.label,
                    color: formData.color,
                    is_org_collection: true,
                    is_required: formData.is_required,
                    due_date: formData.due_date || null,
                })
                .select()
                .single();

            if (error) throw error;

            router.push('/org/collections');
            router.refresh();
        } catch (error) {
            console.error('Error saving collection:', error);
            alert('Failed to save collection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-white">
                    {collectionId === 'new' ? 'New Collection' : 'Edit Collection'}
                </h1>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">

                {/* Basic Info */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Collection Name</label>
                    <input
                        type="text"
                        value={formData.label}
                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                        placeholder="e.g. Onboarding 101"
                    />
                </div>

                {/* Color Picker (Simple) */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color Theme</label>
                    <div className="flex gap-3">
                        {['bg-brand-blue-light/20', 'bg-purple-500/20', 'bg-green-500/20', 'bg-brand-orange/20', 'bg-red-500/20'].map((color) => (
                            <button
                                key={color}
                                onClick={() => setFormData({ ...formData, color })}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${color} ${formData.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/10 my-6"></div>

                {/* Assignment Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle size={20} className="text-brand-blue-light" /> Assignment Settings
                    </h3>

                    <label className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-black/30 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.is_required}
                            onChange={e => setFormData({ ...formData, is_required: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-white/5 text-brand-blue-light focus:ring-0 focus:ring-offset-0"
                        />
                        <div>
                            <span className="block font-bold text-white">Required Assignment</span>
                            <span className="block text-xs text-slate-400">Members will see this in their "Required" list.</span>
                        </div>
                    </label>

                    {formData.is_required && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !formData.label}
                        className="w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Saving...' : <><Save size={18} /> Save Collection</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
