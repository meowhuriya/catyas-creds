import { DataStore } from "./data-interface";
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
} from "@/types/schemas";
import {
  CLEAN_USER,
  SEED_TERMS,
  SEED_COURSES,
  SEED_MODULES,
  SEED_TOPICS,
  SAMPLE_USER,
  SAMPLE_LESSONS,
  SAMPLE_LESSON_PROGRESS,
  SAMPLE_ASSESSMENTS,
  SAMPLE_STUDY_SESSIONS,
  SAMPLE_PLANNER_EVENTS,
  DEMO_DEGREE_PLAN,
  DEMO_MODULES,
  DEMO_TOPICS,
} from "@/lib/demo/seed-data";
import { Topic, StudySession } from "@/types/schemas";

const STORAGE_PREFIX = "valerias_creds_";

function getStorage<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const item = window.localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

export class DemoDataStore implements DataStore {
  private user: UserProfile;
  private terms: Term[];
  private courses: Course[];
  private modules: Module[];
  private lessons: Lesson[];
  private progress: LessonProgress[];
  private assessments: Assessment[];
  private questions: Question[];
  private attempts: Attempt[];
  private rubrics: Rubric[];
  private submissions: Submission[];
  private notes: Note[];
  private plannerEvents: PlannerEvent[];
  private degreePlan: DegreePlan | null;
  private snapshots: TranscriptSnapshot[];
  private auditLogs: AuditLog[];
  private topics: Topic[];
  private studySessions: StudySession[];

  constructor() {
    const isSample = getStorage<boolean>("is_sample_active", false);
    this.user = getStorage<UserProfile>("user", isSample ? SAMPLE_USER : CLEAN_USER);
    this.terms = getStorage<Term[]>("terms", SEED_TERMS);
    this.courses = getStorage<Course[]>("courses", SEED_COURSES);
    this.modules = getStorage<Module[]>("modules", SEED_MODULES);
    this.topics = getStorage<Topic[]>("topics", SEED_TOPICS);
    this.lessons = getStorage<Lesson[]>("lessons", isSample ? SAMPLE_LESSONS : []);
    this.progress = getStorage<LessonProgress[]>("progress", isSample ? SAMPLE_LESSON_PROGRESS : []);
    this.assessments = getStorage<Assessment[]>("assessments", isSample ? SAMPLE_ASSESSMENTS : []);
    this.questions = getStorage<Question[]>("questions", []);
    this.attempts = getStorage<Attempt[]>("attempts", []);
    this.rubrics = getStorage<Rubric[]>("rubrics", []);
    this.submissions = getStorage<Submission[]>("submissions", []);
    this.notes = getStorage<Note[]>("notes", []);
    this.plannerEvents = getStorage<PlannerEvent[]>("plannerEvents", isSample ? SAMPLE_PLANNER_EVENTS : []);
    this.degreePlan = getStorage<DegreePlan | null>("degreePlan", DEMO_DEGREE_PLAN);
    this.snapshots = getStorage<TranscriptSnapshot[]>("snapshots", []);
    this.auditLogs = getStorage<AuditLog[]>("auditLogs", []);
    this.studySessions = getStorage<StudySession[]>("studySessions", isSample ? SAMPLE_STUDY_SESSIONS : []);
  }

  isDemoMode(): boolean {
    return true;
  }

  isSampleDataActive(): boolean {
    return getStorage<boolean>("is_sample_active", false);
  }

  async loadDemoData(): Promise<void> {
    setStorage("is_sample_active", true);
    this.user = { ...SAMPLE_USER };
    this.lessons = [...SAMPLE_LESSONS];
    this.progress = [...SAMPLE_LESSON_PROGRESS];
    this.assessments = [...SAMPLE_ASSESSMENTS];
    this.plannerEvents = [...SAMPLE_PLANNER_EVENTS];
    this.studySessions = [...SAMPLE_STUDY_SESSIONS];
    this.persistAll();
  }

  async clearDemoData(): Promise<void> {
    setStorage("is_sample_active", false);
    this.user = { ...CLEAN_USER };
    this.lessons = [];
    this.progress = [];
    this.assessments = [];
    this.questions = [];
    this.attempts = [];
    this.rubrics = [];
    this.submissions = [];
    this.notes = [];
    this.plannerEvents = [];
    this.studySessions = [];
    this.snapshots = [];
    this.auditLogs = [];
    this.persistAll();
  }

