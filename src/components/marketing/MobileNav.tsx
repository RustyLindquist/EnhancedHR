'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'

const navLinks = [
    { href: '/academy', label: 'Academy' },
    { href: '/platform', label: 'Platform' },
    { href: '/collections', label: 'Collections' },
    { href: '/organizations', label: 'Organizations' },
    { href: '/for-experts', label: 'For Experts' },
    { href: '/pricing', label: 'Pricing' },
]

export default function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [open])

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="lg:hidden text-white/70 hover:text-white transition-colors p-2 -mr-2"
                aria-label="Open menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            <div
                className={`fixed inset-0 z-[100] transition-all duration-300 ${open ? 'visible' : 'invisible'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-[#0A0D12]/95 backdrop-blur-2xl transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setOpen(false)}
                />

                {/* Menu Content */}
                <div
                    className={`relative z-10 flex flex-col h-full transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                >
                    {/* Close Button */}
                    <div className="flex justify-end p-6">
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/70 hover:text-white transition-colors p-2"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex flex-col items-center gap-2 pt-8 flex-1">
                        {navLinks.map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="text-2xl font-medium text-white/80 hover:text-white transition-colors py-3 px-6"
                                style={{ transitionDelay: open ? `${(i + 1) * 50}ms` : '0ms' }}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="flex flex-col items-center gap-4 pt-8 mt-8 border-t border-white/10 w-64">
                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setOpen(false)}
                                    className="px-8 py-3.5 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-colors"
                                >
                                    My Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setOpen(false)}
                                        className="text-lg text-slate-400 hover:text-white transition-colors py-2"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/login?view=signup"
                                        onClick={() => setOpen(false)}
                                        className="px-8 py-3.5 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all flex items-center gap-2"
                                    >
                                        Get Started <ArrowRight size={18} />
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </>
    )
}
