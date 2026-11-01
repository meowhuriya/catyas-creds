// Appearance & Theme Management (PART D)

export type BackgroundType = "gingham" | "plain" | "custom";
export type PatternStrength = "soft" | "medium" | "bold";
export type AccentColor = "crimson" | "tomato" | "mustard" | "sage" | "plum";
export type TextSize = "normal" | "large";

export interface AppearanceSettings {
  bgType: BackgroundType;
  patternStrength: PatternStrength;
  accentColor: AccentColor;
  textSize: TextSize;
  customDim: number; // 0 to 80 percent
  customBlur: number; // 0 to 20 px
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  bgType: "gingham",
  patternStrength: "soft",
  accentColor: "crimson",
  textSize: "normal",
  customDim: 20,
  customBlur: 0,
};

const STORAGE_KEY = "valerias_appearance_settings_v1";
const DB_NAME = "valerias_appearance_db";
const STORE_NAME = "wallpapers";

// --- IndexedDB for Local-Only Wallpaper Storage ---

function openWallpaperDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not available"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomWallpaper(dataUrl: string): Promise<void> {
  const db = await openWallpaperDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(dataUrl, "current_wallpaper");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCustomWallpaper(): Promise<string | null> {
  try {
    const db = await openWallpaperDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("current_wallpaper");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteCustomWallpaper(): Promise<void> {
  try {
    const db = await openWallpaperDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete("current_wallpaper");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

// Downscale file to max width 1920px using HTMLCanvasElement
export function processImageFile(file: File, maxWidth = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with 0.88 quality
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Persistence & Application ---

export function loadSavedAppearance(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearanceSettings(settings: AppearanceSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function applyAppearanceToDOM(
  settings: AppearanceSettings,
  customImageUrl?: string | null
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // 1. Pattern strength alpha
  const alphaMap: Record<PatternStrength, string> = {
    soft: "0.12",
    medium: "0.20",
    bold: "0.30",
  };
  const isDark = root.classList.contains("dark");
  const checkAlpha = isDark ? "0.10" : alphaMap[settings.patternStrength] || "0.12";
  root.style.setProperty("--check-alpha", checkAlpha);

  // 2. Background mode
  root.dataset.bg = settings.bgType;

  // 3. Custom image variables
  if (settings.bgType === "custom" && customImageUrl) {
    root.style.setProperty("--custom-bg-image", `url("${customImageUrl}")`);
    root.style.setProperty("--custom-dim", (settings.customDim / 100).toFixed(2));
    root.style.setProperty("--custom-blur", `${settings.customBlur}px`);
  } else {
    root.style.removeProperty("--custom-bg-image");
    root.style.removeProperty("--custom-dim");
    root.style.removeProperty("--custom-blur");
  }

  // 4. Accent colour
  root.dataset.accent = settings.accentColor;

  // 5. Text size
  root.dataset.textSize = settings.textSize;
}
