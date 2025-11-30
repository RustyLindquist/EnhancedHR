import React, { useRef, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Check, ChevronDown, RefreshCw, Plus, ChevronRight, GraduationCap, Layers, Flame, MessageSquare, Sparkles, Building, Users, Lightbulb, Trophy, Info, FileText, Monitor, HelpCircle, Folder } from 'lucide-react';
import CardStack from './CardStack';
import CollectionSurface from './CollectionSurface';
import AlertBox from './AlertBox';
import CourseHomePage from './CourseHomePage'; // Import Course Page
import CoursePlayer from './CoursePlayer';
import UserDashboard from './Dashboard/UserDashboard';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import OrgAdminDashboard from './Dashboard/OrgAdminDashboard';
import { COURSE_CATEGORIES, COLLECTION_NAV_ITEMS, generateMockResources } from '../constants'; // Import generator
import { fetchCourseModules, fetchUserCourseProgress } from '../lib/courses';
import { createClient } from '@/lib/supabase/client';
import { Course, Collection, Module, DragItem, Resource } from '../types';

interface MainCanvasProps {
    courses: Course[];
    activeCollectionId: string;
    onSelectCollection: (id: string) => void;
    customCollections: Collection[];
    onOpenModal: (course?: Course) => void;
    onImmediateAddToCollection: (courseId: number, collectionId: string) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
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
}

