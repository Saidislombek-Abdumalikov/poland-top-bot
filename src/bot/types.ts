export type Language = "en" | "uz";

export type DegreeLevel = "Bachelor" | "Master" | "PhD" | "MBA";

export type StudyField =
  | "Technology"
  | "Engineering"
  | "Business"
  | "Medicine"
  | "Law"
  | "Science"
  | "Social Sciences"
  | "Economics"
  | "Architecture";

export type DocStatus = "approved" | "reviewing" | "needs_correction" | "missing";

export type AppStage = "Submitted" | "Processing" | "University Review" | "Accepted" | "Action Needed";

export interface University {
  id: string;
  name: string;
  abbr: string;
  city: string;
  type: "Public" | "Private";
  founded: number;
  website: string;
  programsCount: number;
  students: number;
  internationalStudents: number;
  ranking: string;
  logo: string;
  description: {
    en: string;
    uz: string;
  };
  faculties: string[];
  tuition: {
    eu: string;
    nonEu: string;
    english: string;
  };
  requirements: string[];
  deadline: string;
}

export interface Program {
  id: string;
  name: string;
  university: string;
  uniId: string;
  city: string;
  level: DegreeLevel;
  field: StudyField;
  lang: string;
  tuition: string;
  duration: string;
  deadline: string;
  status: "Open" | "Closed" | "Rolling";
  about: {
    en: string;
    uz: string;
  };
  requirements: string[];
  documents: string[];
  mode: "Full-time" | "Part-time";
}

export interface TestMaterial {
  id: string; // e.g. "test-math-01", "test-pol-b1"
  title: {
    en: string;
    uz: string;
  };
  subject: string; // e.g. "Matematika", "Ingliz tili (B2)", "Polyak tili", "Tibbiyot / Biologiya"
  description?: {
    en: string;
    uz: string;
  };
  fileId?: string; // Telegram document/photo file_id
  fileName?: string; // e.g. "Warsaw_University_Math_Test_2025.pdf"
  fileType?: "document" | "photo" | "link";
  fileUrl?: string; // Google Drive / download link
  isFree?: boolean;
  createdAt: string;
  updatedAt?: string;
  addedByName?: string;
}

export interface ExamSubject {
  id: string;
  name: {
    en: string;
    uz: string;
  };
  category?: string;
  level?: string;
  timeMinutes?: number;
}

export interface StudentReview {
  id: number;
  userId?: number;
  name: string;
  country: string;
  university: string;
  program: string;
  rating: number;
  year: string;
  text: {
    en: string;
    uz: string;
  };
  status: "pending" | "approved";
  submittedAt: string;
}

export interface DocumentDefinition {
  id: string; // docKey: passport, diploma, etc.
  name: {
    en: string;
    uz: string;
  };
  desc: {
    en: string;
    uz: string;
  };
  required: boolean;
}

export interface DocumentRecord {
  id: string; // docKey: passport, diploma, etc.
  name: {
    en: string;
    uz: string;
  };
  status: DocStatus;
  link?: string;
  fileId?: string;
  fileName?: string;
  fileType?: "document" | "photo" | "link";
  feedbackNote?: string;
  updatedAt: string;
}

export interface ApplicationRecord {
  id: string;
  userId: number;
  studentName: string;
  studentUsername?: string;
  programId: string;
  programName: string;
  university: string;
  city: string;
  stage: AppStage;
  counselorNote?: string;
  submittedAt: string;
  updatedAt: string;
}

export type AdminRole = "admin" | null;

export interface OfertaRecord {
  version: number;
  text: string;
  publishedAt: string;
  publishedBy?: number;
  publishedByName?: string;
  status: "published" | "draft";
}

export interface UserSessionData {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  lang: Language;
  country: string;
  phone?: string;
  email?: string;
  preferredLevel?: DegreeLevel;
  preferredCity?: string;

  // Onboarding
  age?: number;
  hasPassport?: string;
  budget?: string;
  preferredField?: string;
  englishLevel?: string;
  polishLevel?: string;
  mathLevel?: string;
  hasSat?: string;
  interests?: string;
  targetIntake?: string;
  isRegistered: boolean;
  isAdmin: boolean;
  adminRole?: AdminRole;
  adminSessionExpiresAt?: number;
  sessionVersion?: number;
  acceptedOfertaVersion?: number;
  acceptedOfertaAt?: string;
  savedPrograms: string[];
  documents: Record<string, DocumentRecord>;
  waitingFor?:
    | "registration_name"
    | "registration_phone"
    | "registration_email"
    | "registration_level"
    | "waiting_oferta_acceptance"
    | "document_upload"
    | "review_text"
    | "admin_auth"
    | "admin_feedback_app"
    | "admin_feedback_doc"
    | "admin_broadcast_text"
    | "admin_search_user"
    | "admin_add_university"
    | "admin_edit_uni_web"
    | "admin_edit_uni_tui"
    | "admin_add_docdef"
    | "student_review_text"
    | "student_review_program"
    | "admin_add_review"
    | "admin_edit_review_text"
    | "admin_edit_oferta_text"
    | "admin_add_test_title"
    | "admin_add_test_subject"
    | "admin_add_test_file"
    | "admin_edit_test_title"
    | "admin_edit_test_file"
    | null;
  waitingPayload?: any;
  lastPromptMsgId?: number;
  registeredAt: string;
  lastActiveAt: string;
}
