'use client';

import { useRouter } from 'next/navigation';
import { Building2, Plus, Crown, Users, Shield } from 'lucide-react';
import { OrgListItem } from '@/app/actions/admin-orgs';

interface OrganizationsListProps {
  orgs: OrgListItem[];
  onCreateOrg: () => void;
}

export default function OrganizationsList({ orgs, onCreateOrg }: OrganizationsListProps) {
  const router = useRouter();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">{orgs.length} organization{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onCreateOrg}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-light text-brand-black rounded-lg font-medium text-sm hover:bg-brand-orange hover:text-white transition-colors"
        >
          <Plus size={16} />
          Create Organization
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Organization</th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Account Type</th>
              <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Admins</th>
              <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Employees</th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr
                key={org.id}
                onClick={() => router.push(`/admin/organizations/${org.id}`)}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light font-bold text-sm">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{org.name}</div>
                      {org.owner_name && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Crown size={10} /> {org.owner_name}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    org.account_type === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {org.account_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-slate-300">
                    <Shield size={14} className="text-slate-500" />
                    {org.admin_count}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-slate-300">
                    <Users size={14} className="text-slate-500" />
                    {org.employee_count}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No organizations yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
