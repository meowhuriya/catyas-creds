import json

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json") as f:
    seed_json = json.load(f)

demo_user_ts = """import {
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
  ExamDate,
} from "@/types/schemas";

export const DEMO_USER: UserProfile = {
  uid: "valeria-student",
  email: "valeria.student@valeriascreds.edu",
  displayName: "Valeria V.",
  currentTermId: "term-sem-1",
  settings: {
    gradeScale: "10_point",
    defaultHoursPerCredit: 15,
    theme: "system",
  },
  createdAt: "2025-08-01T08:00:00.000Z",
};
"""

terms_list = [
    {
        **t,
        "userId": "valeria-student",
        "createdAt": "2025-08-01T08:00:00.000Z"
    }
    for t in seed_json['terms']
]

terms_ts = f"""
export const DEMO_TERMS: Term[] = {json.dumps(terms_list, indent=2)};
"""

# Process courses, modules/units, and topics
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
        "title": c["title"],
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
            "title": u["title"],
            "order": u_idx,
            "unitNumber": u["unitNumber"],
            "isSection": u.get("isSection", False),
            "electiveExperimentsCount": u.get("electiveExperimentsCount") or c.get("electiveExperimentsCount"),
            "isCollapsed": False,
            "createdAt": "2025-08-01T08:00:00.000Z"
        })
        
        for t_idx, t in enumerate(u["topics"]):
            tid = f"topic-{c['code'].lower()}-u{u['unitNumber']}-t{t_idx+1}"
            # For first course and unit, give some realistic progress
            is_done = False
            watch_pts = 0
            check_pts = 0
            if c["code"] == "CS105ES" and u["unitNumber"] == 1 and t_idx < 3:
                is_done = True
                watch_pts = 40
                check_pts = 48
            elif c["code"] == "MA101BS" and u["unitNumber"] == 1 and t_idx < 2:
                is_done = True
                watch_pts = 40
                check_pts = 50
            
            topics_list.append({
                "id": tid,
                "userId": "valeria-student",
                "courseId": cid,
                "unitId": mid,
                "title": t,
                "order": t_idx,
                "isDone": is_done,
                "watchScore": watch_pts,
                "checkScore": check_pts,
                "topicScore": watch_pts + check_pts,
                "isStudiedManually": is_done,
                "isExperiment": c["type"] == "lab",
                "isSelectedExperiment": True,
                "createdAt": "2025-08-01T08:00:00.000Z"
            })

# Sample real YouTube lessons with official URLs for CS105ES and MA101BS
lessons_list = [
    {
        "id": "lesson-cs105-01",
        "userId": "valeria-student",
        "courseId": "course-cs105es",
        "moduleId": "unit-cs105es-u1",
        "unitId": "unit-cs105es-u1",
        "youtubeVideoId": "irq7c66G7i8",
        "originalUrl": "https://www.youtube.com/watch?v=irq7c66G7i8",
        "title": "C Programming Tutorial 1 - Introduction to C Elements & Syntax",
        "channelTitle": "freeCodeCamp.org",
        "thumbnailUrl": "https://i.ytimg.com/vi/irq7c66G7i8/mqdefault.jpg",
        "durationSeconds": 1440,
        "startTimeSeconds": 0,
        "canEmbed": True,
        "linkedTopicIds": ["topic-cs105es-u1-t1", "topic-cs105es-u1-t2"],
        "order": 0,
        "cachedAt": "2025-08-01T08:00:00.000Z",
        "createdAt": "2025-08-01T08:00:00.000Z"
    },
    {
        "id": "lesson-cs105-02",
        "userId": "valeria-student",
        "courseId": "course-cs105es",
        "moduleId": "unit-cs105es-u1",
        "unitId": "unit-cs105es-u1",
        "youtubeVideoId": "kJEsTjH5mVg",
        "originalUrl": "https://www.youtube.com/watch?v=kJEsTjH5mVg",
        "title": "C Control Structures & Decision Statements",
        "channelTitle": "Neso Academy",
        "thumbnailUrl": "https://i.ytimg.com/vi/kJEsTjH5mVg/mqdefault.jpg",
        "durationSeconds": 1820,
        "startTimeSeconds": 0,
        "canEmbed": True,
        "linkedTopicIds": ["topic-cs105es-u1-t3"],
        "order": 1,
        "cachedAt": "2025-08-01T08:00:00.000Z",
        "createdAt": "2025-08-01T08:00:00.000Z"
    },
    {
        "id": "lesson-ma101-01",
        "userId": "valeria-student",
        "courseId": "course-ma101bs",
        "moduleId": "unit-ma101bs-u1",
        "unitId": "unit-ma101bs-u1",
        "youtubeVideoId": "fNk_zzaMoSs",
        "originalUrl": "https://www.youtube.com/watch?v=fNk_zzaMoSs",
        "title": "Matrices: Rank of Matrix by Echelon Form and Normal Form",
        "channelTitle": "3Blue1Brown",
        "thumbnailUrl": "https://i.ytimg.com/vi/fNk_zzaMoSs/mqdefault.jpg",
        "durationSeconds": 1250,
        "startTimeSeconds": 0,
        "canEmbed": True,
        "linkedTopicIds": ["topic-ma101bs-u1-t1"],
        "order": 0,
        "cachedAt": "2025-08-01T08:00:00.000Z",
        "createdAt": "2025-08-01T08:00:00.000Z"
    }
]

