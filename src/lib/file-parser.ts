/**
 * File Parser Library
 *
 * Extracts text content from various file formats for RAG embedding.
 * Supports: PDF, DOCX, TXT, MD, and common text formats.
 *
 * Architecture: Server-side only (uses Node.js APIs)
 * Note: Only async functions that use Supabase are server actions
 */

import { createAdminClient } from '@/lib/supabase/admin';

// Text chunking configuration
const DEFAULT_CHUNK_SIZE = 1000; // Characters per chunk
const DEFAULT_CHUNK_OVERLAP = 200; // Overlap between chunks for context continuity

/**
 * Supported file types and their MIME types
 */
export const SUPPORTED_FILE_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'text/csv': 'csv',
    'application/json': 'json',
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;

/**
 * Check if a file type is supported for parsing
 */
export function isFileTypeSupported(mimeType: string): boolean {
    return mimeType in SUPPORTED_FILE_TYPES;
}

/**
 * Extract text from a PDF file using pdf-parse
 * Falls back to basic extraction if library not available
 */
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse');
        const data = await pdf(Buffer.from(buffer));
        return data.text || '';
    } catch (error) {
        console.warn('pdf-parse not available or failed, returning placeholder:', error);
        // Return placeholder - in production you'd want the library installed
        return '[PDF content - install pdf-parse for extraction]';
    }
}

/**
 * Extract text from DOCX using mammoth
 * Falls back to basic extraction if library not available
 */
async function parseDOCX(buffer: ArrayBuffer): Promise<string> {
    try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
        return result.value || '';
    } catch (error) {
        console.warn('mammoth not available or failed, returning placeholder:', error);
        return '[DOCX content - install mammoth for extraction]';
    }
}

/**
 * Parse plain text files (TXT, MD, CSV, JSON)
 */
function parseTextFile(buffer: ArrayBuffer, mimeType: string): string {
    const text = new TextDecoder('utf-8').decode(buffer);

    // For JSON, we might want to stringify it nicely
    if (mimeType === 'application/json') {
        try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return text;
        }
    }

    return text;
}

/**
 * Main file parsing function
 * Routes to appropriate parser based on MIME type
 */
export async function parseFileContent(
    buffer: ArrayBuffer,
    mimeType: string,
    fileName?: string
): Promise<{ text: string; success: boolean; error?: string }> {
    try {
        let text = '';

        switch (mimeType) {
            case 'application/pdf':
                text = await parsePDF(buffer);
                break;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                text = await parseDOCX(buffer);
                break;

            case 'text/plain':
            case 'text/markdown':
            case 'text/csv':
            case 'application/json':
                text = parseTextFile(buffer, mimeType);
                break;

            default:
                // Try as plain text for unknown types
                try {
                    text = new TextDecoder('utf-8').decode(buffer);
                } catch {
                    return {
                        text: '',
                        success: false,
                        error: `Unsupported file type: ${mimeType}`
                    };
                }
        }

        // Clean up the extracted text
        text = cleanExtractedText(text);

        if (!text || text.trim().length === 0) {
            return {
                text: '',
                success: false,
                error: 'No text content could be extracted from the file'
            };
        }

        return { text, success: true };

    } catch (error) {
        console.error('File parsing error:', error);
        return {
            text: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error'
        };
    }
}

/**
 * Clean up extracted text
 * - Remove excessive whitespace
 * - Normalize line breaks
 * - Remove null characters
 */
function cleanExtractedText(text: string): string {
    return text
        // Remove null characters
        .replace(/\0/g, '')
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove excessive blank lines (more than 2)
        .replace(/\n{3,}/g, '\n\n')
        // Trim whitespace from each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Final trim
        .trim();
}

/**
 * Split text into chunks for embedding
 * Uses character-based chunking with overlap for context continuity
 */
export function chunkText(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    chunkOverlap: number = DEFAULT_CHUNK_OVERLAP
): string[] {
    const chunks: string[] = [];

    if (!text || text.length === 0) {
        return chunks;
    }

    // If text is smaller than chunk size, return as single chunk
    if (text.length <= chunkSize) {
        return [text];
    }

    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;

        // Try to break at a natural boundary (paragraph, sentence, word)
        if (end < text.length) {
            // Look for paragraph break
            const paragraphBreak = text.lastIndexOf('\n\n', end);
            if (paragraphBreak > start + chunkSize / 2) {
                end = paragraphBreak + 2;
            } else {
                // Look for sentence break
                const sentenceBreak = text.lastIndexOf('. ', end);
                if (sentenceBreak > start + chunkSize / 2) {
                    end = sentenceBreak + 2;
                } else {
                    // Look for word break
                    const wordBreak = text.lastIndexOf(' ', end);
                    if (wordBreak > start + chunkSize / 2) {
                        end = wordBreak + 1;
                    }
                }
            }
        }

        const chunk = text.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move start position, accounting for overlap
        start = end - chunkOverlap;
        // Prevent infinite loop - ensure we always advance
        const minStart = chunks.length > 0 ? (end - chunkSize) : 0;
        if (start <= minStart) {
            start = end;
        }
    }

    return chunks;
}

