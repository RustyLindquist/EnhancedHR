'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Flame, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const formData = new FormData(event.currentTarget)
        const action = isSignUp ? signup : login

        const result = await action(formData)

        // If we get a result back, it means there was an error (since success redirects)
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else if ('success' in result && result.success && 'message' in result && result.message) {
            setSuccessMessage(result.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#051114] flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-blue-light/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-orange to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,147,0,0.3)] mb-6 transform rotate-3">
                        <Flame size={32} className="text-white fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">EnhancedHR.ai</h1>
                    <p className="text-slate-400 text-sm">World-Class Learning for HR Professionals</p>
                </div>

                {/* Card */}
                <div className="bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError(null)
                            }}
                            className="text-xs font-bold text-brand-blue-light uppercase tracking-wider hover:text-white transition-colors"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-light to-brand-orange opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 rounded-xl blur"></div>
                                    <div className="relative bg-black/40 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-white/30 transition-colors">
                                        <User size={18} className="text-slate-500 mr-3" />
                                        <input
                                            name="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            required={isSignUp}
                                            className="bg-transparent border-none outline-none text-white placeholder-slate-600 w-full text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-light to-brand-orange opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 rounded-xl blur"></div>
                                <div className="relative bg-black/40 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-white/30 transition-colors">
                                    <Mail size={18} className="text-slate-500 mr-3" />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        className="bg-transparent border-none outline-none text-white placeholder-slate-600 w-full text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-light to-brand-orange opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 rounded-xl blur"></div>
                                <div className="relative bg-black/40 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-white/30 transition-colors">
                                    <Lock size={18} className="text-slate-500 mr-3" />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="bg-transparent border-none outline-none text-white placeholder-slate-600 w-full text-sm"
                                    />
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
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(120,192,240,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}
