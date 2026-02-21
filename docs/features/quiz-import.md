---
id: quiz-import
owner: frontend + backend
status: active
stability: stable
last_updated: 2026-02-21
surfaces:
  routes:
    - /admin/courses/:id/builder
    - /author/courses/:id/builder
    - /org/courses/:id/builder
  components:
    - src/components/admin/QuizImportPanel.tsx
    - src/components/admin/QuizBuilder.tsx
data:
  tables:
    - public.lessons (quiz_data JSONB column)
backend:
  actions: []
dependencies:
  - xlsx (SheetJS) - client-side Excel parsing
invariants:
  - Imported questions are APPENDED to existing questions, never replacing them.
  - Correct answers are identified by an asterisk (*) prefix in the spreadsheet.
  - Only the first worksheet in the spreadsheet is parsed; additional sheets are ignored.
  - Each imported question must have at least 2 answer options; rows with fewer are skipped.
  - If no correct answer is marked with *, the first option defaults to correct (with a warning).
  - Parsing happens entirely client-side; no server round-trip or file upload is needed.
---

## Overview

Quiz Import allows course authors to bulk-create quiz questions by uploading an Excel spreadsheet (.xlsx/.xls). Instead of manually adding questions one at a time through the QuizBuilder UI, authors can prepare questions in a spreadsheet and import them in one click. Imported questions are appended to any existing questions in the quiz.

## User Surfaces

The "Import Questions" button appears in the **QuizBuilder** component, which is rendered in:
- **Admin Console**: `/admin/courses/:id/builder` via `LessonEditorPanel.tsx`
- **Expert Console**: `/author/courses/:id/builder` via `ExpertLessonEditorPanel.tsx`
- **Org Console**: `/org/courses/:id/builder` via `OrgCourseBuilderClient.tsx`

All three surfaces use the same shared `QuizBuilder` component, so the feature is available everywhere quizzes can be created.

## Spreadsheet Format

| Column | Content | Required |
|--------|---------|----------|
| A (first) | Question text | Yes |
| B (second) | Explanation text | No |
| C-L (3rd-12th) | Answer choices (up to 10) | At least 2 |

**Correct answer marking**: Prefix the correct answer with an asterisk (`*`). Example: `*Option B` means Option B is the correct answer. The asterisk is stripped from the displayed text.

**Header row**: The first row is treated as headers and is always skipped.

**Empty cells**: Empty cells in answer columns are ignored. Rows with empty question text are skipped.

## Components

### QuizImportPanel (`src/components/admin/QuizImportPanel.tsx`)

The main import UI, rendered as a `DropdownPanel` (slide-down from top):

- **Header**: Title "Import Quiz Questions" with `FileSpreadsheet` icon; "Import Quiz" button as header action
- **Left column**: Instructions with numbered steps and an inline SVG illustration showing the spreadsheet format with highlighted correct answers
- **Right column**: Drag-and-drop file zone accepting `.xlsx` and `.xls` files (max 10MB)
- **Parsing**: Uses the `xlsx` (SheetJS) library to parse the file client-side
- **Error handling**: Displays inline errors for invalid files, empty spreadsheets, or sheets with no valid questions
- **Warnings**: Shows skipped row warnings (e.g., rows with fewer than 2 answer options, rows with no marked correct answer)

**Props**:
```typescript
interface QuizImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: QuizQuestion[]) => void;
  disabled?: boolean;
}
```

### QuizBuilder Changes (`src/components/admin/QuizBuilder.tsx`)

- "Import Questions" button added to the Questions section header (next to question count)
- Button opens `QuizImportPanel` via local `showImportPanel` state
- `handleImportQuestions` callback appends imported questions to existing ones

## Data Flow

```
User uploads .xlsx → xlsx.read() parses client-side → parseSpreadsheet() extracts QuizQuestion[]
→ onImport callback → QuizBuilder appends to existing questions → onChange propagates to parent
→ Parent saves quiz_data to lessons table on "Save"
```

No server action is involved in parsing. The imported questions become part of the `QuizData.questions` array and are saved through the existing lesson save flow.

## Optional Passing Score

As part of this feature, the passing score was made optional:

- **`QuizData.passingScore`** changed from `number` to `number | null | undefined`
- **QuizBuilder**: Input accepts empty value; helper text explains the behavior
- **QuizPlayer**: Shows "Test your knowledge" instead of "Pass with X%" when no score set; results show score in neutral blue without pass/fail messaging
- **AssessmentPanel + AssessmentCompletionScreen**: Same graceful handling; no "Passing score: X%" line when not set

When no passing score is set, learners still see their score percentage and per-question correct/incorrect feedback, but without pass/fail framing.

## Testing Checklist

- [ ] Create a new quiz in Expert Console, click "Import Questions", upload sample .xlsx — questions appear in QuizBuilder
- [ ] Verify imported questions have correct answers marked (green highlight)
- [ ] Verify explanations from column B appear in the explanation field
- [ ] Add a manual question first, then import — imported questions appear AFTER the manual one
- [ ] Upload a non-Excel file — error message shown, import button disabled
- [ ] Upload an empty spreadsheet — "No valid questions found" error
- [ ] Upload spreadsheet with some rows missing answer options — warnings shown, valid rows imported
- [ ] Leave passing score blank, save quiz, reopen — field remains blank
- [ ] Take a quiz with no passing score as learner — score shown without pass/fail messaging
- [ ] Take a quiz with passing score set — pass/fail messaging works as before
- [ ] Test in Admin Console — same Import button and behavior
- [ ] `pnpm build` passes with zero errors

## Related Docs

- `docs/features/course-player-and-progress.md` — Quiz data model and assessment behavior
- `docs/features/author-portal.md` — Expert Console quiz builder
- `docs/features/admin-portal.md` — Admin Console quiz builder
- `docs/features/inline-module-resources.md` — FileUploadZone pattern reference
