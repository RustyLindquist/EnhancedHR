import React, { useRef, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Check, ChevronDown, RefreshCw, Plus, ChevronRight, GraduationCap, Layers, Flame, MessageSquare, Sparkles, Building, Users, Lightbulb, Trophy, Info, FileText, Monitor, HelpCircle, Folder, BookOpen, Award, Clock, Zap, Trash, Edit, MoreHorizontal, Settings, TrendingUp } from 'lucide-react';
import CardStack from './CardStack';
import CollectionSurface from './CollectionSurface';
import TeamManagement from '@/components/org/TeamManagement';
import AlertBox from './AlertBox';
import CourseHomePage from './CourseHomePage'; // Import Course Page
import CoursePlayer from './CoursePlayer';
import UserDashboardV3 from './Dashboard/UserDashboardV3';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import OrgAdminDashboard from './Dashboard/OrgAdminDashboard';
import { COURSE_CATEGORIES, COLLECTION_NAV_ITEMS, generateMockResources } from '../constants'; // Import generator
import { fetchCourseModules, fetchUserCourseProgress } from '../lib/courses';
import { createClient } from '@/lib/supabase/client';
import { Course, Collection, Module, DragItem, Resource, ContextCard, Conversation, UserContextItem, ContextItemType } from '../types';
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';
import { deleteContextItem } from '@/app/actions/context';
import { deleteCollection, renameCollection } from '@/app/actions/collections';
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
    useDashboardV3?: boolean;
    onCollectionUpdate?: () => void;
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
}

