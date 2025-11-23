import { LucideIcon } from 'lucide-react';

export interface Course {
  id: number;
  title: string;
  author: string;
  progress: number;
  category: string;
  coverImage?: string;
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