'use client';

import { useState } from 'react';
import { Key, Loader2, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '@/app/login/actions';

export default function ChangePasswordPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const result = await changePassword(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            // Reset form and close panel after short delay
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
            }, 2000);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setError(null);
        setSuccess(false);
    };

    return (
        <div className="pt-6 border-t border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
                <Key size={16} />
                Change Password
            </button>

            {/* Slide-down panel */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[400px] opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">Change Your Password</h4>
                        <button
                            onClick={handleClose}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {success ? (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                            <CheckCircle size={20} />
                            <span className="text-sm font-medium">Password changed successfully!</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        placeholder="Enter new password"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Confirm new password"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-brand-blue-light text-brand-black font-bold hover:bg-brand-blue-light/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        'Change Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
