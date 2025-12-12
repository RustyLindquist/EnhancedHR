import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string; // Download link
}

export class GoogleDriveService {
  private auth: JWT;
  private drive;

  constructor() {
    // Ensure standard newlines in private key if passed via env var
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!privateKey || !clientEmail) {
      throw new Error('Missing Google Service Account credentials (GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL)');
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Authenticate and checking connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.auth.authorize();
      return true;
    } catch (error) {
      console.error('Google Drive Auth Error:', error);
      return false;
    }
  }

  /**
   * Recursively list all files in a folder structure
   * Note: For MVP we might do a simple list and manual tree construction, or query by parent
   */
  async listFiles(folderId: string): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const res: any = await this.drive.files.list({
        // Query: Is child of folderId AND not trashed
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, parents, webViewLink, webContentLink)',
        pageSize: 1000,
        pageToken,
      });

      if (res.data.files) {
        // @ts-ignore
        files.push(...res.data.files);
      }
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    return files;
  }

  /**
   * Get full recursive file list (flat) for a course folder
   * We will need to reconstruct hierarchy in the Ingestor
   */
  async getAllFilesRecursive(rootFolderId: string): Promise<DriveFile[]> {
    const allFiles: DriveFile[] = [];
    
    // BFS Queue [folderId]
    const queue: string[] = [rootFolderId];
    
    // Helper to get children
    const getChildren = async (parentId: string) => {
        return this.listFiles(parentId);
    };

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = await getChildren(currentId);
        
        for (const file of children) {
            allFiles.push(file);
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                queue.push(file.id);
            }
        }
    }
    
    return allFiles;
  }

  /**
   * Extract folder ID from a URL or return the ID itself if clean
   */
  static extractFolderId(urlOrId: string): string | null {
    // Regex for: https://drive.google.com/drive/folders/1234567890abcdef
    const urlMatch = urlOrId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) return urlMatch[1];
    
    // Regex for simple ID (alphanumeric, -, _)
    // Google IDs are usually ~33 chars (or 19 for older ones)
    if (/^[a-zA-Z0-9-_]+$/.test(urlOrId)) return urlOrId;

    return null;
  }

  /**
   * Generate a signed URL or use the webContentLink
   * For Google Docs/Sheets, we need to export them.
   */
  async getExportLink(fileId: string, mimeType: string): Promise<string | null> {
      if (mimeType === 'application/vnd.google-apps.document') {
          // Export as plain text
           return `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&key=${process.env.GOOGLE_API_KEY || ''}`; // Requires API Key if hitting public endpoint, but we are authenticated service account
           // Better: Use the library's export method and stream it
      }
      return null;
  }
}
