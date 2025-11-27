# Course_AI

## Primary Objective

To differentiate the platform by providing three distinct AI experiences: a reactive "Course Assistant" for quick answers, a proactive "Course Tutor" for deep personalized learning, and a global "Platform Assistant" for broad knowledge.

## 1. AI System Architecture

**[CONSTRAINT: STRICT LOGIC]**

- **Model:** Gemini 3 Pro (via Vertex AI or Google AI Studio).
- **Knowledge Base:** Supabase Vector (pgvector).
- **Context Scopes (Critical Security):**
    1. **Course Agents:** RAG queries must be filtered by `course_id`. The Agent *cannot* see content from other courses.
    2. **Platform Agent:** RAG queries have global access to all *published* course content.

## 2. Dynamic System Instructions (The "Brain" Settings)

**[CONSTRAINT: STRICT UI]**
We need the ability to iterate on the AI's personality without deploying code.

- **Data:** Store system prompts in a table: `ai_system_prompts` (`agent_type`, `prompt_text`, `is_active`).
- **Admin Interface:**
    - Location: Super Admin Dashboard.
    - Feature: A simple form to Edit and Save the System Instruction for:
        - `course_assistant`
        - `course_tutor`
        - `platform_assistant`
    - **Hot-Swapping:** When saved, the API immediately uses the new prompt for the next request.

## 3. The Agents

### A. The Course Assistant

- **Role:** The "Librarian" or "TA".
- **Behavior:** Reactive, concise, factual.
- **User Input:** "What does this course say about X?"
- **Data Source:** Current Course Transcripts + Uploaded Course Materials.

### B. The Course Tutor

- **Role:** The "Private Coach".
- **Behavior:** Proactive, Socratic, Educational.
- **Input Context:**
    - **Course Material:** (Same as Assistant).
    - **User Profile:** Job Title, Industry, Years of Experience.
    - **Learning Memory:** Previous interactions/preferences stored in the `user_ai_memory` table.
- **Capability:**
    - It should *ask questions* before giving answers. ("Before I explain that, how do you currently handle this situation at your company?")
    - **Write-Back:** The Agent must be able to *save* insights about the user (e.g., "User prefers examples related to healthcare") to the database.

### C. The Platform Assistant

- **Role:** The "Guidance Counselor".
- **Behavior:** Broad, synthesizing, directive.
- **Data Source:** ALL Courses.
- **Capability:**
    - **Cross-Pollination:** "You asked about Leadership. We have a great course by [Author Name] on that. Here is a specific clip..."
    - **Deep Linking:** Responses should include links to specific Courses or Modules.

## 4. Author Attribution (Data Architecture)

**[CONSTRAINT: STRICT DATA]**
We are **not** paying authors for AI usage in MVP, but we **must log the data** to enable it later.

- **Event:** When the RAG system retrieves "chunks" of text to answer a user prompt.
- **Logging:** Create a record in `ai_attribution_logs`:
    - `author_id`: The author of the retrieved chunk.
    - `course_id`: The source course.
    - `timestamp`: Time of query.
    - `relevance_score`: (Optional) How useful the chunk was.