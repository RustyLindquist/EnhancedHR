# Object Oriented Context Engineering

It’s important to note that one of our core design, architecture and engineering principles behind the platform is what we call Object-Oriented Context Engineering, drawing from the familiar principle of object-oriented programming. 

This is why the foundational container for content across the platform is the Content Card. Each Content Card (e.g. a Course Card or a Lesson Card) is simply a Context Object. 

## **Context Objects**

These are visualized as Context Cards that represent the actual fundamental component of context they represent, which needs to be portable (meaning a user can add it to a any of their custom collections, and can exist in multiple collections at once).

Each Context Object (which when added to a collection, or within the platform is represented by a Context Card) include meta-data specific to the object, which explain key aspects (like title, date, or what course a lesson or Course Resource belongs to or is associated with) as well as the data of the Context Object (in the Vector data store). 

Context Objects include the following:

- Lessons
- Course Activities (e.g. quizzes or assessments)
- Course Resources
- Custom Context (text)
- Custom Context (file)
- Profile Details (a specific card within the Personal Context Collection)
- Notes
- Conversations: There are multiple agents used by the platform, and each agent has unique features (model, system instructions, insight training, and context RAG). So while these represent a category of Context Objects, we try to treat each Agent as a specific type of Conversation, allowing us to ensure that when a user wants to resume a conversation, the platform knows these details and can restore the conversation with the right agent, location and context RAG.
- Tool Conversations: The platform has tools, which are usually tailored and structured conversations with a specific AI Agent. When the user interacts with a Tool Agent, it creates a context object… a type of conversation, but specific to that tool.

## Context Containers

These are unique in that while they will have specific and unique metadata to identify them, their main context (or content) is derived from nested, or associated, more granular Context Objects. These have meta data, which the AI can use and access as additional context, but don’t have actual data, rather they contain Context Objects as their Context Data. These include the following:

- Courses (which contain modules and lessons)
- Modules (which contain lessons)

## Context Collections

Independent from these are Context Collections, which are “views” that CAN contain both Context Objects and Context Containers, and are either provided or can be custom created by the user. These are primarily accessible as “Platform Views” accessible by the left-side Platform Navigation menu.

### Collections

Collections are a major part of our methodology for object oriented context engineering, allowing the user to save content throughout the platform into a Collection, as well as the ability to add context to a collection.

The following are the collections available on the platform. 

### Dedicated Context Collections

These are collections that ONLY contain one context category, and include the following:

- Academy - A collection of courses. These only contain courses.
- Conversations - A collection of all AI conversations with all AI agents across the platform. These only contain conversations.
- All Notes - this is a collection of ALL notes created across the platform
- Tools - This is a collection of all tools available on the platform
- Certifications - A collection of all certifications earned across the Academy

### Default User Context Collections

These are collections where the contents are modifiable by the user, and are provided by default to every user (they cannot be removed). These can contain both Context Containers and Context Objects. They include the following:

**Favorites**:

This is a simple repository where you can quickly save things you like most across the platform, allowing you a single place to access all your favorite content.

**Workspace**:

This is a simple temporary location where you can save stuff that might be relative to what you’re working on. For instance, If you’re currently working on an onboarding checklist, you could go to the Academy and search for Onboarding. Then you could find all of the courses, lessons, activities, and content related to Onboarding and move these to your workspace. Once there, you can interact with the Collection AI to help you build your onboarding checklist, drawing on all of the knowledge and context from across the platform.

**Watchlist**:

This is like you’re “what to learn next”, a simple place where you can save learning opportunities, or even AI conversations that  you want to get back to later. For instance, if you’ve started a conversation with the Course Tutor agent, but can’t continue your session right now, save it to the Watchlist to quickly come back to it later, without having to navigate to the course.

### Custom User Context Collections

These are also collections that are modifiable by the user, but are created and customized by the use. The user can have as many of these as they want. They function in the same way as Default User Context Collections, but they are created, on-demand by the user as a way to curate content or create Context Repositories where they can talk to the Collection Assistant about the content of the repository. They’re where a user can save a collection of any kind of context, for instance for long-running projects, or objectives, or learning initiatives.

