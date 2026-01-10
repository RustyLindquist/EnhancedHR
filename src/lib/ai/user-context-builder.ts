/**
 * User Context Builder
 *
 * Builds formatted team/user data context for the Team Analytics Assistant.
 * This enables AI-powered analysis of team learning metrics and engagement.
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface TeamMember {
    id: string;
    full_name: string;
    email?: string;
    role: string;
    role_title?: string;
    membership_status: string;
    created_at: string;
    courses_completed: number;
    total_time_spent_minutes: number;
    credits_earned: number;
    conversations_count: number;
    last_activity?: string;
}

export interface TeamSummary {
    totalMembers: number;
    avgCoursesCompleted: number;
    avgTimeSpentMinutes: number;
    avgCreditsEarned: number;
    avgConversations: number;
    activeMembers: number; // Members with activity in last 30 days
    topPerformers: TeamMember[];
    needsAttention: TeamMember[];
}

/**
 * Main function to build team data context for AI consumption.
 *
 * @param orgId - The organization ID to fetch data for
 * @param groupId - Optional group ID to filter to specific group members (use 'all-users' for all org members)
 * @returns Formatted string context suitable for AI consumption
 */
export async function buildTeamDataContext(
    orgId: string,
    groupId?: string
): Promise<string> {
    const adminClient = createAdminClient();

    // Determine which members to fetch
    let memberIds: string[] = [];
    let groupName: string | undefined;

    if (groupId && groupId !== 'all-users') {
        // Fetch group details and members
        const { data: group } = await adminClient
            .from('employee_groups')
            .select('name, is_dynamic')
            .eq('id', groupId)
            .single();

        groupName = group?.name;

        if (group?.is_dynamic) {
            // For dynamic groups, we need to compute members
            // Import dynamically to avoid circular dependencies
            const { computeDynamicGroupMembers } = await import('@/app/actions/dynamic-groups');
            memberIds = await computeDynamicGroupMembers(groupId);
        } else {
            // Static group - fetch from junction table
            const { data: groupMembers } = await adminClient
                .from('employee_group_members')
                .select('user_id')
                .eq('group_id', groupId);

            memberIds = groupMembers?.map(m => m.user_id) || [];
        }
    } else {
        // Fetch all org members
        const { data: profiles } = await adminClient
            .from('profiles')
            .select('id')
            .eq('org_id', orgId);

        memberIds = profiles?.map(p => p.id) || [];
    }

    if (memberIds.length === 0) {
        return groupName
            ? `No team members found in group "${groupName}".`
            : 'No team members found in this organization.';
    }

    // Fetch member profiles
    const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email, role, membership_status, created_at, data')
        .in('id', memberIds);

    // Fetch learning metrics
    const { data: progressData } = await adminClient
        .from('user_progress')
        .select('user_id, view_time_seconds, is_completed, last_accessed')
        .in('user_id', memberIds);

    // Fetch conversation counts
    const { data: conversationData } = await adminClient
        .from('conversations')
        .select('user_id')
        .in('user_id', memberIds);

    // Fetch credits earned
    const { data: creditsData } = await adminClient
        .from('user_credits_ledger')
        .select('user_id, amount')
        .in('user_id', memberIds);

    // Aggregate metrics per user
    const metricsMap = new Map<string, {
        timeSeconds: number;
        completed: number;
        conversations: number;
        credits: number;
        lastAccess: string | null;
    }>();

    memberIds.forEach(id => {
        metricsMap.set(id, {
            timeSeconds: 0,
            completed: 0,
            conversations: 0,
            credits: 0,
            lastAccess: null
        });
    });

    progressData?.forEach(p => {
        const m = metricsMap.get(p.user_id);
        if (m) {
            m.timeSeconds += p.view_time_seconds || 0;
            if (p.is_completed) m.completed += 1;
            if (p.last_accessed && (!m.lastAccess || new Date(p.last_accessed) > new Date(m.lastAccess))) {
                m.lastAccess = p.last_accessed;
            }
        }
    });

    conversationData?.forEach(c => {
        const m = metricsMap.get(c.user_id);
        if (m) m.conversations += 1;
    });

    creditsData?.forEach(c => {
        const m = metricsMap.get(c.user_id);
        if (m) m.credits += c.amount || 0;
    });

    // Build team members array
    const members: TeamMember[] = (profiles || []).map(p => {
        const metrics = metricsMap.get(p.id) || {
            timeSeconds: 0,
            completed: 0,
            conversations: 0,
            credits: 0,
            lastAccess: null
        };

        return {
            id: p.id,
            full_name: p.full_name || 'Unknown',
            email: p.email,
            role: p.role || 'user',
            role_title: (p.data as any)?.job_title || 'Team Member',
            membership_status: p.membership_status || 'active',
            created_at: p.created_at,
            courses_completed: metrics.completed,
            total_time_spent_minutes: Math.round(metrics.timeSeconds / 60),
            credits_earned: metrics.credits,
            conversations_count: metrics.conversations,
            last_activity: metrics.lastAccess || undefined
        };
    });

    return formatTeamContext(members, groupName);
}

