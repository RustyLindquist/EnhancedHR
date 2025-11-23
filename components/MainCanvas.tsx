import React, { useRef } from 'react';
import { Filter, Search, Sparkles, Image, Upload } from 'lucide-react';
import CardStack from './CardStack';
import CollectionSurface from './CollectionSurface';
import { MOCK_COURSES, BACKGROUND_THEMES } from '../constants';
import { BackgroundTheme } from '../types';

interface MainCanvasProps {
  currentTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
}

const MainCanvas: React.FC<MainCanvasProps> = ({ currentTheme, onThemeChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        
        {/* --- Collection Interface (Header) --- */}
        <div className="h-24 flex flex-shrink-0 items-center justify-between px-10 border-b border-white/10 bg-white/5 backdrop-blur-xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">Academy Collection</span>
            </div>
            <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
              Course <span className="font-bold text-white">Catalog</span>
            </h1>
          </div>
          
          <div className="flex space-x-4 items-center">
            {/* Background Settings Dropdown (Simplified) */}
            <div className="group relative">
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all text-slate-400 hover:text-white">
                    <Image size={18} />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-12 w-48 bg-[#0f141c]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <span className="text-[10px] font-bold uppercase text-slate-500 px-2 py-1 block">Select Theme</span>
                    {BACKGROUND_THEMES.map(theme => (
                        <button 
                            key={theme.id}
                            onClick={() => onThemeChange(theme)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg mb-1 transition-colors ${currentTheme.id === theme.id ? 'bg-brand-blue-light/20 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                        >
                            {theme.label}
                        </button>
                    ))}
                    <div className="h-px bg-white/10 my-1"></div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg text-brand-blue-light hover:bg-brand-blue-light/10 flex items-center"
                    >
                        <Upload size={12} className="mr-2" /> Upload Custom
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

            <div className="h-6 w-px bg-white/10 mx-2"></div>

            <button className="group flex items-center px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all backdrop-blur-sm shadow-sm">
              <Filter size={14} className="mr-2 group-hover:text-brand-blue-light transition-colors" /> 
              Filters
            </button>
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue to-brand-blue-light rounded-full blur opacity-20 group-hover:opacity-50 transition duration-200"></div>
                <button className="relative flex items-center px-5 py-2.5 bg-black/40 border border-brand-blue-light/30 rounded-full text-xs font-medium text-brand-blue-light hover:bg-black/60 transition-all backdrop-blur-md">
                <Search size={14} className="mr-2" /> 
                Search
                </button>
            </div>
          </div>
        </div>

        {/* --- Canvas Content Grid --- */}
        {/* pb-48 ensures content isn't hidden behind the absolute footer */}
        <div className="flex-1 overflow-y-auto p-10 relative z-10 no-scrollbar pb-48">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-7xl mx-auto">
            
            {/* Promotional/Featured Area */}
            <div className="col-span-full mb-4 p-1 rounded-2xl bg-gradient-to-r from-brand-blue-light/30 via-white/5 to-transparent backdrop-blur-md">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-brand-blue/40 to-transparent rounded-xl border border-brand-blue-light/20 shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-brand-blue-light/20 text-brand-blue-light border border-brand-blue-light/30 shadow-[0_0_15px_rgba(120,192,240,0.3)]">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white drop-shadow-md">AI-Enhanced Learning</h3>
                            <p className="text-sm text-slate-200 opacity-90">Experience our new proactive tutor in the Leadership module.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white text-brand-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-blue-light hover:text-white transition-all shadow-md">
                        Explore
                    </button>
                </div>
            </div>

            {/* Cards */}
            {MOCK_COURSES.map((course) => (
              <CardStack key={course.id} {...course} />
            ))}
          </div>
        </div>

        {/* --- Collection Surface (Footer) --- */}
        {/* Positioned absolutely to sit on TOP of the canvas background */}
        <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none">
           <CollectionSurface />
        </div>

    </div>
  );
};

export default MainCanvas;