  async restoreOriginalSyllabus(courseId?: string): Promise<void> {
    if (courseId) {
      await this.resetCourseToOriginalSyllabus(courseId);
    } else {
      this.terms = [...SEED_TERMS];
      this.courses = [...SEED_COURSES];
      this.modules = [...SEED_MODULES];
      this.topics = [...SEED_TOPICS];
      setStorage("terms", this.terms);
      setStorage("courses", this.courses);
      setStorage("modules", this.modules);
      setStorage("topics", this.topics);
    }
  }

  private persistAll() {
    setStorage("user", this.user);
    setStorage("terms", this.terms);
    setStorage("courses", this.courses);
    setStorage("modules", this.modules);
    setStorage("lessons", this.lessons);
    setStorage("progress", this.progress);
    setStorage("assessments", this.assessments);
    setStorage("questions", this.questions);
    setStorage("attempts", this.attempts);
    setStorage("rubrics", this.rubrics);
    setStorage("submissions", this.submissions);
    setStorage("notes", this.notes);
    setStorage("plannerEvents", this.plannerEvents);
    setStorage("degreePlan", this.degreePlan);
    setStorage("snapshots", this.snapshots);
    setStorage("auditLogs", this.auditLogs);
    setStorage("topics", this.topics);
    setStorage("studySessions", this.studySessions);
  }

  async getUser(): Promise<UserProfile | null> {
    return this.user;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    this.user.settings = { ...this.user.settings, ...settings };
    setStorage("user", this.user);
  }

  async resetAccount(): Promise<void> {
    await this.clearDemoData();
  }

  async getTerms(): Promise<Term[]> {
    return [...this.terms];
  }

  async getCurrentTerm(): Promise<Term | null> {
    return this.terms.find((t) => t.isCurrent) || this.terms[0] || null;
  }

  async createTerm(termData: Omit<Term, "id" | "userId" | "createdAt">): Promise<Term> {
    const newTerm: Term = {
      ...termData,
      id: "term-" + Date.now(),
      userId: this.user.uid,
      createdAt: new Date().toISOString(),
    };
    if (newTerm.isCurrent) {
      this.terms = this.terms.map((t) => ({ ...t, isCurrent: false }));
    }
    this.terms.push(newTerm);
    setStorage("terms", this.terms);
    return newTerm;
  }

  async setCurrentTerm(termId: string): Promise<void> {
    this.terms = this.terms.map((t) => ({ ...t, isCurrent: t.id === termId }));
    this.user.currentTermId = termId;
    setStorage("terms", this.terms);
    setStorage("user", this.user);
  }

  async getCourses(termId?: string): Promise<Course[]> {
    if (termId) {
      return this.courses.filter((c) => c.termId === termId);
    }
    return [...this.courses];
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return this.courses.find((c) => c.id === courseId) || null;
  }

  async createCourse(courseData: Omit<Course, "id" | "userId" | "createdAt">): Promise<Course> {
    const newCourse: Course = {
      ...courseData,
      id: "course-" + Date.now(),
      userId: this.user.uid,
      createdAt: new Date().toISOString(),
    };
    this.courses.push(newCourse);
    setStorage("courses", this.courses);
    return newCourse;
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    const idx = this.courses.findIndex((c) => c.id === courseId);
    if (idx === -1) throw new Error("Course not found");
    this.courses[idx] = { ...this.courses[idx], ...updates };
    setStorage("courses", this.courses);
    return this.courses[idx];
  }

  async deleteCourse(courseId: string): Promise<void> {
    this.courses = this.courses.filter((c) => c.id !== courseId);
    this.modules = this.modules.filter((m) => m.courseId !== courseId);
    this.lessons = this.lessons.filter((l) => l.courseId !== courseId);
    this.assessments = this.assessments.filter((a) => a.courseId !== courseId);
    this.persistAll();
  }

