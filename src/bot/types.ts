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

export type PremiumTier = "Free" | "NAWA" | "NAWA_FULL" | "Full Premium" | "VIP Admissions" | "Student Grant";

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

export interface ExamQuestion {
  id: number;
  q: {
    en: string;
    uz: string;
  };
  options: string[];
  correct: string;
  explanation: {
    en: string;
    uz: string;
  };
}

export interface ExamSubject {
  id: string;
  name: {
    en: string;
    uz: string;
  };
  category: "Language" | "Entrance" | "Science" | "Culture";
  level: string;
  timeMinutes: number;
  questions: ExamQuestion[];
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

export interface NawaApplicationRecord {
  id: string;
  userId: number;
  studentName: string;
  studentUsername?: string;
  country: string;
  passportNumber: string;
  diplomaLink: string;
  apostilleLink?: string;
  translationStatus: "Needed" | "In Progress" | "Completed";
  feePaid: boolean;
  stage: "Submitted" | "Under Evaluation" | "Decision Issued" | "Requires Action";
  counselorNote?: string;
  submittedAt: string;
}

export interface PromoCodeRecord {
  code: string;
  tier: PremiumTier;
  maxUses: number;
  usedCount: number;
  createdBy?: number;
  createdByName?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  createdAt: string;
  expiresAt?: string;
  isExpired: boolean;
  usedAt?: string;
  usedByUserId?: number;
  usedByUserName?: string;
  isActive: boolean;
}

export type AdminRole = "super_admin" | "admin" | null;

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: number;
  actorName: string;
  actorRole: "super_admin" | "admin" | "system";
  action: string;
  target?: string;
  details: string;
  status: "success" | "failure";
  // Backward compatibility alias properties
  adminId?: number;
  adminName?: string;
}

export type PaymentStatus = "UNVERIFIED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
export type PaymentSource = "EXTERNAL_TRANSFER" | "PROMO_CODE" | "MANUAL_ADVISOR" | "PAYMENT_GATEWAY";

export interface TransactionRecord {
  id: string; // e.g. "TXN-A1B2C3"
  userId: number;
  userName?: string;
  product: "NAWA" | "NAWA_FULL";
  amount: number; // 15 or 50
  currency: string; // "USD"
  status: PaymentStatus;
  source: PaymentSource;
  promoCode?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: number;
  verifiedByName?: string;
  notes?: string;
}

export interface PricingConfig {
  nawaPrice: number;
  nawaCurrency: string;
  fullApplicationNawaPrice: number;
  fullApplicationNawaCurrency: string;
  applicationFee: number;
  applicationFeeCurrency: string;
  lastUpdatedAt: string;
  lastUpdatedBy?: number;
  lastUpdatedByName?: string;
}

export interface OfertaRecord {
  version: number;
  text: string;
  publishedAt: string;
  publishedBy?: number;
  publishedByName?: string;
  status: "published" | "draft";
  pricingSnapshot?: PricingConfig;
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
  isRegistered: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  adminRole?: AdminRole;
  adminSessionExpiresAt?: number;
  sessionVersion?: number;
  isPremium: boolean;
  premiumTier: PremiumTier;
  premiumCode?: string;
  premiumGrantReason?: "VERIFIED_PAYMENT" | "PROMO_CODE" | "ADMIN_GRANT";
  premiumTransactionId?: string;
  premiumVerifiedAt?: string;
  premiumVerifiedBy?: number;
  acceptedOfertaVersion?: number;
  acceptedOfertaAt?: string;
  savedPrograms: string[];
  documents: Record<string, DocumentRecord>;
  activeQuiz?: {
    examId: string;
    currentQ: number;
    answers: Record<number, string>;
    score: number;
  };
  waitingFor?:
    | "registration_name"
    | "registration_phone"
    | "registration_email"
    | "registration_level"
    | "waiting_oferta_acceptance"
    | "document_upload"
    | "premium_code"
    | "review_text"
    | "assistant_question"
    | "admin_auth"
    | "admin_feedback_app"
    | "admin_feedback_doc"
    | "admin_create_promo"
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
    | "admin_super_appoint_user"
    | "admin_super_create_txn_user"
    | "admin_edit_price_nawa"
    | "admin_edit_price_full"
    | "admin_edit_fee"
    | "admin_edit_oferta_text"
    | null;
  waitingPayload?: any;
  lastPromptMsgId?: number;
  registeredAt: string;
  lastActiveAt: string;
}
