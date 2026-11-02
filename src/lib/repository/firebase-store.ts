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
  CourseAttendance,
  AttendanceLogEntry,
  ExamDate,
  ClassTimetableSlot,
  RecallHistoryEntry,
  RecallStyle,
} from "@/types/schemas";
import {
  processRecallRating,
  prioritizeDailyRecalls,
  RecallCandidate,
  PrioritizedRecallsResult,
  RecallRating,
  toDateString,
} from "@/lib/recall/recall-engine";
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
  writeBatch,
  WriteBatch,
} from "firebase/firestore";
import {
  SEED_TERMS,
  SEED_COURSES,
  SEED_MODULES,
  SEED_TOPICS,
  SAMPLE_LESSONS,
  SAMPLE_LESSON_PROGRESS,
  SAMPLE_ASSESSMENTS,
  SAMPLE_STUDY_SESSIONS,
  DEMO_DEGREE_PLAN,
} from "@/lib/demo/seed-data";

export interface CourseWithContent extends Course {
  units?: Module[];
  topics?: Topic[];
}

export class FirebaseDataStore implements DataStore {
  // In-memory cache for fast, zero-extra-read lookups within a session
  private coursesCache: Map<string, CourseWithContent> = new Map();
  private termsCache: Term[] | null = null;
  private userCache: UserProfile | null = null;
  private hasSyncedWithFirestore = false;

  constructor() {
    this.ensureSeedDataLoaded();
  }

  // Pre-seed all 19 courses, 2 terms, and 651 topics permanently in memory
  private ensureSeedDataLoaded(): void {
    const uid = auth?.currentUser?.uid || "user";

    if (!this.termsCache || this.termsCache.length === 0) {
      this.termsCache = SEED_TERMS.map((t) => ({ ...t, userId: uid }));
    }

    if (this.coursesCache.size === 0) {
      for (const c of SEED_COURSES) {
        const courseUnits = SEED_MODULES.filter((m) => m.courseId === c.id).map((m) => ({
          ...m,
          userId: uid,
        }));
        const courseTopics = SEED_TOPICS.filter((t) => t.courseId === c.id).map((t) => ({
          ...t,
          userId: uid,
        }));
        const courseDoc: CourseWithContent = {
          ...c,
          userId: uid,
          units: courseUnits,
          topics: courseTopics,
        };
        this.coursesCache.set(c.id, courseDoc);
      }
    }
  }

  private get currentUid(): string {
    const user = auth?.currentUser;
    return user ? user.uid : "student-default";
  }

  isDemoMode(): boolean {
    return false;
  }

  async loadDemoData(): Promise<void> {
    if (!db) return;
    const batch = writeBatch(db);
    for (const l of SAMPLE_LESSONS) {
      const ref = doc(db, "users", this.currentUid, "videos", l.id);
      batch.set(ref, { ...l, userId: this.currentUid });
    }
    for (const p of SAMPLE_LESSON_PROGRESS) {
      const ref = doc(db, "users", this.currentUid, "videoProgress", p.id);
      batch.set(ref, { ...p, userId: this.currentUid });
    }
    for (const a of SAMPLE_ASSESSMENTS) {
      const ref = doc(db, "users", this.currentUid, "assessments", a.id);
      batch.set(ref, { ...a, userId: this.currentUid });
    }
    for (const s of SAMPLE_STUDY_SESSIONS) {
      const ref = doc(db, "users", this.currentUid, "studySessions", s.id);
      batch.set(ref, { ...s, userId: this.currentUid });
    }
    await batch.commit();
  }

