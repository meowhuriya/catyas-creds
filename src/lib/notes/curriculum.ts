/**
 * JNTUH Hyderabad, B.Tech Computer Science and Engineering, R25 regulations
 * (applicable from the AY 2025-26 batch). Transcribed from the official
 * "R25 CSE Syllabus" course structure. Subjects without a code in the source
 * (Professional / Open Elective slots) are listed through their options below.
 */

export type SubjectKind = "theory" | "lab" | "project" | "skill" | "elective";

export interface Subject {
  /** Unique id. Equals the code except for electives, where codes repeat between slots. */
  id: string;
  code: string;
  title: string;
  credits: number;
  kind: SubjectKind;
  year: 1 | 2 | 3 | 4;
  sem: 1 | 2;
  /** Elective slot name, e.g. "Professional Elective-I". */
  slot?: string;
}

type Row = [code: string, title: string, credits: number, kind?: SubjectKind];

function build(year: 1 | 2 | 3 | 4, sem: 1 | 2, rows: Row[]): Subject[] {
  return rows.map(([code, title, credits, kind]) => ({
    id: code,
    code,
    title,
    credits,
    kind: kind ?? (/Lab|Laboratory/i.test(title) ? "lab" : "theory"),
    year,
    sem,
  }));
}

function electives(year: 1 | 2 | 3 | 4, sem: 1 | 2, slotId: string, slot: string, credits: number, rows: [string, string][]): Subject[] {
  return rows.map(([code, title]) => ({
    id: `${slotId}~${code}`,
    code,
    title,
    credits,
    kind: "elective" as const,
    year,
    sem,
    slot,
  }));
}

