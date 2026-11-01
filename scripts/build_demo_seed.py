import json
import re

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json") as f:
    seed_json = json.load(f)

def clean(s):
    if not s:
        return ""
    s = re.sub(r"\[\s*\d+\s*\]", "", s)
    s = re.sub(r"\b\d+\s*L\b", "", s, flags=re.I)
    s = re.sub(r"^[\s\-–•*]+", "", s)
    s = re.sub(r"[\s:]+$", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

terms_list = [
    {
        "id": t["id"],
        "userId": "valeria-student",
        "name": t["name"],
        "startDate": t["startDate"],
        "endDate": t["endDate"],
        "isCurrent": t["isCurrent"],
        "createdAt": "2025-08-01T08:00:00.000Z"
    }
    for t in seed_json['terms']
]

courses_list = []
modules_list = []
topics_list = []

for c_idx, c in enumerate(seed_json["courses"]):
    cid = f"course-{c['code'].lower()}"
    TAG_MAP = {"crimson": "rust", "tomato": "rust", "mustard": "ochre", "sage": "olive", "teal": "teal", "plum": "plum"}
    color_tag = TAG_MAP.get(c.get("colorTag", ""), "slate")
    if isinstance(c.get("gradingScheme"), dict):
        grading_scheme = c["gradingScheme"]
    elif c.get("type") == "lab":
        grading_scheme = {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    else:
        grading_scheme = {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}

    courses_list.append({
        "id": cid,
        "userId": "valeria-student",
        "termId": c["termId"],
        "code": c["code"],
        "title": clean(c["title"]),
        "department": c["department"],
        "level": str(c["level"]),
        "credits": c["credits"],
        "description": c["description"],
        "colorTag": color_tag,
        "gradingScheme": grading_scheme,
        "passMark": 40,
        "createdAt": "2025-08-01T08:00:00.000Z"
    })
    
    for u_idx, u in enumerate(c["units"]):
        mid = f"unit-{c['code'].lower()}-u{u['unitNumber']}"
        modules_list.append({
            "id": mid,
            "userId": "valeria-student",
            "courseId": cid,
            "title": clean(u["title"]),
            "order": u_idx,
            "unitNumber": u["unitNumber"],
            "isSection": u.get("isSection", False),
            "electiveExperimentsCount": u.get("electiveExperimentsCount") or c.get("electiveExperimentsCount"),
            "isCollapsed": False,
            "createdAt": "2025-08-01T08:00:00.000Z"
        })
        
        for t_idx, t in enumerate(u["topics"]):
            # Stable ID format requested: <courseCode>-u<unit>-t<index>
            tid = f"{c['code'].lower()}-u{u['unitNumber']}-t{t_idx+1}"
            topics_list.append({
                "id": tid,
                "userId": "valeria-student",
                "courseId": cid,
                "unitId": mid,
                "title": clean(t),
                "order": t_idx,
                "isDone": False,
                "watchScore": 0,
                "checkScore": 0,
                "topicScore": 0,
                "isStudiedManually": False,
                "isExperiment": c["type"] == "lab",
                "isSelectedExperiment": True,
                "createdAt": "2025-08-01T08:00:00.000Z"
            })

sem1_courses = [c for c in courses_list if c["termId"] == "term-sem-1"]
sem2_courses = [c for c in courses_list if c["termId"] == "term-sem-2"]
sem1_topics = [t for t in topics_list if any(c["id"] == t["courseId"] for c in sem1_courses)]
sem2_topics = [t for t in topics_list if any(c["id"] == t["courseId"] for c in sem2_courses)]

print(f"Generated:")
print(f"Terms: {len(terms_list)}")
print(f"Courses: {len(courses_list)} (Sem 1: {len(sem1_courses)}, Sem 2: {len(sem2_courses)})")
print(f"Modules: {len(modules_list)}")
print(f"Topics: {len(topics_list)} (Sem 1: {len(sem1_topics)}, Sem 2: {len(sem2_topics)})")

# Write clean SEED data to seed-data.ts
ts_content = f"""import {{
  UserProfile,
  Term,
  Course,
  Module,
  Lesson,
  LessonProgress,
  Assessment,
  Question,
  Attempt,
  Rubric,
  Submission,
  Note,
  PlannerEvent,
  DegreePlan,
  AuditLog,
  Topic,
  StudySession,
}} from "@/types/schemas";

export const CLEAN_USER: UserProfile = {{
  uid: "valeria-student",
  email: "valeria@valeriascreds.edu",
  displayName: "Valeria",
  currentTermId: "term-sem-1",
  settings: {{
    gradeScale: "10_point",
    defaultHoursPerCredit: 15,
    theme: "system",
  }},
  createdAt: "2025-08-01T08:00:00.000Z",
}};

export const SEED_TERMS: Term[] = {json.dumps(terms_list, indent=2)};

export const SEED_COURSES: Course[] = {json.dumps(courses_list, indent=2)};

export const SEED_MODULES: Module[] = {json.dumps(modules_list, indent=2)};

export const SEED_TOPICS: Topic[] = {json.dumps(topics_list, indent=2)};

// SAMPLE DATA - ONLY LOADED WHEN EXPLICITLY REQUESTED VIA SETTINGS
export const SAMPLE_USER: UserProfile = {{
  ...CLEAN_USER,
  displayName: "Valeria (Sample)",
}};

export const SAMPLE_STUDY_SESSIONS: StudySession[] = [
  {{
    id: "session-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    durationMinutes: 90,
    mode: "custom",
    completedAt: "2025-09-18T10:30:00.000Z",
  }},
  {{
    id: "session-2",
    userId: "valeria-student",
    courseId: "course-cs105es",
    durationMinutes: 120,
    mode: "pomodoro",
    completedAt: "2025-09-19T14:00:00.000Z",
  }}
];

export const SAMPLE_LESSONS: Lesson[] = [
  {{
    id: "lesson-ma101-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    moduleId: "unit-ma101bs-u1",
    title: "Matrices: Rank of Matrix by Echelon Form",
    youtubeVideoId: "fNk_zzaMoSs",
    originalUrl: "https://www.youtube.com/watch?v=fNk_zzaMoSs",
    durationSeconds: 1560,
    startTimeSeconds: 0,
    canEmbed: true,
    order: 0,
    channelTitle: "MIT OpenCourseWare",
    thumbnailUrl: "https://i.ytimg.com/vi/fNk_zzaMoSs/hqdefault.jpg",
    linkedTopicIds: ["ma101bs-u1-t1"],
    cachedAt: "2025-08-05T08:00:00.000Z",
    createdAt: "2025-08-05T08:00:00.000Z",
  }}
];

export const SAMPLE_LESSON_PROGRESS: LessonProgress[] = [
  {{
    id: "progress-ma101-1",
    userId: "valeria-student",
    lessonId: "lesson-ma101-1",
    courseId: "course-ma101bs",
    watchedSeconds: 1560,
    totalDurationSeconds: 1560,
    percentWatched: 100,
    isCompleted: true,
    lastPositionSeconds: 1560,
    updatedAt: "2025-09-18T10:30:00.000Z",
  }}
];

export const SAMPLE_ASSESSMENTS: Assessment[] = [
  {{
    id: "asm-ma101-q1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    title: "Quiz 1: Rank and Linear Systems",
    type: "quiz",
    description: "Evaluates elementary row transformations and echelon forms.",
    maxPoints: 100,
    timeLimitMinutes: 30,
    dueDate: "2025-09-18T23:59:59.000Z",
    createdAt: "2025-08-10T08:00:00.000Z",
  }}
];

export const SAMPLE_PLANNER_EVENTS: PlannerEvent[] = [
  {{
    id: "evt-sample-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    title: "Review Linear Equations",
    date: "2025-09-20",
    startTime: "10:00",
    endTime: "11:30",
    type: "study_block",
    isDone: false,
  }}
];

// Compatibility aliases for legacy imports
export const DEMO_USER = CLEAN_USER;
export const DEMO_TERMS = SEED_TERMS;
export const DEMO_COURSES = SEED_COURSES;
export const DEMO_MODULES = SEED_MODULES;
export const DEMO_TOPICS = SEED_TOPICS;
export const DEMO_LESSONS = SAMPLE_LESSONS;
export const DEMO_LESSON_PROGRESS = SAMPLE_LESSON_PROGRESS;
export const DEMO_ASSESSMENTS = SAMPLE_ASSESSMENTS;
export const DEMO_QUESTIONS: Question[] = [];
export const DEMO_ATTEMPTS: Attempt[] = [];
export const DEMO_RUBRICS: Rubric[] = [];
export const DEMO_SUBMISSIONS: Submission[] = [];
export const DEMO_NOTES: Note[] = [];
export const DEMO_PLANNER_EVENTS = SAMPLE_PLANNER_EVENTS;
export const DEMO_DEGREE_PLAN: DegreePlan = {{
  id: "degree-cse-2025",
  userId: "valeria-student",
  totalCreditsTarget: 160,
  departmentRequirements: {{
    "Computer Science": 70,
    "Mathematics": 20,
    "Basic Sciences": 20,
    "Humanities": 15,
    "Engineering Sciences": 35,
  }},
  levelRequirements: {{
    "100": 40,
    "200": 40,
    "300": 40,
    "400": 40,
  }},
}};
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
export const DEMO_STUDY_SESSIONS = SAMPLE_STUDY_SESSIONS;
"""

with open("/Users/huriyafatima/catyas-creds/src/lib/demo/seed-data.ts", "w") as f:
    f.write(ts_content)

print("Generated src/lib/demo/seed-data.ts successfully!")