lesson_progress_list = [
    {
        "id": "prog-cs105-01",
        "userId": "valeria-student",
        "lessonId": "lesson-cs105-01",
        "videoId": "lesson-cs105-01",
        "courseId": "course-cs105es",
        "watchedSeconds": 1350,
        "totalDurationSeconds": 1440,
        "percentWatched": 93.75,
        "isCompleted": True,
        "lastPositionSeconds": 1350,
        "completedAt": "2025-08-05T14:30:00.000Z",
        "updatedAt": "2025-08-05T14:30:00.000Z"
    },
    {
        "id": "prog-ma101-01",
        "userId": "valeria-student",
        "lessonId": "lesson-ma101-01",
        "videoId": "lesson-ma101-01",
        "courseId": "course-ma101bs",
        "watchedSeconds": 1200,
        "totalDurationSeconds": 1250,
        "percentWatched": 96.0,
        "isCompleted": True,
        "lastPositionSeconds": 1200,
        "completedAt": "2025-08-06T11:20:00.000Z",
        "updatedAt": "2025-08-06T11:20:00.000Z"
    }
]

# Assessments for Sem 1 courses
assessments_list = [
    {
        "id": "assess-cs105-quiz1",
        "userId": "valeria-student",
        "courseId": "course-cs105es",
        "moduleId": "unit-cs105es-u1",
        "type": "quiz",
        "title": "Quiz 1: C Syntax, Data Types & Branching",
        "description": "Foundational assessment covering C language elements and if/else decision logic.",
        "maxPoints": 100,
        "dueDate": "2025-09-15",
        "timeLimitMinutes": 20,
        "attemptLimit": 2,
        "createdAt": "2025-08-01T08:00:00.000Z"
    },
    {
        "id": "assess-cs105-assign1",
        "userId": "valeria-student",
        "courseId": "course-cs105es",
        "moduleId": "unit-cs105es-u1",
        "type": "assignment",
        "title": "Assignment 1: Structured Numeric Problem Solver",
        "description": "Implement an interactive CLI calculator in C adhering to proper formatting.",
        "maxPoints": 100,
        "dueDate": "2025-09-22",
        "rubricId": "rubric-cs105-a1",
        "createdAt": "2025-08-01T08:00:00.000Z"
    },
    {
        "id": "assess-ma101-quiz1",
        "userId": "valeria-student",
        "courseId": "course-ma101bs",
        "moduleId": "unit-ma101bs-u1",
        "type": "quiz",
        "title": "Quiz 1: Rank and Linear Systems",
        "description": "Assesses row echelon reduction, consistency tests, and Gauss elimination.",
        "maxPoints": 100,
        "dueDate": "2025-09-18",
        "timeLimitMinutes": 30,
        "attemptLimit": 1,
        "createdAt": "2025-08-01T08:00:00.000Z"
    }
]

