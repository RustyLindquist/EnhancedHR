'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OrgAdminHeader from '@/components/admin/OrgAdminHeader';
import TransferOwnershipModal from '@/components/admin/TransferOwnershipModal';
import MyOrganizationHub from '@/components/org/MyOrganizationHub';
import UsersAndGroupsCanvas from '@/components/org/UsersAndGroupsCanvas';
import TeamManagement from '@/components/org/TeamManagement';
import OrgAnalyticsCanvas from '@/components/org/OrgAnalyticsCanvas';
import OrgCollectionsView from '@/components/org/OrgCollectionsView';
import GroupDetailCanvas from '@/components/org/GroupDetailCanvas';
import { OrgDetail, updateOrgAccountType, deleteOrganization, setPlatformAdminOrgCookie } from '@/app/actions/admin-orgs';
import { getOrgSummary, getOrgCollections, deleteOrgCollection } from '@/app/actions/org';
import { getGroupDetails } from '@/app/actions/groups';

export default function OrgDetailPage({ org }: { org: OrgDetail }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Set the platform admin org selection cookie so getOrgContext() returns this org
  useEffect(() => {
    setPlatformAdminOrgCookie(org.id);
  }, [org.id]);
  const [deleteInput, setDeleteInput] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Org portal navigation
  const [activeView, setActiveView] = useState<string>('hub');
  const [viewingGroup, setViewingGroup] = useState<any | null>(null);
  const [orgMemberCount, setOrgMemberCount] = useState(0);
  const [orgCollections, setOrgCollections] = useState<{ id: string; label: string; color: string; item_count: number }[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  // Reset view when org changes
  useEffect(() => {
    setActiveView('hub');
    setViewingGroup(null);
  }, [org.id]);

  // Fetch org summary data (member count)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getOrgSummary();
        setOrgMemberCount(summary.memberCount);
      } catch (e) {
        console.error('Failed to fetch org summary:', e);
      }
    };
    // Small delay to ensure cookie is set first
    const timer = setTimeout(fetchData, 150);
    return () => clearTimeout(timer);
  }, [org.id]);

  // Fetch org collections
  useEffect(() => {
    const fetchCollections = async () => {
      setCollectionsLoading(true);
      try {
        const collections = await getOrgCollections();
        setOrgCollections(collections.map(c => ({
          id: c.id,
          label: c.label,
          color: c.color,
          item_count: c.item_count,
        })));
      } catch (e) {
        console.error('Failed to fetch org collections:', e);
      }
      setCollectionsLoading(false);
    };
    const timer = setTimeout(fetchCollections, 150);
    return () => clearTimeout(timer);
  }, [org.id]);

  // Fetch group details when navigating to a group
  useEffect(() => {
    if (activeView.startsWith('group-')) {
      const groupId = activeView.replace('group-', '');
      getGroupDetails(groupId).then(details => {
        setViewingGroup(details);
      });
    } else {
      setViewingGroup(null);
    }
  }, [activeView]);

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

  const handleSelectModule = useCallback((moduleId: string) => {
    setActiveView(moduleId);
  }, []);

  const handleBack = useCallback(() => {
    if (activeView === 'org-team') {
      setActiveView('users-groups');
    } else if (activeView.startsWith('group-')) {
      setActiveView('users-groups');
    } else {
      setActiveView('hub');
    }
  }, [activeView]);

  const handleDeleteCollection = useCallback(async (collectionId: string) => {
    const result = await deleteOrgCollection(collectionId);
    if (result.success) {
      setOrgCollections(prev => prev.filter(c => c.id !== collectionId));
    }
  }, []);

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

      {/* Organization Portal Content */}
      <div>
          {activeView === 'hub' && (
            <MyOrganizationHub
              orgMemberCount={orgMemberCount}
              orgCollectionsCount={orgCollections.length}
              isOrgAdmin={true}
              hasOrgCourses={true}
              viewMode="grid"
              onSelectCollection={handleSelectModule}
              onNavigateToOrgCourses={() => { window.location.href = '/org-courses'; }}
              hideAssignedLearning={true}
              className="w-full pt-6 pb-48"
            />
          )}

          {activeView === 'users-groups' && (
            <UsersAndGroupsCanvas
              onSelectAllUsers={() => setActiveView('org-team')}
              onSelectGroup={(groupId) => setActiveView(`group-${groupId}`)}
              onBack={() => setActiveView('hub')}
              isAdmin={true}
            />
          )}

          {activeView === 'org-team' && (
            <TeamManagement
              onBack={() => setActiveView('users-groups')}
              isAdmin={true}
            />
          )}

          {activeView === 'org-analytics' && (
            <OrgAnalyticsCanvas
              onBack={() => setActiveView('hub')}
            />
          )}

          {activeView === 'org-collections' && (
            <OrgCollectionsView
              collections={orgCollections}
              isLoading={collectionsLoading}
              onCollectionSelect={() => {}}
              isOrgAdmin={true}
              onDelete={handleDeleteCollection}
            />
          )}

          {activeView.startsWith('group-') && viewingGroup && (
            <GroupDetailCanvas
              group={viewingGroup}
              onBack={() => setActiveView('users-groups')}
              isAdmin={true}
            />
          )}

          {activeView.startsWith('group-') && !viewingGroup && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              Loading group...
            </div>
          )}
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
