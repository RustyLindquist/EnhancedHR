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
}

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  isActive?: boolean;
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
}

export interface BackgroundTheme {
  id: string;
  label: string;
  type: 'preset' | 'custom';
  value: string; // CSS class for preset, URL for custom
  overlayColor?: string; // Optional overlay to ensure text readability
}