/**
 * Format team members into an AI-readable text block.
 *
 * @param members - Array of team members with their metrics
 * @param groupName - Optional group name for context
 * @returns Formatted string suitable for AI consumption
 */
export function formatTeamContext(members: TeamMember[], groupName?: string): string {
    if (members.length === 0) {
        return groupName
            ? `No team members found in group "${groupName}".`
            : 'No team members found.';
    }

    // Calculate summary statistics
    const totalMembers = members.length;
    const totalCourses = members.reduce((sum, m) => sum + m.courses_completed, 0);
    const totalMinutes = members.reduce((sum, m) => sum + m.total_time_spent_minutes, 0);
    const totalCredits = members.reduce((sum, m) => sum + m.credits_earned, 0);
    const totalConversations = members.reduce((sum, m) => sum + m.conversations_count, 0);

    const avgCourses = totalMembers > 0 ? (totalCourses / totalMembers).toFixed(1) : '0';
    const avgMinutes = totalMembers > 0 ? Math.round(totalMinutes / totalMembers) : 0;
    const avgCredits = totalMembers > 0 ? (totalCredits / totalMembers).toFixed(1) : '0';
    const avgConversations = totalMembers > 0 ? (totalConversations / totalMembers).toFixed(1) : '0';

    // Determine active members (activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeMembers = members.filter(m => {
        if (!m.last_activity) return false;
        return new Date(m.last_activity) >= thirtyDaysAgo;
    });

    // Identify top performers (top 20% by courses + time spent)
    const sortedByPerformance = [...members].sort((a, b) => {
        const scoreA = a.courses_completed * 10 + a.total_time_spent_minutes / 60;
        const scoreB = b.courses_completed * 10 + b.total_time_spent_minutes / 60;
        return scoreB - scoreA;
    });

    const topCount = Math.max(1, Math.ceil(totalMembers * 0.2));
    const topPerformers = sortedByPerformance.slice(0, topCount).filter(m =>
        m.courses_completed > 0 || m.total_time_spent_minutes > 0
    );

    // Identify members needing attention (low engagement)
    const needsAttention = members.filter(m => {
        const hasNoProgress = m.courses_completed === 0 && m.total_time_spent_minutes < 30;
        const isInactive = !m.last_activity || new Date(m.last_activity) < thirtyDaysAgo;
        return hasNoProgress || isInactive;
    });

    // Build the context string
    const lines: string[] = [];

    // Header
    if (groupName) {
        lines.push(`=== Team Analytics: ${groupName} ===`);
    } else {
        lines.push('=== Team Analytics: All Organization Members ===');
    }
    lines.push('');

    // Summary Section
    lines.push('SUMMARY STATISTICS:');
    lines.push(`- Total Team Members: ${totalMembers}`);
    lines.push(`- Active Members (last 30 days): ${activeMembers.length} (${((activeMembers.length / totalMembers) * 100).toFixed(0)}%)`);
    lines.push(`- Average Courses Completed: ${avgCourses}`);
    lines.push(`- Average Learning Time: ${formatDuration(avgMinutes)}`);
    lines.push(`- Average Credits Earned: ${avgCredits}`);
    lines.push(`- Average AI Conversations: ${avgConversations}`);
    lines.push(`- Total Team Learning Time: ${formatDuration(totalMinutes)}`);
    lines.push('');

    // Top Performers Section
    if (topPerformers.length > 0) {
        lines.push('TOP PERFORMERS:');
        topPerformers.forEach((m, i) => {
            lines.push(`${i + 1}. ${m.full_name} (${m.role_title || m.role})`);
            lines.push(`   - Courses Completed: ${m.courses_completed}`);
            lines.push(`   - Learning Time: ${formatDuration(m.total_time_spent_minutes)}`);
            lines.push(`   - Credits: ${m.credits_earned}`);
        });
        lines.push('');
    }

    // Members Needing Attention Section
    if (needsAttention.length > 0) {
        lines.push('MEMBERS WHO MAY NEED SUPPORT:');
        needsAttention.slice(0, 5).forEach((m, i) => {
            const reason = !m.last_activity || new Date(m.last_activity) < thirtyDaysAgo
                ? 'No recent activity'
                : 'Low engagement';
            lines.push(`${i + 1}. ${m.full_name} - ${reason}`);
            if (m.last_activity) {
                lines.push(`   Last active: ${formatDate(m.last_activity)}`);
            }
        });
        if (needsAttention.length > 5) {
            lines.push(`   ... and ${needsAttention.length - 5} more members with low engagement`);
        }
        lines.push('');
    }

    // Individual Team Members Section
    lines.push('ALL TEAM MEMBERS:');
    members.forEach(m => {
        const status = getEngagementStatus(m, thirtyDaysAgo);
        lines.push(`- ${m.full_name} (${m.role_title || m.role}) [${status}]`);
        lines.push(`  Courses: ${m.courses_completed} | Time: ${formatDuration(m.total_time_spent_minutes)} | Credits: ${m.credits_earned} | Conversations: ${m.conversations_count}`);
        if (m.last_activity) {
            lines.push(`  Last Activity: ${formatDate(m.last_activity)}`);
        }
    });

    return lines.join('\n');
}

