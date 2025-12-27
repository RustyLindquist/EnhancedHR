'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { getHelpTopic, HelpTopicId } from './HelpContent';

interface HelpPanelProps {
    isOpen: boolean;
    onClose: () => void;
    topicId: HelpTopicId;
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
    topicId
}) => {
    const [mounted, setMounted] = useState(false);
    const topic = getHelpTopic(topicId);

    // Ensure we only render the portal on the client
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!topic || !mounted) {
        return null;
    }

    const panelContent = (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={`Platform Help: ${topic.title}`}
            icon={HelpCircle}
            iconColor="text-brand-blue-light"
        >
            <div className="max-w-3xl">
                {topic.content}
            </div>
        </DropdownPanel>
    );

    // Use portal to render at document body level for proper stacking
    return createPortal(panelContent, document.body);
};

export default HelpPanel;