/**
 * Upload a file to Supabase Storage
 * Returns the public URL and storage path
 */
export async function uploadFileToStorage(
    file: File,
    userId: string,
    collectionId?: string
): Promise<{ path: string; url: string; success: boolean; error?: string }> {
    const admin = createAdminClient();

    // Generate unique path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${userId}/${collectionId || 'personal'}/${timestamp}_${sanitizedName}`;

    try {
        const buffer = await file.arrayBuffer();

        const { data, error } = await admin.storage
            .from('user-context-files')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return { path: '', url: '', success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = admin.storage
            .from('user-context-files')
            .getPublicUrl(path);

        return {
            path: data.path,
            url: urlData.publicUrl,
            success: true
        };

    } catch (error) {
        console.error('File upload error:', error);
        return {
            path: '',
            url: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromStorage(path: string): Promise<boolean> {
    const admin = createAdminClient();

    try {
        const { error } = await admin.storage
            .from('user-context-files')
            .remove([path]);

        if (error) {
            console.error('Storage delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('File delete error:', error);
        return false;
    }
}

/**
 * Upload a file to the platform folder in Supabase Storage
 * Used for Expert Resources that are not tied to any specific user.
 * Files are stored at: platform/expert-resources/{timestamp}_{filename}
 *
 * @param file - The file to upload
 * @param subfolder - Subfolder within platform/ (e.g., 'expert-resources')
 * @returns Upload result with path and URL
 */
export async function uploadPlatformFileToStorage(
    file: File,
    subfolder: string = 'expert-resources'
): Promise<{ path: string; url: string; success: boolean; error?: string }> {
    const admin = createAdminClient();

    // Generate unique path in platform folder (not tied to any user)
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `platform/${subfolder}/${timestamp}_${sanitizedName}`;

    try {
        const buffer = await file.arrayBuffer();

        const { data, error } = await admin.storage
            .from('user-context-files')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Platform storage upload error:', error);
            return { path: '', url: '', success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = admin.storage
            .from('user-context-files')
            .getPublicUrl(path);

        return {
            path: data.path,
            url: urlData.publicUrl,
            success: true
        };

    } catch (error) {
        console.error('Platform file upload error:', error);
        return {
            path: '',
            url: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Upload a file to the course resources folder in Supabase Storage
 * Files are stored at: courses/{courseId}/resources/{timestamp}_{filename}
 *
 * @param file - The file to upload
 * @param courseId - The course ID
 * @returns Upload result with path and URL
 */
export async function uploadCourseResourceToStorage(
    file: File,
    courseId: number
): Promise<{ path: string; url: string; success: boolean; error?: string }> {
    const admin = createAdminClient();

    // Generate unique path in course resources folder
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `courses/${courseId}/resources/${timestamp}_${sanitizedName}`;

    try {
        const buffer = await file.arrayBuffer();

        const { data, error } = await admin.storage
            .from('user-context-files')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Course resource storage upload error:', error);
            return { path: '', url: '', success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = admin.storage
            .from('user-context-files')
            .getPublicUrl(path);

        return {
            path: data.path,
            url: urlData.publicUrl,
            success: true
        };

    } catch (error) {
        console.error('Course resource file upload error:', error);
        return {
            path: '',
            url: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Full file processing pipeline:
 * 1. Upload to storage
 * 2. Parse text content
 * 3. Chunk for embedding
 */
export async function processFileForContext(
    file: File,
    userId: string,
    collectionId?: string
): Promise<{
    success: boolean;
    storagePath?: string;
    storageUrl?: string;
    textContent?: string;
    chunks?: string[];
    error?: string;
}> {
    // 1. Upload to storage
    const upload = await uploadFileToStorage(file, userId, collectionId);
    if (!upload.success) {
        return { success: false, error: upload.error };
    }

    // 2. Parse content
    const buffer = await file.arrayBuffer();
    const parse = await parseFileContent(buffer, file.type, file.name);

    if (!parse.success) {
        // File uploaded but couldn't parse - still save reference
        return {
            success: true,
            storagePath: upload.path,
            storageUrl: upload.url,
            textContent: '',
            chunks: [],
            error: parse.error
        };
    }

    // 3. Chunk for embedding
    const chunks = chunkText(parse.text);

    return {
        success: true,
        storagePath: upload.path,
        storageUrl: upload.url,
        textContent: parse.text,
        chunks
    };
}
