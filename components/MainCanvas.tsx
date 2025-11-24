import React, { useRef, useState, useEffect } from 'react';
import { Filter, Search, Sparkles } from 'lucide-react';
import CardStack from './CardStack';
import CollectionSurface from './CollectionSurface';
import { MOCK_COURSES, COURSE_CATEGORIES } from '../constants';
import { Course } from '../types';

interface MainCanvasProps {}

// Added 'mounting' state to handle the "pre-enter" position explicitly
type TransitionState = 'idle' | 'exiting' | 'mounting' | 'entering';

// --- Lazy Load Wrapper Component ---
// This component defers rendering of its children until they are close to the viewport.
// It reserves the height to prevent layout shifts.
const LazyCourseCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible to save resources
        }
      },
      { 
        rootMargin: '600px', // Load content 600px before it enters viewport (smooth scroll)
        threshold: 0
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[28rem] w-full relative">
      {isVisible ? children : null}
    </div>
  );
};

const MainCanvas: React.FC<MainCanvasProps> = () => {
  
  // State for logic
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // State for Animation Control
  const [visibleCourses, setVisibleCourses] = useState<Course[]>(MOCK_COURSES);
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  
  // We use this key to force re-renders on the grid container if needed
  const [renderKey, setRenderKey] = useState(0);

  // Transition Engine
  useEffect(() => {
    // 1. Trigger Exit Animation
    setTransitionState('exiting');

    // 2. Wait for Exit Animation to complete (400ms matches the CSS duration + max delay)
    const exitTimeout = setTimeout(() => {
      // 3. Update Data
      const nextCourses = selectedCategory === 'All' 
        ? MOCK_COURSES 
        : MOCK_COURSES.filter(course => course.category === selectedCategory);
      
      setVisibleCourses(nextCourses);
      setRenderKey(prev => prev + 1); // Force fresh DOM for entering elements
      
      // 4. Set Mount State (Instant positioning at bottom, invisible)
      setTransitionState('mounting');

      // 5. Trigger Enter Animation (Next Frame)
      // Double RAF ensures the browser paints the 'mounting' state before applying 'entering'
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionState('entering');
          });
      });

      // 6. Cleanup to Idle (after Enter animation completes)
      // Max delay (15 * 50 = 750ms) + Duration (500ms) = 1250ms. 
      // We set safety buffer to 1400ms to ensure everything is settled.
      setTimeout(() => {
        setTransitionState('idle');
      }, 1400);

    }, 400); // Duration of the exit phase

    return () => clearTimeout(exitTimeout);
  }, [selectedCategory]);

  // Helper to get classes based on state - Mutually Exclusive to prevent conflicts
  const getTransitionClasses = () => {
    switch (transitionState) {
        case 'exiting':
            return 'opacity-0 -translate-y-8 blur-md scale-95'; // Float Up & Blur Out
        case 'mounting':
            return 'opacity-0 translate-y-12 blur-xl scale-105'; // Start at Bottom & Blurry
        case 'entering':
            return 'opacity-100 translate-y-0 blur-0 scale-100'; // Animate to Center & Sharp
        case 'idle':
            return 'opacity-100 translate-y-0 blur-0 scale-100'; // Stable state
        default:
            return 'opacity-100 translate-y-0 blur-0 scale-100';
    }
  };

  // Dynamic Collection Title Logic
  const getCollectionTitle = () => {
    if (selectedCategory === 'All') {
        return (
            <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
                All <span className="font-bold text-white">Courses</span>
            </h1>
        );
    }
    return (
        <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
            {selectedCategory} <span className="font-bold text-white">Courses</span>
        </h1>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        
        {/* --- Collection Interface (Header) --- */}
        {/* Fixed height h-24 to match side panels */}
        <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
            <div>
                <div className="flex items-center space-x-2 mb-1">
                {/* 
                    COLLECTION TYPE: Top-line descriptor. 
                */}
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">Academy Collection</span>
                </div>
                {/* 
                        COLLECTION TITLE: Specific title of the loaded collection.
                */}
                {getCollectionTitle()}
            </div>
        
            <div className="flex space-x-4 items-center">
                
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

        {/* --- Category Quick Filters Bar (Sticky/Fixed) --- */}
        {/* Moved OUTSIDE the scroll container to make it 'sticky' at the top */}
        <div className="flex-shrink-0 z-20 w-full max-w-7xl mx-auto px-10 pt-8 pb-8">
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-2">
                    <button 
                         onClick={() => setSelectedCategory('All')}
                         className={`
                            whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border
                            ${selectedCategory === 'All' 
                                ? 'bg-brand-blue-light/20 border-brand-blue-light text-white shadow-[0_0_15px_rgba(120,192,240,0.3)]' 
                                : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/10'}
                         `}
                    >
                        All
                    </button>
                    
                    <div className="h-4 w-px bg-white/10 mx-2"></div>

                    {COURSE_CATEGORIES.map((category) => (
                        <button 
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                                whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border
                                ${selectedCategory === category
                                    ? 'bg-brand-blue-light/20 border-brand-blue-light text-white shadow-[0_0_15px_rgba(120,192,240,0.3)]' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'}
                            `}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- Canvas Content Grid (Scrollable) --- */}
        {/* pb-48 ensures content isn't hidden behind the absolute footer */}
        {/* max-w-7xl mx-auto anchors the scrollbar to the content width, centering it in large views */}
        {/* pl-10 pr-6 provides the balanced margin for the scrollbar relative to the cards */}
        <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 relative z-10 custom-scrollbar">
          
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-2" key={renderKey}>
                
                {/* Promotional/Featured Area - Only show on 'All' view */}
                {selectedCategory === 'All' && (
                    <div 
                        className={`col-span-full mb-4 p-1 rounded-2xl bg-gradient-to-r from-brand-blue-light/30 via-white/5 to-transparent backdrop-blur-md transition-all duration-500 ease-out transform
                            ${transitionState === 'exiting' ? 'opacity-0 -translate-y-5 blur-md' : 'opacity-100 translate-y-0 blur-0'}
                        `}
                    >
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
                )}

                {/* Cards with High-Tech Materialization Effect + Lazy Loading */}
                {visibleCourses.length > 0 ? (
                    visibleCourses.map((course, index) => {
                        // Calculate staggered delay based on grid index
                        // We cap the index at 15 to prevent excessive waiting for bottom items during global transitions
                        const delay = Math.min(index, 15) * 50; 
                        
                        return (
                            <LazyCourseCard key={course.id}>
                                <div 
                                    style={{ 
                                        transitionDelay: `${delay}ms`,
                                    }}
                                    className={`
                                        transform transition-all duration-500 ease-out
                                        ${getTransitionClasses()}
                                    `}
                                >
                                    <CardStack {...course} />
                                </div>
                            </LazyCourseCard>
                        );
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                        <Search size={48} className="text-slate-600 mb-4" />
                        <p className="text-slate-400 text-lg">No courses found in this category.</p>
                        <button onClick={() => setSelectedCategory('All')} className="mt-4 text-brand-blue-light hover:underline">View All Courses</button>
                    </div>
                )}
                
            </div>
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