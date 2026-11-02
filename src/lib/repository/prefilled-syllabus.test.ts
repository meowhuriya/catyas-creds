import { describe, it, expect } from "vitest";
import { FirebaseDataStore } from "./firebase-store";
import { DemoDataStore } from "./demo-store";
import { SEED_COURSES, SEED_TERMS, SEED_TOPICS, SEED_MODULES } from "@/lib/demo/seed-data";

describe("Permanent Pre-Filled CSE Year 1 Syllabus Verification", () => {
  it("verifies seed constants contain the complete CSE Year 1 curriculum", () => {
    expect(SEED_TERMS.length).toBe(2);
    expect(SEED_COURSES.length).toBe(19);
    expect(SEED_MODULES.length).toBe(79);
    expect(SEED_TOPICS.length).toBe(651);

    // Sem 1 = 9 courses, Sem 2 = 10 courses
    const sem1Courses = SEED_COURSES.filter((c) => c.termId === "term-sem-1");
    const sem2Courses = SEED_COURSES.filter((c) => c.termId === "term-sem-2");
    expect(sem1Courses.length).toBe(9);
    expect(sem2Courses.length).toBe(10);
  });

  it("verifies FirebaseDataStore immediately supplies all 19 courses without waiting for remote Firestore", async () => {
    const store = new FirebaseDataStore();

    const terms = await store.getTerms();
    expect(terms.length).toBe(2);
    expect(terms[0].id).toBe("term-sem-1");
    expect(terms[1].id).toBe("term-sem-2");

    const courses = await store.getCourses();
    expect(courses.length).toBe(19);

    const sem1 = await store.getCourses("term-sem-1");
    expect(sem1.length).toBe(9);

    const sem2 = await store.getCourses("term-sem-2");
    expect(sem2.length).toBe(10);

    const allTopics = await store.getAllTopics();
    expect(allTopics.length).toBe(651);

    const m1Modules = await store.getModules("course-ma101bs");
    expect(m1Modules.length).toBe(5);

    const m1Topics = await store.getAllTopics("course-ma101bs");
    expect(m1Topics.length).toBeGreaterThan(0);

    const degreePlan = await store.getDegreePlan();
    expect(degreePlan).not.toBeNull();
    expect(degreePlan?.totalCreditsTarget).toBe(160);
  });

  it("verifies DemoDataStore also supplies all 19 courses and 651 topics", async () => {
    const store = new DemoDataStore();

    const terms = await store.getTerms();
    expect(terms.length).toBe(2);

    const courses = await store.getCourses();
    expect(courses.length).toBe(19);

    const allTopics = await store.getAllTopics();
    expect(allTopics.length).toBe(651);
  });
});
