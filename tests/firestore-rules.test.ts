import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

describe("Firestore Security Rules Tests", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, "../firestore.rules");
    testEnv = await initializeTestEnvironment({
      projectId: "valeria-s-creds-test",
      firestore: {
        rules: fs.readFileSync(rulesPath, "utf8"),
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // 1. Signed-out users can read nothing
  it("signed-out users cannot read or write any user data", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    // Cannot read private user profile
    await assertFails(getDoc(doc(unauthedDb, "users", "userA")));

    // Cannot read user subcollection
    await assertFails(getDoc(doc(unauthedDb, "users", "userA", "courses", "cs105")));

    // Cannot write user data
    await assertFails(
      setDoc(doc(unauthedDb, "users", "userA"), { displayName: "Hacker" })
    );
  });

  // 2. User A cannot read or write User B's data
  it("user A cannot read or write user B data (user-isolated subcollections)", async () => {
    const userADb = testEnv.authenticatedContext("userA").firestore();

    // User A can write their own document and subcollections
    await assertSucceeds(
      setDoc(doc(userADb, "users", "userA"), {
        displayName: "User A",
        email: "usera@example.com",
      })
    );
    await assertSucceeds(
      setDoc(doc(userADb, "users", "userA", "courses", "cs105"), {
        code: "CS105ES",
        title: "Programming for Problem Solving",
      })
    );

    // User A CANNOT read User B's data
    await assertFails(getDoc(doc(userADb, "users", "userB")));
    await assertFails(getDoc(doc(userADb, "users", "userB", "courses", "cs105")));

    // User A CANNOT write to User B's data
    await assertFails(
      setDoc(doc(userADb, "users", "userB"), { displayName: "Impersonator" })
    );
    await assertFails(
      setDoc(doc(userADb, "users", "userB", "courses", "hacked"), {
        code: "HACK101",
      })
    );
  });

  // 3. Public transcript can be read by ID (get) only when sharing is on (isPublic == true)
  it("a public transcript can be read by ID (get) only when sharing is on", async () => {
    // Seed test documents with admin context (bypasses security rules)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      // Public transcript
      await setDoc(doc(adminDb, "transcriptSnapshots", "public-snapshot-1"), {
        id: "public-snapshot-1",
        userId: "owner-uid",
        isPublic: true,
        studentName: "Valeria Candidate",
        cgpa: 9.25,
        totalCredits: 40,
        createdAt: new Date().toISOString(),
      });
      // Private (unshared) transcript
      await setDoc(doc(adminDb, "transcriptSnapshots", "private-snapshot-2"), {
        id: "private-snapshot-2",
        userId: "owner-uid",
        isPublic: false,
        studentName: "Valeria Candidate",
        cgpa: 9.25,
        totalCredits: 40,
        createdAt: new Date().toISOString(),
      });
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const otherUserDb = testEnv.authenticatedContext("stranger-uid").firestore();
    const ownerDb = testEnv.authenticatedContext("owner-uid").firestore();

    // Public transcript is readable by unauthenticated visitor
    await assertSucceeds(getDoc(doc(unauthedDb, "transcriptSnapshots", "public-snapshot-1")));

    // Public transcript is readable by other authenticated user
    await assertSucceeds(getDoc(doc(otherUserDb, "transcriptSnapshots", "public-snapshot-1")));

    // Private transcript is BLOCKED for unauthenticated visitor
    await assertFails(getDoc(doc(unauthedDb, "transcriptSnapshots", "private-snapshot-2")));

    // Private transcript is BLOCKED for other authenticated user
    await assertFails(getDoc(doc(otherUserDb, "transcriptSnapshots", "private-snapshot-2")));

    // Private transcript is READABLE by its owner
    await assertSucceeds(getDoc(doc(ownerDb, "transcriptSnapshots", "private-snapshot-2")));
  });

  // 4. Public transcripts can NEVER be listed (enumeration protection)
  it("public transcripts can NEVER be listed across the collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const otherUserDb = testEnv.authenticatedContext("stranger-uid").firestore();

    // Listing is strictly denied: allow list: if false
    await assertFails(getDocs(collection(unauthedDb, "transcriptSnapshots")));
    await assertFails(getDocs(collection(otherUserDb, "transcriptSnapshots")));
  });

  // 5. Only its owner can create, edit or delete transcripts
  it("only its owner can create, edit, or delete transcripts", async () => {
    const ownerDb = testEnv.authenticatedContext("owner-uid").firestore();
    const strangerDb = testEnv.authenticatedContext("stranger-uid").firestore();
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    const newSnapshot = {
      id: "my-new-snapshot",
      userId: "owner-uid",
      isPublic: true,
      studentName: "Owner Name",
      cgpa: 9.5,
      totalCredits: 40,
      createdAt: new Date().toISOString(),
    };

    // Unauthenticated user cannot create
    await assertFails(
      setDoc(doc(unauthedDb, "transcriptSnapshots", "my-new-snapshot"), newSnapshot)
    );

    // Stranger cannot create transcript with someone else's userId
    await assertFails(
      setDoc(doc(strangerDb, "transcriptSnapshots", "my-new-snapshot"), newSnapshot)
    );

    // Owner CAN create their own transcript
    await assertSucceeds(
      setDoc(doc(ownerDb, "transcriptSnapshots", "my-new-snapshot"), newSnapshot)
    );

    // Stranger cannot update owner's transcript
    await assertFails(
      updateDoc(doc(strangerDb, "transcriptSnapshots", "my-new-snapshot"), {
        isPublic: false,
      })
    );

    // Stranger cannot delete owner's transcript
    await assertFails(
      deleteDoc(doc(strangerDb, "transcriptSnapshots", "my-new-snapshot"))
    );

    // Owner CAN update their own transcript (e.g. toggle isPublic)
    await assertSucceeds(
      updateDoc(doc(ownerDb, "transcriptSnapshots", "my-new-snapshot"), {
        isPublic: false,
      })
    );

    // Owner CAN delete their own transcript
    await assertSucceeds(
      deleteDoc(doc(ownerDb, "transcriptSnapshots", "my-new-snapshot"))
    );
  });
});
