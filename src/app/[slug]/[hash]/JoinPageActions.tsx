'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface JoinPageActionsProps {
    slug: string;
    hash: string;
}

export default function JoinPageActions({ slug, hash }: JoinPageActionsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="space-y-6">
            {/* Primary Action: Create Account */}
            <Link
                href={`/login?view=signup&next=/${slug}/${hash}`}
                className="block w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider text-center hover:bg-white transition-all shadow-lg shadow-brand-blue-light/20 hover:shadow-white/30"
            >
                Create Account
            </Link>

            {/* Divider */}
            <div className="relative flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Expandable FAQ Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20">
                {/* FAQ Header - Always Visible */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors"
                >
                    <span className="text-sm text-slate-300 font-medium">
                        What if I already have an account?
                    </span>
                    <ChevronDown
                        size={20}
                        className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Expandable Content */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-4 pb-5 space-y-4">
                        <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                            <p>
                                If you already have a personal EnhancedHR account, you can click the button below to move your account into this organization. You will no longer be billed for your account, since your organization will be providing your account for you.
                            </p>
                            <p>
                                This will allow you to keep everything in your account. Or, if you wish to keep the accounts separate, you can use the "Create Account" button above to create a new account with the organization.
                            </p>
                            <p className="text-slate-300">
                                (Note: You will need to use a different email address to create a second account)
                            </p>
                        </div>

                        {/* Secondary Action: Log In to Join */}
                        <Link
                            href={`/login?next=/${slug}/${hash}`}
                            className="block w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold uppercase tracking-wider text-center hover:bg-white/10 hover:border-white/20 transition-all text-sm mt-4"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Log In to Join <ArrowRight size={16} />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
