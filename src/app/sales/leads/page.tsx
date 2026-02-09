import React from 'react';
import { getLeads, getLeadOwners } from '@/app/actions/leads';
import LeadsTable from '@/app/admin/leads/LeadsTable';

export const dynamic = 'force-dynamic';

export default async function SalesLeadsPage() {
    const [leads, owners] = await Promise.all([getLeads(), getLeadOwners()]);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Lead Management</h1>
                <p className="text-slate-400">View and manage demo requests and leads.</p>
            </div>
            <LeadsTable initialLeads={leads} owners={owners} />
        </div>
    );
}
