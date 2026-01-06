# Documentation Update Policy

## When to modify an existing doc vs create a new doc

### Modify an existing feature doc when:
- the user-facing capability already exists
- you changed surfaces/routes/components of that capability
- you changed data reads/writes that belong to that capability
- you changed invariants, permissions, or testing for that capability

### Create a new feature doc only when ALL are true:
- a genuinely new end-to-end capability exists for users/admins/authors
- it has its own invariants and data interactions
- it would be confusing to describe it as a subsection of an existing feature doc

### If new code overlaps another feature substantially:
- do NOT create a new doc just because code is new
- document the overlap as coupling in FEATURE_INDEX and in “Integration Points”
- only split into a new feature if the invariants differ

---

## When to add an ASCII diagram

ASCII diagrams are optional. Add one only if it reduces regression risk.

Add an ASCII diagram when:
- a workflow crosses 3+ tables AND 2+ write paths, OR
- a state machine exists (e.g., approval states, billing states), OR
- there is a “scope resolution” flow (AI context scopes, org scoping, access gating)

Do NOT add diagrams for:
- purely presentational UI
- trivial single-table CRUD

Diagram guidance:
- keep to 10–25 lines
- show only major objects and arrows
- prefer data/write flows over component trees