## User Account Collections

This is a special collection type. It allows Organizational Administrators to view and add employees to the platform, as well as to gather insights.

Employees show up as Profile Cards in the Collection and an Org Admin can click on an employee to view and edit details of that employee, or see their usage, or even talk to the AI in the AI panel about that employee. Or if the Org Admin is in the All User’s view, they can talk to the AI about all of the users since the RAG for the AI panel always provides that agent all of the context for whatever is in that Collection.

The context of these user cards should consist of (at minimum)

- User Account Details (e.g. name, email, etc.)
- User’s My Profile Details (info and context the user saves about themselves)
- Membership information
- Company association
- Academy Usage (e.g. courses taken, course progress, credits earned, etc.)
- Platform Usage (e.g. logins, streaks, hours spent, etc.)
- Conversation Context (this is the user’s conversation history, but since only the user has access to their own full conversation history, this is sanitized such that the org admin has the ability to ask questions from the AI, like “what themes are my team most interested in?”

Note: Other than the user’s My Profile Details, any Personal Context added to the user’s Personal Context Collection is private, and only accessible to that user.

Future Use: We don’t use this in the platform right now, but the idea is that we will be adding to the platform psychometric assessments, like engagement assessments, personality assessments, satisfaction assessments, performance assessments, etc.

An employee will be able to use the information from these assessments as additional, deep profile context provided to the AI, and to get highly tailored responses, academy recommendations, and AI tutoring. And an Org Admin will be able to access this information across their teams. 

### All Users

By default, every organization has the ability to see their User Collection, which shows all users of the org, and allows filtering to make it easy to find specific types of users in larger orgs.

### Custom User Collections

An Org Admin has the ability to create custom collections of users, allowing them an ability to form collections for teams, or by role, or other category type.

By doing this, they are about to have a Collection View where they can manage categories of users, assign content to those categories, see aggregated information for those users (e.g. the engagement results for this group), see platform usage for that group, or talk to the AI about that specific group.

### Expert Collections

Like User Collection for an Org Admin, this is a collection of Experts who have authored courses in the Academy. It allows each expert to show up as a Card. Clicking on the Card will go to the Expert’s Page, where they can read more about the expert and see the courses they have created.

## Context Portability

The Context Object (the Card) can be saved and re-used across Collections. It’s a re-usable Context Object. The AI on any screen draws from the Context Objects (or Content Cards) saved to that Collection, allowing for an extremely flexible, useful, easy to understand, and easy to modify interface for providing rich and nuanced context to the current AI agent.

This advanced and innovative approach to Context Engineering is a key, strategic differentiator, and one of the ways that we intend to ensure each AI Agent is able to generate highly individualized and maximally helpful responses.

Because of this, it’s critical that we ensure the architecture and design of the platform deeply support this capability, as it is a core differentiator, and something we intend to market heavily.

Some examples of Context Cards are:

- Lesson Cards - These include the context of each lesson, drawing from the script generated when creating a Course (it is uploaded when adding and updated when editing a Course).
- Activity and Assessment Cards - These include the activity and assessment information provided for Activities and Assessments when managing a Course.
- Course Resource Cards - These are documents and files that are uploaded as supplementary material to a course.
- Course Instructors - Each Course Instructor has their own card, which shows key, high-level information and features about that instructor, and provides access to the the Instructor Page for that instructor.
- Earned Certifications - Each certification earned is a Context Card, using Categories to distinguish between the various certification types (both Certification Providers and Certification Categories). These Earned Certification Cards are what show up when a user clicks on “Certifications” from the Platform Navigation Interface, a Collection showing Cards for all earned certifications, filterable by Category using the same Category interface we use in the Academy. It’s an illustration of Context Nesting, which allows for a base-level Context Card, like a Lesson Card, to be aggregated as Context in multiple locations (Collections).
- Course Cards - A Course is simply a Collection of Context Cards assigned to that Course, which includes Lesson Cards, Activity or Assessment Cards, Course Resource Cards
- Custom Context (text) - These are cards that an individual adds, each one acting as a Custom Context Container. These are designed to be simple and short, text entry context that can be saved to (and shared among) any custom collection.
- Custom Context (file) - These are files an individual uploads to a collection, where, upon upload, that file is parsed through our parsing engine, and it’s contents added to the RAG.
- User Notes - These are notes that a user is able to take or add to a collection from across the platform.
- Conversation Cards - Each conversation the user has with AI is saved to their conversation history, and each is made available as a Context Card, so that it can be added to collections.
- AI Insights - As the user interacts with AI, the AI should be constantly looking for critical context about the user that it thinks would be advantageous and beneficial to know so that it can provide the highest quality responses. When it finds these, it saves this information to the user profile as text, and will be used as context for every AI Agent on the platform.
- Micro-Learning Cards - These are cards where we show AI-generated learning snippets created from Academy Content, and selected and written based on User Context. Each of these are presented as Cards, staying true to our interface and experience, with the user being able to save one of these AI-generated Micro-Learning cards to a collection.

Note: There are many other cards that we will have, and each represents a Context Object.

IMPORTANT:

Context Objects Can be:

- Aggregated - like with Collections
- Nested - contain other Context Objects, as is the case with a Course, which contains Modules and Lessons.
- Multi-Modal - represent different content types, e.g. text and document
- Inherited - for example an employee can inherit context cards from their organization

The platform must be fully architected to support this (e.g. backend logic, database, etc.) and how we approach RAG and Agent Context to allow for this, because the AI agent should always draw from the appropriate Context Repositories.

Let’s go into more details about how this works:

# Agents and Conversations

While the name of the AI within the platform is Prometheus, this refers to the agentic nature of the platform generally. But in reality, the platform has the several AI Agents that the user can interact with. Each of these has a dedicated and specific set of context is uses, made available through a RAG, and a dedicated system prompt.

Below is a description of each, along with their designated context and other information specific to each agent.

It’s critical that the platform works according to this, and that as we make revisions to agents and the platform, we maintain coherence to these specifications. If ever you are about to deviate from this functionality (e.g. in building a new feature or fixing a bug), ALWYAS first ask me, so that we ensure we don’t accidentally deviate from the specifications outlined below.

## Conversations

This refers to any conversation that a user has with any AI agent on the platform. The conversation refers to the entire exchange with the agent, within that conversation.

Each conversation is a unique and specific entity, and has the ability to be resumed at any time.

## Conversation Origin

One of the unique and specific attributes of a Conversation, that needs to be saved with the Conversation entity, is the Conversation Origin, or where that Conversation began. There are two potential aspects of this. 

### **Originating Agent:**

The first attribute of origin is the AI Agent to which this conversation belongs. It’s critical to keep this so that when a user wants to resume a conversation, they’re able to pick it back up with that originating Agent and its specific system prompt.

### **Originating Context:**

Some agents have an additional context attribute that designate what context was used (and should be loaded) when a conversation with that agent is resumed. An illustration of this is the Course Agent and the Course Tutor. If a user starts a conversation with either of these agents, and later wants to resume it, it’s critical that this conversation loads in it’s originating LOCATION, which should automatically ensure that the right context is loaded. So when a user resumes a conversation with a Course Tutor, the conversation would launch the corresponding course, with the conversation loaded into the appropriate agent in the AI Panel. This ensures that on resume, the agent has the right system prompt, and the right context RAG.

Another illustration of this is the Collection Assistant. The Collection Assistant has a specific system prompt, but it’s location is specific to a Collection. A user has the ability to create custom collections, and the Collection Assistant uses for it’s context RAG the context of whatever is saved in that collection.

## Conversation Card

Each conversation that the user has with an AI Agent on the platform is represented as a Conversation Card. Conversation Cards can have different styles, depending on the Conversation Origin. Whenever modifying or working with Conversations, Collection views, or Conversation Cards, it’s critical to always ensure a conversation loads and displays in the correct Conversation Card. This gives the ability for a user to have a visual distinction when viewing conversation cards within a Collection.

## Conversations Collection

We make the Conversations Collection available to the user through the left-side navigation panel as a single access point to resume ANY conversation held throughout the platform. But because each conversation is specific to its Conversation origin, with a dedicated prompt and a unique Context RAG, it’s vital that when a user clicks on a Conversation Card, it restores and resumes that conversation in the right location, loading the right agent and the right RAG.

## Admin Console > AI Agents

Each agent that the user can interact with is listed in Admin Console > AI Agents. Each has various settings that are modifiable to the platform administrator, including:

- AI Model: what model is used for that agent
- Base System Prompt: The core instructions for that agent
- Insight Training: Details for how the agent should identify user insights during a conversation

## AI Agents

One of our main differentiators is our integration of highly contextualized AI in the learning experience. To facilitate this, we have the following AI Agents

The following are the various AI Agents with which the user has the ability to actively interact, along with specific details relative to that specific Agent / Conversation

### Platform Assistant

This is the agent for the whole platform. This appears in two places. 

Access Points: 

- The main Prometheus AI page (accessible through the left-side Platform Navigation Panel).
- User Dashboard (shown at login, and when the user clicks “Dashboard” on the left-side navigation panel).
- User Dashboard AI Panel - this is the AI Panel that shows up on the user dashboard

Context & RAG:

- All PLATFORM context (e.g. courses, lessons and Course Resources)
- Personal Context - All context added in the Personal Context Collection, including:
    - Profile Details
    - Custom Notes - Notes the user adds to this collection
    - Custom Context - Custom context text added by the user
    - Custom Context Files - Files the user uploads to this collection
    - AI Insights - Insights generated by the AI, which are added either automatically, or upon approval by the user, depending on their settings accessed through the Profile Menu > Settings.
- All custom context the user has added to their Custom Collections.

On Resume: Loads within the main Prometheus AI page.

### Collection Assistant

This is the AI Agent that is loaded into the AI Panel on any Custom Collection page, and which draws on the RAG for that collection when generating responses.

Access Points: 

- Loads within the AI Panel of the associated collection.

Context and RAG:

- All Context Objects associated with that Collection
- All Personal Context (as described above)

On Resume:

- Goes to the associated collection, with the conversation loaded within the AI Panel using that AI Agents settings (system prompt, model, and insight training).

### Course Assistant

This agent is who the user talks to for general answers about the course, providing the user an interactive, conversational interface into the course contents.

Access Point:

- Loads within the AI Panel within a course, with the Course Assistant toggle active

Context and RAG

- Lesson Context: The scripts uploaded to a lesson
- Course Information, including
    - Course Description
    - Author Information
    - Module Description
    - Recertification Information
    - Skills you will learn
    - Course Categories
    - Course Time
- Course Resources
- Personal Context (as outlined earlier)

On Resume:

- Opens the course and loads the conversation in the AI Panel, with the Course Assistant toggle active.

### Course Tutor

This agent creates a personalized learning experience for the user, converting a traditional course experience “non-interactive watch-time” into a rich, interactive and engaging personal experience.

Access Point:

- Loads within the AI Panel within a course, with the Course Tutor toggle active.

Context and RAG

- Lesson Context: The scripts uploaded to a lesson
- Course Information, including
    - Course Description
    - Author Information
    - Module Description
    - Recertification Information
    - Skills you will learn
    - Course Categories
    - Course Time
- Course Resources
- Personal Context (as outlined earlier)

On Resume:

- Opens the course and loads the conversation in the AI Panel, with the Course Tutor toggle active.

Note: The Course Assistant and Course Tutor are what show up in the AI panel when you’re in a course, and are selectable through the toggle at the top of the AI Panel.

### Additional Agents

There are additional agents we have built and will build, each of which follow the same template as outlined above. For instance, a Tool Agent, like "Tool Roleplay Dojo". This agent has it's own agent settings (model, system instructions, insight, etc.), has a specific context window (the information provided within or associated with the tool).

When resuming any of the conversations with any of these dedicated agents, it should always resume within the originating location.

### Analytics Assistant

This agent provides AI-powered analytics insights to experts and organization administrators, enabling them to understand learner behavior, identify content gaps, and make data-driven decisions about course creation and improvement.

Access Points:

- Expert Dashboard > AI Analytics (`/author/analytics`)
- Org Admin Dashboard > Analytics (`/org/analytics`)

Context and RAG:

- Analytics data (token usage, request patterns, agent breakdown)
- Topic summaries extracted from conversation themes
- Recent learner questions (anonymized for platform-wide view)
- Personal Context (as outlined earlier)

**Scope Filters:**

The Analytics Assistant supports two scope modes:

1. **Personal Scope** (`scopeFilter: 'personal'`): Shows analytics only for the expert's own courses. Helps experts understand how learners are engaging with their specific content.

2. **Platform Scope** (`scopeFilter: 'platform'`): Shows aggregated, anonymized platform-wide analytics. Helps experts identify content opportunities and trending topics across the entire platform.

**Key Capabilities:**

- Identifies trending topics and learning themes
- Surfaces common learner questions and struggles
- Provides content gap analysis
- Suggests course improvement opportunities
- Analyzes agent usage patterns

On Resume:

- Analytics conversations are not resumable in the same way as other agents. Each analytics session starts fresh with current data.

**Privacy Considerations:**

- Platform-wide analytics are aggregated and anonymized
- Individual learner conversations are never exposed to experts
- Only topic patterns and question themes are surfaced

### Personal Context Collection

Note that anything saved to the Personal Context Collection for the user, is always available in the Context RAG for every single agent.

## Additional Details

Note that because each location where a user can interact with one of the agents is specific to that location, when a user traverses the platform, changing pages, navigating across collections, etc. a conversation from one location should NOT carry into another location.

For instance, if I am using the Course Tutor, and then click on the Favorites Collection, the conversation from the Course Tutor should not carry over. Instead, when the Favorites Collection loads, it will be empty, awaiting a new conversation.

## Architecture

We need to be sure the architecture of the platform adequately accounts for all of this, and is done in a way that whatever page or collection you’re on, the AI panel loads the correct AI Agent, and that it is fed with the correct Context in the form of a RAG.

As I see it, each Context Object that is added, is added in a way that it can be inserted into any RAG across the platform.

When any Context Object or Context Container is added to a Context Collection, the appropriate data (meta data and context data) is added to the RAG for that collection, so that the Collection Assistant can access it.

# AI Panel Context (RAG)

Generally speaking, and in summary, the AI panel for any page / collection should always:

- Load the right agent for that collection, including the settings for that agent (model, system instructions, insight training).
- Load the right Context, meaning all of the context saved to that collection needs to be available to that agent in a RAG specific to that collection.

### File and Document Parsing

For Custom Context Files and Course Resources, the parsing engine needs to activate, extract the content from that file, and add it to the platform in a way that this can be represented as a Custom Context Card, and that when added to a collection, it's context is therefore part of the RAG for that collection.

**Technical Architecture:**

The platform uses a Node.js-based file parsing engine for extracting text content from uploaded files. Supabase is used only for storage and embedding persistence.

**Parsing Flow:**
1. User uploads file → `createFileContextItem()` in `src/app/actions/context.ts`
2. Text extraction via `parseFileContent()` in `src/lib/file-parser.ts`:
   - PDF files: `pdf-parse` library
   - DOCX files: `mammoth` library
   - TXT/MD/CSV/JSON: Native `TextDecoder`
3. File upload to Supabase Storage bucket: `user-context-files`
4. Metadata saved to `user_context_items` table with type `FILE`
5. Text chunking via `chunkText()` (~1000 chars with 200 char overlap)
6. Embedding generation via OpenAI → stored in `unified_embeddings` table with `source_type: 'file'`

**Key Files:**
- `src/lib/file-parser.ts` - Core parsing logic, chunking, storage upload
- `src/lib/context-embeddings.ts` - Embedding generation and storage
- `src/app/actions/context.ts` - Server actions for file context CRUD
- `src/lib/ai/embedding.ts` - OpenAI embedding API calls

**Supported File Types:**
- PDF (.pdf)
- Microsoft Word (.docx)
- Plain Text (.txt)
- Markdown (.md)
- CSV (.csv)
- JSON (.json)

**Embedding Source Types** (in `unified_embeddings` table):
- `lesson` - Course lesson transcripts
- `custom_context` - User-created text context
- `file` - Parsed file content
- `conversation` - Conversation history
- `profile` - User profile details