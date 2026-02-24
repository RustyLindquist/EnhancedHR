'use client';

import { useState, useEffect } from 'react';
import { X, Search, Building2 } from 'lucide-react';
import { createOrganization, fetchUsersWithoutOrg } from '@/app/actions/admin-orgs';

interface CreateOrgModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOrgModal({ onClose, onCreated }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('trial');
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsersWithoutOrg().then(setUsers);
  }, []);

  const filteredUsers = users.filter(u => {
    const q = ownerSearch.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  const selectedUser = users.find(u => u.id === selectedOwner);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedOwner) return;
    setLoading(true);
    setError('');

    const result = await createOrganization({
      name: name.trim(),
      account_type: accountType,
      owner_id: selectedOwner,
    });

    if (result.success) {
      onCreated();
    } else {
      setError(result.error || 'Failed to create organization');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 size={20} className="text-brand-blue-light" />
            Create Organization
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Org Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">Organization Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corporation"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-blue-light/50"
          />
        </div>

        {/* Account Type */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
          <div className="flex gap-3">
            {['trial', 'paid'].map(type => (
              <button
                key={type}
                onClick={() => setAccountType(type)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  accountType === type
                    ? type === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Owner Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Owner</label>
          {selectedUser ? (
            <div className="flex items-center justify-between px-4 py-2.5 bg-brand-blue-light/10 border border-brand-blue-light/20 rounded-lg">
              <span className="text-sm text-white">{selectedUser.full_name || selectedUser.email}</span>
              <button onClick={() => setSelectedOwner(null)} className="text-slate-400 hover:text-white text-xs">Change</button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Search users without an org..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-blue-light/50"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg">
                {filteredUsers.slice(0, 20).map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedOwner(u.id); setOwnerSearch(''); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div>{u.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">No users found</div>
                )}
              </div>
            </>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !selectedOwner || loading}
            className="px-6 py-2 bg-brand-blue-light text-brand-black rounded-lg text-sm font-medium hover:bg-brand-orange hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </div>
    </div>
  );
}
