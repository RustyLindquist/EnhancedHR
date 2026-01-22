'use client';

import React from 'react';
import {
    Bot,
    Brain,
    Compass,
    CreditCard,
    Sparkles,
    Settings,
    FolderHeart,
    Lightbulb,
    Flame,
    Folder,
    GraduationCap,
    Library,
    LayoutDashboard,
    Users,
    Award,
    MessageSquare,
    Layers,
    Monitor,
    TrendingUp,
    Search,
    Building,
    HelpCircle,
    FileText,
    StickyNote,
    BookOpen,
    User,
    Wrench
} from 'lucide-react';

/**
 * Help content registry - all help topics for the platform
 */
export type HelpTopicId =
    | 'getting-started'
    | 'ai-insights'
    | 'personal-context'
    | 'prometheus-ai'
    | 'course-experience'
    | 'course-ai'
    | 'collections'
    | 'academy'
    | 'dashboard'
    | 'prompt-library'
    | 'tools'
    | 'account-membership'
    | 'experts'
    | 'certifications'
    | 'conversations'
    | 'drag-and-drop'
    | 'course-progress'
    | 'search-filters'
    | 'settings'
    | 'organization'
    | 'help-collection'
    | 'notes';

interface HelpTopic {
    id: HelpTopicId;
    title: string;
    content: React.ReactNode;
}

const HELP_TOPICS: Record<HelpTopicId, HelpTopic> = {
    'getting-started': {
        id: 'getting-started',
        title: 'Getting Started',
        content: <GettingStartedHelpContent />
    },
    'ai-insights': {
        id: 'ai-insights',
        title: 'AI Insights',
        content: <AIInsightsHelpContent />
    },
    'personal-context': {
        id: 'personal-context',
        title: 'Personal Context',
        content: <PersonalContextHelpContent />
    },
    'prometheus-ai': {
        id: 'prometheus-ai',
        title: 'Prometheus AI Assistant',
        content: <PrometheusAIHelpContent />
    },
    'course-experience': {
        id: 'course-experience',
        title: 'Course Experience',
        content: <CourseExperienceHelpContent />
    },
    'course-ai': {
        id: 'course-ai',
        title: 'AI in Courses (Assistant & Tutor)',
        content: <CourseAIHelpContent />
    },
    'collections': {
        id: 'collections',
        title: 'Collections',
        content: <CollectionsHelpContent />
    },
    'academy': {
        id: 'academy',
        title: 'Academy',
        content: <AcademyHelpContent />
    },
    'dashboard': {
        id: 'dashboard',
        title: 'Dashboard',
        content: <DashboardHelpContent />
    },
    'prompt-library': {
        id: 'prompt-library',
        title: 'Prompt Library',
        content: <PromptLibraryHelpContent />
    },
    'tools': {
        id: 'tools',
        title: 'Tools',
        content: <ToolsHelpContent />
    },
    'account-membership': {
        id: 'account-membership',
        title: 'Account & Membership',
        content: <AccountMembershipHelpContent />
    },
    'experts': {
        id: 'experts',
        title: 'Experts',
        content: <ExpertsHelpContent />
    },
    'certifications': {
        id: 'certifications',
        title: 'Certifications',
        content: <CertificationsHelpContent />
    },
    'conversations': {
        id: 'conversations',
        title: 'Conversations',
        content: <ConversationsHelpContent />
    },
    'drag-and-drop': {
        id: 'drag-and-drop',
        title: 'Drag and Drop',
        content: <DragDropHelpContent />
    },
    'course-progress': {
        id: 'course-progress',
        title: 'Course Progress',
        content: <CourseProgressHelpContent />
    },
    'search-filters': {
        id: 'search-filters',
        title: 'Search & Filters',
        content: <SearchFiltersHelpContent />
    },
    'settings': {
        id: 'settings',
        title: 'Settings',
        content: <SettingsHelpContent />
    },
    'organization': {
        id: 'organization',
        title: 'Organization Features',
        content: <OrganizationHelpContent />
    },
    'help-collection': {
        id: 'help-collection',
        title: 'Help Collection',
        content: <HelpCollectionHelpContent />
    },
    'notes': {
        id: 'notes',
        title: 'Notes in Courses',
        content: <NotesHelpContent />
    }
};

