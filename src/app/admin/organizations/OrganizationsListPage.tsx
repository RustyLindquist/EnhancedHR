'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrganizationsList from '@/components/admin/OrganizationsList';
import CreateOrgModal from '@/components/admin/CreateOrgModal';
import { OrgListItem } from '@/app/actions/admin-orgs';

export default function OrganizationsListPage({ initialOrgs }: { initialOrgs: OrgListItem[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <OrganizationsList
        orgs={initialOrgs}
        onCreateOrg={() => setShowCreateModal(true)}
      />
      {showCreateModal && (
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
