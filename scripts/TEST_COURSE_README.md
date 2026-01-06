# Test Course Documentation

## Strategic HR Analytics (Course ID: 999)

This is a **fully populated test course** created to test all course features including:
- Video playback with Mux integration
- Quiz functionality
- Module navigation
- Lesson progression
- Resource downloads
- Course completion tracking

### Course Details

**Course ID:** 999
**Title:** Strategic HR Analytics
**Author:** Dr. Emily Rodriguez
**Category:** Analytics
**Duration:** 6h 45m
**Rating:** 4.9
**Badges:** SHRM, HRCI

### Course Structure

**5 Modules, 24 Total Lessons (19 Videos + 5 Quizzes)**

1. **Introduction to HR Analytics** (1h 15m)
   - Welcome to HR Analytics (8m video)
   - The Business Case for HR Analytics (12m video)
   - Key HR Metrics Overview (15m video)
   - Module 1 Assessment (10m quiz)

2. **Data Collection and Management** (1h 45m)
   - Sources of HR Data (14m video)
   - Data Quality and Integrity (18m video)
   - HRIS Systems Overview (16m video)
   - Data Privacy and Compliance (20m video)
   - Module 2 Assessment (12m quiz)

3. **Workforce Analytics Fundamentals** (2h 00m)
   - Turnover Analysis (22m video)
   - Recruitment Metrics (18m video)
   - Performance Analytics (25m video)
   - Compensation Analytics (20m video)
   - Module 3 Assessment (15m quiz)

4. **Predictive Analytics and Modeling** (1h 45m)
   - Introduction to Predictive Analytics (16m video)
   - Attrition Prediction Models (24m video)
   - Succession Planning Analytics (20m video)
   - Skills Gap Analysis (18m video)
   - Module 4 Assessment (12m quiz)

5. **Reporting and Visualization** (1h 30m)
   - Designing Effective HR Dashboards (20m video)
   - Data Visualization Principles (18m video)
   - Storytelling with Data (22m video)
   - Real-Time Reporting (15m video)
   - Module 5 Assessment (10m quiz)

### Course Resources (6 items)

1. HR Analytics Framework Guide (PDF, 2.4 MB)
2. Data Collection Templates (XLS, 856 KB)
3. Dashboard Design Best Practices (PDF, 1.8 MB)
4. HR Metrics Glossary (PDF, 945 KB)
5. Sample Analytics Dashboard (XLS, 3.2 MB)
6. Predictive Analytics Cheat Sheet (PDF, 1.1 MB)

### Video Integration

All video lessons use **Mux test stream playback IDs**:
- EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs (Big Buck Bunny)
- Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00 (Sintel)
- qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M (Test Pattern)

These are public Mux test streams that will play correctly in the video player.

### Quiz Structure

Each quiz contains 2-3 multiple choice questions with:
- Clear question text
- 4 answer options (a, b, c, d)
- Correct answer marking
- 70% passing score requirement

## Managing the Test Course

### Re-seeding the Course

To recreate the course (will delete existing and create fresh):

```bash
npx tsx scripts/seed_complete_test_course.ts
```

To add/update resources:

```bash
npx tsx scripts/seed_test_course_resources.ts
```

### Deleting the Test Course

When you're ready to remove this test course from the database:

**Option 1: SQL (Recommended - cascades to modules, lessons, resources)**
```sql
DELETE FROM courses WHERE id = 999;
```

**Option 2: Individual cleanup**
```sql
DELETE FROM resources WHERE course_id = 999;
DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = 999);
DELETE FROM modules WHERE course_id = 999;
DELETE FROM courses WHERE id = 999;
```

### What This Tests

✅ Course listing and discovery
✅ Course detail page with description
✅ Module expansion/collapse
✅ Lesson navigation (previous/next)
✅ Video playback with Mux
✅ Quiz taking and scoring
✅ Progress tracking
✅ Course completion
✅ Resource listing and download
✅ Instructor information display
✅ Credit badges (SHRM/HRCI)
✅ Drag-and-drop to collections
✅ Prometheus AI integration (Ask about lesson/course)

## Notes

- This course is marked as **published** and will appear in course listings
- All video lessons use real Mux test streams that actually play
- Resources use placeholder URLs (not real downloadable files)
- The course is designed to be realistic enough for thorough testing but clearly marked as test data
- Can be safely deleted at any time without affecting production courses
