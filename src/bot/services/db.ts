import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";
import {
  UserSessionData,
  ApplicationRecord,
  StudentReview,
  DocumentRecord,
  DocumentDefinition,
  University,
  Language,
  AppStage,
  DocStatus,
  OfertaRecord,
  TestMaterial,
} from "../types";
import { universities as defaultUniversities } from "../data/universities";
import { aiValidator } from "./aiValidation";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = process.env.DB_FILE_PATH
  ? path.resolve(process.cwd(), process.env.DB_FILE_PATH)
  : path.join(DATA_DIR, "ptu_database.json");

export const defaultOfertaTemplate = `📄 <b>POLAND TOP UNIVERSITIES — OMMAVIY OFERTA VA FOYDALANISH SHARTLARI</b>
Oxirgi yangilanish: 2026-yil

Hurmatli talaba va foydalanuvchi!
Ushbu bot orqali ta'lim xizmatlari va maslahatlaridan foydalanish orqali Siz quyidagi shartlarni to'liq qabul qilasiz:

<b>1. XIZMATLAR KO'LAMI</b>
<blockquote>• Polsha nufuzli oliygohlari hamda ta'lim dasturlari bo'yicha to'liq ma'lumot olish.
• Hujjatlarning qabul talablariga mosligini dastlabki tekshirish va yo'naltirish.
• Universitetlarga qabul arizalarini rasmiylashtirish va monitoring qilish.</blockquote>

<b>2. MA'LUMOT VA HUJJATLAR HAQQONIYLIGI</b>
<blockquote>Foydalanuvchi taqdim etgan barcha ma'lumotlar (ism-familiya, telefon, pasport, attestat/diplom, til sertifikati) to'g'ri va haqqoniy bo'lishi shart.</blockquote>

<b>3. QABUL QARORI VA JAVOBGARLIK</b>
<blockquote>Poland TOP Universities barcha hujjatlarning sifatli va belgilangan muddatda topshirilishini ta'minlaydi. O'qishga qabul qilish yoki rad etish bo'yicha yakuniy qaror faqat Polsha oliygohi tomonidan qabul qilinadi.</blockquote>

<b>4. MAXFIYLIK VA ROZILIK</b>
<blockquote>Shaxsiy ma'lumotlar faqat o'qishga ariza topshirish va rasmiy konsultatsiya jarayonlari doirasida xavfsiz qayta ishlanadi.</blockquote>

<b>5. SHARTLARNI ELEKTRON QABUL QILISH</b>
<blockquote>«✅ Roziman» tugmasini bosish orqali Siz ushbu shartlarni to'liq tushunganingizni va elektron shaklda tasdiqlaganingizni bildirasiz.</blockquote>`;

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
      en: "Attestat / High School Diploma & Transcript",
      uz: "Attestat / Diplom va Baholar Ilovasi",
    },
    desc: {
      en: "Official high school diploma / university degree with grade transcript and apostille/legalization stamp.",
      uz: "Maktab attestati yoki kollej/litsey diplomi, baholar varaqasi va apostil muhri.",
    },
    required: true,
  },
  language_cert: {
    id: "language_cert",
    name: {
      en: "English / Polish Language Certificate",
      uz: "Ingliz / Polyak Tili Sertifikati",
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

export const defaultTestMaterials: Record<string, TestMaterial> = {
  "test-pol-b1": {
    id: "test-pol-b1",
    title: {
      en: "Polish Language — B1 State Certificate Practice Exam (PDF)",
      uz: "Polyak Tili — B1 Davlat Sertifikati Namunaviy Test To'plami (PDF)",
    },
    subject: "Polyak tili (B1)",
    description: {
      en: "Official B1 Polish language proficiency sample test pack with grammar, vocabulary, reading, and listening tasks.",
      uz: "Polsha oliygohlariga kiruvchilar uchun B1 darajadagi namunaviy testlar, grammatika va leksika mashqlari.",
    },
    fileName: "Polyak_Tili_B1_Rasmiy_Test_Toplami.pdf",
    fileType: "link",
    fileUrl: "https://certyfikatpolski.pl/o-egzaminie/przykladowe-testy-zbiory-zadan/",
    isFree: true,
    createdAt: "2026-08-23",
    addedByName: "Admissions Team",
  },
  "test-math-entrance": {
    id: "test-math-entrance",
    title: {
      en: "University Entrance Mathematics — Problem Sets & Solutions (PDF)",
      uz: "Oliygohlar Matematika Kirish Testlari va Yechimlari (PDF)",
    },
    subject: "Matematika",
    description: {
      en: "Entrance math test problem sets for Computer Science, Engineering, and Business programs in Poland.",
      uz: "IT, Muhandislik va Iqtisodiyot yo'nalishlariga kirish uchun matematika testlari va namunaviy yechimlar.",
    },
    fileName: "Warsaw_Math_Entrance_Exam_Pack_2025.pdf",
    fileType: "link",
    fileUrl: "https://www.mimuw.edu.pl/en/admissions",
    isFree: true,
    createdAt: "2026-08-23",
    addedByName: "Admissions Team",
  },
  "test-eng-b2": {
    id: "test-eng-b2",
    title: {
      en: "Academic English (B2/C1) — University Placement Exam Practice Pack",
      uz: "Akademik Ingliz Tili (B2/C1) — Universitet Kirish Sinovi Namunasi",
    },
    subject: "Ingliz tili (B2/C1)",
    description: {
      en: "Comprehensive English diagnostic test covering reading comprehension, academic writing structure, and grammar.",
      uz: "Ingliz tili kirish imtihoniga tayyorgarlik uchun namunaviy reading, writing va grammatika savollari.",
    },
    fileName: "Academic_English_Placement_Pack.pdf",
    fileType: "link",
    fileUrl: "https://www.cambridgeenglish.org/exams-and-tests/advanced/preparation/",
    isFree: true,
    createdAt: "2026-08-23",
    addedByName: "Admissions Team",
  },
};

interface DatabaseSchema {
  users: Record<number, UserSessionData>;
  applications: Record<string, ApplicationRecord>;
  universities: Record<string, University>;
  documentDefinitions: Record<string, DocumentDefinition>;
  tests: Record<string, TestMaterial>;
  oferta: OfertaRecord;
  reviews: StudentReview[];
}

export class DatabaseService {
  private data: DatabaseSchema = {
    users: {},
    applications: {},
    universities: {},
    documentDefinitions: {},
    tests: { ...defaultTestMaterials },
    oferta: {
      version: 1,
      text: defaultOfertaTemplate,
      publishedAt: "2026-08-23",
      publishedByName: "System",
      status: "published",
    },
    reviews: [],
  };

  private supabase: SupabaseClient | null = null;
  private isCloudSyncing = false;

  constructor() {
    this.ensureDataDir();
    this.loadDatabase();
    this.initSupabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // Fallback or ignore
      }
    }
  }

  private initSupabase() {
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
          auth: { persistSession: false },
        });
      } catch (e) {
        this.supabase = null;
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
          applications: parsed.applications || {},
          universities: parsed.universities || {},
          documentDefinitions: parsed.documentDefinitions || {},
          tests: parsed.tests || { ...defaultTestMaterials },
          oferta: parsed.oferta || {
            version: 1,
            text: defaultOfertaTemplate,
            publishedAt: "2026-08-23",
            publishedByName: "System",
            status: "published",
          },
          reviews: parsed.reviews || [],
        };
      }
    } catch (e) {
      // Ignore
    }

    // Seed default universities if empty
    if (!this.data.universities || Object.keys(this.data.universities).length === 0) {
      this.data.universities = {};
      defaultUniversities.forEach((u) => {
        this.data.universities[u.id] = u;
      });
    }

    // Seed default tests if empty
    if (!this.data.tests || Object.keys(this.data.tests).length === 0) {
      this.data.tests = { ...defaultTestMaterials };
    }

    // Seed default document definitions if empty
    if (!this.data.documentDefinitions || Object.keys(this.data.documentDefinitions).length === 0) {
      this.data.documentDefinitions = { ...defaultDocumentDefinitions };
    }

    // Seed default oferta
    if (!this.data.oferta || !this.data.oferta.text) {
      this.data.oferta = {
        version: 1,
        text: defaultOfertaTemplate,
        publishedAt: "2026-08-23",
        publishedByName: "System",
        status: "published",
      };
    }

    this.saveToDisk();
  }

  public saveDatabase() {
    this.saveToDisk();
    this.syncToCloud().catch(() => {});
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      // Ignore
    }
  }

  private async syncToCloud() {
    if (!this.supabase || this.isCloudSyncing) return;
    this.isCloudSyncing = true;
    try {
      // Optional Supabase sync for users
      const usersList = Object.values(this.data.users || {}).map((u) => ({
        user_id: u.userId,
        username: u.username || null,
        full_name: u.fullName || null,
        phone: u.phone || null,
        preferred_level: u.preferredLevel || null,
        registered_at: u.registeredAt || new Date().toISOString(),
      }));

      if (usersList.length > 0) {
        await this.supabase.from("bot_users").upsert(usersList, { onConflict: "user_id" });
      }
    } catch (e) {
      // Soft error
    } finally {
      this.isCloudSyncing = false;
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

  // ================= TEST MATERIALS CRUD =================
  public getAllTests(subjectFilter?: string): TestMaterial[] {
    let list = Object.values(this.data.tests || {});
    if (subjectFilter && subjectFilter !== "all") {
      list = list.filter((t) => t.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
    }
    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  public getTest(id: string): TestMaterial | undefined {
    return this.data.tests?.[id];
  }

  public saveTest(test: TestMaterial): TestMaterial {
    if (!this.data.tests) this.data.tests = {};
    this.data.tests[test.id] = test;
    this.saveDatabase();
    return test;
  }

  public deleteTest(id: string): boolean {
    if (!this.data.tests || !this.data.tests[id]) return false;
    delete this.data.tests[id];
    this.saveDatabase();
    return true;
  }

  // ================= USER SESSION & PROFILES =================
  public getUser(userId: number, initialMeta?: Partial<UserSessionData>): UserSessionData {
    if (!this.data.users[userId]) {
      const now = new Date().toISOString();
      this.data.users[userId] = {
        userId,
        username: initialMeta?.username,
        firstName: initialMeta?.firstName,
        lastName: initialMeta?.lastName,
        fullName:
          [initialMeta?.firstName, initialMeta?.lastName].filter(Boolean).join(" ") ||
          initialMeta?.username ||
          `Student_${userId}`,
        lang: initialMeta?.lang || "uz",
        country: "Uzbekistan",
        isRegistered: false,
        isAdmin: false,
        savedPrograms: [],
        documents: {},
        registeredAt: now,
        lastActiveAt: now,
      };
      this.saveDatabase();
    } else {
      let changed = false;
      const u = this.data.users[userId];
      if (initialMeta?.username && u.username !== initialMeta.username) {
        u.username = initialMeta.username;
        changed = true;
      }
      u.lastActiveAt = new Date().toISOString();
      if (changed) {
        this.saveDatabase();
      }
    }
    return this.data.users[userId];
  }

  public updateUser(userId: number, updates: Partial<UserSessionData>): UserSessionData {
    const user = this.getUser(userId);
    Object.assign(user, updates);
    user.lastActiveAt = new Date().toISOString();
    this.saveDatabase();
    return user;
  }

  public getAllUsers(): UserSessionData[] {
    return Object.values(this.data.users || {});
  }

  public getUserCount(): number {
    return Object.keys(this.data.users || {}).length;
  }

  public setWaitingFor(userId: number, state: UserSessionData["waitingFor"], payload?: any) {
    this.updateUser(userId, { waitingFor: state, waitingPayload: payload });
  }

  public setLastPromptMsgId(userId: number, msgId: number) {
    this.updateUser(userId, { lastPromptMsgId: msgId });
  }

  public setLanguage(userId: number, lang: Language): UserSessionData {
    return this.updateUser(userId, { lang });
  }

  public acceptOferta(userId: number): UserSessionData {
    const oferta = this.getPublishedOferta();
    return this.updateUser(userId, {
      isRegistered: true,
      acceptedOfertaVersion: oferta.version,
      acceptedOfertaAt: new Date().toISOString(),
      waitingFor: null,
    });
  }

  public isPhoneRegistered(phone: string, excludeUserId?: number): boolean {
    const clean = phone.replace(/[^\d+]/g, "");
    return Object.values(this.data.users || {}).some(
      (u) => u.userId !== excludeUserId && u.phone && u.phone.replace(/[^\d+]/g, "") === clean
    );
  }

  public deleteUser(userId: number): boolean {
    if (this.data.users && this.data.users[userId]) {
      delete this.data.users[userId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // ================= STUDENT REVIEWS =================
  public getAllReviews(): StudentReview[] {
    return this.data.reviews || [];
  }

  public getApprovedReviews(): StudentReview[] {
    return (this.data.reviews || []).filter((r) => r.status === "approved");
  }

  public getPendingReviews(): StudentReview[] {
    return (this.data.reviews || []).filter((r) => r.status === "pending");
  }

  public addReview(review: Omit<StudentReview, "id" | "submittedAt">): StudentReview {
    if (!this.data.reviews) this.data.reviews = [];
    const newId = this.data.reviews.length > 0 ? Math.max(...this.data.reviews.map((r) => r.id)) + 1 : 1;
    const newReview: StudentReview = {
      ...review,
      id: newId,
      submittedAt: new Date().toISOString(),
    };
    this.data.reviews.push(newReview);
    this.saveDatabase();
    return newReview;
  }

  public updateReviewStatus(id: number, status: "approved" | "pending"): StudentReview | null {
    const rev = (this.data.reviews || []).find((r) => r.id === id);
    if (!rev) return null;
    rev.status = status;
    this.saveDatabase();
    return rev;
  }

  public updateReview(id: number, updates: Partial<StudentReview>): StudentReview | null {
    const rev = (this.data.reviews || []).find((r) => r.id === id);
    if (!rev) return null;
    Object.assign(rev, updates);
    this.saveDatabase();
    return rev;
  }

  public deleteReview(id: number): boolean {
    if (!this.data.reviews) return false;
    const idx = this.data.reviews.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.reviews.splice(idx, 1);
    this.saveDatabase();
    return true;
  }

  public toggleSaveProgram(userId: number, progId: string): boolean {
    const user = this.getUser(userId);
    if (!user.savedPrograms) user.savedPrograms = [];
    const idx = user.savedPrograms.indexOf(progId);
    let saved = false;
    if (idx === -1) {
      user.savedPrograms.push(progId);
      saved = true;
    } else {
      user.savedPrograms.splice(idx, 1);
      saved = false;
    }
    this.saveDatabase();
    return saved;
  }

  // ================= APPLICATIONS =================
  public createApplication(
    userIdOrApp: number | Omit<ApplicationRecord, "id" | "submittedAt" | "updatedAt">,
    programId?: string,
    programName?: string,
    university?: string,
    city?: string
  ): ApplicationRecord {
    if (!this.data.applications) this.data.applications = {};
    const id = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let newApp: ApplicationRecord;
    if (typeof userIdOrApp === "number") {
      const user = this.getUser(userIdOrApp);
      newApp = {
        id,
        userId: userIdOrApp,
        studentName: user.fullName || user.firstName || `Student #${userIdOrApp}`,
        studentUsername: user.username,
        programId: programId || "unknown",
        programName: programName || "Unknown Program",
        university: university || "Unknown University",
        city: city || "Poland",
        stage: "Submitted",
        submittedAt: now,
        updatedAt: now,
      };
    } else {
      newApp = {
        ...userIdOrApp,
        id,
        submittedAt: now,
        updatedAt: now,
      };
    }

    this.data.applications[id] = newApp;
    this.saveDatabase();
    return newApp;
  }

  public getApplication(id: string): ApplicationRecord | undefined {
    return this.data.applications?.[id];
  }

  public getApplicationsByUser(userId: number): ApplicationRecord[] {
    return Object.values(this.data.applications || {}).filter((a) => a.userId === userId);
  }

  public getUserApplications(userId: number): ApplicationRecord[] {
    return this.getApplicationsByUser(userId);
  }

  public getAllApplications(): ApplicationRecord[] {
    return Object.values(this.data.applications || {}).sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt)
    );
  }

  public updateApplicationStage(id: string, stage: AppStage, note?: string): ApplicationRecord | null {
    const app = this.data.applications?.[id];
    if (!app) return null;
    app.stage = stage;
    if (note !== undefined) app.counselorNote = note;
    app.updatedAt = new Date().toISOString();
    this.saveDatabase();
    return app;
  }

  // ================= DOCUMENTS =================
  public getUserDocuments(userId: number): Record<string, DocumentRecord> {
    const user = this.getUser(userId);
    return user.documents || {};
  }

  public async saveUserDocument(
    userId: number,
    docKey: string,
    fileData: {
      fileId?: string;
      fileName?: string;
      fileType?: "document" | "photo" | "link";
      link?: string;
    }
  ): Promise<DocumentRecord> {
    const user = this.getUser(userId);
    const def = this.getDocumentDefinition(docKey);
    const name = def ? def.name : { en: docKey, uz: docKey };

    if (!user.documents) user.documents = {};

    const docRecord: DocumentRecord = {
      id: docKey,
      name,
      status: "reviewing",
      fileId: fileData.fileId,
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      link: fileData.link,
      updatedAt: new Date().toISOString(),
    };

    user.documents[docKey] = docRecord;
    this.saveDatabase();
    return docRecord;
  }

  public updateDocumentStatus(
    userId: number,
    docKey: string,
    status: DocStatus,
    feedbackNote?: string
  ): DocumentRecord | null {
    const user = this.getUser(userId);
    if (!user.documents || !user.documents[docKey]) return null;

    user.documents[docKey].status = status;
    if (feedbackNote !== undefined) {
      user.documents[docKey].feedbackNote = feedbackNote;
    }
    user.documents[docKey].updatedAt = new Date().toISOString();
    this.saveDatabase();
    return user.documents[docKey];
  }

  public getPendingDocuments(): { userId: number; user: UserSessionData; doc: DocumentRecord }[] {
    const result: { userId: number; user: UserSessionData; doc: DocumentRecord }[] = [];
    Object.values(this.data.users || {}).forEach((user) => {
      if (user.documents) {
        Object.values(user.documents).forEach((doc) => {
          if (doc.status === "reviewing") {
            result.push({ userId: user.userId, user, doc });
          }
        });
      }
    });
    return result;
  }

  // ================= OFERTA =================
  public getPublishedOferta(): OfertaRecord {
    if (!this.data.oferta) {
      this.data.oferta = {
        version: 1,
        text: defaultOfertaTemplate,
        publishedAt: "2026-08-23",
        publishedByName: "System",
        status: "published",
      };
    }
    return this.data.oferta;
  }

  public getRenderedOferta(): string {
    return this.getPublishedOferta().text;
  }

  public updateOferta(text: string, publisherName?: string): OfertaRecord {
    if (!text || text.trim().length === 0) {
      throw new Error("Oferta text cannot be empty.");
    }
    const current = this.getPublishedOferta();
    this.data.oferta = {
      version: current.version + 1,
      text: text.trim(),
      publishedAt: new Date().toISOString().split("T")[0],
      publishedByName: publisherName || "Admin",
      status: "published",
    };
    this.saveDatabase();
    return this.data.oferta;
  }
}

export const db = new DatabaseService();
