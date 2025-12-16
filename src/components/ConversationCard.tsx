import React, { useRef } from 'react';
import { MessageSquare, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { Conversation } from '../types';

interface ConversationCardProps extends Conversation {
    onClick?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
    id,
    title,
    lastMessage,
    updated_at,
    onClick,
    onDelete
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            className="relative group cursor-pointer w-full h-72 perspective-1000"
            onClick={() => onClick && onClick(id)}
        >
            {/* --- Main Card (Glass) --- */}
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                className="
                  relative w-full h-full z-20
                  bg-[#0f172a]/70
                  backdrop-blur-2xl 
                  border border-white/10
                  rounded-2xl flex flex-col
                  shadow-xl
                  transition-all duration-300 group-hover:-translate-y-2 
                  group-hover:shadow-[0_20px_40px_-12px_rgba(120,192,240,0.15)]
                  group-hover:border-white/20
                  overflow-hidden
                "
            >
                {/* --- Flashlight Effects --- */}
                <div
                    className="absolute inset-0 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.05), transparent 40%)`
                    }}
                ></div>

                {/* --- Header --- */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue-light/10 rounded-lg text-brand-blue-light">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight group-hover:text-brand-blue-light transition-colors line-clamp-2">
                                {title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                <Clock size={10} />
                                <span>{formatDate(updated_at || new Date().toISOString())}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Body --- */}
                <div className="flex-1 p-6 relative">
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 font-light">
                        {lastMessage}
                    </p>
                </div>

                {/* --- Footer --- */}
                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete && onDelete(id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-2 text-xs font-bold text-brand-blue-light uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                        Resume Conversation <ArrowRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationCard;
