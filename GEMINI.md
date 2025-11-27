# GEMINI.md

# PROJECT CONTEXT: [EnhancedHR.ai](http://enhancedhr.ai/)

## Primary Objective

An AI-enhanced learning platform that enables HR professionals to acquire knowledge, learn critical skills and easily earn and track recertification credits for SHRM and HRCI certifications.

The core of this experience are online courses, built by expert authors we have recruited. We want to provide a simple course experience (with the basic online learning features).

We want to further enrich those courses with AI assistants who can provide added value by converting standard course content into an interactive, highly tailored experience, and by providing an alternative learning experience for those who don’t just want to sit and watch a video.

## Overview

We are building an online academy called EnhancedHR.ai. 

The primary audience are HR professionals, and the secondary audience is for leaders and managers.

The Basic objectives of the platform are:

- Provide a growing inventory of high-quality courses, authored by experts and delivered in a traditional online learning interface.
- Enrich the course experience with an AI Course Assistant, trained on the content of the course, providing the learner with a conversational interface to ask questions, learn course material, and apply that knowledge to their jobs.
- Enrich the course experience with an AI Tutor, trained on the course materials, who tutors the learner for a more individualized, AI-driven learning experience.
- Simplify their recertification process by making it easy to find certification-qualifying courses, take those courses, and access their recertification credits (SHRM professional development credits and HRCI recertification credits).
- Provide individual-level purchasing and access.
- Provide organizational-level purchasing, with the ability to grant employee access, billed on a per-employee-per-month basis.
- Allow organizations to easily track usage and see the ROI on their investment.

## Founder's Vision (The "Why")

