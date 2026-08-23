import { ExamSubject } from "../types";

export const examSubjects: ExamSubject[] = [
  {
    id: "test-pol-b1",
    name: {
      en: "Polish Language — B1 Practice (PDF)",
      uz: "Polyak Tili — B1 Imtihon Testi (PDF)",
    },
    category: "Language",
    level: "B1",
    timeMinutes: 20,
  },
  {
    id: "test-math-entrance",
    name: {
      en: "Mathematics Entrance Exam (PDF)",
      uz: "Matematika Kirish Testi (PDF)",
    },
    category: "Entrance",
    level: "University Entrance",
    timeMinutes: 25,
  },
];
