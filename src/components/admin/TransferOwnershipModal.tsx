'use client';

import { useState, useEffect } from 'react';
import { X, Search, Crown } from 'lucide-react';
import { transferOrgOwnership, fetchOrgMembers } from '@/app/actions/admin-orgs';

interface TransferOwnershipModalProps {
  orgId: string;
  orgName: string;
  currentOwnerId: string | null;
  onClose: () => void;
  onTransferred: () => void;
}

export default function TransferOwnershipModal({ orgId, orgName, currentOwnerId, onClose, onTransferred }: TransferOwnershipModalProps) {
  const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrgMembers(orgId).then(result => {
      setMembers(result.filter(m => m.id !== currentOwnerId));
    });
  }, [orgId, currentOwnerId]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });

  const handleTransfer = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      await transferOrgOwnership(orgId, selectedId);
      onTransferred();
    } catch (e: any) {
      setError(e.message || 'Failed to transfer ownership');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            Transfer Ownership
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-slate-400 mb-4">Select a member of <span className="text-white font-medium">{orgName}</span> to become the new owner.</p>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-blue-light/50"
          />
        </div>

        <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg mb-6">
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-b-0 ${
                selectedId === m.id ? 'bg-brand-blue-light/10 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="font-medium">{m.full_name || 'Unnamed'}</div>
              <div className="text-xs text-slate-500">{m.email}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">No members found</div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20 transition-colors">Cancel</button>
          <button
            onClick={handleTransfer}
            disabled={!selectedId || loading}
            className="px-6 py-2 bg-brand-blue-light text-brand-black rounded-lg text-sm font-medium hover:bg-brand-orange hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Transferring...' : 'Transfer Ownership'}
          </button>
        </div>
      </div>
    </div>
  );
}
