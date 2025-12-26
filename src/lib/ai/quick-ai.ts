/**
 * Quick AI Response Utility
 *
 * Provides a lightweight way to get quick AI responses for internal
 * operations like insight merging decisions. Uses a fast, cost-effective
 * model for these background operations.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'EnhancedHR';

// Fast model for quick internal operations
const QUICK_MODEL = 'google/gemini-2.0-flash-001';

/**
 * Generate a quick AI response for internal operations.
 * Uses a fast model with minimal latency for background tasks.
 *
 * @param prompt - The prompt to send
 * @param maxTokens - Maximum tokens in response (default: 200)
 * @returns The AI response text
 */
export async function generateQuickAIResponse(
  prompt: string,
  maxTokens: number = 200
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[QuickAI] Missing OPENROUTER_API_KEY, returning empty response');
    return '';
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
      },
      body: JSON.stringify({
        model: QUICK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3, // Lower temperature for more consistent responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[QuickAI] API error:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return content.trim();

  } catch (error) {
    console.error('[QuickAI] Error generating response:', error);
    return '';
  }
}

/**
 * Generate follow-up suggestions based on user insights and conversation context.
 *
 * @param currentQuery - The user's current question
 * @param aiResponse - The AI's response (truncated for prompt)
 * @param insightSummary - Summary of relevant user insights
 * @returns Array of follow-up prompt suggestions
 */
export async function generateFollowUpSuggestions(
  currentQuery: string,
  aiResponse: string,
  insightSummary: string
): Promise<string[]> {
  if (!insightSummary || insightSummary.trim() === '') {
    return [];
  }

  const prompt = `Based on this conversation and what we know about the user, suggest 2-3 follow-up prompts:

USER ASKED: "${currentQuery}"
AI RESPONDED: "${aiResponse.substring(0, 400)}..."

USER'S CONTEXT:
${insightSummary}

Generate follow-up prompts that:
1. Connect the current topic to their projects/goals
2. Deepen their understanding based on their role
3. Address potential challenges they might face

Format each as a natural question the user might ask.
Return as JSON array: ["question1", "question2", "question3"]
ONLY respond with the JSON array, nothing else.`;

  try {
    const response = await generateQuickAIResponse(prompt, 300);

    // Try to parse as JSON
    const cleaned = response.trim();

    // Handle cases where model includes markdown code blocks
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => typeof s === 'string' && s.length > 0).slice(0, 3);
      }
    }

    return [];
  } catch (error) {
    console.error('[QuickAI] Error generating follow-ups:', error);
    return [];
  }
}
