import { describe, it, expect } from "vitest";
import { FirebaseDataStore } from "./firebase-store";
import { DemoDataStore } from "./demo-store";
import { SEED_COURSES, SEED_TERMS, SEED_TOPICS, SEED_MODULES } from "@/lib/demo/seed-data";
import { validateSeedTotals } from "@/lib/syllabus/seed-loader";
import { cleanSyllabusTitle, getYoutubeSearchUrl } from "@/lib/utils";

describe("Permanent Pre-Filled CSE Year 1 Syllabus Verification", () => {
  it("verifies validateSeedTotals() checks exact curriculum requirements", () => {
    const result = validateSeedTotals();
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();

    // Sem 1: 9 courses, 20 credits, 325 topics
    expect(result.sem1.courses).toBe(9);
    expect(result.sem1.credits).toBe(20);
    expect(result.sem1.topics).toBe(325);

    // Sem 2: 10 courses, 20 credits, 326 topics
    expect(result.sem2.courses).toBe(10);
    expect(result.sem2.credits).toBe(20);
    expect(result.sem2.topics).toBe(326);

    // Total: 19 courses, 651 topics
    expect(result.total.courses).toBe(19);
    expect(result.total.topics).toBe(651);
  });

  it("verifies seed constants contain the complete CSE Year 1 curriculum", () => {
    expect(SEED_TERMS.length).toBe(2);
    expect(SEED_COURSES.length).toBe(19);
    expect(SEED_MODULES.length).toBe(79);
    expect(SEED_TOPICS.length).toBe(651);

    const sem1Courses = SEED_COURSES.filter((c) => c.termId === "term-sem-1");
    const sem2Courses = SEED_COURSES.filter((c) => c.termId === "term-sem-2");
    expect(sem1Courses.length).toBe(9);
    expect(sem2Courses.length).toBe(10);
  });

  it("CHECK 1: Delete old data / fresh sign-in immediately loads all 19 courses and 651 topics", async () => {
    const store = new FirebaseDataStore();

    const terms = await store.getTerms();
    expect(terms.length).toBe(2);
    expect(terms[0].id).toBe("term-sem-1");
    expect(terms[0].isCurrent).toBe(true);
    expect(terms[1].id).toBe("term-sem-2");

    const courses = await store.getCourses();
    expect(courses.length).toBe(19);

    const sem1 = await store.getCourses("term-sem-1");
    expect(sem1.length).toBe(9);

    const sem2 = await store.getCourses("term-sem-2");
    expect(sem2.length).toBe(10);

    const allTopics = await store.getAllTopics();
    expect(allTopics.length).toBe(651);

    const degreePlan = await store.getDegreePlan();
    expect(degreePlan).not.toBeNull();
    expect(degreePlan?.totalCreditsTarget).toBe(160);
  });

  it("CHECK 2: Engineering Chemistry Unit 4 title is 'Polymers' (no brackets) and topics match the file", async () => {
    const store = new FirebaseDataStore();
    const chemModules = await store.getModules("course-ch102bs");
    expect(chemModules.length).toBe(5);

    const unit4 = chemModules.find((m) => m.unitNumber === 4);
    expect(unit4).toBeDefined();
    expect(cleanSyllabusTitle(unit4?.title)).toBe("Polymers");
    expect(unit4?.title).not.toContain("[");
    expect(unit4?.title).not.toContain("]");

    const unit4Topics = await store.getTopics(unit4!.id);
    expect(unit4Topics.length).toBe(14);
    expect(unit4Topics[0].title).toContain("Definition - Classification of polymers");
    expect(unit4Topics[unit4Topics.length - 1].title).toContain("its applications");

    // Stable ID pattern: <courseCode>-u<unitNumber>-t<topicIndex>
    expect(unit4Topics[0].id).toBe("ch102bs-u4-t1");
    expect(unit4Topics[1].id).toBe("ch102bs-u4-t2");
  });

  it("CHECK 3: Programming for Problem Solving (CS105ES) has all 5 units with topics", async () => {
    const store = new FirebaseDataStore();
    const ppsModules = await store.getModules("course-cs105es");
    expect(ppsModules.length).toBe(5);

    for (let uNum = 1; uNum <= 5; uNum++) {
      const u = ppsModules.find((m) => m.unitNumber === uNum);
      expect(u).toBeDefined();
      const uTopics = await store.getTopics(u!.id);
      expect(uTopics.length).toBeGreaterThan(0);
    }

    const allPpsTopics = await store.getAllTopics("course-cs105es");
    expect(allPpsTopics.length).toBe(53);
  });

  it("CHECK 4: Running the seed twice never creates duplicate courses, units, or topics", async () => {
    const store = new FirebaseDataStore();

    // First load
    const courses1 = await store.getCourses();
    const topics1 = await store.getAllTopics();
    expect(courses1.length).toBe(19);
    expect(topics1.length).toBe(651);

    // Trigger restore / re-seed
    await store.restoreOriginalSyllabus();

    // Second check
    const courses2 = await store.getCourses();
    const topics2 = await store.getAllTopics();
    expect(courses2.length).toBe(19);
    expect(topics2.length).toBe(651);

    // Unique IDs check
    const uniqueCourseIds = new Set(courses2.map((c) => c.id));
    expect(uniqueCourseIds.size).toBe(19);

    const uniqueTopicIds = new Set(topics2.map((t) => t.id));
    expect(uniqueTopicIds.size).toBe(651);
  });

  it("verifies cleanSyllabusTitle strips hour markers and trailing colons", () => {
    expect(cleanSyllabusTitle("Polymers [8L]:")).toBe("Polymers");
    expect(cleanSyllabusTitle("Polymers [8]:")).toBe("Polymers");
    expect(cleanSyllabusTitle("[8] Polymers:")).toBe("Polymers");
    expect(cleanSyllabusTitle("Polymers (8L)")).toBe("Polymers");
    expect(cleanSyllabusTitle("Polymers:")).toBe("Polymers");
    expect(cleanSyllabusTitle("Water and its treatment [10 Hours]:")).toBe("Water and its treatment");
    expect(cleanSyllabusTitle("")).toBe("");
  });

  it("verifies getYoutubeSearchUrl produces valid query for YouTube video searches", () => {
    const url = getYoutubeSearchUrl("Engineering Chemistry", "Polymers [8L]:");
    expect(url).toContain("https://www.youtube.com/results?search_query=");
    expect(url).toContain(encodeURIComponent("Engineering Chemistry Polymers"));
  });
});
