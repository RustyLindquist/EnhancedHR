import React from 'react';

export default function MarketingDivider() {
  return (
    <div className="pointer-events-none relative mx-auto my-14 h-px w-full max-w-7xl px-6">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-[#4B8BB3]/0 via-[#4B8BB3]/60 to-[#4B8BB3]/0 blur-[1px]" />
    </div>
  );
}
