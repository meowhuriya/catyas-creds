import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  USER_PRIVATE_KEYS,
  SYNCED_KEYS,
  SYNC_OWNER_KEY,
  stopCloudSync,
} from "./synced-storage";

describe("Cloud Synced Storage Isolation", () => {
  let mockStore: Map<string, string>;
  let prevWindow: any;
  let prevLocalStorage: any;

  beforeEach(() => {
    mockStore = new Map();
    prevWindow = (globalThis as any).window;
    prevLocalStorage = (globalThis as any).localStorage;

    const storageObj = {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, val: string) => mockStore.set(key, val),
      removeItem: (key: string) => mockStore.delete(key),
    };
    (globalThis as any).localStorage = storageObj;
    (globalThis as any).window = {
      localStorage: storageObj,
      dispatchEvent: () => {},
    };
  });

  afterEach(() => {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
  });

  it("identifies user-private keys (files, assignments, pantry) vs common/focus keys", () => {
    // Private keys
    expect(USER_PRIVATE_KEYS.has("valeria_research_projects")).toBe(true);
    expect(USER_PRIVATE_KEYS.has("valeria_activities_feed")).toBe(true);
    expect(USER_PRIVATE_KEYS.has("vc_assignments_v1")).toBe(true);
    expect(USER_PRIVATE_KEYS.has("vc_pantry_v1")).toBe(true);
    expect(USER_PRIVATE_KEYS.has("vc_study_v1")).toBe(true);

    // Focus keys MUST NOT be altered
    expect(USER_PRIVATE_KEYS.has("vc_focus_days_v1")).toBe(false);
    expect(USER_PRIVATE_KEYS.has("vc_focus_settings_v1")).toBe(false);
    expect(USER_PRIVATE_KEYS.has("vc_garden_v1")).toBe(false);

    // Common UI/sound settings
    expect(USER_PRIVATE_KEYS.has("app_theme")).toBe(false);
    expect(USER_PRIVATE_KEYS.has("valeria_sound_enabled")).toBe(false);
  });

  it("stopCloudSync(true) clears all private data and owner key on sign-out", () => {
    // Seed User A private data
    mockStore.set("valeria_research_projects", JSON.stringify([{ id: "proj-1", title: "My Research" }]));
    mockStore.set("valeria_activities_feed", JSON.stringify([{ id: "act-1", title: "My Certificate" }]));
    mockStore.set("vc_assignments_v1", JSON.stringify([{ id: "asgn-1" }]));
    mockStore.set("vc_pantry_v1", JSON.stringify([{ eggId: "egg-1", foodId: "food-1" }]));
    mockStore.set("app_theme", "harvard");
    mockStore.set(SYNC_OWNER_KEY, "user-a-uid");

    // Call stopCloudSync(true) as done during signOut
    stopCloudSync(true);

    // Private keys must be cleared so the next user or guest does not see or absorb them
    expect(mockStore.get("valeria_research_projects")).toBeUndefined();
    expect(mockStore.get("valeria_activities_feed")).toBeUndefined();
    expect(mockStore.get("vc_assignments_v1")).toBeUndefined();
    expect(mockStore.get("vc_pantry_v1")).toBeUndefined();
    expect(mockStore.get(SYNC_OWNER_KEY)).toBeUndefined();

    // Common non-private settings (theme) are preserved
    expect(mockStore.get("app_theme")).toBe("harvard");
  });
});
