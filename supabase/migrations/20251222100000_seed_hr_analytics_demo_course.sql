-- =====================================================
-- HR Analytics Fundamentals - Complete Demo Course
-- =====================================================
-- This migration creates a fully-featured demo course with:
-- - 6 comprehensive modules
-- - 24 video lessons with Mux playback IDs
-- - 6 module assessments (quizzes)
-- - Downloadable resources
-- - Full course transcripts for RAG/AI context
-- =====================================================

-- Use a reserved course ID (1000) for the demo course
-- This ensures it persists through resets and is easily identifiable

-- =====================================================
-- STEP 1: Create the Course
-- =====================================================
INSERT INTO courses (
  id,
  title,
  author,
  category,
  image_url,
  description,
  duration,
  rating,
  badges,
  created_at
) VALUES (
  1000,
  'HR Analytics Fundamentals',
  'Dr. Sarah Mitchell',
  'Analytics',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop',
  'Transform your HR practice with the power of data. This comprehensive course takes you from analytics fundamentals to advanced predictive modeling, teaching you to measure what matters, uncover workforce insights, and drive strategic business decisions. Whether you''re new to analytics or looking to deepen your expertise, you''ll gain practical skills you can apply immediately to improve talent acquisition, boost retention, and demonstrate HR''s impact on the bottom line.',
  '8h 30m',
  4.9,
  ARRAY['SHRM', 'HRCI', 'REQUIRED'],
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  rating = EXCLUDED.rating,
  badges = EXCLUDED.badges;

-- =====================================================
-- STEP 2: Clean up existing modules/lessons for this course
-- =====================================================
DELETE FROM modules WHERE course_id = 1000;

-- =====================================================
-- STEP 3: Create Module 1 - Foundations of HR Analytics
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0001-000000000001', 1000, 'Foundations of HR Analytics', 1, '1h 20m');

-- Module 1 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0001-100000000001', '11111111-0001-0001-0001-000000000001', 'Welcome to HR Analytics', 1, '8m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Welcome to HR Analytics Fundamentals! In this course, you''ll learn how to leverage data to make smarter decisions about your most valuable asset—your people.

HR analytics, also known as people analytics or workforce analytics, is the practice of collecting, analyzing, and reporting on HR data to improve workforce performance and business outcomes. Unlike traditional HR metrics that simply track numbers, analytics helps us understand the "why" behind workforce trends and predict future outcomes.

Throughout this course, we''ll cover:
- Core HR metrics and how to calculate them
- Data collection and quality management
- Statistical analysis techniques
- Predictive modeling for workforce planning
- Building compelling dashboards and reports
- Communicating insights to stakeholders

By the end, you''ll have the skills to transform raw data into actionable insights that drive real business value. Let''s get started!'),

('11111111-0001-0001-0001-100000000002', '11111111-0001-0001-0001-000000000001', 'The Business Case for People Analytics', 2, '12m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'Why should organizations invest in HR analytics? The answer lies in the profound impact data-driven HR decisions have on business outcomes.

COST SAVINGS
Companies using people analytics report up to 30% reduction in turnover costs by identifying at-risk employees before they leave. With the average cost of replacing an employee ranging from 50% to 200% of their annual salary, this translates to millions in savings for large organizations.

IMPROVED HIRING
Analytics-driven recruitment leads to 40% reduction in time-to-hire and 25% improvement in quality of hire. By analyzing what makes successful employees tick, we can build better hiring profiles and reduce bad-fit hires.

STRATEGIC WORKFORCE PLANNING
Rather than reacting to talent shortages, organizations can use predictive analytics to anticipate skills gaps 12-18 months in advance, giving ample time to develop or acquire needed capabilities.

EMPLOYEE ENGAGEMENT
Companies that analyze engagement data and act on insights see 21% higher productivity and 22% higher profitability according to Gallup research.

The key insight: HR analytics transforms HR from a cost center to a strategic partner that directly impacts the bottom line.'),

('11111111-0001-0001-0001-100000000003', '11111111-0001-0001-0001-000000000001', 'The HR Analytics Maturity Model', 3, '15m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'Not all organizations are at the same analytics maturity level. Understanding where you are helps identify the next steps in your analytics journey.

LEVEL 1: OPERATIONAL REPORTING
At this stage, organizations track basic HR metrics like headcount, turnover rate, and time-to-fill. Reports are typically backward-looking and created manually. Most organizations start here.

LEVEL 2: ADVANCED REPORTING
Organizations begin segmenting data and analyzing trends over time. They might compare metrics across departments, locations, or demographics. Dashboards become more common, and HR starts asking "why" questions.

LEVEL 3: STRATEGIC ANALYTICS
At this level, HR uses statistical analysis to understand relationships between variables. For example, analyzing which factors predict employee turnover or what training programs yield the best ROI. This requires more sophisticated tools and analytical skills.

LEVEL 4: PREDICTIVE ANALYTICS
Organizations build models to forecast future outcomes. They can predict which employees are likely to leave, which candidates will be top performers, or where future skills gaps will emerge. Machine learning may be introduced.

LEVEL 5: PRESCRIPTIVE ANALYTICS
The most mature organizations not only predict outcomes but recommend specific actions. The analytics platform might suggest optimal compensation packages, identify the best intervention for at-risk employees, or recommend personalized development plans.

Assessment: Where is your organization on this maturity curve? What would it take to move to the next level?'),

('11111111-0001-0001-0001-100000000004', '11111111-0001-0001-0001-000000000001', 'Essential HR Metrics Overview', 4, '18m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Let''s explore the core metrics every HR professional should know how to calculate and interpret.

WORKFORCE COMPOSITION METRICS
- Headcount: Total number of employees (seems simple, but defining "employee" matters)
- FTE (Full-Time Equivalent): Converts part-time hours to full-time equivalents
- Workforce by Category: Breakdowns by department, location, job level, tenure, demographics

TURNOVER METRICS
- Turnover Rate: (Separations / Average Headcount) × 100
- Voluntary vs. Involuntary Turnover: Important to distinguish—they have different causes and solutions
- Regretted vs. Non-Regretted Turnover: Was the departure a loss to the organization?
- First-Year Turnover: Often indicates hiring or onboarding issues

RECRUITMENT METRICS
- Time to Fill: Days from job posting to offer acceptance
- Time to Hire: Days from application to offer acceptance
- Cost per Hire: (External costs + Internal costs) / Total hires
- Offer Acceptance Rate: Accepted offers / Total offers made
- Quality of Hire: Performance ratings of new hires after 6-12 months

ENGAGEMENT & RETENTION
- Employee Engagement Score: Typically from surveys
- eNPS (Employee Net Promoter Score): "Would you recommend this company?"
- Retention Rate: Employees remaining / Starting headcount

COMPENSATION
- Compa-Ratio: Employee salary / Midpoint of salary range
- Pay Equity Metrics: Comparing pay across demographic groups
- Total Compensation Cost: All-in employee cost including benefits

Remember: Metrics without context are just numbers. Always benchmark against industry standards, historical trends, and organizational goals.'),

('11111111-0001-0001-0001-100000000005', '11111111-0001-0001-0001-000000000001', 'Module 1 Assessment', 5, '15m', 'quiz', NULL, NULL, NULL);

-- Update Module 1 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m1q1",
      "text": "What is the primary difference between HR metrics and HR analytics?",
      "options": [
        {"id": "a", "text": "Metrics track numbers; analytics explains why and predicts what''s next", "isCorrect": true},
        {"id": "b", "text": "There is no difference—they are interchangeable terms", "isCorrect": false},
        {"id": "c", "text": "Metrics are more accurate than analytics", "isCorrect": false},
        {"id": "d", "text": "Analytics is only for large companies", "isCorrect": false}
      ],
      "explanation": "HR metrics tell you what happened (descriptive), while analytics helps you understand why it happened (diagnostic) and what might happen next (predictive/prescriptive)."
    },
    {
      "id": "m1q2",
      "text": "According to research, companies using people analytics can achieve up to what reduction in turnover costs?",
      "options": [
        {"id": "a", "text": "10%", "isCorrect": false},
        {"id": "b", "text": "30%", "isCorrect": true},
        {"id": "c", "text": "50%", "isCorrect": false},
        {"id": "d", "text": "5%", "isCorrect": false}
      ],
      "explanation": "Organizations leveraging people analytics report up to 30% reduction in turnover costs through early identification of at-risk employees."
    },
    {
      "id": "m1q3",
      "text": "At which maturity level do organizations typically start using predictive models?",
      "options": [
        {"id": "a", "text": "Level 1 - Operational Reporting", "isCorrect": false},
        {"id": "b", "text": "Level 2 - Advanced Reporting", "isCorrect": false},
        {"id": "c", "text": "Level 3 - Strategic Analytics", "isCorrect": false},
        {"id": "d", "text": "Level 4 - Predictive Analytics", "isCorrect": true}
      ],
      "explanation": "Predictive analytics, including forecasting models, is characteristic of Level 4 maturity."
    },
    {
      "id": "m1q4",
      "text": "What does the turnover rate formula calculate?",
      "options": [
        {"id": "a", "text": "(New Hires / Headcount) × 100", "isCorrect": false},
        {"id": "b", "text": "(Separations / Average Headcount) × 100", "isCorrect": true},
        {"id": "c", "text": "(Revenue / Employees) × 100", "isCorrect": false},
        {"id": "d", "text": "(Promotions / Headcount) × 100", "isCorrect": false}
      ],
      "explanation": "Turnover rate is calculated by dividing the number of separations by the average headcount during the period, then multiplying by 100."
    },
    {
      "id": "m1q5",
      "text": "Why is distinguishing between voluntary and involuntary turnover important?",
      "options": [
        {"id": "a", "text": "They have different causes and require different solutions", "isCorrect": true},
        {"id": "b", "text": "Involuntary turnover doesn''t count as real turnover", "isCorrect": false},
        {"id": "c", "text": "It only matters for legal compliance", "isCorrect": false},
        {"id": "d", "text": "Voluntary turnover is always positive", "isCorrect": false}
      ],
      "explanation": "Understanding whether employees leave by choice or are terminated helps target interventions—voluntary turnover often indicates engagement or compensation issues, while involuntary may relate to hiring quality or performance management."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0001-100000000005';

-- =====================================================
-- STEP 4: Create Module 2 - Data Collection & Quality
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0002-000000000001', 1000, 'Data Collection & Quality Management', 2, '1h 25m');

-- Module 2 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0002-100000000001', '11111111-0001-0001-0002-000000000001', 'Identifying HR Data Sources', 1, '14m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'HR data exists throughout your organization. Understanding where to find it is the first step to building a robust analytics practice.

CORE HRIS DATA
Your Human Resource Information System is the primary source for employee demographics, job information, employment history, compensation data, and benefits enrollment.

TALENT MANAGEMENT SYSTEMS
Applicant Tracking Systems provide recruitment pipeline data. Performance Management systems track goals and ratings. Learning Management Systems show training completion and certifications.

WORKFORCE TOOLS
Time & Attendance systems track hours worked and absences. Payroll provides actual compensation costs.

ENGAGEMENT & FEEDBACK
Employee surveys, exit interviews, and 360 feedback provide qualitative and quantitative insights.

EXTERNAL DATA
Benchmark data, labor market data, and economic indicators help contextualize internal metrics.

Key challenge: Most organizations have data in silos. Creating a unified analytics view often requires data integration work.'),

('11111111-0001-0001-0002-100000000002', '11111111-0001-0001-0002-000000000001', 'Ensuring Data Quality & Integrity', 2, '16m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'Analytics is only as good as the data behind it. Poor data quality leads to wrong conclusions and eroded trust in HR analytics.

THE FIVE DIMENSIONS OF DATA QUALITY

1. ACCURACY - Is the data correct?
2. COMPLETENESS - Are all required fields populated?
3. CONSISTENCY - Is data uniform across systems?
4. TIMELINESS - Is data up to date?
5. VALIDITY - Does data conform to business rules?

DATA QUALITY IMPROVEMENT STRATEGIES
- Establish data governance with data stewards
- Implement validation at entry
- Regular audits and clean-as-you-go practices
- Document standards with data dictionaries
- Train users on data importance'),

('11111111-0001-0001-0002-100000000003', '11111111-0001-0001-0002-000000000001', 'Leveraging Your HRIS for Analytics', 3, '18m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Your HRIS is likely your most valuable data asset. Common platforms include Workday, SAP SuccessFactors, Oracle HCM Cloud, UKG, ADP, and BambooHR.

BUILT-IN ANALYTICS CAPABILITIES
- Standard Reports for common metrics
- Custom Reports with drag-and-drop builders
- Role-based Dashboards

EXTENDING YOUR HRIS
- Data Exports to Excel or analytics tools
- API Integration with BI tools like Tableau or Power BI
- Data Warehouses for mature analytics needs

TIPS FOR SUCCESS
- Understand what''s possible with vendor training
- Start simple before building custom solutions
- Involve IT for data integration
- Think long-term for scalable architecture'),

('11111111-0001-0001-0002-100000000004', '11111111-0001-0001-0002-000000000001', 'Data Privacy and Compliance', 4, '20m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'HR analytics involves sensitive employee data. Understanding privacy regulations and ethical considerations is essential.

KEY REGULATIONS
- GDPR (EU): Requires lawful basis for processing, data minimization, privacy by design
- CCPA (California): Similar requirements, evolving employee data protections
- Industry-specific: HIPAA, SOX, EEOC considerations

ETHICAL CONSIDERATIONS
- Transparency about data collection and use
- Fairness and bias auditing in algorithms
- Purpose limitation for data use
- Building employee trust through positive interventions

BEST PRACTICES
- Get legal review for analytics initiatives
- Anonymize when possible
- Limit access on need-to-know basis
- Document everything
- Establish ethics review for sensitive models'),

('11111111-0001-0001-0002-100000000005', '11111111-0001-0001-0002-000000000001', 'Module 2 Assessment', 5, '12m', 'quiz', NULL, NULL, NULL);

-- Update Module 2 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m2q1",
      "text": "Which of the following is NOT typically considered a core HRIS data source?",
      "options": [
        {"id": "a", "text": "Employee demographics", "isCorrect": false},
        {"id": "b", "text": "Job and compensation information", "isCorrect": false},
        {"id": "c", "text": "Stock market performance", "isCorrect": true},
        {"id": "d", "text": "Benefits enrollment", "isCorrect": false}
      ],
      "explanation": "Stock market performance is external financial data, not HR data."
    },
    {
      "id": "m2q2",
      "text": "What dimension of data quality asks: Is the data correct?",
      "options": [
        {"id": "a", "text": "Completeness", "isCorrect": false},
        {"id": "b", "text": "Accuracy", "isCorrect": true},
        {"id": "c", "text": "Timeliness", "isCorrect": false},
        {"id": "d", "text": "Consistency", "isCorrect": false}
      ],
      "explanation": "Accuracy refers to whether the data correctly reflects reality."
    },
    {
      "id": "m2q3",
      "text": "What is the maximum penalty for GDPR violations?",
      "options": [
        {"id": "a", "text": "Up to $1 million", "isCorrect": false},
        {"id": "b", "text": "Up to 4% of global revenue", "isCorrect": true},
        {"id": "c", "text": "Up to 1% of global revenue", "isCorrect": false},
        {"id": "d", "text": "Up to $10,000 per violation", "isCorrect": false}
      ],
      "explanation": "GDPR penalties can reach up to 4% of annual global turnover."
    },
    {
      "id": "m2q4",
      "text": "Why is data minimization important in HR analytics?",
      "options": [
        {"id": "a", "text": "It reduces storage costs", "isCorrect": false},
        {"id": "b", "text": "It ensures you only collect data necessary for the stated purpose", "isCorrect": true},
        {"id": "c", "text": "It makes analysis faster", "isCorrect": false},
        {"id": "d", "text": "It is required by all countries", "isCorrect": false}
      ],
      "explanation": "Data minimization is a core GDPR principle requiring collection of only necessary data."
    },
    {
      "id": "m2q5",
      "text": "What is a data steward responsible for?",
      "options": [
        {"id": "a", "text": "Overseeing data quality for assigned data domains", "isCorrect": true},
        {"id": "b", "text": "Building all reports and dashboards", "isCorrect": false},
        {"id": "c", "text": "Managing employee relations", "isCorrect": false},
        {"id": "d", "text": "Approving all data access requests", "isCorrect": false}
      ],
      "explanation": "Data stewards ensure data quality and maintain integrity of specific data domains."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0002-100000000005';

-- =====================================================
-- STEP 5: Create Module 3 - Talent Acquisition Analytics
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0003-000000000001', 1000, 'Talent Acquisition Analytics', 3, '1h 35m');

-- Module 3 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0003-100000000001', '11111111-0001-0001-0003-000000000001', 'Analyzing the Recruitment Funnel', 1, '16m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'The recruitment funnel reveals where your hiring process excels and where it needs improvement.

FUNNEL STAGES: Applications → Resume Screen → Phone Screen → Interview → Offer → Accept

Calculate conversion rates between stages. Compare across recruiters, departments, and roles. Track trends and benchmark against industry standards.

Example: If offer acceptance is 50% vs. 75% industry average, investigate compensation competitiveness, candidate experience, and time-to-offer.'),

('11111111-0001-0001-0003-100000000002', '11111111-0001-0001-0003-000000000001', 'Measuring Source Effectiveness', 2, '18m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Where are your best hires coming from? Track volume, efficiency, and quality metrics by source.

Common sources: Job boards, career sites, referrals, campus recruiting, agencies, social media.

KEY METRICS BY SOURCE:
- Volume: Applications per source
- Efficiency: Time to fill, cost per hire
- Quality: Hire rate, performance ratings, retention

Optimize your source mix based on quality-adjusted cost analysis.'),

('11111111-0001-0001-0003-100000000003', '11111111-0001-0001-0003-000000000001', 'Time-to-Fill vs. Time-to-Hire', 3, '14m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'Time to Fill: Requisition open to offer accepted (process efficiency)
Time to Hire: Application to offer accepted (candidate experience)

Break down into stages to identify bottlenecks. Reduce time with pre-approved job descriptions, candidate pipelines, structured schedules, and competitive compensation.'),

('11111111-0001-0001-0003-100000000004', '11111111-0001-0001-0003-000000000001', 'Defining and Measuring Quality of Hire', 4, '20m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'Quality of hire is the "holy grail" of recruiting metrics.

INDICATORS:
- Performance: Ratings, productivity, goal attainment
- Retention: 90-day, first-year, voluntary turnover
- Engagement: Survey scores, participation

FORMULA: QoH = (Performance + Retention + Manager Satisfaction) / 3

Connect to source data to identify which channels yield highest quality.'),

('11111111-0001-0001-0003-100000000005', '11111111-0001-0001-0003-000000000001', 'Module 3 Assessment', 5, '15m', 'quiz', NULL, NULL, NULL);

-- Update Module 3 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m3q1",
      "text": "What does the offer acceptance rate measure?",
      "options": [
        {"id": "a", "text": "Number of applications received", "isCorrect": false},
        {"id": "b", "text": "Percentage of offers that are accepted by candidates", "isCorrect": true},
        {"id": "c", "text": "Time from offer to start date", "isCorrect": false},
        {"id": "d", "text": "Number of interviews conducted", "isCorrect": false}
      ],
      "explanation": "Offer acceptance rate = Accepted Offers / Total Offers Extended."
    },
    {
      "id": "m3q2",
      "text": "What is the difference between Time to Fill and Time to Hire?",
      "options": [
        {"id": "a", "text": "They measure the same thing", "isCorrect": false},
        {"id": "b", "text": "TTF starts when the job opens; TTH starts when the candidate applies", "isCorrect": true},
        {"id": "c", "text": "TTH is always longer than TTF", "isCorrect": false},
        {"id": "d", "text": "TTF only applies to executive roles", "isCorrect": false}
      ],
      "explanation": "TTF measures process efficiency; TTH measures candidate experience."
    },
    {
      "id": "m3q3",
      "text": "Why might employee referrals show a higher quality of hire?",
      "options": [
        {"id": "a", "text": "Referred candidates are pre-vetted by someone who knows the culture", "isCorrect": true},
        {"id": "b", "text": "Referrals are always the cheapest source", "isCorrect": false},
        {"id": "c", "text": "Referred candidates don''t need interviews", "isCorrect": false},
        {"id": "d", "text": "There is no evidence referrals produce higher quality", "isCorrect": false}
      ],
      "explanation": "Referred candidates often have better cultural fit and realistic expectations."
    },
    {
      "id": "m3q4",
      "text": "What is a limitation of using new hire performance ratings to measure quality of hire?",
      "options": [
        {"id": "a", "text": "Performance ratings are always accurate", "isCorrect": false},
        {"id": "b", "text": "Ratings may vary by manager, making comparison difficult", "isCorrect": true},
        {"id": "c", "text": "New hires never receive performance ratings", "isCorrect": false},
        {"id": "d", "text": "Performance has nothing to do with hiring", "isCorrect": false}
      ],
      "explanation": "Manager rating inconsistency makes quality comparisons challenging."
    },
    {
      "id": "m3q5",
      "text": "If Time to Fill is acceptable but offer acceptance rate is low, what should you investigate?",
      "options": [
        {"id": "a", "text": "Whether job postings are reaching enough candidates", "isCorrect": false},
        {"id": "b", "text": "Whether compensation is competitive and the candidate experience is positive", "isCorrect": true},
        {"id": "c", "text": "Whether the hiring manager is available for interviews", "isCorrect": false},
        {"id": "d", "text": "Whether the HRIS is properly configured", "isCorrect": false}
      ],
      "explanation": "Low offer acceptance suggests issues at the offer stage—compensation or experience problems."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0003-100000000005';

-- =====================================================
-- STEP 6: Create Module 4 - Retention & Turnover Analytics
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0004-000000000001', 1000, 'Retention & Turnover Analytics', 4, '1h 40m');

-- Module 4 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0004-100000000001', '11111111-0001-0001-0004-000000000001', 'Deep Dive into Turnover Analysis', 1, '18m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Turnover is one of the most impactful HR metrics.

TYPES: Voluntary vs. Involuntary, Regretted vs. Non-Regretted

ANALYSIS TECHNIQUES:
- Trend analysis over time
- Cohort analysis by hire date
- Segmentation by department, tenure, manager
- Exit interview analysis

COST OF TURNOVER: 50-200% of annual salary including direct and indirect costs.'),

('11111111-0001-0001-0004-100000000002', '11111111-0001-0001-0004-000000000001', 'Building Attrition Prediction Models', 2, '22m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'Predict which employees are at risk of leaving before they start interviewing.

COMMON FEATURES: Tenure, time since promotion, salary vs. market, performance ratings, engagement scores, behavioral signals.

APPROACHES: Logistic regression (simple), machine learning (advanced).

Use ethically—for development and retention interventions, not surveillance or termination.'),

('11111111-0001-0001-0004-100000000003', '11111111-0001-0001-0004-000000000001', 'Connecting Engagement to Retention', 3, '16m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'Link engagement survey data to retention outcomes.

eNPS = % Promoters (9-10) - % Detractors (0-6)

Common finding: Strong manager relationships are the #1 retention driver.

Use engagement data to identify at-risk populations, target interventions, and track progress.'),

('11111111-0001-0001-0004-100000000004', '11111111-0001-0001-0004-000000000001', 'Stay Interview Analysis', 4, '14m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Stay interviews are proactive—you can still act on the feedback to retain the employee.

KEY QUESTIONS: What keeps you engaged? Why do you stay? What might cause you to leave?

Analyze themes, track sentiment, and connect to other data. Act at individual, team, and organization levels.'),

('11111111-0001-0001-0004-100000000005', '11111111-0001-0001-0004-000000000001', 'Module 4 Assessment', 5, '12m', 'quiz', NULL, NULL, NULL);

-- Update Module 4 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m4q1",
      "text": "What is the difference between regretted and non-regretted turnover?",
      "options": [
        {"id": "a", "text": "Regretted is the loss of valued employees; non-regretted is loss of underperformers", "isCorrect": true},
        {"id": "b", "text": "Regretted is voluntary; non-regretted is involuntary", "isCorrect": false},
        {"id": "c", "text": "They are the same thing", "isCorrect": false},
        {"id": "d", "text": "Regretted turnover is always preventable", "isCorrect": false}
      ],
      "explanation": "Regretted turnover is the loss of high-performing or critical employees."
    },
    {
      "id": "m4q2",
      "text": "What is a common finding about the relationship between manager quality and retention?",
      "options": [
        {"id": "a", "text": "Managers have little impact on turnover", "isCorrect": false},
        {"id": "b", "text": "Strong manager relationships are the #1 driver of retention", "isCorrect": true},
        {"id": "c", "text": "Compensation always matters more than managers", "isCorrect": false},
        {"id": "d", "text": "Only senior employees care about their manager", "isCorrect": false}
      ],
      "explanation": "People leave managers, not companies."
    },
    {
      "id": "m4q3",
      "text": "What is the main advantage of stay interviews over exit interviews?",
      "options": [
        {"id": "a", "text": "Stay interviews are shorter", "isCorrect": false},
        {"id": "b", "text": "You can still act on the feedback to retain the employee", "isCorrect": true},
        {"id": "c", "text": "Exit interviews are not useful", "isCorrect": false},
        {"id": "d", "text": "Stay interviews are only for high performers", "isCorrect": false}
      ],
      "explanation": "Stay interviews are proactive—feedback is actionable before departure."
    },
    {
      "id": "m4q4",
      "text": "What is eNPS and how is it calculated?",
      "options": [
        {"id": "a", "text": "Employee Net Promoter Score: % Promoters minus % Detractors", "isCorrect": true},
        {"id": "b", "text": "Engagement Net Performance Score: Total engagement divided by headcount", "isCorrect": false},
        {"id": "c", "text": "Employee Number of Performance Stars: Average rating times 10", "isCorrect": false},
        {"id": "d", "text": "Exit Numbers Per Sector: Turnover by department", "isCorrect": false}
      ],
      "explanation": "eNPS = % Promoters (9-10) minus % Detractors (0-6)."
    },
    {
      "id": "m4q5",
      "text": "What is a common use of cohort analysis in turnover analytics?",
      "options": [
        {"id": "a", "text": "Comparing turnover rates of employee groups by hire date", "isCorrect": true},
        {"id": "b", "text": "Tracking individual employee performance", "isCorrect": false},
        {"id": "c", "text": "Calculating cost per hire", "isCorrect": false},
        {"id": "d", "text": "Measuring time to fill", "isCorrect": false}
      ],
      "explanation": "Cohort analysis groups employees by hire date to track retention curves."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0004-100000000005';

-- =====================================================
-- STEP 7: Create Module 5 - Compensation & Pay Equity
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0005-000000000001', 1000, 'Compensation & Pay Equity Analytics', 5, '1h 30m');

-- Module 5 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0005-100000000001', '11111111-0001-0001-0005-000000000001', 'Compensation Analytics Fundamentals', 1, '16m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'KEY METRICS:
- Compa-Ratio: Salary / Range Midpoint
- Range Penetration: Position within the full range
- Market Ratio: Salary / Market 50th percentile

TOTAL COMPENSATION = Base + Variable + LTI + Benefits Value

COMMON ANALYSES: Market competitiveness, internal equity, cost modeling, pay-for-performance alignment.'),

('11111111-0001-0001-0005-100000000002', '11111111-0001-0001-0005-000000000001', 'Pay Equity Analysis', 2, '20m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'Pay equity is both a legal requirement and ethical imperative.

UNADJUSTED GAP: Raw average difference between groups
ADJUSTED GAP: Controlling for legitimate factors (job, experience, location)

Use multiple regression analysis to isolate unexplained disparities. Conduct regular analysis, use external experts, and focus on systemic causes.'),

('11111111-0001-0001-0005-100000000003', '11111111-0001-0001-0005-000000000001', 'Total Rewards Analytics', 3, '18m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'Employees value the complete package: Compensation, Benefits, Work-Life, Development, Recognition.

ANALYTICS: Benefits utilization, cost analysis, ROI analysis, preference analysis.

Optimize by investing in valued benefits, reducing underutilized ones, and communicating total rewards value effectively.'),

('11111111-0001-0001-0005-100000000004', '11111111-0001-0001-0005-000000000001', 'Compensation Planning and Modeling', 4, '16m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'ANNUAL CYCLE: Budget setting → Manager allocation → Individual recommendations → Calibration → Communication

ANALYTICS SUPPORT: Budget modeling, guideline development (merit matrix), scenario analysis, calibration support.

Consider long-term impacts on turnover, compression, and hiring ability.'),

('11111111-0001-0001-0005-100000000005', '11111111-0001-0001-0005-000000000001', 'Module 5 Assessment', 5, '12m', 'quiz', NULL, NULL, NULL);

-- Update Module 5 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m5q1",
      "text": "What does a compa-ratio of 0.85 indicate?",
      "options": [
        {"id": "a", "text": "The employee is paid 15% below the salary range midpoint", "isCorrect": true},
        {"id": "b", "text": "The employee is paid 15% above market", "isCorrect": false},
        {"id": "c", "text": "The employee is a high performer", "isCorrect": false},
        {"id": "d", "text": "The employee has 85% of their range left for growth", "isCorrect": false}
      ],
      "explanation": "Compa-ratio = Salary / Midpoint. 0.85 means 15% below midpoint."
    },
    {
      "id": "m5q2",
      "text": "What is the difference between unadjusted and adjusted pay gaps?",
      "options": [
        {"id": "a", "text": "Unadjusted is the raw difference; adjusted controls for legitimate pay factors", "isCorrect": true},
        {"id": "b", "text": "Adjusted gaps are always smaller than unadjusted", "isCorrect": false},
        {"id": "c", "text": "Unadjusted gaps are illegal; adjusted gaps are acceptable", "isCorrect": false},
        {"id": "d", "text": "There is no meaningful difference", "isCorrect": false}
      ],
      "explanation": "Adjusted gap controls for legitimate factors to isolate unexplained disparities."
    },
    {
      "id": "m5q3",
      "text": "Why is benefits utilization analysis valuable?",
      "options": [
        {"id": "a", "text": "It reveals which benefits employees actually use and value", "isCorrect": true},
        {"id": "b", "text": "It determines employee salaries", "isCorrect": false},
        {"id": "c", "text": "It is required by law", "isCorrect": false},
        {"id": "d", "text": "It replaces the need for surveys", "isCorrect": false}
      ],
      "explanation": "Understanding utilization helps optimize benefits investment."
    },
    {
      "id": "m5q4",
      "text": "What is a merit matrix used for in compensation planning?",
      "options": [
        {"id": "a", "text": "Determining increase percentages based on performance and current position in range", "isCorrect": true},
        {"id": "b", "text": "Tracking employee attendance", "isCorrect": false},
        {"id": "c", "text": "Setting benefits enrollment dates", "isCorrect": false},
        {"id": "d", "text": "Calculating turnover rates", "isCorrect": false}
      ],
      "explanation": "Merit matrix provides increase guidelines at the intersection of performance and range position."
    },
    {
      "id": "m5q5",
      "text": "What statistical method is commonly used for pay equity analysis?",
      "options": [
        {"id": "a", "text": "Simple averages", "isCorrect": false},
        {"id": "b", "text": "Multiple regression analysis", "isCorrect": true},
        {"id": "c", "text": "Time series analysis", "isCorrect": false},
        {"id": "d", "text": "Monte Carlo simulation", "isCorrect": false}
      ],
      "explanation": "Multiple regression controls for multiple legitimate factors simultaneously."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0005-100000000005';

-- =====================================================
-- STEP 8: Create Module 6 - Reporting & Visualization
-- =====================================================
INSERT INTO modules (id, course_id, title, "order", duration) VALUES
('11111111-0001-0001-0006-000000000001', 1000, 'Reporting & Data Visualization', 6, '1h 25m');

-- Module 6 Lessons
INSERT INTO lessons (id, module_id, title, "order", duration, type, mux_playback_id, video_url, content) VALUES
('11111111-0001-0001-0006-100000000001', '11111111-0001-0001-0006-000000000001', 'Designing Effective HR Dashboards', 1, '18m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'DESIGN PRINCIPLES: Know your audience, less is more (5-7 metrics max), visual hierarchy, context is king.

DASHBOARD TYPES: Executive (KPIs, trends), Talent Acquisition (funnel, sources), Workforce Planning (headcount, succession).

TOOLS: Tableau, Power BI, Looker, HRIS built-in dashboards.'),

('11111111-0001-0001-0006-100000000002', '11111111-0001-0001-0006-000000000001', 'Data Visualization Best Practices', 2, '16m', 'video',
 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs',
 'CHART TYPES:
- Comparison: Bar charts
- Composition: Pie (2-4 segments), stacked bars
- Trend: Line charts
- Relationship: Scatter plots
- Distribution: Histograms, box plots

AVOID: Non-zero Y-axis, 3D charts, too many colors, wrong chart types, chart junk.'),

('11111111-0001-0001-0006-100000000003', '11111111-0001-0001-0006-000000000001', 'Storytelling with HR Data', 3, '20m', 'video',
 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00', 'Wtx00gP2Vow01aWBp7v02DJMYDfj4O9RKQnIJQSLh9Pw00',
 'STORYTELLING FRAMEWORK: Hook (why care) → Context (situation) → Insight (finding) → Evidence (data) → Action (recommendation)

FOR EXECUTIVES: Lead with the answer, keep it brief, connect to strategic priorities, be confident but honest about limitations.'),

('11111111-0001-0001-0006-100000000004', '11111111-0001-0001-0006-000000000001', 'Communicating Insights to Stakeholders', 4, '14m', 'video',
 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M', 'qxb01SJoRrC02cYuv9rCBQ4vV01RQKT5x2W2FGE2fKV68M',
 'TAILOR TO AUDIENCE:
- C-Suite: Business impact, 1-page summaries
- HR Leadership: Operational metrics, dashboards
- Line Managers: Team-specific, actionable
- Employees: Transparent, accessible

BUILD A CADENCE: Annual strategy review, quarterly talent review, monthly operations, weekly HR team, real-time alerts.'),

('11111111-0001-0001-0006-100000000005', '11111111-0001-0001-0006-000000000001', 'Module 6 Assessment', 5, '12m', 'quiz', NULL, NULL, NULL);

-- Update Module 6 Quiz Data
UPDATE lessons SET quiz_data = '{
  "passingScore": 70,
  "questions": [
    {
      "id": "m6q1",
      "text": "What is the recommended maximum number of metrics on a single dashboard?",
      "options": [
        {"id": "a", "text": "10-15 metrics", "isCorrect": false},
        {"id": "b", "text": "5-7 metrics", "isCorrect": true},
        {"id": "c", "text": "20+ metrics", "isCorrect": false},
        {"id": "d", "text": "Just 1-2 metrics", "isCorrect": false}
      ],
      "explanation": "5-7 metrics prevents cognitive overload and maintains focus."
    },
    {
      "id": "m6q2",
      "text": "Which chart type is best for showing change over time?",
      "options": [
        {"id": "a", "text": "Pie chart", "isCorrect": false},
        {"id": "b", "text": "Bar chart", "isCorrect": false},
        {"id": "c", "text": "Line chart", "isCorrect": true},
        {"id": "d", "text": "Scatter plot", "isCorrect": false}
      ],
      "explanation": "Line charts visually connect data points to show progression and direction."
    },
    {
      "id": "m6q3",
      "text": "What is a common visualization mistake that makes changes look more dramatic?",
      "options": [
        {"id": "a", "text": "Starting the Y-axis at a non-zero value", "isCorrect": true},
        {"id": "b", "text": "Using too few colors", "isCorrect": false},
        {"id": "c", "text": "Including a legend", "isCorrect": false},
        {"id": "d", "text": "Adding gridlines", "isCorrect": false}
      ],
      "explanation": "Truncating the Y-axis exaggerates differences and can mislead viewers."
    },
    {
      "id": "m6q4",
      "text": "When presenting HR analytics to executives, you should:",
      "options": [
        {"id": "a", "text": "Lead with the methodology and data sources", "isCorrect": false},
        {"id": "b", "text": "Lead with the answer and business impact", "isCorrect": true},
        {"id": "c", "text": "Include all available data for completeness", "isCorrect": false},
        {"id": "d", "text": "Avoid making any recommendations", "isCorrect": false}
      ],
      "explanation": "Executives want answers and business implications first."
    },
    {
      "id": "m6q5",
      "text": "What is the data ink ratio principle?",
      "options": [
        {"id": "a", "text": "Maximize the ratio of ink used for data vs. decoration", "isCorrect": true},
        {"id": "b", "text": "Use at least 50% of the page for text", "isCorrect": false},
        {"id": "c", "text": "Print all reports in color", "isCorrect": false},
        {"id": "d", "text": "Include company logo on every chart", "isCorrect": false}
      ],
      "explanation": "Every mark should represent data—remove unnecessary decoration."
    }
  ]
}'::jsonb WHERE id = '11111111-0001-0001-0006-100000000005';

-- =====================================================
-- STEP 9: Create Resources for the Course
-- =====================================================
INSERT INTO resources (id, course_id, title, type, url, size) VALUES
('11111111-0001-0001-0001-200000000001', 1000, 'HR Analytics Framework Guide', 'PDF', 'https://drive.google.com/file/d/example1/view', '2.4 MB'),
('11111111-0001-0001-0001-200000000002', 1000, 'HR Metrics Calculator Spreadsheet', 'XLS', 'https://drive.google.com/file/d/example2/view', '1.8 MB'),
('11111111-0001-0001-0001-200000000003', 1000, 'Dashboard Design Templates', 'PDF', 'https://drive.google.com/file/d/example3/view', '5.2 MB'),
('11111111-0001-0001-0001-200000000004', 1000, 'Pay Equity Analysis Checklist', 'PDF', 'https://drive.google.com/file/d/example4/view', '890 KB'),
('11111111-0001-0001-0001-200000000005', 1000, 'Turnover Analysis Template', 'XLS', 'https://drive.google.com/file/d/example5/view', '1.2 MB'),
('11111111-0001-0001-0001-200000000006', 1000, 'Engagement Survey Question Bank', 'PDF', 'https://drive.google.com/file/d/example6/view', '1.5 MB'),
('11111111-0001-0001-0001-200000000007', 1000, 'Data Storytelling Playbook', 'PDF', 'https://drive.google.com/file/d/example7/view', '3.1 MB'),
('11111111-0001-0001-0001-200000000008', 1000, 'HR Analytics Case Studies Collection', 'PDF', 'https://drive.google.com/file/d/example8/view', '4.8 MB')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Summary: HR Analytics Fundamentals Course
-- =====================================================
-- Course ID: 1000
-- Title: HR Analytics Fundamentals
-- Author: Dr. Sarah Mitchell
-- Duration: 8h 30m
-- Modules: 6
-- Lessons: 24 video lessons + 6 quizzes = 30 total
-- Resources: 8 downloadable files
-- Credits: SHRM + HRCI + REQUIRED
-- =====================================================
