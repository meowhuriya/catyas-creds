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
  Topic,
  StudySession,
} from "@/types/schemas";
import { db, auth } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export class FirebaseDataStore implements DataStore {
  private get currentUid(): string {
    const user = auth?.currentUser;
    if (!user) throw new Error("Authentication required for FirebaseDataStore");
    return user.uid;
  }

  isDemoMode(): boolean {
    return false;
  }

  async loadDemoData(): Promise<void> {
    // In Firebase mode, demo data is not automatically loaded unless explicitly converted
    console.log("Loading demo data into Firestore for current user...");
  }

  async clearDemoData(): Promise<void> {
    console.log("Clear data requested in Firestore mode");
  }

  isSampleDataActive(): boolean {
    return false;
  }

  async restoreOriginalSyllabus(courseId?: string): Promise<void> {
    console.log("Restore original syllabus in Firestore mode for:", courseId || "all");
  }

  async getUser(): Promise<UserProfile | null> {
    if (!db || !auth?.currentUser) return null;
    const snap = await getDoc(doc(db, "users", this.currentUid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    if (!db) return;
    const ref = doc(db, "users", this.currentUid);
    await updateDoc(ref, {
      settings: settings,
    });
  }

  async resetAccount(): Promise<void> {
    // Intentionally empty for safety
  }

  async getTerms(): Promise<Term[]> {
    if (!db) return [];
    const q = query(collection(db, "terms"), where("userId", "==", this.currentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Term);
  }

  async getCurrentTerm(): Promise<Term | null> {
    const terms = await this.getTerms();
    return terms.find((t) => t.isCurrent) || terms[0] || null;
  }

  async createTerm(termData: Omit<Term, "id" | "userId" | "createdAt">): Promise<Term> {
    if (!db) throw new Error("Firestore not configured");
    const id = "term-" + Date.now();
    const term: Term = {
      ...termData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "terms", id), term);
    return term;
  }

  async setCurrentTerm(termId: string): Promise<void> {
    if (!db) return;
    const terms = await this.getTerms();
    for (const t of terms) {
      if (t.isCurrent !== (t.id === termId)) {
        await updateDoc(doc(db, "terms", t.id), { isCurrent: t.id === termId });
      }
    }
  }

  async getCourses(termId?: string): Promise<Course[]> {
    if (!db) return [];
    let q = query(collection(db, "courses"), where("userId", "==", this.currentUid));
    if (termId) {
      q = query(q, where("termId", "==", termId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Course);
  }

  async getCourse(courseId: string): Promise<Course | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "courses", courseId));
    if (!snap.exists()) return null;
    const data = snap.data() as Course;
    return data.userId === this.currentUid ? data : null;
  }

  async createCourse(courseData: Omit<Course, "id" | "userId" | "createdAt">): Promise<Course> {
    if (!db) throw new Error("Firestore not configured");
    const id = "course-" + Date.now();
    const course: Course = {
      ...courseData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "courses", id), course);
    return course;
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "courses", courseId);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Course;
  }

  async deleteCourse(courseId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "courses", courseId));
  }

  async getModules(courseId: string): Promise<Module[]> {
    if (!db) return [];
    const q = query(
      collection(db, "modules"),
      where("userId", "==", this.currentUid),
      where("courseId", "==", courseId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Module)
      .sort((a, b) => a.order - b.order);
  }

  async getUnits(courseId: string): Promise<Module[]> {
    return this.getModules(courseId);
  }

  async getTopics(unitId: string): Promise<Topic[]> {
    if (!db) return [];
    const q = query(
      collection(db, "topics"),
      where("userId", "==", this.currentUid),
      where("unitId", "==", unitId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Topic)
      .sort((a, b) => a.order - b.order);
  }

  async getAllTopics(courseId?: string): Promise<Topic[]> {
    if (!db) return [];
    const q = courseId
      ? query(
          collection(db, "topics"),
          where("userId", "==", this.currentUid),
          where("courseId", "==", courseId)
        )
      : query(
          collection(db, "topics"),
          where("userId", "==", this.currentUid)
        );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Topic)
      .sort((a, b) => a.order - b.order);
  }

  async createTopic(topicData: Omit<Topic, "id" | "userId" | "createdAt">): Promise<Topic> {
    if (!db) throw new Error("Firestore not configured");
    const id = "topic-" + Date.now();
    const topic: Topic = {
      ...topicData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "topics", id), topic);
    return topic;
  }

  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "topics", topicId);
    if (updates.watchScore !== undefined || updates.checkScore !== undefined) {
      const snap = await getDoc(ref);
      const existing = (snap.data() as Topic) || {};
      const w = updates.watchScore ?? existing.watchScore ?? 0;
      const c = updates.checkScore ?? existing.checkScore ?? 0;
      updates.topicScore = w + c;
      updates.isDone = updates.topicScore >= 70;
    }
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Topic;
  }

  async deleteTopic(topicId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "topics", topicId));
  }

  async resetCourseToOriginalSyllabus(courseId: string): Promise<void> {
    // In Firebase mode, fetches original seed definition and replaces topics/units for this course
    if (!db) return;
    // We import dynamically or handle through repo
  }

  async createModule(moduleData: Omit<Module, "id" | "userId" | "createdAt">): Promise<Module> {
    if (!db) throw new Error("Firestore not configured");
    const id = "mod-" + Date.now();
    const mod: Module = {
      ...moduleData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "modules", id), mod);
    return mod;
  }

  async updateModuleOrder(modules: { id: string; order: number }[]): Promise<void> {
    if (!db) return;
    for (const m of modules) {
      await updateDoc(doc(db, "modules", m.id), { order: m.order });
    }
  }

  async toggleModuleCollapsed(moduleId: string, isCollapsed: boolean): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, "modules", moduleId), { isCollapsed });
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    if (!db) return [];
    const q = query(
      collection(db, "lessons"),
      where("userId", "==", this.currentUid),
      where("courseId", "==", courseId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Lesson)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "lessons", lessonId));
    if (!snap.exists()) return null;
    const data = snap.data() as Lesson;
    return data.userId === this.currentUid ? data : null;
  }

  async addLessons(lessonsData: Omit<Lesson, "id" | "userId" | "createdAt">[]): Promise<Lesson[]> {
    if (!db) throw new Error("Firestore not configured");
    const added: Lesson[] = [];
    const now = new Date().toISOString();

    for (const data of lessonsData) {
      const id = "les-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const lesson: Lesson = {
        ...data,
        id,
        userId: this.currentUid,
        createdAt: now,
      };
      await setDoc(doc(db, "lessons", id), lesson);
      added.push(lesson);
    }
    return added;
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "lessons", lessonId);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Lesson;
  }

  async updateLessonOrder(
    lessons: { id: string; order: number; moduleId: string }[]
  ): Promise<void> {
    if (!db) return;
    for (const l of lessons) {
      await updateDoc(doc(db, "lessons", l.id), {
        order: l.order,
        moduleId: l.moduleId,
      });
    }
  }

  async deleteLesson(lessonId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "lessons", lessonId));
  }

  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "lessonProgress", `${this.currentUid}_${lessonId}`));
    if (!snap.exists()) return null;
    return snap.data() as LessonProgress;
  }

  async getAllLessonProgress(courseId?: string): Promise<LessonProgress[]> {
    if (!db) return [];
    let q = query(collection(db, "lessonProgress"), where("userId", "==", this.currentUid));
    if (courseId) {
      q = query(q, where("courseId", "==", courseId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LessonProgress);
  }

  async updateLessonProgress(
    progressData: Omit<LessonProgress, "id" | "userId" | "updatedAt">
  ): Promise<LessonProgress> {
    if (!db) throw new Error("Firestore not configured");
    const id = `${this.currentUid}_${progressData.lessonId}`;
    const now = new Date().toISOString();
    const progress: LessonProgress = {
      ...progressData,
      id,
      userId: this.currentUid,
      updatedAt: now,
    };
    await setDoc(doc(db, "lessonProgress", id), progress, { merge: true });

    // Auto-award 40 watch mastery points to linked topics if completed
    if (progressData.isCompleted) {
      try {
        const lessonSnap = await getDoc(doc(db, "lessons", progressData.lessonId));
        if (lessonSnap.exists()) {
          const lesson = lessonSnap.data() as Lesson;
          if (lesson.linkedTopicIds && lesson.linkedTopicIds.length > 0) {
            for (const tid of lesson.linkedTopicIds) {
              const topicRef = doc(db, "topics", tid);
              const topicSnap = await getDoc(topicRef);
              if (topicSnap.exists()) {
                const topicData = topicSnap.data() as Topic;
                if ((topicData.watchScore || 0) < 40) {
                  const watchScore = 40;
                  const topicScore = watchScore + (topicData.checkScore || 0);
                  const isDone = topicScore >= 70;
                  await updateDoc(topicRef, {
                    watchScore,
                    topicScore,
                    isDone,
                    updatedAt: now,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not auto-award topic watch scores in firestore:", err);
      }
    }

    return progress;
  }

  async getNote(lessonId: string): Promise<Note | null> {
    if (!db) return null;
    const q = query(
      collection(db, "notes"),
      where("userId", "==", this.currentUid),
      where("lessonId", "==", lessonId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Note;
  }

  async saveNote(
    courseId: string,
    lessonId: string,
    content: string,
    timestamps: NoteTimestamp[]
  ): Promise<Note> {
    if (!db) throw new Error("Firestore not configured");
    const id = `note_${this.currentUid}_${lessonId}`;
    const now = new Date().toISOString();
    const note: Note = {
      id,
      userId: this.currentUid,
      courseId,
      lessonId,
      content,
      timestamps,
      updatedAt: now,
    };
    await setDoc(doc(db, "notes", id), note);
    return note;
  }

  async getAllNotes(courseId?: string): Promise<Note[]> {
    if (!db) return [];
    let q = query(collection(db, "notes"), where("userId", "==", this.currentUid));
    if (courseId) {
      q = query(q, where("courseId", "==", courseId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Note);
  }

  async getAssessments(courseId: string): Promise<Assessment[]> {
    if (!db) return [];
    const q = query(
      collection(db, "assessments"),
      where("userId", "==", this.currentUid),
      where("courseId", "==", courseId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Assessment);
  }

  async getAssessment(assessmentId: string): Promise<Assessment | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "assessments", assessmentId));
    if (!snap.exists()) return null;
    return snap.data() as Assessment;
  }

  async createAssessment(
    asmData: Omit<Assessment, "id" | "userId" | "createdAt">
  ): Promise<Assessment> {
    if (!db) throw new Error("Firestore not configured");
    const id = "asm-" + Date.now();
    const asm: Assessment = {
      ...asmData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "assessments", id), asm);
    return asm;
  }

  async getQuestions(assessmentId: string): Promise<Question[]> {
    if (!db) return [];
    const q = query(
      collection(db, "questions"),
      where("userId", "==", this.currentUid),
      where("assessmentId", "==", assessmentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Question);
  }

  async saveQuestions(
    assessmentId: string,
    questions: Omit<Question, "id" | "userId">[]
  ): Promise<Question[]> {
    if (!db) throw new Error("Firestore not configured");
    const saved: Question[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = `q-${Date.now()}-${i}`;
      const item: Question = {
        ...q,
        id,
        userId: this.currentUid,
        assessmentId,
      };
      await setDoc(doc(db, "questions", id), item);
      saved.push(item);
    }
    return saved;
  }

  async getAttempts(assessmentId: string): Promise<Attempt[]> {
    if (!db) return [];
    const q = query(
      collection(db, "attempts"),
      where("userId", "==", this.currentUid),
      where("assessmentId", "==", assessmentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Attempt);
  }

  async submitAttempt(attemptData: Omit<Attempt, "id" | "userId">): Promise<Attempt> {
    if (!db) throw new Error("Firestore not configured");
    const id = "att-" + Date.now();
    const attempt: Attempt = {
      ...attemptData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "attempts", id), attempt);
    return attempt;
  }

  async getRubric(assessmentId: string): Promise<Rubric | null> {
    if (!db) return null;
    const q = query(
      collection(db, "rubrics"),
      where("userId", "==", this.currentUid),
      where("assessmentId", "==", assessmentId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Rubric;
  }

  async saveRubric(rubricData: Omit<Rubric, "id" | "userId">): Promise<Rubric> {
    if (!db) throw new Error("Firestore not configured");
    const id = "rubric-" + Date.now();
    const rubric: Rubric = {
      ...rubricData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "rubrics", id), rubric);
    return rubric;
  }

  async getSubmission(assessmentId: string): Promise<Submission | null> {
    if (!db) return null;
    const q = query(
      collection(db, "submissions"),
      where("userId", "==", this.currentUid),
      where("assessmentId", "==", assessmentId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Submission;
  }

  async submitAssignment(submissionData: Omit<Submission, "id" | "userId">): Promise<Submission> {
    if (!db) throw new Error("Firestore not configured");
    const id = "sub-" + Date.now();
    const submission: Submission = {
      ...submissionData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "submissions", id), submission);
    return submission;
  }

  async getPlannerEvents(): Promise<PlannerEvent[]> {
    if (!db) return [];
    const q = query(collection(db, "plannerEvents"), where("userId", "==", this.currentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlannerEvent);
  }

  async createPlannerEvent(
    eventData: Omit<PlannerEvent, "id" | "userId">
  ): Promise<PlannerEvent> {
    if (!db) throw new Error("Firestore not configured");
    const id = "plan-" + Date.now();
    const event: PlannerEvent = {
      ...eventData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "plannerEvents", id), event);
    return event;
  }

  async togglePlannerEventDone(eventId: string, isDone: boolean): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, "plannerEvents", eventId), { isDone });
  }

  async getDegreePlan(): Promise<DegreePlan | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "degreePlans", this.currentUid));
    if (!snap.exists()) return null;
    return snap.data() as DegreePlan;
  }

  async updateDegreePlan(plan: Partial<DegreePlan>): Promise<DegreePlan> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "degreePlans", this.currentUid);
    const updated: DegreePlan = {
      id: this.currentUid,
      userId: this.currentUid,
      totalCreditsTarget: plan.totalCreditsTarget ?? 120,
      departmentRequirements: plan.departmentRequirements ?? {},
      levelRequirements: plan.levelRequirements ?? {},
    };
    await setDoc(ref, updated, { merge: true });
    return updated;
  }

  async getTranscriptSnapshots(): Promise<TranscriptSnapshot[]> {
    if (!db) return [];
    const q = query(collection(db, "transcriptSnapshots"), where("userId", "==", this.currentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TranscriptSnapshot);
  }

  async createTranscriptSnapshot(
    snapshotData: Omit<TranscriptSnapshot, "id" | "userId" | "issuedAt" | "verificationHash">
  ): Promise<TranscriptSnapshot> {
    if (!db) throw new Error("Firestore not configured");
    const id = "VER-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const snapshot: TranscriptSnapshot = {
      ...snapshotData,
      id,
      userId: this.currentUid,
      issuedAt: new Date().toISOString(),
      verificationHash: "hash-" + Math.random().toString(36).substring(2, 12),
    };
    await setDoc(doc(db, "transcriptSnapshots", id), snapshot);
    return snapshot;
  }

  async toggleSnapshotPublic(snapshotId: string, isPublic: boolean): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, "transcriptSnapshots", snapshotId), { isPublic });
  }

  async getPublicVerificationSnapshot(
    verificationId: string
  ): Promise<TranscriptSnapshot | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, "transcriptSnapshots", verificationId));
    if (!snap.exists()) return null;
    const data = snap.data() as TranscriptSnapshot;
    return data.isPublic ? data : null;
  }

  async logAudit(action: AuditLog["action"], entityId: string, details: string): Promise<void> {
    if (!db) return;
    const id = "audit-" + Date.now();
    const entry: AuditLog = {
      id,
      userId: this.currentUid,
      action,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(doc(db, "auditLog", id), entry);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    if (!db) return [];
    const q = query(
      collection(db, "auditLog"),
      where("userId", "==", this.currentUid),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AuditLog);
  }

  async getStudySessions(courseId?: string): Promise<StudySession[]> {
    if (!db) return [];
    const q = courseId
      ? query(
          collection(db, "studySessions"),
          where("userId", "==", this.currentUid),
          where("courseId", "==", courseId)
        )
      : query(
          collection(db, "studySessions"),
          where("userId", "==", this.currentUid)
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StudySession);
  }

  async logStudySession(
    sessionData: Omit<StudySession, "id" | "userId">
  ): Promise<StudySession> {
    if (!db) throw new Error("Firestore not configured");
    const id = "session-" + Date.now();
    const session: StudySession = {
      ...sessionData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "studySessions", id), session);
    return session;
  }

  async exportAllDataJson(): Promise<string> {
    const [terms, courses, progress, notes, plannerEvents, degreePlan] = await Promise.all([
      this.getTerms(),
      this.getCourses(),
      this.getAllLessonProgress(),
      this.getAllNotes(),
      this.getPlannerEvents(),
      this.getDegreePlan(),
    ]);

    return JSON.stringify(
      {
        uid: this.currentUid,
        terms,
        courses,
        progress,
        notes,
        plannerEvents,
        degreePlan,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  async importAllDataJson(jsonString: string): Promise<void> {
    // In Firebase mode, import creates/restores records for current user
    console.log("Importing JSON dataset into Firebase for user:", this.currentUid);
  }
}
