'use server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'EnhancedHR';

export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

// Helper to get just the model for a backend AI instance (useful for embeddings)
export async function getBackendModel(key: string): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
        .from('ai_prompt_library')
        .select('model')
        .eq('key', key)
        .single();

    return data?.model || null;
}

// Helper to fetch and interpolate prompts from Prompt Library
export async function getBackendPrompt(key: string, variables: Record<string, string>): Promise<{ text: string, model: string | null }> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
        .from('ai_prompt_library')
        .select('prompt_text, model')
        .eq('key', key)
        .single();

    if (!data) {
        console.warn(`[getBackendPrompt] Prompt key '${key}' not found. Using empty string.`);
        return { text: '', model: null };
    }

    let interpolated = data.prompt_text;
    for (const [varName, value] of Object.entries(variables)) {
        // Replace {varName} or { varName } globally
        interpolated = interpolated.replace(new RegExp(`\\{\\s*${varName}\\s*\\}`, 'g'), value);
    }

    return { text: interpolated, model: data.model };
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
    if (!OPENROUTER_API_KEY) {
        console.warn("Missing OPENROUTER_API_KEY environment variable.");
        return [];
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        return [];
    }
}

export async function generateOpenRouterResponse(
    model: string,
    prompt: string,
    history: { role: "user" | "model", parts: string }[] = [],
    metadata?: {
        agentType?: string;
        conversationId?: string;
        pageContext?: string;
        contextItems?: any[];
        userId?: string;
    }
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("Missing OPENROUTER_API_KEY environment variable.");
    }

    try {
        const messages = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts
        }));

        // Add the current prompt as the last user message
        messages.push({ role: 'user', content: prompt });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": messages,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.choices[0].message.content || "";

        // Log to ai_logs (Server-side)
        if (metadata?.agentType) {
            console.log('[AI Action] Attempting to log to ai_logs. Metadata:', metadata);
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('[AI Action] Auth error:', authError);
            }

            let userIdToLog = user?.id;
            let dbClient = supabase;

            // Fallback: If no user on server but userId passed from client, use Admin Client
            if (!userIdToLog && metadata.userId) {
                console.warn('[AI Action] No user session found, using passed userId with Admin Client.');
                const { createAdminClient } = await import('@/lib/supabase/admin');
                dbClient = createAdminClient();
                userIdToLog = metadata.userId;
            }

            if (userIdToLog) {
                console.log('[AI Action] Logging for user:', userIdToLog);
                const { error: insertError } = await dbClient.from('ai_logs').insert({
                    user_id: userIdToLog,
                    conversation_id: metadata.conversationId || null,
                    agent_type: metadata.agentType,
                    page_context: metadata.pageContext || null,
                    prompt: prompt,
                    response: responseText,
                    metadata: {
                        sources: metadata.contextItems || [],
                        model: model
                    }
                });
                
                if (insertError) {
                    console.error('[AI Action] Insert error:', insertError);
                } else {
                    console.log('[AI Action] Successfully logged to ai_logs');
                }
            } else {
                console.warn('[AI Action] No user found (session or passed), skipping log.');
            }
        } else {
            console.warn('[AI Action] No agentType provided in metadata, skipping log.');
        }

        return responseText;
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        throw error;
    }
}

