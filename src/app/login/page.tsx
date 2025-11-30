'use client'

import { useState } from 'react'
import { login, signup, resetPassword } from './actions'
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import BackgroundSystem from '@/components/BackgroundSystem'
import { BACKGROUND_THEMES } from '@/constants'

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'signup' | 'forgot_password'>('login') // Default to Login
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Membership Selection State
    const [membershipType, setMembershipType] = useState<'free' | 'pro'>('free')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const formData = new FormData(event.currentTarget)

        let action;
        if (view === 'signup') action = signup;
        else if (view === 'login') action = login;
        else action = resetPassword;

        // In a real app, we would handle the payment info here if 'pro' is selected
        if (view === 'signup' && membershipType === 'pro') {
            // Mock payment validation
            const cardNumber = formData.get('cardNumber')
            if (!cardNumber) {
                setError("Please enter valid payment information.")
                setIsLoading(false)
                return
            }
        }

        const result = await action(formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else if ('success' in result && result.success && 'message' in result && result.message) {
            setSuccessMessage(result.message)
            setIsLoading(false)
            if (view === 'forgot_password') {
                // Optional: switch back to login after success
            }
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#051114] flex flex-col relative overflow-hidden font-sans text-white">

            {/* 1. Background System */}
            <BackgroundSystem theme={BACKGROUND_THEMES[0]} />

            {/* 2. Canvas Header */}
            <header className="absolute top-0 left-0 w-full p-8 z-20">
                <div className="flex flex-col">
                    <span className="text-brand-blue-light text-[10px] font-bold uppercase tracking-widest mb-1">Platform</span>
                    <h1 className="text-2xl font-light tracking-wide text-white">ACCOUNT ACCESS</h1>
                </div>
            </header>

            {/* 3. Main Content Area - Vertical Stack */}
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
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white">
                                {view === 'signup' ? 'Create Account' : (view === 'login' ? 'Welcome Back' : 'Reset Password')}
                            </h2>
                            {view !== 'forgot_password' && (
                                <button
                                    onClick={() => {
                                        setView(view === 'signup' ? 'login' : 'signup')
                                        setError(null)
                                        setSuccessMessage(null)
                                    }}
                                    className="text-[10px] font-bold text-brand-blue-light uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    {view === 'signup' ? 'Sign In' : 'Create Account'}
                                </button>
                            )}
                            {view === 'forgot_password' && (
                                <button
                                    onClick={() => {
                                        setView('login')
                                        setError(null)
                                        setSuccessMessage(null)
                                    }}
                                    className="text-[10px] font-bold text-brand-blue-light uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Back to Login
                                </button>
                            )}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {view === 'signup' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                            <User size={16} className="text-slate-500 mr-3" />
                                            <input
                                                name="fullName"
                                                type="text"
                                                placeholder="John Doe"
                                                required={view === 'signup'}
                                                className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-brand-blue-light/50 transition-colors">
                                        <Mail size={16} className="text-slate-500 mr-3" />
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            required
                                            className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {view !== 'forgot_password' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                        {view === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setView('forgot_password')
                                                    setError(null)
                                                    setSuccessMessage(null)
                                                }}
                                                className="text-[10px] font-bold text-slate-500 hover:text-brand-blue-light transition-colors uppercase tracking-widest"
                                            >
                                                Forgot?
                                            </button>
                                        )}
                                    </div>
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
                            )}

                            {/* MEMBERSHIP SELECTION (Sign Up Only) */}
                            {view === 'signup' && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Membership Plan</label>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Free Trial Option */}
                                        <div
                                            onClick={() => setMembershipType('free')}
                                            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${membershipType === 'free' ? 'bg-brand-blue-light/10 border-brand-blue-light shadow-[0_0_15px_rgba(120,192,240,0.1)]' : 'bg-[#0A0D12] border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold ${membershipType === 'free' ? 'text-brand-blue-light' : 'text-white'}`}>Free Trial</span>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${membershipType === 'free' ? 'border-brand-blue-light bg-brand-blue-light' : 'border-slate-600'}`}>
                                                    {membershipType === 'free' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Access to limited courses. Upgrade anytime.<br />
                                                <span className="text-brand-blue-light/80 text-[10px] uppercase tracking-wider">No credit card required</span>
                                            </p>
                                        </div>

                                        {/* Pro Membership Option */}
                                        <div
                                            onClick={() => setMembershipType('pro')}
                                            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${membershipType === 'pro' ? 'bg-brand-orange/10 border-brand-orange shadow-[0_0_15px_rgba(255,147,0,0.1)]' : 'bg-[#0A0D12] border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold ${membershipType === 'pro' ? 'text-brand-orange' : 'text-white'}`}>Professional Membership</span>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${membershipType === 'pro' ? 'border-brand-orange bg-brand-orange' : 'border-slate-600'}`}>
                                                    {membershipType === 'pro' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Unlimited access to all courses & AI tools.<br />
                                                <span className="text-white font-bold">$19/month</span> <span className="text-slate-500">billed monthly</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Fields (Expandable) */}
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${membershipType === 'pro' ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                                        <div className="space-y-3 p-4 bg-[#0A0D12] rounded-xl border border-white/10">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Card Number</label>
                                                <input
                                                    name="cardNumber"
                                                    type="text"
                                                    placeholder="0000 0000 0000 0000"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-brand-orange/50 outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Expiry</label>
                                                    <input
                                                        name="cardExpiry"
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-brand-orange/50 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">CVC</label>
                                                    <input
                                                        name="cardCvc"
                                                        type="text"
                                                        placeholder="123"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-brand-orange/50 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                className={`w-full py-4 rounded-lg bg-gradient-to-r text-white font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(120,192,240,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 ${membershipType === 'pro' && view === 'signup' ? 'from-brand-orange to-red-500 hover:shadow-[0_0_20px_rgba(255,147,0,0.4)]' : 'from-[#054C74] to-[#78C0F0]'}`}
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        {view === 'signup' ? (membershipType === 'pro' ? 'Complete Purchase' : 'Create Account') : (view === 'login' ? 'Sign In' : 'Send Reset Link')} <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-8 text-center max-w-md">
                    <p className="text-slate-600 text-xs">
                        By continuing, you agree to our <a href="/terms" className="text-slate-500 hover:text-white underline transition-colors">Terms of Service</a> and <a href="/privacy" className="text-slate-500 hover:text-white underline transition-colors">Privacy Policy</a>.
                    </p>
                </div>
            </main>
        </div>
    )
}
