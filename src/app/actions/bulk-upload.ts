'use server';

import { GoogleDriveService } from '@/lib/google-drive';
import { createMuxAssetFromUrl, waitForMuxAssetReady } from './mux';
import { createLesson, updateLesson, generateTranscriptFromVideo } from './course-builder';

export interface VideoFile {
    id: string;
    name: string;
    order: number;
    mimeType: string;
}

export interface BulkUploadProgress {
    videoId: string;
    videoName: string;
    status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
    step?: 'mux' | 'lesson' | 'transcript' | 'duration';
    error?: string;
    muxPlaybackId?: string;
    lessonId?: string;
}

/**
 * Extract clean lesson title from video filename
 */
function extractLessonTitle(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.[^/.]+$/, '');
    // Remove leading numbers and separators (e.g., "01_", "02-", "1. ")
    title = title.replace(/^\d+[._\-\s]+/, '');
    // Replace underscores with spaces
    title = title.replace(/_/g, ' ');
    return title.trim() || filename;
}

/**
 * Extract order number from filename
 */
function extractOrder(filename: string): number {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
}

/**
 * Format duration from seconds to "Xm Ys" format
 */
function formatDuration(seconds: number | undefined): string {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
}

/**
 * Scan a Google Drive folder for video files
 */
export async function scanDriveFolderForVideos(
    driveUrl: string
): Promise<{ success: boolean; videos?: VideoFile[]; error?: string }> {
    try {
        const driveService = new GoogleDriveService();

        // Extract folder ID from URL
        const folderId = GoogleDriveService.extractFolderId(driveUrl);
        if (!folderId) {
            return { success: false, error: 'Invalid Google Drive URL' };
        }

        // List files in the folder
        const files = await driveService.listFiles(folderId);

        // Filter for video files only
        const videoFiles = files.filter(file =>
            file.mimeType.startsWith('video/')
        );

        if (videoFiles.length === 0) {
            return { success: false, error: 'No video files found in the folder' };
        }

        // Map to VideoFile interface and sort by filename order
        const videos: VideoFile[] = videoFiles
            .map(file => ({
                id: file.id,
                name: file.name,
                order: extractOrder(file.name),
                mimeType: file.mimeType,
            }))
            .sort((a, b) => a.order - b.order);

        return { success: true, videos };
    } catch (error) {
        console.error('Error scanning Drive folder:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to access Google Drive folder'
        };
    }
}

/**
 * Process a single video: upload to Mux, create lesson, generate transcript
 */
export async function processBulkVideo(
    courseId: number,
    moduleId: string,
    video: VideoFile
): Promise<BulkUploadProgress> {
    const baseProgress: BulkUploadProgress = {
        videoId: video.id,
        videoName: video.name,
        status: 'uploading',
        step: 'mux',
    };

    try {
        // Step 1: Upload to Mux via Google Drive download URL
        const downloadUrl = `https://drive.google.com/uc?id=${video.id}&export=download`;

        const asset = await createMuxAssetFromUrl(downloadUrl, JSON.stringify({
            courseId,
            moduleId,
            videoName: video.name,
        }));

        if (!asset.id) {
            return {
                ...baseProgress,
                status: 'error',
                error: 'Failed to create Mux asset',
            };
        }

        // Step 2: Wait for Mux asset to be ready
        const muxResult = await waitForMuxAssetReady(asset.id);

        if (!muxResult.ready || !muxResult.playbackId) {
            return {
                ...baseProgress,
                status: 'error',
                error: 'Mux asset processing failed or timed out',
            };
        }

        // Step 3: Create lesson
        baseProgress.step = 'lesson';
        baseProgress.muxPlaybackId = muxResult.playbackId;

        const lessonTitle = extractLessonTitle(video.name);
        const lessonResult = await createLesson(moduleId, {
            title: lessonTitle,
            type: 'video',
        });

        if (!lessonResult.success || !lessonResult.lesson?.id) {
            return {
                ...baseProgress,
                status: 'error',
                error: lessonResult.error || 'Failed to create lesson',
            };
        }

        const lessonId = lessonResult.lesson.id;
        baseProgress.lessonId = lessonId;

        // Step 4: Update lesson with video URL and duration
        baseProgress.step = 'duration';
        const durationStr = formatDuration(muxResult.duration);

        await updateLesson(lessonId, {
            video_url: muxResult.playbackId,
            duration: durationStr,
        });

        // Step 5: Generate transcript
        baseProgress.step = 'transcript';
        const transcriptResult = await generateTranscriptFromVideo(muxResult.playbackId);

        if (transcriptResult.success && transcriptResult.transcript) {
            await updateLesson(lessonId, {
                content: transcriptResult.transcript,
            });
        }
        // Note: If transcript fails, we continue - lesson is still created with video

        return {
            ...baseProgress,
            status: 'complete',
            step: undefined,
        };

    } catch (error) {
        console.error('Error processing video:', video.name, error);
        return {
            ...baseProgress,
            status: 'error',
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
