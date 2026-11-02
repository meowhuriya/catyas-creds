import {
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
  CourseAttendance,
} from "@/types/schemas";

export const CLEAN_USER: UserProfile = {
  uid: "valeria-student",
  email: "valeria@valeriascreds.edu",
  displayName: "Valeria",
  currentTermId: "term-sem-1",
  settings: {
    gradeScale: "10_point",
    defaultHoursPerCredit: 15,
    theme: "system",
  },
  createdAt: "2025-08-01T08:00:00.000Z",
};

import {
  getCanonicalTerms,
  getCanonicalCourses,
  getCanonicalModules,
  getCanonicalTopics,
} from "@/lib/syllabus/seed-loader";

export const SEED_TERMS: Term[] = getCanonicalTerms("valeria-student");
export const SEED_COURSES: Course[] = getCanonicalCourses("valeria-student");
export const SEED_MODULES: Module[] = getCanonicalModules("valeria-student");
export const SEED_TOPICS: Topic[] = getCanonicalTopics("valeria-student");

// SAMPLE DATA - ONLY LOADED WHEN EXPLICITLY REQUESTED VIA SETTINGS
export const SAMPLE_USER: UserProfile = {
  ...CLEAN_USER,
  displayName: "Valeria (Sample)",
};

export const SAMPLE_STUDY_SESSIONS: StudySession[] = [
  {
    id: "session-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    durationMinutes: 90,
    mode: "custom",
    completedAt: "2025-09-18T10:30:00.000Z",
  },
  {
    id: "session-2",
    userId: "valeria-student",
    courseId: "course-cs105es",
    durationMinutes: 120,
    mode: "pomodoro",
    completedAt: "2025-09-19T14:00:00.000Z",
  }
];

export const SAMPLE_LESSONS: Lesson[] = [
  {
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
  }
];

export const SAMPLE_LESSON_PROGRESS: LessonProgress[] = [
  {
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
  }
];

export const SAMPLE_ASSESSMENTS: Assessment[] = [
  {
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
  }
];

export const SAMPLE_PLANNER_EVENTS: PlannerEvent[] = [
  {
    id: "evt-sample-1",
    userId: "valeria-student",
    courseId: "course-ma101bs",
    title: "Review Linear Equations",
    date: "2025-09-20",
    startTime: "10:00",
    endTime: "11:30",
    type: "study_block",
    isDone: false,
  }
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
export const DEMO_DEGREE_PLAN: DegreePlan = {
  id: "degree-cse-2025",
  userId: "valeria-student",
  totalCreditsTarget: 160,
  departmentRequirements: {
    "Computer Science": 70,
    "Mathematics": 20,
    "Basic Sciences": 20,
    "Humanities": 15,
    "Engineering Sciences": 35,
  },
  levelRequirements: {
    "100": 40,
    "200": 40,
    "300": 40,
    "400": 40,
  },
};
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
export const DEMO_STUDY_SESSIONS = SAMPLE_STUDY_SESSIONS;

export const SAMPLE_ATTENDANCE: CourseAttendance[] = [
  {
    id: "att-course-ma101bs",
    courseId: "course-ma101bs",
    userId: "valeria-student",
    classesHeld: 28,
    classesAttended: 25,
    minimumPercentage: 75,
    logs: [
      { id: "log-1", date: "2025-10-28", status: "present", timestamp: "2025-10-28T09:00:00.000Z" },
      { id: "log-2", date: "2025-10-29", status: "present", timestamp: "2025-10-29T09:00:00.000Z" },
      { id: "log-3", date: "2025-10-31", status: "absent", timestamp: "2025-10-31T09:00:00.000Z" },
    ],
    updatedAt: "2025-10-31T10:00:00.000Z",
  },
  {
    id: "att-course-ch102bs",
    courseId: "course-ch102bs",
    userId: "valeria-student",
    classesHeld: 26,
    classesAttended: 18, // 69.2% -> below 75% limit, triggers warning chip
    minimumPercentage: 75,
    logs: [
      { id: "log-ch-1", date: "2025-10-27", status: "absent", timestamp: "2025-10-27T10:00:00.000Z" },
      { id: "log-ch-2", date: "2025-10-29", status: "present", timestamp: "2025-10-29T10:00:00.000Z" },
      { id: "log-ch-3", date: "2025-10-30", status: "absent", timestamp: "2025-10-30T10:00:00.000Z" },
    ],
    updatedAt: "2025-10-30T11:00:00.000Z",
  },
  {
    id: "att-course-cs105es",
    courseId: "course-cs105es",
    userId: "valeria-student",
    classesHeld: 30,
    classesAttended: 27, // 90%
    minimumPercentage: 75,
    logs: [
      { id: "log-cs-1", date: "2025-10-28", status: "present", timestamp: "2025-10-28T14:00:00.000Z" },
      { id: "log-cs-2", date: "2025-10-30", status: "present", timestamp: "2025-10-30T14:00:00.000Z" },
    ],
    updatedAt: "2025-10-30T15:00:00.000Z",
  },
];
export const DEMO_ATTENDANCE = SAMPLE_ATTENDANCE;

