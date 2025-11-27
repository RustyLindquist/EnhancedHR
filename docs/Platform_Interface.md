# Interface

I’m building a high-tech online learning website, with courses built by experts and enhanced through powerful AI assistants and tutors trained on their content.

But I want to break the mold of the traditional online learning interface. I want you to help me build an all-new interface for browsing and interacting with content.

The foundation of our platform is that the interface has three primary areas.

1. Navigation Panel 
    
    On the left side of the platform is the main Navigation Panel. This is a collapsable pane that provides easy access to core areas of the platform, including collections.
    
    For a user, that will include the main Academy Collections, along with the default User Collections, and any Custom Collections they create.
    
    This pane will show an icon and full text for each Collection when open, and when collapsed, will show only the icon.
    
2. Main Canvas
    
    This is the main section of the screen where content shows up.
    
3. AI Panel
    
    This is a collapsable pane on the right hand side of the screen that allows the user to interact with the AI assistant, which is provided context based on whatever is in the Canvas. When expanded, it shows a full, traditional chat interface. When collapsed, it has a clear, residual presence, with an obvious place for the user to click to open the panel and talk with the AI.
    

The way content is presented in the Canvas is almost always through the use of Cards and Card-stacks, each of which represent content depth, or that by clicking on the card, you can access the card within it, which then replaces the content on the Canvas.

At the end of these instructions, I’ll paste a full-set of descriptions of all of this, how it works, with visual guidance, and key features like the Collection Surface and Collection Interface. These are provided for your reference.

What I’d like to do first, is design the basic platform screen, with an open Navigation panel and AI Panel, and what the cards and card stacks look like on the platform. It should also illustrate, within the Canvas, what the Collection Surface and the Collection Interface.

Below are the full set of interface instructions you can use as a reference as you create the first mockup of this interface. Once we perfect this core interface, we can begin to work on the rest of the screens.

For inspiration, I’ve attached an image that shows what inspired this, and the general style that I’m looking for. I have some instructions in the file to help you.

I’ve also uploaded our brand logo, so that you can also draw from that for illustration.

< — Begin Full Interface Description — >

### Content Cards

All content across the platform will be artfully enclosed in liquid glass cards, called Content Cards.

## Card Types

A card can represent a course, a module, or a lesson. These constitute Card Types. In the future, there will be other Card Types.

Besides containing they key metadata of the Card, there should be a noticeable but subtle, stylistic distinction between them, so that it’s apparent to a user what Card Type it is. See Card Styles for more.

## Collections

Collections are simply how we describe a set of cards. 

In our platform, the old-school “course catalog” is simply a Collection of Cards representing courses. We call it a Course Collection.

When viewing all courses, all courses are shown as Cards within the collection, with those below the visible window accessible (via lazy-load).

## Collection Type and Collection View

Courses, Modules, and Lessons are each simply a Collection Type, where the Collection View is restricted to a prescribed Card Type.

## Collection Interface

Each Collection has an interface, with options specific to that particular Collection Type. For instance, looking at all courses, the Collection Interface will include the ability to filter courses by all the usual Course Filter options.

## Collection Canvas

The Collection Canvas describes the main visual area on the screen, which includes the Collection Interface and all of the appropriate Cards within that Collection.

## Collection Depth

When viewing a Collection, there may be the ability to dive “into” a Card in that collection.

For instance, a Course Card has “beneath it” a series of Modules. Clicking it, would load the Modules associated with it as Module Cards on the Collection Canvas.

Clicking on a Module Card, would load the associated Lesson Cards into the Collection Canvas.

## Card Styles

We want to visually indicate the presence of Collection Depth. To do this, a Course Card should appear as a kind of “Card Stack”, which would appear as the main Course Card in the center, and the visual indicator of two other cards under neath it, but with the top corners of those cards only slightly protruding from either side of the Course Card.

Similarly, where a Module Card only has a single layer of content beneath it to represent Lessons, the Module card would only have a single, slightly protruding corner on the top right side to visually indicate 1 layer of depth.

### Collection Depth Navigation

We want to animate the experience of “going deep” to increase the user experience.

When you click on a Card, for which there is Collection Depth (sub-cards available), the current cards on the Collection Canvas should appear to fall and fade away, clearing the Collection Canvas. The Cards within that Collection now tastefully animate in.

As they do, the Collection Interface may change to adapt to the options appropriate to that Collection.

Whenever you are at level of Collection Depth that is not the top, such as when viewing a Module Collection within a Course, there will always be a clear option in the Collection Interface, to navigate back up a level.

When clicked, the same Collection Depth Navigation effect will occur, loading into the Collection Canvas, whatever Cards are included in that parent Collection.

### Academy Collections

There are three different Collections inherent to the Academy. 