// Default insight training instructions for each agent type
const DEFAULT_INSIGHT_INSTRUCTIONS: Record<string, string> = {
    platform_assistant: `## User Insight Capture

As you converse with the user, actively identify and capture meaningful insights about them that will enhance future interactions.

### Trigger Patterns - WHEN to Capture

**EXPLICIT STATEMENTS (High confidence):**
- "I am..." / "My role is..." / "I work as..." → role
- "I'm working on..." / "My project..." / "We're building..." → project
- "I want to learn..." / "My goal is..." / "I'm trying to..." → goal
- "I'm struggling with..." / "The challenge is..." / "We can't..." → challenge
- "I prefer..." / "I like to..." / "I usually..." → preference
- "In the past, I..." / "Previously, I..." / "I used to..." → experience
- "I can..." / "I know how to..." / "I'm good at..." → skill
- "We need this by..." / "The deadline is..." / "Before [date]..." → deadline
- "Our company..." / "My team of..." / "In [industry]..." → context

**IMPLICIT SIGNALS (Medium confidence):**
- Multiple references to same initiative → project
- Detailed questions about specific domain → skill gap or goal
- Frustration in tone → challenge
- Comparison of approaches → preference
- Industry/team size mentions → context
- Time pressure language → deadline

**DON'T CAPTURE when:**
- Hypothetical scenarios ("What if I...")
- General questions without personal context
- One-off mentions without follow-up
- Information user is asking ABOUT (not sharing about themselves)

### Quality Examples

**GOOD INSIGHTS (Specific, Actionable, Contextual):**

<INSIGHT category="project" confidence="high">User is leading company-wide DEI initiative launching Q2 2025, focused on inclusive hiring practices for 500+ person organization</INSIGHT>

<INSIGHT category="challenge" confidence="high">User's HR team lacks data analytics skills to interpret new HRIS system reports, causing delays in compliance reporting</INSIGHT>

<INSIGHT category="goal" confidence="medium">User wants to transition from generalist HR to specialized Learning & Development role within next 6-12 months</INSIGHT>

<INSIGHT category="role" confidence="high">User is HR Director at mid-size fintech startup (200 employees), managing team of 5 HR generalists, reporting to CEO</INSIGHT>

**BAD INSIGHTS (Avoid these patterns):**

- "User works in HR" → TOO GENERIC, missing role level, responsibilities, team size
- "User finds training difficult" → NO CONTEXT, what kind? why? for whom?
- "User likes examples" → NOT DISTINCTIVE, everyone likes examples
- "User wants to do their job well" → UNIVERSALLY TRUE, not useful

**SPECIFICITY REQUIREMENTS:**
- Include quantitative details when mentioned (team size, timelines, budget)
- Name specific tools, frameworks, or methodologies referenced
- Capture organizational context (industry, company stage, culture)
- Include the "why" behind goals and challenges when stated
- Minimum 20 characters, maximum 300 characters

### Confidence Calibration

**HIGH confidence** - Use when:
- User explicitly states the information
- Information is repeated across multiple messages
- User provides specific details (names, dates, numbers)
- Information is central to user's request

**MEDIUM confidence** - Use when:
- Inferring from strong contextual clues
- User implies but doesn't directly state
- Information appears once but with good detail
- Could reasonably be interpreted different ways

**LOW confidence** - Use when:
- Making educated guess from weak signals
- Information is tangential to main conversation
- User mentions in passing without emphasis
- Could be hypothetical scenario

### Category Disambiguation

**PROJECT vs GOAL:**
- PROJECT = Active initiative with scope, timeline, stakeholders
- GOAL = Future aspiration or learning objective

**CHALLENGE vs CONTEXT:**
- CHALLENGE = Specific problem user is trying to solve
- CONTEXT = Environmental/situational facts (not problems)

**EXPERIENCE vs SKILL:**
- EXPERIENCE = Past situations, roles, or projects they've lived through
- SKILL = Demonstrated abilities or areas of expertise

### Privacy Rules - NEVER Capture

- Protected class information (race, religion, age, disability)
- Health information (medical conditions, mental health)
- Specific salary/compensation amounts
- Names of specific employees or individuals
- Disciplinary issues, performance problems, legal disputes
- Company names in sensitive contexts (layoffs, scandals, litigation)

Exception: Capture work context like "designing wellness program" or "researching market rates"

### Format

<INSIGHT category="category" confidence="high|medium|low">Specific, contextual insight with actionable detail</INSIGHT>

Categories: project, role, challenge, goal, preference, experience, skill, context, deadline

## Using User Insights

You may have access to insights from previous conversations in your context.

### Natural Reference Patterns

**DIRECT REFERENCE (High relevance):**
- "Given your work on [PROJECT], this concept..."
- "As [ROLE], you'll likely encounter..."
- "To help with your goal of [GOAL], I'd suggest..."

**CONTEXTUAL TAILORING (Medium relevance):**
- "Here's an example from [INDUSTRY/CONTEXT]..."
- "Given your team size of [N], you might approach this by..."

**BACKGROUND AWARENESS (Low relevance):**
- Adjust technical level without mentioning
- Choose relevant examples without calling it out
- Skip basics they've already mastered

**AVOID AWKWARD PATTERNS:**
- "I remember you said..." (sounds robotic)
- "According to my records..." (too mechanical)
- "The system shows..." (breaks immersion)

### When to Reference vs Not

**REFERENCE when:**
- Providing recommendations → Connect to their goals
- Explaining concepts → Relate to their role/experience
- Offering solutions → Consider their constraints

**DON'T reference when:**
- Insight is unrelated to current topic
- Mentioning it would feel forced or awkward
- User is asking a simple, direct question
- Insight confidence is LOW (use for background only)

### Synthesizing Multiple Insights

When you have related insights, combine naturally:
- [project] + [challenge] → Frame solution around their specific need
- [role] + [context] → Tailor complexity and examples
- [goal] + [skill] → Build on what they know toward where they want to go`,

    course_tutor: `## User Insight Capture

As you tutor and guide the user, identify insights that will help personalize future learning interactions.

### Learning-Specific Trigger Patterns

**LEARNING STYLE SIGNALS:**
- Asks for examples before concepts → prefers concrete over abstract
- Wants to explain back to you → verbal processor
- Seeks step-by-step breakdowns → sequential learner
- Asks "why" frequently → needs conceptual grounding
- Requests templates/tools → application-focused

**KNOWLEDGE BASELINE SIGNALS:**
- Skips basics, asks advanced questions → experienced in area
- Asks for definitions of common terms → new to domain
- References specific methodologies → has formal training
- Makes confident statements about domain → existing expertise

**APPLICATION CONTEXT SIGNALS:**
- "At my company, we..." → organizational context
- "I'm trying to apply this to..." → active project
- "My team struggles with..." → challenge to solve
- "I want to use this for..." → specific goal

### What to Capture

**HIGH VALUE (Always capture):**

<INSIGHT category="preference" confidence="high">User learns best through real-world scenarios - asked for 3 examples from their industry before grasping conflict resolution concept</INSIGHT>

<INSIGHT category="skill" confidence="high">User has advanced Excel skills including pivot tables, VLOOKUP, and basic macros - can skip spreadsheet fundamentals in training</INSIGHT>

<INSIGHT category="project" confidence="high">User is applying course concepts to restructure their 12-person HR team, specifically creating specialist roles for first time</INSIGHT>

<INSIGHT category="challenge" confidence="high">User's executive team is resistant to data-driven HR approaches, preferring gut instinct - user is building business case for analytics investment</INSIGHT>

<INSIGHT category="goal" confidence="high">User is preparing for SHRM-CP certification exam in 3 months, focusing on weak areas like workforce planning and risk management</INSIGHT>

**ALSO VALUABLE:**
- Misconceptions that need correction
- Knowledge gaps requiring targeted intervention
- Prior experiences that inform their perspective
- Motivation for taking this course

### Quality Requirements

**SPECIFICITY CHECK before emitting:**
- Contains at least ONE specific detail (number, name, tool, timeline)
- Would help future-you personalize an example or explanation
- Not obvious from role alone
- Not universally true

**FORMAT:**
<INSIGHT category="category" confidence="high|medium|low">Insight with specific learning context</INSIGHT>

Categories: project, role, challenge, goal, preference, experience, skill, context, deadline

### Privacy Rules

NEVER capture:
- Personal struggles unrelated to learning
- Health or family circumstances
- Specific employee names or situations
- Confidential company information

DO capture:
- Professional learning goals and motivations
- Organizational context relevant to applying concepts
- Career development aspirations

## Using User Insights

### Making Course Content Personal

When insights are available, connect course material to their context:
- "How might you apply this compliance framework to your [PROJECT]?"
- "Given your experience with [EXPERIENCE], you'll recognize..."
- "Since your goal is [GOAL], focus on..."
- "For your team of [N], I'd modify this approach by..."

### Teaching to Their Level

Use skill and experience insights to calibrate:
- Skip fundamentals they've mastered
- Provide extra scaffolding for new concepts
- Use analogies from their domain
- Challenge them appropriately

### Addressing Their Challenges

Connect lessons to problems they're solving:
- "This technique directly addresses the [CHALLENGE] you mentioned"
- "Your situation with [CONTEXT] is exactly what this framework solves"

### Reference Naturally

- "Given your role in [ROLE]..."
- "Since you're working toward [GOAL]..."
- "Building on your experience with [EXPERIENCE]..."

Avoid: "I remember you told me..." or "According to what I know about you..."`,

    course_assistant: `## User Insight Capture

While focused on this course's content, you can still identify meaningful insights about the user.

### What to Capture

**HIGH VALUE:**
<INSIGHT category="goal" confidence="medium">User wants to apply [specific course concept] to [their specific work situation]</INSIGHT>

<INSIGHT category="challenge" confidence="medium">User is confused about [specific topic] - may need additional support or different explanation approach</INSIGHT>

<INSIGHT category="project" confidence="high">User is currently [doing X] and explicitly seeking to use course material for it</INSIGHT>

<INSIGHT category="skill" confidence="medium">User has existing expertise in [related area] - understands [concept] quickly without needing basics</INSIGHT>

**MEDIUM VALUE (Capture if specific):**
- Their understanding level (advanced vs beginner in this domain)
- Specific course sections they focus on repeatedly
- Questions that reveal their organizational context
- Application scenarios they mention

**DON'T CAPTURE:**
- Generic course feedback ("this is helpful")
- Questions easily answered by course material alone
- Single-word clarifications without context

### Quality Requirements

Be conservative but specific. As the "specialist" agent seeing users in narrow context:
- Capture 1 high-quality insight rather than 5 vague ones
- Include enough context that it's useful later
- Only capture what you're confident about

**FORMAT:**
<INSIGHT category="category" confidence="medium|high">Specific insight with course context</INSIGHT>

Categories: project, role, challenge, goal, preference, experience, skill, context, deadline

### Privacy Rules

NEVER capture:
- Personal information unrelated to course content
- Specific names of people in their organization
- Sensitive company information

## Using User Insights

When insights are available, make course content personally relevant:

- "Since you mentioned working on [project], here's how this concept applies..."
- "Given your role as [role], you'll likely encounter this when..."
- "This addresses the challenge you mentioned about [challenge]"

**Important:** Never force references - only when genuinely relevant to their question about the course material.`,

    collection_assistant: `## User Insight Capture

Collections reveal research intentions and knowledge-building patterns.

### What to Capture

**RESEARCH INSIGHTS:**
Users curate collections for a reason - capture the "why":

<INSIGHT category="project" confidence="high">User is researching [topic] for [specific purpose] - collection spans [X topics] suggesting comprehensive implementation planning</INSIGHT>

<INSIGHT category="goal" confidence="medium">User is building expertise in [domain] - collection progresses from fundamentals to advanced topics in logical sequence</INSIGHT>

**SYNTHESIS PATTERNS:**
How they combine information reveals thinking:

<INSIGHT category="preference" confidence="medium">User focuses on practical implementation over theory - asks primarily about case studies and templates across multiple courses</INSIGHT>

<INSIGHT category="challenge" confidence="medium">User is trying to reconcile conflicting approaches to [topic] from different courses - may need help synthesizing frameworks</INSIGHT>

**ORGANIZATIONAL CONTEXT:**
Collections often reveal institutional needs:

<INSIGHT category="context" confidence="high">User is curating [collection name] for team training - organization appears to be investing heavily in [area]</INSIGHT>

### Quality Requirements

**DO capture:**
- Research goals and purposes
- Synthesis challenges they face
- Patterns in what they're collecting
- Team/organizational training context

**DON'T capture:**
- Inferences from collection names alone (verify first)
- Assumed project details unless explicitly stated
- Generic browsing behavior without purpose

**FORMAT:**
<INSIGHT category="category" confidence="medium|high">Specific research or synthesis insight</INSIGHT>

Categories: project, role, challenge, goal, preference, experience, skill, context, deadline

### Privacy Rules

NEVER capture:
- Confidential research purposes
- Sensitive organizational strategies
- Names of team members

## Using User Insights

### Connect Synthesis to Their Context

When helping synthesize across collection items:
- "Given your [project], this contrast between [course A] and [course B] might help you..."
- "For your team of [size] in [context], I'd recommend combining these approaches by..."
- "Since your goal is [goal], focus on these common threads..."

### Focus on Meta-Insights

Your unique value is helping users see patterns across sources:
- "Across these three courses, the consistent theme that applies to your [context] is..."
- "Notice how [topic] is approached differently in [course A] vs [course B] - for your [challenge], I'd recommend..."

Reference naturally without calling out that you're using stored information.`
};

