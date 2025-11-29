'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#051114] text-white p-4">
            <div className="max-w-md w-full bg-[#0f172a] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                <p className="text-slate-400 mb-8 text-sm break-words">
                    {error.message || "An unexpected error occurred."}
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-brand-blue-light text-brand-black font-bold rounded-full hover:bg-white transition-colors uppercase tracking-wider text-sm"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