questions_list = [
    {
        "id": "q-cs105-1",
        "userId": "valeria-student",
        "assessmentId": "assess-cs105-quiz1",
        "courseId": "course-cs105es",
        "prompt": "What is the return type of the main function in standard C99/C11?",
        "type": "multiple_choice",
        "options": ["void", "int", "char", "float"],
        "correctAnswers": ["int"],
        "points": 50,
        "explanation": "Standard C specification requires main() to return an integer exit code to the operating system."
    },
    {
        "id": "q-cs105-2",
        "userId": "valeria-student",
        "assessmentId": "assess-cs105-quiz1",
        "courseId": "course-cs105es",
        "prompt": "Which of the following are valid logical operators in C? (Select all that apply)",
        "type": "multiple_select",
        "options": ["&&", "||", "and", "!"],
        "correctAnswers": ["&&", "||", "!"],
        "points": 50,
        "explanation": "In C, logical operators are && (AND), || (OR), and ! (NOT)."
    }
]

attempts_list = [
    {
        "id": "att-cs105-1",
        "userId": "valeria-student",
        "assessmentId": "assess-cs105-quiz1",
        "courseId": "course-cs105es",
        "answers": {
            "q-cs105-1": "int",
            "q-cs105-2": ["&&", "||", "!"]
        },
        "score": 100,
        "maxPoints": 100,
        "percentage": 100,
        "startedAt": "2025-09-10T10:00:00.000Z",
        "submittedAt": "2025-09-10T10:14:20.000Z",
        "isCompleted": True
    }
]

rubrics_list = [
    {
        "id": "rubric-cs105-a1",
        "userId": "valeria-student",
        "assessmentId": "assess-cs105-assign1",
        "criteria": [
            {
                "id": "crit-correctness",
                "title": "Code Correctness & Functionality",
                "description": "Calculates math correctly and handles invalid inputs gracefully.",
                "maxPoints": 50,
                "levels": [
                    {"level": "Exemplary", "points": 50, "description": "All test cases pass, error states handled."},
                    {"level": "Proficient", "points": 40, "description": "Passes primary tests, minor edge flaw."},
                    {"level": "Developing", "points": 25, "description": "Fails multiple tests."},
                    {"level": "Unacceptable", "points": 0, "description": "Does not compile."}
                ]
            },
            {
                "id": "crit-structure",
                "title": "Structure & Modularity",
                "description": "Proper functions, header files, and readability.",
                "maxPoints": 50,
                "levels": [
                    {"level": "Exemplary", "points": 50, "description": "Well factored functions with clean headers."},
                    {"level": "Proficient", "points": 40, "description": "Reasonable function breakdown."},
                    {"level": "Developing", "points": 25, "description": "Monolithic main function."},
                    {"level": "Unacceptable", "points": 0, "description": "Unreadable spaghetti code."}
                ]
            }
        ]
    }
]

submissions_list = [
    {
        "id": "sub-cs105-a1",
        "userId": "valeria-student",
        "assessmentId": "assess-cs105-assign1",
        "courseId": "course-cs105es",
        "submissionType": "text",
        "content": "#include <stdio.h>\nint main() { printf(\"Calculator v1.0\\n\"); return 0; }",
        "selfAssessment": {
            "criteriaMarks": [
                {
                    "criterionId": "crit-correctness",
                    "level": "Exemplary",
                    "points": 50,
                    "justification": "Tested with edge negative inputs and verified zero divisor checks."
                },
                {
                    "criterionId": "crit-structure",
                    "level": "Proficient",
                    "points": 40,
                    "justification": "Modular design with functions for add, subtract, multiply, and divide."
                }
            ]
        },
        "finalScore": 90,
        "gradedAt": "2025-09-20T16:00:00.000Z"
    }
]

notes_list = [
    {
        "id": "note-cs105-01",
        "userId": "valeria-student",
        "courseId": "course-cs105es",
        "lessonId": "lesson-cs105-01",
        "content": "Key takeaways from C elements:\n- Standard variables must be declared before use.\n- Remember that integer division truncates decimal values.",
        "timestamps": [
            {"seconds": 120, "label": "Structure of C program"},
            {"seconds": 450, "label": "Data types and sizing"}
        ],
        "updatedAt": "2025-08-05T14:35:00.000Z"
    }
]

