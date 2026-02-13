import React, { useState, useEffect } from 'react';
import {
    Award,
    TrendingUp,
    Play,
    Sparkles,
    MessageSquare,
    Layers,
    Loader2,
    ChevronRight,
    LayoutGrid,
    List
} from 'lucide-react';
import { Course, Conversation, ToolConversation } from '@/types';
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { useRouter } from 'next/navigation';
import { getRecommendedCourses } from '@/app/actions/recommendations';
import { fetchConversationsAction } from '@/app/actions/conversations';
import UniversalCard from '../cards/UniversalCard';
import UniversalCollectionListItem from '../UniversalCollectionListItem';
import { CollectionItemDetail } from '../UniversalCollectionCard';
import PersonalInsightsWidget from './PersonalInsightsWidget';
import PersonalInsightsPreview from './PersonalInsightsPreview';

interface UserDashboardV3Props {
    user: any;
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onNavigateToInsight?: (insightId: string) => void;
    onNavigateWithFilter?: (collectionId: string, statusFilter: string[]) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
    onAddCourse: (course: Course) => void;
    onResumeConversation?: (conversation: Conversation) => void;
    onCourseDragStart?: (courseId: number) => void;
    onDeleteConversation?: (conversationId: string) => void;
    onConversationDragStart?: (conversation: Conversation) => void;
    onAddConversation?: (conversation: Conversation) => void;
}

