'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/lib/export';

interface CSVExportButtonProps {
    data: any[];
    filename: string;
    label?: string;
    className?: string;
}

const CSVExportButton: React.FC<CSVExportButtonProps> = ({
    data,
    filename,
    label = 'Export CSV',
    className = "flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10"
}) => {
    return (
        <button
            onClick={() => exportToCSV(data, filename)}
            className={className}
        >
            <Download size={16} /> {label}
        </button>
    );
};

export default CSVExportButton;
