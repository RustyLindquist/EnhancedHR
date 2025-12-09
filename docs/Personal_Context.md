# Custom_Context.md

Ok, let’s now build something new and fun and amazing.

As you know the AI component of the platform is how we differentiate. Specifically, it’s the AI’s ability to draw from substantial context to create highly personalized and relevant responses.

To facilitate this, we’re really working off of what I call “Object Oriented Context Engineering”, where we turn Context into visible components (Context Cards), which we allow them to re-use by giving the user the ability to add these to a Collection.

We’ve been working so far on Context Cards drawn from the Academy (Courses, Modules, Lessons, Course Resources, and Conversations).

But we now want to move more deeply into the Personalized Context.

We already built the ability for the AI to extract from a conversation what we call AI Insights, which it saves to the database for that user. The AI then gets that context when the user submits a prompt, along with the whatever context is relevant to the Canvas (it could be a Collection, or a Course, etc.).

But we haven’t given the user the ability to see or modify that context, which is important. The AI might recognize that they’re currently researching Onboarding as an active project, and save that to the insights. But once that project is over, the user will no longer want that information to contribute to the context of how the AI responds.

So we need to expose these additions to the user, and allow them to view, modify, and delete them. We also want to provide the user the ability to manually add personal context. To accommodate this, we want to create a new Collection called the My Profile Collection.

When a user goes to their Profile Menu, below the “My Account” button, let’s create a new link that says “Personal Context”. This will take them to this new collection, with the Collection Title that appears in the Canvas Navigation Panel “Personal Context”

There will be 4 Card Types in this Collection.

1. AI Insights

Each time the AI identifies something that it adds to the AI insights, it will add it to the database, and an AI Insights card will be created for it.

When the user clicks on this card, let’s have a panel drop down from the top, exactly the way we have when someone clicks “Search & Filter” in a course, the same exact style. 

For this page, we’ll call this the Custom Context Editor Panel.

But in this case, at the top will simply be the Conversation Title it was extracted from. Some text to say that this insight was extracted from that conversation (which allows the user to recognize where it came from).

Then a text field showing whatever insight was added. This should be editable, so that the user can modify it.

Then a save button. On save, the information is updated in the database, and to drop-down edit interface slides back up and they are returned to the Collection view. The text preview area of the card will update to reflect their changes.

1. Custom Context

This is simply a place for the user to add their own context. At the top of the Canvas, in the  Canvas Interface Panel, let’s put an “Add Context” button.

When clicked, the same Context Editor panel will drop down, but with the title and text area empty.

The user can then add a title, enter any information they want. Let’s make it so that hitting enter doesn’t save the changes (they’ll click the save button for that), but rather creates a new line, allowing for less confusion about multi-line entries.

When they hit save, the Context Editor will slide up and a Custom Context card will be created for that context. It should include a stylistic representation to designate that it’s a Custom Context Card.

When a user clicks a Custom Context card from not just this, but any collection, it should drop down the Context Editor, allowing them anywhere access to modifying their Custom Context Cards.

1. Custom File

Let’s add another button at the top of the Canvas, in the Navigation Panel called “Add File”.

When clicked, the Context Editor will drop down, but this time, it will simply provide an area where they can drag and drop a file onto. Let’s also include the traditional button the user can click to access the normal interface to find a local file and upload it.

Lastly, a save button.

When clicked, the Context Editor will slide up and a Custom File card will be created.

Like the other Cards in this collection, clicking on it here, or from any Collection, will drop down the Panel to show the file. In this case, just showing the file that they’ve uploaded, maybe with a cool preview mode, if that’s not too difficult. If that adds complexity, let’s save that till later, and for now the interface would just show the uploaded file name, and an ability to delete that file.

1. Profile Details

This Context type will be a little different. As opposed to just a simple text entry field, this will be a place where we gather specific information about the user.

In this case, the Profile Card will be on the Collection by default. The user doesn’t have to click an “Add” button. They’ll simply click on the User Profile Card (should always be the first card in the collection).

When clicked, the same Context Editor will drop down, but instead of just having a title and text area, or file-drag area, will be provide an interface where we list the following areas for them to enter information. All of it is optional, none of it is required.

- Role / Job Title
- # of years in Role
- Years in this company
- Years in HR
- Linked In URL
- Objectives and Goals
- Measures of Success
- Number of direct reports
- Current areas of concern
- Current areas of interest

When saved, the panel slides up, the database is updated, and the Context Card preview is updated.

IMPORTANT

All context that is saved in this Collection is passed to every agent at the beginning of a chat, allowing that AI agent to be maximally informed about the user, allowing it to provide the most helpful and relevant insights and assistance.

While Custom Context added to the Personal Context Collection is passed to the AI in EVERY conversation, Custom Context and Custom Files added to a Custom Collection are specific to that particular collection, and only passed to the AI panel WITHIN that Collection, for the Collection Assistant to process.

NOTE:

Because the ability to add custom context is so critical to this idea of “Object Oriented Context Engineering”, which we’re simply building a powerful UI for, we want to add to all Custom Collections, the same “Add Context” and “Add File” buttons in the top of the Canvas in the Canvas Navigation Panel.

As such, below the cards that appear in this collection, and consistent with how we do it on other collections, let’s have a cool, subtle vector graphic illustrating custom context, or capturing the idea of highly customized context for AI. Below that, let’s provide some text that makes sure they know that everything saved here is used as context for every agent, so they should only include information they want broadly available.

Let’s make sure that the helpful text at the bottom of the Personal Context page let’s them know that while Custom Context added to that specific location is used in every AI conversation, they can add custom context to any of their Custom Collections if they only want that Context specific to that Collection.

### Visual Indicators - Context Types

As you can see, we now have multiple Context Types, each with their own dedicated and associated Context Card. Including:

- Course
- Module
- Lesson
- Course Resource
- Conversation
- AI Insight
- Custom Context
- Context File
- Profile

Since all of these can appear simultaneously in a Collection, we need to be sure there’s a clear visual indicator so that the user can tell what kind of card it is. In many cases, this could be obvious, but a clear visual would be helpful. With this new insight in mind, you may wan to revisit the previous visual you have created to designate context type, and modify/refine it to allow for these new context types, recognizing that as the platform evolves, we’ll likely add additional Context Card types.