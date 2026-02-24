'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrgAdminHeader from '@/components/admin/OrgAdminHeader';
import TransferOwnershipModal from '@/components/admin/TransferOwnershipModal';
import { OrgDetail, updateOrgAccountType, deleteOrganization } from '@/app/actions/admin-orgs';

export default function OrgDetailPage({ org }: { org: OrgDetail }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleAccountTypeChange = async (newType: string) => {
    try {
      await updateOrgAccountType(org.id, newType);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to update account type');
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== org.name) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteOrganization(org.id);
      router.push('/admin/organizations');
    } catch (e: any) {
      setError(e.message || 'Failed to delete organization');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <OrgAdminHeader
        org={org}
        onAccountTypeChange={handleAccountTypeChange}
        onTransferOwnership={() => setShowTransfer(true)}
        onDeleteOrg={() => setShowDeleteConfirm(true)}
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Embedded org portal - iframe approach for clean isolation */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden" style={{ minHeight: '70vh' }}>
        <iframe
          src={`/org?embedded=true`}
          className="w-full border-0"
          style={{ minHeight: '70vh' }}
          title={`${org.name} Organization Portal`}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Delete Organization</h2>
            <p className="text-sm text-slate-400 mb-4">
              This will remove the organization and disassociate all members. Type <span className="text-red-400 font-bold">{org.name}</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type organization name..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-red-500/50"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== org.name || isDeleting}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <TransferOwnershipModal
          orgId={org.id}
          orgName={org.name}
          currentOwnerId={org.owner_id}
          onClose={() => setShowTransfer(false)}
          onTransferred={() => { setShowTransfer(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
