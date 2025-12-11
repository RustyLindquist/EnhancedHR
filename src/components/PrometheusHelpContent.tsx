import React from 'react';
import { Layers, Star, Clock, Folder, Lightbulb, Sparkles, Box } from 'lucide-react';

const PrometheusGraphic = () => (
    <div className="relative w-full max-w-lg mx-auto h-[450px] mb-12 flex items-center justify-center">
        {/* Core Nucleus */}
        <div className="absolute w-32 h-32 rounded-full bg-brand-orange/20 blur-3xl animate-pulse-slow"></div>
        <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(255,147,0,0.3)]">
            <Sparkles size={48} className="text-white" />
        </div>

        {/* Orbiting Context Nodes */}
        <div className="absolute w-[400px] h-[400px] border border-white/5 rounded-full animate-spin-slow-reverse">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] p-3 rounded-lg border border-white/10 shadow-xl">
                <Layers size={20} className="text-brand-blue-light" />
                <span className="sr-only">Layers</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#0f172a] p-3 rounded-lg border border-white/10 shadow-xl">
                <Folder size={20} className="text-purple-400" />
                <span className="sr-only">Folder</span>
            </div>
        </div>

        <div className="absolute w-[280px] h-[280px] border border-white/10 rounded-full animate-spin-slow">
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] p-2 rounded-lg border border-white/10 shadow-xl">
                <Star size={16} className="text-yellow-400" />
            </div>
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-[#0f172a] p-2 rounded-lg border border-white/10 shadow-xl">
                <Box size={16} className="text-emerald-400" />
            </div>
        </div>

        {/* Connecting Lines (Decorative) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[1px] bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent"></div>
            <div className="absolute w-[1px] h-[80%] bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent"></div>
        </div>
    </div>
);

const PrometheusHelpContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in text-white/90">

            <PrometheusGraphic />

            <div className="text-center mb-16">
                <h1 className="text-4xl font-light mb-4 text-white">Understanding <span className="text-brand-orange font-semibold">Prometheus AI</span></h1>
                <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                    Your intelligent partner in learning, designed to understand specifically what you are working on.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 relative">
                {/* Connecting line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-1/2 w-full h-[1px] bg-white/5 -translate-y-1/2 -translate-x-1/2 z-0"></div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-brand-blue-light/20 flex items-center justify-center mb-6 text-brand-blue-light">
                        <Box size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Object Oriented Context Engineering</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Instead of a generic AI that knows "everything about nothing specific", Prometheus treats every item on the platform—Courses, Lessons, Conversations, and Files—as a "Context Object".
                        <br /><br />
                        When you interact with Prometheus, it doesn't just look at what you type; it looks at the <strong>Collection</strong> you are in. It pulls in every Context Object within that collection to train itself instantly on exactly what matters to you right now.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center mb-6 text-brand-orange">
                        <Layers size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">The Power of Collections</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Collections are your way of defining the AI's "Brain" for a specific task. By sorting items into custom collections, you are effectively engineering the context for the AI.
                        <br /><br />
                        Add a course on Leadership and a PDF of your company's core values to a collection, and suddenly Prometheus becomes an expert on <em>your company's leadership style</em>.
                    </p>
                </div>
            </div>

            <div className="space-y-8 mb-16">
                <h2 className="text-2xl font-light border-b border-white/10 pb-4 mb-8">Standard Collections</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group p-6 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 mb-3 text-yellow-500">
                            <Star size={20} className="fill-current" />
                            <h3 className="font-bold text-white">Favorites</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            A single repository for the things you like most. Use this for quick access to your most-used content across the platform.
                        </p>
                    </div>

                    <div className="group p-6 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 mb-3 text-brand-blue-light">
                            <Folder size={20} className="fill-current opacity-50" />
                            <h3 className="font-bold text-white">Workspace</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            A temporary staging area. Working on an onboarding checklist? Move relevant courses here. Then ask the Collection AI to help you build your checklist based on those specific courses.
                        </p>
                    </div>

                    <div className="group p-6 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 mb-3 text-purple-400">
                            <Clock size={20} />
                            <h3 className="font-bold text-white">Watchlist</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Your "what to learn next" queue. Save courses or even pause an interesting AI conversation and save it here to pick it up exactly where you left off later.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-brand-blue-light/10 to-brand-orange/10 rounded-2xl p-8 border border-white/10">
                <div className="flex items-start gap-6">
                    <div className="p-3 bg-[#0f172a] rounded-xl border border-white/10 text-white shadow-lg hidden md:block">
                        <Lightbulb size={32} className="text-brand-orange" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Custom Collections: Your Specialized Assistants</h2>
                        <p className="text-slate-300 leading-relaxed">
                            You can create entirely new Collections for specific projects, objectives, or learning categories.
                            <br /><br />
                            For instance, create a "Project Alpha" collection. Add all lessons, documents, and notes related to it. Now, you have a meaningful, productive space where the Prometheus AI acts as a dedicated project consultant, always aware of the full context of Project Alpha.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PrometheusHelpContent;
