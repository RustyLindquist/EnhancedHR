import { Message } from '@/types';

/**
 * Export a conversation to a Markdown file
 * @param messages - The conversation messages
 * @param title - The conversation title (used for filename and header)
 * @param agentName - The name of the AI agent (e.g., "Prometheus AI")
 */
export function exportConversationAsMarkdown(
    messages: Message[],
    title: string = 'Conversation',
    agentName: string = 'Prometheus AI'
): void {
    if (!messages || messages.length === 0) {
        console.warn('No messages to export');
        return;
    }

    // Build the Markdown content
    const lines: string[] = [
        `# ${title}`,
        '',
        `**Exported from ${agentName}**`,
        `**Date:** ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`,
        '',
        '---',
        ''
    ];

    // Add each message
    messages.forEach((msg, index) => {
        const isUser = msg.role === 'user';
        const speaker = isUser ? '**You**' : `**${agentName}**`;

        lines.push(speaker);
        lines.push('');
        lines.push(msg.content);
        lines.push('');

        // Add separator between messages (except after last message)
        if (index < messages.length - 1) {
            lines.push('---');
            lines.push('');
        }
    });

    // Add footer
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Exported from EnhancedHR Learning Platform*');

    const markdownContent = lines.join('\n');

    // Create and trigger download
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Generate filename from title (sanitize for filesystem)
    const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .substring(0, 50); // Limit length

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${sanitizedTitle}-${timestamp}.md`;

    // Create temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
}
