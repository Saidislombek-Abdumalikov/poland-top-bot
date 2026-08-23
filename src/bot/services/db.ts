import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  UserSessionData,
  PromoCodeRecord,
  ApplicationRecord,
  NawaApplicationRecord,
  StudentReview,
  DocumentRecord,
  DocumentDefinition,
  University,
  Language,
  PremiumTier,
  AppStage,
  DocStatus,
} from "../types";
import { universities as defaultUniversities } from "../data/universities";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "ptu_database.json");

export const defaultDocumentDefinitions: Record<string, DocumentDefinition> = {
  passport: {
    id: "passport",
    name: {
      en: "International Passport",
      uz: "Xorijga Chiqish Pasporti (Zagran)",
    },
    desc: {
      en: "Color scan of the information page with photo, valid for at least 18 months from intended intake.",
      uz: "Suratli ma'lumot sahifasining rangli skaner nusxasi. Amal qilish muddati kamida 18 oy bo'lishi kerak.",
    },
    required: true,
  },
  diploma: {
    id: "diploma",
    name: {
      en: "High School Diploma / Bachelor Degree",
      uz: "Attestat yoki Bakalavr Diplomi",
    },
    desc: {
      en: "Original diploma certificate along with full academic transcript and grade sheet.",
      uz: "Original attestat yoki diplom hamda barcha baholar ilovasi (transkript).",
    },
    required: true,
  },
  apostille: {
    id: "apostille",
    name: {
      en: "Apostille Certificate / Legalization",
      uz: "Apostil Muhri / Legalizatsiya",
    },
    desc: {
      en: "Official Apostille stamp on the original diploma issued by the Ministry of Justice / Education in home country.",
      uz: "Adliya vazirligi yoki Ta'lim inspeksiyasi tomonidan original diplomga qo'yilgan rasmiy Apostil muhri.",
    },
    required: true,
  },
  translation: {
    id: "translation",
    name: {
      en: "Sworn Polish Translation (Tłumacz)",
      uz: "Polsha Qasamyodli Tarjimasi",
    },
    desc: {
      en: "Translation made by a Sworn Polish Translator registered with Polish Ministry of Justice or Embassy.",
      uz: "Polsha Adliya vazirligi ro'yxatidagi qasamyodli tarjimon (Tłumacz Przysięgły) yoki Elchixona tarjimasi.",
    },
    required: true,
  },
  language: {
    id: "language",
    name: {
      en: "English Language Certificate (IELTS/Duolingo)",
      uz: "Ingliz Tili Sertifikati (IELTS / CEFR)",
    },
    desc: {
      en: "Official IELTS (min 6.0), TOEFL (min 75), PTE, Duolingo, or University Internal English Exam pass slip.",
      uz: "IELTS (kamida 6.0), TOEFL (kamida 75), Duolingo (105+) yoki ichki imtihon natijasi.",
    },
    required: true,
  },
  eligibility: {
    id: "eligibility",
    name: {
      en: "Eligibility Letter (O'qish huquqi ma'lumotnomasi)",
      uz: "O'qish Huquqi Ma'lumotnomasi (Eligibility)",
    },
    desc: {
      en: "Official confirmation that your previous diploma grants right to continue higher education in the issuing country.",
      uz: "Oldingi ta'lim muassasasidan diplom keyingi bosqichda o'qish huquqini berishi haqidagi ma'lumotnoma.",
    },
    required: true,
  },
  photo: {
    id: "photo",
    name: {
      en: "Biometric ID Photos (35x45 mm)",
      uz: "Biometrik Fotosurat (3.5x4.5 sm)",
    },
    desc: {
      en: "Recent white background biometric passport-sized photo in high resolution.",
      uz: "Oq fondagi so'nggi 3.5x4.5 sm o'lchamdagi sifatli biometrik fotosurat.",
    },
    required: true,
  },
};

interface DatabaseSchema {
  users: Record<number, UserSessionData>;
  promoCodes: Record<string, PromoCodeRecord>;
  applications: Record<string, ApplicationRecord>;
  nawaApplications: Record<string, NawaApplicationRecord>;
  universities: Record<string, University>;
  documentDefinitions: Record<string, DocumentDefinition>;
  reviews: StudentReview[];
}

export class DatabaseService {
  private data: DatabaseSchema = {
    users: {},
    promoCodes: {},
    applications: {},
    nawaApplications: {},
    universities: {},
    documentDefinitions: {},
    reviews: [],
  };

