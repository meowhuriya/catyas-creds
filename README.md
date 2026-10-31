# Catya's Creds — University-Grade Academic Learning Portal

> An independent academic learning portal where students organize YouTube video lectures into credit-bearing university courses, complete rigorous graded assessments with structured rubrics, track SGPA/CGPA, and issue verifiable academic credentials.

---

## 1. Executive Overview & Design System

Catya's Creds is engineered to the aesthetic and structural standards of Google Classroom combined with an elite university registrar's student portal. The user interface prioritizes clarity, trust, and speed:
* **Academic Atmosphere**: Zero emojis, zero cartoon illustrations, and zero decorative gradients.
* **Palette**: High-contrast academic light mode (`#FAFAF8` background, `#FFFFFF` surface, `#1B1F2A` ink, `#A51C30` crimson accent) paired with an authentic deep slate dark mode (`#14161B` background, `#1B1E25` surface, `#D4586B` accent).
* **Course Tag Rules**: 8 muted departmental colors (slate blue, teal, olive, ochre, plum, rust, graphite, forest) rendered strictly as 4px thin indicator bars and 6px status dots—never as oversized saturated blocks.
* **Typography**: *Source Serif 4* for page titles, course titles, large metric numbers, and official certificates; *Inter* for body and user interface controls. All numeric grades, credits, durations, and percentages enforce tabular figures (`font-variant-numeric: tabular-nums`).
* **Accessibility**: Fully WCAG AA compliant with 2px crimson visible focus rings, full keyboard accessibility, proper ARIA landmarks, and a skip-to-content link.

---

## 2. Architecture & Data Repository Layer

The application enforces a strict **Single Repository Interface** (`DataStore`), ensuring UI components and page routes never communicate with underlying database drivers directly:

```
src/
├── app/                  # Next.js App Router (Layouts & Pages)
│   ├── api/              # Route handlers (/api/youtube/oembed, /api/ai/draft-quiz)
│   ├── courses/          # Course Classwork, Syllabus, Notes, Lesson Player
│   ├── degree/           # 120-credit Degree Progress Audit
│   ├── grades/           # Global Grades, SGPA, CGPA & Scale Switcher
│   ├── planner/          # Month & Week Academic Calendar
│   ├── settings/         # Grading parameters, theme toggle, JSON backup/restore
│   ├── transcript/       # Official Printable Transcript with QR verification
│   └── verify/[id]/      # Public cryptographic credential verification
├── components/           # Reusable academic controls, dialogs & modules
├── lib/
│   ├── grading/          # Pure TypeScript grading mathematics engine
│   ├── repository/       # DataStore interface, DemoDataStore & FirebaseDataStore
│   └── youtube/          # Pure YouTube URL parser & embed compliance
├── styles/               # Design tokens (tokens.ts) and globals.css
└── types/                # Strict Zod & TypeScript domain schemas
```

### High-Fidelity Demo Store vs. Firebase Cloud Store
* **`DemoDataStore`**: In-memory and local storage backed implementation populated with high-fidelity sample data across two academic semesters, 4 courses (Computer Science, Mathematics, Ethics, Economics), verified lesson progress, graded quizzes, and rubrics.
* **`FirebaseDataStore`**: Production cloud implementation utilizing Firebase Authentication (Google Sign-In) and Cloud Firestore client SDK.
* **Zero Disruption Switching**: Switching stores or exporting/importing JSON backups happens instantly through `DataStoreProvider`.

---

## 3. YouTube Embed Compliance & Watch Tracking Engine

Catya's Creds strictly adheres to the YouTube API Terms of Service:
1. **Official IFrame Embed Only**: Video playback operates exclusively via the official YouTube IFrame Player API. Videos are never proxied, downloaded, re-hosted, clipped, or overlaid.
2. **Channel Attribution & Fallback**: Every lecture prominently attributes the creator's YouTube channel and features a direct "Watch on YouTube" fallback link.
3. **Verified Watch Time Accumulator**:
   * Watched seconds are counted **only** while player state is strictly `PLAYING` ($1$).
   * Scrubbing or seeking ahead is intercepted and adds zero seconds:
     $$\Delta t \le 1.25 \times \Delta \text{wallTime} \times \text{playbackRate}$$
   * Automatic completion trigger marks lessons as **Complete** once real watched duration reaches $\ge 90\%$.