We are building [EnhancedHR.ai](http://enhancedhr.ai/) because we believe "HR" needs to evolve into "Human Relevance."

HR professionals and leaders have to prioritize continuous learning to stay relevant themselves. Most are also required to take a earn a certain amount of professional development or rectification credits to maintain their certifications. On top of these already pressing needs, most are dealing with a high degree of career uncertainty. They see the potential of AI to massively disrupt their jobs, and the jobs of their people. Our mission is to provide expert-quality content to help them learn, adapt, and do their best work in a modern-looking, refreshingly easy-to use, AI-enriched online learning platform. 

## **The Core Experience:**

We are differentiating by blending traditional courses (which they need for SHRM/HRCI credits) with a radically new AI experience.

1. **The Assistant:** They can chat with any course. "Hey, what did the instructor say about conflict resolution?"
2. **The Tutor:** This is the magic. The AI shouldn't just answer; it should teach. It should know who the user is (their role, their company culture) and guide them socratic-style.

## The User (Who we serve)

Our users are the "little guys"—HR professionals and leaders in SMB (100-2,000 employees). They can't afford big enterprise tools. They are practical. They don't want academic theory; they want to know "How do I handle this termination meeting tomorrow?" or "How do I use ChatGPT to write this policy?"

- **Treat them with:** Respect, empathy, and clarity.
- **Avoid:** Jargon, condescension, or overly complex "tech" interfaces.

## Technical Stack (Strict Rules)

- **Frontend:** Next.js 16 (App Router) + React.
- **Styling:** Tailwind CSS (Modern, Clean).
- **Backend:** Supabase (Auth, DB, Vector, Edge Functions).
- **Video Streaming:** Mux (for precise watch-time tracking).
- **Email:** Resend (Transactional emails).
- **Payments:** Stripe (Per-seat billing).

## Product Identity & Mission

- **Product Name:** [EnhancedHR.ai](http://enhancedhr.ai/)
- **Primary Tagline:** World-Class Learning
- Secondary Tagline: Powerful Courses For Leaders and HR, Created and Delivered by Humans in an AI-Powered Platform”.
- **Core Philosophy:** "Human Relevance." AI should augment, not replace. Humans + AI = Maximum Value.
- **Target Audience:**
    - **Primary:** HR Professionals (SMB focus, 100-2,000 employees).
    - **Secondary:** Organizational Leaders/Managers.
    - **User Persona:** Seeking actionable skills to remain relevant and guide their workforce through transformation.
- **Differentiation:**
    - **VS. Traditional (Udemy/LinkedIn):** Higher quality, curated, niche-specific.
    - **VS. Industry (SHRM/HRCI):** Modern UI, AI-native (not just AI-wrapper), forward-thinking philosophy.
    - **VS. Competitors (Galileo/Bersin):** Accessible pricing for SMBs, practical/tactical focus rather than academic/enterprise.

## The Solution: AI-Enhanced Learning Platform

A dual-layer platform providing (1) Standard Certification Courses and (2) Deep AI Interactivity.

### A. The "Human Relevance" Engine (The Why)

- The platform (and the AI Assistants) acts as a thought leader, arming HR with the language and arguments to defend and elevate human value in the boardroom.
- Content focuses on: Leadership, Communication, People Management, and AI Up-skilling.

### B. Core Learning Features (The What)

- **Recertification Engine:** Streamlined discovery and tracking of SHRM/HRCI credits (critical value hook).
- **Expert Authors:** Content is sourced from external experts (Pluralsight model).
- **Author Compensation:** Hybrid model. Paid based on time-viewed + attribution when their content is referenced by RAG agents.

## The AI Architecture (The "Secret Sauce")

The platform differentiates through three distinct AI Agent interactions:

### I. The AI Course Assistant (Course-Specific)

- **Scope:** The primary context is the course material (a full video transcript plus additionally uploaded course material), but the Agent can access General AI knowledge to help the user synthesize and apply the content of the course.
- **Function:** Reactive Q&A.
- **User Actions:** Ask for summaries, query specific topics, "where did they mention X?", retrieve highlights, direct the user to key points in the course for more.

### II. The AI Course Tutor (User-Specific)

- **Scope:** The same as the Course Assistant + User Profile.
- **Function:** Proactive & Socratic.
- **Behavior:**
    - Assesses user knowledge gap.
    - Learns user context (Role, Company Culture, Experience Level).
    - Constructs custom learning paths within the course.
    - **Memory:** Writes user insights to the Global User Profile to reduce repetition in future courses.

### III. The Platform Agent (Global Context)

- **Scope:** Global (All Courses + User Profile + General AI Knowledge).
- **Function:** Just-in-Time Knowledge & Personal Tutor.
- **Behavior:**
    - "Don't make me search." User asks a broad question; Agent synthesizes answers from *any* course.
    - Main objective is to determine the user’s need, and draw first on platform material, augmented with general training data to help them accomplish this.
    - References courses and proactively directs the user to the right place in those courses for more information.

## Design & User Experience Guidelines

Note: Details, definitions and requirements for the user interface and user experience can be found in User_Interface.md.

- **Aesthetic:** "Modern, Beautiful, Innovative, High-Tech."
- **Anti-Pattern:** Avoid the "stale, corporate LMS" look (e.g., Moodle/Blackboard vibes).
- **Vibe:** High-end consumer tech (clean, spacious, sophisticated typography) meets professional warmth.
- **UX Priority:** Frictionless certification tracking. The AI should feel like a companion, not a pop-up bot.

## Constraint Levels (Instruction to Agent)

When reading the PRDs, apply these logic levels:

- **[CONSTRAINT: STRICT]:** Follow the logic exactly. Do not deviate. (Used for: Billing, Credits, Certification Math, Data Schema).
- **[CONSTRAINT: FLEXIBLE]:** The goal is the priority, but the implementation is open to your creativity. (Used for: UI components, Layouts, Animations).

## Brand & Design Guidelines

- **Aesthetic:** "Modern, Innovative, high-tech."
- Powerful use of subtle background gradients and animation effects to make the site feel more “alive”.
- **Colors**
    - 78C0F0
    - 054C74
    - 052333
    - 0A0D12
    - FF9300
    - FF2600

## IMPORTANT

Within these instructions and PRD’s, there will be references to other PRD files. Sometimes, in the reference these file names have spaces, which have been replaced with an underscore (”_”) in the actual file name.

For instance, a reference to “User Dashboard.md” the actual file may be “User_Dashboard.md”.

All of the PRD’s are stored as .md files in /docs.