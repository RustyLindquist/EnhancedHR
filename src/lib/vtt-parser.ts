/**
 * VTT Parser - Converts WebVTT captions to plain text transcript
 */

/**
 * Parse WebVTT content to plain text transcript
 * Removes timing information, cue identifiers, and formatting
 */
export function parseVTTToTranscript(vttContent: string): string {
    if (!vttContent || typeof vttContent !== 'string') {
        return '';
    }

    const lines = vttContent.split('\n');
    const textLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Skip WEBVTT header and any metadata lines
        if (line.startsWith('WEBVTT')) continue;
        if (line.startsWith('NOTE')) continue;
        if (line.startsWith('STYLE')) continue;
        if (line.startsWith('REGION')) continue;

        // Skip timing lines (00:00:00.000 --> 00:00:00.000)
        if (line.includes('-->')) continue;

        // Skip cue identifiers (numeric or alphanumeric at start of cue)
        // These are typically just numbers like "1", "2", "3" on their own line
        if (/^\d+$/.test(line)) continue;
        if (/^[a-zA-Z0-9_-]+$/.test(line) && line.length < 20) continue;

        // Skip any remaining metadata (lines starting with special chars)
        if (line.startsWith('::')) continue;

        // This is actual caption text - clean it
        const cleanedLine = cleanCaptionLine(line);
        if (cleanedLine) {
            textLines.push(cleanedLine);
        }
    }

    // Join and deduplicate
    const rawText = textLines.join(' ');
    return deduplicateTranscript(rawText);
}

/**
 * Clean a single caption line
 * Removes VTT formatting tags and normalizes whitespace
 */
function cleanCaptionLine(line: string): string {
    let cleaned = line;

    // Remove VTT voice tags: <v Speaker Name>
    cleaned = cleaned.replace(/<v[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/v>/gi, '');

    // Remove VTT class/style tags: <c.classname> or <c>
    cleaned = cleaned.replace(/<c[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/c>/gi, '');

    // Remove bold/italic tags: <b>, <i>, <u>
    cleaned = cleaned.replace(/<\/?[biu]>/gi, '');

    // Remove other HTML-like tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove VTT positioning info (appears after text)
    // e.g., "text here align:start position:10%"
    cleaned = cleaned.replace(/\s+(align|position|line|size|vertical):[^\s]+/gi, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Deduplicate overlapping caption phrases
 * Auto-generated captions often have repeated phrases at segment boundaries
 */
function deduplicateTranscript(text: string): string {
    // Split into sentences for better deduplication
    const sentences = text.split(/(?<=[.!?])\s+/);
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const sentence of sentences) {
        const normalized = sentence.toLowerCase().trim();
        if (!seen.has(normalized) && sentence.trim()) {
            seen.add(normalized);
            unique.push(sentence.trim());
        }
    }

    // Also handle word-level repetition at boundaries
    let result = unique.join(' ');

    // Remove obvious duplicates like "word word word" -> "word"
    result = result.replace(/\b(\w+)(\s+\1){2,}\b/gi, '$1');

    // Clean up any double spaces
    result = result.replace(/\s+/g, ' ').trim();

    return result;
}

/**
 * Format transcript with paragraph breaks for readability
 * Adds line breaks after sentences to improve readability
 */
export function formatTranscriptWithParagraphs(transcript: string, sentencesPerParagraph: number = 3): string {
    const sentences = transcript.split(/(?<=[.!?])\s+/);
    const paragraphs: string[] = [];

    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
        const paragraph = sentences.slice(i, i + sentencesPerParagraph).join(' ');
        if (paragraph.trim()) {
            paragraphs.push(paragraph.trim());
        }
    }

    return paragraphs.join('\n\n');
}

/**
 * Extract speaker labels from VTT if present
 * Returns map of speaker names to their segments
 */
export function extractSpeakers(vttContent: string): Map<string, string[]> {
    const speakers = new Map<string, string[]>();
    const voicePattern = /<v\s+([^>]+)>/gi;

    let match;
    while ((match = voicePattern.exec(vttContent)) !== null) {
        const speakerName = match[1].trim();
        // Get the text following this voice tag
        const startIndex = match.index + match[0].length;
        const endIndex = vttContent.indexOf('<', startIndex);
        const text = endIndex > startIndex
            ? vttContent.substring(startIndex, endIndex).trim()
            : vttContent.substring(startIndex).split('\n')[0].trim();

        if (text) {
            if (!speakers.has(speakerName)) {
                speakers.set(speakerName, []);
            }
            speakers.get(speakerName)!.push(text);
        }
    }

    return speakers;
}
