# Platform Help

Because Help is something that we want to offer a lot of, we want to create a "Help" Collection! This allows us to use our powerful Collection framework for two purposes.

1. Provide an easy, all-in-one interface where users can go to learn more about key features on the platform.
2. Ask prometheus for help using the platform.

So now that we have this fantastic new “Help System” or Help Panel in place for displaying help, here’s what I’d like to do.

I’d like to create a new, provided collection called “Help”, which would be located just under “Personal Context” on the left-side Platform Navigation Panel.

When a user clicks on that, it would load a series of Help Cards.

Each of these cards represents a key feature or capability or interface element of the platform.

We would want to create a new card style, patterned after our other cards, but visually differentiable. For the background color of this card, let’s use the color #4B8BB3.

When a user clicks on any of these cards, the associated help text would load in the new Help Panel you just built.

This all-new Help Collection would be built such that the the help content for each card is available to the AI Panel, saved as a RAG, just like how the context cards for all other panels are saved in a RAG. This would allow the user to visit the Help Collection to either browse features to learn more about the platform, find a particular feature to learn more about or get help with, or they can simply ask the Collection Assistant. In this case the Collection Assistant, being trained on all of the content in the Help Collection, would be able to provide platform help.

The first card in this new Help System would be the new AI Insights help content you just created.

The second step, and one that would require some substantial and critical thinking, would be to analyze the platform, identify the features that you think would be most helpful or most important, create a card for them, and then create the help content for each one of them, one at a time until they’re all done.

Once you’ve finished, I can go to that help section and see which Cards you’ve created autonomously, and can then request specific additions from there.

We want this Help Collection to be about more than just “how to”, but also why, and what. The idea is that it’s not only where people go to get help, but also simply to learn more about the platform. For instance, during a demo, or a trial period, a user could go here and see all of these beautiful cards highlighting the most important parts of the platform, and click on one to learn more about it.

For this purpose, the text for each feature or card should be written first (and probably at the top) to explain the value and purpose of the feature, helping them feel like this is a robust and powerful platform, and see the value of each feature. Below that would be any instructions, help, or guidance that would be helpful.

If we build it such that the most valuable information for each feature is at the top, then as they read it becomes more granular and “mechanical” how-to, it allows a user to first and foremost explore and learn about the value, and then they can scroll to get to the more specific “help” style content.

And the more specific “how-to” style content will be written not only for the user, but with the understanding that the collection Assistant will use this information to answer questions and provide specific help to the user upon request.

