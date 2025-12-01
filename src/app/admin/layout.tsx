import React from 'react';
import AdminPageLayout from '@/components/AdminPageLayout';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminPageLayout>
            {children}
        </AdminPageLayout>
    );
}