export function getHelpTopic(id: HelpTopicId): HelpTopic | undefined {
    return HELP_TOPICS[id];
}

export function isHelpTopicId(value: unknown): value is HelpTopicId {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(HELP_TOPICS, value);
}

// ============================================================================
// HELP CONTENT COMPONENTS
// Each follows the three-tier structure: Value/Purpose -> How It Works -> Instructions
// ============================================================================

/**
 * Getting Started Help Content
 */
function GettingStartedHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Compass size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Welcome to EnhancedHR</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    EnhancedHR is an AI-enhanced learning platform built for HR professionals and leaders. You can take expert-led
                    courses, use Prometheus to apply what you learn to real work situations, and track progress and certification
                    eligibility along the way.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How the Platform is Organized</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <ul className="text-sm space-y-2 text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="text-brand-blue-light mt-1">•</span>
                                <span><span className="text-white font-medium">Dashboard</span>: your home base (continue learning, quick prompts, recent activity)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-blue-light mt-1">•</span>
                                <span><span className="text-white font-medium">Academy</span>: browse the course catalog and start learning</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-blue-light mt-1">•</span>
                                <span><span className="text-white font-medium">Prometheus AI</span>: full-screen chat for HR questions and coaching</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-blue-light mt-1">•</span>
                                <span><span className="text-white font-medium">Collections</span>: organize courses, conversations, and notes</span>
                            </li>
                        </ul>
                    </div>
                    <p className="text-sm text-slate-400">
                        Most screens also include a right-side AI panel. When you're inside a course, it becomes course-aware and can tutor you.
                    </p>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Lightbulb size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your First 5 Minutes</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Go to <span className="text-white font-medium">Academy</span> and pick a course that matches your current challenge</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Open the course and start a lesson — your progress tracks automatically</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Use the AI panel to ask: <span className="text-white font-medium">“How should I apply this at work?”</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">4</span>
                            </div>
                            <span>Save anything useful to <span className="text-white font-medium">Favorites</span> or your <span className="text-white font-medium">Workspace</span> for later</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">5</span>
                            </div>
                            <span>Come back to <span className="text-white font-medium">Help</span> anytime, or ask the Collection Assistant for quick guidance</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * AI Insights Help Content
 */
function AIInsightsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">What are AI Insights?</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    AI Insights are meaningful pieces of information that Prometheus identifies about you during your conversations.
                    These insights help the AI understand your preferences, goals, challenges, and context, enabling it to provide
                    more personalized and relevant responses over time.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Brain size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How It Works</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>
                        As you chat with Prometheus, it listens for information that could help improve your experience.
                        When it detects something meaningful, like your role, a goal you're working toward, or a challenge
                        you're facing, it will present the insight for your review.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-medium text-white mb-2">Example Insights:</p>
                        <ul className="text-sm space-y-2 text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>"Works as an HR Director at a mid-sized tech company"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>"Currently focused on improving employee retention rates"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>"Prefers data-driven approaches to HR decisions"</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <FolderHeart size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Managing Your Insights</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>
                        All saved insights are stored in your <span className="text-white font-medium">Personal Context</span> collection,
                        accessible from the left navigation panel. From there, you can:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span><span className="text-white font-medium">View all insights</span> that have been saved about you</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span><span className="text-white font-medium">Edit insights</span> to add more detail or correct information</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span><span className="text-white font-medium">Delete insights</span> that are no longer relevant or accurate</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">4</span>
                            </div>
                            <span><span className="text-white font-medium">Add new insights</span> manually to help Prometheus understand you better</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Settings */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-500/20">
                        <Settings size={20} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Insight Settings</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>
                        You can customize how insights work from <span className="text-white font-medium">Settings</span> in your profile menu:
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div>
                            <p className="text-sm font-medium text-white mb-1">Enable AI Insights</p>
                            <p className="text-sm text-slate-400">
                                Turn insight detection on or off. When disabled, Prometheus will not attempt to identify insights during conversations.
                            </p>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-sm font-medium text-white mb-1">Auto-Save AI Insights</p>
                            <p className="text-sm text-slate-400">
                                When enabled, insights are automatically saved without asking for your approval.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Note */}
            <section className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="text-brand-blue-light flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white mb-1">Your Privacy Matters</p>
                        <p className="text-sm text-slate-400">
                            All insights are stored securely and are only visible to you. They are never shared with other users
                            or used for purposes other than improving your personal experience with Prometheus.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