- Course Collections
- Module Collections
- Lesson Collections

All of these are simply different filters for the Collection Canvas, which globally represents how we filter, sort, and display content of a certain type. This allows us to perfect and refine the Collection Canvas and it’s navigation experience, as it becomes the fundamental user interface for exploring, navigating, and accessing content on the platform.

## User Collections

Independent from Academy Collections, is the ability for a user to create their own collections.

By default, there are three provided User Collections.

### Favorites

This is a Collection where the user can save and access their favorite content, and the Collection Canvas will display whatever Content Cards they’ve saved here (e.g. Course Cards, Module Cards, or Lesson Cards).

### Research Canvas

This is a Collection where the user can save Content that they are actively researching or studying. Simply a different, default use case, to help the user recognize how to use User Collections.

### Learn Next

This is another default User Collection, that simply allows the user to save Cards that they want to eventually learn and engage with.

### New Collection

On top of the three default User Collections, each user has the ability to create, name, and save an entirely custom Collection, as a repository to serve whatever purpose they want.

### Custom Collection Interface

When a user is viewing the Collection Canvas for any Collection they created, as part of the Collection Interface are the options to Rename the Collection and to change color of that collection.

A Collection’s color will determine the color of the Collection Icon, and will be tastefully represented in the style of the Collection Canvas.

## Adding To A Collection

There are several ways to add Cards to a collection.

### Card Interface

On each Card that displays within the Collection Canvas will be a small icon, perhaps a plus sign. When you hover over it, “Add this card to a collection” will show in a tooltip. When clicked, the user will see a small window showing all available User Collections, along with a button to create a New Collection. The user can simply choose what collection they want to add the card to, and allows them to choose multiple collections. They can also choose to create a New Collection, which will ask them to provide a name and choose a color for that collection.

### Collection Surface

While the Collection Interface appears at the top of the Collection Canvas, allowing for functionality specific to the Cards currently in the Canvas, at the bottom of the Collection Canvas is what we call the Collection Surface.

The Collection Surface has an area for the following:

- Favorites
- Research
- To Learn
- New / Other

Each of these are areas span the bottom of the Collection Canvas. Each are highlighted and subtly animated with a glow of a different, vibrant color. 

You can visualize of the Collection Surface as a kind of series of magical portals appearing on the floor of the Canvas, each representing a gateway to it’s associated Collection, and with the light from that Collection shining up through the Portal.

As our logo is a flame, the style of the illumination and animation should be inspired by the glow of a warm, flickering fire, as though each collection represents an opportunity for warmth and the illumination of understanding.

Each has it’s own illuminating color, and a small flame icon next to it of the same color, along with the name of the Collection.

These 4 colors are unchangeable, and should draw from our brand colors, ensuring that the main interface is always predominantly “lit” by our brand colors.

At any time, a user can drag a card from the Collection Canvas and drop it onto an area of the Collection Surface.

As a card is dragged over one of these areas on the Collection Surface, the animation should grow and brighten to provide a visual and interactive illustration of where the Card is about to be placed.

Once the card is “dropped” by releasing the mouse button, effective dropping that card through the portal and into the associated Collection, the animation for that portal should suddenly flare in celebration, to indicate the Card has been successfully saved to their Collection.

If you drop a card onto the New / Other Collection Area, the animation for that area will flare, and an interface will pop up, allowing the user to select from their Custom Collections, or providing them the ability to create a new collection.

The user will have the ability to choose multiple collections they want to add that card to. If they choose to create a New Collection, it will ask for them to name the Collection and create a color for it.

Note: These types of interface interactions are designed to create small dopamine reactions, subtly gamifying the interface and enticing a use to continue interacting with the platform.

### From Within A Collection

Another way to add content to a collection is from within the Collection Canvas for that particular Collection.

When the user clicks on a Custom Collection from the platform Navigation panel, they are taken to the Collection Canvas for that Collection.

Within the Collection Interface for a Custom Collection is a button that says “Add To this Collection”.

When clicked, something magical happens.

Upon click, the current Collection Canvas slides down, or animates to the bottom of the Canvas Window, and artfully morphs into a dedicated Collection Surface.

This time, the Collection Surface is only a single portal, glowing with the color of it’s associated collection, and through which the user can drop Cards they wish to add to the Collection.

At the top of the new Collection Canvas, (which you can think of as an Add-To Collection Canvas, using the same Canvas tool) will be a very prominent display indicating that they are currently adding content to an Org Collection, showing the name of the Collection. This ensures there’s no confusion as to the purpose of the current Collection Canvas.

The Collection Canvas will now display the Course Collection, allowing the user to use the normal Collection browsing experience to identify cards they want to add to this Collection.

The user can drag any card and drop it onto the Collection Surface, being rewarded each time with the animation effect described earlier.

