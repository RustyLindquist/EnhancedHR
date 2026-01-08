---
description: Generate a focused test plan from feature and workflow docs
---

## Steps

1. **Primary feature testing**: From the primary feature doc's "Testing Checklist" section:
   - Extract and run the local verification steps
   - Note any prerequisites (test user, specific data state)

2. **Impacted feature testing**: From each impacted feature doc:
   - Run their minimal verification checks (not full checklist, just the parts relevant to your change)

3. **Workflow smoke test**: Run exactly ONE workflow smoke test:
   - If a workflow doc exists for the affected flow, use its smoke test
   - Otherwise, use the primary feature doc's staging smoke test
   - This should be an end-to-end user journey, not a unit test

4. **Data validation**: Where applicable, confirm expected database mutations:
   - Check that expected rows were created/updated in the correct tables
   - Verify no unexpected side effects in related tables

## Output

Return a test report:
- **Primary feature tests**: Pass/Fail with notes
- **Impacted feature tests**: Pass/Fail with notes
- **Workflow smoke test**: Pass/Fail with the specific test run
- **Data validation**: Confirmed mutations and any anomalies
- **Issues found**: Any failures or unexpected behavior to address
