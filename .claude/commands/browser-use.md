---
description: Enable browser control via Playwright MCP for UI testing, screenshots, and workflow verification
---

# Browser Use Skill (Playwright MCP)

This skill enables browser control via **Playwright MCP**. Use this skill whenever you need to interact with the running application in a browser.

> **Note**: This requires the Playwright MCP server to be running. This provides automated browser control for testing and verification.

## Prerequisites

Before using browser control:
1. Ensure the dev server is running (`pnpm dev`)
2. Playwright MCP server should be available in the MCP configuration
3. Navigate to the appropriate URL to start testing

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

Use `mcp__browsermcp__browser_navigate` to navigate:
```
Navigate to http://localhost:3001/dashboard
Go to the settings page
```

### Taking Screenshots

Use `mcp__browsermcp__browser_screenshot` to capture:
```
Take a screenshot of the current page
Capture a screenshot of the login form
```

### Console Access

Use `mcp__browsermcp__browser_get_console_logs` to check:
```
Check the browser console for errors
List all console messages and look for warnings
```

### UI Interaction

Use `mcp__browsermcp__browser_click` and `mcp__browsermcp__browser_type`:
```
Click the "Submit" button
Fill the email field with "test@example.com"
```

Use `mcp__browsermcp__browser_snapshot` to get element references for interaction.

### Form Testing

```
1. Navigate to the form page
2. Get a snapshot to find element references
3. Type into form fields
4. Click submit
5. Check console for errors
6. Take a screenshot of the result
```

### Workflow Testing

```
1. Navigate to starting point
2. Use snapshots to find elements
3. Interact with each step
4. Check console after major actions
5. Take screenshots at key points
```

## Best Practices

### 1. Get a Snapshot First
Before interacting with elements, use `browser_snapshot` to get element references:
```
1. Navigate to the page
2. Take a snapshot
3. Use the ref values from snapshot for clicks/typing
```

### 2. Check Console After Actions
```
1. Perform an action (click, submit)
2. Get console logs to check for errors
```

### 3. Take Screenshots for Evidence
```
1. Complete an action
2. Take a screenshot to verify the result
```

### 4. Use Specific Element References
The snapshot provides `ref` values for each element. Use these exact refs when clicking or typing.

### 5. Wait When Needed
Use `mcp__browsermcp__browser_wait` when pages need time to load:
```
Wait 2 seconds for the page to load
```

## Error Handling

### Element Not Found
If an element can't be found:
1. Take a new snapshot to see current page state
2. Check if the page has fully loaded
3. Look for the correct element reference in the snapshot

### Connection Issues
If browser control stops working:
1. Check that the Playwright MCP server is running
2. Try navigating to a new URL to reset state

## Common Patterns

### Verify a UI Change
```
1. browser_navigate to localhost:3001/[affected-page]
2. browser_screenshot
3. browser_get_console_logs for errors
4. browser_snapshot to verify elements
```

### Test a Form
```
1. browser_navigate to the form page
2. browser_snapshot to get element refs
3. browser_type into each field
4. browser_click the submit button
5. browser_get_console_logs for errors
6. browser_screenshot of the result
```

### Test a Workflow
```
1. browser_navigate to starting point
2. browser_snapshot
3. browser_click/type for each step
4. browser_get_console_logs after each major action
5. browser_screenshot at key points
```

### Debug an Issue
```
1. browser_navigate to the problematic page
2. browser_get_console_logs for errors
3. browser_screenshot
4. browser_snapshot to see element structure
5. Report findings
```

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__browsermcp__browser_navigate` | Navigate to a URL |
| `mcp__browsermcp__browser_snapshot` | Get accessibility tree with element refs |
| `mcp__browsermcp__browser_screenshot` | Capture current page |
| `mcp__browsermcp__browser_click` | Click an element by ref |
| `mcp__browsermcp__browser_type` | Type into an element |
| `mcp__browsermcp__browser_hover` | Hover over an element |
| `mcp__browsermcp__browser_select_option` | Select dropdown option |
| `mcp__browsermcp__browser_press_key` | Press keyboard key |
| `mcp__browsermcp__browser_wait` | Wait for specified time |
| `mcp__browsermcp__browser_get_console_logs` | Get console output |
| `mcp__browsermcp__browser_go_back` | Navigate back |
| `mcp__browsermcp__browser_go_forward` | Navigate forward |

## Integration with Testing

This skill is used by:
- **Any agent** for quick visual verification and console checks
- **Test Agent** for comprehensive workflow and feature testing

When in doubt about whether browser control is needed, ask: "Would a real user need to see/interact with this to verify it works?" If yes, use browser control.
