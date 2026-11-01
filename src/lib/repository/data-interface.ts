import {
  UserProfile,
  UserSettings,
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
  NoteTimestamp,
  PlannerEvent,
  DegreePlan,
  TranscriptSnapshot,
  AuditLog,
  Topic,
  StudySession,
  CourseAttendance,
  ExamDate,
  ClassTimetableSlot,
} from "@/types/schemas";

export interface DataStore {
  // User Profile & Settings
  getUser(): Promise<UserProfile | null>;
  updateSettings(settings: Partial<UserSettings>): Promise<void>;
  resetAccount(): Promise<void>;

  // Academic Terms
  getTerms(): Promise<Term[]>;
  getCurrentTerm(): Promise<Term | null>;
  createTerm(term: Omit<Term, "id" | "userId" | "createdAt">): Promise<Term>;
  setCurrentTerm(termId: string): Promise<void>;

  // Courses
  getCourses(termId?: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  createCourse(course: Omit<Course, "id" | "userId" | "createdAt">): Promise<Course>;
  updateCourse(courseId: string, updates: Partial<Course>): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;

  // Modules / Units
  getModules(courseId: string): Promise<Module[]>;
  getUnits(courseId: string): Promise<Module[]>;
  createModule(
    moduleData: Omit<Module, "id" | "userId" | "createdAt" | "isSection"> & {
      isSection?: boolean;
      unitNumber?: number;
      electiveExperimentsCount?: number | null;
    }
  ): Promise<Module>;
  updateModuleOrder(modules: { id: string; order: number }[]): Promise<void>;
  toggleModuleCollapsed(moduleId: string, isCollapsed: boolean): Promise<void>;

  // Topics
  getTopics(unitId: string): Promise<Topic[]>;
  getAllTopics(courseId?: string): Promise<Topic[]>;
  createTopic(
    topic: Omit<Topic, "id" | "userId" | "createdAt">
  ): Promise<Topic>;
  updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic>;
  deleteTopic(topicId: string): Promise<void>;
  resetCourseToOriginalSyllabus(courseId: string): Promise<void>;

  // Lessons
  getLessons(courseId: string): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  addLessons(
    lessons: (Omit<Lesson, "id" | "userId" | "createdAt" | "linkedTopicIds"> & {
      linkedTopicIds?: string[];
    })[]
  ): Promise<Lesson[]>;
  updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson>;
  updateLessonOrder(lessons: { id: string; order: number; moduleId: string }[]): Promise<void>;
  deleteLesson(lessonId: string): Promise<void>;

  // Watch Progress
  getLessonProgress(lessonId: string): Promise<LessonProgress | null>;
  getAllLessonProgress(courseId?: string): Promise<LessonProgress[]>;
  updateLessonProgress(
    progress: Omit<LessonProgress, "id" | "userId" | "updatedAt">
  ): Promise<LessonProgress>;

  // Notes
  getNote(lessonId: string): Promise<Note | null>;
  saveNote(
    courseId: string,
    lessonId: string,
    content: string,
    timestamps: NoteTimestamp[]
  ): Promise<Note>;
  getAllNotes(courseId?: string): Promise<Note[]>;

  // Assessments & Question Bank
  getAssessments(courseId: string): Promise<Assessment[]>;
  getAssessment(assessmentId: string): Promise<Assessment | null>;
  createAssessment(
    assessment: Omit<Assessment, "id" | "userId" | "createdAt">
  ): Promise<Assessment>;
  getQuestions(assessmentId: string): Promise<Question[]>;
  saveQuestions(
    assessmentId: string,
    questions: Omit<Question, "id" | "userId">[]
  ): Promise<Question[]>;

  // Attempts (Quizzes & Exams)
  getAttempts(assessmentId: string): Promise<Attempt[]>;
  submitAttempt(attempt: Omit<Attempt, "id" | "userId">): Promise<Attempt>;

  // Rubrics & Submissions (Assignments)
  getRubric(assessmentId: string): Promise<Rubric | null>;
  saveRubric(rubric: Omit<Rubric, "id" | "userId">): Promise<Rubric>;
  getSubmission(assessmentId: string): Promise<Submission | null>;
  submitAssignment(submission: Omit<Submission, "id" | "userId">): Promise<Submission>;

  // Planner
  getPlannerEvents(): Promise<PlannerEvent[]>;
  createPlannerEvent(
    event: Omit<PlannerEvent, "id" | "userId">
  ): Promise<PlannerEvent>;
  togglePlannerEventDone(eventId: string, isDone: boolean): Promise<void>;

  // Degree Progress
  getDegreePlan(): Promise<DegreePlan | null>;
  updateDegreePlan(plan: Partial<DegreePlan>): Promise<DegreePlan>;

  // Official Transcript & Verification
  getTranscriptSnapshots(): Promise<TranscriptSnapshot[]>;
  createTranscriptSnapshot(
    snapshot: Omit<TranscriptSnapshot, "id" | "userId" | "issuedAt" | "verificationHash">
  ): Promise<TranscriptSnapshot>;
  toggleSnapshotPublic(snapshotId: string, isPublic: boolean): Promise<void>;
  getPublicVerificationSnapshot(
    verificationId: string
  ): Promise<TranscriptSnapshot | null>;

  // Audit Log
  logAudit(
    action: AuditLog["action"],
    entityId: string,
    details: string
  ): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;

  // Study Sessions (Focus Timer)
  getStudySessions(courseId?: string): Promise<StudySession[]>;
  logStudySession(
    session: Omit<StudySession, "id" | "userId">
  ): Promise<StudySession>;

  // Course Attendance Tracker
  getCourseAttendance(courseId: string): Promise<CourseAttendance>;
  getAllAttendance(): Promise<CourseAttendance[]>;
  updateCourseAttendance(
    courseId: string,
    updates: Partial<CourseAttendance>
  ): Promise<CourseAttendance>;
  recordAttendance(
    courseId: string,
    status: "present" | "absent",
    note?: string
  ): Promise<CourseAttendance>;

  // Exam Prep Mode & Milestone
  getCourseExamDate(courseId: string): Promise<ExamDate | null>;
  getAllExamDates(): Promise<ExamDate[]>;
  saveCourseExamDate(
    courseId: string,
    exam: { examTitle: string; date: string; targetScore?: number }
  ): Promise<ExamDate>;
  deleteCourseExamDate(courseId: string): Promise<void>;

  // Weekly Class Timetable
  getTimetableSlots(): Promise<ClassTimetableSlot[]>;
  saveTimetableSlot(
    slot: Omit<ClassTimetableSlot, "id" | "userId"> & { id?: string }
  ): Promise<ClassTimetableSlot>;
  deleteTimetableSlot(slotId: string): Promise<void>;
  generateDefaultWeeklyTimetable(courses: Course[]): Promise<ClassTimetableSlot[]>;
  clearTimetable(): Promise<void>;

  // Demo / Sample Data Controls
  loadDemoData(): Promise<void>;
  clearDemoData(): Promise<void>;
  restoreOriginalSyllabus(courseId?: string): Promise<void>;
  isDemoMode(): boolean;
  isSampleDataActive(): boolean;
  exportAllDataJson(): Promise<string>;
  importAllDataJson(jsonString: string): Promise<void>;
}