const INITIAL_FILTERS: FilterState = {
    searchQuery: '',
    category: 'All', // Default to 'All'
    credits: [],
    designations: [],
    status: [],
    ratingFilter: 'ALL',
    dateFilterType: 'ALL',
    customDays: '30'
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
            <div className={`max-w-4xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
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
                                <h3 className={`${platformCardTitleClass} font-bold mb-3 flex items-center gap-2`}>
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
            </div >
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
        <div ref={containerRef} className="h-[28rem] w-full relative">
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

const GroupDetailCanvasWrapper = ({ group, manageTrigger }: { group: any, manageTrigger: number }) => {
    const [Component, setComponent] = useState<any>(null);
    useEffect(() => {
        import('@/components/org/GroupDetailCanvas').then(mod => setComponent(() => mod.default));
    }, []);
    if (!Component) return <div className="p-10 text-center">Loading Group...</div>;
    return <Component group={group} manageTrigger={manageTrigger} onBack={() => { }} />;
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
    useDashboardV3,
    onCollectionUpdate
}) => {
    // --- STATE MANAGEMENT ---
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const { savedItemIds, addToCollection, removeFromCollection, fetchCollectionItems } = useCollections(initialCourses);
    const [collectionItems, setCollectionItems] = useState<CollectionItemDetail[]>([]);
    const [isLoadingCollection, setIsLoadingCollection] = useState(false);

    // Group View State
    const [viewingGroup, setViewingGroup] = useState<any | null>(null);

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


    // Sync courses with saved state
    // Sync courses with prop changes and saved state
    useEffect(() => {
        setCourses(initialCourses.map(course => ({
            ...course,
            isSaved: savedItemIds.has(String(course.id))
        })));
    }, [initialCourses, savedItemIds]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch collection items when active collection changes (if it's a "saved" collection type)
    useEffect(() => {
        const isStandardNav = COLLECTION_NAV_ITEMS.some(i => i.id === activeCollectionId && i.id !== 'favorites'); // 'favorites' is a saved collection
        const isCustom = customCollections.some(c => c.id === activeCollectionId);

        // If it's favorites, default collections, or a custom collection, fetch items
        if (activeCollectionId === 'favorites' ||
            activeCollectionId === 'research' ||
            activeCollectionId === 'to_learn' ||
            isCustom ||
            activeCollectionId === 'personal-context') {
            setIsLoadingCollection(true);
            fetchCollectionItems(activeCollectionId)
                .then(items => {
                    setCollectionItems(items);
                    setIsLoadingCollection(false);
                })
                .catch(err => {
                    console.error("Failed to load collection items", err);
                    setIsLoadingCollection(false);
                });
        }
    }, [activeCollectionId, savedItemIds, customCollections, fetchCollectionItems, refreshTrigger]); // Reload if saved items change (e.g. removed from another view)



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
    const onImmediateAddToCollection = async (itemId: number | string, collectionId: string) => {
        // Determine type based on ID format or context (passed in args for future)
        // For now, MainCanvas primarily handles Courses via drag, but CollectionSurface passes type?
        // We need to update CollectionSurface onDrop to pass type, or assume COURSE if number

        const idStr = String(itemId);
        // Fallback logic if type isn't passed (we updated onImmediateAddToCollection signature in prop but here we need to match)
        // Actually, let's update call sites or default to COURSE for now as drag payload usually has type

        await addToCollection(idStr, 'COURSE', collectionId);

        // Force refresh of collection items so it appears immediately
        setRefreshTrigger(prev => prev + 1);

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
    const [userProgress, setUserProgress] = useState<Record<number, any>>({});
    const [drawerMode, setDrawerMode] = useState<'filters' | 'prompts' | 'help'>('filters');
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestions('user_dashboard');
            setPanelPrompts(prompts.slice(4));
        };
        loadPrompts();
    }, []);

    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // --- CONTEXT EDITOR STATE ---
    const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
    const [editingContextItem, setEditingContextItem] = useState<UserContextItem | null>(null);
    const [contextTypeToAdd, setContextTypeToAdd] = useState<ContextItemType>('CUSTOM_CONTEXT');

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
            fetchCollectionItems(activeCollectionId).then(setCollectionItems);
        }
    };
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

    // Instructor State
    const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

    // Sync selectedCourseId with parent (for AI Panel Context)
    useEffect(() => {
        if (onCourseSelect) {
            onCourseSelect(selectedCourseId ? String(selectedCourseId) : null);
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
        setSelectedCourseId(null);
        setSelectedInstructorId(null);
        setIsPlayerActive(false);
    }, [activeCollectionId]);

    // Sync selectedCourseId with initialCourseId prop (which acts as activeCourseId from parent)
    useEffect(() => {
        if (initialCourseId) {
            setSelectedCourseId(initialCourseId);
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


    // State for Group Management Trigger (Lifted Up)
    const [groupManageTrigger, setGroupManageTrigger] = useState(0);

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

    const handleDragStart = (item: DragItem) => {
        setIsDragging(true);
        setDraggedItem(item);
    };

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
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const fetchConversations = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*, messages:conversation_messages(content, created_at)')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error("Failed to fetch conversations from DB", error);
                } else {
                    // Map DB records to UI Conversation type
                    const mappedConversations = (data || []).map((c: any) => {
                        // Extract last message from the joined messages array
                        // The default order of joined array might not be guaranteed, so we sort just in case
                        const sortedMessages = (c.messages || []).sort((a: any, b: any) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );

                        const lastMsgContent = sortedMessages.length > 0
                            ? sortedMessages[sortedMessages.length - 1].content
                            : '';

                        return {
                            ...c,
                            lastMessage: lastMsgContent,
                            messages: sortedMessages, // Also store for full hydration if needed
                            collections: ['conversations']
                        };
                    });
                    setConversations(mappedConversations);
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch conversations", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [deleteConversationModalOpen, setDeleteConversationModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<any | null>(null);

    // New Delete States
    const [deleteCollectionModalOpen, setDeleteCollectionModalOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; label: string } | null>(null);

    const [deleteContextModalOpen, setDeleteContextModalOpen] = useState(false);
    const [contextItemToDelete, setContextItemToDelete] = useState<{ id: string; type: ContextItemType; title: string } | null>(null);

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
            if (onCollectionUpdate) onCollectionUpdate();
        } else {
            alert('Failed to delete context item: ' + result.error);
        }
        setContextItemToDelete(null);
    };

    // Updated Handler for UniversalCollectionCard
    const handleRemoveItem = async (itemId: string, itemType: string) => {
        if (itemType === 'COURSE') {
            removeFromCollection(itemId, activeCollectionId);
            if (onCollectionUpdate) onCollectionUpdate();
        } else if (itemType === 'CONVERSATION') {
            const conv = conversations.find(c => c.id === itemId);
            if (conv) {
                handleDeleteConversationInitiate(conv);
            }
        } else {
            // Context Items (Custom, File, Profile, Insight)
            // Cast strictly if needed check
            const type = itemType as ContextItemType;
            if (type === 'AI_INSIGHT' || type === 'CUSTOM_CONTEXT' || type === 'FILE' || type === 'PROFILE') {
                const item = collectionItems.find(i => i.id === itemId);
                const title = item?.title || 'Context Item';
                initiateDeleteContextItem(itemId, type, title);
            }
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
                return updated;
            } else {
                // If it's a new conversation that we just started, we might need to fetch it or create a placeholder
                // But PrometheusFullPage should have created it via API.
                // Let's trigger a fetch
                fetchConversations();
                // Refresh global counts since we added a new conversation
                if (onCollectionUpdate) onCollectionUpdate();
                return prev;
            }
        });
    };

    const handleSaveConversation = () => {
        if (activeConversation) {
            onOpenModal(activeConversation);
        }
    };

    const handleOpenConversation = (id: string) => {
        const conversation = conversations.find(c => c.id === id);
        if (conversation) {
            onResumeConversation && onResumeConversation(conversation);
            if (activeCollectionId === 'conversations') {
                // If on conversations page, maybe navigate? For now just resume.
            } else {
                // Open drawer or AI panel?
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
            const persistenceDuration = 5 * 60 * 1000; // 5 mins

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
        // Force refresh? 
        // PrometheusFullPage uses currentConversationId. If we set activeConversation to null, we pass undefined.
        // It should start new.
    };

    // Dynamic Title Generator
    const getPageTitle = () => {
        if (activeCollectionId === 'academy') return 'All Courses';
        if (activeCollectionId === 'dashboard') {
            const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
            return `Welcome ${firstName}`;
        }
        if (activeCollectionId === 'instructors') return 'Course Experts';
        if (activeCollectionId === 'prometheus') return prometheusConversationTitle || 'Prometheus AI';

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
        return 'My Collection';
    };

    // Helper to determine if a specific collection is effectively empty (contains no courses)
    // This is different from "No Results" due to filtering.
    const visibleConversations = conversations.filter(c => c.collections?.includes(activeCollectionId));

    const isCollectionEmpty =
        activeCollectionId !== 'academy' &&
        activeCollectionId !== 'dashboard' &&
        courses.filter(c => c.collections.includes(activeCollectionId)).length === 0 &&
        visibleConversations.length === 0;

    const isAcademyView = activeCollectionId === 'academy' && activeFilterCount === 0;

    // Render Visual Helpers
    const renderCollectionVisual = () => {
        if (activeCollectionId === 'conversations') return <ConversationVisual />;
        if (activeCollectionId === 'company') return <CompanyVisual />;
        if (activeCollectionId === 'instructors') return <InstructorVisual />;
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



    // --- DASHBOARD VIEW MOVED TO MAIN RENDER ---
    // The dashboard is now rendered inside the main layout to preserve the header.


    if (selectedCourse) {
        if (isPlayerActive) {
            return (
                <div className="flex-1 w-full h-full relative z-10">
                    <CoursePlayer
                        course={selectedCourse}
                        syllabus={selectedCourseSyllabus}
                        resources={selectedCourseResources}
                        onBack={handleBackToCourseHome}
                        initialLessonId={resumeLessonId}
                        initialModuleId={resumeModuleId}
                        userId={user?.id || ''}
                    />
                </div>
            );
        }

        return (
            <div
                className="flex-1 w-full h-full relative z-10"
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                onDrop={() => setIsDragging(false)}
            >
                {/* Drag Layer still needs to be here for the course page dragging */}
                {isDragging && draggedItem && (
                    <CustomDragLayer
                        item={draggedItem}
                        x={mousePos.x}
                        y={mousePos.y}
                    />
                )}

                {/* Only render course page here, full screen essentially within canvas area */}
                <CourseHomePage
                    course={selectedCourse}
                    syllabus={selectedCourseSyllabus}
                    resources={selectedCourseResources}
                    onBack={handleBackToCollection}
                    onStartCourse={handleStartCourse}
                    onDragStart={handleDragStart}
                    onAddToCollection={(item) => {
                        // Mock add logic - in real app would open modal or toast
                        console.log("Adding item to collection:", item);
                        setFlaringPortalId('favorites'); // Simulating a drop effect
                        setTimeout(() => setFlaringPortalId(null), 800);
                    }}
                />

                {/* Allow drag and drop to footer from Course Page */}
                <div className="absolute bottom-0 left-0 w-full z-[60] pointer-events-none">
                    <CollectionSurface
                        isDragging={isDragging}
                        activeFlareId={flaringPortalId}
                        onCollectionClick={() => { }}
                        onDropCourse={(portalId) => {
                            if (draggedItem) {
                                if (draggedItem.type === 'COURSE') {
                                    if (portalId === 'new') {
                                        onOpenModal(courses.find(c => c.id === draggedItem.id));
                                    } else {
                                        onImmediateAddToCollection(Number(draggedItem.id), portalId);
                                        setFlaringPortalId(portalId);
                                        setTimeout(() => setFlaringPortalId(null), 500);
                                    }
                                } else {
                                    // Handle non-course items (Mock)
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
        // Expanded to include 'research' (Workspace) and 'to_learn' (Watchlist)
        const isUniversalCollection = activeCollectionId === 'favorites' ||
            activeCollectionId === 'research' ||
            activeCollectionId === 'to_learn' ||
            activeCollectionId === 'personal-context' ||
            customCollections.some(c => c.id === activeCollectionId);

        if (isUniversalCollection) {
            if (isLoadingCollection && activeCollectionId !== 'personal-context') {
                return <div className="text-white p-10 font-bold">Loading collection...</div>;
            }

            let displayItems = [...collectionItems];

            // VIRTUAL PROFILE CARD LOGIC (Robust)
            // VIRTUAL PROFILE CARD LOGIC (Robust)
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
            }

            if (displayItems.length === 0) {
                return <div className="text-slate-500 p-10 flex flex-col items-center">
                    <p className="text-lg mb-2">This collection is empty.</p>
                    {activeCollectionId === 'personal-context'
                        ? <p className="text-sm">Add custom context to help the AI understand you better.</p>
                        : <p className="text-sm">Drag and drop courses, lessons, or conversations here to save them.</p>
                    }
                </div>;
            }




            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {displayItems.map((item, index) => (
                        <div key={`${item.itemType}-${item.id}`} className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}>
                            <UniversalCollectionCard
                                item={item}
                                onRemove={(id, type) => handleRemoveItem(id, type)}
                                onClick={(item) => {
                                    if (item.itemType === 'COURSE') handleCourseClick((item as Course).id);
                                    else if (item.itemType === 'CONVERSATION') {
                                        handleOpenConversation(item.id);
                                    }
                                    else if (item.itemType === 'AI_INSIGHT' || item.itemType === 'CUSTOM_CONTEXT' || item.itemType === 'FILE' || item.itemType === 'PROFILE') {
                                        handleOpenContextEditor(item.itemType, item as any);
                                    }
                                }}
                            />
                        </div>
                    ))}

                    {/* --- Personal Context Helper Footer --- */}
                    {activeCollectionId === 'personal-context' && (
                        <div className="col-span-full flex flex-col items-center justify-center pt-20 pb-10 opacity-60">
                            {/* Vector Graphic Placeholder */}
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
                </div>
            );
        }


        // Determine what to render based on active collection
        const isSpecialCollection = activeCollectionId === 'favorites' || customCollections.some(c => c.id === activeCollectionId) || activeCollectionId === 'personal-context';



        // Default Grid (All Courses / Filtered)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                {visibleCourses.map((course, index) => (
                    <div
                        key={course.id}
                        className="transform transition-all duration-500 hover:z-20"
                        style={{
                            opacity: isDrawerOpen ? 0 : 1,
                            transform: isDrawerOpen ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)',
                            transitionDelay: `${index * 50}ms`
                        }}
                    >
                        <CardStack
                            {...course}
                            onAddClick={() => onOpenModal(course)}
                            onDragStart={() => handleCourseDragStart(course.id)}
                            onClick={() => handleCourseClick(course.id)}
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
                            <div className="relative mb-8 group">
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
                {activeCollectionId !== 'org-team' && (
                    <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
                        <div>
                            {viewingGroup ? (
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
                                    {activeFilterCount > 0 ? (
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

                        <div className="flex space-x-4 items-center">
                            {viewingGroup ? (
                                <button
                                    onClick={() => setGroupManageTrigger(prev => prev + 1)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                >
                                    <Settings size={14} /> Manage Group
                                </button>
                            ) : (
                                <>
                                    {/* Expanded to include Favorites, Workspace (research), Watchlist (to_learn), and Custom Collections */}
                                    {(activeCollectionId === 'personal-context' ||
                                        activeCollectionId === 'favorites' ||
                                        activeCollectionId === 'research' ||
                                        activeCollectionId === 'to_learn' ||
                                        customCollections.some(c => c.id === activeCollectionId)) && (
                                            <div className="flex items-center gap-2 mr-4">
                                                <button
                                                    onClick={() => handleOpenContextEditor('CUSTOM_CONTEXT')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                >
                                                    <Plus size={14} /> Add Context
                                                </button>
                                                <button
                                                    onClick={() => handleOpenContextEditor('FILE')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                                >
                                                    <Plus size={14} /> Add File
                                                </button>
                                            </div>
                                        )}

                                    {activeCollectionId === 'prometheus' ? (
                                        /* Prometheus Actions */
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleNewConversation}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                                            >
                                                <MessageSquare size={14} /> New Conversation
                                            </button>

                                            {prometheusConversationTitle && prometheusConversationTitle !== 'New Conversation' && (
                                                <button
                                                    onClick={handleSaveConversation}
                                                    disabled={!!activeConversation?.isSaved}
                                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                        ${activeConversation?.isSaved
                                                            ? 'bg-white/10 text-slate-400 cursor-default border border-white/5'
                                                            : 'bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(120,192,240,0.3)]'
                                                        }
                                    `}
                                                >
                                                    {activeConversation?.isSaved ? (
                                                        <>
                                                            <Check size={14} /> Saved to Collection
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={14} /> Add to Collection
                                                        </>
                                                    )}
                                                </button>
                                            )}
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

                                        </>
                                    )}

                                    {/* --- SEARCH & FILTER BUTTON (CONDITIONALLY HIDDEN) --- */}
                                    {/* Hide for Favorites, Workspace (research), Watchlist (to_learn), Personal Context, Company, Custom Collections, Experts, Dashboard, Prometheus, Certifications */}
                                    {!(activeCollectionId === 'favorites' ||
                                        activeCollectionId === 'research' ||
                                        activeCollectionId === 'to_learn' ||
                                        activeCollectionId === 'personal-context' ||
                                        activeCollectionId === 'company' ||
                                        activeCollectionId === 'instructors' ||
                                        activeCollectionId === 'dashboard' ||
                                        activeCollectionId === 'prometheus' ||
                                        activeCollectionId === 'certifications' ||
                                        activeCollectionId === 'certifications' ||
                                        viewingGroup ||
                                        customCollections.some(c => c.id === activeCollectionId)
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

                                    {/* --- CUSTOM COLLECTION MANAGEMENT --- */}
                                    {customCollections.some(c => c.id === activeCollectionId) && (
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
                                                    <button
                                                        onClick={handleDeleteCollectionSpy}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                                                    >
                                                        <Trash size={14} /> Delete
                                                    </button>
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
                        <div className="flex-1 w-full h-full bg-transparent overflow-y-auto relative z-10">
                            {/* Using dynamic import for GroupDetailCanvas inside render if needed, or better, import at top */}
                            {/* Since we can't easily add top-level imports now without viewing file start, let's use a lazy loaded component or assume we add it later. 
                                  For now, I'll use a dynamic require logic wrapper in separate component or just trust I can add the import. 
                                  Actually, let's just use the component. I'll add the import in a separate step if needed.
                              */}
                            <GroupDetailCanvasWrapper group={viewingGroup} manageTrigger={groupManageTrigger} />
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
                                />
                            </div>
                        ) : activeCollectionId === 'dashboard' ? (
                            <div className={`flex-1 w-full h-full overflow-hidden relative z-10 ${useDashboardV3 ? '' : 'mt-[60px]'}`}>
                                {user?.role === 'org_admin' ? (
                                    <OrgAdminDashboard
                                        user={user}
                                        orgId={user.org_id || 'demo-org'}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                    />
                                ) : user?.role === 'employee' ? (
                                    <EmployeeDashboard
                                        user={user}
                                        courses={courses}
                                        onNavigate={onSelectCollection}
                                        onStartCourse={handleStartCourse}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                    />
                                ) : (
                                    <UserDashboardV3
                                        user={user}
                                        courses={courses}
                                        onNavigate={onSelectCollection}
                                        onStartCourse={handleCourseClick}
                                        onOpenAIPanel={onOpenAIPanel}
                                        onSetAIPrompt={onSetAIPrompt}
                                        onSetPrometheusPagePrompt={handlePrometheusPagePrompt}
                                    />
                                )}
                            </div>
                        ) : activeCollectionId === 'org-team' ? (
                            <div className="flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar">
                                <TeamManagement />
                            </div>
                        ) : (
                            <div className={`flex-1 w-full h-full overflow-y-auto relative z-10 custom-scrollbar transition-opacity duration-300 ${isDrawerOpen ? 'opacity-30 blur-sm overflow-hidden' : 'opacity-100'} `}>
                                <div className="max-w-7xl mx-auto w-full px-10 pt-[50px] pb-48">
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
                                                                <div className="flex overflow-x-auto pb-12 pt-4 gap-8 snap-x snap-mandatory px-4 -mx-4 custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-300">
                                                                    {categoryCourses.map((course, index) => {
                                                                        const delay = Math.min(index, 10) * 50;
                                                                        return (
                                                                            <div key={course.id} className="min-w-[340px] w-[340px] snap-center">
                                                                                <LazyCourseCard>
                                                                                    <div
                                                                                        style={{ transitionDelay: `${delay} ms` }}
                                                                                        className={`transform transition-all duration-500 ease-out ${getTransitionClasses()} `}
                                                                                    >
                                                                                        <CardStack
                                                                                            {...course}
                                                                                            onAddClick={handleAddButtonClick}
                                                                                            onDragStart={handleCourseDragStart}
                                                                                            onClick={handleCourseClick}
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
                                            // If Universal Collection (Favorites, Workspace, Watchlist, Personal, Custom)
                                            (activeCollectionId === 'favorites' ||
                                                activeCollectionId === 'research' ||
                                                activeCollectionId === 'to_learn' ||
                                                activeCollectionId === 'personal-context' ||
                                                activeCollectionId === 'org-collections' ||
                                                activeCollectionId === 'org-analytics' ||
                                                customCollections.some(c => c.id === activeCollectionId)) ? (
                                                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-32">
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-20 px-8">
                                                        {/* Render Courses */}
                                                        {visibleCourses.map((course, index) => {
                                                            const delay = Math.min(index, 15) * 50;
                                                            return (
                                                                <LazyCourseCard key={course.id}>
                                                                    <div
                                                                        style={{ transitionDelay: `${delay}ms` }}
                                                                        className={`transform transition-all duration-500 ease-out ${getTransitionClasses()}`}
                                                                    >
                                                                        <CardStack
                                                                            {...course}
                                                                            onAddClick={handleAddButtonClick}
                                                                            onDragStart={handleCourseDragStart}
                                                                            onClick={handleCourseClick}
                                                                        />
                                                                    </div>
                                                                </LazyCourseCard>
                                                            );
                                                        })}

                                                        {/* Render Conversations */}
                                                        {visibleConversations.map((conversation, index) => (
                                                            <div key={conversation.id} className="animate-fade-in" style={{ animationDelay: `${(visibleCourses.length + index) * 50}ms` }}>
                                                                <ConversationCard
                                                                    {...conversation}
                                                                    onClick={handleOpenConversation}
                                                                    onDelete={handleDeleteConversation}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* Render Instructors */}
                                                        {activeCollectionId === 'instructors' && MOCK_INSTRUCTORS.map((instructor, index) => (
                                                            <div key={instructor.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                                                <InstructorCard
                                                                    instructor={instructor}
                                                                    onClick={setSelectedInstructorId}
                                                                />
                                                            </div>
                                                        ))}

                                                        {/* DEBUG INFO */}
                                                        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 text-xs z-50">
                                                            Items: {collectionItems.length} |
                                                            Types: {collectionItems.map(i => i.itemType).join(',')} |
                                                            Active: {activeCollectionId} |
                                                            User: {user?.id}
                                                        </div>

                                                        {/* Empty State */}
                                                        {isCollectionEmpty ? (
                                                            activeCollectionId === 'personal-context' ? (
                                                                <div className="col-span-full">
                                                                    {renderCollectionContent()}
                                                                </div>
                                                            ) : (
                                                                // --- EMPTY COLLECTION STATES ---
                                                                <div className={`col-span-full flex flex-col items-center justify-center ${activeCollectionId === 'conversations' ? 'pt-[65px] px-4' : 'py-16 px-4'}`}>
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
                                                            )) : (
                                                            // --- NO RESULTS (Filter Context) ---
                                                            visibleCourses.length === 0 && visibleConversations.length === 0 && activeCollectionId !== 'instructors' && (
                                                                <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                                                    <Search size={48} className="text-slate-600 mb-4" />
                                                                    <p className="text-slate-400 text-lg">No courses found matching your filters.</p>
                                                                    <button onClick={handleResetFilters} className="mt-4 text-brand-blue-light hover:underline">Clear Filters</button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

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
                                onCollectionClick={(id) => {
                                    if (id === 'new') {
                                        onOpenModal();
                                    } else {
                                        onSelectCollection(id);
                                    }
                                }}
                                onDropCourse={(portalId) => {
                                    if (draggedItem) {
                                        // Only supporting Course Drop to portals for now as per previous logic, 
                                        // but MainCanvas supports generic items if we extended App logic.
                                        if (draggedItem.type === 'COURSE') {
                                            if (portalId === 'new') {
                                                onOpenModal(courses.find(c => c.id === draggedItem.id));
                                            } else {
                                                onImmediateAddToCollection(Number(draggedItem.id), portalId);
                                                setFlaringPortalId(portalId);
                                                setTimeout(() => setFlaringPortalId(null), 500);
                                            }
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
            </div >
        </div>






    );
};

export default MainCanvas;