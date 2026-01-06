'use client'

import { useState, useEffect } from 'react'
import { saveExpertApplication, getExpertApplication, logout } from './actions'
import {
    User,
    Linkedin,
    Phone,
    FileText,
    BookOpen,
    ArrowRight,
    Loader2,
    CheckCircle,
    Clock,
    LogOut,
    Save,
    Camera,
    Award,
    Briefcase
} from 'lucide-react'
import BackgroundSystem from '@/components/BackgroundSystem'
import { BACKGROUND_THEMES } from '@/constants'
import Link from 'next/link'
import AvatarUpload from '@/components/onboarding/AvatarUpload'
import CredentialsEditor from '@/components/CredentialsEditor'
import { getMyCredentials, ExpertCredential } from '@/app/actions/credentials'

interface ApplicationData {
    user_id: string
    full_name: string
    expert_title: string
    phone_number: string
    linkedin_url: string
    author_bio: string
    course_proposal_title: string
    course_proposal_description: string
    application_status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'
    submitted_at: string | null
    avatar_url: string | null
    rejection_notes: string | null
}

export default function ExpertApplicationPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [credentials, setCredentials] = useState<ExpertCredential[]>([])
    const [application, setApplication] = useState<ApplicationData>({
        user_id: '',
        full_name: '',
        expert_title: '',
        phone_number: '',
        linkedin_url: '',
        author_bio: '',
        course_proposal_title: '',
        course_proposal_description: '',
        application_status: 'draft',
        submitted_at: null,
        avatar_url: null,
        rejection_notes: null
    })

    // Load existing application data and credentials
    useEffect(() => {
        const loadApplication = async () => {
            const [appResult, creds] = await Promise.all([
                getExpertApplication(),
                getMyCredentials()
            ])

            if (appResult.data) {
                setApplication({
                    user_id: appResult.data.user_id || '',
                    full_name: appResult.data.full_name || '',
                    expert_title: appResult.data.expert_title || '',
                    phone_number: appResult.data.phone_number || '',
                    linkedin_url: appResult.data.linkedin_url || '',
                    author_bio: appResult.data.author_bio || '',
                    course_proposal_title: appResult.data.course_proposal_title || '',
                    course_proposal_description: appResult.data.course_proposal_description || '',
                    application_status: appResult.data.application_status || 'draft',
                    submitted_at: appResult.data.submitted_at || null,
                    avatar_url: appResult.data.avatar_url || null,
                    rejection_notes: appResult.data.rejection_notes || null
                })
            }
            setCredentials(creds)
            setIsLoading(false)
        }
        loadApplication()
    }, [])

    const handleSave = async (submit: boolean = false) => {
        setIsSaving(true)
        setError(null)
        setSuccessMessage(null)

        const formData = new FormData()
        formData.append('full_name', application.full_name)
        formData.append('expert_title', application.expert_title)
        formData.append('phone_number', application.phone_number)
        formData.append('linkedin_url', application.linkedin_url)
        formData.append('author_bio', application.author_bio)
        formData.append('course_proposal_title', application.course_proposal_title)
        formData.append('course_proposal_description', application.course_proposal_description)
        formData.append('submit', submit ? 'true' : 'false')

        const result = await saveExpertApplication(formData)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccessMessage(submit ? 'Application submitted successfully!' : 'Draft saved.')
            if (submit) {
                setApplication(prev => ({ ...prev, application_status: 'submitted', submitted_at: new Date().toISOString() }))
            }
        }
        setIsSaving(false)
    }

    const handleLogout = async () => {
        await logout()
    }

    const isSubmitted = application.application_status !== 'draft'
    const isEditable = application.application_status === 'draft' || application.application_status === 'rejected'

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-[#051114] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-blue-light" />
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-[#051114] flex flex-col relative overflow-hidden font-sans text-white">
            <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

            {/* Header */}
            <header className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-4">
                    <img
                        src="/images/logos/EnhancedHR-logo.png"
                        alt="EnhancedHR"
                        className="h-12 w-auto"
                    />
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-start relative z-10 p-6 pt-24 pb-12 overflow-y-auto">
                <div className="w-full max-w-3xl">

                    {/* Status Banner */}
                    {isSubmitted && (
                        <div className={`mb-8 p-6 rounded-2xl border backdrop-blur-sm ${
                            application.application_status === 'approved'
                                ? 'bg-green-500/10 border-green-500/30'
                                : application.application_status === 'rejected'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-brand-orange/10 border-brand-orange/30'
                        }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${
                                    application.application_status === 'approved'
                                        ? 'bg-green-500/20 text-green-400'
                                        : application.application_status === 'rejected'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-brand-orange/20 text-brand-orange'
                                }`}>
                                    {application.application_status === 'approved' ? (
                                        <CheckCircle size={24} />
                                    ) : application.application_status === 'rejected' ? (
                                        <FileText size={24} />
                                    ) : (
                                        <Clock size={24} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">
                                        {application.application_status === 'approved'
                                            ? 'Application Approved!'
                                            : application.application_status === 'rejected'
                                                ? 'Application Needs Revision'
                                                : 'Application Under Review'}
                                    </h2>
                                    <p className="text-slate-400 text-sm">
                                        {application.application_status === 'approved'
                                            ? 'Welcome to EnhancedHR! You now have full access to the Expert Dashboard.'
                                            : application.application_status === 'rejected'
                                                ? 'Please review the feedback below and resubmit your application.'
                                                : 'Thank you for applying to become an EnhancedHR Expert. Our team is reviewing your profile and course proposal. We typically respond within 48 hours. Someone from our team will reach out to you soon.'}
                                    </p>
                                    {application.application_status === 'rejected' && application.rejection_notes && (
                                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Feedback from our team:</h4>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{application.rejection_notes}</p>
                                        </div>
                                    )}
                                    {application.submitted_at && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Progress Steps */}
                            {application.application_status !== 'approved' && application.application_status !== 'rejected' && (
                                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-brand-blue-light flex items-center justify-center text-brand-black font-bold">
                                            <CheckCircle size={16} />
                                        </div>
                                        <span className="text-xs text-brand-blue-light mt-1">Submitted</span>
                                    </div>
                                    <div className="w-24 h-0.5 bg-gradient-to-r from-brand-blue-light/50 to-brand-orange/50 animate-pulse"></div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 border-2 border-brand-orange flex items-center justify-center text-brand-orange font-bold animate-pulse">
                                            <Clock size={16} />
                                        </div>
                                        <span className="text-xs text-brand-orange mt-1">Under Review</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Application Form */}
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

                        {/* Form Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">Expert Application</h1>
                            <p className="text-slate-400 text-sm">
                                {isEditable
                                    ? 'Complete your profile and submit a course proposal to become an EnhancedHR Expert.'
                                    : 'Your application details are shown below.'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Profile Photo Section */}
                            {application.user_id && (
                                <div className="flex flex-col items-center pb-6 border-b border-white/10">
                                    <h3 className="text-[10px] font-bold text-brand-blue-light uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Camera size={12} />
                                        Profile Photo
                                    </h3>
                                    <AvatarUpload
                                        userId={application.user_id}
                                        currentAvatarUrl={application.avatar_url}
                                        size="lg"
                                        onUploadComplete={(url) => {
                                            setApplication(prev => ({ ...prev, avatar_url: url }))
                                            setSuccessMessage('Profile photo updated!')
                                            setTimeout(() => setSuccessMessage(null), 3000)
                                        }}
                                        onUploadError={(err) => {
                                            setError(err)
                                            setTimeout(() => setError(null), 5000)
                                        }}
                                    />
                                    <p className="text-xs text-slate-500 mt-3 text-center">
                                        Click or drag to upload your profile photo
                                    </p>
                                </div>
                            )}

                            {/* Personal Information Section */}
                            <div>
                                <h3 className="text-[10px] font-bold text-brand-blue-light uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User size={12} />
                                    Personal Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Full Name <span className="text-brand-orange">*</span>
                                        </label>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <User size={16} className="text-slate-500 mr-3" />
                                            <input
                                                type="text"
                                                value={application.full_name}
                                                onChange={(e) => setApplication(prev => ({ ...prev, full_name: e.target.value }))}
                                                disabled={!isEditable}
                                                placeholder="Dr. Jane Smith"
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Professional Title</label>
                                        <p className="text-[10px] text-slate-600 ml-1 -mt-1">
                                            Your role or title (e.g., "Senior HR Consultant", "CHRO", "HR Director")
                                        </p>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <Briefcase size={16} className="text-slate-500 mr-3" />
                                            <input
                                                type="text"
                                                value={application.expert_title}
                                                onChange={(e) => setApplication(prev => ({ ...prev, expert_title: e.target.value }))}
                                                disabled={!isEditable}
                                                placeholder="Senior HR Consultant"
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <Phone size={16} className="text-slate-500 mr-3" />
                                            <input
                                                type="tel"
                                                value={application.phone_number}
                                                onChange={(e) => setApplication(prev => ({ ...prev, phone_number: e.target.value }))}
                                                disabled={!isEditable}
                                                placeholder="+1 (555) 123-4567"
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">LinkedIn Profile URL</label>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <Linkedin size={16} className="text-slate-500 mr-3" />
                                            <input
                                                type="url"
                                                value={application.linkedin_url}
                                                onChange={(e) => setApplication(prev => ({ ...prev, linkedin_url: e.target.value }))}
                                                disabled={!isEditable}
                                                placeholder="https://linkedin.com/in/your-profile"
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Award size={12} />
                                            Credentials & Background
                                        </label>
                                        <p className="text-[10px] text-slate-600 ml-1 -mt-1">
                                            Add your certifications, degrees, years of experience, and notable achievements
                                        </p>
                                        <div className="bg-[#0A0D12] border border-white/10 rounded-lg p-4">
                                            <CredentialsEditor
                                                credentials={credentials}
                                                onCredentialsChange={setCredentials}
                                                readOnly={!isEditable}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Expert Bio
                                        </label>
                                        <p className="text-[10px] text-slate-600 ml-1 -mt-1">
                                            A short bio that will be displayed on your course pages and expert profile
                                        </p>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <textarea
                                                value={application.author_bio}
                                                onChange={(e) => setApplication(prev => ({ ...prev, author_bio: e.target.value.slice(0, 500) }))}
                                                disabled={!isEditable}
                                                placeholder="Write a compelling bio that introduces you to learners. Describe your expertise, experience, and what makes you passionate about teaching this subject..."
                                                rows={4}
                                                maxLength={500}
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium resize-none disabled:opacity-50"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 text-right mr-1">
                                            {application.author_bio.length}/500
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Course Proposal Section */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BookOpen size={12} />
                                    Course Proposal
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Proposed Course Title <span className="text-brand-orange">*</span>
                                        </label>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-orange/50 transition-colors">
                                            <FileText size={16} className="text-slate-500 mr-3" />
                                            <input
                                                type="text"
                                                value={application.course_proposal_title}
                                                onChange={(e) => setApplication(prev => ({ ...prev, course_proposal_title: e.target.value.slice(0, 150) }))}
                                                disabled={!isEditable}
                                                placeholder="E.g., Strategic Talent Acquisition in the AI Era"
                                                maxLength={150}
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium disabled:opacity-50"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 text-right mr-1">
                                            {application.course_proposal_title.length}/150
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Course Description & Outline <span className="text-brand-orange">*</span>
                                        </label>
                                        <p className="text-[10px] text-slate-600 ml-1 -mt-1">
                                            Describe the course content, target audience, key learning outcomes, and rough module outline
                                        </p>
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg px-4 py-3 focus-within:border-brand-orange/50 transition-colors">
                                            <textarea
                                                value={application.course_proposal_description}
                                                onChange={(e) => setApplication(prev => ({ ...prev, course_proposal_description: e.target.value.slice(0, 2000) }))}
                                                disabled={!isEditable}
                                                placeholder="Describe your course idea in detail. Include:
• What problems does this course solve?
• Who is the target audience?
• What will learners be able to do after completing it?
• Rough outline of modules/lessons"
                                                rows={8}
                                                maxLength={2000}
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium resize-none disabled:opacity-50"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 text-right mr-1">
                                            {application.course_proposal_description.length}/2000
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center">
                                    {successMessage}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {isEditable && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button
                                        onClick={() => handleSave(false)}
                                        disabled={isSaving}
                                        className="flex-1 py-3 px-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={isSaving || !application.full_name || !application.course_proposal_title || !application.course_proposal_description}
                                        className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-brand-orange to-red-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,147,0,0.4)]"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                        Submit Application
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <p className="text-center text-slate-600 text-xs mt-6">
                        Questions? Contact us at <a href="mailto:experts@enhancedhr.ai" className="text-slate-500 hover:text-white underline">experts@enhancedhr.ai</a>
                    </p>
                </div>
            </main>
        </div>
    )
}