/**
 * Helper function to format minutes into a readable duration.
 */
function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Helper function to format a date string.
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Determine engagement status based on activity and metrics.
 */
function getEngagementStatus(member: TeamMember, thirtyDaysAgo: Date): string {
    if (!member.last_activity) {
        return 'Not Started';
    }

    const lastActive = new Date(member.last_activity);

    if (lastActive >= thirtyDaysAgo) {
        if (member.courses_completed >= 3 || member.total_time_spent_minutes >= 300) {
            return 'Highly Engaged';
        }
        return 'Active';
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    if (lastActive >= sixtyDaysAgo) {
        return 'Declining';
    }

    return 'Inactive';
}

/**
 * Fetch team data context for a specific user scope (for USER collection type).
 * This is called from context.ts when resolving USER scopes.
 *
 * @param userId - The current user making the request (for org verification)
 * @param scopeId - Either 'all-users' or a group ID
 * @returns Formatted team context string or null if access denied
 */
export async function getTeamContextForScope(
    userId: string,
    scopeId: string
): Promise<string | null> {
    const adminClient = createAdminClient();

    // Get user's org and verify admin access
    const { data: profile } = await adminClient
        .from('profiles')
        .select('org_id, role, membership_status')
        .eq('id', userId)
        .single();

    if (!profile?.org_id) {
        return null;
    }

    // Verify the user is an admin
    const isAdmin = profile.role === 'admin' ||
                    profile.role === 'org_admin' ||
                    profile.membership_status === 'org_admin';

    if (!isAdmin) {
        return null;
    }

    // If it's a group scope, verify the group belongs to the user's org
    if (scopeId && scopeId !== 'all-users') {
        const { data: group } = await adminClient
            .from('employee_groups')
            .select('org_id')
            .eq('id', scopeId)
            .single();

        if (!group || group.org_id !== profile.org_id) {
            return null;
        }
    }

    return buildTeamDataContext(profile.org_id, scopeId === 'all-users' ? undefined : scopeId);
}
