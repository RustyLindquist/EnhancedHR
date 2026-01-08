---
description: Enable browser control via Chrome Extension for UI testing, screenshots, and workflow verification
---

# Browser Use Skill

This skill enables browser control via the Claude Code Chrome Extension. Use this skill whenever you need to interact with the running application in a browser.

## Prerequisites

Before using browser control:
1. Ensure Chrome is running
2. Verify connection with `/chrome`
3. If not connected, run `/chrome` and select "Reconnect extension"

## When to Use Browser Control

**Use browser control for:**
- Verifying UI changes visually
- Checking for console errors after changes
- Testing user workflows end-to-end
- Taking screenshots for documentation or verification
- Filling forms and testing validation
- Checking responsive design

**Don't use browser control for:**
- Unit tests (use `pnpm test` instead)
- Build verification (use `pnpm build` instead)
- Type checking (use TypeScript compiler instead)
- Tasks that can be done via code inspection

## Capabilities

### Navigation

```
Navigate to localhost:3000/dashboard
Go to the settings page
Open a new tab and navigate to localhost:3000/admin
Switch to the tab showing the course player
```

### Taking Screenshots

```
Take a screenshot of the current page
Capture a screenshot of the login form
Take a screenshot and check if the modal is displaying correctly
```

### Console Access

```
Check the browser console for errors
List all console messages and look for warnings
Check if there are any API errors in the console
Look for console errors related to authentication
```

### UI Interaction

```
Click the "Submit" button
Fill the email field with "test@example.com"
Fill out the form with: name "Test User", email "test@test.com"
Hover over the profile menu
Click the dropdown and select "Settings"
```

### Form Testing

```
Fill the login form with invalid data and check for error messages
Submit an empty form and verify validation errors appear
Fill the registration form and submit it
```

### Workflow Testing

```
Navigate to localhost:3000, click login, fill credentials, and verify the dashboard loads
Go through the checkout flow: add item, go to cart, proceed to checkout
Test the course enrollment flow from start to finish
```

## Best Practices

### 1. Start with a Fresh State
```
Navigate to localhost:3000 in a new tab
Clear the current state by logging out first
```

### 2. Check Console After Actions
```
Click the submit button, then check the console for any errors
Navigate to the page and immediately check for console errors
```

### 3. Take Screenshots for Evidence
```
Take a screenshot after the form submission to verify the success message
Capture the error state for documentation
```

### 4. Be Specific with Selectors
When elements are ambiguous:
```
Click the "Save" button in the settings panel (not the header)
Fill the email field in the registration form (not the login form)
```

### 5. Wait for Actions to Complete
```
Click submit and wait for the page to load
Navigate to the dashboard and wait for the data to appear
```

## Error Handling

### Modal Dialogs Block Commands
If a JavaScript alert, confirm, or prompt appears, it blocks browser control. Dismiss it manually and tell Claude to continue.

### Element Not Found
If an element can't be found:
```
Take a screenshot to see the current page state
Check if the page has fully loaded
Verify the element selector is correct
```

### Connection Issues
If browser control stops working:
1. Run `/chrome` to check status
2. Select "Reconnect extension"
3. If still failing, restart Chrome and Claude Code

## Common Patterns

### Verify a UI Change
```
1. Navigate to localhost:3000/[affected-page]
2. Take a screenshot
3. Check console for errors
4. Verify the expected element is visible
```

### Test a Form
```
1. Navigate to the form page
2. Fill the form with test data
3. Submit the form
4. Check console for errors
5. Take a screenshot of the result
6. Verify success/error message appears
```

### Test a Workflow
```
1. Navigate to the starting point
2. Perform each step of the workflow
3. Check console after each major action
4. Take screenshots at key points
5. Verify the workflow completes successfully
```

### Debug an Issue
```
1. Navigate to the problematic page
2. Check console for errors
3. Take a screenshot
4. Interact with the problematic element
5. Check console again for new errors
6. Report findings
```

## Limitations

- **Chrome only**: Works only with Google Chrome
- **Visible browser required**: No headless mode
- **Shared session**: Uses your existing Chrome login state
- **Modal blockers**: JavaScript alerts/confirms block commands
- **No WSL support**: Not available on Windows Subsystem for Linux

## Quick Reference

| Action | Example Command |
|--------|----------------|
| Navigate | `Navigate to localhost:3000/dashboard` |
| Screenshot | `Take a screenshot of the current page` |
| Console | `Check the browser console for errors` |
| Click | `Click the "Submit" button` |
| Fill field | `Fill the email field with "test@test.com"` |
| Fill form | `Fill out the form with: name "X", email "Y"` |
| New tab | `Open a new tab and go to localhost:3000` |
| Wait | `Wait for the dashboard to load` |

## Integration with Testing

This skill is used by:
- **Any agent** for quick visual verification and console checks
- **Test Agent** for comprehensive workflow and feature testing

When in doubt about whether browser control is needed, ask: "Would a real user need to see/interact with this to verify it works?" If yes, use browser control.
