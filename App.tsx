import React, { useState } from 'react';
import NavigationPanel from './components/NavigationPanel';
import MainCanvas from './components/MainCanvas';
import AIPanel from './components/AIPanel';
import BackgroundSystem from './components/BackgroundSystem';
import { BACKGROUND_THEMES } from './constants';
import { BackgroundTheme } from './types';

const App: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
      
      {/* Global Background System */}
      {/* Placed first in DOM order to sit behind content. Z-index removed from component to avoid stacking context traps. */}
      <BackgroundSystem theme={currentTheme} />

      {/* Main Application Layer */}
      {/* relative z-10 ensures this layer sits ON TOP of the absolute background system */}
      <div className="flex w-full h-full relative z-10">
        {/* Left Navigation */}
        <NavigationPanel isOpen={leftOpen} setIsOpen={setLeftOpen} />

        {/* Center Content */}
        <MainCanvas currentTheme={currentTheme} onThemeChange={setCurrentTheme} />

        {/* Right AI Panel */}
        <AIPanel isOpen={rightOpen} setIsOpen={setRightOpen} />
      </div>
      
    </div>
  );
}

export default App;