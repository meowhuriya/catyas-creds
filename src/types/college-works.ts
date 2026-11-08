export type WorkType = "assignment" | "record";
export type WorkStatus = "pending" | "in_progress" | "submitted" | "graded";

export interface CollegeWorkItem {
  id: string;
  userId?: string;
  courseCode: string;
  courseTitle: string;
  type: WorkType;
  title: string;
  unitOrExp: string;
  dueDate: string;
  status: WorkStatus;
  gradeOrMarks?: string;
  notes?: string;
  submissionUrl?: string;
  attachmentName?: string;
  submittedAt?: string;
  lastUpdatedAt: string;
}

export const ALL_COURSES = [
  { code: "MA101BS", title: "Matrices and Calculus" },
  { code: "CH102BS", title: "Engineering Chemistry" },
  { code: "EN103HS", title: "English for Skill Enhancement" },
  { code: "EC104ES", title: "Electronic Devices and Circuits" },
  { code: "CS105ES", title: "Programming for Problem Solving" },
  { code: "CH106BS", title: "Engineering Chemistry Lab" },
  { code: "CS107ES", title: "Programming for Problem Solving Lab" },
  { code: "EN108HS", title: "English Language and Communication Skills Lab" },
  { code: "ME109ES", title: "Engineering Workshop" },
  { code: "MA201BS", title: "Ordinary Differential Equations and Vector Calculus" },
  { code: "PH202BS", title: "Advanced Engineering Physics" },
  { code: "ME203ES", title: "Engineering Drawing and Computer Aided Drafting" },
  { code: "EE204ES", title: "Basic Electrical Engineering" },
  { code: "CS205ES", title: "Data Structures" },
  { code: "PH206BS", title: "Advanced Engineering Physics Lab" },
  { code: "CS207ES", title: "Data Structures Lab" },
  { code: "CS208ES", title: "Python Programming Lab" },
  { code: "EE209ES", title: "Basic Electrical Engineering Lab" },
  { code: "CS210ES", title: "IT Workshop" },
];
