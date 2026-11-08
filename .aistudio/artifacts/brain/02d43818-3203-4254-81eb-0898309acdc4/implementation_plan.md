# Question Paper Import (PDF / CSV / TXT / JSON) & Dual-Mode Post-Publish Preview Workflow

Enable faculty and administrators to upload question papers directly from **PDF, CSV/TXT, or JSON files** (or downloadable sample templates), review and edit the extracted questions in an interactive staging table, preview the exact question paper in **both Official Panimalar Printable Paper format and Live Student Exam Screen view**, and publish the examination to students in one unified flow.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during clarification and govern this implementation:

- **Confirmed Decision 1 — Multi-Format Question Paper Import**: Support **PDF (`.pdf`), CSV/TXT (`.csv`, `.txt`), and JSON (`.json`)** question paper uploads, plus a one-click sample question paper template generator so faculty can test or author papers effortlessly.
- **Confirmed Decision 2 — Interactive Review & Edit Before Saving/Publishing**: Uploaded files are parsed into an **Interactive Staging & Review Table** where faculty can inspect, edit question prompts/options/marks/type/answer keys, add or remove items, and choose the target examination before committing to the Question Bank.
- **Confirmed Decision 3 — Dual-Mode Question Paper Preview (Before & After Publishing)**: Provide a unified **Question Paper Preview & Publish Modal** with two switchable tabs:
  1. **Official Printable Question Paper View**: Formatted university question paper with Panimalar Engineering College header, Part A (MCQ), Part B (Descriptive Theory), Part C (Programming & Test Cases), optional Confidential Answer Key toggle, and 1-click Print / Download Question Paper.
  2. **Live Student Exam Screen View**: Interactive simulation of what students see inside the proctored ExamFlow arena after the exam is published (question palette, timer header, MCQ selector, descriptive response box, and multi-language code sandbox preview), plus a 1-click **Publish Exam to Students** button.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the Question Bank from a single-question manual form into an end-to-end **Import → Review & Edit → Preview (Paper & Student Screen) → Publish** pipeline.
- **Target Audience / Persona**: University examination controllers and course faculty in the Department of AI & Data Science preparing semester assessments, technical skill tests, and coding exams.
- **Key Value**: Eliminates tedious one-by-one question entry by allowing faculty to drop in an existing PDF/TXT/CSV/JSON question paper, verify every parsed question, and see both the printable university question paper and the exact student exam interface before and after publishing.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Step 1 — Upload or Load Sample Question Paper (`Import Question Paper` Modal)**:
     - Faculty click **"Import Question Paper (PDF / CSV / JSON)"** in the Question Bank header (or on any Exam card).
     - They select the target Examination (e.g., *Technical skill - 1* or any created exam) and drop a `.pdf`, `.txt`, `.csv`, or `.json` file—or click **"Load Sample PDF/Text Question Paper"** or **"Download Sample Template"** to see the structured format (`Q1.`, `A)`, `B)`, `C)`, `D)`, `Answer:`, `Marks:`, `Type: MCQ | Descriptive | Programming`).
  2. **Step 2 — Interactive Staging, Review & Inline Editing**:
     - Extracted questions immediately populate an interactive review list showing total questions parsed and total marks calculated.
     - Faculty can inline-edit any question's type (`MCQ`, `Descriptive`, `Programming`), marks, difficulty, question prompt, MCQ options & correct answer radio button, rubric, or programming language/test cases, or delete unwanted rows.
  3. **Step 3 — Dual-Mode Question Paper Preview (`Official Paper` vs. `What Students See After Publish`)**:
     - Before or after saving/publishing, faculty can switch directly into the **Question Paper Preview** studio:
       - **Tab 1 — Official Printable Question Paper (PDF/Print Format)**: Clean white/ivory academic sheet displaying the Panimalar Engineering College banner, course metadata, candidate roll-number boxes, structured Part A / Part B / Part C sections, Answer Key reveal toggle, and **Print / Save as PDF** action.
       - **Tab 2 — Student Exam Arena Preview (Post-Publish View)**: Shows the exact live student interface (`STRICT LOCKDOWN PREVIEW`, question navigation palette, randomized order badge, interactive question card, and coding editor) so faculty know with 100% certainty what candidates will see once published.
  4. **Step 4 — Save to Question Bank & 1-Click Publish**:
     - Faculty can click **"Save Questions to Bank"** or **"Save & Publish Exam Now"**, which imports all reviewed questions, updates the exam's total marks automatically, sets the exam status to `Published`, and shows a confirmation banner with a direct button to reopen the Post-Publish Preview at any time.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast SaaS control center in the Admin Arena (`#0E1132` cards, violet/cobalt accents) paired with a crisp, print-accurate white academic paper sheet (`#FFFFFF` surface, `#0F172A` typography) inside the Official Question Paper preview.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` / system sans for question prompts and options; `JetBrains Mono` (`font-mono tabular-nums`) for marks weightages, question counters, timers, and programming test cases.
  - *Component Styling & Layout*: Step progress indicator at the top of the Import & Preview modal (`1. Upload File → 2. Review & Edit Questions → 3. Preview Paper & Publish`), keeping every action accessible without leaving the Question Bank.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Client-Side Smart Question Paper Parser (PDF + Structured Text + CSV + JSON)**:
  - *Chosen Approach*: Implement a dedicated client-side parser utility that extracts text streams from uploaded PDF files (handling both standard PDF text operators and structured text/CSV/JSON files) and automatically detects question numbers (`Q1.`, `1.`, `Question 1:`), marks (`[10 Marks]`, `(5 pts)`), question types (`MCQ`, `Descriptive`, `Programming`), options (`A)`, `(A)`, `a.`), correct answers (`Answer: B`), and coding test cases.
  - *Why*: Works instantaneously in the browser with zero external API latency or server upload bottlenecks, and pairs with the interactive review table so faculty have full control over the final questions.
