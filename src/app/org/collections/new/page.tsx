import React from 'react';
import OrgCollectionEditor from '@/components/org/OrgCollectionEditor';
import { getOrgContext } from '@/lib/org-context';

export default async function NewOrgCollectionPage() {
    // Get org context (handles platform admin org selection automatically)
    const orgContext = await getOrgContext();

    if (!orgContext) return <div>Access Denied</div>;

    return <OrgCollectionEditor collectionId="new" orgId={orgContext.orgId} />;
}