  constructor() {
    this.ensureDataDir();
    this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.error("Could not create data dir", e);
      }
    }
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          promoCodes: parsed.promoCodes || {},
          applications: parsed.applications || {},
          nawaApplications: parsed.nawaApplications || {},
          universities: parsed.universities || {},
          documentDefinitions: parsed.documentDefinitions || {},
          reviews: parsed.reviews || [],
        };
      }

      // Seed default universities if empty
      if (!this.data.universities || Object.keys(this.data.universities).length === 0) {
        this.data.universities = {};
        defaultUniversities.forEach((u) => {
          this.data.universities[u.id] = u;
        });
        this.saveDatabase();
      }

      // Seed default document definitions if empty
      if (!this.data.documentDefinitions || Object.keys(this.data.documentDefinitions).length === 0) {
        this.data.documentDefinitions = { ...defaultDocumentDefinitions };
        this.saveDatabase();
      }

      // Seed default reviews if empty
      if (!this.data.reviews || this.data.reviews.length === 0) {
        this.data.reviews = [
          {
            id: 1,
            name: "Sanjarbek Rahimov",
            country: "Uzbekistan",
            university: "University of Warsaw",
            program: "Computer Science (B.Sc)",
            rating: 5,
            year: "2024",
            text: {
              en: "The PTU admissions roadmap was a lifesaver! Got all my documents apostilled and received my Polish visa in 3 weeks. Studying CS at UW now!",
              uz: "PTU jamoasining yordami bilan barcha hujjatlarimni apostil qildirib, 3 haftada viza oldim. Hozir Varshava universitetida CS bo'yicha o'qiyapman!",
            },
            status: "approved",
            submittedAt: "2024-09-15",
          },
          {
            id: 2,
            name: "Malika Aliyeva",
            country: "Uzbekistan",
            university: "Jagiellonian University",
            program: "International Relations (M.A)",
            rating: 5,
            year: "2024",
            text: {
              en: "Krakow is such a magical student city. The NAWA recognition process was super smooth with PTU guidance.",
              uz: "Krakov talabalar uchun ajoyib shahar. NAWA nostrifikatsiya jarayoni PTU ko'rsatmalari bilan juda oson kechdi.",
            },
            status: "approved",
            submittedAt: "2024-10-02",
          },
          {
            id: 3,
            name: "Azizbek Tursunov",
            country: "Uzbekistan",
            university: "Warsaw University of Technology",
            program: "Civil Engineering (B.Sc)",
            rating: 5,
            year: "2025",
            text: {
              en: "The practice exams helped me pass the technical university entrance test with an 88% score. Highly recommend!",
              uz: "Mashq imtihonlari Polsha texnika universiteti kirish testidan 88% ball olishimga yordam berdi. Barchaga tavsiya qilaman!",
            },
            status: "approved",
            submittedAt: "2025-02-10",
          },
        ];
        this.saveDatabase();
      }
    } catch (e) {
      console.error("Error reading database file:", e);
    }
  }

  public saveDatabase() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file:", e);
    }
  }

  // ================= UNIVERSITIES CRUD =================
  public getAllUniversities(cityFilter?: string): University[] {
    let list = Object.values(this.data.universities || {});
    if (cityFilter && cityFilter !== "all") {
      list = list.filter((u) => u.city.toLowerCase() === cityFilter.toLowerCase());
    }
    return list;
  }

  public getUniversity(id: string): University | undefined {
    return this.data.universities?.[id];
  }

  public saveUniversity(uni: University): University {
    if (!this.data.universities) this.data.universities = {};
    this.data.universities[uni.id] = uni;
    this.saveDatabase();
    return uni;
  }

  public deleteUniversity(id: string): boolean {
    if (!this.data.universities || !this.data.universities[id]) return false;
    delete this.data.universities[id];
    this.saveDatabase();
    return true;
  }

  // ================= DOCUMENT DEFINITIONS CRUD =================
  public getDocumentDefinitions(): Record<string, DocumentDefinition> {
    return this.data.documentDefinitions || defaultDocumentDefinitions;
  }

  public getDocumentDefinition(id: string): DocumentDefinition | undefined {
    return this.data.documentDefinitions?.[id];
  }

  public saveDocumentDefinition(doc: DocumentDefinition): DocumentDefinition {
    if (!this.data.documentDefinitions) this.data.documentDefinitions = {};
    this.data.documentDefinitions[doc.id] = doc;
    this.saveDatabase();
    return doc;
  }

  public deleteDocumentDefinition(id: string): boolean {
    if (!this.data.documentDefinitions || !this.data.documentDefinitions[id]) return false;
    delete this.data.documentDefinitions[id];
    this.saveDatabase();
    return true;
  }

  // ================= USERS CRUD =================
  public getUser(userId: number, defaults?: Partial<UserSessionData>): UserSessionData {
    if (!this.data.users[userId]) {
      const now = new Date().toISOString().split("T")[0];
      const initialDocs: Record<string, DocumentRecord> = {};
      const docDefs = this.getDocumentDefinitions();

      Object.entries(docDefs).forEach(([k, def]) => {
        initialDocs[k] = {
          id: k,
          name: def.name,
          status: "missing",
          updatedAt: now,
        };
      });

      const newUser: UserSessionData = {
        userId,
        username: defaults?.username,
        firstName: defaults?.firstName,
        lastName: defaults?.lastName,
        fullName: defaults?.firstName ? `${defaults.firstName} ${defaults.lastName || ""}`.trim() : undefined,
        lang: defaults?.lang || "en",
        country: defaults?.country || "Uzbekistan",
        phone: defaults?.phone,
        email: defaults?.email,
        preferredLevel: defaults?.preferredLevel || "Bachelor",
        preferredCity: defaults?.preferredCity || "Warsaw",
        isRegistered: false,
        isAdmin: defaults?.isAdmin || false,
        isPremium: false,
        premiumTier: "Free",
        savedPrograms: [],
        documents: initialDocs,
        registeredAt: now,
        lastActiveAt: now,
      };

      this.data.users[userId] = newUser;
      this.saveDatabase();
    } else {
      if (defaults) {
        let changed = false;
        const current = this.data.users[userId];
        if (defaults.username && current.username !== defaults.username) {
          current.username = defaults.username;
          changed = true;
        }
        if (defaults.firstName && current.firstName !== defaults.firstName) {
          current.firstName = defaults.firstName;
          changed = true;
        }
        if (defaults.lastName && current.lastName !== defaults.lastName) {
          current.lastName = defaults.lastName;
          changed = true;
        }
        if (changed) this.saveDatabase();
      }
    }

    return this.data.users[userId];
  }

  public updateUser(userId: number, updates: Partial<UserSessionData>): UserSessionData {
    const user = this.getUser(userId);
    Object.assign(user, updates);
    user.lastActiveAt = new Date().toISOString().split("T")[0];
    this.saveDatabase();
    return user;
  }

  public getAllUsers(): UserSessionData[] {
    return Object.values(this.data.users);
  }

  public searchUsers(query: string): UserSessionData[] {
    const q = query.toLowerCase();
    return Object.values(this.data.users).filter(
      (u) =>
        u.userId.toString().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
    );
  }

  // ================= PROMO CODES CRUD =================
  private generateRandomCodeString(): string {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `PTU-${part1}-${part2}`;
  }

  public getPromoCode(code: string): PromoCodeRecord | undefined {
    return this.data.promoCodes[code.toUpperCase().trim()];
  }

  public createPromoCode(promo: {
    code?: string;
    tier: PremiumTier;
    maxUses?: number;
    assignedUserId?: number;
    assignedUserName?: string;
    expiresAt?: string;
  }): PromoCodeRecord {
    const finalCode = (promo.code || this.generateRandomCodeString()).toUpperCase().trim();
    const newCode: PromoCodeRecord = {
      code: finalCode,
      tier: promo.tier,
      maxUses: promo.maxUses || 1, // Default strictly 1 person
      usedCount: 0,
      assignedUserId: promo.assignedUserId,
      assignedUserName: promo.assignedUserName,
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: promo.expiresAt,
      isExpired: false,
      isActive: true,
    };
    this.data.promoCodes[newCode.code] = newCode;
    this.saveDatabase();
    return newCode;
  }

  public generatePersonalPromo(userId: number, userName: string, tier: PremiumTier = "Full Premium"): PromoCodeRecord {
    const code = this.generateRandomCodeString();
    return this.createPromoCode({
      code,
      tier,
      maxUses: 1,
      assignedUserId: userId,
      assignedUserName: userName,
    });
  }

  public expirePromoCode(code: string): boolean {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = true;
    promo.isActive = false;
    this.saveDatabase();
    return true;
  }

  public reactivatePromoCode(code: string): boolean {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = false;
    promo.isActive = true;
    promo.usedCount = 0;
    promo.usedAt = undefined;
    promo.usedByUserId = undefined;
    promo.usedByUserName = undefined;
    this.saveDatabase();
    return true;
  }

  public deletePromoCode(code: string): boolean {
    const clean = code.toUpperCase().trim();
    if (!this.data.promoCodes[clean]) return false;
    delete this.data.promoCodes[clean];
    this.saveDatabase();
    return true;
  }

  // REDEEM: Strictly single-use per code -> becomes unavailable immediately
  public redeemPromoCode(code: string, userId: number): { success: boolean; tier?: PremiumTier; error?: string } {
    const cleanCode = code.toUpperCase().trim();
    const promo = this.getPromoCode(cleanCode);

    if (!promo) {
      return { success: false, error: "Invalid activation code. Please check spelling." };
    }
    if (promo.isExpired) {
      return { success: false, error: "This activation code has expired or been cancelled by the administrator." };
    }
    if (promo.usedCount >= promo.maxUses || !promo.isActive) {
      return {
        success: false,
        error: `This single-use code has already been redeemed and is no longer available. (Used on ${promo.usedAt || "previously"})`,
      };
    }
    if (promo.assignedUserId && promo.assignedUserId !== userId) {
      return { success: false, error: "This private code was created specifically for a different student account." };
    }

    // Check date expiry
    if (promo.expiresAt) {
      const today = new Date().toISOString().split("T")[0];
      if (today > promo.expiresAt) {
        promo.isExpired = true;
        promo.isActive = false;
        this.saveDatabase();
        return { success: false, error: "This activation code has expired." };
      }
    }

    const user = this.getUser(userId);

    // Consume code (make permanently unavailable)
    promo.usedCount += 1;
    promo.isActive = false; // Mark unavailable immediately
    promo.usedAt = new Date().toISOString().split("T")[0];
    promo.usedByUserId = userId;
    promo.usedByUserName = user.fullName || user.firstName || "Student";

    this.updateUser(userId, {
      isPremium: true,
      premiumTier: promo.tier,
      premiumCode: promo.code,
    });

    this.saveDatabase();
    return { success: true, tier: promo.tier };
  }

  public getAllPromoCodes(): PromoCodeRecord[] {
    return Object.values(this.data.promoCodes);
  }

  // ================= DOCUMENTS SUBMISSION CRUD =================
  public submitDocument(
    userId: number,
    docKey: string,
    submission: {
      link?: string;
      fileId?: string;
      fileName?: string;
      fileType: "document" | "photo" | "link";
    }
  ): DocumentRecord {
    const user = this.getUser(userId);
    if (!user.documents) user.documents = {};

    const docDefs = this.getDocumentDefinitions();
    const def = docDefs[docKey];
    const docName = def ? def.name : { en: docKey, uz: docKey };

    const doc: DocumentRecord = {
      id: docKey,
      name: docName,
      status: "reviewing",
      link: submission.link,
      fileId: submission.fileId,
      fileName: submission.fileName,
      fileType: submission.fileType,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    user.documents[docKey] = doc;
    this.saveDatabase();
    return doc;
  }

  public verifyDocument(
    userId: number,
    docKey: string,
    status: DocStatus,
    feedbackNote?: string
  ): DocumentRecord | undefined {
    const user = this.getUser(userId);
    if (!user.documents || !user.documents[docKey]) return undefined;

    user.documents[docKey].status = status;
    if (feedbackNote) {
      user.documents[docKey].feedbackNote = feedbackNote;
    }
    user.documents[docKey].updatedAt = new Date().toISOString().split("T")[0];
    this.saveDatabase();
    return user.documents[docKey];
  }

  public getPendingDocuments(): { userId: number; user: UserSessionData; doc: DocumentRecord }[] {
    const results: { userId: number; user: UserSessionData; doc: DocumentRecord }[] = [];
    Object.values(this.data.users).forEach((u) => {
      if (u.documents) {
        Object.values(u.documents).forEach((d) => {
          if (d.status === "reviewing") {
            results.push({ userId: u.userId, user: u, doc: d });
          }
        });
      }
    });
    return results;
  }

  // ================= APPLICATIONS CRUD =================
  public createApplication(
    userId: number,
    programId: string,
    programName: string,
    university: string,
    city: string
  ): ApplicationRecord {
    const user = this.getUser(userId);
    const id = `APP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().split("T")[0];

    const app: ApplicationRecord = {
      id,
      userId,
      studentName: user.fullName || user.firstName || "Student",
      studentUsername: user.username,
      programId,
      programName,
      university,
      city,
      stage: "Submitted",
      submittedAt: now,
      updatedAt: now,
    };

    this.data.applications[id] = app;
    this.saveDatabase();
    return app;
  }

  public updateApplicationStage(
    appId: string,
    stage: AppStage,
    counselorNote?: string
  ): ApplicationRecord | undefined {
    const app = this.data.applications[appId];
    if (!app) return undefined;

    app.stage = stage;
    if (counselorNote) app.counselorNote = counselorNote;
    app.updatedAt = new Date().toISOString().split("T")[0];
    this.saveDatabase();
    return app;
  }

  public getAllApplications(): ApplicationRecord[] {
    return Object.values(this.data.applications);
  }

  public getApplication(id: string): ApplicationRecord | undefined {
    return this.data.applications[id];
  }

  public getUserApplications(userId: number): ApplicationRecord[] {
    return Object.values(this.data.applications).filter((a) => a.userId === userId);
  }

  // ================= NAWA APPLICATIONS CRUD =================
  public createNawaApplication(
    userId: number,
    data: {
      passportNumber: string;
      country: string;
      diplomaLink: string;
      apostilleLink?: string;
    }
  ): NawaApplicationRecord {
    const user = this.getUser(userId);
    const id = `NAWA-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString().split("T")[0];

    const item: NawaApplicationRecord = {
      id,
      userId,
      studentName: user.fullName || user.firstName || "Student",
      studentUsername: user.username,
      country: data.country,
      passportNumber: data.passportNumber,
      diplomaLink: data.diplomaLink,
      apostilleLink: data.apostilleLink,
      translationStatus: "Needed",
      feePaid: false,
      stage: "Submitted",
      submittedAt: now,
    };

    this.data.nawaApplications[id] = item;
    this.saveDatabase();
    return item;
  }

  public updateNawaStage(
    id: string,
    stage: NawaApplicationRecord["stage"],
    note?: string
  ): NawaApplicationRecord | undefined {
    const item = this.data.nawaApplications[id];
    if (!item) return undefined;
    item.stage = stage;
    if (note) item.counselorNote = note;
    this.saveDatabase();
    return item;
  }

  public getAllNawaApplications(): NawaApplicationRecord[] {
    return Object.values(this.data.nawaApplications);
  }

  // ================= REVIEWS CRUD =================
  public getAllReviews(): StudentReview[] {
    return this.data.reviews || [];
  }

  public getApprovedReviews(): StudentReview[] {
    return (this.data.reviews || []).filter((r) => r.status === "approved");
  }

  public getPendingReviews(): StudentReview[] {
    return (this.data.reviews || []).filter((r) => r.status === "pending");
  }

  public getReview(id: number): StudentReview | undefined {
    return (this.data.reviews || []).find((r) => r.id === id);
  }

  public addReview(review: {
    userId?: number;
    name: string;
    country: string;
    university: string;
    program: string;
    rating: number;
    year?: string;
    text: { en: string; uz: string };
    status?: "pending" | "approved";
  }): StudentReview {
    if (!this.data.reviews) this.data.reviews = [];
    const id = Date.now();
    const newRev: StudentReview = {
      id,
      userId: review.userId,
      name: review.name,
      country: review.country,
      university: review.university,
      program: review.program,
      rating: review.rating,
      year: review.year || new Date().getFullYear().toString(),
      text: review.text,
      status: review.status || "pending",
      submittedAt: new Date().toISOString().split("T")[0],
    };
    this.data.reviews.unshift(newRev);
    this.saveDatabase();
    return newRev;
  }

  public updateReview(id: number, updates: Partial<StudentReview>): StudentReview | undefined {
    const rev = this.getReview(id);
    if (!rev) return undefined;
    Object.assign(rev, updates);
    this.saveDatabase();
    return rev;
  }

  public deleteReview(id: number): boolean {
    if (!this.data.reviews) return false;
    const initialLen = this.data.reviews.length;
    this.data.reviews = this.data.reviews.filter((r) => r.id !== id);
    if (this.data.reviews.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public moderateReview(id: number, approved: boolean): boolean {
    const rev = this.getReview(id);
    if (!rev) return false;
    rev.status = approved ? "approved" : "pending";
    if (!approved) {
      this.deleteReview(id);
    } else {
      this.saveDatabase();
    }
    return true;
  }

  // Bookmarking helper
  public toggleSaveProgram(userId: number, programId: string): boolean {
    const user = this.getUser(userId);
    const set = new Set(user.savedPrograms || []);
    let isSaved = false;
    if (set.has(programId)) {
      set.delete(programId);
      isSaved = false;
    } else {
      set.add(programId);
      isSaved = true;
    }
    this.updateUser(userId, { savedPrograms: Array.from(set) });
    return isSaved;
  }

  public setLanguage(userId: number, lang: Language) {
    return this.updateUser(userId, { lang });
  }

  public setWaitingFor(userId: number, waitingFor: UserSessionData["waitingFor"], payload?: any) {
    this.updateUser(userId, { waitingFor, waitingPayload: payload });
  }

  public setLastPromptMsgId(userId: number, lastPromptMsgId?: number) {
    this.updateUser(userId, { lastPromptMsgId });
  }
}

export const db = new DatabaseService();