  async getModules(courseId: string): Promise<Module[]> {
    return this.modules
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getUnits(courseId: string): Promise<Module[]> {
    return this.getModules(courseId);
  }

  async getTopics(unitId: string): Promise<Topic[]> {
    return this.topics
      .filter((t) => t.unitId === unitId)
      .sort((a, b) => a.order - b.order);
  }

  async getAllTopics(courseId?: string): Promise<Topic[]> {
    if (courseId) {
      return this.topics
        .filter((t) => t.courseId === courseId)
        .sort((a, b) => a.order - b.order);
    }
    return [...this.topics];
  }

  async createTopic(
    topicData: Omit<Topic, "id" | "userId" | "createdAt">
  ): Promise<Topic> {
    const newTopic: Topic = {
      ...topicData,
      id: "topic-" + Date.now(),
      userId: this.user.uid,
      createdAt: new Date().toISOString(),
    };
    this.topics.push(newTopic);
    setStorage("topics", this.topics);
    return newTopic;
  }

  async updateTopic(
    topicId: string,
    updates: Partial<Topic>
  ): Promise<Topic> {
    const idx = this.topics.findIndex((t) => t.id === topicId);
    if (idx === -1) throw new Error("Topic not found");
    const updated = { ...this.topics[idx], ...updates };
    if (updates.watchScore !== undefined || updates.checkScore !== undefined) {
      updated.topicScore = updated.watchScore + updated.checkScore;
      updated.isDone = updated.topicScore >= 70;
    }
    this.topics[idx] = updated;
    setStorage("topics", this.topics);
    return updated;
  }

  async deleteTopic(topicId: string): Promise<void> {
    this.topics = this.topics.filter((t) => t.id !== topicId);
    setStorage("topics", this.topics);
  }

  async resetCourseToOriginalSyllabus(courseId: string): Promise<void> {
    // Re-seed modules and topics for this course from DEMO_MODULES and DEMO_TOPICS
    const origModules = DEMO_MODULES.filter((m) => m.courseId === courseId);
    const origTopics = DEMO_TOPICS.filter((t) => t.courseId === courseId);

    // Remove existing modules and topics for this course
    this.modules = this.modules.filter((m) => m.courseId !== courseId).concat(origModules);
    this.topics = this.topics.filter((t) => t.courseId !== courseId).concat(origTopics);

    setStorage("modules", this.modules);
    setStorage("topics", this.topics);
  }

  async createModule(moduleData: Omit<Module, "id" | "userId" | "createdAt">): Promise<Module> {
    const newModule: Module = {
      ...moduleData,
      id: "mod-" + Date.now(),
      userId: this.user.uid,
      createdAt: new Date().toISOString(),
    };
    this.modules.push(newModule);
    setStorage("modules", this.modules);
    return newModule;
  }

  async updateModuleOrder(moduleOrders: { id: string; order: number }[]): Promise<void> {
    const orderMap = new Map(moduleOrders.map((m) => [m.id, m.order]));
    this.modules = this.modules.map((m) =>
      orderMap.has(m.id) ? { ...m, order: orderMap.get(m.id)! } : m
    );
    setStorage("modules", this.modules);
  }

  async toggleModuleCollapsed(moduleId: string, isCollapsed: boolean): Promise<void> {
    const idx = this.modules.findIndex((m) => m.id === moduleId);
    if (idx !== -1) {
      this.modules[idx].isCollapsed = isCollapsed;
      setStorage("modules", this.modules);
    }
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    return this.lessons
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    return this.lessons.find((l) => l.id === lessonId) || null;
  }

  async addLessons(
    newLessonsData: Omit<Lesson, "id" | "userId" | "createdAt">[]
  ): Promise<Lesson[]> {
    const added: Lesson[] = [];
    const timestamp = new Date().toISOString();
    let orderOffset = this.lessons.length;

    for (const data of newLessonsData) {
      const lesson: Lesson = {
        ...data,
        id: "les-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        userId: this.user.uid,
        order: data.order ?? orderOffset++,
        createdAt: timestamp,
      };
      this.lessons.push(lesson);
      added.push(lesson);
    }
    setStorage("lessons", this.lessons);
    return added;
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson> {
    const idx = this.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) throw new Error("Lesson not found");
    this.lessons[idx] = { ...this.lessons[idx], ...updates };
    setStorage("lessons", this.lessons);
    return this.lessons[idx];
  }

  async updateLessonOrder(
    lessonUpdates: { id: string; order: number; moduleId: string }[]
  ): Promise<void> {
    const updateMap = new Map(lessonUpdates.map((l) => [l.id, l]));
    this.lessons = this.lessons.map((l) => {
      const update = updateMap.get(l.id);
      return update ? { ...l, order: update.order, moduleId: update.moduleId } : l;
    });
    setStorage("lessons", this.lessons);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    this.lessons = this.lessons.filter((l) => l.id !== lessonId);
    this.progress = this.progress.filter((p) => p.lessonId !== lessonId);
    this.notes = this.notes.filter((n) => n.lessonId !== lessonId);
    setStorage("lessons", this.lessons);
    setStorage("progress", this.progress);
    setStorage("notes", this.notes);
  }

  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    return this.progress.find((p) => p.lessonId === lessonId) || null;
  }

