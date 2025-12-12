# AI_Panel_Context

Can you please now be sure that the AI panel is engineered such that it always draws from whatever Context Cards (and their associated context) are included in that collection. 

Remember, this would include any of our Collection-Capable Context Cards, including:

- Courses (with all its lessons)
- Modules (with all its lessons)
- Lessons
- Course Resources
- Custom Context (text)
- Custom Context (file)
- Conversation

Of these, for Custom Context Files and Course Resources, this would include the idea that when a user adds one of these to a Custom Collection, it is included in the RAG for that collection.

I mention, because for each of these, the document or file will need to be parsed and available as context in the RAG, but modularized such that if a user adds it to a collection, that context is additionally available to the collection so that the Collection Assistant can access ALL context within it. 

As a reminder, and for you reference (please make note of this for the future), on any Collection the user is on, if the AI panel is available, it should always be specific to the context of whatever is currently included for the Collection. 

AI panels exist on the following pages, and we need to be sure they are effectively drawing from a RAG for each dedicated collection.

The way I’m thinking about it is like this. I don’t know if this is the best way, but please consider it and ensure the architecture you choose will accommodate the functionality accordingly. 

As I see it, Object Oriented Context Engineering entails the following Categories and Architecture.

## **Context Objects**

These are visualized as Context Cards that represent the actual fundamental component of context, which needs to be portable (meaning a user can add it to a any of their custom collections). 

Each Context Object  include meta-data specific to the object, which explain key aspects (like title, date, or what course a lesson or Course Resource belongs to or is associated with) as well as the data of the Context Object (in the Vector data store). Context Objects include the following:

- Lessons
- Course Resources
- Custom Context (text)
- Custom Context (file)
- Conversation
- Profile Details (entered in the Personal Context page)

## Context Containers

These show up as Context Cards that can “contain” Context Objects. These have meta data, which the AI can use and access as additional context, but don’t have actual data, rather they contain Context Objects as their Context Data. These include the following:

- Courses (which contain modules and lessons)
- Modules (which contain lessons)

## Context Collections

Independent from these are Context Collections, which are “views” that CAN contain both Context Objects and Context Containers, and are either provided or can be custom created by the user.

### Dedicated Context Collections

These are collections that ONLY contain one context category, and include the following:

- Academy - A collection of courses. These only contain courses.
- Conversations - A collection of all AI conversations with all AI agents across the platform. These only contain conversations.

### Default User Context Collections

These are collections that are modifiable by the user, and are provided by default. These can contain both Context Containers and Context Objects. They include the following:

- Favorites - A users collection of favorite content across the platform.
- Workspace - An active sandbox for the user to save information to, such as when working on a project, or studying a topic.
- Watchlist - This is where the user stores their “what’s next” list of content they want to learn next.

### Custom User Context Collections

These are also collections that are modifiable by the user, but are created and customized by the use. The user can have as many of these as they want. They function in the same way as Default User Context Collections. They’re where a user can save a collection of any kind of context, for instance for long-running projects, or objectives, or learning initiatives.

### User Collections

This is a special collection type. It allows Organizational Administrators to view and add employees to the platform. Employees show up as Profile Cards in the Collection and an Org Admin can click on an employee to view and edit details.

The context of these cards is the profile data for the user. We don’t use this in the platform right now, but the idea is that we will be adding to the platform psychometric assessments, like engagement assessments, personality assessments, and other assessments. An employee will be able to use the information from these assessments as additional, deep profile context provided to the AI, and to get highly tailored responses, academy recommendations, and AI tutoring.

In the near future, we’ll be adding the ability for an organization to be able to create “Collections” of employees, independent from the “All Employees” collection. By creating a custom Employee Collection (kind of like a group), the Org Admin can talk to the AI about the profiles (and personalities and learning habits) of the employees in that collection.

### UI Collections

These are “treated” like collections visually, but contain specific, dedicated Context types. It just allows us to be able to create a consistent and familiar “card” and “collection” style interface that we use throughout the platform. These include the following:

- Experts - The list of Experts (we formerly called them authors). Users can click on this “Collection” to see who see the Expert Cards, browsing who is creating content to the platform, and can click on a card to see the experts profile page.
- Certifications - This is a page where we simply show all of the earned certifications to a user, again shown as cards. Clicking on a card takes them to the details for that certification, where they can download and access the certification information they need.

## Architecture

We need to be sure the architecture of the platform adequately accounts for all of this, and is done in a way that whatever page or collection you’re on, the AI panel loads the correct AI Agent, and that it is fed with the correct Context in the form of a RAG.

As I see it, each Context Object that is added, is added in a way that it can be inserted into any RAG across the platform.

When any Context Object or Context Container is added to a Context Collection, the appropriate data (meta data and context data) is added to the RAG for that collection, so that the Collection Assistant can access it.

### IMPORTANT NOTE:

The RAG for the Platform Assistant contains all Context provided by the platform, as well as any of the Personal Context the use has created (as this is intended to be used by every agent). But it does not include Custom Context added to a specific Collection.

For instance I might create a Custom Collection for “Onboarding” because I’m working on an onboarding project. In that I might add Custom Context, both as text and as files, as well as content from throughout the platform. If I want help from the AI agent on context in that collection, I will use the Collection Assistant for that Collection. 

But the Platform Assistant, is only trained on the user’s Personal Context, and Platform Context (e.g. Courses, Modules, Lessons, Activities, Course Materials, and Experts).