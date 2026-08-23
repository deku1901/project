# ExaGoal — Intelligent Exaination Infrastructure

## 🚀 About the Project

**ExaGoal** is an intelligent Examination platform that connects learner context with institutional objectives to create transparent, configurable, validated, and trustworthy assessments.

Instead of treating assessment generation as a simple **Prompt → AI → Questions** workflow, ExaGoal connects **learner context, institutional objectives, no-code configuration, AI-assisted generation, validation, review, and approval** in one assessment workflow.

## 🎯 For Whom is it Made?

ExaGoal serves two primary groups:

1. **Students / Learners:** Learners benefit from assessments that can consider relevant learning state, performance, history, preferences, and verified evidence instead of treating every learner as identical.

2. **Faculty, Administrators & Institutions:** Educators and institutions can configure Exainations without coding, define objectives and constraints, generate assessment drafts, validate them, review them, approve them, and maintain a traceable assessment history.

## 💡 What Problem Does it Solve?

Traditional Exaination creation is complex and often requires educators to manually balance syllabus coverage, learning outcomes, difficulty, question types, marks, duration, and Exaination rules. At the same time, AI-generated assessments can make important generation decisions difficult to control or understand.

**ExaGoal solves this by:**

- **No-Code Configuration:** Faculty and administrators can change meaningful Exaination parameters without modifying the underlying software.
- **Learner–Institution Context:** Relevant learner state is combined with institutional objectives and Exaination requirements.
- **AI-Assisted Generation:** AI helps generate assessment content based on the configured context and requirements.
- **Validation & Quality Assurance:** Generated assessments are checked for constraints, coverage, quality, difficulty, and feasibility.
- **Review & Approval:** Faculty and institutional reviewers can review, edit, approve, and lock the final assessment.
- **Transparency & Traceability:** Configuration, generation, validation, review, and approval history remain visible and traceable.

## 🛠️ Features

- **No-Code Assessment Configuration:** Configure difficulty, Bloom's level, question types, marks, syllabus coverage, weights, constraints, and rules without changing code.
- **Learner State:** Maintain a relevant representation of learner context derived from available evidence.
- **Institutional Context:** Use courses, outcomes, syllabus, question banks, Exaination rules, and institutional requirements.
- **AI-Assisted Exa Generation:** Generate candidate assessments using learner and institutional context.
- **Constraint-Aware Validation:** Validate hard and soft constraints before final approval.
- **Question Intelligence:** Evaluate objective alignment, difficulty, estimated time, duplication, and assessment quality.
- **Review & Approval Workflow:** Faculty and panels can review, edit, annotate, approve, and lock assessments.
- **Configuration & Generation History:** Track configuration versions, generated outputs, validation results, and review actions.
- **Digital & Physical Exaination Support:** Support controlled digital delivery and institution-specific physical Exaination paper workflows.

## ⚙️ Setup & Installation

Follow these steps to run ExaGoal locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Python 3.10+
- npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd ExaGoal
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the frontend and configure the required services.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

*Built by the Team TANKPREET034-UMAl6307*
