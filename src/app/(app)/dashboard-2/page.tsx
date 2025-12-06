import { Suspense } from 'react';
import HomeContentV2 from '@/components/Dashboard/HomeContentV2';

export const dynamic = 'force-dynamic';

export default function HomeV2() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#0A0D12] text-white">Loading...</div>}>
            <HomeContentV2 />
        </Suspense>
    );
}
