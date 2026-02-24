import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchOrgById } from '@/app/actions/admin-orgs';
import OrgDetailPage from './OrgDetailPage';

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await fetchOrgById(id);
  if (!org) notFound();

  // Set the platform admin org selection cookie so getOrgContext() returns this org
  const cookieStore = await cookies();
  cookieStore.set('platform_admin_selected_org', id, { path: '/' });

  return <OrgDetailPage org={org} />;
}
