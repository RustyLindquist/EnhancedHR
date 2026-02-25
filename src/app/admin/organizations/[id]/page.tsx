import { notFound } from 'next/navigation';
import { fetchOrgById } from '@/app/actions/admin-orgs';
import OrgDetailPage from './OrgDetailPage';

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await fetchOrgById(id);
  if (!org) notFound();

  return <OrgDetailPage org={org} />;
}
