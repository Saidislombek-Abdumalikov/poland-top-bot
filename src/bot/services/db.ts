import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";
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
  AuditLogEntry,
  TransactionRecord,
  PaymentStatus,
  PaymentSource,
  PricingConfig,
  OfertaRecord,
} from "../types";
import { universities as defaultUniversities } from "../data/universities";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "ptu_database.json");

export const defaultPricingConfig: PricingConfig = {
  nawaPrice: 15,
  nawaCurrency: "USD",
  fullApplicationNawaPrice: 50,
  fullApplicationNawaCurrency: "USD",
  applicationFee: 30,
  applicationFeeCurrency: "EUR",
  lastUpdatedAt: "2026-08-23",
  lastUpdatedByName: "System",
};

export const defaultOfertaTemplate = `📄 <b>POLAND TOP UNIVERSITIES — FOYDALANISH SHARTLARI VA OMMAVIY OFERTA</b>

Oxirgi yangilanish: {{LAST_UPDATED_DATE}}

Hurmatli foydalanuvchi!

Poland TOP Universities boti orqali xizmatlardan foydalanish, buyurtma berish, promo-koddan foydalanish yoki to‘lovni amalga oshirish orqali Siz quyidagi Foydalanish shartlari va ommaviy oferta bilan tanishganingizni, ularni tushunganingizni va qabul qilganingizni tasdiqlaysiz.

<b>1. UMUMIY QOIDALAR</b>

Poland TOP Universities Polsha universitetlariga hujjat topshirish jarayonida foydalanuvchilarga hujjatlar bilan ishlash, ariza topshirish va ushbu jarayon bilan bog‘liq tashkiliy hamda texnik yordam ko‘rsatadi.

Xizmatlar quyidagi paketlarga bo‘linadi:

• <b>NAWA</b> — \${{NAWA_PRICE}}
• <b>Full Application + NAWA</b> — \${{FULL_APPLICATION_NAWA_PRICE}}

Ayrim ariza topshirish jarayonlarida €{{APPLICATION_FEE}} miqdorida alohida ariza to‘lovi mavjud bo‘lishi mumkin. Ushbu to‘lov xizmat narxidan alohida hisoblanadi va tegishli ariza yoki tashkilotga bog‘liq bo‘ladi.

Poland TOP Universities xizmat shartlari, paketlar tarkibi va narxlariga o‘zgartirish kiritish huquqini o‘zida saqlab qoladi. Yangi shartlar e’lon qilinganidan keyingi yangi buyurtmalarga nisbatan qo‘llaniladi.

<b>2. XIZMAT PAKETLARI</b>

🔹 <b>NAWA — \${{NAWA_PRICE}}</b>
NAWA paketi NAWA bilan bog‘liq hujjatlar va xizmatlarni o‘z ichiga oladi.

🔹 <b>Full Application + NAWA — \${{FULL_APPLICATION_NAWA_PRICE}}</b>
Ushbu paket NAWA xizmatlari bilan bir qatorda foydalanuvchining hujjatlarini qabul qilish va ular bilan ishlash hamda universitetga ariza topshirish jarayonida yordam ko‘rsatishni o‘z ichiga oladi.

Paket tarkibi va xizmat ko‘rsatish tartibi foydalanuvchiga buyurtma berishdan oldin ko‘rsatiladi.

<b>3. BUYURTMA VA TO‘LOV</b>

Buyurtma foydalanuvchi tomonidan tegishli xizmat paketi tanlangan va to‘lov tasdiqlangandan so‘ng rasmiylashtiriladi.

Foydalanuvchi tomonidan taqdim etilgan barcha ma’lumotlar, jumladan:
• ism-familiya;
• aloqa ma’lumotlari;
• pasport va shaxsni tasdiqlovchi hujjatlar;
• ta’limga oid ma’lumotlar;
• sertifikatlar;
• universitetga ariza topshirish uchun zarur bo‘lgan boshqa ma’lumot va hujjatlar
to‘g‘ri va haqqoniy bo‘lishi kerak.

Foydalanuvchi taqdim etgan ma’lumotlarning to‘g‘riligi uchun shaxsan javobgar hisoblanadi.

<b>4. HUJJATLAR BILAN ISHLASH</b>

Foydalanuvchi xizmatdan foydalanish uchun zarur hujjatlarni bot orqali yoki Poland TOP Universities tomonidan ko‘rsatilgan boshqa usulda taqdim etadi.
Foydalanuvchi taqdim etayotgan hujjatlarning haqiqiyligi, to‘g‘riligi va ulardan foydalanish huquqiga ega ekanligini kafolatlaydi. Soxta yoki qalbakilashtirilgan hujjatlarni taqdim etish taqiqlanadi.

<b>5. UNIVERSITETLARGA ARIZA TOPSHIRISH</b>

Poland TOP Universities foydalanuvchiga Polsha universitetlariga hujjat topshirish jarayonida tashkiliy, texnik va hujjat bilan bog‘liq yordam ko‘rsatadi.
Biroq universitet tomonidan qabul qilish yoki rad etish haqidagi yakuniy qaror Poland TOP Universities tomonidan qabul qilinmaydi.
Shuning uchun Poland TOP Universities xizmatidan foydalanish universitetga qabul qilinishni kafolatlamaydi.

<b>6. UCHINCHI TOMONLAR</b>

Ariza topshirish jarayonida universitetlar, NAWA, davlat tashkilotlari, elektron platformalar yoki boshqa uchinchi tomon xizmatlaridan foydalanilishi mumkin.
Ushbu tashkilotlarning texnik nosozliklari yoki muddatlari Poland TOP Universities tomonidan to‘liq nazorat qilinmaydi.

<b>7. FOYDALANUVCHINING MAJBURIYATLARI</b>

Foydalanuvchi to‘g‘ri va haqqoniy ma’lumot taqdim etishi, haqiqiy hujjatlardan foydalanishi, zarur hujjatlarni o‘z vaqtida taqdim etishi va bot ko‘rsatmalariga rioya qilishi shart.

<b>8. TO‘LOV VA QAYTARISH SIYOSATI</b>

Foydalanuvchi to‘lovni amalga oshirishdan oldin tanlangan xizmat paketi, uning tarkibi va narxi bilan tanishadi.
Xizmat ko‘rsatish jarayoni boshlanganidan yoki buyurtma bo‘yicha ishlar bajarilganidan keyin to‘lovni qaytarish imkoniyati cheklanishi mumkin.

<b>9. PROMO-KODLAR</b>

Promo-kodlar muayyan xizmat paketiga biriktiriladi.
NAWA promo-kodi faqat NAWA xizmatiga tegishli bo‘ladi.
Full Application + NAWA promo-kodi esa Full Application + NAWA xizmatiga tegishli bo‘ladi.
Foydalanuvchi promo-kod paketini mustaqil ravishda o‘zgartira olmaydi.

<b>10. SHAXSIY MA’LUMOTLAR</b>

Ma’lumotlar amaldagi qonunchilik va Poland TOP Universities maxfiylik siyosatiga muvofiq qayta ishlanadi.

<b>11. JAVOBGARLIKNI CHEKLASH</b>

Poland TOP Universities o‘z nazoratidan tashqaridagi holatlar uchun javobgar bo‘lmaydi.

<b>12. XIZMAT KO‘RSATISH MUDDATI</b>

Buyurtma imkon qadar qisqa muddatda bajariladi.

<b>13. SHARTLARNI QABUL QILISH</b>

Foydalanuvchi «✅ Roziman» tugmasini bosish orqali ushbu Foydalanish shartlari va ommaviy ofertani o‘qiganini, tushunganini va elektron shaklda qabul qilganini tasdiqlaydi.

<b>14. YAKUNIY QOIDA</b>

Ushbu oferta foydalanuvchi tomonidan elektron shaklda qabul qilingan paytdan boshlab xizmat ko‘rsatish shartlarining bir qismi hisoblanadi.`;