  async clearDemoData(): Promise<void> {
    if (!db) return;
    const collectionsToClear = ["videos", "videoProgress", "assessments", "studySessions", "notes"];
    for (const col of collectionsToClear) {
      const snap = await getDocs(collection(db, "users", this.currentUid, col));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await this.restoreOriginalSyllabus();
  }

  isSampleDataActive(): boolean {
    return false;
  }

  // Auto-seed on first sign-in
  private async loadInitialSyllabusData(): Promise<void> {
    if (!db || !auth?.currentUser) return;
    const uid = this.currentUid;
    try {
      const batch = writeBatch(db);

      // 1. Terms
      for (const t of SEED_TERMS) {
        const termData: Term = {
          ...t,
          userId: uid,
        };
        const termRef = doc(db, "users", uid, "terms", t.id);
        batch.set(termRef, termData);
      }

      // 2. Courses with embedded Units and Topics to minimize reads on the free plan
      for (const c of SEED_COURSES) {
        const courseUnits = SEED_MODULES.filter((m) => m.courseId === c.id).map((m) => ({
          ...m,
          userId: uid,
        }));
        const courseTopics = SEED_TOPICS.filter((t) => t.courseId === c.id).map((t) => ({
          ...t,
          userId: uid,
        }));

        const courseDoc: CourseWithContent = {
          ...c,
          userId: uid,
          units: courseUnits,
          topics: courseTopics,
        };
        const courseRef = doc(db, "users", uid, "courses", c.id);
        batch.set(courseRef, courseDoc);
        this.coursesCache.set(c.id, courseDoc);
      }

      await batch.commit();
    } catch (err) {
      console.warn("loadInitialSyllabusData batch write notice:", err);
    }
  }

  async restoreOriginalSyllabus(courseId?: string): Promise<void> {
    if (!db) return;
    if (courseId) {
      const seedCourse = SEED_COURSES.find((c) => c.id === courseId);
      if (!seedCourse) return;
      const courseUnits = SEED_MODULES.filter((m) => m.courseId === courseId).map((m) => ({
        ...m,
        userId: this.currentUid,
      }));
      const courseTopics = SEED_TOPICS.filter((t) => t.courseId === courseId).map((t) => ({
        ...t,
        userId: this.currentUid,
      }));
      const courseDoc: CourseWithContent = {
        ...seedCourse,
        userId: this.currentUid,
        units: courseUnits,
        topics: courseTopics,
      };
      await setDoc(doc(db, "users", this.currentUid, "courses", courseId), courseDoc);
      this.coursesCache.set(courseId, courseDoc);
    } else {
      await this.loadInitialSyllabusData();
    }
  }

  async resetCourseToOriginalSyllabus(courseId: string): Promise<void> {
    await this.restoreOriginalSyllabus(courseId);
  }

  // User Profile
  async getUser(): Promise<UserProfile | null> {
    const u = auth?.currentUser;
    if (!u) return null;
    if (this.userCache && this.userCache.uid === this.currentUid) {
      return this.userCache;
    }

    const fallbackUser: UserProfile = {
      uid: this.currentUid,
      email: u.email || "student@valeriascreds.edu",
      displayName: u.displayName || "Student",
      photoURL: u.photoURL || undefined,
      currentTermId: "term-sem-1",
      settings: {
        gradeScale: "10_point",
        defaultHoursPerCredit: 15,
        theme: "system",
      },
      createdAt: new Date().toISOString(),
    };

    if (!db) {
      this.userCache = fallbackUser;
      return fallbackUser;
    }

    try {
      const userDocRef = doc(db, "users", this.currentUid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // First sign-in: create user profile & trigger syllabus sync
        await setDoc(userDocRef, fallbackUser);
        this.userCache = fallbackUser;
        this.loadInitialSyllabusData().catch((err) => console.warn(err));
        return fallbackUser;
      }

      const userData = snap.data() as UserProfile;
      this.userCache = { ...fallbackUser, ...userData };
      return this.userCache;
    } catch (err) {
      console.warn("getUser from Firestore notice (using fallback profile):", err);
      this.userCache = fallbackUser;
      return fallbackUser;
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    if (!db) return;
    const ref = doc(db, "users", this.currentUid);
    const existing = await this.getUser();
    const updatedSettings = { ...(existing?.settings || {}), ...settings };
    await updateDoc(ref, { settings: updatedSettings });
    if (this.userCache) {
      this.userCache.settings = updatedSettings as UserSettings;
    }
  }

  async resetAccount(): Promise<void> {
    await this.clearDemoData();
  }

  async deleteAccountAndData(): Promise<void> {
    if (!db) return;
    const subcollections = [
      "terms",
      "courses",
      "videos",
      "videoProgress",
      "notes",
      "plannerEvents",
      "studySessions",
      "attendance",
      "examDates",
      "timetableSlots",
      "recallHistory",
      "assessments",
      "questions",
      "attempts",
      "rubrics",
      "submissions",
      "degreePlan",
    ];

    for (const subcol of subcollections) {
      const snap = await getDocs(collection(db, "users", this.currentUid, subcol));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    await deleteDoc(doc(db, "users", this.currentUid));
    this.coursesCache.clear();
    this.termsCache = null;
    this.userCache = null;
  }

  // Academic Terms
  async getTerms(): Promise<Term[]> {
    this.ensureSeedDataLoaded();
    if (db && auth?.currentUser) {
      try {
        const snap = await getDocs(collection(db, "users", this.currentUid, "terms"));
        if (!snap.empty) {
          const terms = snap.docs.map((d) => d.data() as Term);
          terms.sort((a, b) => a.id.localeCompare(b.id));
          this.termsCache = terms;
        } else {
          // If terms don't exist in Firestore yet, write SEED_TERMS in the background
          const uid = this.currentUid;
          const batch = writeBatch(db);
          for (const t of SEED_TERMS) {
            batch.set(doc(db, "users", uid, "terms", t.id), { ...t, userId: uid });
          }
          batch.commit().catch((err) => console.warn("Auto-seed terms notice:", err));
        }
      } catch (err) {
        console.warn("Could not query terms from Firestore (using permanent baseline):", err);
      }
    }
    return this.termsCache || SEED_TERMS.map((t) => ({ ...t, userId: auth?.currentUser?.uid || "user" }));
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
    await setDoc(doc(db, "users", this.currentUid, "terms", id), term);
    this.termsCache = null;
    return term;
  }

  async setCurrentTerm(termId: string): Promise<void> {
    if (!db) return;
    const terms = await this.getTerms();
    const batch = writeBatch(db);
    for (const t of terms) {
      const isCur = t.id === termId;
      if (t.isCurrent !== isCur) {
        batch.update(doc(db, "users", this.currentUid, "terms", t.id), { isCurrent: isCur });
      }
    }
    await batch.commit();
    this.termsCache = null;
  }

  // Courses (Embed units and topics for minimal reads)
  async getCourses(termId?: string): Promise<Course[]> {
    this.ensureSeedDataLoaded();
    if (db && !this.hasSyncedWithFirestore && auth?.currentUser) {
      try {
        const snap = await getDocs(collection(db, "users", this.currentUid, "courses"));
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            const remoteCourse = d.data() as CourseWithContent;
            const existing = this.coursesCache.get(remoteCourse.id);
            // Merge remote progress while ensuring units and topics are never empty
            const mergedUnits = (remoteCourse.units && remoteCourse.units.length > 0)
              ? remoteCourse.units
              : existing?.units || SEED_MODULES.filter((m) => m.courseId === remoteCourse.id);
            const mergedTopics = (remoteCourse.topics && remoteCourse.topics.length > 0)
              ? remoteCourse.topics
              : existing?.topics || SEED_TOPICS.filter((t) => t.courseId === remoteCourse.id);
            this.coursesCache.set(remoteCourse.id, {
              ...remoteCourse,
              units: mergedUnits,
              topics: mergedTopics,
            });
          });
        } else {
          // Empty in Firestore: auto-seed all 19 courses asynchronously
          this.loadInitialSyllabusData().catch((e) => console.warn("Courses sync notice:", e));
        }
        this.hasSyncedWithFirestore = true;
      } catch (err) {
        console.warn("Could not query courses from Firestore (using permanent baseline):", err);
      }
    }

    const list = Array.from(this.coursesCache.values());
    if (termId && termId !== "all") {
      return list.filter((c) => c.termId === termId);
    }
    return list;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    this.ensureSeedDataLoaded();
    const idLower = (courseId || "").toLowerCase();
    const cleanCode = idLower.replace(/^course-/, "");
    const withPrefix = `course-${cleanCode}`;

    // 1. Check in-memory cache with fallback keys
    let course =
      this.coursesCache.get(courseId) ||
      this.coursesCache.get(idLower) ||
      this.coursesCache.get(withPrefix) ||
      Array.from(this.coursesCache.values()).find(
        (c) =>
          c.id.toLowerCase() === idLower ||
          c.id.toLowerCase() === withPrefix ||
          c.code.toLowerCase() === cleanCode
      );

    // 2. Query Firestore if available and not found
    if (!course && db && auth?.currentUser) {
      try {
        const snap = await getDoc(doc(db, "users", this.currentUid, "courses", withPrefix));
        if (snap.exists()) {
          course = snap.data() as CourseWithContent;
          this.coursesCache.set(withPrefix, course);
        } else if (courseId !== withPrefix) {
          const snap2 = await getDoc(doc(db, "users", this.currentUid, "courses", courseId));
          if (snap2.exists()) {
            course = snap2.data() as CourseWithContent;
            this.coursesCache.set(courseId, course);
          }
        }
      } catch (err) {
        console.warn(`getCourse(${courseId}) notice:`, err);
      }
    }

    // 3. Fallback to SEED_COURSES
    if (!course) {
      const seedCourse = SEED_COURSES.find(
        (c) =>
          c.id === courseId ||
          c.id.toLowerCase() === idLower ||
          c.id.toLowerCase() === withPrefix ||
          c.code.toLowerCase() === cleanCode
      );
      if (seedCourse) {
        const targetId = seedCourse.id;
        const courseUnits = SEED_MODULES.filter(
          (m) =>
            m.courseId === targetId ||
            m.courseId.toLowerCase() === withPrefix ||
            m.courseId.toLowerCase() === idLower ||
            m.courseId === courseId
        ).map((m) => ({
          ...m,
          userId: this.currentUid,
        }));
        const courseTopics = SEED_TOPICS.filter(
          (t) =>
            t.courseId === targetId ||
            t.courseId.toLowerCase() === withPrefix ||
            t.courseId.toLowerCase() === idLower ||
            t.courseId === courseId
        ).map((t) => ({
          ...t,
          userId: this.currentUid,
        }));
        course = {
          ...seedCourse,
          userId: this.currentUid,
          units: courseUnits,
          topics: courseTopics,
        };
        this.coursesCache.set(targetId, course);
        this.coursesCache.set(withPrefix, course);
      }
    }

    // 4. Guarantee units and topics are populated
    if (course) {
      const canonicalId = course.id;
      if (!course.units || course.units.length === 0) {
        course.units = SEED_MODULES.filter(
          (m) =>
            m.courseId === canonicalId ||
            m.courseId.toLowerCase() === withPrefix ||
            m.courseId.toLowerCase() === idLower
        ).map((m) => ({
          ...m,
          userId: this.currentUid,
        }));
      }
      if (!course.topics || course.topics.length === 0) {
        course.topics = SEED_TOPICS.filter(
          (t) =>
            t.courseId === canonicalId ||
            t.courseId.toLowerCase() === withPrefix ||
            t.courseId.toLowerCase() === idLower
        ).map((t) => ({
          ...t,
          userId: this.currentUid,
        }));
      }
    }

    return course || null;
  }

