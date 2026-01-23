---
description: Browser automation for UI testing, screenshots, and workflow verification. Routes to optimal tool based on context.
---

# Browser Use Command

Enables browser control for UI testing, screenshots, and workflow verification. This command intelligently routes to the best browser tool for your needs.

## Quick Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHICH BROWSER TOOL?                          │
│                                                                 │
│  Running structured test suite?     ──► Playwright Test         │
│  Need assertions & reports?         ──► Playwright Test         │
│  CI/CD / regression testing?        ──► Playwright Test         │
│                                                                 │
│  Need user's logged-in session?     ──► Claude in Chrome        │
│  Creating a GIF recording?          ──► Claude in Chrome        │
│  Monitoring network/API requests?   ──► Claude in Chrome        │
│                                                                 │
│  Quick isolated smoke test?         ──► Browser MCP             │
│  Simple interaction check?          ──► Browser MCP             │
│                                                                 │
│  DEFAULT (interactive): Claude in Chrome                        │
│  DEFAULT (test suite): Playwright Test                          │
└─────────────────────────────────────────────────────────────────┘
```

## Available Tools

| Tool | Type | Best For |
|------|------|----------|
| **Claude in Chrome** | MCP (`mcp__claude-in-chrome__*`) | Authenticated flows, GIF recording, network monitoring, JS execution |
| **Browser MCP** | MCP (`mcp__browsermcp__*`) | Interactive isolated testing, simple interactions, accessibility snapshots |
| **Playwright Test** | CLI (`npx playwright test`) | Structured test suites, assertions, CI/CD, regression testing |

## Decision Matrix

| Scenario | Use | Why |
|----------|-----|-----|
| **Structured test suite** | Playwright Test | Assertions, reports, parallelization |
| **CI/CD pipeline** | Playwright Test | Exit codes, reports, retries |
| **Regression testing** | Playwright Test | Repeatable, deterministic |
| **Pre-PR validation** | Playwright Test | Run full test suite |
| Test authenticated page | Claude in Chrome | Uses user's logged-in session |
| Create demo GIF | Claude in Chrome | Has gif_creator |
| Debug live issue | Claude in Chrome | See what user sees |
| Monitor API calls | Claude in Chrome | read_network_requests |
| Execute page JavaScript | Claude in Chrome | javascript_tool |
| Multi-tab workflow | Claude in Chrome | Tab management |
| Quick isolated smoke test | Browser MCP | Clean state, simpler API |
| Quick accessibility check | Browser MCP | browser_snapshot |
| Simple form test | Either MCP | Both capable |

## Playwright Test Quick Start

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/auth.spec.ts

# Run with visible browser
npx playwright test --headed

# Run with UI mode (interactive debugging)
npx playwright test --ui

# View report
npx playwright show-report
```

**Key capabilities:**
- Assertions (`expect(page).toHaveURL(...)`)
- Test organization (`describe`, `test`, `beforeEach`)
- Parallel execution
- Retries and flaky test handling
- HTML reports
- Cross-browser (Chromium, Firefox, WebKit)

See `.claude/skills/browser-use/reference/playwright-test.md` for complete reference.

## Claude in Chrome Quick Start

```
1. mcp__claude-in-chrome__tabs_context_mcp     # ALWAYS FIRST
2. mcp__claude-in-chrome__navigate             # Go to page
3. mcp__claude-in-chrome__computer             # Interact/screenshot
4. mcp__claude-in-chrome__read_console_messages # Check errors
```

**Key capabilities:**
- Tab management
- GIF recording
- Network request monitoring
- JavaScript execution
- Form input with refs
- Natural language element finding

See `.claude/skills/browser-use/reference/claude-in-chrome.md` for complete reference.

## Browser MCP Quick Start

```
1. mcp__browsermcp__browser_navigate           # Go to page
2. mcp__browsermcp__browser_snapshot           # Get element refs
3. mcp__browsermcp__browser_click/type         # Interact
4. mcp__browsermcp__browser_get_console_logs   # Check errors
```

**Key capabilities:**
- Isolated browser instance
- Accessibility tree snapshots
- Simple click/type/screenshot
- Console log access

See `.claude/skills/browser-use/reference/browser-mcp.md` for complete reference.

## Common Patterns

### Run Test Suite (Playwright Test)

```bash
# Full regression suite
npx playwright test

# Specific feature tests
npx playwright test tests/e2e/courses/

# Single test for debugging
npx playwright test -g "user can log in" --headed
```

### Verify UI Change (MCP - Interactive)

**With Claude in Chrome (authenticated):**
```
1. tabs_context_mcp
2. navigate to localhost:3001/[page]
3. computer action=screenshot
4. read_console_messages pattern="error"
```

**With Browser MCP (isolated):**
```
1. browser_navigate url="http://localhost:3001/[page]"
2. browser_screenshot
3. browser_get_console_logs
```

### Test Form Submission (MCP)

```
1. Navigate to form page
2. Get element refs (read_page or browser_snapshot)
3. Fill fields (form_input or browser_type)
4. Submit (click submit button)
5. Check console for errors
6. Screenshot result
```

### Create Demo GIF (Claude in Chrome only)

```
1. tabs_context_mcp
2. gif_creator action=start_recording tabId=<id>
3. computer action=screenshot        # First frame
4. [Perform demo steps]
5. computer action=screenshot        # Last frame
6. gif_creator action=stop_recording
7. gif_creator action=export download=true filename="demo.gif"
```

### Monitor API Calls (Claude in Chrome only)

```
1. tabs_context_mcp
2. navigate to page
3. [Trigger API action]
4. read_network_requests urlPattern="/api/"
```

## Best Practices

1. **Playwright Test: Use for repeatable validation** - Assertions ensure expected behavior
2. **Claude in Chrome: Always call `tabs_context_mcp` first** - Required for all operations
3. **Browser MCP: Always call `browser_snapshot` before interacting** - Get element refs
4. **Check console after actions** - All tools support this
5. **Screenshot at key points** - Visual evidence
6. **Use element refs** - More reliable than coordinates

## When to Use Each

| Task | Tool | Reason |
|------|------|--------|
| Verify PR before merge | Playwright Test | Structured, repeatable |
| Quick check during dev | Browser MCP | Fast, isolated |
| Debug user-reported issue | Claude in Chrome | See their session |
| Record walkthrough | Claude in Chrome | GIF recording |
| Investigate API issue | Claude in Chrome | Network monitoring |

## When to Escalate

If browser testing reveals complex issues:
- **Spawn Test Agent** for comprehensive validation
- **Use systematic-debugging skill** for methodical investigation
- **Check network requests** for API-level issues

## Full Documentation

- **Skill overview:** `.claude/skills/browser-use/SKILL.md`
- **Claude in Chrome:** `.claude/skills/browser-use/reference/claude-in-chrome.md`
- **Browser MCP:** `.claude/skills/browser-use/reference/browser-mcp.md`
- **Playwright Test:** `.claude/skills/browser-use/reference/playwright-test.md`