planner_events_list = [
    {
        "id": "event-1",
        "userId": "valeria-student",
        "title": "CS105ES Quiz 1: C Syntax & Branching",
        "date": "2025-09-15",
        "startTime": "10:00",
        "endTime": "11:00",
        "type": "due_date",
        "courseId": "course-cs105es",
        "assessmentId": "assess-cs105-quiz1",
        "isDone": True
    },
    {
        "id": "event-2",
        "userId": "valeria-student",
        "title": "MA101BS Quiz 1: Matrices & Rank",
        "date": "2025-09-18",
        "startTime": "14:00",
        "endTime": "15:00",
        "type": "due_date",
        "courseId": "course-ma101bs",
        "assessmentId": "assess-ma101-quiz1",
        "isDone": False
    },
    {
        "id": "event-3",
        "userId": "valeria-student",
        "title": "Study Block: Matrices Eigenvalues Practice",
        "date": "2025-09-17",
        "startTime": "09:00",
        "endTime": "11:30",
        "type": "study_block",
        "courseId": "course-ma101bs",
        "isDone": False
    }
]

degree_plan_obj = {
    "id": "deg-plan-valeria",
    "userId": "valeria-student",
    "totalCreditsTarget": 160,
    "departmentRequirements": {
        "Computer Science": 70,
        "Mathematics": 20,
        "Basic Sciences": 20,
        "Humanities": 15,
        "Engineering Sciences": 35
    },
    "levelRequirements": {
        "100": 40,
        "200": 42,
        "300": 41,
        "400": 37
    }
}

audit_logs_list = [
    {
        "id": "log-1",
        "userId": "valeria-student",
        "action": "lesson_watched",
        "entityId": "lesson-cs105-01",
        "details": "Completed verified watch session (1350 / 1440 sec) for C Programming Tutorial 1",
        "timestamp": "2025-08-05T14:30:00.000Z"
    },
    {
        "id": "log-2",
        "userId": "valeria-student",
        "action": "exam_submitted",
        "entityId": "assess-cs105-quiz1",
        "details": "Submitted Quiz 1: C Syntax, Data Types & Branching - scored 100/100",
        "timestamp": "2025-09-10T10:14:20.000Z"
    }
]

# Study sessions for 12-week heatmap (past 84 days)
study_sessions_list = [
    {"id": f"ss-{idx}", "userId": "valeria-student", "courseId": "course-cs105es", "durationMinutes": 45, "mode": "pomodoro", "completedAt": "2025-09-01T10:00:00.000Z"}
    for idx in range(1, 10)
]

out = demo_user_ts + terms_ts + f"""
export const DEMO_COURSES: Course[] = {json.dumps(courses_list, indent=2)};

export const DEMO_MODULES: Module[] = {json.dumps(modules_list, indent=2)};
export const DEMO_UNITS = DEMO_MODULES;

export const DEMO_TOPICS: Topic[] = {json.dumps(topics_list, indent=2)};

export const DEMO_LESSONS: Lesson[] = {json.dumps(lessons_list, indent=2)};
export const DEMO_VIDEOS = DEMO_LESSONS;

export const DEMO_LESSON_PROGRESS: LessonProgress[] = {json.dumps(lesson_progress_list, indent=2)};
export const DEMO_VIDEO_PROGRESS = DEMO_LESSON_PROGRESS;

export const DEMO_ASSESSMENTS: Assessment[] = {json.dumps(assessments_list, indent=2)};

export const DEMO_QUESTIONS: Question[] = {json.dumps(questions_list, indent=2)};

export const DEMO_ATTEMPTS: Attempt[] = {json.dumps(attempts_list, indent=2)};

export const DEMO_RUBRICS: Rubric[] = {json.dumps(rubrics_list, indent=2)};

export const DEMO_SUBMISSIONS: Submission[] = {json.dumps(submissions_list, indent=2)};

export const DEMO_NOTES: Note[] = {json.dumps(notes_list, indent=2)};

export const DEMO_PLANNER_EVENTS: PlannerEvent[] = {json.dumps(planner_events_list, indent=2)};

export const DEMO_DEGREE_PLAN: DegreePlan = {json.dumps(degree_plan_obj, indent=2)};

export const DEMO_AUDIT_LOGS: AuditLog[] = {json.dumps(audit_logs_list, indent=2)};

export const DEMO_STUDY_SESSIONS: StudySession[] = {json.dumps(study_sessions_list, indent=2)};
"""

with open("/Users/huriyafatima/catyas-creds/src/lib/demo/seed-data.ts", "w") as f:
    f.write(out)

print(f"Generated seed-data.ts with {len(courses_list)} courses, {len(modules_list)} units, and {len(topics_list)} topics.")
