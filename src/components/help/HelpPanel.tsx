'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { getHelpTopic, HelpTopicId, isHelpTopicId } from './HelpContent';

interface HelpPanelProps {
    isOpen: boolean;
    onClose: () => void;
    topicId: HelpTopicId | string;
    fallbackTitle?: string;
    fallbackContentText?: string;
}

/**
 * HelpPanel - Platform Help dropdown panel
 *
 * Uses the standard DropdownPanel component with help-specific styling.
 * Content is loaded from the HelpContent registry based on topicId.
 *
 * Renders via Portal to document.body to ensure proper z-index stacking
 * regardless of where the component is mounted in the DOM tree.
 */
const HelpPanel: React.FC<HelpPanelProps> = ({
    isOpen,
    onClose,
    topicId,
    fallbackTitle,
    fallbackContentText
}) => {
    const [mounted, setMounted] = useState(false);
    const topic = isHelpTopicId(topicId) ? getHelpTopic(topicId) : undefined;

    // Ensure we only render the portal on the client
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const effectiveTitle = topic?.title || fallbackTitle || 'Help Topic';

    const panelContent = (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={`Platform Help: ${effectiveTitle}`}
            icon={HelpCircle}
            iconColor="text-brand-blue-light"
        >
            <div className="max-w-3xl">
                {topic?.content ? (
                    topic.content
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-300 leading-relaxed">
                            This help topic isn’t available in the UI registry yet.
                        </p>
                        {fallbackContentText ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                                    {fallbackContentText}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">
                                Missing topic id: <span className="text-slate-200 font-medium">{String(topicId)}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </DropdownPanel>
    );

    // Use portal to render at document body level for proper stacking
    return createPortal(panelContent, document.body);
};

export default HelpPanel;