/**
 * Personal Context Help Content
 */
function PersonalContextHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Brain size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Personal AI Context</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Your Personal Context collection stores information about you that helps Prometheus provide more personalized
                    and relevant responses. This is your private space for building context that makes every AI interaction more valuable.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">What's Included</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>Personal Context includes several types of information:</p>
                    <div className="grid gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-sm font-medium text-white mb-1">AI-Detected Insights</p>
                            <p className="text-xs text-slate-400">Automatically identified during your conversations</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-sm font-medium text-white mb-1">Custom Notes</p>
                            <p className="text-xs text-slate-400">Information you manually add about yourself</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-sm font-medium text-white mb-1">Profile Details</p>
                            <p className="text-xs text-slate-400">Your role, experience, and professional objectives</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-sm font-medium text-white mb-1">Uploaded Documents</p>
                            <p className="text-xs text-slate-400">Files you share for the AI to reference</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <FileText size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Adding Context</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>To add custom context:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Navigate to the Personal Context collection</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Click <span className="text-white font-medium">Add Text</span> to write a note or <span className="text-white font-medium">Add File</span> to upload a document</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Describe something about yourself, your work, or your goals</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400 mt-4">
                        The more context you provide, the more personalized and helpful Prometheus becomes.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Prometheus AI Help Content
 */
function PrometheusAIHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-orange/20">
                        <Flame size={20} className="text-brand-orange" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your AI-Powered Assistant</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Prometheus is your AI-powered assistant designed to help you navigate HR challenges and accelerate your
                    professional growth. Unlike generic chatbots, Prometheus knows about your personal context, learning history, and goals.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Brain size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How Prometheus Helps</h3>
                </div>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-orange mt-1">•</span>
                            <span>Answers questions about HR topics with expertise</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-orange mt-1">•</span>
                            <span>Recommends courses based on your interests and goals</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-orange mt-1">•</span>
                            <span>Helps you understand complex concepts from your courses</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-orange mt-1">•</span>
                            <span>Provides personalized learning paths</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-orange mt-1">•</span>
                            <span>Remembers your conversation history for continuity</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <MessageSquare size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Accessing Prometheus</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>You can access Prometheus from multiple places:</p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click <span className="text-white font-medium">Prometheus AI</span> in the left navigation for full-screen chat</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use the AI panel on the right side while browsing courses</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Start from Dashboard quick actions for common prompts</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Access from within any course for contextual help</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Course Experience Help Content
 */
function CourseExperienceHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Monitor size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Learn by Doing (Not Just Watching)</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Courses in EnhancedHR are designed to help you build practical, job-ready skills. You can move through modules and
                    lessons, take notes as you learn, and use AI to turn course concepts into real-world plans and conversations.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <GraduationCap size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">What You’ll See in a Course</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Course Page</p>
                        <p className="text-xs text-slate-400">Overview, syllabus, resources, and course-level actions like rating and certificates</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Lesson Player</p>
                        <p className="text-xs text-slate-400">Watch lessons, complete quizzes (when available), and move next/previous</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Notes + AI Panel</p>
                        <p className="text-xs text-slate-400">Ask questions, get tutoring, and capture takeaways while you learn</p>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <BookOpen size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How to Take a Course</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>From <span className="text-white font-medium">Academy</span>, click a course card to open it</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Click <span className="text-white font-medium">Start Course</span> (or <span className="text-white font-medium">Resume Learning</span>) to begin</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Use the right-side AI panel to ask for summaries, examples, or coaching as you go</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">4</span>
                            </div>
                            <span>Take notes in the <span className="text-white font-medium">Notes</span> tab so your learning stays organized</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Tip: If a course is certification-eligible, you’ll see SHRM/HRCI badges on the course card and course page.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Course AI Help Content
 */
function CourseAIHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Bot size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Course-Aware AI (Assistant + Tutor)</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    When you're inside a course, the AI panel becomes course-aware. You can use it as a quick Assistant for answers,
                    or switch to Tutor mode for a more guided, Socratic learning experience.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Assistant vs Tutor</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-medium text-white mb-1">Course Assistant</p>
                        <p className="text-sm text-slate-400">
                            Best for quick questions and clarity: “What did they mean by…?”, “Summarize this lesson”, “Give me an example”.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-medium text-white mb-1">Course Tutor</p>
                        <p className="text-sm text-slate-400">
                            Best for learning and application: the Tutor asks questions, checks understanding, and helps you build a plan for your role.
                        </p>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <MessageSquare size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How to Use Course AI</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Open any course and expand the <span className="text-white font-medium">AI panel</span> on the right</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Switch between <span className="text-white font-medium">Assistant</span> and <span className="text-white font-medium">Tutor</span> modes based on what you need</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Ask for something concrete, like a script, checklist, or role-play outline</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">4</span>
                            </div>
                            <span>Save key takeaways as <span className="text-white font-medium">Notes</span> and store relevant items in a Collection</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Collections Help Content
 */
function CollectionsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Folder size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Organize Your Learning</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Collections help you organize courses, conversations, and resources in ways that make sense for your
                    learning journey. Think of them as smart folders that also enable AI-powered assistance.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Layers size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Built-in Collections</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-brand-red mb-1">Favorites</p>
                        <p className="text-xs text-slate-400">Your top picks and go-to courses</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-brand-orange mb-1">Workspace</p>
                        <p className="text-xs text-slate-400">Active research, current projects, and reference material</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-brand-blue-light mb-1">Watchlist</p>
                        <p className="text-xs text-slate-400">Courses you want to take later</p>
                    </div>
                </div>
            </section>

            {/* Custom Collections */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Folder size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Create Your Own Collections</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>
                        In addition to built-in collections, you can create custom collections for projects and goals (for example:
                        “Onboarding Revamp”, “Manager Toolkit”, or “Performance Conversations”).
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click <span className="text-white font-medium">New Collection</span> in the left navigation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Choose a name and color to make it easy to recognize</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Add courses, lessons, conversations, and notes to keep everything in one place</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <FolderHeart size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Adding Items to Collections</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">Drag and drop</span> any card onto a collection portal at the bottom of the screen</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click the <span className="text-white font-medium">add button</span> on any card and select the target collection</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Each collection has its own Collection Assistant. When viewing a collection, the AI knows about
                        the items you've saved there and can answer questions about your saved content.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Academy Help Content
 */
function AcademyHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <GraduationCap size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Gateway to Learning</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Academy is your gateway to professional development with courses spanning multiple categories of HR expertise.
                    Our expert-led courses are designed for practical application and real-world impact.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Layers size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Course Categories</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">AI for HR</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">Leadership</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">Business Functions</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">Soft Skills</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">HR Stories</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <span className="text-white">Book Club</span>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Search size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Finding Courses</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use <span className="text-white font-medium">category pills</span> at the top for quick filtering</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Open the <span className="text-white font-medium">Search & Filter</span> panel for advanced options</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click any course to see the full course page with syllabus and resources</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use <span className="text-white font-medium">Add</span> or drag-and-drop to save courses to Favorites, Watchlist, or a custom collection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Browse <span className="text-white font-medium">Experts</span> to learn about instructors and explore their courses</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Look for SHRM/HRCI badges on course cards if you’re focused on certification-eligible learning.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Dashboard Help Content
 */
function DashboardHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <LayoutDashboard size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Learning Hub</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Dashboard is your home base, providing a personalized overview of your learning journey.
                    It adapts based on your role and shows what matters most to you.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <TrendingUp size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">What You'll Find</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Learning Statistics</p>
                        <p className="text-xs text-slate-400">Total learning hours, courses completed, and current streak</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Continue Learning</p>
                        <p className="text-xs text-slate-400">Your in-progress courses for easy resumption</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Quick Prompts</p>
                        <p className="text-xs text-slate-400">Instant access to common Prometheus conversations</p>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Lightbulb size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Best Ways to Use the Dashboard</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use <span className="text-white font-medium">Continue Learning</span> to jump back into your next lesson</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Start a conversation with a <span className="text-white font-medium">Quick Prompt</span> and refine it to your situation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use the right-side AI panel to ask for help finding the right course or applying a concept</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Prompt Library Help Content
 */
function PromptLibraryHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Library size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Get Started Faster with Prompts</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Prompt Library gives you high-quality starting points for common HR needs. Instead of wondering “what should I ask?”,
                    you can choose a prompt, tweak it to your situation, and get a strong first draft from Prometheus.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Where You’ll See Prompts</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Dashboard quick prompts (fast entry into common conversations)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>The Prompt Library panel (a bigger curated list)</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Prompts are designed to be edited. The best results happen when you add your role, company context, and the situation you’re facing.
                    </p>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <MessageSquare size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Using a Prompt</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Open the Prompt Library and click a prompt that matches your situation</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Customize it: include your goals, constraints, and any sensitive details you can generalize</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Ask for a specific output (script, outline, checklist, email draft, coaching plan)</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Tools Help Content
 */
function ToolsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-teal-500/20">
                        <Wrench size={20} className="text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Specialized AI Workflows</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Tools are purpose-built AI experiences for specific HR tasks. Each tool uses a specialized AI agent and interface so you can
                    get better results than a generic chat prompt.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Bot size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How Tools Work</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-1">•</span>
                            <span>Pick a tool from the <span className="text-white font-medium">Tools</span> section in the left navigation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-1">•</span>
                            <span>Start a new session (some tools begin with a structured form)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-teal-400 mt-1">•</span>
                            <span>Tool sessions are saved as conversations so you can return later</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Lightbulb size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Tips for Better Results</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Be specific about the context (industry, size, constraints, timeline)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Ask for outputs you can use immediately (talk track, email, checklist, plan)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Save helpful tool sessions to a Collection for later reference</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Account & Membership Help Content
 */
function AccountMembershipHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-orange/20">
                        <CreditCard size={20} className="text-brand-orange" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Manage Access, Billing, and Your Profile</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Your account settings control your membership access, billing, and basic profile information. This is where you can
                    upgrade, manage your subscription, and keep your profile up to date.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <User size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Where to Find Account Pages</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">Settings</span>: AI preferences (like AI Insights)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">My Account</span>: profile photo, password, membership status</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">Billing &amp; Membership</span>: upgrade, manage subscription, billing portal</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Lightbulb size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Common Tasks</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Update your avatar in <span className="text-white font-medium">My Account</span> to personalize your profile</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Upgrade or manage billing in <span className="text-white font-medium">Billing &amp; Membership</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Adjust AI behavior (AI Insights) from <span className="text-white font-medium">Settings</span></span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Trial access (if enabled for your account) is time-based while watching lessons. If your trial ends, you’ll be prompted to upgrade to continue.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Experts Help Content
 */
function ExpertsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Users size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Learn from Industry Leaders</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Our Expert instructors bring real-world experience, practical frameworks, and unique perspectives to their courses.
                    Each expert is rigorously vetted for subject matter expertise and teaching ability.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Award size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Expert Profiles</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>Expert profiles showcase:</p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Credentials and experience</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Course catalog on the platform</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Student count and ratings</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Areas of specialization</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Certifications Help Content
 */
function CertificationsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Award size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Professional Development Credits</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Many courses offer SHRM and HRCI continuing education credits, helping you maintain your professional
                    certifications while developing new skills.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <GraduationCap size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Finding Credit-Eligible Courses</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>Certification credits are displayed on course cards with badges:</p>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-[#4f46e5]/20 text-[#818cf8] border border-[#4f46e5]/30">SHRM</span>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-[#9333ea]/20 text-[#c084fc] border border-[#9333ea]/30">HRCI</span>
                    </div>
                    <p className="text-sm text-slate-400">
                        Use the Certifications filter in the Academy search panel to find credit-eligible courses.
                    </p>
                </div>
            </section>

            {/* Claiming Credits */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Award size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Claiming Credits & Certificates</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>
                        After you complete a course, you can claim any available credits directly from the course page.
                        If a certificate is available, you’ll also see a Certificate button you can open and share.
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Open the course and finish the lessons (some credit claims require a minimum completion threshold)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click <span className="text-white font-medium">Claim Credits</span> on the course page</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use the <span className="text-white font-medium">Certificate</span> button (if shown) to open the verification page</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Tip: Credits are calculated based on time watched and course eligibility. If you don’t see credits for a course, it may not be credit-eligible.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Conversations Help Content
 */
function ConversationsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <MessageSquare size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Chat History</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Conversations collection stores your complete chat history with Prometheus.
                    Every conversation is saved automatically and can be resumed at any time.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Managing Conversations</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Click any conversation card to resume where you left off</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Drag conversations to other collections to organize by topic</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Start a new conversation anytime from the header button</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Export conversations when you want to reuse the output (for example: policies, talk tracks, or checklists)</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Some Tools create “tool conversations” that you can resume from the Tools section or from your collections.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Drag and Drop Help Content
 */
function DragDropHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Layers size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Effortless Organization</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Drag and drop makes organizing your learning effortless. Move courses, conversations, and context items
                    between collections with simple gestures.
                </p>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <FolderHeart size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How to Drag</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span>Click and hold any card - it will lift and follow your cursor</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span>Collection portals appear at the bottom of the screen</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Drag over a portal - it will highlight when ready</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">4</span>
                            </div>
                            <span>Release to add the item to that collection</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Course Progress Help Content
 */
function CourseProgressHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <TrendingUp size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Track Your Learning</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Course progress is tracked automatically as you complete lessons, making it easy to see how far
                    you've come and pick up where you left off.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <GraduationCap size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Progress Indicators</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Course cards show a progress bar with completion percentage</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Inside courses, completed lessons are marked with checkmarks</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>The Dashboard shows your in-progress courses</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400">
                        Click the Continue button on any in-progress course to jump to your next incomplete lesson.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Search & Filters Help Content
 */
function SearchFiltersHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Search size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Find What You Need</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Search & Filter panel in the Academy helps you find courses quickly using multiple criteria.
                    Combine filters for precise results or search by keyword.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Layers size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Available Filters</h3>
                </div>
                <div className="grid gap-2 text-sm">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Category</span>
                        <span className="text-slate-400">Filter by course category</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Credits</span>
                        <span className="text-slate-400">SHRM / HRCI eligible</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Designation</span>
                        <span className="text-slate-400">Required / Recommended</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Status</span>
                        <span className="text-slate-400">Not started / In progress / Completed</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Rating</span>
                        <span className="text-slate-400">Minimum star rating</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Date</span>
                        <span className="text-slate-400">Filter by when added / timeframe</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between">
                        <span className="text-white">Include Lessons</span>
                        <span className="text-slate-400">Search lesson titles/content too</span>
                    </div>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Lightbulb size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Using Filters Effectively</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Start with a keyword search, then narrow down with 1–2 filters</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use <span className="text-white font-medium">Status</span> to find what to continue next</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Use <span className="text-white font-medium">Credits</span> when you need SHRM/HRCI-eligible courses</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span>Reset or clear filters if results look too narrow</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Settings Help Content
 */
function SettingsHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-500/20">
                        <Settings size={20} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Customize Your Experience</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Settings let you customize your EnhancedHR experience. Access Settings from your profile menu
                    in the bottom left corner of the navigation panel.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Sparkles size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">AI Settings</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Enable AI Insights</p>
                        <p className="text-xs text-slate-400">Turn insight detection on or off during conversations</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Auto-Save AI Insights</p>
                        <p className="text-xs text-slate-400">Automatically save insights without prompting for approval</p>
                    </div>
                </div>
            </section>

            {/* Account & Billing */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <User size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Account & Billing</h3>
                </div>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                    <p className="text-sm text-slate-400">
                        In addition to the Settings page, there are dedicated pages for account and billing management.
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">My Account</span>: profile photo, password, membership status</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-blue-light mt-1">•</span>
                            <span><span className="text-white font-medium">Billing &amp; Membership</span>: upgrade, manage subscription, billing portal</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

/**
 * Organization Features Help Content
 */
function OrganizationHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <Building size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Team Management</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Organization features help Org Admins manage team learning effectively. These tools are available
                    to users with Org Admin or Org Owner roles.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Users size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Admin Capabilities</h3>
                </div>
                <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Team Management</p>
                        <p className="text-xs text-slate-400">View members, invite users, manage permissions</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Learning Assignments</p>
                        <p className="text-xs text-slate-400">Assign courses, create learning paths, set deadlines</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">Analytics</p>
                        <p className="text-xs text-slate-400">Completion rates, engagement metrics, progress reports</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

/**
 * Help Collection Help Content
 */
function HelpCollectionHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#4B8BB3]/20">
                        <HelpCircle size={20} className="text-[#4B8BB3]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">You're Here!</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    The Help Collection provides comprehensive documentation for every feature in the EnhancedHR platform.
                    This is where you can explore what the platform offers and get answers to your questions.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Lightbulb size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How to Use Help</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-[#4B8BB3] mt-1">•</span>
                            <span>Browse the cards to explore features</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#4B8BB3] mt-1">•</span>
                            <span>Click any card to open the full documentation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#4B8BB3] mt-1">•</span>
                            <span>Use the Collection Assistant to ask questions about the platform</span>
                        </li>
                    </ul>
                    <p className="text-sm text-slate-400 mt-4">
                        The Help Collection is designed for both exploration and reference. Come back anytime you need
                        guidance on using the platform effectively.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Notes Help Content
 */
function NotesHelpContent() {
    return (
        <div className="space-y-8">
            {/* Value/Purpose */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#F5E6A3]/20">
                        <StickyNote size={20} className="text-[#F5E6A3]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Take Notes While You Learn</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Notes in courses let you capture insights, ideas, and key takeaways as you watch lessons.
                    Your notes are linked to the course, so they always appear when you return to that course.
                </p>
            </section>

            {/* How It Works */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-blue-light/20">
                        <BookOpen size={20} className="text-brand-blue-light" />
                    </div>
                    <h3 className="text-lg font-bold text-white">How Notes Work</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>When viewing a course, you can access notes from the AI panel on the right side:</p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-[#F5E6A3] mt-1">•</span>
                            <span>Switch to the <span className="text-white font-medium">Notes</span> tab to see your course notes</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F5E6A3] mt-1">•</span>
                            <span>Click <span className="text-white font-medium">+ Note</span> to create a new note for this course</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F5E6A3] mt-1">•</span>
                            <span>Click any existing note to edit it in the panel editor</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F5E6A3] mt-1">•</span>
                            <span>Notes auto-save as you type, so you never lose your work</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Instructions */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Layers size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Accessing All Your Notes</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                    <p>You can access notes from multiple places:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">1</span>
                            </div>
                            <span><span className="text-white font-medium">All Notes dropdown</span> in the Notes tab lets you load any note into the current course</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">2</span>
                            </div>
                            <span><span className="text-white font-medium">All Notes collection</span> in the left navigation shows every note you've created across all courses</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue-light">3</span>
                            </div>
                            <span>Notes can be <span className="text-white font-medium">added to collections</span> just like courses and conversations</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Tip */}
            <section className="bg-[#F5E6A3]/10 border border-[#F5E6A3]/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="text-[#F5E6A3] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white mb-1">Pro Tip</p>
                        <p className="text-sm text-slate-400">
                            Notes created in a course stay linked to that course. When you return to the course later,
                            your notes will be right there waiting for you in the Notes tab.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HELP_TOPICS;
