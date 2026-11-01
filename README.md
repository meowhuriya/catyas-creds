# Valeria’s Creds — University-Grade Academic Learning Portal

> **LEARNING PORTAL**  
> An autonomous, collegiate-grade learning portal for one student. Students curate YouTube video lectures into credit-bearing academic courses, verify real watched seconds, master syllabus competencies, complete graded classwork under strict rubrics, track SGPA & CGPA, and issue verifiable academic transcripts.

---

## 1. Executive Overview & Brand Identity

Valeria’s Creds is engineered to the aesthetic and structural benchmark of Google Classroom, elite university registrar student portals, and the refined design polish of Linear and Coursera:
* **Brand Assets**:
  * **Wordmark**: *Valeria’s Creds* in Source Serif 4 semibold with a letter-spaced caps label `LEARNING PORTAL`.
  * **Logo Mark & Favicon**: Die-cut white bordered Babushka Cat sticker (`/cat-sticker.png`, `/favicon.svg`, `/favicon.ico`, and `/cat-icon-192.png`) featuring the ginger cat in a strawberry kerchief.
  * **Name Everywhere**: Enforced as *Valeria's Creds* across page titles, shell headers, metadata, transcript, verification registry, and exports. Never uses unauthorized university crests or names.
* **Palette & Design System (Cat Picture Cottagecore Gingham)**:
  * Light Background: Warm Linen Cream `#FAF4EC`, surface `#FFFFFF`, muted surface `#F3E8DC`, border `#E5D5C5`, espresso ink `#1D1618`, muted cocoa `#6B575A`.
  * Brand Highlights: Vintage Gingham Red / Strawberry `#A6192E`, Babushka Mustard Gold `#D89520`, Deep Berry Burgundy `#3D0D14`, Strawberry Leaf Sage `#44724E`.
  * Dark Mode: Soft Espresso `#161113`, surface `#201A1C`, muted surface `#2B2225`, border `#3B2E32`, strawberry rose `#E25F70`, mustard gold `#F0B533`.
  * Course Department Accents: 8 muted tones (slate, teal, olive, ochre, plum, rust, graphite, forest) rendered strictly as thin 4px bars and 6px dots.
* **Typography**: *Source Serif 4* for page titles, course titles, large numeric metrics, and formal certificates; *Inter* for interface controls and body copy. All numeric metrics, percentages, credit totals, and grade points strictly enforce tabular numbers (`tabular-nums`).
* **Accessibility**: Fully WCAG AA compliant with 2px crimson visible focus rings, full keyboard shortcuts modal (`?`), keyboard skip-to-content anchor, and verified contrast ratios.

---

## 2. Pre-Loaded Curricular Syllabus

* **Accredited Baseline**: Seeded with 19 foundational undergraduate courses from the JNTUH R25 Computer Science and Engineering syllabus across Year 1:
  * **Semester 1 (9 courses, 20 credits)**:
    * `MA101BS`: Matrices and Calculus (4 cr)
    * `CH102BS`: Engineering Chemistry (3 cr)
    * `EN103HS`: English for Skill Enhancement (3 cr)
    * `EC104ES`: Electronic Devices and Circuits (3 cr)
    * `CS105ES`: Programming for Problem Solving (3 cr)
    * `CH106BS`: Engineering Chemistry Laboratory (1 cr)
    * `CS107ES`: Programming for Problem Solving Laboratory (1.5 cr)
    * `EN108HS`: English Language and Communication Skills Lab (1 cr)
    * `ME109ES`: Environmental Science and Engineering (0.5 cr)
  * **Semester 2 (10 courses, 20 credits)**:
    * `MA201BS`: Ordinary Differential Equations and Vector Calculus (4 cr)
    * `PH202BS`: Applied Physics (3 cr)
    * `ME203ES`: Engineering Graphics (3 cr)
    * `EE204ES`: Basic Electrical Engineering (3 cr)
    * `CS205ES`: Python Programming (2 cr)
    * `PH206BS`: Applied Physics Laboratory (1 cr)
    * `CS207ES`: Python Programming Laboratory (1.5 cr)
    * `CS208ES`: Basic Electrical and Electronics Engineering Lab (1 cr)
    * `EE209ES`: IT Workshop (1 cr)
    * `CS210ES`: Constitution of India (0.5 cr)
* **Lab Electives & Operations**:
  * Lab sections with elective requirements (e.g., *"any 8 experiments"*) include an interactive experiment selector that only counts chosen experiments towards completion.
  * Full syllabus agility: inline rename, reorder, split, merge, delete, and a safe *"Reset this course to original syllabus"* restoration action.

---

## 3. YouTube Embed Compliance & Verified Watch Tracking

