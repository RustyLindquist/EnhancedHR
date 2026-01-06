'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditorComponent = dynamic(
    () => import('./MarkdownEditorCore'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full min-h-[400px] bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        )
    }
);

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
    return <MDXEditorComponent value={value} onChange={onChange} placeholder={placeholder} />;
}
