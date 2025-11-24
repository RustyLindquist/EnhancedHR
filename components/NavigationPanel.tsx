import React, { useState, useRef, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight, ChevronDown, User, Settings, Image as ImageIcon, LogOut, Upload, Check, ArrowLeft } from 'lucide-react';
import { MAIN_NAV_ITEMS, COLLECTION_NAV_ITEMS, CONVERSATION_NAV_ITEMS, BACKGROUND_THEMES } from '../constants';
import { NavItemConfig, BackgroundTheme } from '../types';

interface NavigationPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
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

const NavigationPanel: React.FC<NavigationPanelProps> = ({ isOpen, setIsOpen, currentTheme, onThemeChange }) => {
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'backgrounds'>('main');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        // Optional: Reset to main view when closing so it's fresh next time
        setMenuView('main'); 
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onThemeChange({
        id: 'custom-upload',
        label: 'Custom',
        type: 'custom',
        value: imageUrl
      });
      // Close menu or return to main?
      // For better UX, let's keep it open so they see the result, or close it.
      // Let's close the popup to show the new background clearly.
      setIsProfileMenuOpen(false);
    }
  };

  return (
    <div className={`
      ${isOpen ? 'w-72' : 'w-20'} 
      flex-shrink-0 
      bg-white/[0.02] backdrop-blur-xl 
      border-r border-white/10 flex flex-col 
      transition-all duration-300 ease-in-out z-[100] h-full
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
          className="absolute -right-3 top-9 bg-[#5694C7] border border-white/20 rounded-full p-1 text-white hover:bg-[#5694C7]/90 hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
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
            <div 
              className="flex items-center justify-between mb-4 pl-2 cursor-pointer group select-none"
              onClick={() => setIsConversationsOpen(!isConversationsOpen)}
            >
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest drop-shadow-sm group-hover:text-slate-300 transition-colors">
                  Conversations
                </h4>
                <div className="text-slate-500 group-hover:text-white transition-colors">
                    {isConversationsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
            </div>
          )}
          
          <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isConversationsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            {CONVERSATION_NAV_ITEMS.map(item => (
              <NavItem key={item.id} item={item} isOpen={isOpen} />
            ))}
          </div>
        </div>
      </div>
      
      {/* User Profile Summary (Bottom) */}
      <div 
        ref={profileRef}
        className="h-28 flex-shrink-0 p-4 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm flex items-center justify-center relative"
      >
        
        {/* --- Popup Menu --- */}
        {isProfileMenuOpen && (
          <div className={`
             absolute bottom-full mb-4 z-[120]
             bg-[#0f141c]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden
             transition-all duration-200 animate-fade-in
             ${isOpen ? 'left-4 w-64' : 'left-20 w-64'}
          `}>
             {menuView === 'main' ? (
                /* MAIN MENU VIEW */
                <div className="py-2">
                   <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-sm font-bold text-white">Jane Doe</p>
                      <p className="text-xs text-slate-400">HR Manager</p>
                   </div>
                   
                   <button className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={16} className="mr-3 text-slate-400" />
                      My Profile
                   </button>
                   
                   <button className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Settings size={16} className="mr-3 text-slate-400" />
                      Settings
                   </button>
                   
                   <button 
                      onClick={() => setMenuView('backgrounds')}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                   >
                      <div className="flex items-center">
                         <ImageIcon size={16} className="mr-3 text-slate-400" />
                         Backgrounds
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                   </button>
                   
                   <div className="h-px bg-white/5 my-1 mx-2"></div>
                   
                   <button className="w-full flex items-center px-4 py-2.5 text-sm text-brand-red hover:bg-brand-red/10 transition-colors">
                      <LogOut size={16} className="mr-3" />
                      Log Out
                   </button>
                </div>
             ) : (
                /* BACKGROUNDS SELECTION VIEW */
                <div className="flex flex-col h-full max-h-[400px]">
                   <div className="flex items-center px-2 py-3 border-b border-white/5">
                      <button 
                         onClick={() => setMenuView('main')}
                         className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors mr-2"
                      >
                         <ArrowLeft size={16} />
                      </button>
                      <span className="text-sm font-bold text-white">Select Background</span>
                   </div>
                   
                   <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {BACKGROUND_THEMES.map(theme => (
                         <button 
                            key={theme.id}
                            onClick={() => onThemeChange(theme)}
                            className={`
                               w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all border border-transparent
                               ${currentTheme.id === theme.id 
                                  ? 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/20' 
                                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                               }
                            `}
                         >
                            <span>{theme.label}</span>
                            {currentTheme.id === theme.id && <Check size={14} />}
                         </button>
                      ))}
                      
                      <div className="h-px bg-white/10 my-2"></div>
                      
                      <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                      >
                          <Upload size={14} className="mr-2" /> Upload Custom
                      </button>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleFileUpload}
                      />
                   </div>
                </div>
             )}
          </div>
        )}

        <div 
           className={`
             relative group flex items-center ${!isOpen ? 'justify-center' : 'w-full'} 
             cursor-pointer p-3 rounded-2xl transition-all duration-500
             overflow-hidden
           `}
           onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              if (isProfileMenuOpen) setMenuView('main'); // Reset to main when closing
           }}
        >
          
          {/* --- Portal Glow Effect Background --- */}
          <div className={`absolute inset-0 bg-brand-blue-light/10 opacity-0 group-hover:opacity-100 ${isProfileMenuOpen ? 'opacity-100 bg-white/10' : ''} transition-opacity duration-500 blur-xl`}></div>
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand-blue-light/30 rounded-full blur-[25px] opacity-0 group-hover:opacity-60 transition-all duration-700 mix-blend-screen"></div>

          {/* Border/Container that appears on hover */}
          <div className={`absolute inset-0 rounded-2xl border border-white/5 group-hover:border-white/20 group-hover:bg-white/5 ${isProfileMenuOpen ? 'border-brand-blue-light/30 bg-white/5' : ''} transition-all duration-500`}></div>

          {/* Content */}
          <div className="relative z-10 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0 group-hover:scale-105 transition-transform duration-300">
              JD
            </div>
            {isOpen && (
              <div className="ml-3 overflow-hidden">
                <p className={`text-base font-semibold text-white truncate drop-shadow-sm group-hover:text-brand-blue-light transition-colors ${isProfileMenuOpen ? 'text-brand-blue-light' : ''}`}>Jane Doe</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;