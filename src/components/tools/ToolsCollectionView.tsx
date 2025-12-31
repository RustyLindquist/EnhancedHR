'use client';

import React from 'react';
import { Tool } from '@/types';
import UniversalCard from '@/components/cards/UniversalCard';
import { Wrench, Sparkles } from 'lucide-react';

interface ToolsCollectionViewProps {
    tools: Tool[];
    isLoading: boolean;
    onToolSelect: (slug: string) => void;
}

export default function ToolsCollectionView({
    tools,
    isLoading,
    onToolSelect
}: ToolsCollectionViewProps) {
    if (isLoading) {
        return (
            <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                <div className="text-white p-10 font-bold">Loading tools...</div>
            </div>
        );
    }

    if (tools.length === 0) {
        return (
            <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                <div className="text-slate-500 p-10 flex flex-col items-center">
                    <p className="text-lg mb-2">No tools available.</p>
                    <p className="text-sm">Tools will appear here once they are configured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
            {/* Tools Grid */}
            <div className="grid gap-8 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {tools.map((tool, index) => (
                    <div
                        key={tool.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <UniversalCard
                            type="TOOL"
                            title={tool.title}
                            description={tool.description}
                            onAction={() => onToolSelect(tool.slug)}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>

            {/* Tools Collection Footer */}
            {tools.length > 0 && (
                <div className="col-span-full flex flex-col items-center justify-center pt-20 pb-10 opacity-60">
                    <div className="mb-6 relative w-32 h-32">
                        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full"></div>
                        <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                            <Wrench className="text-teal-400 w-full h-full" strokeWidth={1} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
                        AI-Powered Tools
                    </p>
                    <p className="text-slate-600 text-[10px] mt-1 max-w-sm text-center">
                        Specialized AI assistants for HR tasks. Each tool is powered by a custom AI agent.
                    </p>
                </div>
            )}
        </div>
    );
}