export const SUBJECTS: Subject[] = [
  // I Year I Semester
  ...build(1, 1, [
    ["MA101BS", "Matrices and Calculus", 4],
    ["CH102BS", "Engineering Chemistry", 3],
    ["EN103HS", "English for Skill Enhancement", 3],
    ["EC104ES", "Electronic Devices and Circuits", 3],
    ["CS105ES", "Programming for Problem Solving", 3],
    ["CH106BS", "Engineering Chemistry Lab", 1],
    ["CS107ES", "Programming for Problem Solving Lab", 1],
    ["EN108HS", "English Language and Communication Skills Lab", 1],
    ["ME109ES", "Engineering Workshop", 1, "lab"],
  ]),
  // I Year II Semester
  ...build(1, 2, [
    ["MA201BS", "Ordinary Differential Equations and Vector Calculus", 3],
    ["PH202BS", "Advanced Engineering Physics", 3],
    ["ME203ES", "Engineering Drawing and Computer Aided Drafting", 3],
    ["EE204ES", "Basic Electrical Engineering", 3],
    ["CS205ES", "Data Structures", 3],
    ["PH206BS", "Advanced Engineering Physics Lab", 1],
    ["CS207ES", "Data Structures Lab", 1],
    ["CS208ES", "Python Programming Lab", 1],
    ["EE209ES", "Basic Electrical Engineering Lab", 1],
    ["CS210ES", "IT Workshop", 1, "lab"],
  ]),
  // II Year I Semester
  ...build(2, 1, [
    ["CS301PC", "Discrete Mathematics", 3],
    ["CS302PC", "Computer Organization and Architecture", 3],
    ["CS303PC", "Object Oriented Programming through Java", 3],
    ["CS304PC", "Software Engineering", 3],
    ["CS305PC", "Database Management Systems", 3],
    ["MS306HS", "Innovation and Entrepreneurship", 2],
    ["CS307PC", "Object Oriented Programming through Java Lab", 1],
    ["CS308PC", "Software Engineering Lab", 1],
    ["CS309PC", "Database Management Systems Lab", 1],
    ["CS310SD", "Node JS / React JS / Django", 1, "skill"],
    ["VA300ES", "Environmental Science", 1],
  ]),
  // II Year II Semester
  ...build(2, 2, [
    ["MA401PC", "Computer Oriented Statistical Methods", 3],
    ["CS402PC", "Operating Systems", 3],
    ["CS403PC", "Algorithm Design and Analysis", 3],
    ["CS404PC", "Computer Networks", 3],
    ["CS405PC", "Machine Learning", 3],
    ["MA406PC", "Computational Mathematics Lab", 1],
    ["CS407PC", "Operating Systems Lab", 1],
    ["CS408PC", "Computer Networks Lab", 1],
    ["CS409PC", "Machine Learning Lab", 1],
    ["CS410SD", "Data Visualization - R / Python / Power BI", 1, "skill"],
  ]),
  // III Year I Semester
  ...build(3, 1, [
    ["CS501PC", "Automata Theory and Compiler Design", 3],
    ["CS502PC", "Artificial Intelligence", 3],
    ["CS503PC", "DevOps", 3],
    ["CS504PC", "Compiler Design Lab", 1],
    ["CS505PC", "Artificial Intelligence with Python Lab", 1],
    ["CS506PC", "DevOps Lab", 1],
    ["CS507PC", "Field-Based Research Project", 2, "project"],
    ["CS508SD", "UI Design - Flutter / Android Studio", 1, "skill"],
    ["VA500HS", "Indian Knowledge System", 1],
  ]),
  ...electives(3, 1, "PE1", "Professional Elective-I", 3, [
    ["CS511PE", "Computer Graphics"],
    ["CS512PE", "Introduction to Data Science"],
    ["CS513PE", "Software Testing Methodologies"],
    ["CS514PE", "Data Mining"],
    ["CS515PE", "Web Programming"],
    ["CS516PE", "Distributed Systems"],
  ]),
  ...electives(3, 1, "OE1", "Open Elective-I", 2, [
    ["CS511OE", "Operating Systems"],
    ["CS512OE", "Database Management Systems"],
  ]),
  // III Year II Semester
  ...build(3, 2, [
    ["CS601PC", "Cryptography and Network Security", 3],
    ["CS602PC", "Deep Learning", 3],
    ["MS603HS", "Business Economics and Financial Analysis", 3],
    ["CS604PC", "Cryptography and Network Security Lab", 1],
    ["CS605PC", "Deep Learning Lab", 1],
    ["CS606PC", "Advanced Data Structures using Python Lab", 1],
    ["EN607HS", "Advanced English Communication Skills Laboratory", 1],
    ["CS608SD", "Prompt Engineering", 1, "skill"],
    ["VA600HS", "Gender Sensitization Lab / Human Values and Professional Ethics", 1],
  ]),
  ...electives(3, 2, "PE2", "Professional Elective-II", 3, [
    ["CS621PE", "Image Processing"],
    ["CS622PE", "Blockchain Technology"],
    ["CS623PE", "Software Project Management"],
    ["CS624PE", "Mining Massive Datasets"],
    ["CS625PE", "Full Stack Development"],
    ["CS626PE", "Generative AI"],
  ]),
  ...electives(3, 2, "OE2", "Open Elective-II", 2, [
    ["CS621OE", "Introduction to Computer Networks"],
    ["CS622OE", "Software Engineering"],
  ]),
  // IV Year I Semester
  ...build(4, 1, [
    ["CS701PC", "Natural Language Processing", 3],
    ["CS702PC", "Cyber Security", 3],
    ["MS703HS", "Fundamentals of Management", 3],
    ["CS704PC", "Natural Language Processing Lab", 1],
    ["CS705PC", "Cyber Security Lab", 1],
    ["CS706PC", "Industry Oriented Mini Project / Internship", 2, "project"],
  ]),
  ...electives(4, 1, "PE3", "Professional Elective-III", 3, [
    ["CS731PE", "Computer Vision"],
    ["CS732PE", "Scripting Languages"],
    ["CS733PE", "Vulnerability and Penetration Testing"],
    ["CS734PE", "Data Stream Mining"],
    ["CS735PE", "Cloud Computing"],
    ["CS736PE", "Information Retrieval Systems"],
  ]),
  ...electives(4, 1, "PE4", "Professional Elective-IV", 3, [
    ["CS731PE", "Augmented Reality & Virtual Reality"],
    ["CS732PE", "Agile Methodology"],
    ["CS733PE", "Big Data Analytics"],
    ["CS734PE", "Quantum Computing"],
    ["CS735PE", "Robotic Process Automation"],
    ["CS736PE", "Cyber Forensics"],
  ]),
  ...electives(4, 1, "OE3", "Open Elective-III", 2, [
    ["CS731OE", "Algorithms Design and Analysis"],
    ["CS732OE", "Fundamentals of Cyber Security"],
  ]),
  // IV Year II Semester
  ...build(4, 2, [["CS801PC", "Project Work", 14, "project"]]),
  ...electives(4, 2, "PE5", "Professional Elective-V", 3, [
    ["CS731PE", "Social Media Mining"],
    ["CS732PE", "Nature Inspired Computing"],
    ["CS733PE", "Internet of Things"],
    ["CS734PE", "Game Theory"],
    ["CS735PE", "Mobile Application Development"],
    ["CS736PE", "Human Computer Interaction"],
  ]),
  ...electives(4, 2, "PE6", "Professional Elective-VI", 3, [
    ["CS731PE", "High Performance Computing"],
    ["CS732PE", "Edge Computing"],
    ["CS733PE", "Graph Theory"],
    ["CS734PE", "Adhoc and Sensor Networks"],
    ["CS735PE", "Sustainable Engineering"],
    ["CS736PE", "Distributed Databases"],
  ]),
];

export const YEAR_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function subjectsFor(year: number, sem: 1 | 2): Subject[] {
  return SUBJECTS.filter((s) => s.year === year && s.sem === sem);
}

/** Calm, distinct hues so each subject card is easy to tell apart. */
const HUES = ["#7C6BC4", "#D9738B", "#4E9F8F", "#D99A4E", "#5B8DD6", "#9A6BB8", "#C2605A", "#6FA05A"];
export function subjectColor(s: Subject): string {
  let h = 0;
  for (const c of s.code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}
