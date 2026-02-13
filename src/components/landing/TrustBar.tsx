import { Shield } from 'lucide-react';

export default function TrustBar() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4B8BB3]/10 flex items-center justify-center">
                    <Shield size={12} className="text-[#4B8BB3]" />
                </div>
                <span>SHRM Approved Provider</span>
            </div>
            <div className="w-px h-4 bg-white/[0.08]" />
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FF9300]/10 flex items-center justify-center">
                    <Shield size={12} className="text-[#FF9300]" />
                </div>
                <span>HRCI Approved Provider</span>
            </div>
            <div className="w-px h-4 bg-white/[0.08]" />
            <span>7-day free trial &middot; No credit card required</span>
        </div>
    );
}
