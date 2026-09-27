export type Language = "uz" | "en";

export type TabType = "unis" | "programs" | "docs" | "tests" | "profile";

export interface UserProfile {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  lang: Language;
  isRegistered: boolean;
  isAdmin: boolean;
  preferredLevel?: string;
  acceptedOfertaAt?: number;
}

export interface UniversityItem {
  id: string;
  name: string;
  city: string;
  ranking?: string;
  description?: {
    uz: string;
    en: string;
  };
  tuitionRange: string;
  popularFaculties?: string[];
  intake?: string;
  websiteUrl?: string;
  imageUrl?: string;
}

export interface ProgramItem {
  id: string;
  name: string;
  degree: "bachelor" | "master";
  universityId: string;
  universityName: string;
  tuitionFee: string;
  durationYears: number;
  language: string;
  faculty: string;
  description?: string;
}

export interface DocumentItem {
  id: string;
  userId: number;
  docType: string;
  status: "pending" | "reviewing" | "approved" | "needs_correction";
  fileUrl?: string;
  feedback?: string;
  updatedAt: string;
}

export interface ApplicationItem {
  id: string;
  userId: number;
  programId: string;
  programName: string;
  universityName: string;
  degree: string;
  stage: "submitted" | "documents_pending" | "reviewing" | "university_review" | "accepted" | "rejected";
  counselorNotes?: string;
  createdAt: string;
}

export interface TestItem {
  id: string;
  title: {
    uz: string;
    en: string;
  };
  subject: string;
  description: {
    uz: string;
    en: string;
  };
  downloadUrl?: string;
  durationMinutes?: number;
  format?: string;
}

export interface ReviewItem {
  id: string;
  userId: number;
  studentName: string;
  rating: number;
  universityName: string;
  programName: string;
  comment: string;
  date: string;
  isVerified?: boolean;
}

export interface AdminUserItem {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  phone: string;
  preferredLevel: string;
  isRegistered: boolean;
  acceptedOfertaAt?: number;
  registeredAt?: number;
}
