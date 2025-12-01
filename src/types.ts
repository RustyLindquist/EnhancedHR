/**
 * ==========================================
 * COLLECTION SYSTEM DOCUMENTATION
 * ==========================================
 *
 * # Collection Type
 * This is the top-line descriptor (e.g., "Academy Collection") designating what kind of collection is currently loaded into the Canvas.
 *
 * Defined Collection Types:
 * - Academy Collection: A collection of courses in the academy.
 * - Course Collection: A collection of modules, lessons, activities, quizzes, documents, or conversation starters within a course.
 * - Personal Collection: Any content saved to a provided (Favorites, Research, To Learn) or custom collection.
 * - Company Collection: Any content the Org has curated into a collection.
 * - AI Collection: A collection of past conversations with the AI (each showing up as a card).
 *
 * # Collection Title
 * This is the title of the collection displayed in the header.
 *
 * Title Logic:
 * - Academy Collections:
 *   - "All Courses": Unfiltered collection.
 *   - "Filtered Courses": Result of a filter/search.
 *   - "[Category] Courses": e.g., "Leadership Courses".
 * - Custom/Other Collections:
 *   - The default name (e.g., "Favorites") or the user-defined custom name.
 */

import { LucideIcon } from 'lucide-react';

export type CourseBadge = 'REQUIRED' | 'SHRM' | 'HRCI';

export interface Course {
  type: 'COURSE'; // Discriminator
  id: number;
  title: string;
  author: string;
  progress: number; // 0-100
  category: string;
  image?: string; // Featured image URL
  description: string;
  duration: string; // e.g., "2h 30m"
  rating: number; // 0.0 to 5.0
  badges: CourseBadge[];
  isSaved: boolean; // True if in a custom collection
  collections: string[]; // IDs of collections this course belongs to
  dateAdded: string; // ISO 8601 Date String YYYY-MM-DD
  status?: 'draft' | 'published' | 'archived';
}

export interface Collection {
  id: string;
  label: string;
  color: string;
  isCustom: boolean;
}

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  isActive?: boolean;
  role?: 'admin';
}

export interface CollectionPortalConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string; // Hex code
}

export enum PanelState {
  Expanded = 'expanded',
  Collapsed = 'collapsed',
}

export enum CollectionType {
  Course = 'COURSE',
  Module = 'MODULE',
  Lesson = 'LESSON',
  Conversation = 'CONVERSATION',
  Instructor = 'INSTRUCTOR',
}

export interface Instructor {
  type: 'INSTRUCTOR';
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  image: string; // Large portrait for card/page
  credentials: string[];
  stats: {
    courses: number;
    students: number;
    rating: number;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  featured?: boolean;
  collections?: string[]; // IDs of collections this instructor belongs to
}

export interface Message {
    id?: string;
    role: 'user' | 'model';
    content: string; // DB uses 'content', frontend used 'text' - we should standardize or map
    created_at?: string;
}

export interface Conversation {
    type: 'CONVERSATION'; // Discriminator
    id: string;
    title: string;
    created_at: string;
    updated_at?: string;
    lastMessage?: string; // Computed for UI
    messages?: Message[];
    collections?: string[]; // IDs of collections this conversation belongs to
    collectionId?: string; // If saved to a collection
    isSaved?: boolean;
    metadata?: Record<string, any>;
}

// The polymorphic Context Object (Card)
export type ContextCard = Course | Conversation | Instructor;

export interface BackgroundTheme {
  id: string;
  label: string;
  type: 'preset' | 'custom';
  value: string; // CSS class for preset, URL for custom
  overlayColor?: string; // Optional overlay to ensure text readability
}

// --- Quiz Types ---

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  explanation?: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number; // e.g. 80
}

export interface UserAssessmentAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  responses: Record<string, string>; // questionId -> optionId
  passed: boolean;
  created_at: string;
}

// --- Extended Course Details ---

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'article';
  video_url?: string; // Mux Playback ID
  content?: string; // Transcript or Article content
  quiz_data?: QuizData; // JSONB data for quizzes
  isCompleted: boolean; // User specific
}

export interface Module {
  id: string;
  title: string;
  duration: string; // Added duration
  lessons: Lesson[];
}

export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
  url: string;
  size?: string;
}

export type DragItemType = 'COURSE' | 'LESSON' | 'RESOURCE' | 'MODULE';

export interface DragItem {
  type: DragItemType;
  id: string | number;
  title?: string;
  subtitle?: string;
  image?: string; // For preview
}