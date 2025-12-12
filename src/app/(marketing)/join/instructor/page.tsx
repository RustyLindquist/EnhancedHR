'use client'

import { useState } from 'react'
import { signupInstructor } from './actions'
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle, GraduationCap } from 'lucide-react'
import BackgroundSystem from '@/components/BackgroundSystem'
import { BACKGROUND_THEMES } from '@/constants'
import Link from 'next/link'

export default function InstructorSignupPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const formData = new FormData(event.currentTarget)
        const result = await signupInstructor(formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (result?.success) {
            setSuccessMessage(result.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#051114] flex flex-col relative overflow-hidden font-sans text-white">

            {/* 1. Background System */}
            <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

            {/* 2. Canvas Header */}
            <header className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-brand-blue-light text-[10px] font-bold uppercase tracking-widest mb-1">Academy</span>
                    <h1 className="text-2xl font-light tracking-wide text-white">INSTRUCTOR ACCESS</h1>
                </div>
                <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Back to Home
                </Link>
            </header>

            {/* 3. Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 pt-20">

                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 transform hover:scale-105 transition-transform duration-500">
                    <img
                        src="/images/logos/EnhancedHR-logo-full-vertical.png"
                        alt="EnhancedHR"
                        className="w-[250px] h-auto object-contain drop-shadow-[0_0_30px_rgba(120,192,240,0.3)]"
                    />
                </div>

                {/* Auth Card */}
                <div className="w-full max-w-[480px]">
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                        {/* Card Header */}
                        <div className="mb-8 text-center">
                            <h2 className="text-xl font-bold text-white mb-2">
                                Become an Expert
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Create your free instructor account to submit a course proposal.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                        <User size={16} className="text-slate-500 mr-3" />
                                        <input
                                            name="fullName"
                                            type="text"
                                            placeholder="Dr. Jane Smith"
                                            required
                                            className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                        <Mail size={16} className="text-slate-500 mr-3" />
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="jane@university.edu"
                                            required
                                            className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                        <Lock size={16} className="text-slate-500 mr-3" />
                                        <input
                                            name="password"
                                            type="password"
                                            placeholder="••••••••••••"
                                            required
                                            minLength={6}
                                            className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Value Prop / Info Box */}
                            <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-4 mt-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-brand-blue-light/10 rounded-full text-brand-blue-light mt-0.5">
                                        <GraduationCap size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-brand-blue-light text-xs font-bold uppercase tracking-wider mb-1">Expert Account</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            This is a free account that gives you access to the Expert Dashboard where you can submit course proposals and manage your content.
                                        </p>
                                    </div>
                                </div>
                            </div>

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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-lg bg-gradient-to-r from-brand-orange to-red-500 text-white font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,147,0,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Create Expert Account <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-8 text-center max-w-md">
                    <p className="text-slate-600 text-xs">
                        Already have an account? <Link href="/login" className="text-slate-500 hover:text-white underline transition-colors">Log in here</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}