  async getAllLessonProgress(courseId?: string): Promise<LessonProgress[]> {
    if (courseId) {
      return this.progress.filter((p) => p.courseId === courseId);
    }
    return [...this.progress];
  }

  async updateLessonProgress(
    progData: Omit<LessonProgress, "id" | "userId" | "updatedAt">
  ): Promise<LessonProgress> {
    const idx = this.progress.findIndex((p) => p.lessonId === progData.lessonId);
    const now = new Date().toISOString();

    let result: LessonProgress;
    if (idx !== -1) {
      this.progress[idx] = {
        ...this.progress[idx],
        ...progData,
        updatedAt: now,
      };
      result = this.progress[idx];
    } else {
      const newProg: LessonProgress = {
        ...progData,
        id: "prog-" + Date.now(),
        userId: this.user.uid,
        updatedAt: now,
      };
      this.progress.push(newProg);
      result = newProg;
    }
    setStorage("progress", this.progress);

    // If lesson is marked completed (90%+ watched), award 40 points to linked topics
    if (progData.isCompleted) {
      const lesson = this.lessons.find((l) => l.id === progData.lessonId);
      if (lesson && lesson.linkedTopicIds && lesson.linkedTopicIds.length > 0) {
        let changed = false;
        for (const tid of lesson.linkedTopicIds) {
          const tIdx = this.topics.findIndex((t) => t.id === tid);
          if (tIdx !== -1 && this.topics[tIdx].watchScore < 40) {
            this.topics[tIdx].watchScore = 40;
            this.topics[tIdx].topicScore = this.topics[tIdx].watchScore + this.topics[tIdx].checkScore;
            this.topics[tIdx].isDone = this.topics[tIdx].topicScore >= 70;
            changed = true;
          }
        }
        if (changed) {
          setStorage("topics", this.topics);
        }
      }
    }

    return result;
  }

  async getNote(lessonId: string): Promise<Note | null> {
    return this.notes.find((n) => n.lessonId === lessonId) || null;
  }

  async saveNote(
    courseId: string,
    lessonId: string,
    content: string,
    timestamps: NoteTimestamp[]
  ): Promise<Note> {
    const idx = this.notes.findIndex((n) => n.lessonId === lessonId);
    const now = new Date().toISOString();

    if (idx !== -1) {
      this.notes[idx] = {
        ...this.notes[idx],
        content,
        timestamps,
        updatedAt: now,
      };
      setStorage("notes", this.notes);
      return this.notes[idx];
    } else {
      const newNote: Note = {
        id: "note-" + Date.now(),
        userId: this.user.uid,
        courseId,
        lessonId,
        content,
        timestamps,
        updatedAt: now,
      };
      this.notes.push(newNote);
      setStorage("notes", this.notes);
      return newNote;
    }
  }

  async getAllNotes(courseId?: string): Promise<Note[]> {
    if (courseId) {
      return this.notes.filter((n) => n.courseId === courseId);
    }
    return [...this.notes];
  }

  async getAssessments(courseId: string): Promise<Assessment[]> {
    return this.assessments.filter((a) => a.courseId === courseId);
  }

  async getAssessment(assessmentId: string): Promise<Assessment | null> {
    return this.assessments.find((a) => a.id === assessmentId) || null;
  }

  async createAssessment(
    asmData: Omit<Assessment, "id" | "userId" | "createdAt">
  ): Promise<Assessment> {
    const newAsm: Assessment = {
      ...asmData,
      id: "asm-" + Date.now(),
      userId: this.user.uid,
      createdAt: new Date().toISOString(),
    };
    this.assessments.push(newAsm);
    setStorage("assessments", this.assessments);
    return newAsm;
  }