Valeria’s Creds strictly observes YouTube Developer Policies and Terms of Service:
1. **Official IFrame Embed Only**: Videos play exclusively via the official YouTube IFrame Player API. Videos are never proxied, downloaded, clipped, resized below minimum standards, or overlaid with advertisements.
2. **Channel Attribution & Fallback**: Every lecture card and player screen prominently displays the YouTube channel name and a direct *"Watch on YouTube"* link.
3. **Verified Watch Time Accumulator**:
   * Watched seconds are accumulated **only** while the player state is strictly `PLAYING` ($1$).
   * Scrubbing or seeking ahead is discarded:
     $$\Delta t \le 1.25 \times \Delta t_{\text{wallClock}} \times \text{playbackRate}$$
   * Live watch percentage is saved to localStorage/Firestore for seamless playback resumption.
   * At $\ge 90\%$ verified watch progress, the video is marked as **Completed**.
4. **Metadata Route with 30-Day Cache**:
   * Server route `/api/youtube/oembed` resolves video titles, author channels, and thumbnails without requiring a YouTube API key.
   * Validates strict 11-character video IDs, enforces sliding-window rate limits, and re-fetches metadata older than 30 days.
5. **Mandatory Legal Notices**:
   * Footer links to [YouTube Terms of Service](https://www.youtube.com/t/terms) and [Google Privacy Policy](https://policies.google.com/privacy).
   * Persistent academic disclaimer across all pages and certificates:
     > *"Self-awarded credits. Not accredited by any institution."*

---

## 4. Mastery Scoring & Spaced Revision Engine

Every syllabus topic has an objective mastery score (0–100) and three status levels (*Not started*, *Learning*, *Done*):
$$\text{Topic Score} = \text{Watch Score (0–40)} + \text{Check Score (0–60)}$$
* **Watch Part (40 pts)**: Automatically awarded when a linked video lecture reaches 90% completion, or when manually ticked as *"I studied this"* if no video is linked.
* **Check Part (60 pts)**: Earned through diagnostic quick checks (3–5 conceptual questions):
  $$\text{Check Score} = \text{Percent Correct} \times 60$$
* **Done State Threshold**: Awarded at $\ge 70$ points. Ticking a checkbox alone never confers full mastery.
* **Hierarchical Aggregations**:
  * $\text{Unit Score} = \text{Average of its topic scores}$
  * $\text{Course Score} = \text{Average of its unit scores}$
  * $\text{Semester Progress} = \text{Credit-weighted average of course scores}$
* **Spaced Revision Schedule**: Once a topic is Done, automated revision checkpoints trigger at **1, 3, 7, and 21 days** on the Today dashboard and Academic Planner.

---

## 5. Pure Grading Mathematics Engine

Grading mathematics reside in an isolated pure TypeScript module (`src/lib/grading/grading-engine.ts`) verified by unit tests:
1. **Strict 100% Category Weighting**:
   * Theory Presets: Study Progress (10%), Quizzes (25%), Assignments (30%), Midterm (15%), Final Exam (20%).
   * Lab Presets: Experiments Done (60%), Quizzes/Viva (20%), Final Lab Test (20%).
   * The Study Progress component directly reflects the pure topic mastery score.
2. **Assessment Types & Runners**:
   * **Quiz**: MCQ, multi-select, and short-answer with live timer, attempt limits, instant auto-marking, and review rationales.
   * **Assignment**: Student submission with structured rubric self-assessment requiring written justifications ($\ge 10$ characters).
   * **Exam**: Proctored single-attempt examination gated by prerequisite topic completion (e.g. requires $\ge 80\%$ unit topics mastered).
3. **Collegiate Retake Replacement Rule**:
   * When a course is retaken, the latest grade replaces previous attempts in cumulative CGPA calculation, while both attempts remain visible on the official transcript flagged with `(R)`.
4. **Dual Grading Scales**:
   * **10-Point Indian Collegiate Scale**: $O$ ($\ge 90\%$, 10.0), $A+$ ($\ge 80\%$, 9.0), $A$ ($\ge 70\%$, 8.0), $B+$ ($\ge 60\%$, 7.0), $B$ ($\ge 50\%$, 6.0), $P$ ($\ge 40\%$, 5.0), $F$ ($< 40\%$, 0.0).
   * **4.0 Standard US Scale**: $A$ ($4.0$), $A-$ ($3.7$), $B+$ ($3.3$), $B$ ($3.0$), $B-$ ($2.7$), $C$ ($2.0$), $D$ ($1.0$), $F$ ($0.0$).
5. **What-If Target Solver**:
   * Computes the exact final exam score needed to reach a desired target letter grade.

---

## 6. Official Documents, Verification & Settings

1. **Official Academic Transcript (`/transcript`)**:
   * Source Serif 4 typography with double crimson rule header (*Valeria’s Creds Registry of Academic Records*), Registry ID `VC-2026-9812-REG`, term-by-term tables, SGPA, CGPA, Dean & Registrar signature lines, dynamic verification QR code, and print-to-PDF stylesheet (`@media print`).
2. **Opt-In Public Verification Registry (`/verify/[id]`)**:
   * Verification links are strictly **opt-in** and private by default. Unshared snapshots display the Privacy Sharing Policy gate.
   * When activated, displays verified status banner, student candidate, ID, CGPA, total credits, snapshot timestamp, course breakdown, immutable audit log chain, and mandatory disclaimer.
3. **Weekly Academic Review**:
   * One-page printable summary featuring 7-day study hours, topics mastered, weakest topics revision priorities, next week milestones, and reflection notes.
4. **Academic Settings (`/settings`)**:
   * Switch between 10-Point and 4.0 grading scales.
   * Configure watch hours per credit ratio (default: 15 hrs/cr).
   * Instant color theme switching (Light, Dark, System).
   * Academic Term Manager (create terms, switch active term).
   * Complete JSON backup export (`valerias-creds-backup-<date>.json`) and restoration.
   * Danger zone account reset requiring exact `CONFIRM RESET` confirmation.

---

## 7. Gemini AI Academic Suite

All AI capabilities operate under one strict rule: **AI only drafts; the student reviews and approves before anything is saved.**
* `POST /api/ai/course-builder`: Converts pasted raw syllabus text into structured courses with units and topics matching the seed format.
* `POST /api/ai/quick-check`: Synthesizes 3–5 conceptual multiple-choice questions with 4 options, an answer key, and formal explanations.
* `POST /api/ai/topic-chat`: Scoped contextual topic assistant (*Explain Simply*, *Test Me* diagnostic challenge, *Flashcards* spaced-repetition cards).
* `POST /api/ai/study-plan`: Crafts a week-by-week study timetable calibrated against exam dates, current mastery, and weak topics.
* `POST /api/ai/tidy-topics`: Refines raw, noisy syllabus strings into concise, professional academic lesson titles.
* **Offline Safeguard**: When `GEMINI_API_KEY` is not present, all AI endpoints return HTTP 503 with informative guidance, and UI components display clear notices while offering manual alternatives.

---

## 8. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `g` then `d` | Navigate to Dashboard |
| `g` then `c` | Navigate to Enrolled Courses |
| `g` then `p` | Navigate to Academic Planner |
| `g` then `g` | Navigate to Grades & Standing |
| `g` then `t` | Navigate to Official Transcript |
| `g` then `s` | Navigate to Academic Settings |
| `⌘K` / `Ctrl+K` / `/` | Open Global Command Palette |
| `?` | Open Keyboard Shortcuts Help Modal |
| `j` | Next video lecture (in Lesson Player) |
| `k` | Previous video lecture (in Lesson Player) |
| `n` | Focus timestamped notes editor (in Lesson Player) |

---

## 9. Local Setup & Testing Guide

### Prerequisites
* **Node.js**: v18.17+ or v20+
* **npm**: v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/meowhuriya/catyas-creds.git
cd catyas-creds

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)

