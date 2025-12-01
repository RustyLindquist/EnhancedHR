import React from 'react';
import { getUsers } from '@/app/actions/users';
import UsersTable from './UsersTable';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-slate-400">Manage platform users, roles, and permissions.</p>
            </div>

            <UsersTable initialUsers={users} />
        </div>
    );
}
