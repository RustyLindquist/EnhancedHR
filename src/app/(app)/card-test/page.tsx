'use client';

import React from 'react';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES } from '@/constants';
import UniversalCard from '@/components/cards/UniversalCard';
import ResourceCard from '@/components/cards/ResourceCard';

// Sample data for cards
const sampleCourse = {
  title: 'This is the course title',
  subtitle: 'By Dr. Sarah Chen',
  description: 'A comprehensive course on modern HR practices and strategies.',
  meta: '45 Min',
  rating: 4.9,
  credits: { shrm: true, hrci: true },
  categories: ['Leadership', 'HR'],
  imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
};

const sampleModule = {
  title: 'This is the module title',
  subtitle: 'By Dr. Sarah Chen',
  description: 'This is the course title',
  meta: '45 Min',
  imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
};

const sampleLesson = {
  title: 'This is the lesson title',
  subtitle: 'By Dr. Sarah Chen',
  description: 'This is the course title',
  meta: '45 Min',
  imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
};

const sampleActivity = {
  title: 'This is the activity title',
  subtitle: 'By Dr. Sarah Chen',
  description: 'This is the course title',
  imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
};

const sampleResource = {
  title: 'Course Handout Materials',
  author: 'Dr. Sarah Chen',
  courseTitle: 'This is the course title',
  fileSize: '2.4 MB',
};

export default function CardTestPage() {
  return (
    <div className="min-h-screen w-full relative">
      {/* Animated Background */}
      <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

      {/* Content */}
      <div className="relative z-10 p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Card Components</h1>
        <p className="text-white/60 mb-8">Existing card components displayed with the platform background</p>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[1600px]">
          {/* Course Card */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Course Card</p>
            <UniversalCard
              type="COURSE"
              title={sampleCourse.title}
              subtitle={sampleCourse.subtitle}
              description={sampleCourse.description}
              meta={sampleCourse.meta}
              rating={sampleCourse.rating}
              credits={sampleCourse.credits}
              categories={sampleCourse.categories}
              imageUrl={sampleCourse.imageUrl}
              onRemove={() => {}}
              onAdd={() => {}}
            />
          </div>

          {/* Module Card */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Module Card</p>
            <UniversalCard
              type="MODULE"
              title={sampleModule.title}
              subtitle={sampleModule.subtitle}
              description={sampleModule.description}
              meta={sampleModule.meta}
              imageUrl={sampleModule.imageUrl}
              onRemove={() => {}}
              onAdd={() => {}}
            />
          </div>

          {/* Lesson Card */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Lesson Card</p>
            <UniversalCard
              type="LESSON"
              title={sampleLesson.title}
              subtitle={sampleLesson.subtitle}
              description={sampleLesson.description}
              meta={sampleLesson.meta}
              imageUrl={sampleLesson.imageUrl}
              onRemove={() => {}}
              onAdd={() => {}}
            />
          </div>

          {/* Activity Card */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Activity Card</p>
            <UniversalCard
              type="ACTIVITY"
              title={sampleActivity.title}
              subtitle={sampleActivity.subtitle}
              description={sampleActivity.description}
              imageUrl={sampleActivity.imageUrl}
              onRemove={() => {}}
              onAdd={() => {}}
            />
          </div>

          {/* Course Resource Card */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Course Resource Card</p>
            <ResourceCard
              title={sampleResource.title}
              author={sampleResource.author}
              courseTitle={sampleResource.courseTitle}
              fileSize={sampleResource.fileSize}
              onRemove={() => {}}
              onAdd={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