const CollectionInfo: React.FC<CollectionInfoProps> = ({ type, isEmptyState }) => {
    // Helper for alignment: Centered if empty state, otherwise left aligned (but container centered)
    const alignmentClass = isEmptyState ? 'text-center' : 'text-left';
    const headerClass = 'text-center'; // Headers usually look best centered above content blocks

    if (type === 'conversations') {
        return (
            <div className={`max-w-4xl animate-fade-in mx-auto ${isEmptyState ? 'text-center' : ''}`}>
                <h2 className={`text-2xl font-light text-white mb-6 ${headerClass} ${!isEmptyState && "hidden"}`}>You haven’t had any conversations with Prometheus AI yet.</h2>
                <h2 className={`text-2xl font-light text-white mb-6 ${headerClass} ${isEmptyState && "hidden"}`}>About Conversations</h2>
                <p className={`text-slate-400 text-lg mb-10 ${alignmentClass}`}>Prometheus AI is your learning assistant. You can access Prometheus from several places.</p>

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
                        <h3 className="text-brand-blue font-bold mb-3 flex items-center gap-2">
                            <Flame size={18} /> General Prometheus
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Click on “Prometheus” from the left nav to get access to a version of Prometheus trained on all content across the platform and is specifically trained on HR and Leadership as a discipline.
                        </p>
                    </div>
                </div>
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

// --- MAIN CANVAS COMPONENT ---

const MainCanvas: React.FC<MainCanvasProps> = ({
    courses,
    activeCollectionId,
    onSelectCollection,
    customCollections,
    onOpenModal,
    onImmediateAddToCollection,
    onOpenAIPanel,
    onSetAIPrompt
}) => {

    // --- State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);

    const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [pendingFilters, setPendingFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [visibleCourses, setVisibleCourses] = useState<Course[]>(courses);

    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

    // Fetch User on mount
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            }
        };
        fetchUser();
    }, []);

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
        // If collection changes, ensure we exit course view
        setSelectedCourseId(null);
        setIsPlayerActive(false);
    }, [activeCollectionId]);

    // Update visible courses when prop changes (e.g. after fetch)
    useEffect(() => {
        setVisibleCourses(courses);
    }, [courses]);

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


    // --- Handlers ---

    const handleOpenDrawer = () => {
        setPendingFilters(activeFilters);
        setIsDrawerOpen(true);
    };

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
        if (activeFilters.category !== 'All') count++;
        if (activeFilters.credits.length > 0) count++;
        if (activeFilters.designations.length > 0) count++;
        if (activeFilters.status.length > 0) count++;
        if (activeFilters.ratingFilter !== 'ALL') count++;
        if (activeFilters.dateFilterType !== 'ALL') count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    // Dynamic Title Generator
    const getPageTitle = () => {
        if (activeCollectionId === 'academy') return 'All Courses';
        if (activeCollectionId === 'dashboard') return 'Dashboard';

        const predefined = COLLECTION_NAV_ITEMS.find(i => i.id === activeCollectionId);
        if (predefined) return predefined.label;

        const custom = customCollections.find(c => c.id === activeCollectionId);
        if (custom) return custom.label;

        return 'Collection';
    };

    const getSubTitle = () => {
        if (activeCollectionId === 'academy') return 'Academy Collection';
        if (activeCollectionId === 'dashboard') return 'My Dashboard';
        return 'My Collection';
    };

    // Helper to determine if a specific collection is effectively empty (contains no courses)
    // This is different from "No Results" due to filtering.
    const isCollectionEmpty =
        activeCollectionId !== 'academy' &&
        activeCollectionId !== 'dashboard' &&
        courses.filter(c => c.collections.includes(activeCollectionId)).length === 0;

    const isAcademyView = activeCollectionId === 'academy' && activeFilterCount === 0;

    // Render Visual Helpers
    const renderCollectionVisual = () => {
        if (activeCollectionId === 'conversations') return <ConversationVisual />;
        if (activeCollectionId === 'company') return <CompanyVisual />;
        return <GenericVisual />;
    };

    const renderCollectionFooter = () => {
        // Don't show footer in Academy view (catalog view)
        if (activeCollectionId === 'academy' || activeCollectionId === 'dashboard') return null;

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
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm max-w-4xl mx-auto">
                        <CollectionInfo type={activeCollectionId} isEmptyState={false} />
                    </div>
                </div>
            </div >
        );
    };

    // --- Determine Content to Render ---
    // If a course is selected, we replace the grid view with the Course Page or Player
    if (selectedCourseId) {
        const selectedCourse = courses.find(c => c.id === selectedCourseId);
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
    }

    // --- DASHBOARD VIEW MOVED TO MAIN RENDER ---
    // The dashboard is now rendered inside the main layout to preserve the header.


    return (
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

            {/* --- Drawer Overlay --- */}
            <div
                className={`
            absolute top-0 left-0 w-full z-[80]
                transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isDrawerOpen ? 'translate-y-0' : '-translate-y-full'}
                `}
            >
                <div className="bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl pb-6">
                    <div className="max-w-7xl mx-auto px-10 pt-8">


                        {/* Header / Close */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {activeFilters.category === 'All' ? 'All Courses' : activeFilters.category}
                                {activeFilters.category !== 'All' && (
                                    <button
                                        onClick={() => {
                                            setPendingFilters(INITIAL_FILTERS);
                                            setActiveFilters(INITIAL_FILTERS);
                                        }}
                                        className="ml-4 text-xs font-normal text-brand-orange hover:text-brand-orange-light transition-colors flex items-center gap-1"
                                    >
                                        <X size={12} /> Clear Filter
                                    </button>
                                )}
                            </h2>
                        </div>     {/* Search Input */}
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

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                            <button
                                onClick={() => setPendingFilters(INITIAL_FILTERS)}
                                className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <RefreshCw size={16} className="mr-2" /> Reset Filters
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="
                        bg-brand-blue-light text-brand-black px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide
                        hover:bg-brand-orange hover:text-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.4)]
                     "
                            >
                                Show {applyFilters(pendingFilters, courses).length} Results
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full h-screen bg-black/50 backdrop-blur-sm" onClick={handleCloseDrawer}></div>
            </div>

            {/* --- Header --- */}
            <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">
                            {getSubTitle()}
                        </span>
                    </div>
                    {activeFilterCount > 0 ? (
                        <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg flex items-center gap-2">
                            Filtered <span className="font-bold text-white">Results</span>
                            <span className="text-xs bg-brand-blue-light text-brand-black px-2 py-1 rounded-full font-bold align-middle">{activeFilterCount} Active</span>
                        </h1>
                    ) : (
                        <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
                            {getPageTitle().split(' ')[0]} <span className="font-bold text-white">{getPageTitle().split(' ').slice(1).join(' ')}</span>
                        </h1>
                    )}
                </div>

                <div className="flex space-x-4 items-center">
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
                </div>
            </div>

            {/* --- Canvas Content Grid --- */}
            {activeCollectionId === 'dashboard' ? (
                <div className="flex-1 w-full h-full overflow-hidden relative z-10 mt-[60px]">
                    {user?.role === 'org_admin' ? (
                        <OrgAdminDashboard user={user} orgId={user.org_id || 'demo-org'} />
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
                        <UserDashboard
                            user={user}
                            courses={courses}
                            onNavigate={onSelectCollection}
                            onStartCourse={handleStartCourse}
                            onOpenAIPanel={onOpenAIPanel}
                            onSetAIPrompt={onSetAIPrompt}
                        />
                    )}
                </div>
            ) : (
                <div className={`flex-1 w-[calc(100%-4rem)] max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 mt-[60px] relative z-10 custom-scrollbar transition-opacity duration-300 ${isDrawerOpen ? 'opacity-30 blur-sm overflow-hidden' : 'opacity-100'} `}>
                    <div className="w-full" key={renderKey}>


                        {/* Alert Box - Only show in Academy View */}
                        {isAcademyView && isAlertVisible && (
                            <AlertBox
                                title="AI-Enhanced Learning"
                                description="Make sure to try out the Prometheus AI Tutor in any course, for an AI-Enhanced, fully-personalized learning experience!"
                                onDismiss={() => setIsAlertVisible(false)}
                                className={`mb-[30px] ${transitionState === 'exiting' ? 'opacity-0 -translate-y-5 blur-md' : 'opacity-100 translate-y-0 blur-0'} `}
                            />
                        )}

                        {isAcademyView ? (
                            // --- CATEGORIZED ACADEMY VIEW (Horizontal Scrolling) ---
                            <div className="space-y-12 pb-20">

                                {/* Category Quick Nav */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
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
                            // --- FLAT GRID VIEW (Collections / Filters) ---
                            <div className="pb-20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-20">
                                    {visibleCourses.length > 0 ? (
                                        visibleCourses.map((course, index) => {
                                            const delay = Math.min(index, 15) * 50;
                                            return (
                                                <LazyCourseCard key={course.id}>
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
                                            );
                                        })
                                    ) : isCollectionEmpty ? (
                                        // --- EMPTY COLLECTION STATES ---
                                        <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                                            {/* Visual Graphic at Top */}
                                            <div className="mb-12 animate-float">
                                                {renderCollectionVisual()}
                                            </div>

                                            {/* Text Content */}
                                            <CollectionInfo type={activeCollectionId} isEmptyState={true} />
                                        </div>
                                    ) : (
                                        // --- NO RESULTS (Filter Context) ---
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                            <Search size={48} className="text-slate-600 mb-4" />
                                            <p className="text-slate-400 text-lg">No courses found matching your filters.</p>
                                            <button onClick={handleResetFilters} className="mt-4 text-brand-blue-light hover:underline">Clear Filters</button>
                                        </div>
                                    )}
                                </div>

                                {/* Populated Footer (Collection Info) */}
                                {visibleCourses.length > 0 && renderCollectionFooter()}
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* --- Collection Surface (Footer) --- */}
            <div className="absolute bottom-0 left-0 w-full z-[60] pointer-events-none">
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

        </div>
    );
};

export default MainCanvas;