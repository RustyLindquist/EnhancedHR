/**
 * Assessment Parser
 *
 * Parses structured assessment JSON from AI responses for the Role Disruption Forecasting tool.
 * The AI outputs assessment data in a special JSON block format that we extract and render.
 */

/**
 * Assessment data structure output by the AI
 */
export interface AssessmentData {
    disruptionScore: number;              // 1-10
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timelineImpact: string;               // e.g., "12-18 months"

    timeline: {
        current: string;
        oneToTwo: string;
        threeToFive: string;
        fivePlus: string;
    };

    taskBreakdown: {
        highlyAutomatable: Array<{ task: string; percentage: number }>;
        augmentable: Array<{ task: string; percentage: number }>;
        humanEssential: Array<{ task: string; percentage: number }>;
    };

    immediateActions: Array<{
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }>;

    strategicRecommendations: Array<{
        title: string;
        description: string;
        timeframe: string;
    }>;

    skillRecommendations: Array<{
        skill: string;
        category: 'technical' | 'soft' | 'domain';
        courses?: string[];
    }>;
}

/**
 * Result of parsing a message for assessment data
 */
export interface ParsedAssessmentResult {
    /** The assessment data if found */
    assessment: AssessmentData | null;
    /** The message content with assessment JSON block removed for display */
    cleanContent: string;
    /** Whether an assessment was found */
    hasAssessment: boolean;
}

/**
 * Pattern to match assessment JSON blocks in AI responses
 * Format: ```json:assessment\n{...}\n```
 */
const ASSESSMENT_PATTERN = /```json:assessment\n([\s\S]*?)\n```/;

/**
 * Parse a message to extract assessment data
 *
 * @param content - The message content from AI
 * @returns Parsed result with assessment data and clean content
 */
export function parseAssessmentFromMessage(content: string): ParsedAssessmentResult {
    const match = content.match(ASSESSMENT_PATTERN);

    if (!match) {
        return {
            assessment: null,
            cleanContent: content,
            hasAssessment: false
        };
    }

    let assessment: AssessmentData | null = null;

    try {
        const jsonString = match[1];
        const parsed = JSON.parse(jsonString);

        // Validate required fields
        if (
            typeof parsed.disruptionScore === 'number' &&
            typeof parsed.riskLevel === 'string' &&
            parsed.timeline &&
            parsed.taskBreakdown
        ) {
            assessment = parsed as AssessmentData;
        }
    } catch (error) {
        console.error('[AssessmentParser] Failed to parse assessment JSON:', error);
    }

    // Remove the JSON block from content for clean display
    const cleanContent = content.replace(ASSESSMENT_PATTERN, '').trim();

    return {
        assessment,
        cleanContent,
        hasAssessment: assessment !== null
    };
}

/**
 * Check if a message contains assessment data
 *
 * @param content - The message content
 * @returns True if assessment data is present
 */
export function hasAssessmentData(content: string): boolean {
    return ASSESSMENT_PATTERN.test(content);
}

/**
 * Get risk level color based on risk level
 */
export function getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
        case 'low':
            return '#22c55e'; // green-500
        case 'medium':
            return '#eab308'; // yellow-500
        case 'high':
            return '#f97316'; // orange-500
        case 'critical':
            return '#ef4444'; // red-500
        default:
            return '#78C0F0'; // brand-blue-light
    }
}

/**
 * Get risk level from score
 */
export function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    if (score <= 8) return 'high';
    return 'critical';
}

/**
 * Get priority color for action cards
 */
export function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'high':
            return '#ef4444'; // red-500
        case 'medium':
            return '#f97316'; // orange-500
        case 'low':
            return '#78C0F0'; // brand-blue-light
        default:
            return '#78C0F0';
    }
}

/**
 * Get category color for skill recommendations
 */
export function getCategoryColor(category: string): string {
    switch (category) {
        case 'technical':
            return '#3b82f6'; // blue-500
        case 'soft':
            return '#8b5cf6'; // violet-500
        case 'domain':
            return '#14b8a6'; // teal-500
        default:
            return '#78C0F0';
    }
}

/**
 * Calculate total percentage from task breakdown
 */
export function calculateTaskBreakdownTotal(taskBreakdown: AssessmentData['taskBreakdown']): {
    automatable: number;
    augmentable: number;
    humanEssential: number;
} {
    const automatable = taskBreakdown.highlyAutomatable.reduce((sum, t) => sum + t.percentage, 0);
    const augmentable = taskBreakdown.augmentable.reduce((sum, t) => sum + t.percentage, 0);
    const humanEssential = taskBreakdown.humanEssential.reduce((sum, t) => sum + t.percentage, 0);

    return { automatable, augmentable, humanEssential };
}
