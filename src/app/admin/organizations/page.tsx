import { fetchAllOrgs } from '@/app/actions/admin-orgs';
import OrganizationsListPage from './OrganizationsListPage';

export default async function AdminOrganizationsPage() {
  const orgs = await fetchAllOrgs();
  return <OrganizationsListPage initialOrgs={orgs} />;
}
