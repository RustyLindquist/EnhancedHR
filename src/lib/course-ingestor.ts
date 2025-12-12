import { DriveFile, GoogleDriveService } from './google-drive';

export interface IngestItem {
    id: string; // Drive ID
    name: string; // Filename
    mimeType: string;
    parents?: string[];
    downloadLink?: string;
    webViewLink?: string; // View link
    webContentLink?: string; // Direct download link
}

export interface DetectedLesson {
    order: number;
    title: string;
    videoFile?: IngestItem;
    scriptFile?: IngestItem;
    issues: string[];
}

export interface DetectedModule {
    order: number;
    title: string;
    folderId: string;
    lessons: DetectedLesson[];
}

export interface IngestionPreview {
    courseTitle: string;
    modules: DetectedModule[];
    resourceFolderId?: string;
    featuredImage?: IngestItem;
    descriptionFile?: IngestItem;
    totalVideos: number;
    totalScripts: number;
    issues: string[];
}

export class CourseIngestor {
    private driveService: GoogleDriveService;

    constructor() {
        this.driveService = new GoogleDriveService();
    }

    /**
     * Generate a preview structure from a Drive Folder URL
     */
    async previewCourse(folderUrlOrId: string): Promise<IngestionPreview> {
        const rootId = GoogleDriveService.extractFolderId(folderUrlOrId);
        if (!rootId) throw new Error('Invalid Google Drive URL');
        
        // 1. Get all files
        const allFiles = await this.driveService.getAllFilesRecursive(rootId);
        
        // 2. Identify Root Folder Name (Course Title)
        // We need to fetch the root folder details separately because listFiles returns children
        // For MVP, we'll infer it or fetch it. Let's assume we can fetch it if needed, or rely on client to pass it? 
        // Actually, the drive service `listFiles` doesn't give root folder name. 
        // Let's stub it for now or implement `getFolder(id)` in service.
        const courseTitle = "Detected Course"; // TODO: Fetch real title

        const preview: IngestionPreview = {
            courseTitle,
            modules: [],
            totalVideos: 0,
            totalScripts: 0,
            issues: []
        };

        // 3. Process Modules (First level folders)
        const rootChildren = allFiles.filter(f => f.parents?.includes(rootId));
        
        // Identify Special Files/Folders
        const resourceFolder = rootChildren.find(f => f.name.toLowerCase().includes('resource') && f.mimeType === 'application/vnd.google-apps.folder');
        if (resourceFolder) preview.resourceFolderId = resourceFolder.id;

        const featuredImage = rootChildren.find(f => f.name.toLowerCase().includes('featured') || f.name.toLowerCase().includes('cover'));
        if (featuredImage) preview.featuredImage = featuredImage;

        const descriptionFile = rootChildren.find(f => f.name.toLowerCase().includes('description'));
        if (descriptionFile) preview.descriptionFile = descriptionFile;

        // Filter for Module Folders (Exclude resource folder)
        const moduleFolders = rootChildren.filter(f => 
            f.mimeType === 'application/vnd.google-apps.folder' && 
            f.id !== resourceFolder?.id
        );

        // Sort Modules
        moduleFolders.sort((a, b) => this.extractOrder(a.name) - this.extractOrder(b.name));

        // Process Each Module
        for (const modFolder of moduleFolders) {
            const modOrder = this.extractOrder(modFolder.name);
            const modTitle = this.cleanTitle(modFolder.name);
            
            const detectedMod: DetectedModule = {
                order: modOrder,
                title: modTitle,
                folderId: modFolder.id,
                lessons: []
            };

            // Get Lesson Files (Children of this module)
            const lessonFiles = allFiles.filter(f => f.parents?.includes(modFolder.id));
            
            // Group by Lesson Number
            const lessonsMap = new Map<number, DetectedLesson>();

            for (const file of lessonFiles) {
                // Ignore DS_Store or non-content
                if (file.name === '.DS_Store') continue;

                const order = this.extractOrder(file.name);
                if (order === 999) {
                    // Files without number in module folder logic? 
                    // PRD says: "Matches Videos with Scripts based on matching leading integer"
                    // If no integer, maybe log issue?
                    continue; 
                }

                if (!lessonsMap.has(order)) {
                    lessonsMap.set(order, {
                        order,
                        title: this.cleanTitle(file.name), // Title often comes from file name
                        issues: []
                    });
                }

                const lesson = lessonsMap.get(order)!;
                
                // Classify File Type
                if (file.mimeType.includes('video')) {
                    lesson.videoFile = file;
                    // Use video filename as title source of truth usually
                    lesson.title = this.cleanTitle(file.name);
                } else if (file.mimeType.includes('document') || file.mimeType.includes('text')) {
                    lesson.scriptFile = file;
                }
            }

            // Convert Map to Array & Validate
            detectedMod.lessons = Array.from(lessonsMap.values()).sort((a, b) => a.order - b.order);
            
            detectedMod.lessons.forEach(l => {
                if (l.videoFile) preview.totalVideos++;
                if (l.scriptFile) preview.totalScripts++;
                
                if (!l.videoFile) l.issues.push("Missing Video File");
            });

            preview.modules.push(detectedMod);
        }

        return preview;
    }

    // --- Helpers ---

    private extractOrder(name: string): number {
        const match = name.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 999; // 999 for unordered
    }

    private cleanTitle(name: string): string {
        // Remove leading numbers, separators, and extension
        let clean = name.replace(/^\d+[._-]\s*/, '');
        clean = clean.replace(/\.[^/.]+$/, ""); // Remove extension
        return clean.trim();
    }
}
