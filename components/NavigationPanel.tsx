import React from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { MAIN_NAV_ITEMS, COLLECTION_NAV_ITEMS, CONVERSATION_NAV_ITEMS } from '../constants';
import { NavItemConfig } from '../types';

interface NavigationPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{ item: NavItemConfig; isOpen: boolean }> = ({ item, isOpen }) => {
  const Icon = item.icon;
  
  return (
    <div className={`
      group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1
      ${item.isActive 
        ? 'bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(120,192,240,0.1)] backdrop-blur-sm' 
        : 'hover:bg-white/5 border border-transparent hover:border-white/5'}
    `}>
      <div className={`relative flex items-center justify-center ${!isOpen ? 'w-full' : ''}`}>
        <Icon 
          size={20} 
          className={`
            transition-colors duration-200
            ${item.isActive ? 'text-brand-blue-light drop-shadow-[0_0_8px_rgba(120,192,240,0.5)]' : (item.color || 'text-slate-400')}
            ${!item.isActive && 'group-hover:text-slate-200'}
          `} 
        />
      </div>
      
      {isOpen && (
        <span className={`ml-3 text-sm font-medium tracking-wide truncate transition-colors ${item.isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
          {item.label}
        </span>
      )}
    </div>
  );
};

const NavigationPanel: React.FC<NavigationPanelProps> = ({ isOpen, setIsOpen }) => {
  return (
    <div className={`
      ${isOpen ? 'w-72' : 'w-20'} 
      flex-shrink-0 
      bg-white/[0.02] backdrop-blur-xl 
      border-r border-white/10 flex flex-col 
      transition-all duration-300 ease-in-out z-30 h-full
      shadow-[5px_0_30px_0_rgba(0,0,0,0.3)]
    `}>
      {/* Logo Area */}
      <div className="h-24 flex-shrink-0 flex items-center justify-center relative px-4 border-b border-white/5">
        <div className="flex items-center justify-center cursor-pointer group">
          {/* Custom SVG Logo - Blue Flame */}
          <div className="relative w-10 h-10 flex items-center justify-center">
             {/* Glow */}
             <div className="absolute inset-0 bg-brand-blue-light/20 blur-xl rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
             
             {/* Logo Icon */}
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(120,192,240,0.5)]">
                <path d="M14.5 2C14.5 2 9.5 5.5 9.5 10C9.5 12 11 13.5 11 13.5C11 13.5 7.5 13.5 5.5 11C4 8.5 5 5.5 5 5.5C2.5 8 2 12 3.5 15.5C5.5 19.5 10 22 13.5 21C17.5 20 21 15 21 10C21 5.5 18 3 14.5 2Z" fill="url(#flame_grad)" />
                <defs>
                  <linearGradient id="flame_grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#78C0F0" />
                    <stop offset="100%" stopColor="#054C74" />
                  </linearGradient>
                </defs>
             </svg>
          </div>

          {isOpen && (
            <div className="ml-3 animate-fade-in flex flex-col justify-center">
              <span className="text-xl font-light tracking-widest text-[#FF9300] leading-none drop-shadow-sm filter">
                ENHANCED
              </span>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="absolute -right-3 top-9 bg-slate-800/80 border border-white/20 rounded-full p-1 text-slate-400 hover:text-white hover:border-brand-blue-light/50 hover:shadow-[0_0_10px_rgba(120,192,240,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-8 no-scrollbar">
        
        {/* Main Navigation (Top) */}
        <div className="px-4 mb-8">
          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map(item => (
              <NavItem key={item.id} item={item} isOpen={isOpen} />
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="px-4 mb-8">
          {isOpen && (
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest pl-2 drop-shadow-sm">
              My Collections
            </h4>
          )}
          <div className="space-y-1">
            {COLLECTION_NAV_ITEMS.map(item => (
              <NavItem key={item.id} item={item} isOpen={isOpen} />
            ))}
          </div>
        </div>

        {/* Conversations */}
        <div className="px-4">
          {isOpen && (
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest pl-2 drop-shadow-sm">
              Conversations
            </h4>
          )}
          <div className="space-y-1">
            {CONVERSATION_NAV_ITEMS.map(item => (
              <NavItem key={item.id} item={item} isOpen={isOpen} />
            ))}
          </div>
        </div>
      </div>
      
      {/* User Profile Summary (Bottom) */}
      <div className="h-28 flex-shrink-0 p-4 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm flex items-center justify-center">
        <div className={`flex items-center ${!isOpen ? 'justify-center' : 'w-full'} cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0">
            JD
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate drop-shadow-sm">Jane Doe</p>
              <p className="text-xs text-slate-500 truncate">HR Manager</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;