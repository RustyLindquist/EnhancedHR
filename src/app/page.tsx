'use client';

import React, { useState, useEffect } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import MainCanvas from '@/components/MainCanvas';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import AddCollectionModal from '@/components/AddCollectionModal';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course, Collection } from '@/types';
import { fetchCourses } from '@/lib/courses';

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

  // Lifted State: Courses source of truth
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const data = await fetchCourses();
      setCourses(data);
      setIsLoading(false);
    }
    loadCourses();
  }, []);

  // Navigation & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string>('dashboard');
  const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);

  // Global Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState<Course | null>(null);

  const handleUpdateCourse = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
  };

  const handleCreateCollection = (newCollection: Collection) => {
    setCustomCollections(prev => [...prev, newCollection]);
  };

  // Logic to handle saving (triggered from Modal)
  const handleSaveToCollection = (selectedCollectionIds: string[], newCollection?: { label: string; color: string }) => {
    // 1. Handle New Collection Creation
    if (newCollection) {
      const newId = `custom-${Date.now()}`;
      const created = { id: newId, label: newCollection.label, color: newCollection.color, isCustom: true };
      handleCreateCollection(created);
      // Add new ID to selection
      if (!selectedCollectionIds.includes(newId)) {
        selectedCollectionIds.push(newId);
      }
    }

    // 2. Update Course Logic (Only if a course was selected)
    if (modalCourse) {
      const updatedCourses = courses.map(c => {
        if (c.id === modalCourse.id) {
          return {
            ...c,
            collections: selectedCollectionIds,
            isSaved: selectedCollectionIds.length > 0
          };
        }
        return c;
      });
      handleUpdateCourse(updatedCourses);
    }

    setIsAddModalOpen(false);
    setModalCourse(null);
  };

  const handleOpenModal = (course?: Course) => {
    setModalCourse(course || null);
    setIsAddModalOpen(true);
  };

  const handleSelectCollection = (id: string) => {
    if (id === 'new') {
      // Instead of navigating, open the "Create Collection" modal
      handleOpenModal(undefined);
    } else {
      setActiveCollectionId(id);
    }
  };

  // Immediate save (for drag and drop on existing portals)
  const handleImmediateAddToCollection = (courseId: number, collectionId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const currentCollections = course.collections || [];
      if (!currentCollections.includes(collectionId)) {
        const updatedCollections = [...currentCollections, collectionId];

        const updatedCourses = courses.map(c => {
          if (c.id === courseId) {
            return {
              ...c,
              collections: updatedCollections,
              isSaved: true
            };
          }
          return c;
        });
        handleUpdateCourse(updatedCourses);
      }
    }
  };

  // AI Panel State
  const [aiPanelPrompt, setAiPanelPrompt] = useState('');

  const handleOpenAIPanel = () => {
    setRightOpen(true);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">

      {/* Global Background System */}
      <BackgroundSystem theme={currentTheme} />

      {/* Global Modals */}
      {isAddModalOpen && (
        <AddCollectionModal
          course={modalCourse}
          availableCollections={customCollections}
          onClose={() => {
            setIsAddModalOpen(false);
            setModalCourse(null);
          }}
          onSave={handleSaveToCollection}
        />
      )}

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
          onSelectCollection={handleSelectCollection}
        />

        {/* Center Content */}
        <MainCanvas
          courses={courses}
          activeCollectionId={activeCollectionId}
          onSelectCollection={setActiveCollectionId}
          customCollections={customCollections}
          onOpenModal={handleOpenModal}
          onImmediateAddToCollection={handleImmediateAddToCollection}
          onOpenAIPanel={handleOpenAIPanel}
          onSetAIPrompt={setAiPanelPrompt}
        />

        {/* Right AI Panel */}
        <AIPanel
          isOpen={rightOpen}
          setIsOpen={setRightOpen}
          initialPrompt={aiPanelPrompt}
        />
      </div>

    </div>
  );
}