  async getQuestions(assessmentId: string): Promise<Question[]> {
    return this.questions.filter((q) => q.assessmentId === assessmentId);
  }

  async saveQuestions(
    assessmentId: string,
    qs: Omit<Question, "id" | "userId">[]
  ): Promise<Question[]> {
    this.questions = this.questions.filter((q) => q.assessmentId !== assessmentId);
    const saved: Question[] = qs.map((q, i) => ({
      ...q,
      id: `q-${Date.now()}-${i}`,
      userId: this.user.uid,
      assessmentId,
    }));
    this.questions.push(...saved);
    setStorage("questions", this.questions);
    return saved;
  }

  async getAttempts(assessmentId: string): Promise<Attempt[]> {
    return this.attempts.filter((a) => a.assessmentId === assessmentId);
  }

  async submitAttempt(attemptData: Omit<Attempt, "id" | "userId">): Promise<Attempt> {
    const newAttempt: Attempt = {
      ...attemptData,
      id: "att-" + Date.now(),
      userId: this.user.uid,
    };
    this.attempts.push(newAttempt);
    setStorage("attempts", this.attempts);
    return newAttempt;
  }

  async getRubric(assessmentId: string): Promise<Rubric | null> {
    return this.rubrics.find((r) => r.assessmentId === assessmentId) || null;
  }

  async saveRubric(rubricData: Omit<Rubric, "id" | "userId">): Promise<Rubric> {
    const idx = this.rubrics.findIndex((r) => r.assessmentId === rubricData.assessmentId);
    if (idx !== -1) {
      this.rubrics[idx] = { ...this.rubrics[idx], ...rubricData };
      setStorage("rubrics", this.rubrics);
      return this.rubrics[idx];
    } else {
      const newRubric: Rubric = {
        ...rubricData,
        id: "rubric-" + Date.now(),
        userId: this.user.uid,
      };
      this.rubrics.push(newRubric);
      setStorage("rubrics", this.rubrics);
      return newRubric;
    }
  }

  async getSubmission(assessmentId: string): Promise<Submission | null> {
    return this.submissions.find((s) => s.assessmentId === assessmentId) || null;
  }

  async submitAssignment(
    subData: Omit<Submission, "id" | "userId">
  ): Promise<Submission> {
    const idx = this.submissions.findIndex((s) => s.assessmentId === subData.assessmentId);
    if (idx !== -1) {
      this.submissions[idx] = { ...this.submissions[idx], ...subData };
      setStorage("submissions", this.submissions);
      return this.submissions[idx];
    } else {
      const newSub: Submission = {
        ...subData,
        id: "sub-" + Date.now(),
        userId: this.user.uid,
      };
      this.submissions.push(newSub);
      setStorage("submissions", this.submissions);
      return newSub;
    }
  }

  async getPlannerEvents(): Promise<PlannerEvent[]> {
    return [...this.plannerEvents];
  }

  async createPlannerEvent(
    eventData: Omit<PlannerEvent, "id" | "userId">
  ): Promise<PlannerEvent> {
    const newEvent: PlannerEvent = {
      ...eventData,
      id: "plan-" + Date.now(),
      userId: this.user.uid,
    };
    this.plannerEvents.push(newEvent);
    setStorage("plannerEvents", this.plannerEvents);
    return newEvent;
  }

  async togglePlannerEventDone(eventId: string, isDone: boolean): Promise<void> {
    const idx = this.plannerEvents.findIndex((p) => p.id === eventId);
    if (idx !== -1) {
      this.plannerEvents[idx].isDone = isDone;
      setStorage("plannerEvents", this.plannerEvents);
    }
  }

  async getDegreePlan(): Promise<DegreePlan | null> {
    return this.degreePlan;
  }

  async updateDegreePlan(planUpdates: Partial<DegreePlan>): Promise<DegreePlan> {
    this.degreePlan = {
      id: this.degreePlan?.id || "degree-plan-" + Date.now(),
      userId: this.user.uid,
      totalCreditsTarget: planUpdates.totalCreditsTarget ?? this.degreePlan?.totalCreditsTarget ?? 120,
      departmentRequirements: planUpdates.departmentRequirements ?? this.degreePlan?.departmentRequirements ?? {},
      levelRequirements: planUpdates.levelRequirements ?? this.degreePlan?.levelRequirements ?? {},
    };
    setStorage("degreePlan", this.degreePlan);
    return this.degreePlan;
  }

