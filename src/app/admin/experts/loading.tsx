import { Loader2 } from 'lucide-react';

export default function ExpertsLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Expert Management</h1>
                <p className="text-slate-400">Manage expert accounts, review applications, and track compensation metrics.</p>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
                {/* Animated loader container */}
                <div className="relative mb-8">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-20 h-20 rounded-full bg-brand-blue-light/20 animate-ping" />
                    {/* Inner container */}
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue-light/30 to-brand-blue-light/10 border border-brand-blue-light/30 flex items-center justify-center">
                        <Loader2 size={32} className="text-brand-blue-light animate-spin" />
                    </div>
                </div>

                {/* Loading text */}
                <div className="text-center max-w-md">
                    <h3 className="text-white font-semibold text-lg mb-3">
                        Loading Experts
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Please wait while we gather expert data and metrics.
                    </p>
                </div>

                {/* Subtle animated dots */}
                <div className="flex items-center gap-1.5 mt-6">
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