Or the user can click the plus icon on any card (or card stack), to add that content to the Collection. If they do this, the card should visually, but quickly and tastefully appear to fly down and into the portal on the Collection Surface, and resulting in the same rewarding animation. 

## Navigation Panel

On the left side of the platform is the main Navigation Panel. This is a collapsable pane that provides easy access to core areas of the platform, including collections.

For a user, that will include the main Academy Collections, along with the default User Collections, and any Custom Collections they create.

This pane will show an icon and full text for each Collection when open, and when collapsed, will show only the icon.

# Org Members

Consistent with our main platform navigation style, the interface to view and manage Org Users is simply that users represent yet another Collection Type, where it shows Member Cards for each member of the org that they have added to the platform.

This Org Members feature will show up in the Platform Navigation Panel only to those with an Org Administrator account.

When accessed, in the Collection Interface will be a button that says “Add Users”.

If there are no users in an organization, this button should have a glow that pulses, as a clear visual indicator of what the user should do next, and inviting them to click.

When that button is clicked, the user will be presented with a popup interface providing the organization’s current “Join URL” proving simple instructions to share that URL with anyone in the organization they want to invite into the platform. They will also be able to customize the URL there as well, as defined in the PRD files.

The Member Cards that show up in the Member Collection will include the Member Name, Member Photo, and a concise but insightful set of stats that indicate that user’s platform usage.

By clicking on a User Card, the User Details will load in the Canvas area.

## User Details

This will load all available details about a user that are appropriate to share with Org Admins. It will also include a much more thorough reporting of platform usage, and the ability to filter that information to get insights on that user.

# Org Collections

In addition to their own User Collections, an Organizational Administrator has the ability to create Custom Collections for their organization, which users should see that Collection, and determining what content within the collection is designated as “Required” learning.

For an Org Admin, their Navigation Panel will include “Org Collections”, giving them access to this functionality.

When an Org Admin Clicks on this Org Collections button, it will load a into the Canvas card stacks representing all of their custom, Org Collections.

Clicking on one of these card stacks will open that Collection in the Canvas.

### Adding A Collection

Within the parent view, where the Collection Canvas shows the card stacks representing all of their current, Custom Org Collections (if any), there will be a button at the top, in the Collection Interface to “Add A Collection”.

When clicked, the Org Admin will be able to create a name and choose a color for the collection, and click Save.

Once Saved, the newly created Custom Collection will load in the Canvas.

Note: When there are no current Custom Org Collections, the Add Collection button should be clearly illuminated by a pulsing glow, indicating that’s where the user should go, and inviting them to click to create a new Collection.

### Custom Collection Canvas

Once the user creates a new Collection, or opens a current Collection, that Collection loads within the Canvas.

Again, within the Canvas Interface for a Custom Canvas, they’ll see a button that says “Add Content”, as described earlier.

Note:

Whether for Org Collections, or Personal Collections, if ever the user is in a Collection that has no content, the “Add Content” button should pulse noticeably with a warm light, inviting the user to click it.

The Org Admin can now add content to the Collection, exactly as described earlier when outlining how a normal user adds content to a collection.

Note:

We described earlier, how one way to add content to a custom Collection is to drag a Card into one of the available areas on the Collection Surface. That includes an area for New/Other, and triggering a popup interface where the use can choose from one of their previously created Custom Collections, or create a new collection. When this user is an Org Admin, on this popup interface, they will see two lists, instead of one. The first will be their own Custom Collections (with it’s associated ability to create a new collection), and the second will list Custom Collections they have created for their organization, again with the ability to create a new, Custom Collection for the Org.

## Required Learning

When an Org Admin is looking at a Custom Org Collection, an additional icon will appear on each Card, which they can click to designate that particular card as “Required Learning”.

## Assigning A Collection

In a the Collection Interface for a Custom, Org Collection, next to the Add Content button will be a button that says “Assign Users”.

Like the “Add Content” button whose glow slowly pulses if there is no content, the “Assign Users” button will do the same, pulsing until users have been added to the Collection.

When the Assign Users button is pressed, the Collection Canvas is now replaced with the User Collection, showing all the user cards of those who have been assigned to this collection.

The Collection Interface for this screen will include an Add Users button, which pulses if no users have been added.

When clicking the Add Users button, the user experiences the same thing as when they click to Add Content, including:

The current User Collection animates down, and morphs into the Collection Surface, providing a “portal” through which they can add users to that Collection, and glowing with the color of that Collection. The cards for all org members are then loaded into the Canvas.

The Org Admin can now click the “plus” button on a card, to have it “fall” through the portal, adding that user to the collection, or they can drag the the user card and drop it through the portal, again triggering all the normal interface animation effects.