export function renderOfertaText(
  template: string,
  pricing: PricingConfig,
  lastUpdatedDate: string = "23.08.2026"
): string {
  return template
    .replace(/\{\{NAWA_PRICE\}\}/g, String(pricing.nawaPrice))
    .replace(/\{\{FULL_APPLICATION_NAWA_PRICE\}\}/g, String(pricing.fullApplicationNawaPrice))
    .replace(/\{\{APPLICATION_FEE\}\}/g, String(pricing.applicationFee))
    .replace(/\{\{LAST_UPDATED_DATE\}\}/g, lastUpdatedDate);
}

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
  transactions: Record<string, TransactionRecord>;
  applications: Record<string, ApplicationRecord>;
  nawaApplications: Record<string, NawaApplicationRecord>;
  universities: Record<string, University>;
  documentDefinitions: Record<string, DocumentDefinition>;
  pricingConfig: PricingConfig;
  oferta: OfertaRecord;
  ofertaDraft?: OfertaRecord;
  ofertaHistory: OfertaRecord[];
  reviews: StudentReview[];
  auditLogs: AuditLogEntry[];
}

export class DatabaseService {
  private data: DatabaseSchema = {
    users: {},
    promoCodes: {},
    transactions: {},
    applications: {},
    nawaApplications: {},
    universities: {},
    documentDefinitions: {},
    pricingConfig: { ...defaultPricingConfig },
    oferta: {
      version: 1,
      text: defaultOfertaTemplate,
      publishedAt: "2026-08-23",
      publishedByName: "System",
      status: "published",
      pricingSnapshot: { ...defaultPricingConfig },
    },
    ofertaHistory: [],
    reviews: [],
    auditLogs: [],
  };

  private supabase: SupabaseClient | null = null;
  private isCloudSyncing = false;

  constructor() {
    this.ensureDataDir();
    this.loadDatabase();
    this.initSupabase();
  }

