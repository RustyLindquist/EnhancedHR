import { LucideIcon } from 'lucide-react';
import { FileText, FileImage, FileSpreadsheet, FileCode, File } from 'lucide-react';

/** Get appropriate Lucide icon based on file MIME type */
export const getFileIcon = (fileType: string | undefined): LucideIcon => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('json') || fileType.includes('text/plain')) return FileCode;
    return File;
};

/** Format file size bytes to human-readable string */
export const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Extract file extension from filename (uppercase) */
export const getFileExtension = (fileName: string | undefined): string => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
};
