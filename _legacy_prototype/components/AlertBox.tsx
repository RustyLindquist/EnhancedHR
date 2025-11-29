import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface AlertBoxProps {
  title: string;
  description: string;
  onDismiss: () => void;
  className?: string;
}

const AlertBox: React.FC<AlertBoxProps> = ({ title, description, onDismiss, className = '' }) => {
  return (
    <div 
        className={`col-span-full mb-4 p-1 rounded-2xl bg-gradient-to-r from-brand-blue-light/30 via-white/5 to-transparent backdrop-blur-md transition-all duration-500 ease-out transform ${className}`}
    >
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-brand-blue/40 to-transparent rounded-xl border border-brand-blue-light/20 shadow-lg relative overflow-hidden">
            
            <div className="flex items-center space-x-4 relative z-10">
                <div className="p-3 rounded-full bg-brand-blue-light/20 text-brand-blue-light border border-brand-blue-light/30 shadow-[0_0_15px_rgba(120,192,240,0.3)] animate-pulse-slow">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-md">{title}</h3>
                    <p className="text-sm text-slate-200 opacity-90 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                className="
                    relative z-10
                    px-4 py-2 
                    bg-white/10 text-slate-200 
                    border border-white/10 hover:border-white/30
                    hover:bg-white/20 hover:text-white 
                    text-xs font-bold uppercase tracking-wider 
                    rounded-lg transition-all duration-300 
                    shadow-md flex items-center gap-2
                    group
                "
            >
                <span>Dismiss</span>
                <X size={14} className="group-hover:text-brand-red transition-colors" />
            </button>
        </div>
    </div>
  );
};

export default AlertBox;