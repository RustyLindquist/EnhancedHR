import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Check, ChevronDown, RefreshCw, Plus, ChevronRight, GraduationCap, Layers, Flame, MessageSquare, Sparkles, Building, Users, Lightbulb, Trophy, Info, FileText, Monitor, HelpCircle, Folder, BookOpen, Award, Clock, Zap, Trash, Edit, MoreHorizontal, Settings, TrendingUp, Download, StickyNote, ArrowLeft, Star, Target, Bookmark } from 'lucide-react';
import { exportConversationAsMarkdown } from '@/lib/export-conversation';
import CardStack from './CardStack';
import UniversalCard from './cards/UniversalCard';
import CollectionSurface from './CollectionSurface';
import TeamManagement from '@/components/org/TeamManagement';
import UsersAndGroupsCanvas from '@/components/org/UsersAndGroupsCanvas';
import AssignedLearningCanvas from '@/components/org/AssignedLearningCanvas';
import GroupManagement from '@/components/org/GroupManagement';
import DynamicGroupCriteriaPanel from '@/components/org/DynamicGroupCriteriaPanel';
import AlertBox from './AlertBox';
import CourseHomePage from './CourseHomePage'; // Import Course Page (legacy)
import CoursePlayer from './CoursePlayer'; // (legacy)
import { CoursePageV2 } from './course'; // New unified course page
import UserDashboardV3 from './Dashboard/UserDashboardV3';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import OrgAdminDashboard from './Dashboard/OrgAdminDashboard';
import { COURSE_CATEGORIES, COLLECTION_NAV_ITEMS, generateMockResources } from '../constants'; // Import generator
import { fetchCourseModules, fetchUserCourseProgress } from '../lib/courses';
import { createClient } from '@/lib/supabase/client';
import { Course, Collection, Module, DragItem, Resource, ContextCard, Conversation, ToolConversation, UserContextItem, ContextItemType, HelpTopic, LessonSearchResult, Note, Tool } from '../types';
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';
import { deleteContextItem } from '@/app/actions/context';
import { deleteCollection, renameCollection } from '@/app/actions/collections';
import { searchLessonsAction } from '@/app/actions/courses';
import { getNotesAction, createNoteAction, addNoteToCollectionAction } from '@/app/actions/notes';
import NoteEditorPanel from './NoteEditorPanel';
import PrometheusFullPage from './PrometheusFullPage';
import ConversationCard from './ConversationCard';
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Updated import
import InstructorCard from './InstructorCard';
import InstructorPage from './InstructorPage';
import { MOCK_INSTRUCTORS } from '../constants';
import { Instructor } from '../types';
import UniversalCollectionCard, { CollectionItemDetail } from './UniversalCollectionCard';
import TopContextPanel from './TopContextPanel';
import GlobalTopPanel from './GlobalTopPanel';
import PrometheusDashboardWidget from './PrometheusDashboardWidget';
import PrometheusHelpContent from './PrometheusHelpContent';
import HelpPanel from './help/HelpPanel';
import { HelpTopicId } from './help/HelpContent';
import ToolsCollectionView from './tools/ToolsCollectionView';
import { fetchToolsAction } from '@/app/actions/tools';

// Org Collection type for display
interface OrgCollectionInfo {
    id: string;
    label: string;
    color: string;
    item_count: number;
}

interface MainCanvasProps {
    courses: Course[];
    activeCollectionId: string;
    onSelectCollection: (id: string) => void;
    customCollections: Collection[];
    onOpenModal: (item?: ContextCard) => void;
    onImmediateAddToCollection: (courseId: number, collectionId: string) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
    onCourseSelect?: (courseId: string | null) => void;
    initialCourseId?: number | null;
    onResumeConversation?: (conversation: Conversation) => void;
    activeConversationId?: string | null;
    onClearConversation?: () => void;
    useDashboardV3?: boolean;
    onCollectionUpdate?: () => void;
    academyResetKey?: number; // Triggers filter reset when Academy is clicked
    initialStatusFilter?: string[]; // Pre-apply status filter when navigating to Academy
    onNavigateWithFilter?: (collectionId: string, statusFilter: string[]) => void;
    previousCollectionId?: string | null; // Previous page for back navigation
    onGoBack?: () => void; // Handler to go back to previous page
    onExposeDragStart?: (handler: (item: DragItem) => void) => void; // Expose drag start handler to parent
    orgCollections?: OrgCollectionInfo[]; // Organization collections
    isOrgAdmin?: boolean; // Whether user can edit org collections
    onOrgCollectionsUpdate?: () => void; // Callback when org collections change
}

// Added 'mounting' state to handle the "pre-enter" position explicitly
type TransitionState = 'idle' | 'exiting' | 'mounting' | 'entering';

type DateFilterType = 'ALL' | 'SINCE_LOGIN' | 'THIS_MONTH' | 'LAST_X_DAYS';

type RatingFilterType = 'ALL' | '4_PLUS' | '3_PLUS' | '2_PLUS' | '1_PLUS' | 'NOT_RATED';

// Filter State Interface
interface FilterState {
    searchQuery: string;
    category: string; // Changed from categories[] to single category for now as per UI
    credits: string[]; // 'SHRM', 'HRCI'
    designations: string[]; // 'REQUIRED', 'RECOMMENDED'
    status: string[]; // 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
    ratingFilter: RatingFilterType;
    dateFilterType: DateFilterType;
    customDays: string; // Stored as string to handle empty input easily
    includeLessons: boolean; // Include individual lessons in search results
}

const INITIAL_FILTERS: FilterState = {
    searchQuery: '',
    category: 'All', // Default to 'All'
    credits: [],
    designations: [],
    status: [],
    ratingFilter: 'ALL',
    dateFilterType: 'ALL',
    customDays: '30',
    includeLessons: false // Default to courses only
};

// --- VISUAL COMPONENTS ---

const ConversationVisual = () => (
    <div className="flex justify-center gap-6 opacity-80 select-none pointer-events-none scale-90">
        {/* Card 1 - Left - Tilted */}
        <div className="w-64 h-56 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-4 gap-3 transform -rotate-6 translate-y-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center">
                    <Flame size={12} className="text-brand-orange" />
                </div>
                <div className="w-24 h-2 bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-3 pt-1">
                <div className="w-3/4 h-10 bg-white/5 rounded-lg rounded-tl-none border border-white/5"></div>
                <div className="w-1/2 h-8 bg-brand-blue-light/10 rounded-lg rounded-tr-none border border-brand-blue-light/10 ml-auto"></div>
                <div className="w-2/3 h-10 bg-white/5 rounded-lg rounded-tl-none border border-white/5"></div>
            </div>
        </div>

        {/* Card 2 - Center - Front */}
        <div className="w-64 h-56 rounded-xl border border-white/20 bg-[#0f172a] shadow-2xl flex flex-col p-4 gap-3 transform -translate-y-2 z-10 relative">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-blue-light rounded-full flex items-center justify-center shadow-lg border border-white/20">
                <MessageSquare size={16} className="text-brand-black fill-current" />
            </div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <div className="w-20 h-2 bg-slate-600 rounded-full"></div>
            </div>
            <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex-shrink-0 flex items-center justify-center">
                        <Flame size={10} className="text-brand-orange" />
                    </div>
                    <div className="w-full h-16 bg-white/5 rounded-lg rounded-tl-none border border-white/5 p-2 flex flex-col gap-1.5 justify-center">
                        <div className="w-11/12 h-1.5 bg-slate-700 rounded-full"></div>
                        <div className="w-3/4 h-1.5 bg-slate-700 rounded-full"></div>
                        <div className="w-5/6 h-1.5 bg-slate-700 rounded-full"></div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="w-2/3 h-10 bg-brand-blue-light/10 rounded-lg rounded-tr-none border border-brand-blue-light/10 p-2 flex items-center justify-end">
                        <div className="w-3/4 h-1.5 bg-brand-blue-light/30 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Card 3 - Right - Tilted */}
        <div className="w-64 h-56 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-4 gap-3 transform rotate-6 translate-y-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center">
                    <Flame size={12} className="text-brand-orange" />
                </div>
                <div className="w-16 h-2 bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-3 pt-1">
                <div className="w-5/6 h-12 bg-white/5 rounded-lg rounded-tl-none border border-white/5"></div>
                <div className="w-1/2 h-8 bg-brand-blue-light/10 rounded-lg rounded-tr-none border border-brand-blue-light/10 ml-auto"></div>
            </div>
        </div>
    </div>
);

