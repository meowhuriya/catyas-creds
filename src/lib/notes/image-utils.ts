const MAX_DATA_URL_CHARS = 850_000; // keeps each Firestore doc safely under its 1 MiB limit

/** Shrinks a photo to a web-friendly JPEG data URL small enough to sync. */
export async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image"));
      el.src = objectUrl;
    });

    let maxSide = 1400;
    let quality = 0.72;
    for (let attempt = 0; attempt < 7; attempt++) {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", quality);
      if (out.length <= MAX_DATA_URL_CHARS) return out;
      maxSide = Math.round(maxSide * 0.8);
      quality = Math.max(0.45, quality - 0.08);
    }
    throw new Error("That image is too large to store. Try a smaller photo.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