  async getTranscriptSnapshots(): Promise<TranscriptSnapshot[]> {
    return [...this.snapshots];
  }

  async createTranscriptSnapshot(
    snapData: Omit<TranscriptSnapshot, "id" | "userId" | "issuedAt" | "verificationHash">
  ): Promise<TranscriptSnapshot> {
    const id = "VER-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const newSnapshot: TranscriptSnapshot = {
      ...snapData,
      id,
      userId: this.user.uid,
      issuedAt: new Date().toISOString(),
      verificationHash: "hash-" + Math.random().toString(36).substring(2, 12),
    };
    this.snapshots.push(newSnapshot);
    setStorage("snapshots", this.snapshots);
    return newSnapshot;
  }

  async toggleSnapshotPublic(snapshotId: string, isPublic: boolean): Promise<void> {
    const idx = this.snapshots.findIndex((s) => s.id === snapshotId);
    if (idx !== -1) {
      this.snapshots[idx].isPublic = isPublic;
      setStorage("snapshots", this.snapshots);
    }
  }

  async getPublicVerificationSnapshot(
    verificationId: string
  ): Promise<TranscriptSnapshot | null> {
    const found = this.snapshots.find((s) => s.id === verificationId);
    if (found && found.isPublic) {
      return found;
    }
    return null;
  }

  async logAudit(
    action: AuditLog["action"],
    entityId: string,
    details: string
  ): Promise<void> {
    const newLog: AuditLog = {
      id: "audit-" + Date.now(),
      userId: this.user.uid,
      action,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    setStorage("auditLogs", this.auditLogs);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  async getStudySessions(courseId?: string): Promise<StudySession[]> {
    if (courseId) {
      return this.studySessions.filter((s) => s.courseId === courseId);
    }
    return [...this.studySessions];
  }

  async logStudySession(
    sessionData: Omit<StudySession, "id" | "userId">
  ): Promise<StudySession> {
    const newSession: StudySession = {
      ...sessionData,
      id: "session-" + Date.now(),
      userId: this.user.uid,
    };
    this.studySessions.push(newSession);
    setStorage("studySessions", this.studySessions);
    return newSession;
  }

  async exportAllDataJson(): Promise<string> {
    const payload = {
      user: this.user,
      terms: this.terms,
      courses: this.courses,
      modules: this.modules,
      topics: this.topics,
      lessons: this.lessons,
      progress: this.progress,
      assessments: this.assessments,
      questions: this.questions,
      attempts: this.attempts,
      rubrics: this.rubrics,
      submissions: this.submissions,
      notes: this.notes,
      plannerEvents: this.plannerEvents,
      studySessions: this.studySessions,
      degreePlan: this.degreePlan,
      snapshots: this.snapshots,
      auditLogs: this.auditLogs,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  async importAllDataJson(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.user) this.user = data.user;
    if (Array.isArray(data.terms)) this.terms = data.terms;
    if (Array.isArray(data.courses)) this.courses = data.courses;
    if (Array.isArray(data.modules)) this.modules = data.modules;
    if (Array.isArray(data.topics)) this.topics = data.topics;
    if (Array.isArray(data.lessons)) this.lessons = data.lessons;
    if (Array.isArray(data.progress)) this.progress = data.progress;
    if (Array.isArray(data.assessments)) this.assessments = data.assessments;
    if (Array.isArray(data.questions)) this.questions = data.questions;
    if (Array.isArray(data.attempts)) this.attempts = data.attempts;
    if (Array.isArray(data.rubrics)) this.rubrics = data.rubrics;
    if (Array.isArray(data.submissions)) this.submissions = data.submissions;
    if (Array.isArray(data.notes)) this.notes = data.notes;
    if (Array.isArray(data.plannerEvents)) this.plannerEvents = data.plannerEvents;
    if (Array.isArray(data.studySessions)) this.studySessions = data.studySessions;
    if (data.degreePlan) this.degreePlan = data.degreePlan;
    if (Array.isArray(data.snapshots)) this.snapshots = data.snapshots;
    if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
    this.persistAll();
  }
}