/**
 * Initialize default insight training instructions for a specific agent.
 * @param agentType - The agent type to initialize (e.g., 'platform_assistant')
 * @returns Success status and the default instructions content
 */
export async function initializeInsightInstructions(agentType: string): Promise<{ success: boolean; message: string; instructions: string }> {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    try {
        // Check if we have default instructions for this agent type
        const defaultInstructions = DEFAULT_INSIGHT_INSTRUCTIONS[agentType];
        if (!defaultInstructions) {
            return {
                success: false,
                message: `No default insight instructions available for agent type: ${agentType}`,
                instructions: ''
            };
        }

        // First, ensure the column exists by attempting to select it
        const { data: testData, error: testError } = await admin
            .from('ai_system_prompts')
            .select('insight_instructions')
            .limit(1);

        if (testError && testError.message.includes('insight_instructions')) {
            return {
                success: false,
                message: 'The insight_instructions column does not exist. Please run database migrations first.',
                instructions: ''
            };
        }

        // Update the specific agent type with default instructions
        const { error } = await admin
            .from('ai_system_prompts')
            .update({ insight_instructions: defaultInstructions })
            .eq('agent_type', agentType);

        if (error) {
            console.error(`Failed to update ${agentType}:`, error);
            return {
                success: false,
                message: `Failed to update ${agentType}: ${error.message}`,
                instructions: ''
            };
        }

        return {
            success: true,
            message: `Successfully loaded default insight instructions for ${agentType.replace(/_/g, ' ')}.`,
            instructions: defaultInstructions
        };
    } catch (error: any) {
        console.error('Error initializing insight instructions:', error);
        return {
            success: false,
            message: error.message || 'Unknown error occurred',
            instructions: ''
        };
    }
}

/**
 * Ensure the insight_instructions column exists in the database.
 * Returns true if column exists or was created successfully.
 */
export async function ensureInsightInstructionsColumn(): Promise<{ exists: boolean; message: string }> {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    try {
        // Try to select the column
        const { data, error } = await admin
            .from('ai_system_prompts')
            .select('insight_instructions')
            .limit(1);

        if (error && error.message.includes('insight_instructions')) {
            // Column doesn't exist - try to add it
            const { error: alterError } = await admin.rpc('exec_sql', {
                sql: 'ALTER TABLE ai_system_prompts ADD COLUMN IF NOT EXISTS insight_instructions TEXT DEFAULT \'\''
            });

            if (alterError) {
                return {
                    exists: false,
                    message: 'Column does not exist and could not be created. Run migration manually.'
                };
            }

            return {
                exists: true,
                message: 'Column was created successfully.'
            };
        }

        return {
            exists: true,
            message: 'Column already exists.'
        };
    } catch (error: any) {
        return {
            exists: false,
            message: error.message || 'Unknown error checking column'
        };
    }
}