4. **Zero-Key Metadata Route**: Metadata is fetched via Next.js server route `/api/youtube/oembed` (no YouTube Data API key required), utilizing strict 11-character video ID validation and sliding-window rate limiting.
5. **Mandatory Legal Notices**:
   * Direct links to [YouTube Terms of Service](https://www.youtube.com/t/terms) and [Google Privacy Policy](https://policies.google.com/privacy) in universal footer and sidebar.
   * Persistent accreditation disclaimer: *"Self-awarded credits. Not accredited by any institution."*

---

## 4. Pure Grading Mathematics Engine

All academic math lives in an isolated pure TypeScript module (`src/lib/grading/grading-engine.ts`) covered by comprehensive Vitest unit tests:

1. **Strict 100% Weighted Categories**:
   * Course schemes enforce that category weights sum to exactly 100%:
     $$\sum_{i} W_i = 100\%$$
   * Within any category, the category score is strictly proportional to points:
     $$\text{Category Score} = \frac{\sum \text{Earned Points}}{\sum \text{Available Points}} \times 100$$
2. **Collegiate Retake Grade Replacement Rule**:
   * When a course is retaken across terms, the latest grade replaces previous attempts in cumulative CGPA calculation, flagging superseded attempts with `(R)`.
3. **Dual Grading Scales**:
   * **10-Point Academic Scale**:
     * $O$ (Outstanding, $\ge 90\%$, 10.0 GP)
     * $A+$ (Excellent, $\ge 80\%$, 9.0 GP)
     * $A$ (Very Good, $\ge 70\%$, 8.0 GP)
     * $B+$ (Good, $\ge 60\%$, 7.0 GP)
     * $B$ (Above Average, $\ge 50\%$, 6.0 GP)
     * $P$ (Pass, $\ge 40\%$, 5.0 GP)
     * $F$ (Fail, $< 40\%$, 0.0 GP)
   * **4.0 US Collegiate Scale**: $A$ ($4.0$), $A-$ ($3.7$), $B+$ ($3.3$), $B$ ($3.0$), $B-$ ($2.7$), $C$ ($2.0$), $D$ ($1.0$), $F$ ($0.0$).
4. **What-If Target Solver**:
   * Embedded simulator that calculates exact exam scores required to achieve a target letter grade.

---

## 5. Official Documents, Verification & A4 Print Engine

1. **Official Academic Transcript (`/transcript`)**:
   * Styled with academic double crimson rule, Source Serif 4 typography, biographical registrar block, term tables, and Dean/Registrar signatures.
   * Dedicated print stylesheet (`@media print`) rendering a pristine, multi-page A4 PDF without UI chrome.
2. **Opt-in Cryptographic Credential Verification (`/verify/[id]`)**:
   * Opt-in verification engine generates unique IDs (`VER-...`) and dynamic QR codes.
   * Public standalone route displays timestamped verification badge, coursework snapshot, and immutable audit trail.
   * One-click revoke capability to decommission public verification.

---

## 6. Global Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `g` then `d` | Jump to Academic Dashboard |
| `g` then `c` | Jump to Enrolled Courses |
| `g` then `p` | Jump to Academic Planner |
| `g` then `g` | Jump to Grades & Standing |
| `g` then `t` | Jump to Official Transcript |
| `g` then `s` | Jump to Academic Settings |
| `⌘K` / `Ctrl+K` / `/` | Open Global Command Palette & Search |
| `?` | Open Keyboard Shortcuts Help Modal |
| `j` | Next lecture (in Lesson Player) |
| `k` | Previous lecture (in Lesson Player) |
| `n` | Focus timestamped notes editor (in Lesson Player) |

---

## 7. Local Setup & Testing Guide

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

# Optional Google Gemini API Key (for automated AI quiz drafting from lecture notes)
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
# Run Vitest pure mathematics and parser unit test suites
npm run test

# Run Playwright End-to-End student journey test suite
npm run test:e2e
```

---

## 8. Firestore Security Rules (`firestore.rules`)

The production security rules enforce strict user isolation:
* Students can only read and write documents inside their own partition (`/users/{userId}/**`).
* Public verification records (`/verification_snapshots/{snapshotId}`) are strictly **read-only** for unauthenticated public viewers and can only be authored by the owning student when opted in.

To deploy rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

---

## 9. Vercel Deployment

Catya's Creds is engineered for zero-config deployment on Vercel:

1. Push your code to your GitHub repository.
2. Import the repository into [Vercel](https://vercel.com).
3. Framework Preset: **Next.js**.
4. Set optional environment variables (`NEXT_PUBLIC_FIREBASE_*` and `GEMINI_API_KEY`).
5. Click **Deploy**.

---

## License & Attribution

This project is released under the **MIT License**.

All lecture video content belongs to their respective YouTube creators and channels. Videos are embedded in strict compliance with the YouTube Terms of Service and Google Privacy Policy.

*Self-awarded credits. Not accredited by any institution.*