  private initSupabase() {
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.syncFromCloud().catch(() => {});
      } catch (e) {
        console.error("Supabase init error:", e);
      }
    }
  }

  public async syncFromCloud(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from("ptu_database")
        .select("data")
        .eq("id", "main")
        .single();

      if (data && data.data && !error) {
        this.data = {
          users: data.data.users || this.data.users || {},
          promoCodes: data.data.promoCodes || this.data.promoCodes || {},
          transactions: data.data.transactions || this.data.transactions || {},
          applications: data.data.applications || this.data.applications || {},
          nawaApplications: data.data.nawaApplications || this.data.nawaApplications || {},
          universities: data.data.universities || this.data.universities || {},
          documentDefinitions: data.data.documentDefinitions || this.data.documentDefinitions || {},
          pricingConfig: data.data.pricingConfig || this.data.pricingConfig || { ...defaultPricingConfig },
          oferta: data.data.oferta || this.data.oferta || {
            version: 1,
            text: defaultOfertaTemplate,
            publishedAt: "2026-08-23",
            publishedByName: "System",
            status: "published",
            pricingSnapshot: { ...defaultPricingConfig },
          },
          ofertaDraft: data.data.ofertaDraft || this.data.ofertaDraft,
          ofertaHistory: data.data.ofertaHistory || this.data.ofertaHistory || [],
          reviews: data.data.reviews || this.data.reviews || [],
          auditLogs: data.data.auditLogs || this.data.auditLogs || [],
        };
        this.saveToDisk();
      } else if (error && (error.code === "PGRST116" || error.message?.includes("0 rows"))) {
        // Table exists but no row with id='main' yet -> seed it to Supabase
        await this.syncToCloud();
      }
    } catch (e) {
      // Graceful fallback to local cache
    }
  }

  public async syncToCloud(): Promise<void> {
    if (!this.supabase || this.isCloudSyncing) return;
    this.isCloudSyncing = true;
    try {
      await this.supabase
        .from("ptu_database")
        .upsert({ id: "main", data: this.data, updated_at: new Date().toISOString() });
    } catch (e) {
      // Non-blocking
    } finally {
      this.isCloudSyncing = false;
    }
  }

  private saveToDisk() {
    try {
      if (process.env.VERCEL) return;
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      // Ignore if read-only filesystem (e.g. Vercel)
    }
  }

  private ensureDataDir() {
    if (process.env.VERCEL) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      // Ignore if read-only filesystem
    }
  }

  private loadDatabase() {
    try {
      if (!process.env.VERCEL && fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          promoCodes: parsed.promoCodes || {},
          transactions: parsed.transactions || {},
          applications: parsed.applications || {},
          nawaApplications: parsed.nawaApplications || {},
          universities: parsed.universities || {},
          documentDefinitions: parsed.documentDefinitions || {},
          pricingConfig: parsed.pricingConfig || { ...defaultPricingConfig },
          oferta: parsed.oferta || {
            version: 1,
            text: defaultOfertaTemplate,
            publishedAt: "2026-08-23",
            publishedByName: "System",
            status: "published",
            pricingSnapshot: { ...defaultPricingConfig },
          },
          ofertaDraft: parsed.ofertaDraft,
          ofertaHistory: parsed.ofertaHistory || [],
          reviews: parsed.reviews || [],
          auditLogs: parsed.auditLogs || [],
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

    // Seed default document definitions if empty
    if (!this.data.documentDefinitions || Object.keys(this.data.documentDefinitions).length === 0) {
      this.data.documentDefinitions = { ...defaultDocumentDefinitions };
    }

    // Seed default pricing config if empty
    if (!this.data.pricingConfig) {
      this.data.pricingConfig = { ...defaultPricingConfig };
    }

    // Seed default published oferta if empty
    if (!this.data.oferta) {
      this.data.oferta = {
        version: 1,
        text: defaultOfertaTemplate,
        publishedAt: "2026-08-23",
        publishedByName: "System",
        status: "published",
        pricingSnapshot: { ...defaultPricingConfig },
      };
    }

    if (!this.data.ofertaHistory) {
      this.data.ofertaHistory = [];
    }

    // Initialize empty reviews array if not present
    if (!this.data.reviews) {
      this.data.reviews = [];
    }

    this.saveToDisk();
  }

  public saveDatabase() {
    this.saveToDisk();
    this.syncToCloud().catch(() => {});
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
    const isAdmin = Boolean(defaults?.isAdmin) || (config.adminIds && config.adminIds.includes(userId));
    const isSuper = Boolean(defaults?.isSuperAdmin);

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
        isAdmin: isAdmin,
        isSuperAdmin: isSuper,
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
      let changed = false;
      const current = this.data.users[userId];

      if (defaults) {
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
      }

      if (changed) this.saveDatabase();
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

  /**
   * Retrieves administrators list.
   * If includeSuperAdmin is false (default), Super Admins are completely filtered out
   * to preserve absolute invisibility to normal admins.
   */
  public getAllAdmins(includeSuperAdmin: boolean = false): UserSessionData[] {
    const all = Object.values(this.data.users);
    if (includeSuperAdmin) {
      return all.filter((u) => u.isAdmin || u.isSuperAdmin || u.adminRole === "admin" || u.adminRole === "super_admin");
    }
    // Normal admin view: Super Admins are 100% excluded
    return all.filter(
      (u) => (u.isAdmin || u.adminRole === "admin") && !u.isSuperAdmin && u.adminRole !== "super_admin"
    );
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

  public deleteUser(userId: number, actorId?: number): boolean {
    if (!this.data.users[userId]) return false;
    const targetUser = this.data.users[userId];
    const targetName = targetUser.fullName || targetUser.username || `User #${userId}`;

    // Delete user profile
    delete this.data.users[userId];

    // Delete user applications
    for (const [appId, app] of Object.entries(this.data.applications)) {
      if (app.userId === userId) {
        delete this.data.applications[appId];
      }
    }

    // Delete user NAWA applications
    for (const [nawaId, nawa] of Object.entries(this.data.nawaApplications)) {
      if (nawa.userId === userId) {
        delete this.data.nawaApplications[nawaId];
      }
    }

    // Delete user transactions
    for (const [txnId, txn] of Object.entries(this.data.transactions)) {
      if (txn.userId === userId) {
        delete this.data.transactions[txnId];
      }
    }

    if (actorId) {
      this.logAdminAction(
        actorId,
        "Super Admin",
        "USER_DELETED",
        `Super Admin completely deleted user ${targetName} (${userId}) and associated records.`,
        String(userId),
        "super_admin"
      );
    }

    this.saveDatabase();
    return true;
  }

  public deleteAdmin(adminUserId: number, actorId: number): { success: boolean; error?: string } {
    if (adminUserId === config.superAdminTelegramId) {
      return { success: false, error: "Root Super Admin cannot be deleted." };
    }
    const adminUser = this.data.users[adminUserId];
    if (!adminUser) {
      return { success: false, error: "Admin record not found." };
    }

    // Completely delete the user record from database
    this.deleteUser(adminUserId, actorId);

    this.logAdminAction(
      actorId,
      "Super Admin",
      "ADMIN_DELETED",
      `Super Admin permanently deleted administrator #${adminUserId} from system.`,
      String(adminUserId),
      "super_admin"
    );

    this.saveDatabase();
    return { success: true };
  }

  public resetDatabaseToZero(superAdminId: number): boolean {
    // Wipe all sample, test, and operational records
    this.data.users = {};
    this.data.applications = {};
    this.data.nawaApplications = {};
    this.data.promoCodes = {};
    this.data.transactions = {};
    this.data.reviews = [];
    this.data.auditLogs = [];

    // Re-seed essential catalog definitions
    this.data.universities = {};
    defaultUniversities.forEach((u) => {
      this.data.universities[u.id] = u;
    });
    this.data.documentDefinitions = { ...defaultDocumentDefinitions };
    this.data.pricingConfig = { ...defaultPricingConfig };
    this.data.oferta = {
      version: 1,
      text: defaultOfertaTemplate,
      publishedAt: "2026-08-23",
      publishedByName: "System",
      status: "published",
      pricingSnapshot: { ...defaultPricingConfig },
    };
    this.data.ofertaDraft = undefined;
    this.data.ofertaHistory = [];

    this.saveDatabase();
    return true;
  }

  // ================= AUDIT LOGS =================
  public logAdminAction(
    actorId: number,
    actorName: string,
    action: string,
    details: string,
    target?: string,
    actorRole?: "super_admin" | "admin" | "system",
    status: "success" | "failure" = "success"
  ): AuditLogEntry {
    if (!this.data.auditLogs) this.data.auditLogs = [];

    // Sanitize any sensitive credentials from details & target
    const knownSecrets = [
      process.env.SUPER_ADMIN_PASSCODE,
      process.env.ADMIN_PASSCODE,
      "super*admin",
      "PTUADMIN2025",
      "superadminsaidislom*",
    ].filter(Boolean) as string[];

    let cleanDetails = details || "";
    let cleanTarget = target || "";

    for (const s of knownSecrets) {
      if (s.length >= 4) {
        cleanDetails = cleanDetails.split(s).join("[PROTECTED_CREDENTIAL]");
        cleanTarget = cleanTarget.split(s).join("[PROTECTED_CREDENTIAL]");
      }
    }

    const user = this.data.users[actorId];
    let finalActorId = actorId;
    let finalActorName = actorName || `User #${actorId}`;
    let finalRole: "super_admin" | "admin" | "system" =
      actorRole || (user?.isSuperAdmin || user?.adminRole === "super_admin" ? "super_admin" : "admin");
    let finalDetails = cleanDetails;

    // If action performed in Ghost Mode, attribute to true Super Admin with Ghost tag
    if (user?.ghostSession) {
      finalActorId = user.ghostSession.actualSuperAdminId;
      finalActorName = `Super Admin (Ghost as ${user.ghostSession.actingAsAdminName})`;
      finalRole = "super_admin";
      finalDetails = `[GHOST MODE acting as Admin #${user.ghostSession.actingAsAdminId}] ${cleanDetails}`;
    }

    const entry: AuditLogEntry = {
      id: crypto.randomBytes(3).toString("hex").toUpperCase(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actorId: finalActorId,
      actorName: finalActorName,
      actorRole: finalRole,
      action,
      target: cleanTarget || undefined,
      details: finalDetails,
      status,
      // Backward compatibility aliases
      adminId: finalActorId,
      adminName: finalActorName,
    };

    this.data.auditLogs.unshift(entry);
    // Keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.saveDatabase();
    return entry;
  }

  public getAuditLogs(limit: number = 50): AuditLogEntry[] {
    return (this.data.auditLogs || []).slice(0, limit);
  }

  public clearAuditLogs(): void {
    this.data.auditLogs = [];
    this.saveDatabase();
  }

  // ================= PROMO CODES CRUD =================
  public generateRandomCodeString(): string {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Unambiguous Base32 charset
    let result = "";
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  public getPromoCode(code: string): PromoCodeRecord | undefined {
    if (!code) return undefined;
    return this.data.promoCodes[code.toUpperCase().trim()];
  }

  public createPromoCode(promo: {
    code?: string;
    tier: PremiumTier;
    maxUses?: number;
    createdBy?: number;
    createdByName?: string;
    assignedUserId?: number;
    assignedUserName?: string;
    expiresAt?: string;
  }): PromoCodeRecord {
    const finalCode = (promo.code || this.generateRandomCodeString()).toUpperCase().trim();
    const newCode: PromoCodeRecord = {
      code: finalCode,
      tier: promo.tier,
      maxUses: promo.maxUses || 1, // Strictly 1 single student
      usedCount: 0,
      createdBy: promo.createdBy,
      createdByName: promo.createdByName,
      assignedUserId: promo.assignedUserId,
      assignedUserName: promo.assignedUserName,
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: promo.expiresAt,
      isExpired: false,
      isActive: true,
    };
    this.data.promoCodes[newCode.code] = newCode;

    if (promo.createdBy) {
      this.logAdminAction(
        promo.createdBy,
        promo.createdByName || `Admin #${promo.createdBy}`,
        "PROMO_CODE_CREATED",
        `Created promo code '${newCode.code}' for package [${newCode.tier}] (Single-use)`,
        newCode.code
      );
    }

    this.saveDatabase();
    return newCode;
  }

  public generatePersonalPromo(
    userId: number,
    userName: string,
    tier: PremiumTier = "NAWA_FULL",
    createdBy?: number
  ): PromoCodeRecord {
    const code = this.generateRandomCodeString();
    return this.createPromoCode({
      code,
      tier,
      maxUses: 1,
      createdBy,
      assignedUserId: userId,
      assignedUserName: userName,
    });
  }

  public expirePromoCode(code: string, actorId?: number): boolean {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = true;
    promo.isActive = false;

    if (actorId) {
      this.logAdminAction(
        actorId,
        "Administrator",
        "PROMO_CODE_DISABLED",
        `Disabled promo code '${promo.code}' (${promo.tier})`,
        promo.code
      );
    }

    this.saveDatabase();
    return true;
  }

  public reactivatePromoCode(code: string, actorId?: number): boolean {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = false;
    promo.isActive = true;
    promo.usedCount = 0;
    promo.usedAt = undefined;
    promo.usedByUserId = undefined;
    promo.usedByUserName = undefined;

    if (actorId) {
      this.logAdminAction(
        actorId,
        "Administrator",
        "PROMO_CODE_REACTIVATED",
        `Reactivated promo code '${promo.code}' (${promo.tier})`,
        promo.code
      );
    }

    this.saveDatabase();
    return true;
  }

  public deletePromoCode(code: string, actorId?: number): boolean {
    const clean = code.toUpperCase().trim();
    if (!this.data.promoCodes[clean]) return false;
    const tier = this.data.promoCodes[clean].tier;
    delete this.data.promoCodes[clean];

    if (actorId) {
      this.logAdminAction(
        actorId,
        "Administrator",
        "PROMO_CODE_DELETED",
        `Deleted promo code '${clean}' (${tier})`,
        clean
      );
    }

    this.saveDatabase();
    return true;
  }

  // REDEEM: Strictly atomic, single-use per code -> becomes unavailable immediately
  public redeemPromoCode(
    code: string,
    userId: number
  ): { success: boolean; tier?: PremiumTier; error?: string; promo?: PromoCodeRecord } {
    if (!code || typeof code !== "string") {
      return { success: false, error: "Please provide a valid promo code." };
    }
    const cleanCode = code.toUpperCase().trim();
    const promo = this.getPromoCode(cleanCode);

    if (!promo) {
      this.logAdminAction(
        userId,
        `User #${userId}`,
        "PROMO_CODE_REDEMPTION_FAILED",
        `Failed redemption attempt with unrecognized code: [PROTECTED_CREDENTIAL]`,
        undefined,
        "system",
        "failure"
      );
      return { success: false, error: "Invalid activation code. Please check spelling." };
    }
    if (promo.isExpired) {
      return { success: false, error: "This promo code is no longer available." };
    }
    if (promo.usedCount >= promo.maxUses || !promo.isActive) {
      return {
        success: false,
        error: "This promo code is no longer available.",
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
        return { success: false, error: "This promo code is no longer available." };
      }
    }

    const user = this.getUser(userId);

    // Atomically consume code (make permanently unavailable)
    promo.usedCount += 1;
    promo.isActive = false; // Mark unavailable immediately
    promo.usedAt = new Date().toISOString().split("T")[0];
    promo.usedByUserId = userId;
    promo.usedByUserName = user.fullName || user.firstName || `User #${userId}`;

    // Map tier cleanly
    const grantedTier: PremiumTier =
      promo.tier === "NAWA" || promo.tier === "NAWA_FULL" ? promo.tier : "NAWA_FULL";

    // Create and link private transaction record
    const txnId = this.generateTransactionId();
    const txnAmount = grantedTier === "NAWA" ? 15 : 50;
    const nowTimestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

    const txnRecord: TransactionRecord = {
      id: txnId,
      userId,
      userName: user.fullName || user.username || `User #${userId}`,
      product: grantedTier === "NAWA" ? "NAWA" : "NAWA_FULL",
      amount: txnAmount,
      currency: "USD",
      status: "PAID",
      source: "PROMO_CODE",
      promoCode: promo.code,
      createdAt: nowTimestamp,
      verifiedAt: nowTimestamp,
      notes: `Access unlocked via promo code [${promo.code}]`,
    };
    if (!this.data.transactions) this.data.transactions = {};
    this.data.transactions[txnId] = txnRecord;

    this.updateUser(userId, {
      isPremium: true,
      premiumTier: grantedTier,
      premiumCode: promo.code,
      premiumGrantReason: "PROMO_CODE",
      premiumTransactionId: txnId,
      premiumVerifiedAt: nowTimestamp,
    });

    this.logAdminAction(
      userId,
      user.fullName || user.username || `User #${userId}`,
      "PROMO_CODE_REDEEMED",
      `Student successfully redeemed promo code '${promo.code}' granting [${grantedTier}] package. Transaction ${txnId} recorded.`,
      promo.code,
      "system",
      "success"
    );

    this.saveDatabase();
    return { success: true, tier: grantedTier, promo };
  }

  public getAllPromoCodes(): PromoCodeRecord[] {
    return Object.values(this.data.promoCodes);
  }

  // ================= PRIVATE FINANCIAL & TRANSACTION LEDGER =================
  public generateTransactionId(): string {
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TXN-${hex}`;
  }

  public createTransaction(params: {
    userId: number;
    userName?: string;
    product: "NAWA" | "NAWA_FULL";
    amount?: number;
    currency?: string;
    status?: PaymentStatus;
    source?: PaymentSource;
    promoCode?: string;
    notes?: string;
    actorId?: number;
  }): TransactionRecord {
    const id = this.generateTransactionId();
    const pricing = this.getPricingConfig();
    const defaultAmount = params.product === "NAWA" ? pricing.nawaPrice : pricing.fullApplicationNawaPrice;
    const defaultCurrency = params.product === "NAWA" ? pricing.nawaCurrency : pricing.fullApplicationNawaCurrency;
    const user = this.getUser(params.userId);

    const record: TransactionRecord = {
      id,
      userId: params.userId,
      userName: params.userName || user.fullName || user.username || `User #${params.userId}`,
      product: params.product,
      amount: params.amount !== undefined ? params.amount : defaultAmount,
      currency: params.currency || defaultCurrency,
      status: params.status || "UNVERIFIED",
      source: params.source || "EXTERNAL_TRANSFER",
      promoCode: params.promoCode,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      notes: params.notes,
    };

    if (!this.data.transactions) this.data.transactions = {};
    this.data.transactions[id] = record;

    if (record.status === "PAID") {
      this.updateUser(params.userId, {
        isPremium: true,
        premiumTier: record.product,
        premiumGrantReason: "VERIFIED_PAYMENT",
        premiumTransactionId: id,
        premiumVerifiedAt: record.createdAt,
        premiumVerifiedBy: params.actorId,
      });
    }

    if (params.actorId) {
      this.logAdminAction(
        params.actorId,
        "Super Admin",
        "TRANSACTION_CREATED",
        `Created private transaction record ${id} (${record.product}, $${record.amount}, status: ${record.status}) for User #${record.userId}`,
        id,
        "super_admin"
      );
    }

    this.saveDatabase();
    return record;
  }

  public getTransaction(id: string): TransactionRecord | undefined {
    if (!id || !this.data.transactions) return undefined;
    return this.data.transactions[id.toUpperCase().trim()];
  }

  public getAllTransactions(): TransactionRecord[] {
    if (!this.data.transactions) return [];
    return Object.values(this.data.transactions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getFinancialSummary() {
    const txns = this.getAllTransactions();
    let totalVerifiedRevenue = 0;
    let verifiedPaymentsCount = 0;
    let nawaCount = 0;
    let nawaRevenue = 0;
    let nawaFullCount = 0;
    let nawaFullRevenue = 0;
    let unverifiedCount = 0;
    let refundedCount = 0;
    let cancelledCount = 0;

    for (const t of txns) {
      if (t.status === "PAID") {
        totalVerifiedRevenue += t.amount || 0;
        verifiedPaymentsCount += 1;
        if (t.product === "NAWA") {
          nawaCount += 1;
          nawaRevenue += t.amount || 15;
        } else if (t.product === "NAWA_FULL") {
          nawaFullCount += 1;
          nawaFullRevenue += t.amount || 50;
        }
      } else if (t.status === "UNVERIFIED") {
        unverifiedCount += 1;
      } else if (t.status === "REFUNDED") {
        refundedCount += 1;
      } else if (t.status === "CANCELLED" || t.status === "FAILED") {
        cancelledCount += 1;
      }
    }

    return {
      totalVerifiedRevenue,
      verifiedPaymentsCount,
      nawaCount,
      nawaRevenue,
      nawaFullCount,
      nawaFullRevenue,
      unverifiedCount,
      refundedCount,
      cancelledCount,
      totalTxnCount: txns.length,
    };
  }

  public verifyPaymentTransaction(
    transactionId: string,
    superAdminId: number,
    notes?: string
  ): { success: boolean; error?: string; transaction?: TransactionRecord } {
    const txn = this.getTransaction(transactionId);
    if (!txn) {
      return { success: false, error: "Transaction not found." };
    }
    if (txn.status === "PAID") {
      return { success: false, error: "Transaction is already marked as verified and paid." };
    }

    const superUser = this.getUser(superAdminId);
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    txn.status = "PAID";
    txn.verifiedAt = now;
    txn.verifiedBy = superAdminId;
    txn.verifiedByName = superUser.fullName || superUser.username || `Super Admin #${superAdminId}`;
    if (notes) txn.notes = notes;

    // Activate user entitlement
    this.updateUser(txn.userId, {
      isPremium: true,
      premiumTier: txn.product,
      premiumGrantReason: "VERIFIED_PAYMENT",
      premiumTransactionId: txn.id,
      premiumVerifiedAt: now,
      premiumVerifiedBy: superAdminId,
    });

    this.logAdminAction(
      superAdminId,
      superUser.fullName || "Super Admin",
      "PAYMENT_VERIFIED",
      `Super Admin manually verified payment for Transaction ${txn.id} ($${txn.amount} ${txn.product}). Premium activated for User #${txn.userId}.`,
      txn.id,
      "super_admin"
    );

    this.saveDatabase();
    return { success: true, transaction: txn };
  }

  public refundPaymentTransaction(
    transactionId: string,
    superAdminId: number,
    reason?: string
  ): boolean {
    const txn = this.getTransaction(transactionId);
    if (!txn || txn.status !== "PAID") return false;

    txn.status = "REFUNDED";
    if (reason) txn.notes = `Refunded: ${reason}`;

    // Revoke premium if it was tied to this transaction
    const user = this.getUser(txn.userId);
    if (user.premiumTransactionId === txn.id) {
      this.updateUser(txn.userId, {
        isPremium: false,
        premiumTier: "Free",
      });
    }

    const superUser = this.getUser(superAdminId);
    this.logAdminAction(
      superAdminId,
      superUser.fullName || "Super Admin",
      "PAYMENT_REFUNDED",
      `Super Admin refunded Transaction ${txn.id} ($${txn.amount}). Premium revoked for User #${txn.userId}.`,
      txn.id,
      "super_admin"
    );

    this.saveDatabase();
    return true;
  }

  public cancelTransaction(transactionId: string, superAdminId: number): boolean {
    const txn = this.getTransaction(transactionId);
    if (!txn) return false;
    txn.status = "CANCELLED";

    const superUser = this.getUser(superAdminId);
    this.logAdminAction(
      superAdminId,
      superUser.fullName || "Super Admin",
      "TRANSACTION_CANCELLED",
      `Super Admin cancelled Transaction ${txn.id}.`,
      txn.id,
      "super_admin"
    );

    this.saveDatabase();
    return true;
  }

  // ================= DYNAMIC PRICING & OFERTA MANAGEMENT =================
  public getPricingConfig(): PricingConfig {
    if (!this.data.pricingConfig) {
      this.data.pricingConfig = { ...defaultPricingConfig };
    }
    return this.data.pricingConfig;
  }

  public updatePricingConfig(
    updates: Partial<PricingConfig>,
    actorId?: number,
    actorName?: string
  ): PricingConfig {
    const current = this.getPricingConfig();
    const prevNawa = current.nawaPrice;
    const prevFull = current.fullApplicationNawaPrice;
    const prevFee = current.applicationFee;

    if (updates.nawaPrice !== undefined && (!Number.isFinite(updates.nawaPrice) || updates.nawaPrice <= 0)) {
      throw new Error("Invalid NAWA price: must be a positive number.");
    }
    if (updates.fullApplicationNawaPrice !== undefined && (!Number.isFinite(updates.fullApplicationNawaPrice) || updates.fullApplicationNawaPrice <= 0)) {
      throw new Error("Invalid Full Application + NAWA price: must be a positive number.");
    }
    if (updates.applicationFee !== undefined && (!Number.isFinite(updates.applicationFee) || updates.applicationFee < 0)) {
      throw new Error("Invalid Application Fee: must be non-negative.");
    }

    Object.assign(current, updates);
    current.lastUpdatedAt = new Date().toISOString().split("T")[0];
    current.lastUpdatedBy = actorId;
    current.lastUpdatedByName = actorName || (actorId ? `Admin #${actorId}` : "System");

    if (actorId) {
      if (updates.nawaPrice !== undefined && updates.nawaPrice !== prevNawa) {
        this.logAdminAction(
          actorId,
          actorName || `Admin #${actorId}`,
          "PRICE_UPDATED",
          `NAWA price updated from $${prevNawa} to $${updates.nawaPrice} ${current.nawaCurrency}.`,
          "pricing:NAWA"
        );
      }
      if (updates.fullApplicationNawaPrice !== undefined && updates.fullApplicationNawaPrice !== prevFull) {
        this.logAdminAction(
          actorId,
          actorName || `Admin #${actorId}`,
          "PRICE_UPDATED",
          `Full Application + NAWA price updated from $${prevFull} to $${updates.fullApplicationNawaPrice} ${current.fullApplicationNawaCurrency}.`,
          "pricing:NAWA_FULL"
        );
      }
      if (updates.applicationFee !== undefined && updates.applicationFee !== prevFee) {
        this.logAdminAction(
          actorId,
          actorName || `Admin #${actorId}`,
          "APPLICATION_FEE_UPDATED",
          `Application Fee updated from €${prevFee} to €${updates.applicationFee} ${current.applicationFeeCurrency}.`,
          "pricing:fee"
        );
      }
    }

    this.saveDatabase();
    return current;
  }

  public getPublishedOferta(): OfertaRecord {
    if (!this.data.oferta) {
      this.data.oferta = {
        version: 1,
        text: defaultOfertaTemplate,
        publishedAt: "2026-08-23",
        publishedByName: "System",
        status: "published",
        pricingSnapshot: { ...this.getPricingConfig() },
      };
    }
    return this.data.oferta;
  }

  public getRenderedOferta(customText?: string): string {
    const text = customText || this.getPublishedOferta().text;
    const pricing = this.getPricingConfig();
    const publishedAt = this.data.oferta?.publishedAt || new Date().toISOString().split("T")[0];
    return renderOfertaText(text, pricing, publishedAt);
  }

  public getDraftOferta(): OfertaRecord {
    if (!this.data.ofertaDraft) {
      const published = this.getPublishedOferta();
      this.data.ofertaDraft = {
        version: published.version + 1,
        text: published.text,
        publishedAt: new Date().toISOString().split("T")[0],
        status: "draft",
      };
    }
    return this.data.ofertaDraft;
  }

  public updateDraftOferta(
    text: string,
    actorId?: number,
    actorName?: string
  ): OfertaRecord {
    if (!text || text.trim().length === 0) {
      throw new Error("Oferta text cannot be empty.");
    }
    const published = this.getPublishedOferta();
    this.data.ofertaDraft = {
      version: published.version + 1,
      text: text.trim(),
      publishedAt: new Date().toISOString().split("T")[0],
      publishedBy: actorId,
      publishedByName: actorName || (actorId ? `Admin #${actorId}` : "Admin"),
      status: "draft",
    };

    if (actorId) {
      this.logAdminAction(
        actorId,
        actorName || `Admin #${actorId}`,
        "OFFERA_UPDATED",
        `Draft Oferta updated (Version ${this.data.ofertaDraft.version} prepared).`,
        `oferta:v${this.data.ofertaDraft.version}`
      );
    }

    this.saveDatabase();
    return this.data.ofertaDraft;
  }

  public publishOferta(actorId?: number, actorName?: string): OfertaRecord {
    const draft = this.data.ofertaDraft;
    const textToPublish = draft ? draft.text : this.getPublishedOferta().text;
    const currentPublished = this.getPublishedOferta();

    // Archive current published to history
    if (!this.data.ofertaHistory) this.data.ofertaHistory = [];
    this.data.ofertaHistory.push({ ...currentPublished });

    const newVersion = currentPublished.version + 1;
    const pricing = this.getPricingConfig();
    const publishedRecord: OfertaRecord = {
      version: newVersion,
      text: textToPublish,
      publishedAt: new Date().toISOString().split("T")[0],
      publishedBy: actorId,
      publishedByName: actorName || (actorId ? `Admin #${actorId}` : "Admin"),
      status: "published",
      pricingSnapshot: { ...pricing },
    };

    this.data.oferta = publishedRecord;
    this.data.ofertaDraft = undefined;

    if (actorId) {
      this.logAdminAction(
        actorId,
        actorName || `Admin #${actorId}`,
        "OFFERA_PUBLISHED",
        `Oferta Version ${newVersion} published with snapshot prices (NAWA: $${pricing.nawaPrice}, Full: $${pricing.fullApplicationNawaPrice}, Fee: €${pricing.applicationFee}).`,
        `oferta:v${newVersion}`
      );
    }

    this.saveDatabase();
    return publishedRecord;
  }

  public getOfertaHistory(): OfertaRecord[] {
    return this.data.ofertaHistory || [];
  }

  public acceptOferta(userId: number): void {
    const user = this.getUser(userId);
    const published = this.getPublishedOferta();
    user.acceptedOfertaVersion = published.version;
    user.acceptedOfertaAt = new Date().toISOString();
    user.isRegistered = true;
    user.waitingFor = null;
    this.saveDatabase();
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
