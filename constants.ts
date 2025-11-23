import { 
  BookOpen, 
  Layers, 
  FileText, 
  Star, 
  Search, 
  Clock, 
  Plus,
  LayoutDashboard,
  GraduationCap,
  Flame,
  Award,
  Building,
  MessageSquare
} from 'lucide-react';
import { Course, NavItemConfig, CollectionPortalConfig, BackgroundTheme } from './types';

export const MOCK_COURSES: Course[] = [
  { 
    id: 1, 
    title: "AI Leadership Strategies", 
    author: "Dr. Sarah Chen", 
    progress: 0, 
    category: "Leadership",
  },
  { 
    id: 2, 
    title: "Crisis Communication", 
    author: "Marcus Rodriguez", 
    progress: 35, 
    category: "Communication",
  },
  { 
    id: 3, 
    title: "The Future of HR Analytics", 
    author: "Elena Fisher", 
    progress: 0, 
    category: "Analytics",
  },
  { 
    id: 4, 
    title: "Strategic HR Management", 
    author: "James Wilson", 
    progress: 12, 
    category: "Strategy",
  },
  { 
    id: 5, 
    title: "Diversity & Inclusion", 
    author: "Maya Patel", 
    progress: 88, 
    category: "Culture",
  },
  { 
    id: 6, 
    title: "Change Management", 
    author: "Robert Fox", 
    progress: 0, 
    category: "Leadership",
  },
];

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'academy', label: 'Academy', icon: GraduationCap, isActive: true },
  { id: 'prometheus', label: 'Prometheus AI', icon: Flame, color: 'text-brand-orange' },
  { id: 'certifications', label: 'Certifications', icon: Award },
];

export const COLLECTION_NAV_ITEMS: NavItemConfig[] = [
  { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-brand-red' },
  { id: 'research', label: 'Research', icon: Search, color: 'text-brand-orange' },
  { id: 'to_learn', label: 'To Learn', icon: Clock, color: 'text-brand-blue-light' },
  { id: 'company', label: 'Company Collections', icon: Building, color: 'text-slate-400' },
  { id: 'new', label: 'New Collection', icon: Plus, color: 'text-brand-blue-light' },
];

export const CONVERSATION_NAV_ITEMS: NavItemConfig[] = [
  { id: 'chat-1', label: 'Tutor: Communicating Comp', icon: MessageSquare },
  { id: 'chat-2', label: 'Onboarding best practices', icon: MessageSquare },
  { id: 'chat-3', label: 'Course recommendations', icon: MessageSquare },
];

export const COLLECTION_PORTALS: CollectionPortalConfig[] = [
  { id: 'favorites', label: 'Favorites', icon: Star, color: '#FF2600' }, // Brand Red
  { id: 'research', label: 'Research', icon: Search, color: '#FF9300' }, // Brand Orange
  { id: 'to_learn', label: 'To Learn', icon: Clock, color: '#78C0F0' }, // Brand Light Blue
  { id: 'new', label: 'New / Other', icon: Plus, color: '#3b82f6' },    // Standard Blue
];

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { 
    id: 'deep-void', 
    label: 'Deep Void', 
    type: 'preset', 
    value: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1f2e] via-[#0A0D12] to-black' 
  },
  { 
    id: 'ocean-depths', 
    label: 'Ocean Depths', 
    type: 'preset', 
    value: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#054C74]/40 via-[#0A0D12] to-black' 
  },
  { 
    id: 'royal-nebula', 
    label: 'Royal Nebula', 
    type: 'preset', 
    value: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#4c1d95]/30 via-[#0A0D12] to-black' 
  },
  {
    id: 'ember-glow',
    label: 'Ember Glow',
    type: 'preset',
    value: 'bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-[#7f1d1d]/20 via-[#0A0D12] to-black'
  }
];