  async createCourse(courseData: Omit<Course, "id" | "userId" | "createdAt">): Promise<Course> {
    if (!db) throw new Error("Firestore not configured");
    const id = "course-" + Date.now();
    const course: CourseWithContent = {
      ...courseData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
      units: [],
      topics: [],
    };
    await setDoc(doc(db, "users", this.currentUid, "courses", id), course);
    this.coursesCache.set(id, course);
    return course;
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    if (!db) throw new Error("Firestore not configured");
    const existing = await this.getCourse(courseId);
    const updated: CourseWithContent = {
      ...(existing || {}),
      ...updates,
      id: courseId,
      userId: this.currentUid,
    } as CourseWithContent;
    await setDoc(doc(db, "users", this.currentUid, "courses", courseId), updated, { merge: true });
    this.coursesCache.set(courseId, updated);
    return updated;
  }

  async deleteCourse(courseId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", this.currentUid, "courses", courseId));
    this.coursesCache.delete(courseId);
  }

  // Modules / Units
  async getModules(courseId: string): Promise<Module[]> {
    this.ensureSeedDataLoaded();
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (course && course.units && course.units.length > 0) {
      return [...course.units].sort((a, b) => a.order - b.order);
    }
    const idLower = (courseId || "").toLowerCase();
    const cleanCode = idLower.replace(/^course-/, "");
    const withPrefix = `course-${cleanCode}`;
    return SEED_MODULES.filter(
      (m) =>
        m.courseId === courseId ||
        m.courseId.toLowerCase() === idLower ||
        m.courseId.toLowerCase() === withPrefix
    )
      .map((m) => ({ ...m, userId: this.currentUid }))
      .sort((a, b) => a.order - b.order);
  }

  async getUnits(courseId: string): Promise<Module[]> {
    return this.getModules(courseId);
  }