- **Decision 2 — Dual-Mode Preview Accessible from Both Question Bank & Exam Management**:
  - *Chosen Approach*: Place a **"Preview Question Paper"** button directly in the Question Bank filter bar and on every Exam card in Exam Management, supporting both the **Official Printable Paper** and **Student Post-Publish Exam Screen** modes.
  - *Why*: Lets administrators inspect what an exam looks like both before publishing (`Draft`) and after publishing (`Published` / `Results Published`).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Question Bank & Exam Management Arena                    │
├─────────────────────────────────────┬──────────────────────────────────────┤
│   QuestionPaperImportModal          │     QuestionPaperPreviewModal        │
│  ┌───────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ 1. File Dropzone & Templates  │  │  │ Mode Switcher:                 │  │
│  │    (.pdf, .csv, .txt, .json)  │  │  │  • Official Printable Paper    │  │
│  └──────────────┬────────────────┘  │  │  • Live Student Exam View      │  │
│                 ▼                   │  └───────────────┬────────────────┘  │
│  ┌───────────────────────────────┐  │                  ▼                   │
│  │ 2. Smart Question Parser      │  │  ┌────────────────────────────────┐  │
│  │    (MCQ / Theory / Coding)    │  │  │ • Print / Download Paper (PDF) │  │
│  └──────────────┬────────────────┘  │  │ • Answer Key Toggle            │  │
│                 ▼                   │  │ • Interactive Question Stepper │  │
│  ┌───────────────────────────────┐  │  │ • 1-Click Publish Exam Button  │  │
│  │ 3. Interactive Review & Edit  │  │  └───────────────┬────────────────┘  │
│  │    Staging Table              │  │                  │                   │
│  └──────────────┬────────────────┘  │                  │                   │
│                 └───────────────────┴──────────────────┘                   │
│                                     │                                      │
│                                     ▼                                      │
│                 examStore (bulkAddQuestions + updateExam)                  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Add a batch method `examStore.addQuestionsBulk(examId, questions)` that appends all reviewed questions in a single transaction, recalculates the target exam's `totalMarks` and `passingMarks`, logs the import activity, and optionally transitions the exam status from `Draft` to `Published`.
- **Interactive Component & State Mapping**:
  - **Upload Step**: Drag-and-drop or file picker reads `.pdf` (binary ArrayBuffer parsed for PDF text blocks and streams + clean fallback), `.csv`, `.txt`, or `.json` files, or loads a realistic Panimalar Engineering College sample paper in one click.
  - **Review Step**: Editable cards/table rows for each parsed question with live validation and total marks summation.
  - **Preview & Publish Step**: Toggle between the Printable University Paper view (with `window.print()` / downloadable print sheet) and the interactive Student Exam View showing exactly what students see after publishing.
