import React from 'react';
import { LucideIcon } from 'lucide-react';
import GlobalTopPanel from '@/components/GlobalTopPanel';

interface DropdownPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: LucideIcon;
    iconColor?: string; // e.g. "text-brand-blue-light"
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Standardized Dropdown Panel Component.
 * Enforces consistent layout, header height (h-24), and content padding (px-50 py-75).
 * Wraps GlobalTopPanel.
 */
const DropdownPanel: React.FC<DropdownPanelProps> = ({
    isOpen,
    onClose,
    title,
    icon: Icon,
    iconColor = "text-brand-blue-light",
    headerActions,
    children
}) => {

    // Standard Header Title Renderer
    const renderTitle = () => (
        <div className="flex items-center gap-3">
            <div className={iconColor}>
                <Icon size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
        </div>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={headerActions}
        >
            {/* Standardized Content Container */}
            <div className="w-full px-[50px] py-[75px]">
                {children}
            </div>
        </GlobalTopPanel>
    );
};

export default DropdownPanel;