  async createModule(
    moduleData: Omit<Module, "id" | "userId" | "createdAt" | "isSection"> & {
      isSection?: boolean;
      unitNumber?: number;
      electiveExperimentsCount?: number | null;
    }
  ): Promise<Module> {
    if (!db) throw new Error("Firestore not configured");
    const course = (await this.getCourse(moduleData.courseId)) as CourseWithContent | null;
    if (!course) throw new Error("Course not found");

    const id = "unit-" + Date.now();
    const newMod: Module = {
      id,
      userId: this.currentUid,
      courseId: moduleData.courseId,
      title: moduleData.title,
      order: moduleData.order ?? (course.units?.length || 0),
      isSection: moduleData.isSection || false,
      unitNumber: moduleData.unitNumber ?? (course.units?.length || 0) + 1,
      electiveExperimentsCount: moduleData.electiveExperimentsCount || null,
      isCollapsed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedUnits = [...(course.units || []), newMod];
    await this.updateCourse(course.id, { units: updatedUnits } as any);
    return newMod;
  }

  async updateModuleOrder(modules: { id: string; order: number }[]): Promise<void> {
    if (modules.length === 0) return;
    const courseId = (await this.findCourseIdByUnitId(modules[0].id));
    if (!courseId) return;
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (!course || !course.units) return;

    const orderMap = new Map(modules.map((m) => [m.id, m.order]));
    const updatedUnits = course.units.map((u) => {
      if (orderMap.has(u.id)) {
        return { ...u, order: orderMap.get(u.id)! };
      }
      return u;
    });

    await this.updateCourse(courseId, { units: updatedUnits } as any);
  }

  async toggleModuleCollapsed(moduleId: string, isCollapsed: boolean): Promise<void> {
    const courseId = await this.findCourseIdByUnitId(moduleId);
    if (!courseId) return;
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (!course || !course.units) return;

    const updatedUnits = course.units.map((u) => (u.id === moduleId ? { ...u, isCollapsed } : u));
    await this.updateCourse(courseId, { units: updatedUnits } as any);
  }

  private async findCourseIdByUnitId(unitId: string): Promise<string | null> {
    const courses = await this.getCourses();
    for (const c of courses as CourseWithContent[]) {
      if (c.units && c.units.some((u) => u.id === unitId)) {
        return c.id;
      }
    }
    return null;
  }

  private async findCourseIdByTopicId(topicId: string): Promise<string | null> {
    const courses = await this.getCourses();
    for (const c of courses as CourseWithContent[]) {
      if (c.topics && c.topics.some((t) => t.id === topicId)) {
        return c.id;
      }
    }
    return null;
  }

  // Topics
  async getTopics(unitId: string): Promise<Topic[]> {
    this.ensureSeedDataLoaded();
    const courses = (await this.getCourses()) as CourseWithContent[];
    for (const c of courses) {
      if (c.topics) {
        const matches = c.topics.filter((t) => t.unitId === unitId);
        if (matches.length > 0) {
          return matches.sort((a, b) => a.order - b.order);
        }
      }
    }
    return SEED_TOPICS.filter((t) => t.unitId === unitId)
      .map((t) => ({ ...t, userId: this.currentUid }))
      .sort((a, b) => a.order - b.order);
  }

  async getAllTopics(courseId?: string): Promise<Topic[]> {
    this.ensureSeedDataLoaded();
    const courses = (await this.getCourses()) as CourseWithContent[];
    if (courseId) {
      const idLower = courseId.toLowerCase();
      const cleanCode = idLower.replace(/^course-/, "");
      const withPrefix = `course-${cleanCode}`;
      const c = courses.find(
        (crs) =>
          crs.id === courseId ||
          crs.id.toLowerCase() === idLower ||
          crs.id.toLowerCase() === withPrefix ||
          crs.code.toLowerCase() === cleanCode
      );
      if (c && c.topics && c.topics.length > 0) {
        return [...c.topics].sort((a, b) => a.order - b.order);
      }
      return SEED_TOPICS.filter(
        (t) =>
          t.courseId === courseId ||
          t.courseId.toLowerCase() === idLower ||
          t.courseId.toLowerCase() === withPrefix
      )
        .map((t) => ({ ...t, userId: this.currentUid }))
        .sort((a, b) => a.order - b.order);
    }
    const all: Topic[] = [];
    courses.forEach((c) => {
      if (c.topics && c.topics.length > 0) {
        all.push(...c.topics);
      }
    });
    if (all.length > 0) {
      return all.sort((a, b) => a.order - b.order);
    }
    return SEED_TOPICS.map((t) => ({ ...t, userId: this.currentUid })).sort((a, b) => a.order - b.order);
  }

  async createTopic(topicData: Omit<Topic, "id" | "userId" | "createdAt">): Promise<Topic> {
    const courseId = topicData.courseId;
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (!course) throw new Error("Course not found");

    const id = "topic-" + Date.now();
    const topic: Topic = {
      ...topicData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };

    const updatedTopics = [...(course.topics || []), topic];
    await this.updateCourse(courseId, { topics: updatedTopics } as any);
    return topic;
  }

  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic> {
    const courseId = await this.findCourseIdByTopicId(topicId);
    if (!courseId) throw new Error(`Topic ${topicId} not found in any course`);
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (!course || !course.topics) throw new Error("Course not found");

    let updatedTopic: Topic | null = null;
    const updatedTopics = course.topics.map((t) => {
      if (t.id === topicId) {
        const merged: Topic = { ...t, ...updates };
        if (updates.watchScore !== undefined || updates.checkScore !== undefined) {
          const w = updates.watchScore ?? t.watchScore ?? 0;
          const c = updates.checkScore ?? t.checkScore ?? 0;
          merged.topicScore = w + c;
          merged.isDone = merged.topicScore >= 70;
        }
        updatedTopic = merged;
        return merged;
      }
      return t;
    });

    if (!updatedTopic) throw new Error("Topic not found");
    await this.updateCourse(courseId, { topics: updatedTopics } as any);
    return updatedTopic;
  }

  async deleteTopic(topicId: string): Promise<void> {
    const courseId = await this.findCourseIdByTopicId(topicId);
    if (!courseId) return;
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    if (!course || !course.topics) return;

    const updatedTopics = course.topics.filter((t) => t.id !== topicId);
    await this.updateCourse(courseId, { topics: updatedTopics } as any);
  }

  // Lessons / Videos (subcollection under users/{uid}/videos)
  async getLessons(courseId: string): Promise<Lesson[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "videos"),
        where("courseId", "==", courseId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Lesson).sort((a, b) => a.order - b.order);
    } catch (err) {
      console.warn(`getLessons(${courseId}) notice:`, err);
      return [];
    }
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "videos", lessonId));
      if (!snap.exists()) return null;
      return snap.data() as Lesson;
    } catch (err) {
      console.warn(`getLesson(${lessonId}) notice:`, err);
      return null;
    }
  }

  async addLessons(
    lessons: (Omit<Lesson, "id" | "userId" | "createdAt" | "linkedTopicIds"> & {
      linkedTopicIds?: string[];
    })[]
  ): Promise<Lesson[]> {
    if (!db) throw new Error("Firestore not configured");
    const added: Lesson[] = [];
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      const id = "video-" + Date.now() + "-" + i;
      const lesson: Lesson = {
        ...l,
        id,
        userId: this.currentUid,
        createdAt: now,
        linkedTopicIds: l.linkedTopicIds || [],
      };
      batch.set(doc(db, "users", this.currentUid, "videos", id), lesson);
      added.push(lesson);
    }

    await batch.commit();
    return added;
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "users", this.currentUid, "videos", lessonId);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as Lesson;
  }

  async updateLessonOrder(lessons: { id: string; order: number; moduleId: string }[]): Promise<void> {
    if (!db) return;
    const batch = writeBatch(db);
    for (const l of lessons) {
      batch.update(doc(db, "users", this.currentUid, "videos", l.id), {
        order: l.order,
        moduleId: l.moduleId,
        unitId: l.moduleId,
      });
    }
    await batch.commit();
  }

  async deleteLesson(lessonId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", this.currentUid, "videos", lessonId));
  }

  // Watch Progress
  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "videoProgress", lessonId));
      if (!snap.exists()) return null;
      return snap.data() as LessonProgress;
    } catch (err) {
      console.warn(`getLessonProgress(${lessonId}) notice:`, err);
      return null;
    }
  }

  async getAllLessonProgress(courseId?: string): Promise<LessonProgress[]> {
    if (!db) return [];
    try {
      const q = courseId
        ? query(
            collection(db, "users", this.currentUid, "videoProgress"),
            where("courseId", "==", courseId)
          )
        : collection(db, "users", this.currentUid, "videoProgress");
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as LessonProgress);
    } catch (err) {
      console.warn(`getAllLessonProgress(${courseId}) notice:`, err);
      return [];
    }
  }

  async updateLessonProgress(
    progressData: Omit<LessonProgress, "id" | "userId" | "updatedAt">
  ): Promise<LessonProgress> {
    if (!db) throw new Error("Firestore not configured");
    const id = progressData.lessonId;
    const now = new Date().toISOString();
    const progress: LessonProgress = {
      ...progressData,
      id,
      userId: this.currentUid,
      updatedAt: now,
    };
    await setDoc(doc(db, "users", this.currentUid, "videoProgress", id), progress, { merge: true });

    // Auto-award 40 watch mastery points to linked topics if completed
    if (progressData.isCompleted) {
      const lesson = await this.getLesson(progressData.lessonId);
      if (lesson && lesson.linkedTopicIds) {
        for (const tId of lesson.linkedTopicIds) {
          try {
            await this.updateTopic(tId, { watchScore: 40 });
          } catch {
            // Topic might be in another course or deleted
          }
        }
      }
    }

    return progress;
  }

  // Notes
  async getNote(lessonId: string): Promise<Note | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "notes", lessonId));
      if (!snap.exists()) return null;
      return snap.data() as Note;
    } catch (err) {
      console.warn(`getNote(${lessonId}) notice:`, err);
      return null;
    }
  }

  async saveNote(
    courseId: string,
    lessonId: string,
    content: string,
    timestamps: NoteTimestamp[]
  ): Promise<Note> {
    if (!db) throw new Error("Firestore not configured");
    const id = lessonId;
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
    await setDoc(doc(db, "users", this.currentUid, "notes", id), note);
    return note;
  }

  async getAllNotes(courseId?: string): Promise<Note[]> {
    if (!db) return [];
    try {
      const q = courseId
        ? query(
            collection(db, "users", this.currentUid, "notes"),
            where("courseId", "==", courseId)
          )
        : collection(db, "users", this.currentUid, "notes");
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Note);
    } catch (err) {
      console.warn(`getAllNotes(${courseId}) notice:`, err);
      return [];
    }
  }

  // Assessments & Question Bank
  async getAssessments(courseId: string): Promise<Assessment[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "assessments"),
        where("courseId", "==", courseId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Assessment);
    } catch (err) {
      console.warn(`getAssessments(${courseId}) notice:`, err);
      return [];
    }
  }

  async getAssessment(assessmentId: string): Promise<Assessment | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "assessments", assessmentId));
      if (!snap.exists()) return null;
      return snap.data() as Assessment;
    } catch (err) {
      console.warn(`getAssessment(${assessmentId}) notice:`, err);
      return null;
    }
  }

  async createAssessment(
    assessmentData: Omit<Assessment, "id" | "userId" | "createdAt">
  ): Promise<Assessment> {
    if (!db) throw new Error("Firestore not configured");
    const id = "asm-" + Date.now();
    const asm: Assessment = {
      ...assessmentData,
      id,
      userId: this.currentUid,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", this.currentUid, "assessments", id), asm);
    return asm;
  }

  async getQuestions(assessmentId: string): Promise<Question[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "questions"),
        where("assessmentId", "==", assessmentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Question);
    } catch (err) {
      console.warn(`getQuestions(${assessmentId}) notice:`, err);
      return [];
    }
  }

  async saveQuestions(
    assessmentId: string,
    questions: Omit<Question, "id" | "userId">[]
  ): Promise<Question[]> {
    if (!db) throw new Error("Firestore not configured");
    const batch = writeBatch(db);
    const saved: Question[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = "q-" + Date.now() + "-" + i;
      const item: Question = {
        ...q,
        id,
        userId: this.currentUid,
        assessmentId,
      };
      batch.set(doc(db, "users", this.currentUid, "questions", id), item);
      saved.push(item);
    }

    await batch.commit();
    return saved;
  }

  // Attempts
  async getAttempts(assessmentId: string): Promise<Attempt[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "attempts"),
        where("assessmentId", "==", assessmentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Attempt);
    } catch (err) {
      console.warn(`getAttempts(${assessmentId}) notice:`, err);
      return [];
    }
  }

  async submitAttempt(attemptData: Omit<Attempt, "id" | "userId">): Promise<Attempt> {
    if (!db) throw new Error("Firestore not configured");
    const id = "att-" + Date.now();
    const attempt: Attempt = {
      ...attemptData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "users", this.currentUid, "attempts", id), attempt);
    return attempt;
  }

  // Rubrics & Submissions
  async getRubrics(assessmentId: string): Promise<Rubric[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "rubrics"),
        where("assessmentId", "==", assessmentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Rubric);
    } catch (err) {
      console.warn(`getRubrics(${assessmentId}) notice:`, err);
      return [];
    }
  }

  async getRubric(assessmentId: string): Promise<Rubric | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "rubrics", assessmentId));
      if (!snap.exists()) return null;
      return snap.data() as Rubric;
    } catch (err) {
      console.warn(`getRubric(${assessmentId}) notice:`, err);
      return null;
    }
  }

  async saveRubric(rubricData: Omit<Rubric, "id" | "userId">): Promise<Rubric> {
    if (!db) throw new Error("Firestore not configured");
    const id = rubricData.assessmentId || ("rub-" + Date.now());
    const rubric: Rubric = {
      ...rubricData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "users", this.currentUid, "rubrics", id), rubric);
    return rubric;
  }

  async getSubmissions(assessmentId: string): Promise<Submission[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "submissions"),
        where("assessmentId", "==", assessmentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Submission);
    } catch (err) {
      console.warn(`getSubmissions(${assessmentId}) notice:`, err);
      return [];
    }
  }

  async getSubmission(assessmentId: string): Promise<Submission | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "submissions", assessmentId));
      if (!snap.exists()) return null;
      return snap.data() as Submission;
    } catch (err) {
      console.warn(`getSubmission(${assessmentId}) notice:`, err);
      return null;
    }
  }

  async saveSubmission(submissionData: Omit<Submission, "id" | "userId">): Promise<Submission> {
    if (!db) throw new Error("Firestore not configured");
    const id = submissionData.assessmentId || ("sub-" + Date.now());
    const submission: Submission = {
      ...submissionData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "users", this.currentUid, "submissions", id), submission);
    return submission;
  }

  async submitAssignment(submissionData: Omit<Submission, "id" | "userId">): Promise<Submission> {
    return this.saveSubmission(submissionData);
  }

  // Planner Events
  async getPlannerEvents(start?: string, end?: string): Promise<PlannerEvent[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "users", this.currentUid, "plannerEvents"));
      const list = snap.docs.map((d) => d.data() as PlannerEvent);
      return list.filter((e) => (!start || e.date >= start) && (!end || e.date <= end));
    } catch (err) {
      console.warn("getPlannerEvents notice:", err);
      return [];
    }
  }

  async createPlannerEvent(
    eventData: Omit<PlannerEvent, "id" | "userId">
  ): Promise<PlannerEvent> {
    if (!db) throw new Error("Firestore not configured");
    const id = "event-" + Date.now();
    const event: PlannerEvent = {
      ...eventData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "users", this.currentUid, "plannerEvents", id), event);
    return event;
  }

  async updatePlannerEvent(eventId: string, updates: Partial<PlannerEvent>): Promise<PlannerEvent> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "users", this.currentUid, "plannerEvents", eventId);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as PlannerEvent;
  }

  async togglePlannerEventDone(eventId: string, isDone: boolean): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, "users", this.currentUid, "plannerEvents", eventId), { isDone });
  }

  async deletePlannerEvent(eventId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", this.currentUid, "plannerEvents", eventId));
  }

  // Degree Plan
  async getDegreePlan(): Promise<DegreePlan | null> {
    if (!db) return DEMO_DEGREE_PLAN ? { ...DEMO_DEGREE_PLAN, userId: this.currentUid } : null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "degreePlan", "current"));
      if (!snap.exists()) {
        return DEMO_DEGREE_PLAN ? { ...DEMO_DEGREE_PLAN, userId: this.currentUid } : null;
      }
      return snap.data() as DegreePlan;
    } catch {
      return DEMO_DEGREE_PLAN ? { ...DEMO_DEGREE_PLAN, userId: this.currentUid } : null;
    }
  }

  async updateDegreePlan(plan: Partial<DegreePlan>): Promise<DegreePlan> {
    if (!db) throw new Error("Firestore not configured");
    const ref = doc(db, "users", this.currentUid, "degreePlan", "current");
    const updated: DegreePlan = {
      id: "deg-plan-1",
      userId: this.currentUid,
      totalCreditsTarget: plan.totalCreditsTarget || 160,
      departmentRequirements: plan.departmentRequirements ?? {},
      levelRequirements: plan.levelRequirements ?? {},
    };
    await setDoc(ref, updated, { merge: true });
    return updated;
  }

  // Transcript Snapshots
  async getTranscriptSnapshots(): Promise<TranscriptSnapshot[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, "transcriptSnapshots"), where("userId", "==", this.currentUid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TranscriptSnapshot);
    } catch (err) {
      console.warn("getTranscriptSnapshots notice:", err);
      return [];
    }
  }

  async createTranscriptSnapshot(
    snapshotData: Omit<TranscriptSnapshot, "id" | "userId" | "issuedAt" | "verificationHash">
  ): Promise<TranscriptSnapshot> {
    if (!db) throw new Error("Firestore not configured");
    const id = "snap-" + Date.now();
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

  async getPublicVerificationSnapshot(idOrHash: string): Promise<TranscriptSnapshot | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, "transcriptSnapshots", idOrHash));
      if (docSnap.exists()) {
        return docSnap.data() as TranscriptSnapshot;
      }
      const q = query(
        collection(db, "transcriptSnapshots"),
        where("verificationHash", "==", idOrHash)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as TranscriptSnapshot;
      }
      return null;
    } catch (err) {
      console.warn("getPublicVerificationSnapshot notice:", err);
      return null;
    }
  }

  // Audit Log
  async logAudit(
    action: AuditLog["action"],
    entityId: string,
    details: string
  ): Promise<void> {
    if (!db) return;
    const id = "log-" + Date.now();
    const entry: AuditLog = {
      id,
      userId: this.currentUid,
      action,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", this.currentUid, "auditLog", id), entry);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "users", this.currentUid, "auditLog"));
      return snap.docs.map((d) => d.data() as AuditLog).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (err) {
      console.warn("getAuditLogs notice:", err);
      return [];
    }
  }

  // Study Sessions
  async getStudySessions(courseId?: string): Promise<StudySession[]> {
    if (!db) return [];
    try {
      const q = courseId
        ? query(
            collection(db, "users", this.currentUid, "studySessions"),
            where("courseId", "==", courseId)
          )
        : collection(db, "users", this.currentUid, "studySessions");
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as StudySession);
    } catch (err) {
      console.warn(`getStudySessions(${courseId}) notice:`, err);
      return [];
    }
  }

  async saveStudySession(sessionData: Omit<StudySession, "id" | "userId">): Promise<StudySession> {
    if (!db) throw new Error("Firestore not configured");
    const id = "session-" + Date.now();
    const session: StudySession = {
      ...sessionData,
      id,
      userId: this.currentUid,
    };
    await setDoc(doc(db, "users", this.currentUid, "studySessions", id), session);
    return session;
  }

  async logStudySession(sessionData: Omit<StudySession, "id" | "userId">): Promise<StudySession> {
    return this.saveStudySession(sessionData);
  }

  // Course Attendance
  async getCourseAttendance(courseId: string): Promise<CourseAttendance> {
    const defaultAtt: CourseAttendance = {
      id: `att-${this.currentUid}-${courseId}`,
      courseId,
      userId: this.currentUid,
      classesHeld: 0,
      classesAttended: 0,
      minimumPercentage: 75,
      logs: [],
      updatedAt: new Date().toISOString(),
    };
    if (!db) {
      return defaultAtt;
    }
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "attendance", courseId));
      if (snap.exists()) {
        return snap.data() as CourseAttendance;
      }
      // Non-blocking background initialization
      setDoc(doc(db, "users", this.currentUid, "attendance", courseId), defaultAtt).catch(() => {});
      return defaultAtt;
    } catch (err) {
      console.warn(`getCourseAttendance(${courseId}) notice:`, err);
      return defaultAtt;
    }
  }

  async getAllAttendance(): Promise<CourseAttendance[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "users", this.currentUid, "attendance"));
      return snap.docs.map((d) => d.data() as CourseAttendance);
    } catch (err) {
      console.warn("getAllAttendance notice:", err);
      return [];
    }
  }

  async updateCourseAttendance(
    courseId: string,
    updates: Partial<CourseAttendance>
  ): Promise<CourseAttendance> {
    if (!db) throw new Error("Firestore not configured");
    const existing = await this.getCourseAttendance(courseId);
    const updated: CourseAttendance = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", this.currentUid, "attendance", courseId), updated);
    return updated;
  }

  async recordAttendance(
    courseId: string,
    status: "present" | "absent",
    note?: string
  ): Promise<CourseAttendance> {
    const current = await this.getCourseAttendance(courseId);
    const newHeld = current.classesHeld + 1;
    const newAttended = status === "present" ? current.classesAttended + 1 : current.classesAttended;
    const newLog: AttendanceLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split("T")[0],
      status,
      timestamp: new Date().toISOString(),
      note,
    };
    const updatedLogs = [newLog, ...(current.logs || [])].slice(0, 50);
    return this.updateCourseAttendance(courseId, {
      classesHeld: newHeld,
      classesAttended: newAttended,
      logs: updatedLogs,
    });
  }

  async setCourseAttendanceThreshold(courseId: string, percentage: number): Promise<CourseAttendance> {
    return this.updateCourseAttendance(courseId, { minimumPercentage: percentage });
  }

  // Exam Dates
  async getCourseExamDate(courseId: string): Promise<ExamDate | null> {
    if (!db) return null;
    try {
      const snap = await getDoc(doc(db, "users", this.currentUid, "examDates", courseId));
      if (snap.exists()) {
        return snap.data() as ExamDate;
      }
      return null;
    } catch (err) {
      console.warn(`getCourseExamDate(${courseId}) notice:`, err);
      return null;
    }
  }

  async getAllExamDates(): Promise<ExamDate[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "users", this.currentUid, "examDates"));
      return snap.docs.map((d) => d.data() as ExamDate);
    } catch (err) {
      console.warn("getAllExamDates notice:", err);
      return [];
    }
  }

  async saveCourseExamDate(
    courseId: string,
    data: { examTitle: string; date: string; targetScore?: number }
  ): Promise<ExamDate> {
    if (!db) throw new Error("Firestore not configured");
    const exam: ExamDate = {
      id: `exam-${this.currentUid}-${courseId}`,
      userId: this.currentUid,
      courseId,
      examTitle: data.examTitle || "Final Examination",
      date: data.date,
      targetScore: data.targetScore ?? 85,
    };
    await setDoc(doc(db, "users", this.currentUid, "examDates", courseId), exam);
    return exam;
  }

  async deleteCourseExamDate(courseId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", this.currentUid, "examDates", courseId));
  }

  // Weekly Class Timetable
  async getTimetableSlots(): Promise<ClassTimetableSlot[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, "users", this.currentUid, "timetableSlots"));
      const slots = snap.docs.map((d) => d.data() as ClassTimetableSlot);
      if (slots.length === 0) {
        const courses = await this.getCourses();
        if (courses.length > 0) {
          return this.generateDefaultWeeklyTimetable(courses);
        }
      }
      return slots;
    } catch (err) {
      console.warn("getTimetableSlots notice:", err);
      const courses = await this.getCourses();
      return courses.length > 0 ? this.generateDefaultWeeklyTimetable(courses) : [];
    }
  }

  async saveTimetableSlot(
    slotData: Omit<ClassTimetableSlot, "id" | "userId"> & { id?: string }
  ): Promise<ClassTimetableSlot> {
    if (!db) throw new Error("Firestore not configured");
    const id = slotData.id || `slot-${this.currentUid}-${Date.now()}`;
    const slot: ClassTimetableSlot = {
      ...slotData,
      id,
      userId: this.currentUid,
      room: slotData.room || "Room 101",
      type: slotData.type || "lecture",
    };
    await setDoc(doc(db, "users", this.currentUid, "timetableSlots", id), slot);
    return slot;
  }

  async deleteTimetableSlot(slotId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", this.currentUid, "timetableSlots", slotId));
  }

  async generateDefaultWeeklyTimetable(courses: Course[]): Promise<ClassTimetableSlot[]> {
    if (!db) return [];
    const sem1 = courses.filter((c) => c.termId === "term-sem-1" || !c.termId);
    const active = sem1.length > 0 ? sem1 : courses;
    if (active.length === 0) return [];

    const findCourse = (code: string) => active.find((c) => c.code === code) || active[0];

    const cMath = findCourse("MA101BS");
    const cChem = findCourse("CH102BS");
    const cEng = findCourse("EN103HS");
    const cEce = findCourse("EE104ES") || findCourse("EC104ES");
    const cCs = findCourse("CS105ES") || findCourse("ME105ES");
    const cChemLab = findCourse("CH106BS");
    const cCsLab = findCourse("EN107HS") || findCourse("CS107ES");
    const cEngLab = findCourse("EE108ES") || findCourse("EN108HS");
    const cMech = findCourse("ME109ES");

    const defaultSlots: Omit<ClassTimetableSlot, "id" | "userId">[] = [
      { courseId: cMath.id, dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "Room 301", type: "lecture" },
      { courseId: cChem.id, dayOfWeek: 1, startTime: "10:00", endTime: "11:00", room: "Room 204", type: "lecture" },
      { courseId: cCs.id, dayOfWeek: 1, startTime: "11:15", endTime: "12:15", room: "Room 402", type: "lecture" },
      { courseId: cChemLab.id, dayOfWeek: 1, startTime: "13:30", endTime: "15:30", room: "Chem Lab A", type: "lab" },
      { courseId: cEce.id, dayOfWeek: 2, startTime: "09:00", endTime: "10:00", room: "Room 301", type: "lecture" },
      { courseId: cEng.id, dayOfWeek: 2, startTime: "10:00", endTime: "11:00", room: "Room 102", type: "lecture" },
      { courseId: cMath.id, dayOfWeek: 2, startTime: "11:15", endTime: "12:15", room: "Room 301", type: "lecture" },
      { courseId: cCsLab.id, dayOfWeek: 2, startTime: "13:30", endTime: "15:30", room: "Comp Lab 3", type: "lab" },
      { courseId: cChem.id, dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: "Room 204", type: "lecture" },
      { courseId: cCs.id, dayOfWeek: 3, startTime: "10:00", endTime: "11:00", room: "Room 402", type: "lecture" },
      { courseId: cEce.id, dayOfWeek: 3, startTime: "11:15", endTime: "12:15", room: "Room 301", type: "lecture" },
      { courseId: cEngLab.id, dayOfWeek: 3, startTime: "13:30", endTime: "14:30", room: "Lang Lab", type: "lab" },
      { courseId: cMath.id, dayOfWeek: 4, startTime: "09:00", endTime: "10:00", room: "Room 301", type: "lecture" },
      { courseId: cChem.id, dayOfWeek: 4, startTime: "10:00", endTime: "11:00", room: "Room 204", type: "lecture" },
      { courseId: cEng.id, dayOfWeek: 4, startTime: "11:15", endTime: "12:15", room: "Room 102", type: "lecture" },
      { courseId: cMech.id, dayOfWeek: 4, startTime: "13:30", endTime: "14:30", room: "Room 204", type: "lecture" },
      { courseId: cCs.id, dayOfWeek: 5, startTime: "09:00", endTime: "10:00", room: "Room 402", type: "lecture" },
      { courseId: cEce.id, dayOfWeek: 5, startTime: "10:00", endTime: "11:00", room: "Room 301", type: "lecture" },
      { courseId: cMath.id, dayOfWeek: 5, startTime: "11:15", endTime: "12:15", room: "Room 301", type: "tutorial" },
      { courseId: cEng.id, dayOfWeek: 5, startTime: "13:30", endTime: "14:30", room: "Room 102", type: "tutorial" },
    ];

    const results: ClassTimetableSlot[] = [];
    const batch = writeBatch(db);
    for (let i = 0; i < defaultSlots.length; i++) {
      const s = defaultSlots[i];
      const slot: ClassTimetableSlot = {
        ...s,
        id: `slot-${this.currentUid}-${i + 1}`,
        userId: this.currentUid,
      };
      batch.set(doc(db, "users", this.currentUid, "timetableSlots", slot.id), slot);
      results.push(slot);
    }
    await batch.commit();
    return results;
  }

  async clearTimetable(): Promise<void> {
    if (!db) return;
    const snap = await getDocs(collection(db, "users", this.currentUid, "timetableSlots"));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Smart Spaced Recall Engine
  async getRecallCandidates(today?: string): Promise<RecallCandidate[]> {
    const todayStr = today || toDateString(new Date());
    const courses = (await this.getCourses()) as CourseWithContent[];
    const candidates: RecallCandidate[] = [];

    for (const c of courses) {
      if (c.topics) {
        for (const t of c.topics) {
          if (t.isDone || (t.topicScore || 0) >= 70) {
            candidates.push({
              topicId: t.id,
              courseId: t.courseId,
              unitId: t.unitId,
              title: t.title,
              recallDueAt: t.recallDueAt || todayStr,
              recallStage: t.recallStage || 1,
              retentionLevel: t.retentionLevel || "none",
              topicScore: t.topicScore || 0,
              isDone: t.isDone,
              isConsolidated: t.isConsolidated || false,
              courseCode: c.code,
              courseTitle: c.title,
            });
          }
        }
      }
    }
    return candidates;
  }

  async getPrioritizedDailyRecalls(today?: string): Promise<PrioritizedRecallsResult> {
    const todayStr = today || toDateString(new Date());
    const candidates = await this.getRecallCandidates(todayStr);
    const examDates = await this.getAllExamDates();
    const examDatesByCourse: Record<string, string> = {};
    for (const e of examDates) {
      examDatesByCourse[e.courseId] = e.date;
    }

    const user = await this.getUser();
    const dailyCap = user?.settings?.recallDailyCap || 20;

    return prioritizeDailyRecalls({
      candidates,
      examDatesByCourse,
      dailyCap,
      today: todayStr,
    });
  }

  async recordRecallReview(entry: {
    topicId: string;
    rating: RecallRating;
    today?: string;
  }): Promise<{ topic: Topic; historyEntry: RecallHistoryEntry }> {
    if (!db) throw new Error("Firestore not configured");
    const todayStr = entry.today || toDateString(new Date());
    const courseId = await this.findCourseIdByTopicId(entry.topicId);
    if (!courseId) throw new Error("Course not found for topic");
    const course = (await this.getCourse(courseId)) as CourseWithContent | null;
    const topic = course?.topics?.find((t) => t.id === entry.topicId);
    if (!topic) throw new Error("Topic not found");

    const exam = await this.getCourseExamDate(topic.courseId);
    const user = await this.getUser();
    const intervals = user?.settings?.recallIntervals || [1, 3, 7, 14];

    const currentStage = topic.recallStage || 1;
    const currentScore = topic.topicScore || 70;
    const prevRetention = topic.retentionLevel || "none";

    const scheduled = processRecallRating({
      currentStage,
      rating: entry.rating,
      intervals,
      today: todayStr,
      examDate: exam?.date,
      currentScore,
    });

    const updatedTopic = await this.updateTopic(topic.id, {
      recallStage: scheduled.nextStage,
      recallDueAt: scheduled.nextDueDate,
      retentionLevel: scheduled.retentionLevel,
      isConsolidated: scheduled.isConsolidated,
      recallGapDays: scheduled.gapDays,
      lastRecallRating: entry.rating,
      lastRecalledAt: todayStr,
      topicScore: scheduled.newScore,
      isDone: scheduled.newScore >= 70,
    });

    const historyId = `recall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const historyEntry: RecallHistoryEntry = {
      id: historyId,
      userId: this.currentUid,
      topicId: topic.id,
      courseId: topic.courseId,
      topicTitle: topic.title,
      courseCode: course?.code || "",
      stage: scheduled.nextStage,
      rating: entry.rating,
      previousRetention: prevRetention,
      newRetention: scheduled.retentionLevel,
      scoreBefore: currentScore,
      scoreAfter: scheduled.newScore,
      reviewedAt: new Date().toISOString(),
      date: todayStr,
    };

    await setDoc(doc(db, "users", this.currentUid, "recallHistory", historyId), historyEntry);
    return { topic: updatedTopic, historyEntry };
  }

  async getRecallHistory(limitCount?: number): Promise<RecallHistoryEntry[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "users", this.currentUid, "recallHistory"),
        orderBy("reviewedAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as RecallHistoryEntry);
      return limitCount && limitCount > 0 ? list.slice(0, limitCount) : list;
    } catch (err) {
      console.warn("getRecallHistory notice:", err);
      return [];
    }
  }

  async updateCourseRecallStyle(courseId: string, style: RecallStyle): Promise<Course> {
    return this.updateCourse(courseId, { recallStyle: style });
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
    console.log("Importing JSON dataset into Firebase for user:", this.currentUid);
  }
}
