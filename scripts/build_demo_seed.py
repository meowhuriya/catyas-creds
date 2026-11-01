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
    courses_list.append({
        "id": cid,
        "userId": "valeria-student",
        "termId": c["termId"],
        "code": c["code"],
        "title": clean(c["title"]),
        "department": c["department"],
        "level": c["level"],
        "credits": c["credits"],
        "description": c["description"],
        "colorTag": c["colorTag"],
        "gradingScheme": c["gradingScheme"],
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
                "masteryThreshold": 70,
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
    type: "lecture_watch",
    completedAt: "2025-09-18T10:30:00.000Z",
  }},
  {{
    id: "session-2",
    userId: "valeria-student",
    courseId: "course-cs105es",
    durationMinutes: 120,
    type: "focus_timer",
    completedAt: "2025-09-19T14:00:00.000Z",
  }}
];

export const SAMPLE_LESSONS: Lesson[] = [
  {{
    id: "lesson-ma101-1",
    courseId: "course-ma101bs",
    moduleId: "unit-ma101bs-u1",
    title: "Matrices: Rank of Matrix by Echelon Form",
    youtubeUrl: "https://www.youtube.com/watch?v=fNk_zzaMoSs",
    youtubeId: "fNk_zzaMoSs",
    durationSeconds: 1560,
    order: 0,
    channelTitle: "MIT OpenCourseWare",
    channelId: "MIT",
    thumbnailUrl: "https://i.ytimg.com/vi/fNk_zzaMoSs/hqdefault.jpg",
    publishedAt: "2020-05-10T12:00:00.000Z",
    hasCaptions: true,
    isOfficialEmbedAllowed: true,
    viewCount: 250000,
    linkedTopicIds: ["ma101bs-u1-t1"],
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
    completed: true,
    lastPositionSeconds: 1560,
    playbackSpeed: 1,
    videoQuality: "720p",
    notesCount: 2,
    watchSegments: [[0, 1560]],
    updatedAt: "2025-09-18T10:30:00.000Z",
  }}
];

export const SAMPLE_ASSESSMENTS: Assessment[] = [
  {{
    id: "asm-ma101-q1",
    courseId: "course-ma101bs",
    title: "Quiz 1: Rank and Linear Systems",
    type: "quiz",
    description: "Evaluates elementary row transformations and echelon forms.",
    timeLimitMinutes: 30,
    weightPercent: 10,
    dueDate: "2025-09-18T23:59:59.000Z",
    gradingSchemeComponent: "quizzes",
    passingScore: 60,
    topicIds: ["ma101bs-u1-t1", "ma101bs-u1-t2"],
    createdAt: "2025-08-10T08:00:00.000Z",
  }}
];

export const SAMPLE_PLANNER_EVENTS: PlannerEvent[] = [
  {{
    id: "evt-sample-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    title: "Review Linear Equations",
    description: "Prepare practice set on Homogeneous equations",
    date: "2025-09-20",
    startTime: "10:00",
    endTime: "11:30",
    type: "study_block",
    isCompleted: false,
    createdAt: "2025-08-15T08:00:00.000Z",
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
  programName: "B.Tech. in Computer Science and Engineering",
  totalCreditsRequired: 160,
  regulations: "JNTUH R-25 Regulations",
  expectedGraduation: "May 2029",
  categories: [
    {{ id: "bsc", name: "Basic Science Courses (BSC)", requiredCredits: 24, earnedCredits: 0 }},
    {{ id: "esc", name: "Engineering Science Courses (ESC)", requiredCredits: 22, earnedCredits: 0 }},
    {{ id: "hsms", name: "Humanities and Social Sciences (HSMS)", requiredCredits: 10, earnedCredits: 0 }},
    {{ id: "pcc", name: "Professional Core Courses (PCC)", requiredCredits: 68, earnedCredits: 0 }},
  ],
  updatedAt: "2025-08-01T08:00:00.000Z",
}};
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
export const DEMO_STUDY_SESSIONS = SAMPLE_STUDY_SESSIONS;
"""

with open("/Users/huriyafatima/catyas-creds/src/lib/demo/seed-data.ts", "w") as f:
    f.write(ts_content)

print("Generated src/lib/demo/seed-data.ts successfully!")
