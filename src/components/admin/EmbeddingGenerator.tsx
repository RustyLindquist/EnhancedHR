'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmbeddingGeneratorProps {
    courseId: number;
    lessonId?: string;
    transcript?: string;
}

const EmbeddingGenerator: React.FC<EmbeddingGeneratorProps> = ({ courseId, lessonId, transcript }) => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleGenerate = async () => {
        if (!transcript) {
            setMessage('No transcript available.');
            setStatus('error');
            return;
        }

        setStatus('processing');
        setMessage('Generating embeddings...');

        const supabase = createClient();

        try {
            const { data, error } = await supabase.functions.invoke('embed-transcript', {
                body: { transcript, courseId, lessonId }
            });

            if (error) throw error;

            setStatus('success');
            setMessage(`Success! Processed ${data.chunksProcessed} chunks.`);
        } catch (error: any) {
            console.error('Embedding Error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to generate embeddings.');
        }
    };

    return (
        <div className="mt-4">
            <button
                onClick={handleGenerate}
                disabled={status === 'processing' || !transcript}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all border ${status === 'success'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : status === 'error'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/20 hover:bg-brand-blue-light/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {status === 'processing' ? (
                    <span className="animate-pulse">Processing...</span>
                ) : status === 'success' ? (
                    <><CheckCircle size={16} /> Embeddings Generated</>
                ) : (
                    <><Sparkles size={16} /> Generate AI Embeddings</>
                )}
            </button>
            {message && (
                <p className={`text-xs mt-2 ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default EmbeddingGenerator;
