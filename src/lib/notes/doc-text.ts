/** Reads the text of an old Word 97-2003 .doc file (no libraries): OLE container, then Word's text pieces. */
export function legacyDocToText(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf);
  const dv = new DataView(buf);
  if (b.length < 512 || dv.getUint32(0, true) !== 0xe011cfd0) return null;
  const ss = 1 << dv.getUint16(30, true);
  const mss = 1 << dv.getUint16(32, true);
  const sec = (i: number) => 512 + i * ss;

  // FAT
  const difat: number[] = [];
  for (let i = 0; i < 109; i++) difat.push(dv.getInt32(76 + i * 4, true));
  let dn = dv.getInt32(68, true);
  for (let guard = 0; dn >= 0 && guard < 64; guard++) {
    for (let i = 0; i < ss / 4 - 1; i++) difat.push(dv.getInt32(sec(dn) + i * 4, true));
    dn = dv.getInt32(sec(dn) + ss - 4, true);
  }
  const fat: number[] = [];
  for (const s of difat) {
    if (s < 0) continue;
    for (let i = 0; i < ss / 4; i++) fat.push(dv.getInt32(sec(s) + i * 4, true));
  }
  const chain = (start: number, table: number[]) => {
    const out: number[] = [];
    for (let s = start; s >= 0 && out.length < 1e6; s = table[s]) out.push(s);
    return out;
  };
  const readBig = (start: number, size: number) => {
    const out = new Uint8Array(size);
    let o = 0;
    for (const s of chain(start, fat)) {
      const n = Math.min(ss, size - o);
      if (n <= 0) break;
      out.set(b.subarray(sec(s), sec(s) + n), o);
      o += n;
    }
    return out;
  };

  // Directory
  const dir = readBig(dv.getInt32(48, true), chain(dv.getInt32(48, true), fat).length * ss);
  const ddv = new DataView(dir.buffer);
  const entries: { name: string; start: number; size: number }[] = [];
  for (let i = 0; i + 128 <= dir.length; i += 128) {
    const len = ddv.getUint16(i + 64, true);
    let name = "";
    for (let c = 0; c < Math.max(0, len / 2 - 1); c++) name += String.fromCharCode(ddv.getUint16(i + c * 2, true));
    entries.push({ name, start: ddv.getInt32(i + 116, true), size: ddv.getUint32(i + 120, true) });
  }
  const root = entries[0];

  // Mini stream
  const miniFat: number[] = [];
  const mfStart = dv.getInt32(60, true);
  if (mfStart >= 0) for (const s of chain(mfStart, fat)) for (let i = 0; i < ss / 4; i++) miniFat.push(dv.getInt32(sec(s) + i * 4, true));
  let mini: Uint8Array | null = null;
  const stream = (e: { start: number; size: number }) => {
    if (e.size >= 4096) return readBig(e.start, e.size);
    mini ??= readBig(root.start, root.size);
    const out = new Uint8Array(e.size);
    let o = 0;
    for (const s of chain(e.start, miniFat)) {
      const n = Math.min(mss, e.size - o);
      if (n <= 0) break;
      out.set(mini.subarray(s * mss, s * mss + n), o);
      o += n;
    }
    return out;
  };

  const wd = entries.find((e) => e.name === "WordDocument");
  if (!wd) return null;
  const word = stream(wd);
  const wdv = new DataView(word.buffer);
  if (wdv.getUint16(0, true) !== 0xa5ec) return null;
  const useTable1 = (wdv.getUint16(10, true) & 0x0200) !== 0;
  const tbl = entries.find((e) => e.name === (useTable1 ? "1Table" : "0Table"));
  if (!tbl) return null;
  const table = stream(tbl);
  const tdv = new DataView(table.buffer);
  const ccpText = wdv.getInt32(0x4c, true);
  const fcClx = wdv.getUint32(0x1a2, true);
  const lcbClx = wdv.getUint32(0x1a6, true);

  // Clx: skip property blocks, then the piece table
  let p = fcClx;
  const end = fcClx + lcbClx;
  while (p < end && table[p] === 1) p += 3 + tdv.getUint16(p + 1, true);
  if (table[p] !== 2) return null;
  const lcb = tdv.getUint32(p + 1, true);
  p += 5;
  const n = Math.floor((lcb - 4) / 12);
  const cps: number[] = [];
  for (let i = 0; i <= n; i++) cps.push(tdv.getUint32(p + i * 4, true));
  const pcd = p + (n + 1) * 4;
  const win = new TextDecoder("windows-1252");
  let text = "";
  for (let i = 0; i < n; i++) {
    const fc = tdv.getUint32(pcd + i * 8 + 2, true);
    const chars = cps[i + 1] - cps[i];
    if (fc & 0x40000000) {
      const off = (fc & 0x3fffffff) >>> 1;
      text += win.decode(word.subarray(off, off + chars));
    } else {
      text += new TextDecoder("utf-16le").decode(word.subarray(fc, fc + chars * 2));
    }
  }
  return text
    .slice(0, ccpText > 0 ? ccpText : undefined)
    .replace(/[\r\v]/g, "\n")
    .replace(/\x07/g, " ")
    .replace(/[\x00-\x06\x08\x0b-\x0c\x0e-\x1f\x13-\x15]/g, "")
    .replace(/\n{3,}/g, "\n\n");
}
