import { Suspense } from 'react';
import HomeContent from '@/components/Dashboard/HomeContent';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#0A0D12] text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
