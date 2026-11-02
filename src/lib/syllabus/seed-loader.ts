import rawSeedData from "@/data/seed/meridian-year1-seed.json";
import { cleanSyllabusTitle } from "@/lib/utils";
import { Course, CourseColorTag, Module, Term, Topic } from "@/types/schemas";

export interface SeedValidationResult {
  isValid: boolean;
  sem1: { courses: number; credits: number; topics: number };
  sem2: { courses: number; credits: number; topics: number };
  total: { courses: number; topics: number };
  errorMessage?: string;
}

export function validateSeedTotals(): SeedValidationResult {
  if (!rawSeedData || !Array.isArray(rawSeedData.courses)) {
    return {
      isValid: false,
      sem1: { courses: 0, credits: 0, topics: 0 },
      sem2: { courses: 0, credits: 0, topics: 0 },
      total: { courses: 0, topics: 0 },
      errorMessage: "meridian-year1-seed.json is missing or corrupt.",
    };
  }

  let sem1Courses = 0;
  let sem1Credits = 0;
  let sem1Topics = 0;

  let sem2Courses = 0;
  let sem2Credits = 0;
  let sem2Topics = 0;

  for (const c of rawSeedData.courses) {
    let courseTopicsCount = 0;
    for (const u of c.units || []) {
      courseTopicsCount += (u.topics || []).length;
    }

    if (c.termId === "term-sem-1") {
      sem1Courses++;
      sem1Credits += c.credits;
      sem1Topics += courseTopicsCount;
    } else if (c.termId === "term-sem-2") {
      sem2Courses++;
      sem2Credits += c.credits;
      sem2Topics += courseTopicsCount;
    }
  }

  const totalCourses = rawSeedData.courses.length;
  const totalTopics = sem1Topics + sem2Topics;

  const sem1Valid = sem1Courses === 9 && sem1Credits === 20 && sem1Topics === 325;
  const sem2Valid = sem2Courses === 10 && sem2Credits === 20 && sem2Topics === 326;
  const totalValid = totalCourses === 19 && totalTopics === 651;

  const isValid = sem1Valid && sem2Valid && totalValid;

  let errorMessage: string | undefined;
  if (!isValid) {
    errorMessage = `Syllabus totals mismatch: Sem 1 expected 9/20/325 (got ${sem1Courses}/${sem1Credits}/${sem1Topics}), Sem 2 expected 10/20/326 (got ${sem2Courses}/${sem2Credits}/${sem2Topics}), Total expected 19/651 (got ${totalCourses}/${totalTopics}).`;
  }

  return {
    isValid,
    sem1: { courses: sem1Courses, credits: sem1Credits, topics: sem1Topics },
    sem2: { courses: sem2Courses, credits: sem2Credits, topics: sem2Topics },
    total: { courses: totalCourses, topics: totalTopics },
    errorMessage,
  };
}

const VALID_COLOR_TAGS = new Set(["slate", "teal", "olive", "ochre", "plum", "rust", "graphite", "forest"]);

function mapColorTag(tag?: string): CourseColorTag {
  if (tag && VALID_COLOR_TAGS.has(tag)) return tag as CourseColorTag;
  if (tag === "crimson") return "rust";
  if (tag === "sage") return "olive";
  if (tag === "mustard") return "ochre";
  return "rust";
}

export function getCanonicalTerms(userId: string = "valeria-student"): Term[] {
  return (rawSeedData.terms || []).map((t) => ({
    id: t.id,
    userId,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    isCurrent: t.isCurrent ?? (t.id === "term-sem-1"),
    createdAt: "2025-08-01T08:00:00.000Z",
  }));
}

export function getCanonicalCourses(userId: string = "valeria-student"): Course[] {
  return (rawSeedData.courses || []).map((c) => {
    const levelStr = String(c.level || 100);
    const validLevel = (levelStr === "200" || levelStr === "300" || levelStr === "400") ? levelStr : "100";

    return {
      id: `course-${c.code.toLowerCase()}`,
      userId,
      termId: c.termId,
      code: c.code,
      title: cleanSyllabusTitle(c.title),
      department: c.department,
      level: validLevel,
      credits: c.credits,
      description: c.description || "",
      colorTag: mapColorTag(c.colorTag),
      gradingScheme: {
        lessonCompletion: 10,
        quizzes: 25,
        assignments: 30,
        midterm: 15,
        finalExam: 20,
      },
      passMark: 40,
      createdAt: "2025-08-01T08:00:00.000Z",
    };
  });
}

export function getCanonicalModules(userId: string = "valeria-student"): Module[] {
  const modules: Module[] = [];

  for (const c of rawSeedData.courses || []) {
    const courseId = `course-${c.code.toLowerCase()}`;
    const codeLower = c.code.toLowerCase();

    (c.units || []).forEach((u, unitIdx) => {
      modules.push({
        id: `unit-${codeLower}-u${u.unitNumber}`,
        userId,
        courseId,
        title: cleanSyllabusTitle(u.title),
        order: unitIdx,
        unitNumber: u.unitNumber,
        isSection: false,
        electiveExperimentsCount: null,
        isCollapsed: false,
        createdAt: "2025-08-01T08:00:00.000Z",
      });
    });
  }

  return modules;
}

export function getCanonicalTopics(userId: string = "valeria-student"): Topic[] {
  const topics: Topic[] = [];

  for (const c of rawSeedData.courses || []) {
    const courseId = `course-${c.code.toLowerCase()}`;
    const codeLower = c.code.toLowerCase();

    (c.units || []).forEach((u) => {
      const unitId = `unit-${codeLower}-u${u.unitNumber}`;

      (u.topics || []).forEach((topStr, topIdx) => {
        topics.push({
          id: `${codeLower}-u${u.unitNumber}-t${topIdx + 1}`,
          userId,
          courseId,
          unitId,
          title: cleanSyllabusTitle(topStr),
          order: topIdx,
          isDone: false,
          watchScore: 0,
          checkScore: 0,
          topicScore: 0,
          isStudiedManually: false,
          isExperiment: false,
          isSelectedExperiment: true,
          createdAt: "2025-08-01T08:00:00.000Z",
        });
      });
    });
  }

  return topics;
}
