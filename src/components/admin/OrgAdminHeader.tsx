'use client';

import { ArrowLeft, Crown, Trash2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrgDetail } from '@/app/actions/admin-orgs';

interface OrgAdminHeaderProps {
  org: OrgDetail;
  onAccountTypeChange: (newType: string) => void;
  onTransferOwnership: () => void;
  onDeleteOrg: () => void;
}

export default function OrgAdminHeader({ org, onAccountTypeChange, onTransferOwnership, onDeleteOrg }: OrgAdminHeaderProps) {
  const router = useRouter();

  const handleTypeToggle = () => {
    const newType = org.account_type === 'trial' ? 'paid' : 'trial';
    onAccountTypeChange(newType);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/organizations')}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-12 h-12 rounded-xl bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light font-bold text-lg">
            {org.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{org.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${
              org.account_type === 'paid'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {org.account_type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTypeToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20 hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
            Switch to {org.account_type === 'trial' ? 'Paid' : 'Trial'}
          </button>
          <button
            onClick={onTransferOwnership}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20 hover:text-white transition-colors"
          >
            <Crown size={14} />
            Transfer Ownership
          </button>
          <button
            onClick={onDeleteOrg}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
