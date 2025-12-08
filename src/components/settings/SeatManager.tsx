'use client'

import React, { useState } from 'react'
import { Users, Plus, UserMinus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SeatManagerProps {
    orgId: string
    currentSeats: number
    activeMembers: number
}

export default function SeatManager({ orgId, currentSeats, activeMembers }: SeatManagerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleAddSeat = async () => {
        setIsLoading(true)
        try {
            // We can just redirect to a stripe checkout that updates subscription quantity?
            // Or call an API that does it directly if we have card on file.
            // For simplicity in Phase 1, we'll try to update directly via API assuming payment method exists.
            const res = await fetch('/api/stripe/update-seats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, action: 'increment' })
            })

            if (!res.ok) throw new Error(await res.text())

            router.refresh()
            alert('Seat added successfully! You will be billed for the prorated amount.')
        } catch (error: any) {
            console.error(error)
            alert(`Failed to add seat: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-brand-blue-light" />
                        Seat Management
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage your organization's capacity.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-white">{activeMembers} / {currentSeats}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Seats Used</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${activeMembers >= currentSeats ? 'bg-brand-red' : 'bg-brand-blue-light'
                        }`}
                    style={{ width: `${Math.min((activeMembers / currentSeats) * 100, 100)}%` }}
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleAddSeat}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-light hover:bg-brand-blue-light/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    {isLoading ? 'Updating...' : 'Add Seat ($30/mo)'}
                </button>
                {/* 
                <button
                    disabled
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <UserMinus size={18} />
                   Remove Seat
                </button> 
                */}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
                * Added seats are billed immediately (prorated). Removed seats apply at end of billing cycle.
            </p>
        </div>
    )
}
