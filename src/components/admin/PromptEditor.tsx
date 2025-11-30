'use client';

import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PromptEditorProps {
    prompt: {
        id: string;
        agent_type: string;
        system_instruction: string;
    };
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt }) => {
    const [instruction, setInstruction] = useState(prompt.system_instruction);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    const handleSave = async () => {
        setStatus('saving');
        const supabase = createClient();

        const { error } = await supabase
            .from('ai_system_prompts')
            .update({ system_instruction: instruction, updated_at: new Date().toISOString() })
            .eq('id', prompt.id);

        if (error) {
            console.error('Error updating prompt:', error);
            setStatus('error');
        } else {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light font-bold">
                        {prompt.agent_type.substring(0, 2)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{prompt.agent_type.replace('_', ' ')}</h3>
                        <p className="text-xs text-slate-400">System Instruction</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={status === 'saving' || instruction === prompt.system_instruction}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all ${status === 'success'
                            ? 'bg-green-500 text-black'
                            : status === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {status === 'saving' ? (
                        'Saving...'
                    ) : status === 'success' ? (
                        <><CheckCircle size={16} /> Saved</>
                    ) : status === 'error' ? (
                        <><AlertCircle size={16} /> Error</>
                    ) : (
                        <><Save size={16} /> Save Changes</>
                    )}
                </button>
            </div>
            <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-brand-blue-light/50 font-mono text-sm resize-none"
                placeholder="Enter system instruction..."
            />
        </div>
    );
};

export default PromptEditor;