const CompanyVisual = () => (
    <div className="flex justify-center gap-8 opacity-80 select-none pointer-events-none scale-90">
        {/* Card 1: Users */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-5 gap-4 transform -rotate-6 translate-y-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/10 rounded-bl-full"></div>
            <div className="w-10 h-10 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                <Users size={20} />
            </div>
            <div className="space-y-2 mt-2">
                <div className="w-3/4 h-3 bg-white/10 rounded"></div>
                <div className="w-1/2 h-3 bg-white/10 rounded"></div>
            </div>
            <div className="mt-auto space-y-2">
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-[#0f172a]"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-600 border border-[#0f172a]"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-500 border border-[#0f172a]"></div>
                </div>
                <div className="w-full h-12 bg-white/5 rounded-lg border border-white/5"></div>
            </div>
        </div>

        {/* Card 2: Main Collection (Center) */}
        <div className="w-56 h-72 rounded-xl border border-brand-blue-light/30 bg-[#0f172a] shadow-2xl flex flex-col p-6 gap-4 transform -translate-y-2 z-10 relative">
            <div className="w-12 h-12 rounded-lg bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light mb-2">
                <Building size={24} />
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full"></div>
            <div className="w-2/3 h-2 bg-white/10 rounded-full"></div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded bg-slate-700"></div>
                    <div className="flex-1 h-2 bg-slate-600 rounded"></div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded bg-slate-700"></div>
                    <div className="flex-1 h-2 bg-slate-600 rounded"></div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded bg-slate-700"></div>
                    <div className="flex-1 h-2 bg-slate-600 rounded"></div>
                </div>
            </div>
        </div>

        {/* Card 3: Reward/Trophy */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-5 gap-4 transform rotate-6 translate-y-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full"></div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Trophy size={20} />
            </div>
            <div className="space-y-2 mt-2">
                <div className="w-full h-3 bg-white/10 rounded"></div>
                <div className="w-2/3 h-3 bg-white/10 rounded"></div>
            </div>
            <div className="mt-auto flex justify-center items-center h-24 bg-white/5 rounded-lg border border-white/5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/40 to-blue-500/40 blur-md"></div>
                <Trophy size={32} className="absolute text-white/80 drop-shadow-lg" />
            </div>
        </div>
    </div>
);

const InstructorVisual = () => (
    <div className="flex justify-center gap-6 opacity-80 select-none pointer-events-none scale-90">
        {/* Card 1: Profile (Left, Tilted) */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-0 overflow-hidden transform -rotate-6 translate-y-8 backdrop-blur-sm relative">
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 opacity-50"></div>
            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="w-2/3 h-3 bg-white/20 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-white/10 rounded"></div>
            </div>
        </div>

        {/* Card 2: Main Instructor (Center) */}
        <div className="w-60 h-72 rounded-xl border border-brand-blue-light/30 bg-[#0f172a] shadow-2xl flex flex-col p-6 gap-4 transform -translate-y-2 z-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-blue-light/10 rounded-bl-full"></div>

            <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-brand-blue-light/20 mx-auto mb-2 flex items-center justify-center">
                <Users size={32} className="text-brand-blue-light" />
            </div>

            <div className="space-y-3 text-center">
                <div className="w-3/4 h-4 bg-white/20 rounded mx-auto"></div>
                <div className="w-1/2 h-3 bg-brand-blue-light/20 rounded mx-auto"></div>
            </div>

            <div className="mt-auto flex justify-between items-center px-2">
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 rounded-full"></div>
                </div>
            </div>
        </div>

        {/* Card 3: Course List (Right, Tilted) */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-4 gap-3 transform rotate-6 translate-y-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <div className="w-6 h-6 rounded bg-brand-blue-light/20 flex items-center justify-center">
                    <BookOpen size={12} className="text-brand-blue-light" />
                </div>
                <div className="w-20 h-2 bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-2 pt-1">
                <div className="w-full h-8 bg-white/5 rounded border border-white/5"></div>
                <div className="w-full h-8 bg-white/5 rounded border border-white/5"></div>
                <div className="w-full h-8 bg-white/5 rounded border border-white/5"></div>
            </div>
        </div>
    </div>
);

const GenericVisual = () => (
    <div className="flex justify-center gap-6 opacity-40 select-none pointer-events-none">
        {[1, 2, 3].map((i) => (
            <div key={i} className={`
                w-48 h-64 rounded-xl border-2 border-dashed border-slate-500/50 bg-white/5
                flex flex-col p-4 gap-3 transform
                ${i === 1 ? '-rotate-6 translate-y-4' : i === 2 ? 'translate-y-0 z-10 scale-105' : 'rotate-6 translate-y-4'}
            `}>
                <div className="w-full h-24 bg-slate-500/20 rounded-lg"></div>
                <div className="w-3/4 h-2 bg-slate-500/20 rounded"></div>
                <div className="w-1/2 h-2 bg-slate-500/20 rounded"></div>
                <div className="mt-auto flex justify-between">
                    <div className="w-8 h-8 rounded-full bg-slate-500/20"></div>
                    <div className="w-16 h-8 rounded-lg bg-slate-500/20"></div>
                </div>
            </div>
        ))}
    </div>
);

const HelpVisual = () => (
    <div className="flex justify-center gap-6 opacity-80 select-none pointer-events-none scale-90">
        {/* Card 1: Left - Tilted */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-5 gap-4 transform -rotate-6 translate-y-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#4B8BB3]/10 rounded-bl-full"></div>
            <div className="w-10 h-10 rounded-lg bg-[#4B8BB3]/20 flex items-center justify-center text-[#4B8BB3]">
                <Sparkles size={20} />
            </div>
            <div className="space-y-2 mt-2">
                <div className="w-3/4 h-3 bg-white/10 rounded"></div>
                <div className="w-1/2 h-3 bg-white/10 rounded"></div>
            </div>
            <div className="mt-auto">
                <div className="w-full h-16 bg-white/5 rounded-lg border border-white/5 p-3">
                    <div className="w-full h-1.5 bg-[#4B8BB3]/30 rounded-full mb-2"></div>
                    <div className="w-3/4 h-1.5 bg-white/10 rounded-full"></div>
                </div>
            </div>
        </div>

        {/* Card 2: Center - Main Feature Card */}
        <div className="w-56 h-72 rounded-xl border border-[#4B8BB3]/30 bg-[#0f172a] shadow-2xl flex flex-col p-6 gap-4 transform -translate-y-2 z-10 relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#4B8BB3] rounded-full flex items-center justify-center shadow-lg border border-white/20">
                <HelpCircle size={20} className="text-white" />
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#4B8BB3]/20 flex items-center justify-center text-[#4B8BB3] mb-2">
                <Lightbulb size={24} />
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full"></div>
            <div className="w-2/3 h-2 bg-white/10 rounded-full"></div>

            <div className="mt-auto space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                    <div className="w-6 h-6 rounded bg-[#4B8BB3]/30"></div>
                    <div className="flex-1 h-2 bg-white/20 rounded"></div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-6 h-6 rounded bg-slate-700"></div>
                    <div className="flex-1 h-2 bg-slate-600 rounded"></div>
                </div>
            </div>
        </div>

        {/* Card 3: Right - Tilted */}
        <div className="w-48 h-64 rounded-xl border border-white/10 bg-[#0f172a] shadow-xl flex flex-col p-5 gap-4 transform rotate-6 translate-y-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/10 rounded-bl-full"></div>
            <div className="w-10 h-10 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                <Flame size={20} />
            </div>
            <div className="space-y-2 mt-2">
                <div className="w-full h-3 bg-white/10 rounded"></div>
                <div className="w-2/3 h-3 bg-white/10 rounded"></div>
            </div>
            <div className="mt-auto">
                <div className="w-full h-16 bg-white/5 rounded-lg border border-white/5 p-3">
                    <div className="w-3/4 h-1.5 bg-brand-orange/20 rounded-full mb-2"></div>
                    <div className="w-1/2 h-1.5 bg-white/10 rounded-full"></div>
                </div>
            </div>
        </div>
    </div>
);

// --- INFO CONTENT COMPONENT ---

interface CollectionInfoProps {
    type: string;
    isEmptyState: boolean;
    onSetPrometheusPagePrompt?: (prompt: string) => void;
    onOpenDrawer?: () => void; // Recycled for opening prompt drawer
    onOpenHelp?: () => void;
}

const CollectionInfo: React.FC<CollectionInfoProps> = ({ type, isEmptyState, onSetPrometheusPagePrompt, onOpenDrawer, onOpenHelp }) => {
    // Helper for alignment: Centered if empty state, otherwise left aligned (but container centered)
    const alignmentClass = isEmptyState ? 'text-center' : 'text-left';
    const headerClass = 'text-center'; // Headers usually look best centered above content blocks

    if (type === 'conversations') {
        const platformCardTitleClass = "text-red-500"; // Red title as requested

        return (
            <div className={`w-full max-w-6xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>

                {/* EMPTY STATE */}
                {isEmptyState && (
                    <>
                        <div className="pt-[50px]"></div>

                        {/* Prometheus Dashboard Widget */}
                        <div className="mb-8">
                            {onSetPrometheusPagePrompt && onOpenDrawer ? (
                                <PrometheusDashboardWidget
                                    onSetPrometheusPagePrompt={onSetPrometheusPagePrompt}
                                    onOpenDrawer={onOpenDrawer}
                                />
                            ) : null}
                        </div>

                        <div className="pt-[100px]"></div>

                        <div className="max-w-2xl mx-auto space-y-4">
                            <p className={`text-slate-300 text-base font-light leading-relaxed ${alignmentClass}`}>
                                This is where you'll find your conversation history with Prometheus, your AI assistant for deeply personalized learning. Start your first conversation now!
                            </p>

                            <p className={`text-slate-500 text-sm ${alignmentClass} pb-[50px]`}>
                                Note: You can access Prometheus from several places.
                            </p>
                        </div>




                    </>
                )}

                {/* POPULATED STATE (in footer) */}
                {!isEmptyState && (
                    <>
                        <div className="pt-[50px]"></div>
                        <div className="text-center mb-10">
                            <button onClick={onOpenHelp} className="text-brand-blue-light hover:text-white underline text-lg font-light transition-colors">
                                Learn how to make the most out of Prometheus AI
                            </button>
                        </div>
                    </>
                )}

                {/* Cards - Show for Empty State (as per spec item 9) logic implies these are always here? 
                   User said: "If they have any conversations ... Show ... 50px ... Link".
                   The cards were mentioned in Empty State list item 9.
                   They were NOT explicitly mentioned for Populated State list, but "Learn how to..." might replace them or sit below?
                   Existing code showed cards. I will keep cards for empty state. 
                   For populated state, the user instruction was specific: Padding -> Images (Footer handles this) -> Padding -> Link.
                   So cards are probably empty state only or hidden behind the link?
                   Let's keep cards for Empty State as requested. 
                */}

                {isEmptyState && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <h3 className="text-brand-blue-light font-bold mb-3 flex items-center gap-2">
                                    <GraduationCap size={18} /> Within a Course
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Prometheus will answer questions about the course, summarize it, highlight key principles, interactively assess your understanding, or even act as a personal tutor to learn and apply the lessons in the course.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <h3 className="text-brand-orange font-bold mb-3 flex items-center gap-2">
                                    <Layers size={18} /> Within a Collection
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Prometheus is trained on everything you place in a collection, so you can ask it questions specific to the content you’ve organized within that collection.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <h3 className={`${platformCardTitleClass} font - bold mb - 3 flex items - center gap - 2`}>
                                    <Flame size={18} /> Platform Assistant
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Click on “Prometheus” from the left nav to get access to a version of Prometheus trained on all content across the platform and is specifically trained on HR and Leadership as a discipline.
                                </p>
                            </div>
                        </div>

                        <div className="pt-[50px]"></div>

                        <div className="text-center mb-10">
                            <button onClick={onOpenHelp} className="text-brand-blue-light hover:text-white text-lg font-light transition-colors">
                                Learn how to make the most out of Prometheus AI
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    if (type === 'company') {
        return (
            <div className={`max-w-3xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>
                <h2 className={`text-3xl font-light text-white mb-6 ${headerClass} ${!isEmptyState && "hidden"}`}>There are no Company Collections Yet</h2>
                <h2 className={`text-3xl font-light text-white mb-6 ${headerClass} ${isEmptyState && "hidden"}`}>About Company Collections</h2>

                <div className={`text-slate-400 text-lg space-y-6 leading-relaxed font-light mb-10 ${alignmentClass}`}>
                    <p>
                        This is where your organization can create custom collections. They can add courses and content to a collection, assign employees to that collection, and even designate content within that collection as required learning.
                    </p>
                    <p>
                        Each collection can have its own users, so you can create a collection for leaders, or for a particular department or role, or even create a recommended learning path.
                    </p>
                </div>

                {/* Pro Tip Box */}
                <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-6 text-left relative overflow-hidden group hover:bg-brand-blue-light/10 transition-colors">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-blue-light/10 rounded-full blur-2xl group-hover:bg-brand-blue-light/20 transition-colors"></div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 bg-brand-blue-light/10 rounded-lg text-brand-blue-light flex-shrink-0">
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <h3 className="text-brand-blue-light font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                                Pro Tip
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                You could create a series of Collections, each representing a "level of achievement". Once an employee completes all the courses in a Collection, they earn a reward, and can begin on the "Level 2" Collection.
                            </p>
                        </div>
                    </div>
                </div>

                <p className={`text-slate-400 text-lg italic border-t border-brand-blue-light/10 pt-6 mt-6 ${alignmentClass}`}>
                    Company Collections give you lots of flexibility in how you expose and recommend content to a the people in your organization.
                </p>
            </div>
        );
    }

    if (type === 'instructors') {
        return (
            <div className={`max-w-3xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>
                <h2 className={`text-3xl font-light text-white mb-6 ${headerClass} ${!isEmptyState && "hidden"}`}>Meet Our World-Class Experts</h2>
                <h2 className={`text-3xl font-light text-white mb-6 ${headerClass} ${isEmptyState && "hidden"}`}>About Our Experts</h2>

                <div className={`text-slate-400 text-lg space-y-6 leading-relaxed font-light mb-10 ${alignmentClass}`}>
                    <p>
                        Our academy is built on the expertise of industry leaders, seasoned HR executives, and renowned authors. We don't just hire trainers; we partner with the people who are shaping the future of work.
                    </p>
                    <p>
                        Each instructor brings real-world experience, practical frameworks, and a unique perspective to their courses. You can follow specific instructors to get notified when they release new content.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Award size={16} className="text-brand-orange" /> Vetted Experts
                        </h3>
                        <p className="text-xs text-slate-400">
                            Every instructor is rigorously vetted for both subject matter expertise and teaching ability.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-brand-blue-light" /> Direct Access
                        </h3>
                        <p className="text-xs text-slate-400">
                            Many instructors host live Q&A sessions and participate in community discussions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Generic
    return (
        <div className={`max-w-2xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>
            <h2 className={`text-2xl font-light text-white mb-6 ${headerClass} ${!isEmptyState && "hidden"}`}>No content has been saved to this collection.</h2>
            <h2 className={`text-2xl font-light text-white mb-6 ${headerClass} ${isEmptyState && "hidden"}`}>About Collections</h2>
            <div className={`text-slate-400 space-y-4 leading-relaxed font-light ${alignmentClass}`}>
                <p>Use collections to organize content from across the platform into dedicated workspaces. They can include Courses, Modules, Lessons, Activities, Files, and even AI Conversations.</p>
                <p>On the right-side of your Collection, you'll notice the ability to ask questions from our helpful Prometheus AI assistant. Prometheus uses whatever is in your collection as context.</p>
                <p>To add content to a collection, simply click the little <span className="inline-flex items-center justify-center w-5 h-5 bg-brand-orange rounded-full mx-1 align-middle"><Plus size={10} className="text-white" /></span> icon on any card, or drag it to the Collection Surface at the bottom of your screen.</p>
            </div>
        </div>
    );
};

// --- LAZY LOAD WRAPPER ---
const LazyCourseCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '600px',
                threshold: 0
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="min-h-[310px] w-full relative">
            {isVisible ? children : null}
        </div>
    );
};

// --- CUSTOM DRAG LAYER ---
const CustomDragLayer: React.FC<{ item: DragItem | null; x: number; y: number }> = ({ item, x, y }) => {
    if (!item) return null;

    let Content = null;

    if (item.type === 'COURSE') {
        Content = (
            <div className="w-80 h-[28rem] bg-slate-800/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-44 w-full relative">
                    <img src={item.image} className="w-full h-full object-cover opacity-80" alt="" />
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-300">{item.subtitle}</p>
                </div>
            </div>
        );
    } else if (item.type === 'LESSON') {
        Content = (
            <div className="w-64 h-32 bg-slate-800/90 backdrop-blur-xl border border-brand-blue-light/50 rounded-xl shadow-2xl p-4 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-brand-blue-light flex items-center gap-2"><Monitor size={12} /> Lesson</p>
            </div>
        );
    } else if (item.type === 'RESOURCE') {
        Content = (
            <div className="w-64 h-24 bg-slate-800/90 backdrop-blur-xl border border-brand-orange/50 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                <div className="p-2 bg-brand-orange/20 rounded text-brand-orange">
                    <FileText size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white truncate w-32">{item.title}</h3>
                    <p className="text-[10px] text-slate-400">Resource</p>
                </div>
            </div>
        );
    } else if (item.type === 'MODULE') {
        Content = (
            <div className="w-72 h-32 bg-slate-800/90 backdrop-blur-xl border border-brand-blue-light/50 rounded-xl shadow-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-brand-blue-light/20 rounded text-brand-blue-light">
                        <Folder size={18} />
                    </div>
                    <span className="text-xs font-bold text-brand-blue-light uppercase tracking-wider">Module</span>
                </div>
                <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
            </div>
        );
    } else if (item.type === 'CONVERSATION') {
        Content = (
            <div className="w-64 h-32 bg-slate-800/90 backdrop-blur-xl border border-cyan-400/50 rounded-xl shadow-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-400/20 rounded text-cyan-400">
                        <MessageSquare size={18} />
                    </div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Conversation</span>
                </div>
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
            </div>
        );
    } else if (item.type === 'CONTEXT') {
        Content = (
            <div className="w-64 h-24 bg-slate-800/90 backdrop-blur-xl border border-brand-orange/50 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                <div className="p-2 bg-brand-orange/20 rounded text-brand-orange">
                    <FileText size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white truncate w-32">{item.title}</h3>
                    <p className="text-[10px] text-slate-400">Context</p>
                </div>
            </div>
        );
    } else if (item.type === 'PROFILE') {
        Content = (
            <div className="w-64 h-24 bg-slate-800/90 backdrop-blur-xl border border-cyan-400/50 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                <div className="p-2 bg-cyan-400/20 rounded text-cyan-400">
                    <Users size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white truncate w-32">{item.title}</h3>
                    <p className="text-[10px] text-slate-400">Profile</p>
                </div>
            </div>
        );
    } else if (item.type === 'NOTE') {
        Content = (
            <div className="w-64 h-32 bg-slate-800/90 backdrop-blur-xl border border-[#9A9724]/50 rounded-xl shadow-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#9A9724]/20 rounded text-[#9A9724]">
                        <StickyNote size={18} />
                    </div>
                    <span className="text-xs font-bold text-[#9A9724] uppercase tracking-wider">Note</span>
                </div>
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
            </div>
        );
    }

    return (
        <div
            className="fixed pointer-events-none z-[150] transform -translate-x-1/2 -translate-y-1/2 opacity-90 scale-90"
            style={{ left: x, top: y }}
        >
            {Content}
        </div>
    );
};

const GroupDetailCanvasWrapper = ({
    group,
    manageTrigger,
    onViewingMember,
    onDragStart,
    onCourseClick,
    onModuleClick,
    onLessonClick,
    onConversationClick
}: {
    group: any;
    manageTrigger: number;
    onViewingMember?: (member: any) => void;
    onDragStart?: (item: DragItem) => void;
    onCourseClick?: (courseId: number) => void;
    onModuleClick?: (moduleItem: any) => void;
    onLessonClick?: (lessonItem: any, autoPlay?: boolean) => void;
    onConversationClick?: (conversationId: string) => void;
}) => {
    const [Component, setComponent] = useState<any>(null);
    useEffect(() => {
        import('@/components/org/GroupDetailCanvas').then(mod => setComponent(() => mod.default));
    }, []);
    if (!Component) return <div className="p-10 text-center">Loading Group...</div>;
    return (
        <Component
            group={group}
            manageTrigger={manageTrigger}
            onBack={() => { }}
            onViewingMember={onViewingMember}
            onDragStart={onDragStart}
            onCourseClick={onCourseClick}
            onModuleClick={onModuleClick}
            onLessonClick={onLessonClick}
            onConversationClick={onConversationClick}
        />
    );
};

// --- MAIN CANVAS COMPONENT ---

import { useCollections } from '../hooks/useCollections';

const MainCanvas: React.FC<MainCanvasProps> = ({
    courses: initialCourses,
    activeCollectionId,
    onSelectCollection,
    customCollections,
    onOpenModal,
    onImmediateAddToCollection: propOnAddToCollection, // Rename to avoid conflict if needed, or just use prop
    onOpenAIPanel,
    onSetAIPrompt,
    onCourseSelect,
    initialCourseId,
    onResumeConversation,
    activeConversationId,
    onClearConversation,
    useDashboardV3,
    onCollectionUpdate,
    academyResetKey,
    initialStatusFilter,
    onNavigateWithFilter,
    previousCollectionId,
    onGoBack,
    onExposeDragStart,
    orgCollections = [],
    isOrgAdmin = false,
    onOrgCollectionsUpdate
}) => {
    // --- STATE MANAGEMENT ---
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const { savedItemIds, addToCollection, removeFromCollection, fetchCollectionItems } = useCollections(initialCourses);
    const [collectionItems, setCollectionItems] = useState<CollectionItemDetail[]>([]);
    const [isLoadingCollection, setIsLoadingCollection] = useState(false);

    // Ref to skip the next collection items fetch after a manual delete
    // This prevents the flash caused by refetching after we've already updated local state
    const skipNextCollectionFetchRef = useRef(false);

    const [viewingGroup, setViewingGroup] = useState<any | null>(null);
    const [viewingGroupMember, setViewingGroupMember] = useState<any | null>(null);

    // Org collection viewing state
    const [viewingOrgCollection, setViewingOrgCollection] = useState<{
        id: string;
        name: string;
        items: any[];
        isOrgAdmin: boolean;
    } | null>(null);

    // Effect to load group details when activeCollectionId changes to group-*
    useEffect(() => {
        if (activeCollectionId.startsWith('group-')) {
            const groupId = activeCollectionId.replace('group-', '');
            // Fetch group details
            import('@/app/actions/groups').then(async (mod) => {
                const details = await mod.getGroupDetails(groupId);
                setViewingGroup(details);
            });
        } else {
            setViewingGroup(null);
        }
    }, [activeCollectionId]);

    // Effect to load org collection when activeCollectionId changes to org-collection-*
    useEffect(() => {
        if (activeCollectionId.startsWith('org-collection-')) {
            const collectionId = activeCollectionId.replace('org-collection-', '');
            setIsLoadingCollection(true);
            import('@/app/actions/org').then(async (mod) => {
                const result = await mod.getOrgCollectionItems(collectionId);
                setViewingOrgCollection({
                    id: collectionId,
                    name: result.collectionName,
                    items: result.items,
                    isOrgAdmin: result.isOrgAdmin
                });
                setCollectionItems(result.items as CollectionItemDetail[]);
                setIsLoadingCollection(false);
            });
        } else {
            setViewingOrgCollection(null);
        }
    }, [activeCollectionId]);


    // Sync courses with saved state
    // Sync courses with prop changes and saved state
    useEffect(() => {
        setCourses(initialCourses.map(course => ({
            ...course,
            isSaved: savedItemIds.has(String(course.id))
        })));
    }, [initialCourses, savedItemIds]);



    // Force re-fetch helper
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Collection Counts Logic
    const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});







    // Handle initial course loading if ID is provided
    useEffect(() => {
        if (initialCourseId) {
            const course = courses.find(c => c.id === initialCourseId);
            if (course) {
                // If the course module isn't loaded, we might just set the ID and let the effect below handle details
                setSelectedCourseId(initialCourseId);
            }
        }
    }, [initialCourseId]);

    // Internal handler for adding to collection (persisting)
    const onImmediateAddToCollection = async (itemId: number | string, collectionId: string, itemType: string = 'COURSE') => {
        // Determine type based on ID format or context (passed in args for future)
        // For now, MainCanvas primarily handles Courses via drag, but CollectionSurface passes type?
        // We need to update CollectionSurface onDrop to pass type, or assume COURSE if number

        const idStr = String(itemId);
        // Fallback logic if type isn't passed (we updated onImmediateAddToCollection signature in prop but here we need to match)
        // Actually, let's update call sites or default to COURSE for now as drag payload usually has type

        await addToCollection(idStr, itemType, collectionId);

        // Force refresh of collection items so it appears immediately
        setRefreshTrigger(prev => prev + 1);

        // Refresh collection counts in the parent (nav panel)
        if (onCollectionUpdate) {
            onCollectionUpdate();
        }

        if (propOnAddToCollection) {
            propOnAddToCollection(itemId as any, collectionId);
        }
    };

    // --- State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);

    const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [pendingFilters, setPendingFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [visibleCourses, setVisibleCourses] = useState<Course[]>(courses);
    const [visibleLessons, setVisibleLessons] = useState<LessonSearchResult[]>([]);
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);
    const [userProgress, setUserProgress] = useState<Record<number, any>>({});
    const [drawerMode, setDrawerMode] = useState<'filters' | 'prompts' | 'help'>('filters');
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

    // Reset to All Courses view when Academy is clicked (via academyResetKey prop)
    // This handles the case where user is already on Academy but viewing a course
    useEffect(() => {
        if (academyResetKey !== undefined && academyResetKey > 0) {
            setActiveFilters(INITIAL_FILTERS);
            setPendingFilters(INITIAL_FILTERS);
            // Only update if not already null to prevent cascading effects
            setSelectedCourseId(prev => prev === null ? prev : null);
            setSelectedInstructorId(prev => prev === null ? prev : null);
            setIsPlayerActive(false);
        }
    }, [academyResetKey]);

    // Apply initial status filter when navigating to Academy with pre-set filter
    useEffect(() => {
        if (initialStatusFilter && initialStatusFilter.length > 0 && activeCollectionId === 'academy') {
            const newFilters = { ...INITIAL_FILTERS, status: initialStatusFilter };
            setActiveFilters(newFilters);
            setPendingFilters(newFilters);
        }
    }, [initialStatusFilter, activeCollectionId]);

    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestions('user_dashboard');
            setPanelPrompts(prompts.slice(4));
        };
        loadPrompts();
    }, []);

    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
    const [isCollectionSurfaceOpen, setIsCollectionSurfaceOpen] = useState(true);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // --- CONTEXT EDITOR STATE ---
    const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
    const [editingContextItem, setEditingContextItem] = useState<UserContextItem | null>(null);
    const [contextTypeToAdd, setContextTypeToAdd] = useState<ContextItemType>('CUSTOM_CONTEXT');

    // --- NOTES STATE ---
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
    const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);

    const handleOpenContextEditor = (type: ContextItemType = 'CUSTOM_CONTEXT', item: UserContextItem | null = null) => {
        setContextTypeToAdd(type);
        setEditingContextItem(item);
        setIsContextEditorOpen(true);
    };

    const handleCloseContextEditor = () => {
        setIsContextEditorOpen(false);
        setEditingContextItem(null);
        // Refresh items after close (in case of save)
        if (activeCollectionId === 'personal-context' || customCollections.some(c => c.id === activeCollectionId)) {
            fetchCollectionItems(activeCollectionId).then(res => setCollectionItems(res.items));
        }
    };

    // --- NOTE HANDLERS ---
    const handleOpenNoteEditor = useCallback((noteId: string) => {
        setEditingNoteId(noteId);
        setIsNoteEditorOpen(true);
    }, []);

    const handleCloseNoteEditor = useCallback(() => {
        setIsNoteEditorOpen(false);
        setEditingNoteId(null);
    }, []);

    const handleCreateNote = useCallback(async (collectionId?: string, courseId?: number) => {
        console.log('[MainCanvas.handleCreateNote] Called with collectionId:', collectionId, 'courseId:', courseId);
        try {
            const note = await createNoteAction({
                course_id: courseId
            });
            console.log('[MainCanvas.handleCreateNote] Created note:', note?.id);

            if (note) {
                setNotes(prev => [note, ...prev]);

                // If creating in a specific collection, add it there
                console.log('[MainCanvas.handleCreateNote] Checking if should add to collection:', collectionId, 'condition:', collectionId && collectionId !== 'notes');
                if (collectionId && collectionId !== 'notes') {
                    console.log('[MainCanvas.handleCreateNote] Calling addNoteToCollectionAction...');
                    const result = await addNoteToCollectionAction(note.id, collectionId);
                    console.log('[MainCanvas.handleCreateNote] addNoteToCollectionAction result:', result);
                }

                // Open the editor for the new note
                setEditingNoteId(note.id);
                setIsNoteEditorOpen(true);

                // Update counts
                if (onCollectionUpdate) onCollectionUpdate();
            } else {
                alert('Failed to create note. The notes table may not exist yet. Please run the database migration.');
            }
        } catch (error) {
            console.error('[MainCanvas] Error creating note:', error);
            alert('Error creating note: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }, [onCollectionUpdate]);

    const handleNoteDeleted = useCallback((noteId: string) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (onCollectionUpdate) onCollectionUpdate();
    }, [onCollectionUpdate]);

    const handleNoteSaved = useCallback(() => {
        // Refresh notes list to get updated titles
        if (activeCollectionId === 'notes') {
            getNotesAction().then(setNotes);
        }
        if (onCollectionUpdate) onCollectionUpdate();
    }, [activeCollectionId, onCollectionUpdate]);

    const handleDeleteNoteInitiate = useCallback((note: Note) => {
        setNoteToDelete({ id: note.id, title: note.title });
        setDeleteNoteModalOpen(true);
    }, []);

    const confirmDeleteNote = useCallback(async () => {
        if (!noteToDelete) return;
        setDeleteNoteModalOpen(false);

        const { deleteNoteAction } = await import('@/app/actions/notes');
        const result = await deleteNoteAction(noteToDelete.id);

        if (result.success) {
            setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
            if (onCollectionUpdate) onCollectionUpdate();
        } else {
            alert('Failed to delete note: ' + (result.error || 'Unknown error'));
        }
        setNoteToDelete(null);
    }, [noteToDelete, onCollectionUpdate]);

    const cancelDeleteNote = useCallback(() => {
        setDeleteNoteModalOpen(false);
        setNoteToDelete(null);
    }, []);

    const [flaringPortalId, setFlaringPortalId] = useState<string | null>(null);

    const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
    const [expandedFooter, setExpandedFooter] = useState(false);

    // -- Course Page State --
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedCourseSyllabus, setSelectedCourseSyllabus] = useState<Module[]>([]);
    const [selectedCourseResources, setSelectedCourseResources] = useState<Resource[]>([]);
    const [isPlayerActive, setIsPlayerActive] = useState(false);

    const [resumeLessonId, setResumeLessonId] = useState<string | undefined>(undefined);
    const [resumeModuleId, setResumeModuleId] = useState<string | undefined>(undefined);

    const [transitionState, setTransitionState] = useState<TransitionState>('idle');
    const [renderKey, setRenderKey] = useState(0);
    const [user, setUser] = useState<any>(null);

    // Collection Counts Logic (Dependent on User)
    useEffect(() => {
        if (user?.id) {
            import('@/app/actions/collections').then(mod => {
                mod.getCollectionCountsAction(user.id).then(setCollectionCounts);
            });
        }
    }, [savedItemIds, onCollectionUpdate, refreshTrigger, user?.id]);

    // Listen for global collection refresh events (from insight saves, etc.)
    useEffect(() => {
        const handleCollectionRefresh = () => {
            console.log('[MainCanvas] Collection refresh event received');
            if (user?.id) {
                import('@/app/actions/collections').then(mod => {
                    mod.getCollectionCountsAction(user.id).then(setCollectionCounts);
                });
            }
            // Also refresh collection items if we're viewing a collection
            if (activeCollectionId && activeCollectionId !== 'academy' && activeCollectionId !== 'dashboard') {
                setRefreshTrigger(prev => prev + 1);
            }
            // Also refresh conversations list (for new conversations from AI Panel)
            fetchConversations();
            // Notify parent (AppLayout/Dashboard) to also refresh
            if (onCollectionUpdate) {
                onCollectionUpdate();
            }
        };

        window.addEventListener('collection:refresh', handleCollectionRefresh);
        return () => {
            window.removeEventListener('collection:refresh', handleCollectionRefresh);
        };
    }, [user?.id, activeCollectionId, onCollectionUpdate]);

    // Instructor State
    const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

    // --- HELP COLLECTION STATE ---
    const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);
    const [isLoadingHelpTopics, setIsLoadingHelpTopics] = useState(false);
    const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
    const [activeHelpTopicId, setActiveHelpTopicId] = useState<HelpTopicId | string>('ai-insights');
    const [activeHelpTopicFallback, setActiveHelpTopicFallback] = useState<{ title: string; contentText?: string } | null>(null);

    const openHelpTopic = useCallback((topic: HelpTopic) => {
        const nextTopicId = topic.slug || 'help-collection';
        setActiveHelpTopicId(nextTopicId);
        setActiveHelpTopicFallback({
            title: topic.title,
            contentText: topic.contentText
        });
        setIsHelpPanelOpen(true);
    }, []);

    // --- TOOLS COLLECTION STATE ---
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoadingTools, setIsLoadingTools] = useState(false);

    // --- NOTES FETCH ---
    const fetchNotes = async () => {
        try {
            setIsLoadingNotes(true);
            const fetchedNotes = await getNotesAction();
            setNotes(fetchedNotes);
        } catch (error) {
            console.error('[MainCanvas] Error fetching notes:', error);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    // Fetch notes when navigating to notes collection or on refresh
    useEffect(() => {
        if (activeCollectionId === 'notes') {
            fetchNotes();
        }
    }, [activeCollectionId, refreshTrigger]);

    // Sync selectedCourseId with parent (for AI Panel Context)
    // Use a ref to track previously synced value and prevent redundant calls
    const lastSyncedCourseId = useRef<string | null>(null);
    useEffect(() => {
        const courseIdStr = selectedCourseId ? String(selectedCourseId) : null;
        // Only call parent if value actually changed
        if (onCourseSelect && lastSyncedCourseId.current !== courseIdStr) {
            lastSyncedCourseId.current = courseIdStr;
            onCourseSelect(courseIdStr);
        }
    }, [selectedCourseId, onCourseSelect]);

    // Prometheus Page Prompt State
    const [prometheusPagePrompt, setPrometheusPagePrompt] = useState<string | undefined>(undefined);

    // --- COLLECTION MANAGEMENT STATE ---
    const [isRenamingCollection, setIsRenamingCollection] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);

    // Reset manage state when changing collections
    useEffect(() => {
        setIsRenamingCollection(false);
        setIsManageMenuOpen(false);
    }, [activeCollectionId]);

    const handleRenameCollectionSpy = async () => {
        // Find current collection name to init
        const current = customCollections.find(c => c.id === activeCollectionId);
        if (current) {
            setRenameValue(current.label);
            setIsRenamingCollection(true);
            setIsManageMenuOpen(false); // Close menu
        }
    };

    const submitRename = async () => {
        if (!renameValue.trim()) return;

        try {
            const res = await renameCollection(activeCollectionId, renameValue);
            if (res.success) {
                // Success - Notify parent to refresh list
                if (onCollectionUpdate) onCollectionUpdate();
                setIsRenamingCollection(false);
            } else {
                alert("Failed to rename collection");
            }
        } catch (e) {
            console.error(e);
            alert("Error renaming collection");
        }
    };

    const handleDeleteCollectionSpy = () => {
        const custom = customCollections.find(c => c.id === activeCollectionId);
        if (custom) {
            setCollectionToDelete({ id: custom.id, label: custom.label });
            setDeleteCollectionModalOpen(true);
        }
    };

    // Dashboard Stats for V3 Header
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalTime: '0h 0m',
        coursesCompleted: 0,
        creditsEarned: 0,
        streak: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch User on mount
    useEffect(() => {
        const fetchUserAndMigrate = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // --- RECORD DAILY ACTIVITY FOR STREAK TRACKING ---
                // This records the user's access today for streak calculation
                try {
                    await supabase.rpc('record_user_activity', { p_user_id: user.id });
                } catch (e) {
                    console.error('Failed to record user activity:', e);
                }

                // --- AUTO MIGRATION LOGIC (Client-Side) ---
                // 1. Instantiate Profile Card
                // 1. Instantiate Profile Card (and simplify/dedupe)
                const { data: existingProfiles } = await supabase
                    .from('user_context_items')
                    .select('id, content')
                    .eq('user_id', user.id)
                    .eq('type', 'PROFILE');

                if (existingProfiles && existingProfiles.length > 0) {
                    if (existingProfiles.length > 1) {
                        console.log('Migrator: Cleaning up duplicate profiles...');
                        const [keep, ...remove] = existingProfiles;
                        await supabase.from('user_context_items').delete().in('id', remove.map(i => i.id));
                    } else {
                        // Check for bad data "Verified Final V2"
                        const profile = existingProfiles[0];
                        if (profile.content && (profile.content as any).role === 'Verified Final V2') {
                            console.log('Migrator: Cleaning up "Verified Final V2"...');
                            await supabase.from('user_context_items').update({
                                content: { ...(profile.content as any), role: 'HR Professional' }
                            }).eq('id', profile.id);
                        }
                        console.log('Migrator: Profile Card Exists.');
                    }
                } else {
                    console.log('Migrator: Instantiating Profile Card...');
                    await supabase.from('user_context_items').insert({
                        user_id: user.id,
                        collection_id: null,
                        type: 'PROFILE',
                        title: 'My Profile',
                        content: { role: 'HR Professional' }
                    });
                }

                // 2. Migrate AI Insights
                const { data: memories } = await supabase.from('user_ai_memory').select('*').eq('user_id', user.id);
                if (memories && memories.length > 0) {
                    for (const memory of memories) {
                        const { data: existing } = await supabase.from('user_context_items').select('id').eq('type', 'AI_INSIGHT').contains('content', { insight: memory.content }).single();
                        if (!existing) {
                            console.log('Migrator: Modyifing AI Insight...');
                            await supabase.from('user_context_items').insert({
                                user_id: user.id,
                                collection_id: null,
                                type: 'AI_INSIGHT',
                                title: 'Insight from Conversation',
                                content: { insight: memory.content, type: memory.insight_type, migrated: true }
                            });
                        }
                    }
                }
            }
        };
        fetchUserAndMigrate();
    }, []);

    // Fetch Dashboard Stats for V3 Header
    useEffect(() => {
        if (useDashboardV3 && activeCollectionId === 'dashboard' && user?.id) {
            const loadStats = async () => {
                try {
                    const data = await fetchDashboardData(user.id);
                    setDashboardStats(data.stats);
                    setStatsLoading(false);
                } catch (error) {
                    console.error('Failed to load dashboard stats', error);
                    setStatsLoading(false);
                }
            };
            loadStats();
        }
    }, [useDashboardV3, activeCollectionId, user?.id]);


    // Track mouse for custom drag layer
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };
        window.addEventListener('dragover', handleWindowMouseMove);
        return () => {
            window.removeEventListener('dragover', handleWindowMouseMove);
        };
    }, [isDragging]);

    // Reset expanded footer when changing collection
    useEffect(() => {
        setExpandedFooter(false);
        // If collection changes, ensure we exit course/instructor view
        // Use functional updates to prevent setting null when already null
        setSelectedCourseId(prev => prev === null ? prev : null);
        setSelectedInstructorId(prev => prev === null ? prev : null);
        setIsPlayerActive(false);
        // Clear viewing group member to prevent flash when switching collections
        setViewingGroupMember(null);
    }, [activeCollectionId]);

    // Fetch help topics when navigating to Help collection
    useEffect(() => {
        if (activeCollectionId === 'help') {
            const fetchHelpTopics = async () => {
                setIsLoadingHelpTopics(true);
                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from('help_topics')
                        .select('id, slug, title, summary, category, content_text, icon_name, display_order, is_active, created_at')
                        .eq('is_active', true)
                        .order('display_order', { ascending: true });

                    if (error) {
                        console.error('Error fetching help topics:', error);
                        return;
                    }

                    // Map database fields to HelpTopic type
                    const topics: HelpTopic[] = (data || []).map(row => ({
                        type: 'HELP' as const,
                        id: row.id,
                        slug: row.slug,
                        title: row.title,
                        summary: row.summary,
                        category: row.category,
                        contentText: (row as any).content_text ?? undefined,
                        iconName: row.icon_name,
                        displayOrder: row.display_order,
                        isActive: row.is_active,
                        createdAt: row.created_at
                    }));

                    setHelpTopics(topics);
                } catch (err) {
                    console.error('Error fetching help topics:', err);
                } finally {
                    setIsLoadingHelpTopics(false);
                }
            };

            fetchHelpTopics();
        }
    }, [activeCollectionId]);

    // Fetch tools when navigating to Tools collection
    useEffect(() => {
        if (activeCollectionId === 'tools') {
            const fetchTools = async () => {
                setIsLoadingTools(true);
                try {
                    const fetchedTools = await fetchToolsAction();
                    setTools(fetchedTools);
                } catch (err) {
                    console.error('Error fetching tools:', err);
                } finally {
                    setIsLoadingTools(false);
                }
            };

            fetchTools();
        }
    }, [activeCollectionId]);

    // Sync selectedCourseId with initialCourseId prop (which acts as activeCourseId from parent)
    useEffect(() => {
        if (initialCourseId) {
            // Only set if different to prevent loops
            setSelectedCourseId(prev => prev === initialCourseId ? prev : initialCourseId);
        } else {
            // Clear course selection when initialCourseId becomes null/undefined
            // This handles cases like clicking Academy nav while viewing a course
            // Use functional update to prevent setting null when already null
            setSelectedCourseId(prev => prev === null ? prev : null);
            setIsPlayerActive(false);
        }
    }, [initialCourseId]);

    // --- Filtering Logic ---
    const applyFilters = (filters: FilterState, sourceCourses: Course[]) => {
        return sourceCourses.filter(course => {
            // 0. Collection Context Filter
            if (activeCollectionId !== 'academy' && activeCollectionId !== 'dashboard') {
                if (!course.collections.includes(activeCollectionId)) return false;
            }

            // 1. Search Query
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                const matchesSearch =
                    course.title.toLowerCase().includes(query) ||
                    course.author.toLowerCase().includes(query) ||
                    course.description.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // 1. Category Filter
            if (filters.category !== 'All' && course.category !== filters.category) {
                return false;
            }

            // 3. Credits
            if (filters.credits.length > 0) {
                const hasCredit = filters.credits.some(credit => course.badges.includes(credit as any));
                if (!hasCredit) return false;
            }

            // 4. Designations
            if (filters.designations.length > 0) {
                let matchesDesignation = false;
                if (filters.designations.includes('REQUIRED') && course.badges.includes('REQUIRED')) matchesDesignation = true;
                if (filters.designations.includes('RECOMMENDED') && course.isSaved) matchesDesignation = true;
                if (!matchesDesignation) return false;
            }

            // 5. Status
            if (filters.status.length > 0) {
                let statusMatch = false;
                if (filters.status.includes('NOT_STARTED') && course.progress === 0) statusMatch = true;
                if (filters.status.includes('IN_PROGRESS') && course.progress > 0 && course.progress < 100) statusMatch = true;
                if (filters.status.includes('COMPLETED') && course.progress === 100) statusMatch = true;
                if (!statusMatch) return false;
            }

            // 6. Ratings
            if (filters.ratingFilter !== 'ALL') {
                if (filters.ratingFilter === 'NOT_RATED') {
                    if (course.rating > 0) return false;
                } else {
                    const min = parseInt(filters.ratingFilter.charAt(0), 10);
                    if (course.rating < min) return false;
                }
            }

            // 7. Date Filter
            if (filters.dateFilterType !== 'ALL') {
                const courseDate = new Date(course.dateAdded);
                const now = new Date();

                if (filters.dateFilterType === 'SINCE_LOGIN') {
                    const lastLogin = new Date();
                    lastLogin.setDate(now.getDate() - 3);
                    if (courseDate < lastLogin) return false;
                }
                else if (filters.dateFilterType === 'THIS_MONTH') {
                    if (courseDate.getMonth() !== now.getMonth() || courseDate.getFullYear() !== now.getFullYear()) {
                        return false;
                    }
                }
                else if (filters.dateFilterType === 'LAST_X_DAYS') {
                    const days = parseInt(filters.customDays, 10) || 0;
                    const cutoff = new Date();
                    cutoff.setDate(now.getDate() - days);
                    if (courseDate < cutoff) return false;
                }
            }

            return true;
        });
    };

    // --- Transition Engine ---
    useEffect(() => {
        // 1. Trigger Exit
        setTransitionState('exiting');

        const exitTimeout = setTimeout(() => {
            // 2. Process Data
            const filteredResults = applyFilters(activeFilters, courses);
            setVisibleCourses(filteredResults);
            setRenderKey(prev => prev + 1);

            // 3. Mount
            setTransitionState('mounting');

            // 4. Enter
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTransitionState('entering');
                });
            });

            // 5. Idle
            setTimeout(() => {
                setTransitionState('idle');
            }, 1000);

        }, 400);

        return () => clearTimeout(exitTimeout);
    }, [activeFilters, activeCollectionId, courses]); // Added activeCollectionId dependency

    // --- Lesson Search Effect ---
    // Fetch lessons when lesson search is enabled and search query exists
    useEffect(() => {
        // Only search lessons in Academy when toggle is on and there's a search query
        if (!activeFilters.includeLessons || !activeFilters.searchQuery || activeCollectionId !== 'academy') {
            setVisibleLessons([]);
            return;
        }

        let cancelled = false;
        setIsLoadingLessons(true);

        searchLessonsAction(activeFilters.searchQuery)
            .then((results) => {
                if (!cancelled) {
                    setVisibleLessons(results);
                }
            })
            .catch((error) => {
                console.error('Failed to search lessons:', error);
                if (!cancelled) {
                    setVisibleLessons([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingLessons(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeFilters.includeLessons, activeFilters.searchQuery, activeCollectionId]);

    // State for Group Management Trigger (Lifted Up)
    const [groupManageTrigger, setGroupManageTrigger] = useState(0);

    // State for Dynamic Group Criteria Panel
    const [showDynamicCriteriaPanel, setShowDynamicCriteriaPanel] = useState(false);
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    // --- EFFECT: Handle Keyboard Shortcuts ---

    const toggleDrawer = (mode: 'filters' | 'prompts' | 'help' = 'filters') => {
        if (mode === 'filters') setPendingFilters(activeFilters);
        setDrawerMode(mode);
        setIsDrawerOpen(true);
    };

    const handleOpenDrawer = () => toggleDrawer('filters');

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
    };

    const handleApplyFilters = () => {
        setActiveFilters(pendingFilters);
        setIsDrawerOpen(false);
    };

    const handleResetFilters = () => {
        setPendingFilters(INITIAL_FILTERS);
        setActiveFilters(INITIAL_FILTERS);
        setVisibleLessons([]); // Clear lesson search results
    };

    const toggleArrayFilter = (field: keyof FilterState, value: string) => {
        setPendingFilters(prev => {
            const currentArray = prev[field] as string[];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
    };

    const handleCategorySelect = (category: string) => {
        const newFilters = {
            ...INITIAL_FILTERS,
            category: category
        };
        setActiveFilters(newFilters);
        setPendingFilters(newFilters);
    };

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    // --- Collection Handlers ---

    const handleAddButtonClick = (courseId: number) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            onOpenModal(course);
        }
    };

    // Navigate to Course Page
    const handleCourseClick = async (courseId: number) => {
        // Optimistic / Loading state could be added here
        setSelectedCourseId(courseId);

        try {
            const syllabus = await fetchCourseModules(courseId);

            // Fetch progress if user is logged in
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { completedLessonIds } = await fetchUserCourseProgress(user.id, courseId);
                // Merge progress
                syllabus.forEach(m => {
                    m.lessons.forEach(l => {
                        if (completedLessonIds.includes(l.id)) {
                            l.isCompleted = true;
                        }
                    });
                });
            }

            setSelectedCourseSyllabus(syllabus);

            // Still using mock resources for now as we haven't seeded resources table yet
            const resources = generateMockResources(courseId);
            setSelectedCourseResources(resources);
        } catch (error) {
            console.error("Failed to load course details", error);
        }

        // Ensure we are scrolled to top when navigating
        const container = document.querySelector('.custom-scrollbar');
        if (container) container.scrollTop = 0;
    };

    const handleBackToCollection = () => {
        setSelectedCourseId(null);
        setSelectedInstructorId(null);
    };

    const handlePrometheusPagePrompt = (prompt: string) => {
        setPrometheusPagePrompt(prompt);
        onSelectCollection('prometheus');
    };

    const handleStartCourse = async () => {
        if (selectedCourseId) {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { lastViewedLessonId } = await fetchUserCourseProgress(user.id, selectedCourseId);
                    if (lastViewedLessonId) {
                        // Find module for this lesson
                        const module = selectedCourseSyllabus.find(m => m.lessons.some(l => l.id === lastViewedLessonId));
                        if (module) {
                            setResumeModuleId(module.id);
                            setResumeLessonId(lastViewedLessonId);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching progress:", error);
            }
        }
        setIsPlayerActive(true);
    };

    const handleBackToCourseHome = () => {
        setIsPlayerActive(false);
    };

    // Handler for CoursePageV2 AI integration
    const handleAskPrometheus = (prompt: string) => {
        onSetAIPrompt(prompt);
        onOpenAIPanel();
    };

    // Navigate to a module within its course
    const handleModuleClick = async (moduleItem: any) => {
        const courseId = moduleItem.course_id;
        const moduleId = moduleItem.id;

        if (!courseId) {
            console.error('Module is missing course_id:', moduleItem);
            return;
        }

        // Load course data
        setSelectedCourseId(courseId);

        try {
            const syllabus = await fetchCourseModules(courseId);

            // Fetch progress if user is logged in
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { completedLessonIds } = await fetchUserCourseProgress(authUser.id, courseId);
                syllabus.forEach(m => {
                    m.lessons.forEach(l => {
                        if (completedLessonIds.includes(l.id)) {
                            l.isCompleted = true;
                        }
                    });
                });
            }

            setSelectedCourseSyllabus(syllabus);

            const resources = generateMockResources(courseId);
            setSelectedCourseResources(resources);

            // Set the module to open and go directly to player
            setResumeModuleId(moduleId);
            setIsPlayerActive(true);

        } catch (error) {
            console.error("Failed to load course for module:", error);
        }
    };

    // Navigate to a lesson within its course
    // autoPlay: if true, opens the player immediately; if false, just loads and selects the lesson
    const handleLessonClick = async (lessonItem: any, autoPlay: boolean = true) => {
        const lessonId = lessonItem.id;
        const moduleId = lessonItem.module_id;

        // Get course_id from the lesson's module relationship
        const courseId = lessonItem.course_id || lessonItem.modules?.course_id || lessonItem.modules?.courses?.id;

        if (!courseId) {
            console.error('Lesson is missing course_id:', lessonItem);
            return;
        }

        // Load course data
        setSelectedCourseId(courseId);

        try {
            const syllabus = await fetchCourseModules(courseId);

            // Fetch progress if user is logged in
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { completedLessonIds } = await fetchUserCourseProgress(authUser.id, courseId);
                syllabus.forEach(m => {
                    m.lessons.forEach(l => {
                        if (completedLessonIds.includes(l.id)) {
                            l.isCompleted = true;
                        }
                    });
                });
            }

            setSelectedCourseSyllabus(syllabus);

            const resources = generateMockResources(courseId);
            setSelectedCourseResources(resources);

            // Set the lesson and module to open
            setResumeLessonId(lessonId);
            setResumeModuleId(moduleId);

            // Only auto-play if requested (default behavior for existing calls)
            if (autoPlay) {
                setIsPlayerActive(true);
            }

        } catch (error) {
            console.error("Failed to load course for lesson:", error);
        }
    };

    const handleDragStart = (item: DragItem) => {
        setIsDragging(true);
        setDraggedItem(item);
    };

    // Expose drag start handler to parent for external triggers (e.g., AIPanel notes drag)
    useEffect(() => {
        if (onExposeDragStart) {
            onExposeDragStart(handleDragStart);
        }
    }, [onExposeDragStart]);

    // Deprecated wrapper for CardStack which still passes ID
    const handleCourseDragStart = (courseId: number) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            handleDragStart({
                type: 'COURSE',
                id: course.id,
                title: course.title,
                subtitle: course.author,
                image: course.image
            });
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedItem(null);
    };

    const getTransitionClasses = () => {
        switch (transitionState) {
            case 'exiting': return 'opacity-0 -translate-y-8 blur-md scale-95';
            case 'mounting': return 'opacity-0 translate-y-12 blur-xl scale-105';

            case 'entering': return 'opacity-100 translate-y-0 blur-0 scale-100';
            default: return 'opacity-100 translate-y-0 blur-0 scale-100';
        }
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (activeFilters.searchQuery) count++;
        if (activeFilters.category !== 'All') count++;
        if (activeFilters.credits.length > 0) count++;
        if (activeFilters.designations.length > 0) count++;
        if (activeFilters.status.length > 0) count++;
        if (activeFilters.ratingFilter !== 'ALL') count++;
        if (activeFilters.dateFilterType !== 'ALL') count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    // --- CONVERSATION STATE & HANDLERS ---
    const [prometheusConversationTitle, setPrometheusConversationTitle] = useState('New Conversation');

    // Initialize conversations from API
    const [conversations, setConversations] = useState<(Conversation | ToolConversation)[]>([]);

    const fetchConversations = async () => {
        try {
            const { fetchConversationsAction } = await import('@/app/actions/conversations');
            const data = await fetchConversationsAction();
            console.log('[MainCanvas] fetchConversationsAction returned:', data?.length, 'items');
            setConversations(data);
        } catch (error: any) {
            console.error("Failed to fetch conversations", error);
        }
    };

    useEffect(() => {
        // Load on mount
        fetchConversations();
    }, []);

    const [activeConversation, setActiveConversation] = useState<Conversation | ToolConversation | null>(null);
    const [deleteConversationModalOpen, setDeleteConversationModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<any | null>(null);

    // New Delete States
    const [deleteCollectionModalOpen, setDeleteCollectionModalOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; label: string } | null>(null);

    const [deleteContextModalOpen, setDeleteContextModalOpen] = useState(false);
    const [contextItemToDelete, setContextItemToDelete] = useState<{ id: string; type: ContextItemType; title: string } | null>(null);

    // Collection Item Delete State (for COURSE, LESSON, MODULE, RESOURCE)
    const [deleteCollectionItemModalOpen, setDeleteCollectionItemModalOpen] = useState(false);
    const [collectionItemToDelete, setCollectionItemToDelete] = useState<{ id: string; type: string; title: string } | null>(null);



    // --- Actions ---

    const handleDeleteConversationInitiate = (conv: any) => {
        setConversationToDelete(conv);
        setDeleteConversationModalOpen(true);
    };

    const confirmDeleteConversation = async () => {
        if (!conversationToDelete) return;
        setDeleteConversationModalOpen(false);
        try {
            await fetch(`/api/conversations/${conversationToDelete.id}`, {
                method: 'DELETE'
            });
            setConversations(prev => prev.filter(c => c.id !== conversationToDelete.id));
            setConversationToDelete(null);
            // Refresh collection counts after deletion
            if (onCollectionUpdate) onCollectionUpdate();
        } catch (error) {
            console.error("Failed to delete conversation", error);
            alert("Failed to delete conversation.");
        }
    };

    const cancelDeleteConversation = () => {
        setDeleteConversationModalOpen(false);
        setConversationToDelete(null);
    };

    // Collection Delete Handlers
    const confirmDeleteCollection = async () => {
        if (!collectionToDelete) return;
        setDeleteCollectionModalOpen(false);

        const result = await deleteCollection(collectionToDelete.id);
        if (result.success) {
            if (activeCollectionId === collectionToDelete.id) {
                onSelectCollection('academy');
            }
            if (onCollectionUpdate) onCollectionUpdate();
        } else {
            alert('Failed to delete collection: ' + result.error);
        }
        setCollectionToDelete(null);
    };

    // Context Delete Handlers
    const initiateDeleteContextItem = (id: string, type: ContextItemType, title: string) => {
        setContextItemToDelete({ id, type, title });
        setDeleteContextModalOpen(true);
    };

    const confirmDeleteContextItem = async () => {
        if (!contextItemToDelete) return;
        setDeleteContextModalOpen(false);

        const result = await deleteContextItem(contextItemToDelete.id);
        if (result.success) {
            // Update local state to remove item immediately
            setCollectionItems(prev => prev.filter(item => item.id !== contextItemToDelete.id));
            // Skip the next fetch since we already updated local state
            skipNextCollectionFetchRef.current = true;
            if (onCollectionUpdate) onCollectionUpdate();
        } else {
            alert('Failed to delete context item: ' + result.error);
        }
        setContextItemToDelete(null);
    };

    // Collection Item Delete Handlers (COURSE, LESSON, MODULE, RESOURCE)
    const initiateDeleteCollectionItem = (id: string, type: string, title: string) => {
        setCollectionItemToDelete({ id, type, title });
        setDeleteCollectionItemModalOpen(true);
    };

    const confirmDeleteCollectionItem = async () => {
        if (!collectionItemToDelete) return;
        setDeleteCollectionItemModalOpen(false);

        await removeFromCollection(collectionItemToDelete.id, activeCollectionId);
        // Update local state to remove item immediately
        setCollectionItems(prev => prev.filter(i => String(i.id) !== String(collectionItemToDelete.id)));
        // Skip the next fetch since we already updated local state
        skipNextCollectionFetchRef.current = true;
        if (onCollectionUpdate) onCollectionUpdate();
        setCollectionItemToDelete(null);
    };

    // Updated Handler for UniversalCollectionCard
    const handleRemoveItem = async (itemId: string, itemType: string) => {
        if (itemType === 'CONVERSATION') {
            // Conversations have their own confirmation modal
            const conv = conversations.find(c => c.id === itemId);
            if (conv) {
                handleDeleteConversationInitiate(conv);
            }
        } else if (itemType === 'NOTE') {
            // Notes - remove from collection (not delete the note itself)
            const { removeNoteFromCollectionAction } = await import('@/app/actions/notes');
            const resolvedCollectionId = customCollections.find(c =>
                c.id === activeCollectionId || c.label === activeCollectionId
            )?.id || activeCollectionId;
            await removeNoteFromCollectionAction(itemId, resolvedCollectionId);
            // Refresh the collection
            setRefreshTrigger(prev => prev + 1);
        } else if (itemType === 'AI_INSIGHT' || itemType === 'CUSTOM_CONTEXT' || itemType === 'FILE' || itemType === 'PROFILE') {
            // Context Items have their own confirmation modal
            const item = collectionItems.find(i => i.id === itemId);
            const title = item?.title || 'Context Item';
            initiateDeleteContextItem(itemId, itemType as ContextItemType, title);
        } else if (itemType === 'COURSE' || itemType === 'LESSON' || itemType === 'MODULE' || itemType === 'RESOURCE') {
            // Standard collection items - use modal confirmation
            const item = collectionItems.find(i => i.id === itemId || String(i.id) === itemId);
            const itemName = item?.title || itemType.toLowerCase();
            initiateDeleteCollectionItem(itemId, itemType, itemName);
        }
    };

    // Listen for conversation collection updates from the modal
    useEffect(() => {
        const handleUpdateCollections = (event: any) => {
            const { conversationId, collectionIds } = event.detail;
            setConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    return {
                        ...conv,
                        collections: collectionIds,
                        isSaved: collectionIds.length > 0
                    };
                }
                return conv;
            }));
        };

        window.addEventListener('updateConversationCollections', handleUpdateCollections);
        return () => window.removeEventListener('updateConversationCollections', handleUpdateCollections);
    }, []);

    const handleConversationStart = async (conversationId: string, title: string, updatedMessages: Conversation['messages']) => {
        setPrometheusConversationTitle(title);

        // This handler is now primarily for updating the UI list state
        // The actual saving of messages happens in PrometheusFullPage via API

        // We should fetch the latest state of this conversation or update local state optimistically
        // For now, let's update local state to reflect the change immediately

        const id = conversationId || activeConversation?.id;
        if (!id) return; // Should have an ID by now

        const now = new Date().toISOString();

        // Map messages to match Conversation interface if needed (though we updated types)
        // The updatedMessages coming from PrometheusFullPage might still be {role, text}
        // We need to map 'text' to 'content' if we want to be strict, but let's handle it loosely for now or fix in PrometheusFullPage

        setConversations(prev => {
            const existingIndex = prev.findIndex(c => c.id === id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    title,
                    lastMessage: updatedMessages && updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].content : '',
                    updated_at: now,
                    // We don't necessarily need to store all messages in the list view state, but we can
                };

                // CRITICAL FIX: Ensure activeConversation is synced so UI updates (like Add to Collection button)
                if (activeConversation?.id === id || !activeConversation) {
                    setActiveConversation(updated[existingIndex]);
                }

                return updated;
            } else {
                // New Conversation Logic
                const newConv: Conversation = {
                    id: id,
                    title: title,
                    created_at: now,
                    updated_at: now,
                    messages: updatedMessages || [],
                    lastMessage: updatedMessages && updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].content : '',
                    type: 'CONVERSATION',
                    collections: ['conversations'],
                    isSaved: false // New conversations aren't saved to a collection yet
                };

                setActiveConversation(newConv);

                // If it's a new conversation that we just started, we might need to fetch it or create a placeholder
                // But PrometheusFullPage should have created it via API.
                // Let's trigger a fetch
                fetchConversations();
                // Refresh global counts since we added a new conversation
                if (onCollectionUpdate) onCollectionUpdate();
                return [...prev, newConv]; // Optimistically add to list
            }
        });
    };

    const handleSaveConversation = () => {
        // Use effective conversation - either activeConversation or from conversations array via activeConversationId
        const effectiveConversation = activeConversation || (activeConversationId ? conversations.find(c => c.id === activeConversationId) : null);
        if (effectiveConversation) {
            onOpenModal(effectiveConversation);
        }
    };

    const handleOpenConversation = (id: string) => {
        const conversation = conversations.find(c => c.id === id);
        if (conversation) {
            // Tool conversations redirect to their originating tool page
            if (conversation.type === 'TOOL_CONVERSATION') {
                const toolConv = conversation as ToolConversation;
                window.location.href = `/tools/${toolConv.tool_slug}?conversationId=${id}`;
                return;
            }

            // Regular conversations: navigate to their originating context and resume
            // onResumeConversation handles navigation based on metadata.contextScope:
            // - COURSE → Academy with course loaded
            // - COLLECTION → Custom collection
            // - TOOL → Tool page (redirect)
            // - PLATFORM → Prometheus AI
            onResumeConversation && onResumeConversation(conversation as Conversation);

            // If not on conversations page, also trigger AI Panel open
            // (onResumeConversation already opens it, but this ensures consistency)
            if (activeCollectionId !== 'conversations') {
                onOpenAIPanel();
            }
        }
    };

    // Restored handler for conversation dashboard (not modal, legacy call usage check)
    const handleDeleteConversation = (id: string) => {
        const conv = conversations.find(c => c.id === id);
        if (conv) handleDeleteConversationInitiate(conv);
    };

    // Reset active conversation when leaving Prometheus (with 5-minute persistence)
    const [lastPrometheusExitTime, setLastPrometheusExitTime] = useState<number | null>(null);

    useEffect(() => {
        if (activeCollectionId === 'prometheus') {
            const now = Date.now();
            const persistenceDuration = 10 * 60 * 1000; // 10 mins

            if (lastPrometheusExitTime && (now - lastPrometheusExitTime > persistenceDuration)) {
                // Expired
                if (!activeConversation?.collections?.length) {
                    setActiveConversation(null);
                    setPrometheusConversationTitle('New Conversation');
                }
                // If saved, we also clear to force reload/reset
                setActiveConversation(null);
                setPrometheusConversationTitle('New Conversation');
            }
            // If (!lastPrometheusExitTime), it's first entry (or manual nav) - DO NOT CLEAR.
            // If (now - last < duration), persistence active - DO NOT CLEAR.
            // If within 5 mins, we do nothing (state persisted).
        } else {
            // Leaving Prometheus
            setLastPrometheusExitTime(Date.now());
            // Do NOT clear activeConversation here.
        }
    }, [activeCollectionId]);

    const handlePrometheusPromptConsumed = () => {
        setPrometheusPagePrompt(undefined);
    };

    const handleNewConversation = () => {
        setActiveConversation(null);
        setPrometheusConversationTitle('New Conversation');
        setPrometheusPagePrompt(''); // Clear prompt
        // Clear parent's activeConversationId so we don't reload the old conversation
        if (onClearConversation) {
            onClearConversation();
        }
        // Navigate to Prometheus to start the new conversation
        onSelectCollection('prometheus');
    };

    // Dynamic Title Generator
    const getPageTitle = () => {
        if (activeCollectionId === 'academy') return 'All Courses';
        if (activeCollectionId === 'dashboard') {
            const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
            return `Welcome ${firstName} `;
        }
        if (activeCollectionId === 'instructors') return 'Course Experts';
        if (activeCollectionId === 'prometheus') return prometheusConversationTitle || 'Prometheus AI';
        if (activeCollectionId === 'tools') return 'AI-Powered Tools';
        if (activeCollectionId === 'help') return 'Platform Features';
        if (activeCollectionId === 'new-org-collection') return 'New Org Collection';
        if (activeCollectionId === 'company') return 'Org Collection';
        if (activeCollectionId === 'assigned-learning') return 'Assigned Learning';

        // Org collections
        if (viewingOrgCollection) return viewingOrgCollection.name;

        const predefined = COLLECTION_NAV_ITEMS.find(i => i.id === activeCollectionId);
        if (predefined) return predefined.label;

        const custom = customCollections.find(c => c.id === activeCollectionId);
        if (custom) return custom.label;

        return 'Collection';
    };

    const getSubTitle = () => {
        if (activeCollectionId === 'academy') return 'Academy Collection';
        if (activeCollectionId === 'dashboard') return 'My Dashboard';
        if (activeCollectionId === 'instructors') return 'Academy';
        if (activeCollectionId === 'personal-context') return 'Personal Context';
        if (activeCollectionId === 'prometheus') return 'AI Assistant';
        if (activeCollectionId === 'tools') return 'Tools Collection';
        if (activeCollectionId === 'help') return 'Help Collection';
        if (activeCollectionId === 'new-org-collection') return 'Create Collection';
        if (activeCollectionId === 'company') return 'Org Collection';
        if (activeCollectionId === 'assigned-learning') return 'My Learning';
        if (viewingOrgCollection) return 'Org Collection';
        return 'My Collection';
    };

    // Helper to determine if a specific collection is effectively empty (contains no courses)
    // This is different from "No Results" due to filtering.

    // RESOLVE ALIAS TO UUID for Filtering
    const resolvedCollectionId = useMemo(() => {
        const SYSTEM_MAP: Record<string, string> = {
            'favorites': 'Favorites',
            'research': 'Workspace',
            'to_learn': 'Watchlist',
            'personal-context': 'Personal Context'
        };

        const label = SYSTEM_MAP[activeCollectionId];
        if (label) {
            const found = customCollections.find(c => c.label === label);
            return found ? found.id : activeCollectionId;
        }
        return activeCollectionId;
    }, [activeCollectionId, customCollections]);

    // --- CONTEXT ITEMS FETCHING EFFECT ---
    // --- CONTEXT ITEMS & COLLECTION COURSES FETCHING EFFECT ---
    useEffect(() => {
        // Skip fetch if we just did a manual delete (prevents flash from refetching)
        if (skipNextCollectionFetchRef.current) {
            skipNextCollectionFetchRef.current = false;
            return;
        }

        const loadMixedItems = async () => {
            // Guard: Don't fetch for system pages that aren't collections
            if (activeCollectionId === 'dashboard' || activeCollectionId === 'academy') {
                setCollectionItems([]);
                return;
            }

            // Determine if we should fetch Standard Items (Courses) via hook
            const isStandardNav = COLLECTION_NAV_ITEMS.some(i => i.id === activeCollectionId && i.id !== 'favorites');
            const isCustom = customCollections.some(c => c.id === activeCollectionId);
            const shouldFetchStandard = activeCollectionId === 'favorites' ||
                activeCollectionId === 'research' ||
                activeCollectionId === 'to_learn' ||
                activeCollectionId === 'personal-context' ||
                isCustom;

            setIsLoadingCollection(true);

            try {
                // Fetch Items (Main Hook handles merging courses + context items now)
                const standardItems = shouldFetchStandard
                    ? await fetchCollectionItems(resolvedCollectionId || activeCollectionId)
                        .then(res => res.items)
                        .catch(err => {
                            console.error("Failed to load standard collection items", err);
                            return [];
                        })
                    : [];

                setCollectionItems(standardItems as CollectionItemDetail[]);

            } catch (err) {
                console.error("Error loading mixed collection items", err);
                setCollectionItems([]);
            } finally {
                setIsLoadingCollection(false);
            }
        };

        loadMixedItems();
    }, [resolvedCollectionId, activeCollectionId, onCollectionUpdate, savedItemIds, customCollections, fetchCollectionItems, refreshTrigger]);

    // --- Critical State Sync ---
    // Ensure visibleCourses is populated when we have courses (fixes empty Academy view regression)
    useEffect(() => {
        if (courses.length > 0 && activeCollectionId === 'academy' && activeFilterCount === 0) {
            setVisibleCourses(courses);
        }
    }, [courses, activeCollectionId, activeFilterCount]);

    // Cleanup: Removed Debug Logging

    const visibleConversations = conversations.filter(c => {
        // Filter by the RESOLVED ID (UUID) OR the System Alias (e.g. 'favorites')
        return c.collections?.includes(resolvedCollectionId) || c.collections?.includes(activeCollectionId);
    });

    const isCollectionEmpty =
        activeCollectionId !== 'academy' &&
        activeCollectionId !== 'dashboard' &&
        courses.filter(c => c.collections.includes(activeCollectionId)).length === 0 && // Courses might still use string alias if not updated? ACTUALLY Courses use 'isSaved' mainly or IDs.. check standard behavior.
        // Wait, standard courses use 'isSaved' boolean for Favorites usually? 
        // Or do they use collections array? 
        // In 'courses' definition: collections: string[]? 
        // Let's check MainCanvas:955: if (!course.collections.includes(activeCollectionId)) return false;
        // If courses ALSO use UUIDs now, we need to fix course filtering too!
        // But for now, user issue is CONVERSATIONS.
        visibleConversations.length === 0;

    const isAcademyView = activeCollectionId === 'academy' && activeFilterCount === 0;

    // Render Visual Helpers
    const renderCollectionVisual = () => {
        if (activeCollectionId === 'conversations') return <ConversationVisual />;
        if (activeCollectionId === 'company') return <CompanyVisual />;
        if (viewingOrgCollection) return <CompanyVisual />;
        if (activeCollectionId === 'instructors') return <InstructorVisual />;
        if (activeCollectionId === 'help') return <HelpVisual />;
        return <GenericVisual />;
    };

    const renderCollectionFooter = () => {
        // Don't show footer in Academy view (catalog view)
        if (activeCollectionId === 'academy' || activeCollectionId === 'dashboard') return null;
        // Should show for personal-context now

        return (
            <div className="mt-[100px] mb-10 flex flex-col items-center justify-center animate-fade-in">
                {/* Graphic at Top of Footer */}
                <div className="mb-[50px] transform scale-75 opacity-60 hover:opacity-100 hover:scale-90 transition-all duration-500 ease-out animate-float">
                    {renderCollectionVisual()}
                </div>

                {/* Toggle Button */}
                {/* Toggle Button */}
                <button
                    onClick={() => setExpandedFooter(!expandedFooter)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300
                ${expandedFooter
                            ? 'bg-brand-blue-light text-brand-black border-brand-blue-light shadow-[0_0_15px_rgba(120,192,240,0.4)]'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }
                `}
                >
                    <Info size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">About {getPageTitle()}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${expandedFooter ? 'rotate-180' : ''} `} />
                </button>

                {/* Expandable Content */}
                <div className={`
                mt-8 overflow-hidden transition-all duration-500 ease-in-out w-full
                  ${expandedFooter ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
                `}>
                    <div className="mt-[100px] mb-10 flex flex-col items-center animate-fade-in relative z-10 w-full mx-auto max-w-7xl px-4">
                        {renderCollectionVisual()}
                        <CollectionInfo
                            type={activeCollectionId}
                            isEmptyState={false}
                            onOpenHelp={() => toggleDrawer('help')}
                        />
                    </div>
                </div>
            </div >
        );
    };

    // --- Determine Content to Render ---
    const selectedCourse = selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null;
    const selectedInstructor = selectedInstructorId ? MOCK_INSTRUCTORS.find(i => i.id === selectedInstructorId) : null;

    if (selectedInstructor) {
        return (
            <div className="flex-1 w-full h-full relative z-10">
                <InstructorPage
                    instructor={selectedInstructor}
                    courses={courses}
                    onBack={handleBackToCollection}
                    onCourseClick={handleCourseClick}
                />
            </div>
        );
    }


    if (selectedCourse) {
        // Use the new unified CoursePageV2 which handles both description and player views internally
        return (
            <div
                className="flex-1 w-full h-full relative z-10"
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                onDrop={() => setIsDragging(false)}
            >
                {/* Drag Layer for course page dragging */}
                {isDragging && draggedItem && (
                    <CustomDragLayer
                        item={draggedItem}
                        x={mousePos.x}
                        y={mousePos.y}
                    />
                )}

                {/* Unified Course Page with internal view mode switching */}
                <CoursePageV2
                    course={selectedCourse}
                    syllabus={selectedCourseSyllabus}
                    resources={selectedCourseResources}
                    onBack={handleBackToCollection}
                    onDragStart={handleDragStart}
                    onAddToCollection={(item) => {
                        onOpenModal(item as any);
                    }}
                    onAskPrometheus={handleAskPrometheus}
                    userId={user?.id || ''}
                    initialLessonId={resumeLessonId}
                    initialModuleId={resumeModuleId}
                />

                {/* Allow drag and drop to footer from Course Page */}
                <div className="absolute bottom-0 left-0 w-full z-[60] pointer-events-none">
                    <CollectionSurface
                        isDragging={isDragging}
                        activeFlareId={flaringPortalId}
                        onCollectionClick={() => { }}
                        customCollections={customCollections}
                        isOpen={isCollectionSurfaceOpen}
                        onToggle={() => setIsCollectionSurfaceOpen(!isCollectionSurfaceOpen)}
                        onDropCourse={(portalId) => {
                            if (draggedItem) {
                                if (portalId === 'new') {
                                    // Open modal for New/Other collection selection
                                    if (draggedItem.type === 'COURSE') {
                                        onOpenModal(courses.find(c => c.id === draggedItem.id));
                                    } else {
                                        // For non-course items, pass the dragItem as context
                                        onOpenModal(draggedItem as any);
                                    }
                                } else {
                                    // Add to existing collection
                                    onImmediateAddToCollection(draggedItem.id, portalId, draggedItem.type);
                                    setFlaringPortalId(portalId);
                                    setTimeout(() => setFlaringPortalId(null), 500);
                                }
                                setIsDragging(false);
                                setDraggedItem(null);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    const renderCollectionContent = () => {
        // Expanded to include 'research' (Workspace) and 'to_learn' (Watchlist) and 'conversations'
        const isUniversalCollection = activeCollectionId === 'favorites' ||
            activeCollectionId === 'research' ||
            activeCollectionId === 'to_learn' ||
            activeCollectionId === 'conversations' || // Added conversations
            activeCollectionId === 'notes' || // Added notes
            activeCollectionId === 'personal-context' ||
            customCollections.some(c => c.id === activeCollectionId);

        if (isUniversalCollection) {
            if (isLoadingCollection && activeCollectionId !== 'personal-context' && activeCollectionId !== 'conversations' && activeCollectionId !== 'notes') {
                return <div className="text-white p-10 font-bold">Loading collection...</div>;
            }

            // Notes collection - render note cards directly
            if (activeCollectionId === 'notes') {
                if (isLoadingNotes) {
                    return <div className="text-white p-10 font-bold">Loading notes...</div>;
                }

                if (notes.length === 0) {
                    return (
                        <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <StickyNote className="text-amber-400 w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Edit className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Capture Your Learning Insights</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                Take notes as you learn, jot down key takeaways, and build your personal knowledge base. Notes created during courses stay connected to their context, making it easy to recall and apply what you've learned.
                            </p>
                            <p className="text-xs text-slate-500">Click "New Note" to create your first note.</p>
                        </div>
                    );
                }

                return (
                    <div className="grid gap-4 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {notes.map((note, index) => (
                            <div key={note.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <UniversalCard
                                    type="NOTE"
                                    title={note.title}
                                    description={note.content.length > 150 ? note.content.slice(0, 150) + '...' : note.content}
                                    meta={new Date(note.updated_at).toLocaleDateString()}
                                    collections={note.collections}
                                    onAction={() => handleOpenNoteEditor(note.id)}
                                    onRemove={() => handleDeleteNoteInitiate(note)}
                                    onAdd={() => onOpenModal({ type: 'NOTE', id: note.id, title: note.title } as any)}
                                    draggable={true}
                                    onDragStart={() => handleDragStart({
                                        type: 'NOTE',
                                        id: note.id,
                                        title: note.title
                                    })}
                                />
                            </div>
                        ))}

                        {/* Notes Collection Description Footer */}
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <StickyNote className="text-amber-400 w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Edit className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Capture Your Learning Insights</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Take notes as you learn, jot down key takeaways, and build your personal knowledge base. Notes created during courses stay connected to their context, making it easy to recall and apply what you've learned.
                            </p>
                        </div>
                    </div>
                );
            }

            // Determine items source
            let sourceItems = collectionItems;
            if (activeCollectionId === 'conversations') {
                sourceItems = conversations.map(c => ({
                    ...c,
                    // Use correct type for tool conversations vs regular conversations
                    itemType: c.type === 'TOOL_CONVERSATION' ? 'TOOL_CONVERSATION' : 'CONVERSATION'
                })) as any[];
            }

            let displayItems = sourceItems;

            // VIRTUAL PROFILE CARD LOGIC
            if (activeCollectionId === 'personal-context') {
                // Dedupe Profiles
                const profiles = displayItems.filter(i => i.itemType === 'PROFILE');
                const others = displayItems.filter(i => i.itemType !== 'PROFILE');

                if (profiles.length === 0) {
                    const virtualProfile: any = {
                        id: 'virtual-profile-placeholder',
                        itemType: 'PROFILE',
                        type: 'PROFILE',
                        title: 'My Profile',
                        content: {},
                        created_at: new Date().toISOString(),
                        user_id: user?.id || ''
                    };
                    displayItems = [virtualProfile, ...others];
                } else {
                    // Even if only 1 profile, ensure it is FIRST in the list
                    displayItems = [profiles[0], ...others];
                }
            } else {
                // For standard collections (Favorites, Custom), merge in relevant conversations
                // Filter out conversations that are ALREADY in sourceItems (DB-backed) to prevent double display
                const existingIds = new Set(sourceItems.map(i => i.id || (i as any).item_id)); // Use item_id if available for references

                const conversationItems = visibleConversations
                    .filter(c => !existingIds.has(c.id)) // DE-DUPLICATION
                    .map(c => ({
                        ...c,
                        itemType: 'CONVERSATION',
                        // Ensure title/subtitle maps correctly if needed by UniversalCollectionCard
                        // Conversation has 'title', UniversalCollectionCard expects 'title'
                    })) as any[];
                displayItems = [...sourceItems, ...conversationItems];
            }

            if (displayItems.length === 0) {
                // Render beautiful empty state based on collection type
                const renderEmptyState = () => {
                    if (activeCollectionId === 'personal-context') {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <Sparkles className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <FileText className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">Customize Your AI Experience</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    The context you add here (Personal Profile, Documents, Key Insights) is automatically shared with your AI Tutors to give you highly personalized guidance across the entire platform.
                                </p>
                                <p className="text-xs text-slate-500">Add custom context to help the AI understand you better.</p>
                            </div>
                        );
                    }
                    if (activeCollectionId === 'favorites') {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-brand-red/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <Star className="text-brand-red w-full h-full" strokeWidth={1} fill="currentColor" />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <BookOpen className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Curated Learning Journey</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    Save courses, lessons, and conversations that matter most to you. Your favorites are always just one click away, making it easy to revisit key insights and continue your professional growth.
                                </p>
                                <p className="text-xs text-slate-500">Drag and drop items here to save them.</p>
                            </div>
                        );
                    }
                    if (activeCollectionId === 'research') {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <Target className="text-brand-orange w-full h-full" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <Lightbulb className="text-amber-400 w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Active Learning Hub</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    Organize content you're actively working with. Use this space to collect courses, modules, and resources for current projects or initiatives—perfect for deep-dive research and focused learning.
                                </p>
                                <p className="text-xs text-slate-500">Drag and drop items here to organize them.</p>
                            </div>
                        );
                    }
                    if (activeCollectionId === 'to_learn') {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <Bookmark className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <Clock className="text-slate-400 w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">Queue Up Your Future Learning</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    Bookmark content you want to explore later. Build a personalized pipeline of courses and lessons that match your career goals—your future self will thank you.
                                </p>
                                <p className="text-xs text-slate-500">Drag and drop items here to save for later.</p>
                            </div>
                        );
                    }
                    if (activeCollectionId === 'conversations') {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <MessageSquare className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <Flame className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your AI Learning Dialogues</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    Every conversation with your AI tutor is saved here. Revisit past discussions, continue where you left off, and watch your understanding deepen over time through personalized dialogue.
                                </p>
                                <p className="text-xs text-slate-500">Start a conversation to see it here.</p>
                            </div>
                        );
                    }
                    if (viewingOrgCollection) {
                        return (
                            <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                                <div className="mb-6 relative w-32 h-32">
                                    <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full"></div>
                                    <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                        <Building className="text-slate-400 w-full h-full" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                        <Users className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-light text-white mb-2 tracking-wide">{viewingOrgCollection.name}</h3>
                                <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                    {viewingOrgCollection.isOrgAdmin
                                        ? 'Add content to this company collection to share it with your entire organization. Drag courses here or use the + buttons above.'
                                        : 'Access content curated specifically for your organization. Save items to your personal collections to keep learning.'}
                                </p>
                                <p className="text-xs text-slate-500">This collection is currently empty.</p>
                            </div>
                        );
                    }
                    // Custom collections fallback
                    return (
                        <div className="flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Folder className="text-purple-400 w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Layers className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Custom Collection</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed mb-4">
                                Organize your learning your way. Create themed collections for specific projects, skill tracks, or topics you're passionate about—complete flexibility to structure your professional development journey.
                            </p>
                            <p className="text-xs text-slate-500">Drag and drop items here to organize them.</p>
                        </div>
                    );
                };
                return renderEmptyState();
            }




            return (
                <div className="grid gap-4 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {displayItems.map((item, index) => (
                        <div key={`${item.itemType}-${item.id}`} className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}>
                            <UniversalCollectionCard
                                item={item}
                                onRemove={(id, type) => handleRemoveItem(id, type)}
                                onClick={(item) => {
                                    if (item.itemType === 'COURSE') handleCourseClick((item as Course).id);
                                    else if (item.itemType === 'MODULE') {
                                        handleModuleClick(item);
                                    }
                                    else if (item.itemType === 'LESSON') {
                                        handleLessonClick(item);
                                    }
                                    else if (item.itemType === 'CONVERSATION') {
                                        handleOpenConversation(item.id);
                                    }
                                    else if (item.itemType === 'TOOL_CONVERSATION') {
                                        // Navigate to the tool page with the conversation loaded
                                        const toolConv = item as any;
                                        window.location.href = `/tools/${toolConv.tool_slug}?conversationId=${item.id}`;
                                    }
                                    else if (item.itemType === 'NOTE') {
                                        // Open the note editor
                                        handleOpenNoteEditor(item.id as string);
                                    }
                                    else if (item.itemType === 'AI_INSIGHT' || item.itemType === 'CUSTOM_CONTEXT' || item.itemType === 'FILE' || item.itemType === 'PROFILE') {
                                        handleOpenContextEditor(item.itemType, item as any);
                                    }
                                }}
                                onAdd={(item) => onOpenModal(item as any)}
                                onDragStart={handleDragStart}
                            />
                        </div>
                    ))}

                    {/* --- Collection Helper Footers --- */}

                    {/* Personal Context */}
                    {activeCollectionId === 'personal-context' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Sparkles className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <FileText className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Customize Your AI Experience</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                The context you add here (Personal Profile, Documents, Key Insights) is automatically shared with your AI Tutors to give you highly personalized guidance across the entire platform.
                            </p>
                        </div>
                    )}

                    {/* Favorites */}
                    {activeCollectionId === 'favorites' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-brand-red/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Star className="text-brand-red w-full h-full" strokeWidth={1} fill="currentColor" />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <BookOpen className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Curated Learning Journey</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Save courses, lessons, and conversations that matter most to you. Your favorites are always just one click away, making it easy to revisit key insights and continue your professional growth.
                            </p>
                        </div>
                    )}

                    {/* Workspace (research) */}
                    {activeCollectionId === 'research' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Target className="text-brand-orange w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Lightbulb className="text-amber-400 w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Active Learning Hub</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Organize content you're actively working with. Use this space to collect courses, modules, and resources for current projects or initiatives—perfect for deep-dive research and focused learning.
                            </p>
                        </div>
                    )}

                    {/* Watchlist (to_learn) */}
                    {activeCollectionId === 'to_learn' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Bookmark className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Clock className="text-slate-400 w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Queue Up Your Future Learning</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Bookmark content you want to explore later. Build a personalized pipeline of courses and lessons that match your career goals—your future self will thank you.
                            </p>
                        </div>
                    )}

                    {/* Conversations */}
                    {activeCollectionId === 'conversations' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-brand-blue-light/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <MessageSquare className="text-brand-blue-light w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Flame className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your AI Learning Dialogues</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Every conversation with your AI tutor is saved here. Revisit past discussions, continue where you left off, and watch your understanding deepen over time through personalized dialogue.
                            </p>
                        </div>
                    )}

                    {/* Company */}
                    {viewingOrgCollection && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Building className="text-slate-400 w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Users className="text-brand-blue-light w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">{viewingOrgCollection.name}</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                {viewingOrgCollection.isOrgAdmin
                                    ? 'Add more content using the + buttons above or drag courses from the Academy.'
                                    : 'Save items to your personal collections to continue your learning journey.'}
                            </p>
                        </div>
                    )}

                    {/* Custom Collections */}
                    {customCollections.some(c => c.id === activeCollectionId) && activeCollectionId !== 'favorites' && activeCollectionId !== 'research' && activeCollectionId !== 'to_learn' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-[150px] pb-10 opacity-60">
                            <div className="mb-6 relative w-32 h-32">
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"></div>
                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                    <Folder className="text-purple-400 w-full h-full" strokeWidth={1} />
                                </div>
                                <div className="absolute -right-4 -bottom-2 p-4 border border-white/10 bg-black/40 backdrop-blur-sm rounded-lg -rotate-6">
                                    <Layers className="text-brand-orange w-8 h-8" strokeWidth={1} />
                                </div>
                            </div>
                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Your Custom Collection</h3>
                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                Organize your learning your way. Create themed collections for specific projects, skill tracks, or topics you're passionate about—complete flexibility to structure your professional development journey.
                            </p>
                        </div>
                    )}
                </div>
            );
        }


        // Determine what to render based on active collection
        const isSpecialCollection = activeCollectionId === 'favorites' || customCollections.some(c => c.id === activeCollectionId) || activeCollectionId === 'personal-context';



        // Default Grid (All Courses / Filtered)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-20">
                {visibleCourses.map((course, index) => (
                    <div
                        key={course.id}
                        className="transform transition-all duration-500 hover:z-20"
                        style={{
                            opacity: isDrawerOpen ? 0 : 1,
                            transform: isDrawerOpen ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)',
                            transitionDelay: `${index * 50} ms`
                        }}
                    >
                        <UniversalCard
                            type="COURSE"
                            title={course.title}
                            subtitle={course.author}
                            description={course.description}
                            imageUrl={course.image}
                            meta={course.duration}
                            categories={[course.category]}
                            rating={course.rating}
                            credits={{
                                shrm: course.badges?.includes('SHRM'),
                                hrci: course.badges?.includes('HRCI')
                            }}
                            actionLabel="VIEW"
                            onAction={() => handleCourseClick(course.id)}
                            onAdd={() => onOpenModal(course)}
                            draggable={true}
                            onDragStart={() => handleCourseDragStart(course.id)}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 h-full relative flex flex-col bg-transparent overflow-hidden">


            <div
                className="flex-1 flex flex-col relative overflow-hidden bg-transparent"
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragEnd={handleDragEnd}
                onDrop={(e) => {
                    setIsDragging(false);
                }}
            >

                {isDragging && draggedItem && (
                    <CustomDragLayer
                        item={draggedItem}
                        x={mousePos.x}
                        y={mousePos.y}
                    />
                )}

                {/* --- Drawer Overlay - REFACTORED TO GLOBAL TOP PANEL --- */}
                <GlobalTopPanel
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    title={
                        drawerMode === 'help' ? (
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles size={20} className="text-brand-orange" /> Help & Resources
                            </h2>
                        ) : drawerMode === 'prompts' ? (
                            <h2 className="text-lg font-light text-white flex items-center gap-2">
                                <Sparkles size={16} className="text-brand-blue-light" /> Prompt Library
                            </h2>
                        ) : (
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {activeFilters.category === 'All' ? 'All Courses' : activeFilters.category}
                            </h2>
                        )
                    }
                    headerActions={
                        drawerMode === 'filters' ? (
                            <div className="flex items-center gap-4">
                                {activeFilters.category !== 'All' && (
                                    <button
                                        onClick={() => {
                                            setPendingFilters(INITIAL_FILTERS);
                                            setActiveFilters(INITIAL_FILTERS);
                                        }}
                                        className="text-xs font-normal text-brand-orange hover:text-brand-orange-light transition-colors flex items-center gap-1"
                                    >
                                        <X size={12} /> Clear Filter
                                    </button>
                                )}
                                <button
                                    onClick={() => setPendingFilters(INITIAL_FILTERS)}
                                    className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw size={16} className="mr-2" /> Reset
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    className="
                                    bg-brand-blue-light text-brand-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                                    hover:bg-brand-orange hover:text-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.4)]
                                "
                                >
                                    Show {applyFilters(pendingFilters, courses).length} Results
                                </button>
                            </div>
                        ) : null
                    }
                >
                    {drawerMode === 'help' ? (
                        <PrometheusHelpContent />
                    ) : drawerMode === 'prompts' ? (
                        <div className="max-w-6xl mx-auto px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {panelPrompts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        handlePrometheusPagePrompt(p.prompt);
                                        setIsDrawerOpen(false);
                                    }}
                                    className="text-left p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.08] transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-slate-600 group-hover:text-brand-blue-light mb-2 transition-colors">
                                        <MessageSquare size={12} />
                                        <span className="text-[10px] uppercase tracking-wider">{p.category}</span>
                                    </div>
                                    <div className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2">
                                        {p.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Search Input */}
                            <div className="relative mb-4 mt-10 group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue to-brand-orange opacity-30 group-focus-within:opacity-100 blur transition-opacity duration-500 rounded-lg"></div>
                                <div className="relative bg-black rounded-lg flex items-center px-4 py-4 border border-white/10">
                                    <Search size={20} className="text-slate-500 mr-4" />
                                    <input
                                        type="text"
                                        value={pendingFilters.searchQuery}
                                        onChange={(e) => setPendingFilters({ ...pendingFilters, searchQuery: e.target.value })}
                                        placeholder="Search for courses, authors, or topics..."
                                        className="bg-transparent border-none outline-none text-lg text-white placeholder-slate-600 w-full"
                                    />
                                </div>
                            </div>

                            {/* Include Lessons Toggle - Only show when search query exists */}
                            {pendingFilters.searchQuery && (
                                <div className="flex items-center justify-between mb-8 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={16} className="text-brand-blue-light" />
                                        <span className="text-sm text-slate-300">Include individual lessons in results</span>
                                    </div>
                                    <button
                                        onClick={() => setPendingFilters({
                                            ...pendingFilters,
                                            includeLessons: !pendingFilters.includeLessons
                                        })}
                                        className={`
                                            relative w-12 h-6 rounded-full transition-colors
                                            ${pendingFilters.includeLessons ? 'bg-brand-blue-light' : 'bg-slate-600'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                                            ${pendingFilters.includeLessons ? 'left-7' : 'left-1'}
                                        `} />
                                    </button>
                                </div>
                            )}

                            {/* Spacer when no search query to maintain consistent spacing */}
                            {!pendingFilters.searchQuery && <div className="mb-4" />}

                            {/* Filter Grid */}
                            <div className="grid grid-cols-5 gap-8 mb-8">

                                {/* Col 1: Credits & Designations */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Credits</h3>
                                        <div className="space-y-2">
                                            {['SHRM', 'HRCI'].map(credit => (
                                                <label key={credit} className="flex items-center space-x-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${pendingFilters.credits.includes(credit) ? 'bg-brand-blue-light border-brand-blue-light' : 'border-slate-600 group-hover:border-slate-400'} `}>
                                                        {pendingFilters.credits.includes(credit) && <Check size={12} className="text-black" />}
                                                    </div>
                                                    <span className={`text-sm transition-colors ${pendingFilters.credits.includes(credit) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} `}>{credit}</span>
                                                    <input type="checkbox" className="hidden" checked={pendingFilters.credits.includes(credit)} onChange={() => toggleArrayFilter('credits', credit)} />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Designation</h3>
                                        <div className="space-y-2">
                                            {['REQUIRED', 'RECOMMENDED'].map(item => (
                                                <label key={item} className="flex items-center space-x-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${pendingFilters.designations.includes(item) ? 'bg-brand-orange border-brand-orange' : 'border-slate-600 group-hover:border-slate-400'} `}>
                                                        {pendingFilters.designations.includes(item) && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <span className={`text-sm transition-colors ${pendingFilters.designations.includes(item) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} `}>
                                                        {item.charAt(0) + item.slice(1).toLowerCase()}
                                                    </span>
                                                    <input type="checkbox" className="hidden" checked={pendingFilters.designations.includes(item)} onChange={() => toggleArrayFilter('designations', item)} />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Categories */}
                                <div className="col-span-1">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Categories</h3>
                                    <div className="space-y-2 h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {COURSE_CATEGORIES.map(cat => (
                                            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${pendingFilters.category === cat ? 'bg-brand-blue-light border-brand-blue-light' : 'border-slate-600 group-hover:border-slate-400'} `}>
                                                    {pendingFilters.category === cat && <Check size={12} className="text-black" />}
                                                </div>
                                                <span className={`text-sm truncate transition-colors ${pendingFilters.category === cat ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} `}>{cat}</span>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={pendingFilters.category === cat}
                                                    onChange={() => {
                                                        setPendingFilters(prev => ({
                                                            ...prev,
                                                            category: prev.category === cat ? 'All' : cat
                                                        }));
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 3: Status */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status</h3>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'NOT_STARTED', label: 'Not Started' },
                                            { id: 'IN_PROGRESS', label: 'In Progress' },
                                            { id: 'COMPLETED', label: 'Completed' }
                                        ].map(stat => (
                                            <label key={stat.id} className="flex items-center space-x-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${pendingFilters.status.includes(stat.id) ? 'bg-brand-blue-light border-brand-blue-light' : 'border-slate-600 group-hover:border-slate-400'} `}>
                                                    {pendingFilters.status.includes(stat.id) && <Check size={12} className="text-black" />}
                                                </div>
                                                <span className={`text-sm transition-colors ${pendingFilters.status.includes(stat.id) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} `}>{stat.label}</span>
                                                <input type="checkbox" className="hidden" checked={pendingFilters.status.includes(stat.id)} onChange={() => toggleArrayFilter('status', stat.id)} />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 4: Ratings */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Minimum Rating</h3>
                                    <div className="space-y-2">
                                        {/* Any Rating */}
                                        <button
                                            onClick={() => setPendingFilters(prev => ({ ...prev, ratingFilter: 'ALL' }))}
                                            className={`
w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all
                                    ${pendingFilters.ratingFilter === 'ALL'
                                                    ? 'bg-brand-orange/20 border-brand-orange text-white'
                                                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                                }
`}
                                        >
                                            <span>Any Rating</span>
                                            {pendingFilters.ratingFilter === 'ALL' && <Check size={14} className="text-brand-orange" />}
                                        </button>

                                        {/* Rated Options */}
                                        {[
                                            { val: '4_PLUS', label: '4+ Stars' },
                                            { val: '3_PLUS', label: '3+ Stars' },
                                            { val: '2_PLUS', label: '2+ Stars' },
                                            { val: '1_PLUS', label: '1+ Stars' },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => setPendingFilters(prev => ({ ...prev, ratingFilter: opt.val as RatingFilterType }))}
                                                className={`
w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all
                                    ${pendingFilters.ratingFilter === opt.val
                                                        ? 'bg-brand-orange/20 border-brand-orange text-white'
                                                        : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                                    }
`}
                                            >
                                                <span>{opt.label}</span>
                                                {pendingFilters.ratingFilter === opt.val && <Check size={14} className="text-brand-orange" />}
                                            </button>
                                        ))}

                                        {/* Not Yet Rated */}
                                        <button
                                            onClick={() => setPendingFilters(prev => ({ ...prev, ratingFilter: 'NOT_RATED' }))}
                                            className={`
w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all
                                    ${pendingFilters.ratingFilter === 'NOT_RATED'
                                                    ? 'bg-brand-orange/20 border-brand-orange text-white'
                                                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                                }
`}
                                        >
                                            <span>Not Yet Rated</span>
                                            {pendingFilters.ratingFilter === 'NOT_RATED' && <Check size={14} className="text-brand-orange" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Col 5: Date Added */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Date Added</h3>
                                    <div className="space-y-2">
                                        {/* All Time */}
                                        <button
                                            onClick={() => setPendingFilters(prev => ({ ...prev, dateFilterType: 'ALL' }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all ${pendingFilters.dateFilterType === 'ALL' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'} `}
                                        >
                                            <span>All Time</span>
                                            {pendingFilters.dateFilterType === 'ALL' && <Check size={14} className="text-brand-orange" />}
                                        </button>

                                        {/* Since Last Login */}
                                        <button
                                            onClick={() => setPendingFilters(prev => ({ ...prev, dateFilterType: 'SINCE_LOGIN' }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all ${pendingFilters.dateFilterType === 'SINCE_LOGIN' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'} `}
                                        >
                                            <span>Since Last Login</span>
                                            {pendingFilters.dateFilterType === 'SINCE_LOGIN' && <Check size={14} className="text-brand-orange" />}
                                        </button>

                                        {/* This Month */}
                                        <button
                                            onClick={() => setPendingFilters(prev => ({ ...prev, dateFilterType: 'THIS_MONTH' }))}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all ${pendingFilters.dateFilterType === 'THIS_MONTH' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'} `}
                                        >
                                            <span>This Month</span>
                                            {pendingFilters.dateFilterType === 'THIS_MONTH' && <Check size={14} className="text-brand-orange" />}
                                        </button>

                                        {/* Last X Days */}
                                        <div className={`p-2 rounded border transition-all ${pendingFilters.dateFilterType === 'LAST_X_DAYS' ? 'bg-brand-orange/10 border-brand-orange' : 'border-slate-700'} `}>
                                            <button
                                                onClick={() => setPendingFilters(prev => ({ ...prev, dateFilterType: 'LAST_X_DAYS' }))}
                                                className="w-full flex items-center justify-between mb-2"
                                            >
                                                <span className={`text-sm ${pendingFilters.dateFilterType === 'LAST_X_DAYS' ? 'text-white' : 'text-slate-400'} `}>Last ___ Days</span>
                                                {pendingFilters.dateFilterType === 'LAST_X_DAYS' && <Check size={14} className="text-brand-orange" />}
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={pendingFilters.customDays}
                                                    onChange={(e) => setPendingFilters(prev => ({ ...prev, customDays: e.target.value, dateFilterType: 'LAST_X_DAYS' }))}
                                                    onClick={() => setPendingFilters(prev => ({ ...prev, dateFilterType: 'LAST_X_DAYS' }))}
                                                    className="w-16 bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-brand-orange outline-none"
                                                />
                                                <span className="text-xs text-slate-500">Days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                </GlobalTopPanel>

                {/* --- Header --- */}
                {/* Always show header for Academy and most collections, hide only for specific full-screen views if needed */}
                {activeCollectionId !== 'org-team' && activeCollectionId !== 'users-groups' && !viewingGroupMember && (
                    <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
                        <div className="flex items-center gap-4">
                            {/* Back Button - appears when there's a previous page to navigate to */}
                            {previousCollectionId && onGoBack && (
                                <button
                                    onClick={onGoBack}
                                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                </button>
                            )}
                            <div>
                            {viewingGroup && viewingGroupMember ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users size={14} className="text-brand-blue-light" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light">User Account</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                        {viewingGroupMember.full_name}
                                    </h1>
                                </div>
                            ) : viewingGroup ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users size={14} className="text-brand-blue-light" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light">Employee Group</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                        {viewingGroup.name}
                                    </h1>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light">
                                            {activeCollectionId === 'personal-context' ? 'My Academy Profile' : getSubTitle()}
                                        </span>
                                    </div>
                                    {activeCollectionId === 'academy' && activeFilterCount > 0 ? (
                                        <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-2">
                                            Filtered <span className="font-bold text-white">Results</span>
                                            <span className="text-xs bg-brand-blue-light text-brand-black px-2 py-1 rounded-full font-bold align-middle">{activeFilterCount} Active</span>
                                        </h1>
                                    ) : activeCollectionId === 'personal-context' ? (
                                        <h1 className="text-3xl font-light text-white tracking-tight">
                                            Personal <span className="font-bold text-white">Context</span>
                                        </h1>
                                    ) : (
                                        <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                                            {isRenamingCollection ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') submitRename();
                                                            if (e.key === 'Escape') setIsRenamingCollection(false);
                                                        }}
                                                        className="bg-black/50 border border-brand-blue-light/50 rounded px-2 py-1 text-white font-bold outline-none min-w-[300px]"
                                                    />
                                                    <button onClick={submitRename} className="p-1 hover:bg-white/10 rounded-full text-brand-green">
                                                        <Check size={20} />
                                                    </button>
                                                    <button onClick={() => setIsRenamingCollection(false)} className="p-1 hover:bg-white/10 rounded-full text-red-400">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {getPageTitle().split(' ')[0]} <span className="font-bold text-white">{getPageTitle().split(' ').slice(1).join(' ')}</span>
                                                </>
                                            )}
                                        </h1>
                                    )}
                                </>
                            )}
                            </div>
                        </div>

                        <div className="flex space-x-4 items-center">
                            {viewingGroup && !viewingGroupMember ? (
                                <button
                                    onClick={() => {
                                        if (viewingGroup.is_dynamic) {
                                            setShowDynamicCriteriaPanel(true);
                                        } else {
                                            setShowGroupManagement(true);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                >
                                    <Settings size={14} /> {viewingGroup.is_dynamic ? 'Group Criteria' : 'Manage Group'}
                                </button>
                            ) : viewingGroup && viewingGroupMember ? (
                                null
                            ) : (
                                <>
                                    {/* Expanded to include Personal Context, Favorites, Workspace (research), Watchlist (to_learn), and Custom Collections */}
                                    {/* Note: Org collections (org-collection-*) only show these buttons if user is org admin */}
                                    {(activeCollectionId === 'personal-context' ||
                                        activeCollectionId === 'favorites' ||
                                        activeCollectionId === 'research' ||
                                        activeCollectionId === 'to_learn' ||
                                        customCollections.some(c => c.id === activeCollectionId) ||
                                        (viewingOrgCollection && viewingOrgCollection.isOrgAdmin)) && (
                                            <div className="flex items-center gap-2 mr-4">
                                                <button
                                                    onClick={() => handleCreateNote(viewingOrgCollection ? viewingOrgCollection.id : activeCollectionId)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                >
                                                    <Plus size={14} /> Note
                                                </button>
                                                <button
                                                    onClick={() => handleOpenContextEditor('CUSTOM_CONTEXT')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                >
                                                    <Plus size={14} /> Context
                                                </button>
                                                <button
                                                    onClick={() => handleOpenContextEditor('FILE')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                >
                                                    <Plus size={14} /> File
                                                </button>
                                            </div>
                                        )}

                                    {activeCollectionId === 'conversations' ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleNewConversation}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                            >
                                                <MessageSquare size={14} /> New Conversation
                                            </button>
                                        </div>
                                    ) : activeCollectionId === 'notes' ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleCreateNote()}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                            >
                                                <StickyNote size={14} /> New Note
                                            </button>
                                        </div>
                                    ) : activeCollectionId === 'prometheus' ? (
                                        /* Prometheus Actions */
                                        <div className="flex items-center gap-3">
                                            {/* Compute effective conversation data (handles both activeConversation and activeConversationId) */}
                                            {(() => {
                                                const effectiveConversation = activeConversation || (activeConversationId ? conversations.find(c => c.id === activeConversationId) : null);
                                                const effectiveMessages = effectiveConversation?.messages || [];
                                                const effectiveTitle = effectiveConversation?.title || prometheusConversationTitle || 'Prometheus Conversation';
                                                const hasActiveConversation = effectiveConversation !== null;
                                                const hasMessages = effectiveMessages.length > 0;

                                                return (
                                                    <>
                                                        {hasActiveConversation && (
                                                            <button
                                                                onClick={handleNewConversation}
                                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                            >
                                                                <MessageSquare size={14} /> New Conversation
                                                            </button>
                                                        )}

                                                        {/* Export Button - circular icon */}
                                                        {hasMessages && (
                                                            <button
                                                                onClick={() => exportConversationAsMarkdown(
                                                                    effectiveMessages,
                                                                    effectiveTitle,
                                                                    'Prometheus AI'
                                                                )}
                                                                className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                                                                title="Export conversation as Markdown"
                                                            >
                                                                <Download size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                                            </button>
                                                        )}

                                                        {/* Add to Collection Button - circular icon, always enabled for multi-collection support */}
                                                        {hasActiveConversation && effectiveTitle !== 'New Conversation' && (
                                                            <button
                                                                onClick={handleSaveConversation}
                                                                className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                                                                title="Save this conversation to a Collection"
                                                            >
                                                                <Plus size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : useDashboardV3 && activeCollectionId === 'dashboard' ? (
                                        /* Dashboard V3 Stats in Header - Smaller with warm glow */
                                        <div className="flex items-center gap-4">
                                            <div className="group relative flex items-center gap-1.5 cursor-default">
                                                <div className="p-1.5 rounded-md text-brand-blue-light transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(120,192,240,0.6)]">
                                                    <Clock size={14} />
                                                </div>
                                                <span className="text-base font-light text-white/80 group-hover:text-white transition-colors">{statsLoading ? '—' : dashboardStats.totalTime}</span>
                                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                    Total Learning Time
                                                </div>
                                            </div>

                                            <div className="w-px h-4 bg-white/10" />

                                            <div className="group relative flex items-center gap-1.5 cursor-default">
                                                <div className="p-1.5 rounded-md text-purple-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                                                    <BookOpen size={14} />
                                                </div>
                                                <span className="text-base font-light text-white/80 group-hover:text-white transition-colors">{statsLoading ? '—' : dashboardStats.coursesCompleted}</span>
                                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                    Courses Completed
                                                </div>
                                            </div>

                                            <div className="w-px h-4 bg-white/10" />

                                            <div className="group relative flex items-center gap-1.5 cursor-default">
                                                <div className="p-1.5 rounded-md text-brand-orange transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,147,0,0.6)]">
                                                    <Award size={14} />
                                                </div>
                                                <span className="text-base font-light text-white/80 group-hover:text-white transition-colors">{statsLoading ? '—' : dashboardStats.creditsEarned}</span>
                                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                    Credits Earned
                                                </div>
                                            </div>

                                            <div className="w-px h-4 bg-white/10" />

                                            <div className="group relative flex items-center gap-1.5 cursor-default">
                                                <div className="p-1.5 rounded-md text-emerald-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                                                    <Zap size={14} />
                                                </div>
                                                <span className="text-base font-light text-white/80 group-hover:text-white transition-colors">{statsLoading ? '—' : dashboardStats.streak}</span>
                                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                    Day Streak
                                                </div>
                                            </div>
                                        </div>

                                    ) : (
                                        /* Standard Actions */
                                        <>
                                            {activeCollectionId === 'academy' && activeFilterCount > 0 && (
                                                <button
                                                    onClick={handleResetFilters}
                                                    className="
                                     px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                     bg-white/10 text-slate-300 border border-white/20 hover:bg-white/20 hover:text-white
                                 "
                                                >
                                                    Clear Filters
                                                </button>
                                            )}

                                            {/* Quick Lesson Toggle - Show when search is active */}
                                            {activeCollectionId === 'academy' && activeFilters.searchQuery && (
                                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10">
                                                    <span className="text-xs text-slate-400">
                                                        {activeFilters.includeLessons ? 'Courses + Lessons' : 'Courses only'}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newFilters = {
                                                                ...activeFilters,
                                                                includeLessons: !activeFilters.includeLessons
                                                            };
                                                            setActiveFilters(newFilters);
                                                            setPendingFilters(newFilters);
                                                        }}
                                                        className={`
                                                            relative w-10 h-5 rounded-full transition-colors
                                                            ${activeFilters.includeLessons ? 'bg-brand-blue-light' : 'bg-slate-600'}
                                                        `}
                                                    >
                                                        <div className={`
                                                            absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                                                            ${activeFilters.includeLessons ? 'left-5' : 'left-0.5'}
                                                        `} />
                                                    </button>
                                                </div>
                                            )}

                                        </>
                                    )}

                                    {/* --- SEARCH & FILTER BUTTON (CONDITIONALLY HIDDEN) --- */}
                                    {/* Hide for Favorites, Watchlist, Personal Context, Dashboard, Prometheus, Help, Notes, Org Collections */}
                                    {!(activeCollectionId === 'favorites' ||
                                        activeCollectionId === 'conversations' ||
                                        activeCollectionId === 'notes' ||
                                        activeCollectionId === 'research' ||
                                        activeCollectionId === 'to_learn' ||
                                        activeCollectionId === 'personal-context' ||
                                        viewingOrgCollection ||
                                        activeCollectionId === 'instructors' ||
                                        activeCollectionId === 'dashboard' ||
                                        activeCollectionId === 'prometheus' ||
                                        activeCollectionId === 'tools' ||
                                        activeCollectionId === 'certifications' ||
                                        activeCollectionId === 'help' ||
                                        viewingGroup ||
                                        (customCollections && customCollections.some(c => c.id === activeCollectionId))
                                    ) && (
                                            <button
                                                onClick={handleOpenDrawer}
                                                className={`
                                group relative flex items-center px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md overflow-hidden border
                                ${isDrawerOpen ? 'bg-brand-blue-light text-brand-black border-brand-blue-light' : 'bg-black/40 text-brand-blue-light border-brand-blue-light/30 hover:bg-black/60'}
`}
                                            >
                                                {!isDrawerOpen && <div className="absolute inset-0 bg-brand-blue-light/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}

                                                <SlidersHorizontal size={14} className="mr-3" />
                                                <span>Search & Filter</span>
                                                {activeFilterCount > 0 && !isDrawerOpen && (
                                                    <div className="ml-3 bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                                                        {activeFilterCount}
                                                    </div>
                                                )}
                                                {isDrawerOpen && <ChevronDown size={14} className="ml-3" />}
                                            </button>
                                        )}

                                    {/* --- EXPERTS BUTTON (Only in Academy) --- */}
                                    {activeCollectionId === 'academy' && (
                                        <button
                                            onClick={() => onSelectCollection('instructors')}
                                            className="group relative flex items-center px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md overflow-hidden border bg-black/40 text-slate-300 border-white/10 hover:bg-black/60 hover:text-white hover:border-white/20"
                                        >
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <Users size={14} className="mr-3" />
                                            <span>Experts</span>
                                        </button>
                                    )}

                                    {/* --- CERTIFICATIONS BUTTON (Only in Academy) --- */}
                                    {activeCollectionId === 'academy' && (
                                        <button
                                            onClick={() => onSelectCollection('certifications')}
                                            className="group relative flex items-center px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md overflow-hidden border bg-black/40 text-slate-300 border-white/10 hover:bg-black/60 hover:text-white hover:border-white/20"
                                        >
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <Award size={14} className="mr-3" />
                                            <span>Certifications</span>
                                        </button>
                                    )}

                                    {/* --- CUSTOM COLLECTION MANAGEMENT --- */}
                                    {(customCollections.some(c => c.id === activeCollectionId) ||
                                      (viewingOrgCollection && viewingOrgCollection.isOrgAdmin)) && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                                className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                            >
                                                <Settings size={14} /> Manage
                                            </button>

                                            {isManageMenuOpen && (
                                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-fade-in-up">
                                                    <button
                                                        onClick={handleRenameCollectionSpy}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
                                                    >
                                                        <Edit size={14} /> Rename
                                                    </button>
                                                    {!viewingOrgCollection && (
                                                    <button
                                                        onClick={handleDeleteCollectionSpy}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                                                    >
                                                        <Trash size={14} /> Delete
                                                    </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Canvas Content Grid --- */}
                {
                    viewingGroup ? (
                        <div className="flex-1 w-full h-full bg-transparent overflow-y-auto relative z-10 custom-scrollbar">
                            <GroupDetailCanvasWrapper
                                group={viewingGroup}
                                manageTrigger={groupManageTrigger}
                                onViewingMember={setViewingGroupMember}
                                onDragStart={handleDragStart}
                                onCourseClick={handleCourseClick}
                                onModuleClick={handleModuleClick}
                                onLessonClick={handleLessonClick}
                                onConversationClick={handleOpenConversation}
                            />
                        </div>
                    ) :
                        activeCollectionId === 'prometheus' ? (
                            <div className="flex-1 w-full h-full overflow-hidden relative z-65">
                                <PrometheusFullPage
                                    onTitleChange={setPrometheusConversationTitle}
                                    onConversationStart={handleConversationStart}
                                    initialTitle={activeConversation?.title || (activeConversationId ? conversations.find(c => c.id === activeConversationId)?.title : undefined)}
                                    initialMessages={activeConversation?.messages || (activeConversationId ? conversations.find(c => c.id === activeConversationId)?.messages : undefined)}
                                    conversationId={activeConversation?.id || activeConversationId || undefined}
                                    onSaveConversation={handleSaveConversation}
                                    isSaved={!!activeConversation?.isSaved || (activeConversationId ? !!conversations.find(c => c.id === activeConversationId)?.isSaved : false)}
                                    initialPrompt={prometheusPagePrompt}
                                    onPromptConsumed={handlePrometheusPromptConsumed}
                                    onOpenDrawer={() => toggleDrawer('prompts')}
                                />
                            </div>
                        ) : (activeCollectionId === 'dashboard' || activeCollectionId === 'employee-dashboard' || activeCollectionId === 'org-admin-dashboard') ? (
                            <div className={`flex-1 w-full h-full overflow-hidden relative z-10 ${useDashboardV3 ? '' : 'mt-[60px]'}`}>
                                {activeCollectionId === 'org-admin-dashboard' || user?.role === 'org_admin' ? (
                                    <OrgAdminDashboard
                                        user={user}
                                        orgId={user.org_id || 'demo-org'}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                    />
                                ) : activeCollectionId === 'employee-dashboard' || user?.role === 'employee' ? (
                                    <EmployeeDashboard
                                        user={user}
                                        courses={courses}
                                        onNavigate={onSelectCollection}
                                        onStartCourse={handleStartCourse}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                        onAddCourse={(course) => onOpenModal(course)}
                                    />
                                ) : (
                                    <UserDashboardV3
                                        user={user}
                                        courses={courses}
                                        onNavigate={onSelectCollection}
                                        onNavigateWithFilter={onNavigateWithFilter}
                                        onStartCourse={handleCourseClick}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                        onSetPrometheusPagePrompt={handlePrometheusPagePrompt}
                                        onAddCourse={(course) => onOpenModal(course)}
                                        onResumeConversation={onResumeConversation}
                                        onCourseDragStart={handleCourseDragStart}
                                        onOpenDrawer={() => toggleDrawer('prompts')}
                                        onDeleteConversation={handleDeleteConversation}
                                        onConversationDragStart={(conv) => handleDragStart({
                                            type: 'CONVERSATION',
                                            id: conv.id,
                                            title: conv.title || 'Conversation',
                                        })}
                                        onAddConversation={(conv) => onOpenModal(conv)}
                                    />
                                )}
                            </div>
                        ) : activeCollectionId === 'users-groups' ? (
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <UsersAndGroupsCanvas
                                    onSelectAllUsers={() => onSelectCollection('org-team')}
                                    onSelectGroup={(groupId) => onSelectCollection(`group-${groupId}`)}
                                />
                            </div>
                        ) : activeCollectionId === 'org-team' ? (
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <TeamManagement />
                            </div>
                        ) : activeCollectionId === 'assigned-learning' ? (
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <AssignedLearningCanvas />
                            </div>
                        ) : activeCollectionId === 'help' ? (
                            // --- HELP COLLECTION VIEW ---
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                                    {isLoadingHelpTopics ? (
                                        <div className="text-white p-10 font-bold">Loading help topics...</div>
                                    ) : helpTopics.length === 0 ? (
                                        <div className="text-slate-500 p-10 flex flex-col items-center">
                                            <p className="text-lg mb-2">No help topics available.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-8 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                            {helpTopics.map((topic, index) => (
                                                <div
                                                    key={topic.id}
                                                    className="animate-fade-in-up cursor-pointer"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => openHelpTopic(topic)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            openHelpTopic(topic);
                                                        }
                                                    }}
                                                >
                                                    <UniversalCard
                                                        type="HELP"
                                                        title={topic.title}
                                                        description={topic.summary}
                                                        meta={topic.category || 'Platform'}
                                                        draggable={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Help Collection Footer */}
                                    {helpTopics.length > 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center pt-20 pb-10 opacity-60">
                                            <div className="mb-6 relative w-32 h-32">
                                                <div className="absolute inset-0 bg-[#4B8BB3]/20 blur-2xl rounded-full"></div>
                                                <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                                    <HelpCircle className="text-[#4B8BB3] w-full h-full" strokeWidth={1} />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-light text-white mb-2 tracking-wide">Explore Platform Features</h3>
                                            <p className="text-sm text-slate-400 max-w-lg text-center leading-relaxed">
                                                Click any card above to learn more about that feature. Use the Collection Assistant to ask questions about the platform.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* HelpPanel for viewing topic content */}
                                <HelpPanel
                                    isOpen={isHelpPanelOpen}
                                    onClose={() => setIsHelpPanelOpen(false)}
                                    topicId={activeHelpTopicId}
                                    fallbackTitle={activeHelpTopicFallback?.title}
                                    fallbackContentText={activeHelpTopicFallback?.contentText}
                                />
                            </div>
                        ) : activeCollectionId === 'tools' ? (
                            // --- TOOLS COLLECTION VIEW ---
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <ToolsCollectionView
                                    tools={tools}
                                    isLoading={isLoadingTools}
                                    onToolSelect={(slug) => {
                                        // Navigate to tool page
                                        window.location.href = `/tools/${slug}`;
                                    }}
                                />
                            </div>
                        ) : (
                            <div className={`flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar transition-opacity duration-300 ${isDrawerOpen ? 'opacity-30 blur-sm overflow-hidden' : 'opacity-100'} `}>
                                <div className="w-full pl-10 pr-4 pt-[50px] pb-48">
                                    <div className="w-full" key={renderKey}>


                                        {isAcademyView ? (
                                            // --- CATEGORIZED ACADEMY VIEW (Horizontal Scrolling) ---
                                            <div className="space-y-12 pb-20">

                                                {/* Category Quick Nav */}
                                                <div className="flex flex-wrap items-center gap-2 pb-4">
                                                    <button
                                                        onClick={() => {
                                                            setPendingFilters(INITIAL_FILTERS);
                                                            setActiveFilters(INITIAL_FILTERS);
                                                        }}
                                                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeFilters.category === 'All'
                                                            ? 'bg-brand-blue text-brand-black shadow-[0_0_15px_rgba(120,192,240,0.3)]'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                                            } `}
                                                    >
                                                        All
                                                    </button>
                                                    {COURSE_CATEGORIES.map((category) => (
                                                        <button
                                                            key={category}
                                                            onClick={() => {
                                                                const newFilters = { ...INITIAL_FILTERS, category };
                                                                setPendingFilters(newFilters);
                                                                setActiveFilters(newFilters);
                                                            }}
                                                            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeFilters.category === category
                                                                ? 'bg-brand-blue text-brand-black shadow-[0_0_15px_rgba(120,192,240,0.3)]'
                                                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                                                } `}
                                                        >
                                                            {category}
                                                        </button>
                                                    ))}
                                                </div>

                                                {COURSE_CATEGORIES.map((category, catIndex) => {
                                                    const categoryCourses = visibleCourses.filter(c => c.category === category);
                                                    if (categoryCourses.length === 0) return null;

                                                    const isCollapsed = collapsedCategories.includes(category);

                                                    return (
                                                        <div key={category} className="animate-fade-in" style={{ animationDelay: `${catIndex * 100} ms` }}>
                                                            {/* Category Header */}
                                                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 pr-4">
                                                                <div
                                                                    className="flex items-center gap-3 cursor-pointer group/title select-none"
                                                                    onClick={() => toggleCategory(category)}
                                                                >
                                                                    <div className={`
p-1.5 rounded-full bg-white/5 text-slate-400 transition-all duration-300
group-hover/title:bg-brand-blue-light group-hover/title:text-brand-black
    `}>
                                                                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                                    </div>

                                                                    <div className="flex items-baseline gap-3">
                                                                        <h2 className="text-2xl font-bold text-white tracking-tight group-hover/title:text-brand-blue-light transition-colors">{category}</h2>
                                                                        <span className="text-sm text-brand-blue-light font-medium bg-brand-blue-light/10 px-2 py-0.5 rounded-full">{categoryCourses.length}</span>
                                                                    </div>
                                                                </div>

                                                                {!isCollapsed && (
                                                                    <button
                                                                        onClick={() => handleCategorySelect(category)}
                                                                        className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors group/btn"
                                                                    >
                                                                        View All <ChevronRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Horizontal Scroll Row */}
                                                            {!isCollapsed && (
                                                                <div className="flex overflow-x-auto pb-4 pt-4 gap-8 snap-x snap-mandatory px-4 -mx-4 custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-300">
                                                                    {categoryCourses.map((course, index) => {
                                                                        const delay = Math.min(index, 10) * 50;
                                                                        return (
                                                                            <div key={course.id} className="min-w-[340px] w-[340px] snap-center">
                                                                                <LazyCourseCard>
                                                                                    <div
                                                                                        style={{ transitionDelay: `${delay}ms` }}
                                                                                        className={`transform transition-all duration-500 ease-out ${getTransitionClasses()}`}
                                                                                    >
                                                                                        <UniversalCard
                                                                                            type="COURSE"
                                                                                            title={course.title}
                                                                                            subtitle={course.author}
                                                                                            imageUrl={course.image}
                                                                                            meta={course.duration}
                                                                                            description={course.description}
                                                                                            rating={course.rating}
                                                                                            categories={[course.category]}
                                                                                            credits={{
                                                                                                shrm: course.badges?.includes('SHRM'),
                                                                                                hrci: course.badges?.includes('HRCI')
                                                                                            }}
                                                                                            actionLabel="VIEW"
                                                                                            onAction={() => handleCourseClick(course.id)}
                                                                                            onAdd={() => handleAddButtonClick(course.id)}
                                                                                            draggable={true}
                                                                                            onDragStart={() => handleCourseDragStart(course.id)}
                                                                                        />
                                                                                    </div>
                                                                                </LazyCourseCard>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            // If Universal Collection (Favorites, Workspace, Watchlist, Conversations, Notes, Personal, Custom)
                                            (activeCollectionId === 'favorites' ||
                                                activeCollectionId === 'research' ||
                                                activeCollectionId === 'to_learn' ||
                                                activeCollectionId === 'conversations' ||
                                                activeCollectionId === 'notes' ||
                                                activeCollectionId === 'personal-context' ||
                                                activeCollectionId === 'org-collections' ||
                                                activeCollectionId === 'org-analytics' ||
                                                customCollections.some(c => c.id === activeCollectionId)) ? (
                                                <div className="relative z-10 w-full mx-auto px-4 pb-32">
                                                    {activeCollectionId === 'org-collections' ? (
                                                        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                                                            <Layers size={48} className="mb-4 opacity-20" />
                                                            <h2 className="text-xl font-bold text-white mb-2">Learning Collections</h2>
                                                            <p>Feature coming soon. Curate learning paths for your team.</p>
                                                        </div>
                                                    ) : activeCollectionId === 'org-analytics' ? (
                                                        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                                                            <TrendingUp size={48} className="mb-4 opacity-20" />
                                                            <h2 className="text-xl font-bold text-white mb-2">Organization Analytics</h2>
                                                            <p>Feature coming soon. Track your team's progress and ROI.</p>
                                                        </div>
                                                    ) : (
                                                        renderCollectionContent()
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="pb-20">
                                                    <div className="grid gap-x-6 gap-y-12 mb-20 px-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                                        {/* Render Context Items (Modules, Lessons, Resources, etc.) */}
                                                        {collectionItems.map((item) => (
                                                            <div key={item.id} className="animate-fade-in">
                                                                <UniversalCollectionCard
                                                                    item={item as any} // Dynamic mapping handles types
                                                                    onRemove={(id, type) => initiateDeleteContextItem(id, type as ContextItemType, item.title)}
                                                                    onClick={(i) => {
                                                                        if (i.itemType === 'MODULE') {
                                                                            handleModuleClick(i);
                                                                        } else if (i.itemType === 'LESSON') {
                                                                            handleLessonClick(i);
                                                                        }
                                                                    }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* Render Courses */}
                                                        {visibleCourses.map((course, index) => {
                                                            const delay = Math.min(index, 15) * 50;
                                                            return (
                                                                <LazyCourseCard key={course.id}>
                                                                    <div
                                                                        style={{ transitionDelay: `${delay}ms` }}
                                                                        className={`transform transition-all duration-500 ease-out ${getTransitionClasses()}`}
                                                                    >
                                                                        <UniversalCard
                                                                            type="COURSE"
                                                                            title={course.title}
                                                                            subtitle={course.author}
                                                                            imageUrl={course.image}
                                                                            meta={course.duration}
                                                                            description={course.description}
                                                                            rating={course.rating}
                                                                            categories={[course.category]}
                                                                            credits={{
                                                                                shrm: course.badges?.includes('SHRM'),
                                                                                hrci: course.badges?.includes('HRCI')
                                                                            }}
                                                                            actionLabel="VIEW"
                                                                            onAction={() => handleCourseClick(course.id)}
                                                                            onAdd={() => handleAddButtonClick(course.id)}
                                                                            draggable={true}
                                                                            onDragStart={() => handleCourseDragStart(course.id)}
                                                                        />
                                                                    </div>
                                                                </LazyCourseCard>
                                                            );
                                                        })}

                                                        {/* Render Lesson Search Results */}
                                                        {activeFilters.includeLessons && visibleLessons.length > 0 && visibleLessons.map((lesson, index) => {
                                                            const delay = Math.min(visibleCourses.length + index, 30) * 50;
                                                            return (
                                                                <div
                                                                    key={`lesson-${lesson.id}`}
                                                                    style={{ transitionDelay: `${delay}ms` }}
                                                                    className={`transform transition-all duration-500 ease-out ${getTransitionClasses()}`}
                                                                >
                                                                    <UniversalCard
                                                                        type="LESSON"
                                                                        title={lesson.title}
                                                                        subtitle={lesson.course_author}
                                                                        imageUrl={lesson.course_image}
                                                                        meta={lesson.duration}
                                                                        description={`From: ${lesson.course_title}`}
                                                                        actionLabel="VIEW"
                                                                        onAction={() => handleLessonClick(lesson, false)}
                                                                        draggable={true}
                                                                        onDragStart={() => handleDragStart({
                                                                            type: 'LESSON',
                                                                            id: lesson.id,
                                                                            title: lesson.title,
                                                                        })}
                                                                    />
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Render Conversations */}
                                                        {visibleConversations.map((conversation, index) => (
                                                            <div key={conversation.id} className="animate-fade-in" style={{ animationDelay: `${(visibleCourses.length + index) * 50}ms` }}>
                                                                <UniversalCard
                                                                    type="CONVERSATION"
                                                                    title={conversation.title}
                                                                    description={conversation.lastMessage}
                                                                    meta={new Date(conversation.updated_at || new Date().toISOString()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    actionLabel="RESUME"
                                                                    onAction={() => handleOpenConversation(conversation.id)}
                                                                    onRemove={() => handleDeleteConversation(conversation.id)}
                                                                    onAdd={() => onOpenModal(conversation)}
                                                                    draggable={true}
                                                                    onDragStart={() => handleDragStart({
                                                                        type: 'CONVERSATION',
                                                                        id: conversation.id,
                                                                        title: conversation.title,
                                                                    })}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* Render Instructors */}
                                                        {activeCollectionId === 'instructors' && MOCK_INSTRUCTORS.map((instructor, index) => (
                                                            <div key={instructor.id} className="animate-fade-in" style={{ animationDelay: `${index * 50} ms` }}>
                                                                <InstructorCard
                                                                    instructor={instructor}
                                                                    onClick={setSelectedInstructorId}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* DEBUG INFO */}
                                                        {/* <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 text-xs z-50">
                                                            Items: {collectionItems.length} |
                                                            Types: {collectionItems.map(i => i.itemType).join(',')} |
                                                            Active: {activeCollectionId} |
                                                            User: {user?.id}
                                                        </div> */}

                                                    </div>

                                                    {/* Empty State - MOVED OUTSIDE GRID */}
                                                    {isCollectionEmpty && (
                                                        activeCollectionId === 'personal-context' ? (
                                                            <div className="w-full">
                                                                {renderCollectionContent()}
                                                            </div>
                                                        ) : (
                                                            // --- EMPTY COLLECTION STATES ---
                                                            <div className={`w-full flex flex-col items-center justify-center ${activeCollectionId === 'conversations' ? 'pt-[65px] px-4' : 'py-16 px-4'}`}>
                                                                {/* Visual Graphic at Top - Hide for Conversations */}
                                                                {activeCollectionId !== 'conversations' && (
                                                                    <div className="mb-12 animate-float">
                                                                        {renderCollectionVisual()}
                                                                    </div>
                                                                )}

                                                                {/* Text Content */}
                                                                <CollectionInfo
                                                                    type={activeCollectionId}
                                                                    isEmptyState={true}
                                                                    onSetPrometheusPagePrompt={handlePrometheusPagePrompt}
                                                                    onOpenDrawer={() => toggleDrawer('prompts')}
                                                                    onOpenHelp={() => toggleDrawer('help')}
                                                                />
                                                            </div>
                                                        )
                                                    )}

                                                    {/* Populated Footer (Collection Info) */}
                                                    {visibleCourses.length > 0 && renderCollectionFooter()}
                                                </div>

                                            )
                                        )
                                        }
                                    </div>
                                </div>
                            </div>
                        )
                }

                {/* --- Collection Surface (Footer) --- */}
                {
                    activeCollectionId !== 'prometheus' && (
                        <div className="absolute bottom-0 left-0 w-full z-[100] pointer-events-none">
                            <CollectionSurface
                                isDragging={isDragging}
                                activeFlareId={flaringPortalId}
                                customCollections={customCollections}
                                isOpen={isCollectionSurfaceOpen}
                                onToggle={() => setIsCollectionSurfaceOpen(!isCollectionSurfaceOpen)}
                                onCollectionClick={(id) => {
                                    if (id === 'new') {
                                        onOpenModal();
                                    } else {
                                        onSelectCollection(id);
                                    }
                                }}
                                onDropCourse={(portalId) => {
                                    if (draggedItem) {
                                        if (portalId === 'new') {
                                            // Open modal for New/Other collection selection
                                            if (draggedItem.type === 'COURSE') {
                                                onOpenModal(courses.find(c => c.id === draggedItem.id));
                                            } else {
                                                // For non-course items, pass the dragItem as context
                                                onOpenModal(draggedItem as any);
                                            }
                                        } else {
                                            // Add to existing collection
                                            onImmediateAddToCollection(draggedItem.id, portalId, draggedItem.type);
                                            setFlaringPortalId(portalId);
                                            setTimeout(() => setFlaringPortalId(null), 500);
                                        }
                                        setIsDragging(false);
                                        setDraggedItem(null);
                                    }
                                }}
                            />
                        </div>
                    )
                }

                {/* Delete Confirmation Modal */}
                {/* Delete Conversation Confirmation */}
                <DeleteConfirmationModal
                    isOpen={deleteConversationModalOpen}
                    onCancel={cancelDeleteConversation}
                    onConfirm={confirmDeleteConversation}
                    title="Delete Conversation?"
                    itemTitle={conversationToDelete?.title || 'Conversation'}
                    confirmText="Delete Conversation"
                    description="This conversation will be removed from your history and any collections it has been saved to. This action cannot be undone."
                />

                {/* Delete Collection Confirmation */}
                <DeleteConfirmationModal
                    isOpen={deleteCollectionModalOpen}
                    onCancel={() => setDeleteCollectionModalOpen(false)}
                    onConfirm={confirmDeleteCollection}
                    title="Delete Collection?"
                    itemTitle={collectionToDelete?.label || 'Collection'}
                    confirmText="Delete Collection"
                    description="This collection and all its contents will be permanently deleted. This action cannot be undone."
                />

                {/* Delete Context Item Confirmation */}
                <DeleteConfirmationModal
                    isOpen={deleteContextModalOpen}
                    onCancel={() => setDeleteContextModalOpen(false)}
                    onConfirm={confirmDeleteContextItem}
                    title="Delete Context Item?"
                    itemTitle={contextItemToDelete?.title || 'Item'}
                    confirmText="Delete Item"
                    description="This item will be permanently removed from this collection. This action cannot be undone."
                />

                {/* Delete Collection Item Confirmation (COURSE, LESSON, MODULE, RESOURCE) */}
                <DeleteConfirmationModal
                    isOpen={deleteCollectionItemModalOpen}
                    onCancel={() => setDeleteCollectionItemModalOpen(false)}
                    onConfirm={confirmDeleteCollectionItem}
                    title={`Remove ${collectionItemToDelete?.type || 'Item'}?`}
                    itemTitle={collectionItemToDelete?.title || 'Item'}
                    confirmText="Remove Item"
                    description="This item will be removed from this collection. This action cannot be undone."
                />

                {/* Delete Note Confirmation */}
                <DeleteConfirmationModal
                    isOpen={deleteNoteModalOpen}
                    onCancel={cancelDeleteNote}
                    onConfirm={confirmDeleteNote}
                    title="Delete Note?"
                    itemTitle={noteToDelete?.title || 'Note'}
                    confirmText="Delete Note"
                    description="This note will be permanently deleted. This action cannot be undone."
                />

                {/* --- Top Context Panel --- */}
                <TopContextPanel
                    isOpen={isContextEditorOpen}
                    onClose={handleCloseContextEditor}
                    activeCollectionId={activeCollectionId}
                    itemToEdit={editingContextItem}
                    initialType={contextTypeToAdd}
                    userId={savedItemIds ? 'current-user-implied-by-server-action' : ''}
                    onSaveSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        if (onCollectionUpdate) onCollectionUpdate();
                    }}
                />

                {/* --- Note Editor Panel --- */}
                <NoteEditorPanel
                    isOpen={isNoteEditorOpen}
                    onClose={handleCloseNoteEditor}
                    noteId={editingNoteId}
                    onSaveSuccess={handleNoteSaved}
                    onDeleteSuccess={handleNoteDeleted}
                />

                {/* --- Group Management Panels (Rendered at Root Level) --- */}
                {viewingGroup && (
                    <>
                        <GroupManagement
                            isOpen={showGroupManagement}
                            onClose={() => setShowGroupManagement(false)}
                            editGroup={viewingGroup}
                            onSuccess={() => {
                                window.dispatchEvent(new CustomEvent('groupsUpdated'));
                                setViewingGroup(null); // Reload group data by clearing and re-selecting
                                // Re-trigger group selection after brief delay
                                setTimeout(() => {
                                    import('@/app/actions/groups').then(async (mod) => {
                                        const details = await mod.getGroupDetails(viewingGroup.id);
                                        setViewingGroup(details);
                                    });
                                }, 100);
                            }}
                        />

                        {viewingGroup.is_dynamic && (
                            <DynamicGroupCriteriaPanel
                                isOpen={showDynamicCriteriaPanel}
                                onClose={() => setShowDynamicCriteriaPanel(false)}
                                group={viewingGroup}
                                onSuccess={() => {
                                    window.dispatchEvent(new CustomEvent('groupsUpdated'));
                                    setViewingGroup(null); // Reload group data by clearing and re-selecting
                                    // Re-trigger group selection after brief delay
                                    setTimeout(() => {
                                        import('@/app/actions/groups').then(async (mod) => {
                                            const details = await mod.getGroupDetails(viewingGroup.id);
                                            setViewingGroup(details);
                                        });
                                    }, 100);
                                }}
                            />
                        )}
                    </>
                )}
            </div >
        </div >






    );
};

export default MainCanvas;