```env
# Optional Firebase Web Client Configuration (falls back to High-Fidelity Demo Store if omitted)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional Google Gemini API Key for academic AI drafting
GEMINI_API_KEY=
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm run start
```

Open `http://localhost:3000` in your browser.

### Test Suites

```bash
# Run Vitest test suite (65 passing unit tests)
npm run test

# Run Playwright verification
node tests/phase8-valeria-browser-check.js
```

---

## 10. Firestore Security Rules (`firestore.rules`)

Production rules enforce strict user partition isolation across all 23 collections (`users`, `terms`, `courses`, `units`, `topics`, `videos`, `videoProgress`, `checks`, `attempts`, `assessments`, `questions`, `submissions`, `rubrics`, `notes`, `plannerEvents`, `studySessions`, `examDates`, `degreePlans`, `transcriptSnapshots`, `auditLog`, `modules`, `lessons`, `lessonProgress`):
* Students can only read and write documents inside their authenticated partition (`request.auth.uid == resource.data.userId`).
* Public verification records (`/transcriptSnapshots/{snapshotId}`) are strictly **read-only** for unauthenticated viewers and only when `isPublic == true`.

Deploy rules to your Firebase project:
```bash
firebase deploy --only firestore:rules
```

---

## 11. Vercel Deployment Checklist

1. Push your repository to GitHub (`main` branch).
2. Import the project into [Vercel](https://vercel.com).
3. Set Framework Preset to **Next.js**.
4. Configure optional environment variables:
   - `NEXT_PUBLIC_FIREBASE_*` (for Cloud Firestore and Google Sign-In)
   - `GEMINI_API_KEY` (for Gemini AI features)
5. Click **Deploy**. The app will build statically and dynamically with zero configuration.

---

## License & Attribution

Released under the **MIT License**.

All lecture video content belongs to their respective YouTube creators and channels. Videos are embedded in strict compliance with the YouTube Terms of Service and Google Privacy Policy.

*Self-awarded credits. Not accredited by any institution.*
