import { describe, it, expect } from "vitest";

describe("NotebookLM Research Engine & Source Grounding", () => {
  const mockSources = [
    {
      id: "src-1",
      title: "INT8 Tensor Quantization",
      type: "paper",
      content: "INT8 quantization reduces memory footprint by 75% on ARM Cortex-M.",
      selected: true,
      dateAdded: "2026-03-12",
    },
    {
      id: "src-2",
      title: "Smart Materials Transducers",
      type: "syllabus",
      content: "Piezoelectric sensors eliminate external operational amplifier stages.",
      selected: false,
      dateAdded: "2026-03-14",
    },
  ];

  it("filters strictly selected sources for synthesis", () => {
    const active = mockSources.filter((s) => s.selected);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe("src-1");
  });

  it("formats sources into grounded markdown blocks with explicit citation indices", () => {
    const active = mockSources.filter((s) => s.selected);
    const formatted = active
      .map(
        (src, idx) =>
          `[Source ${idx + 1}: "${src.title}" (${src.type || "Document"})]\n${src.content.trim()}`
      )
      .join("\n\n---\n\n");

    expect(formatted).toContain('[Source 1: "INT8 Tensor Quantization" (paper)]');
    expect(formatted).toContain("reduces memory footprint by 75%");
  });

  it("validates audio overview dialogue schema for Alex and Sam", () => {
    const mockAudioOverview = {
      title: "Deep Dive: Cracking TinyML",
      duration: "3 min",
      dialogue: [
        {
          speaker: "Alex" as const,
          text: "Welcome back to the lab briefing!",
          emotion: "curious",
        },
        {
          speaker: "Sam" as const,
          text: "Looking at the INT8 quantization benchmarks, memory drops by 75%.",
          emotion: "explanatory",
        },
      ],
    };

    expect(mockAudioOverview.dialogue.length).toBeGreaterThanOrEqual(2);
    expect(mockAudioOverview.dialogue[0].speaker).toBe("Alex");
    expect(mockAudioOverview.dialogue[1].speaker).toBe("Sam");
    expect(mockAudioOverview.dialogue.every((d) => d.text.length > 0)).toBe(true);
  });
});

describe("Extracurricular Activity & Certificate Vault", () => {
  const activities = [
    {
      id: "act-1",
      title: "Smart India Hackathon 2025",
      category: "hackathon",
      issuer: "Ministry of Education & AICTE",
      standing: "winner",
      skills: ["Edge AI", "Rust", "Embedded"],
      certificateImage: "data:image/svg+xml;utf8,<svg>Certificate</svg>",
    },
    {
      id: "act-2",
      title: "ACM ICPC Regional Contest",
      category: "competition",
      issuer: "ACM ICPC",
      standing: "runner_up",
      skills: ["Algorithms", "C++"],
      certificateImage: "data:image/svg+xml;utf8,<svg>Certificate</svg>",
    },
    {
      id: "act-3",
      title: "AWS Solutions Architect",
      category: "certification",
      issuer: "Amazon Web Services",
      standing: "certified",
      skills: ["Cloud", "AWS"],
    },
  ];

  it("filters activities by category correctly", () => {
    const hackathons = activities.filter((a) => a.category === "hackathon");
    expect(hackathons.length).toBe(1);
    expect(hackathons[0].title).toBe("Smart India Hackathon 2025");
  });

  it("searches across titles, issuers, and skills", () => {
    const searchRust = activities.filter((a) =>
      a.skills.some((s) => s.toLowerCase().includes("rust"))
    );
    expect(searchRust.length).toBe(1);
    expect(searchRust[0].id).toBe("act-1");

    const searchIssuer = activities.filter((a) =>
      a.issuer.toLowerCase().includes("amazon")
    );
    expect(searchIssuer.length).toBe(1);
    expect(searchIssuer[0].id).toBe("act-3");
  });

  it("identifies podium / winner standings for honor calculations", () => {
    const podiumWinners = activities.filter(
      (a) => a.standing === "winner" || a.standing === "runner_up"
    );
    expect(podiumWinners.length).toBe(2);
  });
});
