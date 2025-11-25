import React, { useState } from 'react';
import NavigationPanel from './components/NavigationPanel';
import MainCanvas from './components/MainCanvas';
import AIPanel from './components/AIPanel';
import BackgroundSystem from './components/BackgroundSystem';
import { BACKGROUND_THEMES, MOCK_COURSES, DEFAULT_COLLECTIONS } from './constants';
import { BackgroundTheme, Course, Collection } from './types';

const App: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
  
  // Lifted State: Courses source of truth
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  
  // Navigation & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string>('academy');
  const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);

  const handleUpdateCourse = (updatedCourses: Course[]) => {
      setCourses(updatedCourses);
  };

  const handleCreateCollection = (newCollection: Collection) => {
      setCustomCollections(prev => [...prev, newCollection]);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
      
      {/* Global Background System */}
      <BackgroundSystem theme={currentTheme} />

      {/* Main Application Layer */}
      <div className="flex w-full h-full relative z-10">
        {/* Left Navigation */}
        <NavigationPanel 
          isOpen={leftOpen} 
          setIsOpen={setLeftOpen} 
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          courses={courses}
          activeCollectionId={activeCollectionId}
          onSelectCollection={setActiveCollectionId}
        />

        {/* Center Content */}
        <MainCanvas 
            courses={courses}
            onUpdateCourses={handleUpdateCourse}
            activeCollectionId={activeCollectionId}
            onSelectCollection={setActiveCollectionId}
            customCollections={customCollections}
            onCreateCollection={handleCreateCollection}
        />

        {/* Right AI Panel */}
        <AIPanel isOpen={rightOpen} setIsOpen={setRightOpen} />
      </div>
      
    </div>
  );
}

export default App;