const UserDashboardV3: React.FC<UserDashboardV3Props> = ({
    user,
    courses,
    onNavigate,
    onNavigateToInsight,
    onNavigateWithFilter,
    onStartCourse,
    onOpenAIPanel,
    onSetAIPrompt,
    onAddCourse,
    onResumeConversation,
    onCourseDragStart,
    onDeleteConversation,
    onConversationDragStart,
    onAddConversation
}) => {
    const [stats, setStats] = useState<DashboardStats>({
        totalTime: '0h 0m',
        coursesCompleted: 0,
        creditsEarned: 0,
        streak: 0,
        longestStreak: 0,
        conversationCount: 0,
        notesCount: 0,
        insightsCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [trendingIds, setTrendingIds] = useState<number[]>([]);
    const [recertifications, setRecertifications] = useState<any[]>([]);
    const [userProgress, setUserProgress] = useState<Record<number, { progress: number, lastAccessed: string }>>({});
    // Tab State - Recommended is now first/default
    const [activeTab, setActiveTab] = useState<'trending' | 'recommended'>('recommended');
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Conversations State
    const [recentConversations, setRecentConversations] = useState<(Conversation | ToolConversation)[]>([]);

    const router = useRouter();

    // Load view preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('enhancedhr-preferred-view-mode');
        if (savedViewMode === 'list' || savedViewMode === 'grid') {
            setViewMode(savedViewMode);
        }
    }, []);

    // Handle view mode change and persist to localStorage
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        localStorage.setItem('enhancedhr-preferred-view-mode', mode);
        setViewMode(mode);
    };

    // Convert Course to CollectionItemDetail for list view
    const courseToCollectionItem = (course: Course, category?: string): CollectionItemDetail => ({
        id: course.id,
        title: course.title,
        itemType: 'COURSE',
        author: course.author,
        description: course.description,
        image: course.image,
        duration: course.duration,
        rating: course.rating,
        badges: course.badges,
        category: category,
    } as any);

    // Convert Conversation to CollectionItemDetail for list view
    const conversationToCollectionItem = (conversation: Conversation | ToolConversation): CollectionItemDetail => {
        const isToolConv = conversation.type === 'TOOL_CONVERSATION';
        const toolConv = isToolConv ? conversation as ToolConversation : null;
        return {
            id: conversation.id,
            title: conversation.title || 'Untitled Conversation',
            itemType: isToolConv ? 'TOOL_CONVERSATION' : 'CONVERSATION',
            tool_title: isToolConv ? toolConv?.tool_title : undefined,
            lastMessage: conversation.lastMessage,
            updated_at: conversation.updated_at,
        } as any;
    };

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                try {
                    const dashboardData = await fetchDashboardData(user.id);
                    setStats(dashboardData.stats);
                    setTrendingIds(dashboardData.trendingCourseIds);
                    setRecertifications(dashboardData.recentCertificates || []);
                    setUserProgress(dashboardData.userProgress);
                    setLoading(false);
                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [user?.id]);


    useEffect(() => {
        const loadConversations = async () => {
            if (user?.id) {
                try {
                    const conversations = await fetchConversationsAction();
                    setRecentConversations(conversations.slice(0, 6));
                } catch (error) {
                    console.error("Failed to load conversations", error);
                }
            }
        };
        loadConversations();
    }, [user?.id]);

    useEffect(() => {
        if (activeTab === 'recommended' && recommendedCourses.length === 0 && user?.id) {
            const loadRecommendations = async () => {
                setLoadingRecommendations(true);
                try {
                    const recs = await getRecommendedCourses(user.id);
                    setRecommendedCourses(recs);
                } catch (error) {
                    console.error("Failed to load recommendations", error);
                } finally {
                    setLoadingRecommendations(false);
                }
            };
            loadRecommendations();
        }
    }, [activeTab, user?.id, recommendedCourses.length]);

    const inProgressCourses = courses
        .filter(c => userProgress[c.id])
        .map(c => ({
            ...c,
            progress: userProgress[c.id].progress
        }))
        .sort((a, b) => new Date(userProgress[b.id].lastAccessed).getTime() - new Date(userProgress[a.id].lastAccessed).getTime())
        .slice(0, 3);

    const trendingCourses = courses.filter(c => trendingIds.includes(c.id));

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32 relative">
            {/* Scrollable content - wider container for more cards per row */}
            {/* 50px padding from top of dashboard area */}
            <div className="max-w-[1800px] mx-auto px-8 pt-[50px]">

                {/* ══════════════════════════════════════════════════════════════════
                    MY PROGRESS SECTION - Personal Insights Widget
                ══════════════════════════════════════════════════════════════════ */}
                <div className="relative z-10 mb-12">
                    {user?.id && <PersonalInsightsWidget userId={user.id} />}
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    PERSONAL INSIGHTS PREVIEW - AI-Generated Insights
                ══════════════════════════════════════════════════════════════════ */}
                {user?.id && (
                    <PersonalInsightsPreview
                        userId={user.id}
                        onViewAll={() => onNavigate('personal-insights')}
                        onViewInsight={(insightId) => {
                            if (onNavigateToInsight) {
                                onNavigateToInsight(insightId);
                            } else {
                                onNavigate('personal-insights');
                            }
                        }}
                    />
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TABBED LEARNING SECTION - Trending / Recommended
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-14">
                    {/* Tab Navigation - Recommended is now first */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('recommended')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recommended'
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Sparkles size={14} />
                                    Recommended
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('trending')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'trending'
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <TrendingUp size={14} />
                                    Trending Now
                                </span>
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Card View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="List View"
                            >
                                <List size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Course Cards - Horizontal Scroll or List */}
                    <div className={viewMode === 'grid' ? "min-h-[220px]" : ""}>
                        {activeTab === 'trending' ? (
                            trendingCourses.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar animate-fade-in">
                                        {trendingCourses.slice(0, 8).map((course, idx) => (
                                            <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                                <UniversalCard
                                                    type="COURSE"
                                                    title={course.title}
                                                    subtitle={course.author}
                                                    description={course.description}
                                                    imageUrl={course.image}
                                                    meta={course.duration}
                                                    categories={[`#${idx + 1} TRENDING`]}
                                                    credits={{
                                                        shrm: course.badges?.includes('SHRM'),
                                                        hrci: course.badges?.includes('HRCI'),
                                                        shrmCredits: course.shrm_pdcs,
                                                        hrciCredits: course.hrci_credits
                                                    }}
                                                    actionLabel="VIEW"
                                                    rating={course.rating}
                                                    onAction={() => onStartCourse(course.id)}
                                                    onAdd={() => onAddCourse(course)}
                                                    draggable={!!onCourseDragStart}
                                                    onDragStart={() => onCourseDragStart?.(course.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 animate-fade-in">
                                        {trendingCourses.slice(0, 8).map((course, idx) => (
                                            <UniversalCollectionListItem
                                                key={course.id}
                                                item={courseToCollectionItem(course, `#${idx + 1} TRENDING`)}
                                                onClick={() => onStartCourse(course.id)}
                                                onAdd={() => onAddCourse(course)}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-slate-600 py-12">No trending courses available</div>
                            )
                        ) : (
                            loadingRecommendations ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-brand-blue-light" />
                                </div>
                            ) : recommendedCourses.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar animate-fade-in">
                                        {recommendedCourses.slice(0, 8).map((course) => (
                                            <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                                <UniversalCard
                                                    type="COURSE"
                                                    title={course.title}
                                                    subtitle={course.author}
                                                    description={course.description}
                                                    imageUrl={course.image}
                                                    meta={course.duration}
                                                    categories={["FOR YOU"]}
                                                    credits={{
                                                        shrm: course.badges?.includes('SHRM'),
                                                        hrci: course.badges?.includes('HRCI'),
                                                        shrmCredits: course.shrm_pdcs,
                                                        hrciCredits: course.hrci_credits
                                                    }}
                                                    actionLabel="VIEW"
                                                    rating={course.rating}
                                                    onAction={() => onStartCourse(course.id)}
                                                    onAdd={() => onAddCourse(course)}
                                                    draggable={!!onCourseDragStart}
                                                    onDragStart={() => onCourseDragStart?.(course.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 animate-fade-in">
                                        {recommendedCourses.slice(0, 8).map((course) => (
                                            <UniversalCollectionListItem
                                                key={course.id}
                                                item={courseToCollectionItem(course, "FOR YOU")}
                                                onClick={() => onStartCourse(course.id)}
                                                onAdd={() => onAddCourse(course)}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-slate-600 py-12">
                                    Unable to generate recommendations
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    CONTINUE THE CONVERSATION SECTION
                ══════════════════════════════════════════════════════════════════ */}
                {recentConversations.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={16} className="text-brand-blue-light" />
                                <h2 className="text-lg font-light text-white">Continue the Conversation</h2>
                            </div>
                            <button
                                onClick={() => onNavigate('conversations')}
                                className="text-xs text-slate-500 hover:text-brand-blue-light transition-colors flex items-center gap-1"
                            >
                                view all
                                <ChevronRight size={12} />
                            </button>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar">
                                {recentConversations.map(conversation => {
                                    const isToolConv = conversation.type === 'TOOL_CONVERSATION';
                                    const toolConv = isToolConv ? conversation as ToolConversation : null;
                                    return (
                                        <div key={conversation.id} className="min-w-[340px] w-[340px] snap-start">
                                            <UniversalCard
                                                type={isToolConv ? 'TOOL_CONVERSATION' : 'CONVERSATION'}
                                                title={conversation.title || 'Untitled Conversation'}
                                                subtitle={isToolConv ? toolConv?.tool_title : undefined}
                                                description={conversation.lastMessage || 'No messages yet.'}
                                                meta={conversation.updated_at ? new Date(conversation.updated_at).toLocaleDateString() : 'Just now'}
                                                actionLabel="CHAT"
                                                onAction={() => {
                                                    if (isToolConv && toolConv) {
                                                        window.location.href = `/tools/${toolConv.tool_slug}?conversationId=${conversation.id}`;
                                                    } else {
                                                        onResumeConversation?.(conversation as Conversation);
                                                    }
                                                }}
                                                onRemove={() => onDeleteConversation?.(conversation.id)}
                                                onAdd={() => onAddConversation?.(conversation as Conversation)}
                                                draggable={!!onConversationDragStart}
                                                onDragStart={() => onConversationDragStart?.(conversation as Conversation)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentConversations.map(conversation => {
                                    const isToolConv = conversation.type === 'TOOL_CONVERSATION';
                                    const toolConv = isToolConv ? conversation as ToolConversation : null;
                                    return (
                                        <UniversalCollectionListItem
                                            key={conversation.id}
                                            item={conversationToCollectionItem(conversation)}
                                            onClick={() => {
                                                if (isToolConv && toolConv) {
                                                    window.location.href = `/tools/${toolConv.tool_slug}?conversationId=${conversation.id}`;
                                                } else {
                                                    onResumeConversation?.(conversation as Conversation);
                                                }
                                            }}
                                            onRemove={() => onDeleteConversation?.(conversation.id)}
                                            onAdd={() => onAddConversation?.(conversation as Conversation)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    CONTINUE LEARNING SECTION
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-14">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Play size={16} className="text-brand-blue-light" />
                            <h2 className="text-lg font-light text-white">Continue Learning</h2>
                        </div>
                        {inProgressCourses.length > 0 && (
                            <button
                                onClick={() => onNavigateWithFilter?.('academy', ['IN_PROGRESS'])}
                                className="text-xs text-slate-500 hover:text-brand-blue-light transition-colors flex items-center gap-1"
                            >
                                view all
                                <ChevronRight size={12} />
                            </button>
                        )}
                    </div>

                    {inProgressCourses.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar">
                                {inProgressCourses.map(course => (
                                    <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                        <UniversalCard
                                            type="COURSE"
                                            title={course.title}
                                            subtitle={course.author}
                                            description={course.description}
                                            imageUrl={course.image}
                                            meta={`${course.progress}% Complete`}
                                            categories={["IN PROGRESS"]}
                                            actionLabel="RESUME"
                                            rating={course.rating}
                                            onAction={() => onStartCourse(course.id)}
                                            onAdd={() => onAddCourse(course)}
                                            draggable={!!onCourseDragStart}
                                            onDragStart={() => onCourseDragStart?.(course.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {inProgressCourses.map(course => (
                                    <UniversalCollectionListItem
                                        key={course.id}
                                        item={{
                                            ...courseToCollectionItem(course, "IN PROGRESS"),
                                            duration: `${course.progress}% Complete`,
                                        } as any}
                                        onClick={() => onStartCourse(course.id)}
                                        onAdd={() => onAddCourse(course)}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-10 flex flex-col items-center text-center">
                            <div className="flex gap-3 mb-6 opacity-20">
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10 transform -rotate-6" />
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10" />
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10 transform rotate-6" />
                            </div>
                            <h3 className="text-base font-medium text-slate-300 mb-2">Start Your Journey</h3>
                            <p className="text-sm text-slate-600 mb-5 max-w-sm">Browse the Academy to find expert-led courses tailored for HR professionals.</p>
                            <button
                                onClick={() => onNavigate('academy')}
                                className="px-5 py-2 bg-brand-blue-light text-brand-black rounded-lg font-medium hover:bg-white transition-colors text-sm"
                            >
                                Explore Academy
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    RECERTIFICATION HUB
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Award size={16} className="text-brand-orange" />
                        <h2 className="text-lg font-light text-white">Recertification Hub</h2>
                    </div>

                    {recertifications.length > 0 ? (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] text-slate-600 uppercase tracking-wider border-b border-white/5">
                                        <th className="py-3 px-4 font-medium">Certificate</th>
                                        <th className="py-3 px-4 font-medium">Date</th>
                                        <th className="py-3 px-4 font-medium">Credits</th>
                                        <th className="py-3 px-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recertifications.map((cert) => (
                                        <tr key={cert.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-4 text-slate-300">{cert.course_title || 'Course Completion'}</td>
                                            <td className="py-3 px-4 text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-brand-orange font-medium">{cert.credits || 0} PDCs</td>
                                            <td className="py-3 px-4 text-right">
                                                <button className="text-xs text-brand-blue-light hover:text-white transition-colors">Download</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-1">Track Your SHRM & HRCI Credits</h3>
                                <p className="text-xs text-slate-600 mb-3 max-w-md">
                                    Earn Professional Development Credits automatically as you complete courses.
                                </p>
                                <div className="flex gap-2">
                                    {['SHRM-CP', 'SHRM-SCP', 'PHR', 'SPHR'].map(cert => (
                                        <span key={cert} className="px-2 py-0.5 bg-white/[0.03] rounded text-[10px] text-slate-600 border border-white/[0.05]">{cert}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-30">
                                <Layers size={40} className="text-brand-orange" />
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};

export default UserDashboardV3;
