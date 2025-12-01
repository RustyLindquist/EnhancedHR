# Object Oriented Context Engineering

It’s important to note that one of our core design, architecture and engineering principles behind the platform is what we call Object-Oriented Context Engineering, drawing from the familiar principle of object-oriented programming. This is why the foundational container for content across the platform is the Content Card. Each Content Card (e.g. a Course Card or a Lesson Card) is simply a Context Object. 

The Context Object (the Card) can be saved and re-used across Collections. It’s a re-usable Context Object. The AI on any screen draws from the Context Objects (or Content Cards) saved to that Collection, allowing for an extremely flexible, useful, easy to understand, and easy to modify interface for providing rich and nuanced context to the current AI agent.

This advanced and innovative approach to Context Engineering is a key, strategic differentiator, and one of the ways that we intend to ensure each AI Agent is able to generate highly individualized and maximally helpful responses.

Because of this, it’s critical that we ensure the architecture and design of the platform deeply support this capability, as it is a core differentiator, and something we intend to market heavily.

Some examples of Context Cards are:

- Lesson Cards - These include the context of each lesson, drawing from the script when managing a Course (it is uploaded when adding and updated when editing a Course).
- Activity and Assessment Cards - These include the activity and assessment information provided for Activities and Assessments when managing a Course.
- Course Resource Cards - These are documents and files that are uploaded as supplementary material to a course.
- Course Instructors - Each Course Instructor has their own card, which shows key, high-level information and features about that instructor, and provides access to the the Instructor Page for that instructor.
- Earned Certifications - Each certification earned is a Context Card, using Categories to distinguish between the various certification types (both Certification Providers and Certification Categories). These Earned Certification Cards are what show up when a user clicks on “Certifications” from the Platform Navigation Interface, a Collection showing Cards for all earned certifications, filterable by Category using the same Category interface we use in the Academy. It’s an illustration of Context Nesting, which allows for a base-level Context Card, like a Lesson Card, to be aggregated as Context in multiple locations (Collections).
- Course Cards - A Course is simply a Collection of Context Cards assigned to that Course, which includes Lesson Cards, Activity or Assessment Cards, Course Resource Cards
- Custom Context Cards - These are cards that an individual adds, each one acting as a Custom Context Container.
- Conversation Cards - Each conversation the user has with AI is saved to their conversation history, and each is made available as a Context Card, so that it can be added to collections.
- Conversation Extractions - As the user interacts with AI, the AI should be constantly looking for critical context about the user that it thinks would be advantageous and beneficial to know so that it can provide the highest quality responses. When it finds these, it saves this information to the user profile as text, and will be used as context for every AI Agent on the platform.
- Micro-Learning Cards - These are cards where we show AI-generated learning snippets created from Academy Content, and selected and written based on User Context. .Each of these are presented as Cards, staying true to our interface and experience, with the user being able to save one of these AI-generated Micro-Learning cards to a collection.

Note: There are many other cards that we will have, and each represents a Context Object.

IMPORTANT:

Context Objects Can be:

- Aggregated - like with Collections
- Nested - contain other Context Objects
- Multi-Modal - represent different content types, e.g. text and document
- Inherited - for example an employee can inherit context cards from their organization

We need to architect the platform (e.g. backend logic, database, etc.) and how we approach RAG and Agent Context to allow for this, because the AI agent should always draw from the appropriate Context Repositories.

Let’s go into more details about how this works:

## AI Agents

One of our main differentiators is our integration of highly contextualized AI in the learning experience. To facilitate this, we have the following AI Agents

### Course Assistant

This agent is who the user talks to for general answers about the course, providing the user an interactive, conversational interface into the course contents.

The Context for the Course Assistant needs to include:

- Course Context - All Context Cards that make up and are associated with a course.
- User Profile - Core Context about the user

### Course Tutor

This agent creates a personalized learning experience for the user, converting a traditional course experience “non-interactive watch-time” into a rich, interactive and engaging personal experience.

Context:

- Course Context
- User Profile

Note: The Course Assistant and Course Tutor are what show up in the AI panel when you’re in a course, and are selectable through the toggle at the top of the AI Panel.

### Platform Assistant

This is the agent for the whole platform. This appears in two places. The first is from the user dashboard (for each user type), and the second is when the user clicks on the main “Prometheus AI” link from the Platform Navigation Panel.

In these instances the Agent Context is:

- All Content across the platform
- User Profile

Also, in the case of the main Prometheus AI screen, since that whole Canvas is dedicated to the AI interaction, there should be no AI Panel on that screen.

### Collection Assistant

This is the AI Agent that is loaded into the AI Panel on any Custom Collection page.

Context: 

- Collection Content: Whatever Context Cards have been associated with that Collection. Note that this could be individual Context Cards (like a lesson) or it could be an aggregate (like a Course).
- User Profile

We want to be sure that each of these agents draws from a separate System Prompt, each of which is able to be edited and managed by Course Administrators.