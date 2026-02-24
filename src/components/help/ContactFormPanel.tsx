'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { submitContactForm } from '@/app/actions/contact';

interface ContactFormPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    userPhone?: string;
    userName?: string;
}

const ContactFormPanel: React.FC<ContactFormPanelProps> = ({
    isOpen,
    onClose,
    userEmail = '',
    userPhone = '',
}) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(userEmail);
    const [phone, setPhone] = useState(userPhone);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form state when panel closes
    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setMessage('');
            setEmail(userEmail);
            setPhone(userPhone);
            setSuccess(false);
            setError(null);
        }
    }, [isOpen, userEmail, userPhone]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await submitContactForm({
                subject,
                message,
                email,
                phone: phone || undefined,
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setSubject('');
                    setMessage('');
                    setEmail(userEmail);
                    setPhone(userPhone);
                    onClose();
                }, 3000);
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
        });
    };

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Reach Out To Our Team"
            icon={Mail}
            iconColor="text-brand-blue-light"
        >
            {success ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <CheckCircle className="text-green-400" size={48} />
                    <p className="text-green-400 text-lg font-semibold">
                        Message sent! Our team will get back to you shortly.
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-slate-400 text-sm mb-8 max-w-2xl">
                        Have a question, feature request, or issue to report? We&apos;d love to hear
                        from you. Fill out the form below and our team will get back to you shortly.
                    </p>

                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="What is this about?"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Message
                            </label>
                            <textarea
                                required
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us more..."
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Phone Number (optional)
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex items-center gap-2 px-6 py-3 bg-brand-blue-light text-brand-black font-bold rounded-full hover:bg-brand-blue-light/90 transition-all hover:scale-105 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <Send size={16} />
                                {isPending ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </DropdownPanel>
    );
};

export default ContactFormPanel;
