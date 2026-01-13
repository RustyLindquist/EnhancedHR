'use client';

import React from 'react';
import OrgCourseAIPanel from '@/components/org/OrgCourseAIPanel';

interface OrgCourseAIPanelWrapperProps {
    orgId: string;
    orgName: string;
}

/**
 * Client-side wrapper for OrgCourseAIPanel.
 * This allows the AI panel to be used in server-side rendered pages.
 */
export default function OrgCourseAIPanelWrapper({
    orgId,
    orgName
}: OrgCourseAIPanelWrapperProps) {
    return <OrgCourseAIPanel orgId={orgId} orgName={orgName} />;
}
