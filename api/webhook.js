// api/webhook.ts
import { webhookCallback } from "grammy";

// src/bot/index.ts
import { Bot, GrammyError, HttpError } from "grammy";

// src/bot/config.ts
import * as dotenv from "dotenv";
dotenv.config();
var config2 = {
  botToken: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "8387916648:AAG1elnfEXLhEwtOYX1r64S52vG0AECCnK0",
  advisorUsername: process.env.ADVISOR_USERNAME || "poland_admissions_bot",
  adminPasscode: process.env.ADMIN_PASSCODE || "PTUADMIN2025",
  adminIds: (process.env.ADMIN_IDS || "").split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id)),
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zvdkmbxxhwtajgxpxmue.supabase.co",
  supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZGttYnh4aHd0YWpneHB4bXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDg4NDAsImV4cCI6MjEwMzAyNDg0MH0.-TK8p3wrcMgt2MDfE3rszqvSc0GdZfXxlF0QtGiCGSc"
};
function isAdminUser(userId) {
  if (config2.adminIds.includes(userId)) return true;
  return false;
}
function validateConfig() {
  if (!config2.botToken) {
    console.warn("\n\u26A0\uFE0F  WARNING: BOT_TOKEN is not set in environment or .env file!");
    console.warn("Please provide your Telegram Bot Token from @BotFather in .env.\n");
  }
}

// src/bot/services/db.ts
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// src/bot/data/universities.ts
var universities = [
  {
    id: "uw",
    name: "University of Warsaw",
    abbr: "UW",
    city: "Warsaw",
    type: "Public",
    founded: 1816,
    website: "https://en.uw.edu.pl",
    programsCount: 214,
    students: 42e3,
    internationalStudents: 3800,
    ranking: "Top 1 in Poland (#1 Perspektywy)",
    logo: "UW",
    description: {
      en: "The University of Warsaw is the largest and most prestigious research university in Poland. It offers a wide array of English-medium undergraduate and graduate programs.",
      uz: "Varshava universiteti Polshaning eng yirik va nufuzli ilmiy tadqiqot universitetidir. Ingliz tilidagi ko'plab bakalavr va magistratura dasturlarini taklif etadi."
    },
    faculties: [
      "Faculty of Mathematics, Informatics and Mechanics",
      "Faculty of Economic Sciences",
      "Faculty of Law and Administration",
      "Faculty of Physics",
      "Faculty of Political Science and International Studies",
      "Faculty of Management"
    ],
    tuition: {
      eu: "Free (for Polish-taught programs)",
      nonEu: "2,000 \u2013 5,000 EUR / year",
      english: "3,000 \u2013 5,200 EUR / year (8,500 \u2013 22,000 PLN)"
    },
    requirements: [
      "High School Diploma (Matura equivalent) with Apostille",
      "English proficiency B2 (IELTS 6.0+ / TOEFL iBT 87+)",
      "Certified translation of documents into Polish",
      "Passport scan & ID photos"
    ],
    deadline: "May 31, 2025 (October 2025 intake)"
  },
  {
    id: "uj",
    name: "Jagiellonian University",
    abbr: "JU",
    city: "Krak\xF3w",
    type: "Public",
    founded: 1364,
    website: "https://en.uj.edu.pl",
    programsCount: 196,
    students: 38e3,
    internationalStudents: 4200,
    ranking: "Top 2 in Poland (#2 Perspektywy)",
    logo: "JU",
    description: {
      en: "One of Europe's oldest universities, founded in 1364 by King Casimir the Great. Renowned for Medicine, Law, Philosophy, and International Studies.",
      uz: "Yevropaning eng qadimiy universitetlaridan biri, 1364-yilda tashkil etilgan. Tibbiyot, Huquq, Falsafa va Xalqaro munosabatlar yo'nalishlarida mashhur."
    },
    faculties: [
      "Faculty of Medicine (Collegium Medicum)",
      "Faculty of Law and Administration",
      "Faculty of International and Political Studies",
      "Faculty of Physics, Astronomy and Applied CS",
      "Faculty of Biochemistry, Biophysics and Biotechnology"
    ],
    tuition: {
      eu: "Free (for Polish-taught programs)",
      nonEu: "2,200 \u2013 4,500 EUR / year",
      english: "4,000 \u2013 14,000 EUR / year (Medicine: ~15,000 EUR)"
    },
    requirements: [
      "Secondary school diploma with Apostille",
      "English B2/C1 certificate",
      "Medical checkup certificate (for Medicine)",
      "Entrance examination / interview (for select programs)"
    ],
    deadline: "June 15, 2025"
  },
  {
    id: "pw",
    name: "Warsaw University of Technology",
    abbr: "WUT",
    city: "Warsaw",
    type: "Public",
    founded: 1826,
    website: "https://www.pw.edu.pl/engpw",
    programsCount: 87,
    students: 32e3,
    internationalStudents: 2500,
    ranking: "Top 1 Technical University in Poland",
    logo: "PW",
    description: {
      en: "The leading technical university in Central Europe, producing top software engineers, architects, data scientists, and robotics specialists.",
      uz: "Markaziy Yevropadagi yetakchi texnika universiteti bo'lib, eng yaxshi dasturchilar, arxitektorlar va muhandislarni tayyorlaydi."
    },
    faculties: [
      "Faculty of Electronics and Information Technology",
      "Faculty of Mathematics and Information Science",
      "Faculty of Civil Engineering",
      "Faculty of Architecture",
      "Faculty of Power and Aeronautical Engineering"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "3,000 \u2013 4,500 EUR / year",
      english: "3,000 \u2013 4,500 EUR / year (approx. 9,000 \u2013 19,000 PLN)"
    },
    requirements: [
      "High school diploma with Mathematics & Physics grades",
      "English B2 certificate (IELTS 6.0+)",
      "Entrance math exam (online)",
      "Apostille & certified Polish translation"
    ],
    deadline: "June 30, 2025"
  },
  {
    id: "agh",
    name: "AGH University of Krakow",
    abbr: "AGH",
    city: "Krak\xF3w",
    type: "Public",
    founded: 1919,
    website: "https://www.agh.edu.pl/en",
    programsCount: 72,
    students: 27e3,
    internationalStudents: 2100,
    ranking: "Top 2 Technical University in Poland",
    logo: "AGH",
    description: {
      en: "A modern technical university with world-class laboratories, computer science centers, and strong industry partnerships with global tech giants.",
      uz: "Zamonaviy laboratoriyalar, IT markazlari va jahon texnologiya gigantlari bilan mustahkam hamkorlikka ega nufuzli texnika universiteti."
    },
    faculties: [
      "Faculty of Computer Science, Electronics and Telecom",
      "Faculty of Electrical Engineering and Robotics",
      "Faculty of Mechanical Engineering",
      "Faculty of Energy and Fuels"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "2,000 \u2013 3,500 EUR / year",
      english: "2,500 \u2013 3,800 EUR / year (approx. 7,000 \u2013 16,000 PLN)"
    },
    requirements: [
      "High school diploma + Apostille",
      "IELTS 6.0 / TOEFL 80 or equivalent",
      "Strong background in STEM subjects"
    ],
    deadline: "June 10, 2025"
  },
  {
    id: "pwr",
    name: "Wroc\u0142aw University of Science and Technology",
    abbr: "PWr",
    city: "Wroc\u0142aw",
    type: "Public",
    founded: 1945,
    website: "https://pwr.edu.pl/en",
    programsCount: 63,
    students: 25e3,
    internationalStudents: 1800,
    ranking: "Top 3 Technical University in Poland",
    logo: "PWr",
    description: {
      en: "Located in Poland's Silicon Valley (Wroc\u0142aw), PWr offers exceptional technical education, high graduate employment, and modern campus facilities.",
      uz: "Polshaning IT markazi (Vrotslav) shahrida joylashgan bo'lib, yuqori ish bilan ta'minlanish darajasi va zamonaviy kampusga ega."
    },
    faculties: [
      "Faculty of Information and Communication Technology",
      "Faculty of Mechanical and Power Engineering",
      "Faculty of Chemistry",
      "Faculty of Environmental Engineering"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "2,500 \u2013 3,500 EUR / year",
      english: "3,000 \u2013 4,000 EUR / year"
    },
    requirements: [
      "Secondary education certificate + Apostille",
      "English B2 level certificate",
      "Math and Physics proficiency"
    ],
    deadline: "May 30, 2025"
  },
  {
    id: "amu",
    name: "Adam Mickiewicz University",
    abbr: "AMU",
    city: "Pozna\u0144",
    type: "Public",
    founded: 1919,
    website: "https://amu.edu.pl/en",
    programsCount: 158,
    students: 35e3,
    internationalStudents: 2200,
    ranking: "Top 3 Comprehensive University",
    logo: "AMU",
    description: {
      en: "One of the largest Polish universities, offering outstanding programs in Humanities, Social Sciences, Natural Sciences, and Linguistics in Pozna\u0144.",
      uz: "Poznan shahrida joylashgan bo'lib, Gumanitar, Ijtimoiy, Tabiiy fanlar va Tilshunoslik bo'yicha yetakchi hisoblanadi."
    },
    faculties: [
      "Faculty of Psychology and Cognitive Science",
      "Faculty of English & Modern Languages",
      "Faculty of Law and Administration",
      "Faculty of Biology"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "1,800 \u2013 3,200 EUR / year",
      english: "2,200 \u2013 4,000 EUR / year"
    },
    requirements: [
      "High school diploma + Apostille",
      "English B2 or Polish B2 (depending on track)"
    ],
    deadline: "May 20, 2025"
  },
  {
    id: "kozminski",
    name: "Kozminski University",
    abbr: "KU",
    city: "Warsaw",
    type: "Private",
    founded: 1993,
    website: "https://www.kozminski.edu.pl/en",
    programsCount: 28,
    students: 9e3,
    internationalStudents: 2800,
    ranking: "#1 Private Business University in Central Europe (FT Ranked)",
    logo: "KU",
    description: {
      en: "Triple-crown accredited (EQUIS, AMBA, AACSB) top-ranked international business school offering premier degrees in Management, Finance, and AI.",
      uz: "Xalqaro 'Triple Crown' (EQUIS, AMBA, AACSB) akkreditatsiyasiga ega, Yevropadagi yetakchi xususiy biznes va moliya universiteti."
    },
    faculties: [
      "Kozminski Business School",
      "Kozminski Law School",
      "Department of Finance and Banking",
      "Center for AI and Digital Transformation"
    ],
    tuition: {
      eu: "4,500 \u2013 8,000 EUR / year",
      nonEu: "4,500 \u2013 9,000 EUR / year (18,000 \u2013 36,000 PLN)",
      english: "4,500 \u2013 9,000 EUR / year"
    },
    requirements: [
      "High school certificate",
      "English B2/C1 (IELTS 6.5+ / TOEFL)",
      "Online interview & motivation essay"
    ],
    deadline: "Rolling admissions (early intake encouraged)"
  },
  {
    id: "swps",
    name: "SWPS University of Social Sciences and Humanities",
    abbr: "SWPS",
    city: "Warsaw",
    type: "Private",
    founded: 1996,
    website: "https://english.swps.pl",
    programsCount: 41,
    students: 17e3,
    internationalStudents: 2e3,
    ranking: "#1 Private Social Sciences & Psychology University",
    logo: "SWPS",
    description: {
      en: "Poland's top university for Psychology, Design, Law, and Social Sciences with campuses in Warsaw, Wroc\u0142aw, Pozna\u0144, Krak\xF3w, and Katowice.",
      uz: "Polshaning Psixologiya, Dizayn va Ijtimoiy fanlar bo'yicha 1-raqamli xususiy universiteti."
    },
    faculties: [
      "Faculty of Psychology in Warsaw",
      "Faculty of Arts and Social Sciences",
      "School of Form (Design)",
      "Faculty of Law"
    ],
    tuition: {
      eu: "3,500 \u2013 6,500 EUR / year",
      nonEu: "3,500 \u2013 7,000 EUR / year (14,000 \u2013 28,000 PLN)",
      english: "3,800 \u2013 7,000 EUR / year"
    },
    requirements: [
      "Secondary school certificate",
      "English B2 certificate",
      "Portfolio (for Design programs)"
    ],
    deadline: "July 15, 2025"
  },
  {
    id: "sgh",
    name: "SGH Warsaw School of Economics",
    abbr: "SGH",
    city: "Warsaw",
    type: "Public",
    founded: 1906,
    website: "https://www.sgh.waw.pl/en",
    programsCount: 35,
    students: 13e3,
    internationalStudents: 1400,
    ranking: "Top #1 Economics University in Poland",
    logo: "SGH",
    description: {
      en: "The oldest and most prestigious economics and business university in Poland, renowned for producing ministers, CEOs, and financial leaders.",
      uz: "Polshaning eng qadimiy va nufuzli iqtisodiyot universiteti bo'lib, yetakchi iqtisodchilar va moliyachilarni yetishtirib chiqaradi."
    },
    faculties: [
      "Collegium of World Economy",
      "Collegium of Economic Analysis",
      "Collegium of Management and Finance",
      "Collegium of Socio-Economics"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "2,500 \u2013 4,200 EUR / year",
      english: "3,000 \u2013 4,800 EUR / year (12,000 \u2013 20,000 PLN)"
    },
    requirements: [
      "High school diploma with Mathematics emphasis",
      "English proficiency B2+",
      "SGH online knowledge assessment"
    ],
    deadline: "June 20, 2025"
  },
  {
    id: "pg",
    name: "Gda\u0144sk University of Technology",
    abbr: "GUT",
    city: "Gda\u0144sk",
    type: "Public",
    founded: 1904,
    website: "https://pg.edu.pl/en",
    programsCount: 54,
    students: 16e3,
    internationalStudents: 1300,
    ranking: "Top Technical University on Baltic Coast",
    logo: "PG",
    description: {
      en: "A historic Baltic university offering strong engineering, architecture, electronics, and maritime technology programs.",
      uz: "Boltiq bo'yidagi qadimiy texnika universiteti; muhandislik, IT va dengiz texnologiyalari bo'yicha mashhur."
    },
    faculties: [
      "Faculty of Electronics, Telecom and Informatics",
      "Faculty of Civil and Environmental Engineering",
      "Faculty of Applied Physics and Mathematics"
    ],
    tuition: {
      eu: "Free (Polish programs)",
      nonEu: "2,000 \u2013 3,500 EUR / year",
      english: "2,800 \u2013 4,000 EUR / year"
    },
    requirements: ["High school diploma + Apostille", "English B2 certificate"],
    deadline: "July 1, 2025"
  }
];

// src/bot/services/db.ts
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "ptu_database.json");
var defaultDocumentDefinitions = {
  passport: {
    id: "passport",
    name: {
      en: "International Passport",
      uz: "Xorijga Chiqish Pasporti (Zagran)"
    },
    desc: {
      en: "Color scan of the information page with photo, valid for at least 18 months from intended intake.",
      uz: "Suratli ma'lumot sahifasining rangli skaner nusxasi. Amal qilish muddati kamida 18 oy bo'lishi kerak."
    },
    required: true
  },
  diploma: {
    id: "diploma",
    name: {
      en: "High School Diploma / Bachelor Degree",
      uz: "Attestat yoki Bakalavr Diplomi"
    },
    desc: {
      en: "Original diploma certificate along with full academic transcript and grade sheet.",
      uz: "Original attestat yoki diplom hamda barcha baholar ilovasi (transkript)."
    },
    required: true
  },
  apostille: {
    id: "apostille",
    name: {
      en: "Apostille Certificate / Legalization",
      uz: "Apostil Muhri / Legalizatsiya"
    },
    desc: {
      en: "Official Apostille stamp on the original diploma issued by the Ministry of Justice / Education in home country.",
      uz: "Adliya vazirligi yoki Ta'lim inspeksiyasi tomonidan original diplomga qo'yilgan rasmiy Apostil muhri."
    },
    required: true
  },
  translation: {
    id: "translation",
    name: {
      en: "Sworn Polish Translation (T\u0142umacz)",
      uz: "Polsha Qasamyodli Tarjimasi"
    },
    desc: {
      en: "Translation made by a Sworn Polish Translator registered with Polish Ministry of Justice or Embassy.",
      uz: "Polsha Adliya vazirligi ro'yxatidagi qasamyodli tarjimon (T\u0142umacz Przysi\u0119g\u0142y) yoki Elchixona tarjimasi."
    },
    required: true
  },
  language: {
    id: "language",
    name: {
      en: "English Language Certificate (IELTS/Duolingo)",
      uz: "Ingliz Tili Sertifikati (IELTS / CEFR)"
    },
    desc: {
      en: "Official IELTS (min 6.0), TOEFL (min 75), PTE, Duolingo, or University Internal English Exam pass slip.",
      uz: "IELTS (kamida 6.0), TOEFL (kamida 75), Duolingo (105+) yoki ichki imtihon natijasi."
    },
    required: true
  },
  eligibility: {
    id: "eligibility",
    name: {
      en: "Eligibility Letter (O'qish huquqi ma'lumotnomasi)",
      uz: "O'qish Huquqi Ma'lumotnomasi (Eligibility)"
    },
    desc: {
      en: "Official confirmation that your previous diploma grants right to continue higher education in the issuing country.",
      uz: "Oldingi ta'lim muassasasidan diplom keyingi bosqichda o'qish huquqini berishi haqidagi ma'lumotnoma."
    },
    required: true
  },
  photo: {
    id: "photo",
    name: {
      en: "Biometric ID Photos (35x45 mm)",
      uz: "Biometrik Fotosurat (3.5x4.5 sm)"
    },
    desc: {
      en: "Recent white background biometric passport-sized photo in high resolution.",
      uz: "Oq fondagi so'nggi 3.5x4.5 sm o'lchamdagi sifatli biometrik fotosurat."
    },
    required: true
  }
};
var DatabaseService = class {
  data = {
    users: {},
    promoCodes: {},
    applications: {},
    nawaApplications: {},
    universities: {},
    documentDefinitions: {},
    reviews: []
  };
  supabase = null;
  isCloudSyncing = false;
  constructor() {
    this.ensureDataDir();
    this.loadDatabase();
    this.initSupabase();
  }
  initSupabase() {
    if (config2.supabaseUrl && config2.supabaseKey) {
      try {
        this.supabase = createClient(config2.supabaseUrl, config2.supabaseKey);
        this.syncFromCloud().catch(() => {
        });
      } catch (e) {
        console.error("Supabase init error:", e);
      }
    }
  }
  async syncFromCloud() {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase.from("ptu_database").select("data").eq("id", "main").single();
      if (data && data.data && !error) {
        this.data = {
          users: data.data.users || this.data.users || {},
          promoCodes: data.data.promoCodes || this.data.promoCodes || {},
          applications: data.data.applications || this.data.applications || {},
          nawaApplications: data.data.nawaApplications || this.data.nawaApplications || {},
          universities: data.data.universities || this.data.universities || {},
          documentDefinitions: data.data.documentDefinitions || this.data.documentDefinitions || {},
          reviews: data.data.reviews || this.data.reviews || []
        };
        this.saveToDisk();
      } else if (error && (error.code === "PGRST116" || error.message?.includes("0 rows"))) {
        await this.syncToCloud();
      }
    } catch (e) {
    }
  }
  async syncToCloud() {
    if (!this.supabase || this.isCloudSyncing) return;
    this.isCloudSyncing = true;
    try {
      await this.supabase.from("ptu_database").upsert({ id: "main", data: this.data, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (e) {
    } finally {
      this.isCloudSyncing = false;
    }
  }
  saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
    }
  }
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
      }
    }
  }
  loadDatabase() {
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
          reviews: parsed.reviews || []
        };
      }
      if (!this.data.universities || Object.keys(this.data.universities).length === 0) {
        this.data.universities = {};
        universities.forEach((u) => {
          this.data.universities[u.id] = u;
        });
        this.saveDatabase();
      }
      if (!this.data.documentDefinitions || Object.keys(this.data.documentDefinitions).length === 0) {
        this.data.documentDefinitions = { ...defaultDocumentDefinitions };
        this.saveDatabase();
      }
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
              uz: "PTU jamoasining yordami bilan barcha hujjatlarimni apostil qildirib, 3 haftada viza oldim. Hozir Varshava universitetida CS bo'yicha o'qiyapman!"
            },
            status: "approved",
            submittedAt: "2024-09-15"
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
              uz: "Krakov talabalar uchun ajoyib shahar. NAWA nostrifikatsiya jarayoni PTU ko'rsatmalari bilan juda oson kechdi."
            },
            status: "approved",
            submittedAt: "2024-10-02"
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
              uz: "Mashq imtihonlari Polsha texnika universiteti kirish testidan 88% ball olishimga yordam berdi. Barchaga tavsiya qilaman!"
            },
            status: "approved",
            submittedAt: "2025-02-10"
          }
        ];
        this.saveDatabase();
      }
    } catch (e) {
      console.error("Error reading database file:", e);
    }
  }
  saveDatabase() {
    this.saveToDisk();
    this.syncToCloud().catch(() => {
    });
  }
  // ================= UNIVERSITIES CRUD =================
  getAllUniversities(cityFilter) {
    let list = Object.values(this.data.universities || {});
    if (cityFilter && cityFilter !== "all") {
      list = list.filter((u) => u.city.toLowerCase() === cityFilter.toLowerCase());
    }
    return list;
  }
  getUniversity(id) {
    return this.data.universities?.[id];
  }
  saveUniversity(uni) {
    if (!this.data.universities) this.data.universities = {};
    this.data.universities[uni.id] = uni;
    this.saveDatabase();
    return uni;
  }
  deleteUniversity(id) {
    if (!this.data.universities || !this.data.universities[id]) return false;
    delete this.data.universities[id];
    this.saveDatabase();
    return true;
  }
  // ================= DOCUMENT DEFINITIONS CRUD =================
  getDocumentDefinitions() {
    return this.data.documentDefinitions || defaultDocumentDefinitions;
  }
  getDocumentDefinition(id) {
    return this.data.documentDefinitions?.[id];
  }
  saveDocumentDefinition(doc) {
    if (!this.data.documentDefinitions) this.data.documentDefinitions = {};
    this.data.documentDefinitions[doc.id] = doc;
    this.saveDatabase();
    return doc;
  }
  deleteDocumentDefinition(id) {
    if (!this.data.documentDefinitions || !this.data.documentDefinitions[id]) return false;
    delete this.data.documentDefinitions[id];
    this.saveDatabase();
    return true;
  }
  // ================= USERS CRUD =================
  getUser(userId, defaults) {
    if (!this.data.users[userId]) {
      const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const initialDocs = {};
      const docDefs = this.getDocumentDefinitions();
      Object.entries(docDefs).forEach(([k, def]) => {
        initialDocs[k] = {
          id: k,
          name: def.name,
          status: "missing",
          updatedAt: now
        };
      });
      const newUser = {
        userId,
        username: defaults?.username,
        firstName: defaults?.firstName,
        lastName: defaults?.lastName,
        fullName: defaults?.firstName ? `${defaults.firstName} ${defaults.lastName || ""}`.trim() : void 0,
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
        lastActiveAt: now
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
  updateUser(userId, updates) {
    const user = this.getUser(userId);
    Object.assign(user, updates);
    user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    this.saveDatabase();
    return user;
  }
  getAllUsers() {
    return Object.values(this.data.users);
  }
  searchUsers(query) {
    const q = query.toLowerCase();
    return Object.values(this.data.users).filter(
      (u) => u.userId.toString().includes(q) || u.username && u.username.toLowerCase().includes(q) || u.fullName && u.fullName.toLowerCase().includes(q) || u.phone && u.phone.includes(q)
    );
  }
  // ================= PROMO CODES CRUD =================
  generateRandomCodeString() {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `PTU-${part1}-${part2}`;
  }
  getPromoCode(code) {
    return this.data.promoCodes[code.toUpperCase().trim()];
  }
  createPromoCode(promo) {
    const finalCode = (promo.code || this.generateRandomCodeString()).toUpperCase().trim();
    const newCode = {
      code: finalCode,
      tier: promo.tier,
      maxUses: promo.maxUses || 1,
      // Default strictly 1 person
      usedCount: 0,
      assignedUserId: promo.assignedUserId,
      assignedUserName: promo.assignedUserName,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expiresAt: promo.expiresAt,
      isExpired: false,
      isActive: true
    };
    this.data.promoCodes[newCode.code] = newCode;
    this.saveDatabase();
    return newCode;
  }
  generatePersonalPromo(userId, userName, tier = "Full Premium") {
    const code = this.generateRandomCodeString();
    return this.createPromoCode({
      code,
      tier,
      maxUses: 1,
      assignedUserId: userId,
      assignedUserName: userName
    });
  }
  expirePromoCode(code) {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = true;
    promo.isActive = false;
    this.saveDatabase();
    return true;
  }
  reactivatePromoCode(code) {
    const promo = this.getPromoCode(code);
    if (!promo) return false;
    promo.isExpired = false;
    promo.isActive = true;
    promo.usedCount = 0;
    promo.usedAt = void 0;
    promo.usedByUserId = void 0;
    promo.usedByUserName = void 0;
    this.saveDatabase();
    return true;
  }
  deletePromoCode(code) {
    const clean = code.toUpperCase().trim();
    if (!this.data.promoCodes[clean]) return false;
    delete this.data.promoCodes[clean];
    this.saveDatabase();
    return true;
  }
  // REDEEM: Strictly single-use per code -> becomes unavailable immediately
  redeemPromoCode(code, userId) {
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
        error: `This single-use code has already been redeemed and is no longer available. (Used on ${promo.usedAt || "previously"})`
      };
    }
    if (promo.assignedUserId && promo.assignedUserId !== userId) {
      return { success: false, error: "This private code was created specifically for a different student account." };
    }
    if (promo.expiresAt) {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (today > promo.expiresAt) {
        promo.isExpired = true;
        promo.isActive = false;
        this.saveDatabase();
        return { success: false, error: "This activation code has expired." };
      }
    }
    const user = this.getUser(userId);
    promo.usedCount += 1;
    promo.isActive = false;
    promo.usedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    promo.usedByUserId = userId;
    promo.usedByUserName = user.fullName || user.firstName || "Student";
    this.updateUser(userId, {
      isPremium: true,
      premiumTier: promo.tier,
      premiumCode: promo.code
    });
    this.saveDatabase();
    return { success: true, tier: promo.tier };
  }
  getAllPromoCodes() {
    return Object.values(this.data.promoCodes);
  }
  // ================= DOCUMENTS SUBMISSION CRUD =================
  submitDocument(userId, docKey, submission) {
    const user = this.getUser(userId);
    if (!user.documents) user.documents = {};
    const docDefs = this.getDocumentDefinitions();
    const def = docDefs[docKey];
    const docName = def ? def.name : { en: docKey, uz: docKey };
    const doc = {
      id: docKey,
      name: docName,
      status: "reviewing",
      link: submission.link,
      fileId: submission.fileId,
      fileName: submission.fileName,
      fileType: submission.fileType,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    user.documents[docKey] = doc;
    this.saveDatabase();
    return doc;
  }
  verifyDocument(userId, docKey, status, feedbackNote) {
    const user = this.getUser(userId);
    if (!user.documents || !user.documents[docKey]) return void 0;
    user.documents[docKey].status = status;
    if (feedbackNote) {
      user.documents[docKey].feedbackNote = feedbackNote;
    }
    user.documents[docKey].updatedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    this.saveDatabase();
    return user.documents[docKey];
  }
  getPendingDocuments() {
    const results = [];
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
  createApplication(userId, programId, programName, university, city) {
    const user = this.getUser(userId);
    const id = `APP-${Date.now().toString().slice(-6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const app = {
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
      updatedAt: now
    };
    this.data.applications[id] = app;
    this.saveDatabase();
    return app;
  }
  updateApplicationStage(appId, stage, counselorNote) {
    const app = this.data.applications[appId];
    if (!app) return void 0;
    app.stage = stage;
    if (counselorNote) app.counselorNote = counselorNote;
    app.updatedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    this.saveDatabase();
    return app;
  }
  getAllApplications() {
    return Object.values(this.data.applications);
  }
  getApplication(id) {
    return this.data.applications[id];
  }
  getUserApplications(userId) {
    return Object.values(this.data.applications).filter((a) => a.userId === userId);
  }
  // ================= NAWA APPLICATIONS CRUD =================
  createNawaApplication(userId, data) {
    const user = this.getUser(userId);
    const id = `NAWA-${Date.now().toString().slice(-5)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const item = {
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
      submittedAt: now
    };
    this.data.nawaApplications[id] = item;
    this.saveDatabase();
    return item;
  }
  updateNawaStage(id, stage, note) {
    const item = this.data.nawaApplications[id];
    if (!item) return void 0;
    item.stage = stage;
    if (note) item.counselorNote = note;
    this.saveDatabase();
    return item;
  }
  getAllNawaApplications() {
    return Object.values(this.data.nawaApplications);
  }
  // ================= REVIEWS CRUD =================
  getAllReviews() {
    return this.data.reviews || [];
  }
  getApprovedReviews() {
    return (this.data.reviews || []).filter((r) => r.status === "approved");
  }
  getPendingReviews() {
    return (this.data.reviews || []).filter((r) => r.status === "pending");
  }
  getReview(id) {
    return (this.data.reviews || []).find((r) => r.id === id);
  }
  addReview(review) {
    if (!this.data.reviews) this.data.reviews = [];
    const id = Date.now();
    const newRev = {
      id,
      userId: review.userId,
      name: review.name,
      country: review.country,
      university: review.university,
      program: review.program,
      rating: review.rating,
      year: review.year || (/* @__PURE__ */ new Date()).getFullYear().toString(),
      text: review.text,
      status: review.status || "pending",
      submittedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    this.data.reviews.unshift(newRev);
    this.saveDatabase();
    return newRev;
  }
  updateReview(id, updates) {
    const rev = this.getReview(id);
    if (!rev) return void 0;
    Object.assign(rev, updates);
    this.saveDatabase();
    return rev;
  }
  deleteReview(id) {
    if (!this.data.reviews) return false;
    const initialLen = this.data.reviews.length;
    this.data.reviews = this.data.reviews.filter((r) => r.id !== id);
    if (this.data.reviews.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }
  moderateReview(id, approved) {
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
  toggleSaveProgram(userId, programId) {
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
  setLanguage(userId, lang) {
    return this.updateUser(userId, { lang });
  }
  setWaitingFor(userId, waitingFor, payload) {
    this.updateUser(userId, { waitingFor, waitingPayload: payload });
  }
  setLastPromptMsgId(userId, lastPromptMsgId) {
    this.updateUser(userId, { lastPromptMsgId });
  }
};
var db = new DatabaseService();

// src/bot/locales/en.ts
var en = {
  // Common
  welcome_title: "\u{1F393} Welcome to Poland Top Universities (PTU)!",
  welcome_desc: "Your official mobile gateway to higher education in Poland \u{1F1F5}\u{1F1F1}\n\nFind top universities, explore English-taught degrees, track document recognition (NAWA), and practice entrance exams.",
  choose_language: "\u{1F310} Please select your language / Tilni tanlang:",
  language_set: "\u2705 Language set to English \u{1F1EC}\u{1F1E7}",
  // Main menu buttons (Reply Keyboard)
  btn_universities: "\u{1F393} Universities",
  btn_programs: "\u{1F4DA} Degree Programs",
  btn_nawa: "\u{1F3DB}\uFE0F NAWA Recognition",
  btn_documents: "\u{1F4CB} Document Checklist",
  btn_exams: "\u270D\uFE0F Practice Exams",
  btn_premium: "\u{1F48E} Premium Access",
  btn_reviews: "\u2B50 Student Reviews",
  btn_profile: "\u{1F464} My Profile",
  btn_help: "\u2139\uFE0F Help & FAQ",
  // Navigation
  nav_back: "\u25C0\uFE0F Back",
  nav_main_menu: "\u{1F3E0} Main Menu",
  nav_next: "Next \u27A1\uFE0F",
  nav_prev: "\u2B05\uFE0F Prev",
  nav_close: "\u2716\uFE0F Close",
  nav_page: "Page",
  // Universities Section
  uni_list_title: "\u{1F393} <b>Top Polish Universities</b>\nSelect an institution below to view degree programs, rankings, and admission requirements:",
  uni_filter_all: "All Cities",
  uni_filter_public: "\u{1F3DB}\uFE0F Public Universities",
  uni_filter_private: "\u{1F3E2} Private Universities",
  uni_filter_city: "\u{1F3D9}\uFE0F Filter by City",
  uni_details_title: "\u{1F393} <b>{name} ({abbr})</b>",
  uni_stats_programs: "Available Degrees:",
  uni_stats_students: "Total Students:",
  uni_stats_ranking: "Ranking:",
  uni_stats_tuition: "Tuition Range:",
  uni_stats_website: "Official Website:",
  uni_btn_view_programs: "\u{1F4DA} View {abbr} Programs",
  uni_btn_apply: "\u{1F4DD} Apply to this University",
  // Programs Section
  prog_list_title: "\u{1F4DA} <b>Degree Programs in Poland</b>",
  prog_filter_level: "\u{1F393} Study Level",
  prog_filter_field: "\u{1F52C} Study Field",
  prog_filter_city: "\u{1F3D9}\uFE0F City",
  prog_filter_clear: "\u{1F504} Clear Filters",
  prog_level_bachelor: "Bachelor (BSc/BA)",
  prog_level_master: "Master (MSc/MA)",
  prog_level_phd: "Doctorate (PhD)",
  prog_level_mba: "MBA",
  prog_details_title: "\u{1F4DA} <b>{name}</b>",
  prog_university: "University:",
  prog_city: "City:",
  prog_level: "Degree Level:",
  prog_lang: "Language of Instruction:",
  prog_tuition: "Tuition Fee:",
  prog_duration: "Duration:",
  prog_deadline: "Application Deadline:",
  prog_requirements: "Admission Requirements:",
  prog_documents: "Required Documents:",
  prog_btn_save: "\u2B50 Save Program",
  prog_btn_unsave: "\u274C Remove from Saved",
  prog_btn_apply: "\u{1F4DD} Start Application",
  prog_saved_success: "\u2705 Program saved to your profile!",
  prog_unsaved_success: "\u{1F5D1}\uFE0F Program removed from your saved list.",
  // NAWA Section
  nawa_title: "\u{1F3DB}\uFE0F <b>NAWA Document Recognition & Legalization</b>",
  nawa_btn_steps: "\u{1F4CB} Step-by-Step Roadmap",
  nawa_btn_check: "\u{1F50D} Do I Need NAWA?",
  nawa_btn_apply_wizard: "\u{1F4DD} Start NAWA Assistance",
  nawa_btn_faq: "\u2753 Frequently Asked Questions",
  // Document Checklist Section
  docs_title: "\u{1F4CB} <b>Document Verification Checklist</b>\nTrack and upload your required admission documents:",
  docs_approved: "\u2705 Approved & Verified",
  docs_reviewing: "\u{1F7E1} Under Review",
  docs_needs_correction: "\u{1F534} Needs Correction",
  docs_missing: "\u26AA Not Uploaded",
  docs_btn_submit_link: "\u{1F4E4} Upload / Send File or Link",
  docs_submit_prompt: "Please send your PDF file, photo scan, or cloud link for <b>{docName}</b> in the chat below:",
  docs_submit_success: "\u2705 Document submitted! Our advisors will verify it shortly.",
  // Exams & Quiz Section
  exams_title: "\u270D\uFE0F <b>Practice Exams & Placement Tests</b>\nPrepare for Polish university entrance exams and language assessments:",
  exam_choose_subject: "Select an exam subject below:",
  exam_started: "\u{1F4DD} <b>{examName}</b>\n\nQuestion {current} of {total}:",
  exam_score_title: "\u{1F3C1} <b>Quiz Completed!</b>\n\nYour Score: <b>{score} / {total}</b> ({percentage}%)\n\n{verdict}",
  exam_verdict_high: "\u{1F389} Excellent preparation! You are ready for admissions.",
  exam_verdict_med: "\u{1F44D} Good attempt! Review key topics to boost your score.",
  exam_verdict_low: "\u{1F4DA} More study recommended! Retake the test to practice.",
  exam_btn_retry: "\u{1F504} Retake Test",
  // Premium Section
  premium_title: "\u{1F48E} <b>VIP Admissions & Premium Access</b>",
  premium_benefits: "\u2022 \u{1F3DB}\uFE0F Direct University Application Filing & Dossier Submission\n\u2022 \u{1F4C1} Certified Document Verification by Licensed Admissions Advisors\n\u2022 \u{1F3DB}\uFE0F Official NAWA Legalization & Sworn Translation (T\u0142umacz Przysi\u0119g\u0142y)\n\u2022 \u270D\uFE0F Full University Entrance & Placement Exam Preparations\n\u2022 \u{1F4AC} 1-on-1 Personal Admissions Consultant Support",
  premium_btn_activate_code: "\u{1F511} Activate Access Code",
  premium_btn_contact: "\u{1F4AC} Get Access Code from Advisor",
  premium_prompt_code: "Please enter your activation code (e.g. <code>PTU-DGRZ-JWHB</code>):",
  premium_success: "\u{1F389} Premium access activated successfully!",
  premium_invalid_code: "\u274C Invalid or already used activation code.",
  // Profile Section
  profile_title: "\u{1F464} <b>Student Profile</b>",
  profile_application_status: "Active Applications:",
  profile_btn_saved: "\u2B50 Saved Degrees ({count})",
  profile_btn_switch_lang: "\u{1F310} Switch Language (EN / UZ)"
};

// src/bot/locales/uz.ts
var uz = {
  // Common
  welcome_title: "\u{1F393} Poland Top Universities (PTU) ga xush kelibsiz!",
  welcome_desc: "Polshada oliy ta'lim olish bo'yicha rasmiy mobil yo'lboshchingiz \u{1F1F5}\u{1F1F1}\n\nYetakchi universitetlarni toping, ingliz tilidagi ta'lim dasturlarini tanlang, NAWA nostrifikatsiyasi va hujjatlarni tayyorlang hamda imtihon testlariga mashq qiling.",
  choose_language: "\u{1F310} Iltimos, tilni tanlang / Choose language:",
  language_set: "\u2705 Til o'zbek tiliga o'zgartirildi \u{1F1FA}\u{1F1FF}",
  // Main menu buttons (Reply Keyboard)
  btn_universities: "\u{1F393} Universitetlar",
  btn_programs: "\u{1F4DA} Ta'lim Dasturlari",
  btn_nawa: "\u{1F3DB}\uFE0F NAWA Nostrifikatsiya",
  btn_documents: "\u{1F4CB} Hujjatlar Nazorati",
  btn_exams: "\u270D\uFE0F Mashq Imtihonlari",
  btn_premium: "\u{1F48E} Premium A'zolik",
  btn_reviews: "\u2B50 Talabalar Sharhlari",
  btn_profile: "\u{1F464} Mening Profilim",
  btn_help: "\u2139\uFE0F Yordam & Qoidalar",
  // Navigation
  nav_back: "\u25C0\uFE0F Orqaga",
  nav_main_menu: "\u{1F3E0} Bosh Menyu",
  nav_next: "Keyingisi \u27A1\uFE0F",
  nav_prev: "\u2B05\uFE0F Oldingisi",
  nav_close: "\u2716\uFE0F Yopish",
  nav_page: "Sahifa",
  // Universities Section
  uni_list_title: "\u{1F393} <b>Polshaning Yetakchi Universitetlari</b>\nFakultetlar, reyting va qabul talablari bilan tanishish uchun universitetni tanlang:",
  uni_filter_all: "Barcha shaharlar",
  uni_filter_public: "\u{1F3DB}\uFE0F Davlat Universitetlari",
  uni_filter_private: "\u{1F3E2} Xususiy Universitetlar",
  uni_filter_city: "\u{1F3D9}\uFE0F Shahar bo'yicha",
  uni_details_title: "\u{1F393} <b>{name} ({abbr})</b>",
  uni_stats_programs: "Mavjud dasturlar:",
  uni_stats_students: "Talabalar soni:",
  uni_stats_ranking: "Reyting:",
  uni_stats_tuition: "Kontrakt to'lovi:",
  uni_stats_website: "Rasmiy veb-sayt:",
  uni_btn_view_programs: "\u{1F4DA} {abbr} dasturlarini ko'rish",
  uni_btn_apply: "\u{1F4DD} Universitetga ariza topshirish",
  // Programs Section
  prog_list_title: "\u{1F4DA} <b>Polshadagi Ta'lim Dasturlari</b>",
  prog_filter_level: "\u{1F393} Ta'lim Darajasi",
  prog_filter_field: "\u{1F52C} Yo'nalish Sohasi",
  prog_filter_city: "\u{1F3D9}\uFE0F Shahar",
  prog_filter_clear: "\u{1F504} Filtrlarni tozalash",
  prog_level_bachelor: "Bakalavr (BSc/BA)",
  prog_level_master: "Magistratura (MSc/MA)",
  prog_level_phd: "Doktorantura (PhD)",
  prog_level_mba: "MBA",
  prog_details_title: "\u{1F4DA} <b>{name}</b>",
  prog_university: "Universitet:",
  prog_city: "Shahar:",
  prog_level: "Ta'lim bosqichi:",
  prog_lang: "Ta'lim tili:",
  prog_tuition: "Kontrakt narxi:",
  prog_duration: "Davomiyligi:",
  prog_deadline: "Qabul muddati:",
  prog_requirements: "Asosiy talablar:",
  prog_documents: "Kerakli hujjatlar:",
  prog_btn_save: "\u2B50 Saqlanganlarga qo'shish",
  prog_btn_unsave: "\u274C Saqlanganlardan o'chirish",
  prog_btn_apply: "\u{1F4DD} Ariza topshirish",
  prog_saved_success: "\u2705 Dastur profilingizga saqlandi!",
  prog_unsaved_success: "\u{1F5D1}\uFE0F Dastur saqlanganlardan olib tashlandi.",
  // NAWA Section
  nawa_title: "\u{1F3DB}\uFE0F <b>NAWA Hujjatlarni Tan Olish (Nostrifikatsiya)</b>",
  nawa_btn_steps: "\u{1F4CB} Bosqichma-bosqich yo'riqnoma",
  nawa_btn_check: "\u{1F50D} Menga NAWA kerakmi?",
  nawa_btn_apply_wizard: "\u{1F4DD} NAWA yordamiga yozilish",
  nawa_btn_faq: "\u2753 Ko'p beriladigan savollar",
  // Document Checklist Section
  docs_title: "\u{1F4CB} <b>Hujjatlar Nazorati va Holati</b>\nUniversitet uchun zarur hujjatlaringiz holatini onlayn kuzating va yuklang:",
  docs_approved: "\u2705 Qabul qilindi va Tasdiqlandi",
  docs_reviewing: "\u{1F7E1} Tekshirilmoqda",
  docs_needs_correction: "\u{1F534} Tuzatish talab etiladi",
  docs_missing: "\u26AA Yuklanmagan",
  docs_btn_submit_link: "\u{1F4E4} Hujjat yoki Havola Yuborish",
  docs_submit_prompt: "Iltimos, <b>{docName}</b> hujjati uchun PDF fayl, fotosurat yoki Google Drive havolasini yuboring:",
  docs_submit_success: "\u2705 Hujjat qabul qilindi! Maslahatchilarimiz tez orada tekshirib chiqadi.",
  // Exams & Quiz Section
  exams_title: "\u270D\uFE0F <b>Mashq Imtihonlari va Kirish Testlari</b>\nPolsha universitetlarining kirish imtihonlari va til testlariga tayyorlaning:",
  exam_choose_subject: "Boshlash uchun test fanini tanlang:",
  exam_started: "\u{1F4DD} <b>{examName}</b>\n\nSavol: {current} / {total}:",
  exam_score_title: "\u{1F3C1} <b>Test yakunlandi!</b>\n\nSizning natijangiz: <b>{score} / {total}</b> ({percentage}%)\n\n{verdict}",
  exam_verdict_high: "\u{1F389} Ajoyib natija! Siz qabulga juda yaxshi tayyorgarlik ko'rgansiz.",
  exam_verdict_med: "\u{1F44D} Yaxshi harakat! Yana biroz mashq qilsangiz, mukammal bo'ladi.",
  exam_verdict_low: "\u{1F4DA} Yana takrorlash tavsiya etiladi! Bilimingizni mustahkamlash uchun qaytadan urinib ko'ring.",
  exam_btn_retry: "\u{1F504} Testni qayta topshirish",
  // Premium Section
  premium_title: "\u{1F48E} <b>VIP Qabul & Premium A'zolik</b>",
  premium_benefits: "\u2022 \u{1F3DB}\uFE0F Universitetlarga to'g'ridan-to'g'ri ariza va hujjat topshirish\n\u2022 \u{1F4C1} Rasmiy maslahatchilar tomonidan hujjatlarni tekshirish va tasdiqlash\n\u2022 \u{1F3DB}\uFE0F NAWA SYRENA nostrifikatsiyasi va Polsha qasamyodli tarjimasi (T\u0142umacz Przysi\u0119g\u0142y)\n\u2022 \u270D\uFE0F Barcha kirish imtihonlari va yo'nalish testlariga to'liq kirish\n\u2022 \u{1F4AC} Shaxsiy qabul koordinatori bilan to'g'ridan-to'g'ri aloqa",
  premium_btn_activate_code: "\u{1F511} Promokodni Faollashtirish",
  premium_btn_contact: "\u{1F4AC} Maslahatchidan Kod Olish",
  premium_prompt_code: "Iltimos, faollashtirish promokodini kiriting (masalan: <code>PTU-DGRZ-JWHB</code>):",
  premium_success: "\u{1F389} Premium a'zolik muvaffaqiyatli faollashtirildi!",
  premium_invalid_code: "\u274C Noto'g'ri yoki allaqachon ishlatilgan faollashtirish kodi.",
  // Profile Section
  profile_title: "\u{1F464} <b>Talaba Profili</b>",
  profile_application_status: "Faol Arizalar:",
  profile_btn_saved: "\u2B50 Saqlangan Dasturlar ({count})",
  profile_btn_switch_lang: "\u{1F310} Tilni O'zgartirish (UZ / EN)"
};

// src/bot/locales/index.ts
var translations = { en, uz };
function t(lang, key, params) {
  const currentLang = lang || "en";
  let text = translations[currentLang]?.[key] || translations.en[key] || String(key);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return text;
}

// src/bot/keyboards/menuKeyboards.ts
import { InlineKeyboard } from "grammy";
function getMainMenuKeyboard(lang) {
  return new InlineKeyboard().text(t(lang, "btn_universities"), "menu_unis").text(t(lang, "btn_programs"), "menu_progs").row().text(t(lang, "btn_nawa"), "menu_nawa").text(t(lang, "btn_documents"), "menu_docs").row().text(t(lang, "btn_exams"), "menu_exams").text(t(lang, "btn_premium"), "menu_premium").row().text(t(lang, "btn_reviews"), "menu_reviews").text(t(lang, "btn_profile"), "menu_profile");
}
function getLanguageInlineKeyboard() {
  return new InlineKeyboard().text("\u{1F1EC}\u{1F1E7} English", "set_lang_en").text("\u{1F1FA}\u{1F1FF} O'zbekcha", "set_lang_uz");
}
function getOnboardingLanguageKeyboard() {
  return new InlineKeyboard().text("\u{1F1EC}\u{1F1E7} English", "onboarding_lang_en").text("\u{1F1FA}\u{1F1FF} O'zbekcha", "onboarding_lang_uz");
}
function getOnboardingDegreeKeyboard(lang) {
  return new InlineKeyboard().text("\u{1F393} Bachelor's (BSc / BA)", "onboarding_level_Bachelor").row().text("\u{1F393} Master's (MSc / MA)", "onboarding_level_Master").row().text("\u{1F3E5} Medicine / Pharmacy (MD)", "onboarding_level_PhD").row().text("\u{1F4BC} MBA / Postgraduate", "onboarding_level_MBA");
}
function getUniversitiesFilterKeyboard(lang, activeCity) {
  const cities = ["Warsaw", "Krak\xF3w", "Wroc\u0142aw", "Pozna\u0144", "Gda\u0144sk"];
  const kb = new InlineKeyboard();
  cities.forEach((city, index) => {
    const isSelected = activeCity === city;
    kb.text(`${isSelected ? "\u2705 " : ""}${city}`, `uni_city_${city}`);
    if (index % 2 === 1) kb.row();
  });
  if (activeCity) {
    kb.row().text(`\u{1F504} ${t(lang, "uni_filter_all")}`, "uni_city_all");
  }
  return kb;
}
function getUniversitiesListKeyboard(lang, filteredUnis, page = 0, pageSize = 5) {
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageItems = filteredUnis.slice(start, start + pageSize);
  pageItems.forEach((uni) => {
    kb.text(`\u{1F3DB}\uFE0F ${uni.name} (${uni.city})`, `view_uni_${uni.id}`);
    if (uni.website) {
      kb.url("\u{1F310} " + (lang === "uz" ? "Sayt" : "Link"), uni.website);
    }
    kb.row();
  });
  const totalPages = Math.ceil(filteredUnis.length / pageSize) || 1;
  const navRow = [];
  if (page > 0) {
    navRow.push({ text: t(lang, "nav_prev"), data: `uni_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: t(lang, "nav_next"), data: `uni_page_${page + 1}` });
  }
  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }
  kb.text(t(lang, "uni_filter_city"), "uni_open_city_filter").text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getUniversityDetailKeyboard(lang, uni) {
  const abbr = uni.abbr || "Uni";
  const websiteLabel = lang === "uz" ? "\u{1F310} Rasmiy Veb-Sayt (Havola)" : "\u{1F310} Official Admissions Website (Link)";
  return new InlineKeyboard().url(websiteLabel, uni.website || "https://studyinpoland.pl").row().text(t(lang, "uni_btn_view_programs", { abbr }), `prog_filter_uni_${uni.id}`).row().text(t(lang, "uni_btn_apply"), `apply_uni_${uni.id}`).row().text(t(lang, "nav_back"), "back_to_unis");
}
function getProgramsFilterKeyboard(lang, activeFilters) {
  const kb = new InlineKeyboard();
  kb.text(`\u{1F393} Level: ${activeFilters.level || "All"}`, "filter_modal_level").text(`\u{1F3D9}\uFE0F City: ${activeFilters.city || "All"}`, "filter_modal_city").row().text(`\u{1F52C} Field: ${activeFilters.field || "All"}`, "filter_modal_field").text(`\u{1F504} ${t(lang, "prog_filter_clear")}`, "filter_clear").row().text(t(lang, "nav_back"), "go_main_menu");
  return kb;
}
function getProgramsListKeyboard(lang, filteredProgs, page = 0, pageSize = 5) {
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageItems = filteredProgs.slice(start, start + pageSize);
  pageItems.forEach((p) => {
    kb.text(`\u{1F4D8} [${p.level}] ${p.name} - ${p.city}`, `view_prog_${p.id}`).row();
  });
  const totalPages = Math.ceil(filteredProgs.length / pageSize) || 1;
  const navRow = [];
  if (page > 0) {
    navRow.push({ text: t(lang, "nav_prev"), data: `progs_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: t(lang, "nav_next"), data: `progs_page_${page + 1}` });
  }
  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }
  kb.text(`\u{1F50D} ${t(lang, "prog_filter_field")}`, "progs_filter_menu").text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getProgramDetailKeyboard(lang, progId, isSaved) {
  return new InlineKeyboard().text(
    isSaved ? t(lang, "prog_btn_unsave") : t(lang, "prog_btn_save"),
    `toggle_save_${progId}`
  ).text(t(lang, "prog_btn_apply"), `apply_prog_${progId}`).row().text(t(lang, "nav_back"), "back_to_progs");
}
function getNawaKeyboard(lang) {
  return new InlineKeyboard().text(t(lang, "nawa_btn_steps"), "nawa_view_steps").row().text(t(lang, "nawa_btn_check"), "nawa_check_eligibility").row().text(t(lang, "nawa_btn_apply_wizard"), "nawa_apply_wizard").row().text(t(lang, "nawa_btn_faq"), "nawa_faq").row().text(t(lang, "nav_main_menu"), "go_main_menu");
}
function getDocumentsKeyboard(lang, docs, docDefs) {
  const kb = new InlineKeyboard();
  const definitions = docDefs || {};
  Object.entries(definitions).forEach(([docKey, def]) => {
    const status = docs[docKey]?.status || "missing";
    const statusIcon = status === "approved" ? "\u2705" : status === "reviewing" ? "\u{1F7E1}" : status === "needs_correction" ? "\u{1F534}" : "\u26AA";
    const name = def.name?.[lang] || def.name?.en || docKey;
    kb.text(`${statusIcon} ${name}`, `doc_action_${docKey}`).row();
  });
  kb.text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getExamsListKeyboard(lang, examList) {
  const kb = new InlineKeyboard();
  examList.forEach((exam) => {
    const isFree = exam.id === "polish-b1";
    const badge = isFree ? "\u{1F7E2} [Free Demo] " : "\u{1F512} [VIP] ";
    kb.text(`${badge}${exam.name[lang] || exam.name.en}`, `start_exam_${exam.id}`).row();
  });
  kb.text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getQuizQuestionKeyboard(options, currentQ, examId) {
  const kb = new InlineKeyboard();
  options.forEach((opt, idx) => {
    kb.text(`${String.fromCharCode(65 + idx)}) ${opt}`, `quiz_ans_${examId}_${currentQ}_${idx}`).row();
  });
  kb.text("\u274C Exit Quiz", "exam_cancel");
  return kb;
}
function getPremiumKeyboard(lang, isPremium) {
  const kb = new InlineKeyboard();
  if (!isPremium) {
    kb.text(t(lang, "premium_btn_activate_code"), "premium_enter_code").row();
  }
  kb.url(t(lang, "premium_btn_contact"), "https://t.me/poland_admissions_bot").row().text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getReviewsKeyboard(lang, reviews, page = 0, pageSize = 2) {
  const kb = new InlineKeyboard();
  const totalPages = Math.ceil(reviews.length / pageSize) || 1;
  if (page > 0) kb.text(t(lang, "nav_prev"), `revs_page_${page - 1}`);
  if (page < totalPages - 1) kb.text(t(lang, "nav_next"), `revs_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();
  kb.text(lang === "uz" ? "\u270D\uFE0F Sharh Qoldirish" : "\u270D\uFE0F Write a Review", "review_write_start").row().text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}
function getReviewRatingKeyboard(lang) {
  return new InlineKeyboard().text("\u2B50 1", "rev_rate_1").text("\u2B50\u2B50 2", "rev_rate_2").text("\u2B50\u2B50\u2B50 3", "rev_rate_3").row().text("\u2B50\u2B50\u2B50\u2B50 4", "rev_rate_4").text("\u2B50\u2B50\u2B50\u2B50\u2B50 5", "rev_rate_5").row().text(t(lang, "nav_back"), "menu_reviews");
}

// src/bot/utils/format.ts
function escapeHtml(str) {
  if (str === void 0 || str === null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/bot/handlers/startHandler.ts
function setupStartHandler(bot) {
  bot.command("start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    });
    if (user.lastPromptMsgId && ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
      } catch {
      }
    }
    if (!user.isRegistered) {
      const welcomeText = `\u{1F1F5}\u{1F1F1} <b>Welcome to Poland Top Universities (PTU)!</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Your official gateway to admissions at top Polish universities.

\u{1F310} <b>Please choose your preferred language to begin registration:</b>
<i>Iltimos, ro'yxatdan o'tishni boshlash uchun tilni tanlang:</i>`;
      const msg2 = await ctx.reply(welcomeText, {
        parse_mode: "HTML",
        reply_markup: getOnboardingLanguageKeyboard()
      });
      db.setLastPromptMsgId(userId, msg2.message_id);
      return;
    }
    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg = `\u{1F1F5}\u{1F1F1} <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>

${escapeHtml(t(user.lang, "welcome_desc"))}

\u{1F44B} <b>Welcome back, ${escapeHtml(firstName)}!</b>
\u{1F48E} Membership: <b>${escapeHtml(user.premiumTier || "Free")}</b>`;
    const msg = await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang)
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^onboarding_lang_(en|uz)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_lang_(en|uz)$/);
    if (!match) return;
    const chosenLang = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    db.setLanguage(userId, chosenLang);
    db.setWaitingFor(userId, "registration_name");
    await ctx.answerCallbackQuery();
    const text = chosenLang === "uz" ? `\u{1F4DD} <b>1-Qadam (3 tadan): To'liq Ismingiz</b>

Iltimos, to'liq ism va familiyangizni yozib yuboring (masalan: <code>Saidislom Karimov</code>):` : `\u{1F4DD} <b>Step 1 of 3: Full Name</b>

Please reply with your Full Name (First name and Family name, e.g. <code>John Doe</code>):`;
    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML"
      });
      if (ctx.callbackQuery?.message) {
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
      }
    } catch {
      const msg = await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true }
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });
  bot.command("register", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const user = db.getUser(userId);
    db.setWaitingFor(userId, "registration_name");
    const text = user.lang === "uz" ? `\u{1F4DD} <b>Talaba Profilini Qayta Sozlash:</b>

Iltimos, to'liq ism va familiyangizni kiriting:` : `\u{1F4DD} <b>Student Registration & Profile Setup:</b>

Please enter your Full Name:`;
    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true }
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.command("lang", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const user = db.getUser(userId);
    if (!user.isRegistered) {
      const msg2 = await ctx.reply("\u26A0\uFE0F Please complete registration first.", {
        reply_markup: getOnboardingLanguageKeyboard()
      });
      db.setLastPromptMsgId(userId, msg2.message_id);
      return;
    }
    const msg = await ctx.reply(t(user.lang, "choose_language"), {
      reply_markup: getLanguageInlineKeyboard()
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^set_lang_(en|uz)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^set_lang_(en|uz)$/);
    if (!match) return;
    const chosenLang = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    db.setLanguage(userId, chosenLang);
    await ctx.answerCallbackQuery({ text: t(chosenLang, "language_set") });
    try {
      await ctx.editMessageText(`\u2705 ${t(chosenLang, "language_set")}`);
    } catch {
    }
    if (user.isRegistered) {
      await ctx.reply(`\u{1F3E0} <b>${escapeHtml(t(chosenLang, "nav_main_menu"))}</b>`, {
        parse_mode: "HTML",
        reply_markup: getMainMenuKeyboard(chosenLang)
      });
    }
  });
  bot.command("help", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const user = db.getUser(userId);
    if (!user.isRegistered) {
      const msg = await ctx.reply(
        "\u26A0\uFE0F <b>Please complete your registration first:</b>\n\nChoose your language below to start:",
        {
          parse_mode: "HTML",
          reply_markup: getOnboardingLanguageKeyboard()
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }
    const helpText = `\u{1F1F5}\u{1F1F1} <b>Poland Top Universities (PTU) Bot Help:</b>

\u2022 /start - Open main menu
\u2022 /register - Update registration details
\u2022 /universities - Browse top Polish universities
\u2022 /programs - Search degree programs
\u2022 /nawa - NAWA document recognition guide
\u2022 /documents - Track application document status
\u2022 /exams - Practice entrance exams
\u2022 /premium - Activate VIP support with access code
\u2022 /profile - View saved programs & application status
\u2022 /admin - Access Admin CRM panel (for advisors)
\u2022 /lang - Change language (English / O'zbekcha)`;
    await ctx.reply(helpText, { parse_mode: "HTML" });
  });
  bot.callbackQuery("go_main_menu", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    await ctx.answerCallbackQuery();
    if (!user.isRegistered) {
      const msg = await ctx.reply(
        "\u26A0\uFE0F <b>Please complete your registration first:</b>",
        {
          parse_mode: "HTML",
          reply_markup: getOnboardingLanguageKeyboard()
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }
    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg = `\u{1F1F5}\u{1F1F1} <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>

${escapeHtml(t(user.lang, "welcome_desc"))}

\u{1F44B} <b>${user.lang === "uz" ? "Xush kelibsiz" : "Welcome back"}, ${escapeHtml(firstName)}!</b>
\u{1F48E} ${user.lang === "uz" ? "A'zolik darajasi" : "Membership"}: <b>${escapeHtml(user.premiumTier || "Free")}</b>`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(welcomeMsg, {
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(user.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang)
    });
  });
}

// src/bot/handlers/universityHandler.ts
function setupUniversityHandler(bot) {
  const handleUniversitiesMenu = async (ctx, cityFilter, page = 0) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const filtered = db.getAllUniversities(cityFilter);
    const title = isUz ? `\u{1F393} <b>Polshaning Yetakchi Universitetlari</b>

Fakultetlar, reyting va qabul talablari bilan tanishish uchun universitetni tanlang:

\u{1F4CC} <i>${filtered.length} ta universitet ko'rsatilmoqda${cityFilter && cityFilter !== "all" ? ` (${escapeHtml(cityFilter)} shahrida)` : ""}</i>` : `\u{1F393} <b>Top Polish Universities</b>

Select an institution below to view degree programs, rankings, and admission requirements:

\u{1F4CC} <i>Showing ${filtered.length} universities${cityFilter && cityFilter !== "all" ? ` in ${escapeHtml(cityFilter)}` : ""}</i>`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, {
          parse_mode: "HTML",
          reply_markup: getUniversitiesListKeyboard(user.lang, filtered, page)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(title, {
      parse_mode: "HTML",
      reply_markup: getUniversitiesListKeyboard(user.lang, filtered, page)
    });
  };
  bot.command("universities", async (ctx) => handleUniversitiesMenu(ctx));
  bot.callbackQuery("menu_unis", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx);
  });
  bot.hears([/.*Universities.*/i, /.*Universitetlar.*/i], async (ctx) => handleUniversitiesMenu(ctx));
  bot.callbackQuery(/^uni_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^uni_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const allUnis = db.getAllUniversities();
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      isUz ? `\u{1F393} <b>Polshaning Yetakchi Universitetlari</b>

\u{1F4CC} <i>${page + 1}-sahifa</i>` : `\u{1F393} <b>Top Polish Universities</b>

\u{1F4CC} <i>Page ${page + 1}</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getUniversitiesListKeyboard(user.lang, allUnis, page)
      }
    );
  });
  bot.callbackQuery("uni_open_city_filter", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    await ctx.answerCallbackQuery();
    try {
      await ctx.editMessageText(`\u{1F3D9}\uFE0F <b>${escapeHtml(t(user.lang, "uni_filter_city"))}:</b>`, {
        parse_mode: "HTML",
        reply_markup: getUniversitiesFilterKeyboard(user.lang)
      });
    } catch {
      await ctx.reply(`\u{1F3D9}\uFE0F <b>${escapeHtml(t(user.lang, "uni_filter_city"))}:</b>`, {
        parse_mode: "HTML",
        reply_markup: getUniversitiesFilterKeyboard(user.lang)
      });
    }
  });
  bot.callbackQuery(/^uni_city_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^uni_city_(.+)$/);
    if (!match) return;
    const city = match[1];
    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx, city, 0);
  });
  bot.callbackQuery(/^view_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^view_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const uni = db.getUniversity(uniId);
    if (!uni) {
      await ctx.answerCallbackQuery({ text: isUz ? "Universitet topilmadi" : "University not found" });
      return;
    }
    const desc = uni.description ? uni.description[user.lang] || uni.description.en : "";
    const facultiesList = (uni.faculties || []).map((f) => `  \u2022 ${escapeHtml(f)}`).join("\n");
    const reqsList = (uni.requirements || []).map((r) => `  \u2022 ${escapeHtml(r)}`).join("\n");
    const text = isUz ? `\u{1F3DB}\uFE0F <b>${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>
\u{1F4CD} <b>${escapeHtml(uni.city)}, Polsha</b> | \u{1F3EB} <b>${uni.type === "Public" ? "Davlat" : "Xususiy"} Universiteti</b>

` + (desc ? `\u{1F4DD} ${escapeHtml(desc)}

` : "") + `\u{1F4CA} <b>Asosiy Ko'rsatkichlar va Reyting:</b>
\u2022 \u{1F3C6} Milliy Reyting: <b>${escapeHtml(uni.ranking || "N/A")}</b>
\u2022 \u{1F393} Dasturlar: <b>${uni.programsCount || 0} ta</b> | \u{1F465} Jami Talabalar: <b>${(uni.students || 0).toLocaleString()} ta</b>
\u2022 \u{1F30D} Xalqaro Talabalar: <b>${(uni.internationalStudents || 0).toLocaleString()} ta</b>
\u2022 \u{1F4C5} Hujjat Qabul Muddati: <b>${escapeHtml(uni.deadline || "August 15")}</b>

\u{1F4B0} <b>O'rtacha Kontrakt Narxi:</b>
\u2022 Ingliz tilidagi dasturlar: <b>${escapeHtml(uni.tuition?.english || "2,500 EUR/yr")}</b>
\u2022 Polyak tilidagi dasturlar: <b>${escapeHtml(uni.tuition?.nonEu || "2,000 EUR/yr")}</b>
\u2022 Yevropa Ittifoqi fuqarolari: <b>${escapeHtml(uni.tuition?.eu || "Free / 0 EUR")}</b>

` + (facultiesList ? `\u{1F3DB}\uFE0F <b>Asosiy Fakultetlar:</b>
${facultiesList}

` : "") + (reqsList ? `\u{1F4CB} <b>Umumiy Qabul Talablari:</b>
${reqsList}` : "") : `\u{1F3DB}\uFE0F <b>${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>
\u{1F4CD} <b>${escapeHtml(uni.city)}, Poland</b> | \u{1F3EB} <b>${escapeHtml(uni.type)} University</b>

` + (desc ? `\u{1F4DD} ${escapeHtml(desc)}

` : "") + `\u{1F4CA} <b>Key Facts & Rankings:</b>
\u2022 \u{1F3C6} Ranking: <b>${escapeHtml(uni.ranking || "N/A")}</b>
\u2022 \u{1F393} Programs: <b>${uni.programsCount || 0}</b> | \u{1F465} Students: <b>${(uni.students || 0).toLocaleString()}</b>
\u2022 \u{1F30D} International students: <b>${(uni.internationalStudents || 0).toLocaleString()}</b>
\u2022 \u{1F4C5} Application deadline: <b>${escapeHtml(uni.deadline || "August 15")}</b>

\u{1F4B0} <b>Estimated Tuition:</b>
\u2022 English-taught: <b>${escapeHtml(uni.tuition?.english || "2,500 EUR/yr")}</b>
\u2022 Non-EU (Polish-taught): <b>${escapeHtml(uni.tuition?.nonEu || "2,000 EUR/yr")}</b>
\u2022 EU Citizens: <b>${escapeHtml(uni.tuition?.eu || "Free / 0 EUR")}</b>

` + (facultiesList ? `\u{1F3DB}\uFE0F <b>Key Faculties:</b>
${facultiesList}

` : "") + (reqsList ? `\u{1F4CB} <b>General Admission Requirements:</b>
${reqsList}` : "");
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getUniversityDetailKeyboard(user.lang, uni)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getUniversityDetailKeyboard(user.lang, uni)
    });
  });
  bot.callbackQuery("back_to_unis", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx);
  });
}

// src/bot/data/programs.ts
var programs = [
  {
    id: "cs-uw",
    name: "Computer Science",
    university: "University of Warsaw",
    uniId: "uw",
    city: "Warsaw",
    level: "Bachelor",
    field: "Technology",
    lang: "English",
    tuition: "8,500 PLN / year (~2,000 EUR)",
    duration: "3 years (6 semesters)",
    deadline: "May 31, 2025",
    status: "Open",
    about: {
      en: "Top ranked Computer Science program focusing on algorithms, system architecture, artificial intelligence, and software engineering. Taught 100% in English.",
      uz: "Algoritmlar, tizim arxitekturasi, sun'iy intellekt va dasturiy ta'minot muhandisligiga yo'naltirilgan yetakchi dastur. 100% ingliz tilida o'qitiladi."
    },
    requirements: [
      "High school diploma with high grades in Mathematics",
      "IELTS 6.5 / TOEFL iBT 87+",
      "Pass the online logic & mathematics test"
    ],
    documents: [
      "Secondary school certificate + Apostille",
      "Official Polish translation of diploma",
      "English proficiency certificate",
      "Passport copy"
    ],
    mode: "Full-time"
  },
  {
    id: "ir-uw",
    name: "International Relations",
    university: "University of Warsaw",
    uniId: "uw",
    city: "Warsaw",
    level: "Master",
    field: "Social Sciences",
    lang: "English",
    tuition: "12,000 PLN / year (~2,800 EUR)",
    duration: "2 years (4 semesters)",
    deadline: "June 15, 2025",
    status: "Open",
    about: {
      en: "Comprehensive master's program covering diplomacy, European integration, global security, and international law.",
      uz: "Diplomatiya, Yevropa integratsiyasi, global xavfsizlik va xalqaro huquqni o'z ichiga olgan magistratura dasturi."
    },
    requirements: [
      "Bachelor's degree diploma + Apostille",
      "English B2/C1 certificate",
      "Motivation statement & CV"
    ],
    documents: ["Bachelor diploma & transcripts", "English certificate", "Passport scan"],
    mode: "Full-time"
  },
  {
    id: "med-uj",
    name: "Medicine (MD Program)",
    university: "Jagiellonian University",
    uniId: "uj",
    city: "Krak\xF3w",
    level: "Master",
    field: "Medicine",
    lang: "English",
    tuition: "18,000 EUR / year (~78,000 PLN)",
    duration: "6 years",
    deadline: "April 30, 2025",
    status: "Open",
    about: {
      en: "Renowned 6-year European medical degree recognized worldwide (EU, USMLE eligible, GMC). High clinical exposure in university clinics.",
      uz: "Butun dunyoda (Yevropa, AQSh, Buyuk Britaniya) tan olinadigan nufuzli 6 yillik tibbiyot diplomi. Universitet klinikalarida kuchli amaliyot."
    },
    requirements: [
      "High school with Biology and Chemistry courses",
      "Medical entrance exam (Biology & Chemistry)",
      "IELTS 6.5+ or equivalent",
      "Health clearance certificate"
    ],
    documents: ["Diploma + Apostille", "Entrance exam certificate", "Medical fitness certificate", "Passport"],
    mode: "Full-time"
  },
  {
    id: "ce-pw",
    name: "Civil Engineering",
    university: "Warsaw University of Technology",
    uniId: "pw",
    city: "Warsaw",
    level: "Bachelor",
    field: "Engineering",
    lang: "English",
    tuition: "9,000 PLN / year (~2,100 EUR)",
    duration: "4 years (8 semesters)",
    deadline: "May 15, 2025",
    status: "Open",
    about: {
      en: "Hands-on engineering degree focusing on structural design, building physics, transportation networks, and sustainable infrastructure.",
      uz: "Konstruksiya loyihalash, bino fizikasi va transport infratuzilmasiga yo'naltirilgan amaliy muhandislik dasturi."
    },
    requirements: [
      "High school diploma with Mathematics & Physics",
      "English B2 proficiency",
      "Online math evaluation test"
    ],
    documents: ["Diploma + Apostille", "Transcripts", "English certificate", "Passport"],
    mode: "Full-time"
  },
  {
    id: "mba-koz",
    name: "International MBA & Management",
    university: "Kozminski University",
    uniId: "kozminski",
    city: "Warsaw",
    level: "MBA",
    field: "Business",
    lang: "English",
    tuition: "28,000 PLN / year (~6,500 EUR)",
    duration: "2 years",
    deadline: "Rolling / July 31, 2025",
    status: "Open",
    about: {
      en: "Triple-crown accredited MBA program designed for emerging business leaders, venture founders, and executive managers in Europe.",
      uz: "Yevropadagi yetakchi menejerlar va tadbirkorlar uchun mo'ljallangan xalqaro 'Triple Crown' akkreditatsiyali MBA dasturi."
    },
    requirements: [
      "Bachelor's degree or higher",
      "Minimum 1-2 years work experience",
      "English proficiency C1 / IELTS 6.5+",
      "Admissions interview"
    ],
    documents: ["Bachelor degree + Apostille", "CV & Work references", "Passport", "Motivation letter"],
    mode: "Full-time"
  },
  {
    id: "econ-sgh",
    name: "International Economics",
    university: "SGH Warsaw School of Economics",
    uniId: "sgh",
    city: "Warsaw",
    level: "Bachelor",
    field: "Economics",
    lang: "English",
    tuition: "4,500 PLN / semester (~2,100 EUR/yr)",
    duration: "3 years (6 semesters)",
    deadline: "June 1, 2025",
    status: "Open",
    about: {
      en: "Rigorous analytical training in micro & macroeconomics, financial markets, trade policy, and econometrics.",
      uz: "Mikro va makroiqtisodiyot, moliya bozorlari, xalqaro savdo va ekonometrika bo'yicha chuqur tahliliy ta'lim."
    },
    requirements: [
      "Secondary school diploma with high Math grade",
      "English proficiency B2+"
    ],
    documents: ["Diploma with Apostille", "Grade transcripts", "English certificate", "Passport scan"],
    mode: "Full-time"
  },
  {
    id: "env-pwr",
    name: "Environmental Engineering",
    university: "Wroc\u0142aw University of Science and Technology",
    uniId: "pwr",
    city: "Wroc\u0142aw",
    level: "Master",
    field: "Engineering",
    lang: "English",
    tuition: "7,500 PLN / year (~1,750 EUR)",
    duration: "1.5 years (3 semesters)",
    deadline: "May 30, 2025",
    status: "Open",
    about: {
      en: "Specialized in renewable energy, circular economy, waste management, and environmental monitoring systems.",
      uz: "Qayta tiklanuvchi energiya, chiqindilarni qayta ishlash va ekologik monitoring tizimlariga ixtisoslashgan magistratura."
    },
    requirements: [
      "BSc in Engineering, Chemistry, or Environmental Science",
      "English B2 certificate"
    ],
    documents: ["Bachelor degree + Apostille", "Transcripts", "Passport copy"],
    mode: "Full-time"
  },
  {
    id: "law-uj",
    name: "European and International Law",
    university: "Jagiellonian University",
    uniId: "uj",
    city: "Krak\xF3w",
    level: "Master",
    field: "Law",
    lang: "English",
    tuition: "10,000 PLN / year (~2,350 EUR)",
    duration: "2 years",
    deadline: "June 30, 2025",
    status: "Open",
    about: {
      en: "Comprehensive comparative law degree exploring EU regulations, international arbitration, human rights, and cross-border commercial law.",
      uz: "Yevropa Ittifoqi qonunchiligi, xalqaro arbitraj va xalqaro tijorat huquqini o'rganuvchi nufuzli dastur."
    },
    requirements: [
      "Bachelor degree in Law or related Social Sciences",
      "English B2/C1 proficiency"
    ],
    documents: ["Bachelor degree + Apostille", "Transcripts", "Passport", "Motivation letter"],
    mode: "Full-time"
  },
  {
    id: "cs-agh",
    name: "Computer Science & Engineering",
    university: "AGH University of Krakow",
    uniId: "agh",
    city: "Krak\xF3w",
    level: "Bachelor",
    field: "Technology",
    lang: "English",
    tuition: "7,000 PLN / year (~1,650 EUR)",
    duration: "3.5 years (7 semesters - Engineer degree)",
    deadline: "June 10, 2025",
    status: "Open",
    about: {
      en: "Engineering (In\u017Cynier) qualification covering embedded systems, cloud computing, cybersecurity, and practical software design.",
      uz: "Bulutli texnologiyalar, kiberxavfsizlik va dasturlash bo'yicha xalqaro 'In\u017Cynier' muhandislik diplomini beruvchi dastur."
    },
    requirements: [
      "High school diploma with STEM background",
      "IELTS 6.0 / TOEFL 80+"
    ],
    documents: ["Secondary diploma with Apostille", "Polish sworn translation", "Passport"],
    mode: "Full-time"
  },
  {
    id: "psy-swps",
    name: "Clinical & Applied Psychology",
    university: "SWPS University",
    uniId: "swps",
    city: "Warsaw",
    level: "Bachelor",
    field: "Social Sciences",
    lang: "English",
    tuition: "16,000 PLN / year (~3,700 EUR)",
    duration: "3 years",
    deadline: "July 15, 2025",
    status: "Open",
    about: {
      en: "One of Europe's top practical psychology programs with access to behavioral labs, neuroimaging, and cross-cultural psych research.",
      uz: "Yevropadagi eng kuchli amaliy psixologiya dasturlaridan biri; laboratoriyalar va neyrotadqiqotlar markaziga ega."
    },
    requirements: [
      "High school diploma",
      "English proficiency B2",
      "Personal statement"
    ],
    documents: ["Diploma + Apostille", "English certificate", "Passport"],
    mode: "Full-time"
  },
  {
    id: "data-pw",
    name: "Data Science & Big Data",
    university: "Warsaw University of Technology",
    uniId: "pw",
    city: "Warsaw",
    level: "Master",
    field: "Technology",
    lang: "English",
    tuition: "10,500 PLN / year (~2,450 EUR)",
    duration: "2 years",
    deadline: "May 25, 2025",
    status: "Open",
    about: {
      en: "Cutting-edge curriculum in machine learning, neural networks, distributed systems (Hadoop/Spark), and quantitative modeling.",
      uz: "Machine learning, neyron tarmoqlar, Big Data va statistik modellashtirish bo'yicha ilg'or magistratura."
    },
    requirements: [
      "BSc in Computer Science, Math, or Physics",
      "Programming knowledge (Python, C++ or Java)",
      "English B2/C1"
    ],
    documents: ["BSc diploma + Apostille", "Transcripts", "CV", "Passport"],
    mode: "Full-time"
  },
  {
    id: "bio-uj",
    name: "Biotechnology & Molecular Biology",
    university: "Jagiellonian University",
    uniId: "uj",
    city: "Krak\xF3w",
    level: "Bachelor",
    field: "Science",
    lang: "English",
    tuition: "8,000 PLN / year (~1,900 EUR)",
    duration: "3 years",
    deadline: "June 5, 2025",
    status: "Open",
    about: {
      en: "Focus on genetic engineering, cellular biology, pharmaceutical synthesis, and industrial bioprocessing.",
      uz: "Gen muhandisligi, hujayra biologiyasi va farmatsevtika bio-texnologiyasiga yo'naltirilgan bakalavr dasturi."
    },
    requirements: [
      "High school diploma with Biology / Chemistry",
      "English proficiency B2"
    ],
    documents: ["Diploma with Apostille", "Transcripts", "Passport"],
    mode: "Full-time"
  },
  {
    id: "arch-pw",
    name: "Architecture & Urban Planning",
    university: "Warsaw University of Technology",
    uniId: "pw",
    city: "Warsaw",
    level: "Master",
    field: "Architecture",
    lang: "English",
    tuition: "11,500 PLN / year (~2,700 EUR)",
    duration: "2 years",
    deadline: "July 1, 2025",
    status: "Open",
    about: {
      en: "Accredited architectural program emphasizing sustainable urban design, BIM technology, and historic building conservation.",
      uz: "BIM texnologiyalari, barqaror shaharsozlik va me'moriy loyihalashga yo'naltirilgan nufuzli magistratura."
    },
    requirements: [
      "BSc in Architecture or Architectural Engineering",
      "Portfolio of design works",
      "English B2 certificate"
    ],
    documents: ["BSc Diploma + Apostille", "Design Portfolio (PDF)", "Passport"],
    mode: "Full-time"
  },
  {
    id: "phd-uw",
    name: "Computer Science (Doctoral School)",
    university: "University of Warsaw",
    uniId: "uw",
    city: "Warsaw",
    level: "PhD",
    field: "Technology",
    lang: "English",
    tuition: "Free (Monthly Scholarship ~4,000\u20135,500 PLN)",
    duration: "4 years",
    deadline: "July 15, 2025",
    status: "Open",
    about: {
      en: "Tuition-free PhD program with monthly government scholarship, conducting research in AI, algorithms, quantum computing, and cryptography.",
      uz: "Mutlaqo bepul doktorantura va har oylik 4,000-5,500 PLN stipendiya; AI va kvant hisoblash bo'yicha ilmiy tadqiqotlar."
    },
    requirements: [
      "Master's degree in CS, Math or related discipline",
      "Research proposal & potential supervisor agreement",
      "English C1 proficiency"
    ],
    documents: ["Master diploma + Apostille", "Research Proposal", "CV & Publications", "Passport"],
    mode: "Full-time"
  }
];

// src/bot/utils/paywall.ts
import { InlineKeyboard as InlineKeyboard2 } from "grammy";
async function checkPremiumAccess(ctx, user, featureName) {
  if (user.isPremium) {
    return true;
  }
  const isUz = user.lang === "uz";
  const name = typeof featureName === "object" ? isUz ? featureName.uz : featureName.en : featureName;
  const text = isUz ? `\u{1F512} <b>VIP Premium Xizmat Talab Qilinadi</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
<b>${escapeHtml(name)}</b> xizmatidan foydalanish faqat <b>PTU Premium A'zolari</b> uchun mavjud.

\u{1F31F} <b>Premium A'zolik Imtiyozlari:</b>
\u2022 \u{1F3DB}\uFE0F Universitetga to'g'ridan-to'g'ri ariza topshirish va qabulni nazorat qilish
\u2022 \u{1F4C1} Rasmiy maslahatchilar tomonidan hujjatlarni to'liq tekshirish va tasdiqlash
\u2022 \u{1F3DB}\uFE0F Rasmiy NAWA SYRENA nostrifikatsiyasi va Polsha qasamyodli tarjimasi (T\u0142umacz Przysi\u0119g\u0142y)
\u2022 \u270D\uFE0F Barcha kirish imtihonlari va fan testlariga to'liq kirish
\u2022 \u{1F4AC} Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa

\u{1F4A1} <i>Agar sizda faollashtirish kodi bo'lsa, pastdagi "Promokodni Faollashtirish" tugmasini bosing:</i>` : `\u{1F512} <b>VIP Premium Feature Required</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Access to <b>${escapeHtml(name)}</b> is available exclusively for <b>PTU Premium Members</b>.

\u{1F31F} <b>What You Get with Premium Access:</b>
\u2022 \u{1F3DB}\uFE0F Direct University Application Filing & Dossier Submission
\u2022 \u{1F4C1} Certified Document Verification by Licensed Admissions Advisors
\u2022 \u{1F3DB}\uFE0F Official NAWA Legalization & Sworn Translation (T\u0142umacz Przysi\u0119g\u0142y)
\u2022 \u270D\uFE0F Full University Entrance & Placement Exam Preparations
\u2022 \u{1F4AC} 1-on-1 Personal Admissions Consultant Support

\u{1F4A1} <i>If you have purchased an activation code, tap "Activate Code" below:</i>`;
  const kb = new InlineKeyboard2().text(isUz ? "\u{1F511} Promokodni Faollashtirish" : "\u{1F511} Activate Access Code", "premium_enter_code").row().url(isUz ? "\u{1F4AC} Maslahatchidan Kod Olish" : "\u{1F4AC} Get Access Code from Advisor", "https://t.me/poland_admissions_bot").row().text(isUz ? "\u{1F3E0} Bosh Menyu" : "\u{1F3E0} Main Menu", "go_main_menu");
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({
      text: isUz ? "\u{1F512} VIP Premium Xizmat Talab Qilinadi" : "\u{1F512} VIP Premium Feature Required"
    });
  }
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: kb
  });
  return false;
}

// src/bot/handlers/programHandler.ts
function setupProgramHandler(bot) {
  const userFilters = /* @__PURE__ */ new Map();
  const handleProgramsMenu = async (ctx, page = 0) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const filter = userFilters.get(userId) || {};
    let filtered = programs;
    if (filter.level) {
      filtered = filtered.filter((p) => p.level.toLowerCase() === filter.level?.toLowerCase());
    }
    if (filter.city) {
      filtered = filtered.filter((p) => p.city.toLowerCase() === filter.city?.toLowerCase());
    }
    if (filter.field) {
      filtered = filtered.filter((p) => p.field.toLowerCase().includes(filter.field?.toLowerCase() || ""));
    }
    if (filter.uniId) {
      filtered = filtered.filter((p) => p.uniId === filter.uniId);
    }
    const pageSize = 5;
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const pageItems = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
    let filterSummary = "";
    if (Object.keys(filter).length > 0) {
      filterSummary = isUz ? `
\u{1F50D} <i>Faol filtrlar: ${Object.values(filter).filter(Boolean).join(", ")}</i>` : `
\u{1F50D} <i>Active filters: ${Object.values(filter).filter(Boolean).join(", ")}</i>`;
    }
    const title = isUz ? `\u{1F4DA} <b>Polshadagi Ta'lim Dasturlari (${filtered.length} ta mavjud)</b>${filterSummary}

Quyidagi yo'nalishlardan birini tanlang yoki filtrlardan foydalaning:` : `\u{1F4DA} <b>Degree Programs in Poland (${filtered.length} available)</b>${filterSummary}

Select a program below to view admissions criteria, tuition, and apply:`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, {
          parse_mode: "HTML",
          reply_markup: getProgramsListKeyboard(user.lang, pageItems, safePage, totalPages)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(title, {
      parse_mode: "HTML",
      reply_markup: getProgramsListKeyboard(user.lang, pageItems, safePage, totalPages)
    });
  };
  bot.command("programs", async (ctx) => handleProgramsMenu(ctx));
  bot.callbackQuery("menu_progs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx);
  });
  bot.hears([/.*Degree Programs.*/i, /.*Ta'lim Dasturlari.*/i, /.*Programs.*/i], async (ctx) => handleProgramsMenu(ctx));
  bot.callbackQuery(/^progs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^progs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx, page);
  });
  bot.callbackQuery("progs_filter_menu", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const filter = userFilters.get(userId) || {};
    const isUz = user.lang === "uz";
    const text = isUz ? `\u{1F50D} <b>Ta'lim Dasturlarini Saralash (Filtr):</b>

\u2022 Bosqich: <b>${filter.level || "Barchasi"}</b>
\u2022 Shahar: <b>${filter.city || "Barchasi"}</b>
\u2022 Yo'nalish: <b>${filter.field || "Barchasi"}</b>

Quyidagi mezonlardan birini tanlang:` : `\u{1F50D} <b>Filter Degree Programs:</b>

\u2022 Level: <b>${filter.level || "All"}</b>
\u2022 City: <b>${filter.city || "All"}</b>
\u2022 Field: <b>${filter.field || "All"}</b>

Choose a criteria below:`;
    await ctx.answerCallbackQuery();
    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: getProgramsFilterKeyboard(user.lang, filter)
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: getProgramsFilterKeyboard(user.lang, filter)
      });
    }
  });
  bot.callbackQuery(/^filter_level_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_level_(.+)$/);
    if (!match) return;
    const level = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, level: level === "all" ? void 0 : level });
    await ctx.answerCallbackQuery({ text: `Filter: ${level}` });
    await handleProgramsMenu(ctx);
  });
  bot.callbackQuery(/^filter_city_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_city_(.+)$/);
    if (!match) return;
    const city = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, city: city === "all" ? void 0 : city });
    await ctx.answerCallbackQuery({ text: `City: ${city}` });
    await handleProgramsMenu(ctx);
  });
  bot.callbackQuery(/^filter_field_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_field_(.+)$/);
    if (!match) return;
    const field = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, field: field === "all" ? void 0 : field });
    await ctx.answerCallbackQuery({ text: `Field: ${field}` });
    await handleProgramsMenu(ctx);
  });
  bot.callbackQuery("filter_clear", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      userFilters.delete(userId);
    }
    await ctx.answerCallbackQuery({ text: "Filters cleared" });
    await handleProgramsMenu(ctx);
  });
  bot.callbackQuery(/^view_prog_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^view_prog_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const prog = programs.find((p) => p.id === progId);
    if (!prog) {
      await ctx.answerCallbackQuery({ text: isUz ? "Dastur topilmadi" : "Program not found" });
      return;
    }
    const isSaved = (user.savedPrograms || []).includes(prog.id);
    const desc = prog.about[user.lang] || prog.about.en;
    const reqsList = prog.requirements.map((r) => `  \u2022 ${escapeHtml(r)}`).join("\n");
    const docsList = prog.documents.map((d) => `  \u2022 ${escapeHtml(d)}`).join("\n");
    const text = isUz ? `\u{1F4D8} <b>${escapeHtml(prog.name)}</b>
\u{1F3DB}\uFE0F <b>${escapeHtml(prog.university)}</b> (${escapeHtml(prog.city)})

\u{1F4DD} ${escapeHtml(desc)}

\u{1F4CA} <b>Dastur Tafsilotlari:</b>
\u2022 \u{1F393} Ta'lim Darajasi: <b>${escapeHtml(prog.level)}</b>
\u2022 \u{1F5E3}\uFE0F O'qitish Tili: <b>${escapeHtml(prog.lang)}</b>
\u2022 \u23F1\uFE0F Davomiyligi: <b>${escapeHtml(prog.duration)}</b>
\u2022 \u{1F4B0} Kontrakt To'lovi: <b>${escapeHtml(prog.tuition)}</b>
\u2022 \u{1F4C5} Qabul Muddati: <b>${escapeHtml(prog.deadline)}</b>
\u2022 \u{1F7E2} Qabul Holati: <b>${escapeHtml(prog.status)}</b>

\u{1F4CB} <b>Qabul Talablari:</b>
${reqsList}

\u{1F4D1} <b>Zarur Hujjatlar:</b>
${docsList}` : `\u{1F4D8} <b>${escapeHtml(prog.name)}</b>
\u{1F3DB}\uFE0F <b>${escapeHtml(prog.university)}</b> (${escapeHtml(prog.city)})

\u{1F4DD} ${escapeHtml(desc)}

\u{1F4CA} <b>Program Details:</b>
\u2022 \u{1F393} Degree Level: <b>${escapeHtml(prog.level)}</b>
\u2022 \u{1F5E3}\uFE0F Language of Instruction: <b>${escapeHtml(prog.lang)}</b>
\u2022 \u23F1\uFE0F Duration: <b>${escapeHtml(prog.duration)}</b>
\u2022 \u{1F4B0} Tuition: <b>${escapeHtml(prog.tuition)}</b>
\u2022 \u{1F4C5} Application Deadline: <b>${escapeHtml(prog.deadline)}</b>
\u2022 \u{1F7E2} Status: <b>${escapeHtml(prog.status)}</b>

\u{1F4CB} <b>Admission Requirements:</b>
${reqsList}

\u{1F4D1} <b>Required Documents:</b>
${docsList}`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getProgramDetailKeyboard(user.lang, prog.id, isSaved)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getProgramDetailKeyboard(user.lang, prog.id, isSaved)
    });
  });
  bot.callbackQuery(/^toggle_save_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^toggle_save_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isSaved = db.toggleSaveProgram(userId, progId);
    await ctx.answerCallbackQuery({
      text: isSaved ? t(user.lang, "prog_saved_success") : t(user.lang, "prog_unsaved_success")
    });
    try {
      await ctx.editMessageReplyMarkup({
        reply_markup: getProgramDetailKeyboard(user.lang, progId, isSaved)
      });
    } catch {
    }
  });
  bot.callbackQuery(/^apply_prog_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^apply_prog_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "Direct University Application Submission",
      uz: "Universitetga To'g'ridan-to'g'ri Ariza Topshirish"
    });
    if (!hasAccess) return;
    const prog = programs.find((p) => p.id === progId);
    if (!prog) return;
    db.createApplication(userId, prog.id, prog.name, prog.university, prog.city);
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F389} <b>${escapeHtml(prog.name)} Dasturiga Ariza Muvaffaqiyatli Topshirildi!</b>

\u{1F3DB}\uFE0F <b>Universitet:</b> ${escapeHtml(prog.university)} (${escapeHtml(prog.city)})
\u{1F4C5} <b>Qabul Muddati:</b> ${escapeHtml(prog.deadline)}
\u{1F4CC} <b>Holati:</b> Topshirildi (Maslahatchi tekshiruvida)

\u{1F449} Keyingi qadam: <b>Hujjatlar Nazorati</b> bo'limiga kiring va barcha zarur hujjatlaringizni yuklang.` : `\u{1F389} <b>Application Submitted for ${escapeHtml(prog.name)}!</b>

\u{1F3DB}\uFE0F <b>University:</b> ${escapeHtml(prog.university)} (${escapeHtml(prog.city)})
\u{1F4C5} <b>Deadline:</b> ${escapeHtml(prog.deadline)}
\u{1F4CC} <b>Status:</b> Submitted (Awaiting Advisor Verification)

\u{1F449} Next Step: Upload your documents in the <b>Document Checklist</b> menu so advisors can verify your dossier.`;
    await ctx.reply(text, { parse_mode: "HTML" });
  });
  bot.callbackQuery("back_to_progs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx);
  });
}

// src/bot/data/nawaGuide.ts
var nawaGuide = {
  title: {
    en: "\u{1F3DB}\uFE0F NAWA Document Legalization & Recognition Guide",
    uz: "\u{1F3DB}\uFE0F NAWA Hujjatlarni Tan Olish (Nostrifikatsiya) Qo'llanmasi"
  },
  overview: {
    en: `<b>What is NAWA?</b>
NAWA (<i>Narodowa Agencja Wymiany Akademickiej</i>) is the Polish National Agency for Academic Exchange. It evaluates foreign educational certificates and higher education diplomas for official recognition across all Polish universities and institutions.

<b>Who needs NAWA?</b>
\u2022 If your high school diploma or university degree was issued <b>outside the EU/EEA/OECD</b> (e.g. Uzbekistan, Kazakhstan, Azerbaijan, Turkey, Middle East, India, etc.), you generally require NAWA recognition or KRA (Kuratorium O\u015Bwiaty) nostrification.`,
    uz: `<b>NAWA o'zi nima?</b>
NAWA (<i>Narodowa Agencja Wymiany Akademickiej</i>) \u2014 Polsha Milliy Akademik Almashinuv Agentligi hisoblanadi. U xorijiy davlatlarda olingan attestat va diplomlarni Polsha universitetlarida o'qish uchun rasman tan olish (nostrifikatsiya) bilan shug'ullanadi.

<b>Kimlarga NAWA kerak?</b>
\u2022 Agar sizning maktab attestatingiz yoki bakalavr diplomingiz <b>Yevropa Ittifoqidan tashqarida</b> (masalan: O'zbekiston, Qozog'iston, Ozarbayjon, Turkiya va b.) berilgan bo'lsa, sizga NAWA yoki Kuratorium O\u015Bwiaty orqali diplomni tan oldirish talab qilinadi.`
  },
  steps: [
    {
      step: 1,
      title: {
        en: "1. Apostille or Legalization in Home Country",
        uz: "1. Vataningizda Apostil yoki Legalizatsiya qo'ydirish"
      },
      desc: {
        en: "Get an Apostille stamp on your original diploma and transcripts from the Ministry of Foreign Affairs / Ministry of Justice / Education Inspectorate in your country.",
        uz: "Original attestat/diplom va baholar ilovasiga Adliya vazirligi yoki Ta'lim inspeksiyasi orqali Apostil muhri qo'ydiring."
      }
    },
    {
      step: 2,
      title: {
        en: "2. Sworn Polish Translation (T\u0142umacz Przysi\u0119g\u0142y)",
        uz: "2. Qasamyodli polyakcha tarjima (T\u0142umacz Przysi\u0119g\u0142y)"
      },
      desc: {
        en: "Translate the apostilled diploma into Polish using a Polish Sworn Translator registered with the Polish Ministry of Justice or at the Polish Embassy.",
        uz: "Apostil qo'yilgan hujjatlarni Polsha Adliya vazirligi ro'yxatidan o'tgan rasmiy qasamyodli tarjimon (T\u0142umacz Przysi\u0119g\u0142y) orqali polyak tiliga tarjima qildiring."
      }
    },
    {
      step: 3,
      title: {
        en: "3. Submit Application to NAWA (SYRENA System)",
        uz: "3. NAWA SYRENA tizimi orqali ariza topshirish"
      },
      desc: {
        en: "Create an account on the NAWA SYRENA portal (kwalifikator.nawa.gov.pl), fill out personal and academic data, and upload clean PDF scans.",
        uz: "NAWA SYRENA portalida profil ochib, shaxsiy va ta'lim ma'lumotlarini to'ldiring hamda hujjatlarning sifatli PDF nusxalarini yuklang."
      }
    },
    {
      step: 4,
      title: {
        en: "4. Pay the Evaluation Fee",
        uz: "4. Baholash to'lovini amalga oshirish"
      },
      desc: {
        en: "The standard evaluation fee is <b>200 PLN</b> (~45 EUR). Payment is done online via card or bank transfer.",
        uz: "Standart ekspertiza badali <b>200 PLN</b> (~45 EUR). To'lov karta yoki bank o'tkazmasi orqali onlayn to'lanadi."
      }
    },
    {
      step: 5,
      title: {
        en: "5. Receive the Official Recognition Certificate",
        uz: "5. Rasmiy tan olish sertifikatini qabul qilish"
      },
      desc: {
        en: "Processing takes <b>3 to 6 weeks</b>. You will receive an official electronic certificate with digital signature, valid for all Polish universities.",
        uz: "Ko'rib chiqish muddati <b>3 dan 6 haftagacha</b>. Sizga barcha Polsha universitetlari uchun o'tadigan elektron imzolangan sertifikat beriladi."
      }
    }
  ],
  faq: [
    {
      q: {
        en: "Do I need NAWA before applying to the university?",
        uz: "Universitetga hujjat topshirishdan oldin NAWA tayyor bo'lishi shartmi?"
      },
      a: {
        en: "Most universities give conditional acceptance and allow you to submit NAWA / Nostrification during the 1st semester (until October-December).",
        uz: "Ko'pchilik universitetlar shartli qabul (Conditional Offer) beradi va NAWA sertifikatini 1-semestr davomida (oktabr-dekabrgacha) topshirishga ruxsat beradi."
      }
    },
    {
      q: {
        en: "Can PTU advisors help me prepare the NAWA package?",
        uz: "PTU maslahatchilari NAWA hujjatlarimni tayyorlashda yordam bera oladimi?"
      },
      a: {
        en: "Yes! Premium members get full assistance with certified translations, document checking, and NAWA portal submission.",
        uz: "Ha! Premium a'zolarimizga hujjatlarni tekshirish, polyakcha tarjima va NAWA portaliga to'g'ri topshirish bo'yicha to'liq ko'mak beriladi."
      }
    }
  ]
};

// src/bot/handlers/nawaHandler.ts
function setupNawaHandler(bot) {
  const handleNawaMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const title = nawaGuide.title[user.lang] || nawaGuide.title.en;
    const overview = nawaGuide.overview[user.lang] || nawaGuide.overview.en;
    const text = isUz ? `\u{1F3DB}\uFE0F <b>${escapeHtml(title)}</b>

${overview}

\u{1F447} <i>Batafsil ma'lumot olish yoki arizangizni ro'yxatdan o'tkazish uchun pastdagi bo'limlardan birini tanlang:</i>` : `\u{1F3DB}\uFE0F <b>${escapeHtml(title)}</b>

${overview}

\u{1F447} <i>Select an option below to learn more or register your document dossier:</i>`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang)
    });
  };
  bot.command("nawa", async (ctx) => handleNawaMenu(ctx));
  bot.callbackQuery("menu_nawa", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleNawaMenu(ctx);
  });
  bot.hears([/.*NAWA.*/i, /.*Nostrifikatsiya.*/i], async (ctx) => handleNawaMenu(ctx));
  bot.callbackQuery("nawa_view_steps", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    let text = isUz ? `\u{1F3DB}\uFE0F <b>NAWA Nostrifikatsiya Bosqichlari va Yo'l Xaritasi:</b>

` : `\u{1F3DB}\uFE0F <b>NAWA Legalization Roadmap & Steps:</b>

`;
    nawaGuide.steps.forEach((s) => {
      const stepTitle = s.title[user.lang] || s.title.en;
      const stepDesc = s.desc[user.lang] || s.desc.en;
      text += `<b>${escapeHtml(stepTitle)}</b>
${escapeHtml(stepDesc)}

`;
    });
    text += isUz ? `\u{1F4B0} <b>Davlat Boji:</b> 200 PLN (~45 EUR)
\u23F1\uFE0F <b>Ko'rib Chiqish Muddati:</b> 3-6 hafta` : `\u{1F4B0} <b>Fee:</b> 200 PLN (~45 EUR)
\u23F1\uFE0F <b>Processing Time:</b> 3-6 weeks`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang)
    });
  });
  bot.callbackQuery("nawa_check_eligibility", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const text = isUz ? `\u{1F50D} <b>Menga NAWA Nostrifikatsiyasi Kerakmi?</b>

\u2705 <b>HA, sizga NAWA/Kuratorium talab qilinadi, agar:</b>
\u2022 Attestat yoki universitetingiz diplomi Yevropa Ittifoqi/Iqtisodiy Hamkorlik Tashkilotidan tashqarida berilgan bo'lsa (masalan: <b>O'zbekiston, Qozog'iston, Ozarbayjon, Turkiya, BAA</b>).
\u2022 Polsha davlat yoki xususiy universitetlariga o'qishga topshirayotgan bo'lsangiz.

\u274C <b>Sizga NAWA kerak EMAS, agar:</b>
\u2022 Diplomingiz <b>Yevropa Ittifoqi (EU / EEA / OECD)</b> davlatlarida berilgan bo'lsa.
\u2022 Sizda <b>International Baccalaureate (IB)</b> yoki <b>European Baccalaureate (EB)</b> xalqaro diplomi bo'lsa.` : `\u{1F50D} <b>Do I need NAWA Recognition?</b>

\u2705 <b>YES, you NEED NAWA/Kuratorium if:</b>
\u2022 Your high school diploma or university degree was issued outside the EU/EEA/OECD (e.g. <b>Uzbekistan, Kazakhstan, Azerbaijan, Turkey, Iran, India, UAE</b>).
\u2022 You are applying for Polish public or private university admissions.

\u274C <b>You DO NOT need NAWA if:</b>
\u2022 Your diploma was issued in the <b>EU / EEA / OECD</b> countries.
\u2022 You hold an <b>International Baccalaureate (IB)</b> or <b>European Baccalaureate (EB)</b> diploma.`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang)
    });
  });
  bot.callbackQuery("nawa_faq", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    let text = isUz ? `\u2753 <b>NAWA va Nostrifikatsiya Bo'yicha Tez-tez Beriladigan Savollar:</b>

` : `\u2753 <b>NAWA Legalization FAQ:</b>

`;
    nawaGuide.faq.forEach((f, idx) => {
      const q = f.q[user.lang] || f.q.en;
      const a = f.a[user.lang] || f.a.en;
      text += `<b>${idx + 1}. ${escapeHtml(q)}</b>
${escapeHtml(a)}

`;
    });
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang)
    });
  });
  bot.callbackQuery("nawa_apply_wizard", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "NAWA SYRENA Legalization Assistance Dossier",
      uz: "NAWA SYRENA Nostrifikatsiya Huquqiy Ko'magi"
    });
    if (!hasAccess) return;
    db.createNawaApplication(userId, {
      country: user.country || "Uzbekistan",
      passportNumber: "Pending Upload",
      diplomaLink: "Pending Upload"
    });
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F3DB}\uFE0F <b>NAWA Nostrifikatsiya Hujjatlar Paketi Ro'yxatdan O'tkazildi!</b>

\u2022 \u{1F4CB} Qabul Koordinatoringiz: <b>PTU Legal Team</b>
\u2022 \u{1F4CC} Holati: <b>Hujjatlarni Qabul Qilish</b>

Iltimos, <b>Hujjatlar Nazorati</b> menyusidan pasport va diplomingizni yuklang!` : `\u{1F3DB}\uFE0F <b>NAWA Legalization Dossier Initiated!</b>

\u2022 \u{1F4CB} Assigned Advisor: <b>PTU Legal Team</b>
\u2022 \u{1F4CC} Status: <b>Dossier Opened</b>

Please proceed to the <b>Document Checklist</b> menu to submit your scans!`;
    await ctx.reply(text, { parse_mode: "HTML" });
  });
}

// src/bot/handlers/documentHandler.ts
function setupDocumentHandler(bot) {
  const handleDocumentsMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "Document Checklist & Advisor Verification",
      uz: "Hujjatlar Nazorati va Qabul Hujjatlarini Tekshirish"
    });
    if (!hasAccess) return;
    const docDefs = db.getDocumentDefinitions();
    const docs = user.documents || {};
    const totalCount = Object.keys(docDefs).length;
    const approvedCount = Object.values(docs).filter((d) => d.status === "approved").length;
    const reviewingCount = Object.values(docs).filter((d) => d.status === "reviewing").length;
    const filled = totalCount > 0 ? Math.max(0, Math.min(10, Math.round(approvedCount / totalCount * 10))) : 0;
    const progressBar = "\u{1F7E9}".repeat(filled) + "\u2B1C".repeat(10 - filled);
    const text = isUz ? `\u{1F4C1} <b>Hujjatlar Nazorati va Holati</b>

\u{1F4CA} <b>Hujjatlar Tayyorgarligi:</b>
${progressBar} <b>${approvedCount}/${totalCount} Tasdiqlangan</b>
\u2022 \u2705 Tasdiqlangan: <b>${approvedCount}</b> ta
\u2022 \u{1F7E1} Tekshiruvda: <b>${reviewingCount}</b> ta

<i>Talablarni ko'rish, PDF/rasm yuklash yoki havola yuborish uchun pastdagi hujjatlardan birini tanlang:</i>` : `\u{1F4C1} <b>Document Verification Checklist</b>

\u{1F4CA} <b>Readiness Progress:</b>
${progressBar} <b>${approvedCount}/${totalCount} Verified</b>
\u2022 \u2705 Approved: <b>${approvedCount}</b>
\u2022 \u{1F7E1} In Review: <b>${reviewingCount}</b>

<i>Tap any document below to inspect requirements, upload a PDF/photo, or submit a cloud link:</i>`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getDocumentsKeyboard(user.lang, docs, docDefs)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getDocumentsKeyboard(user.lang, docs, docDefs)
    });
  };
  bot.command("documents", async (ctx) => handleDocumentsMenu(ctx));
  bot.callbackQuery("menu_docs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleDocumentsMenu(ctx);
  });
  bot.hears([/.*Document Checklist.*/i, /.*Hujjatlar.*/i, /.*Documents.*/i], async (ctx) => handleDocumentsMenu(ctx));
  bot.callbackQuery(/^doc_action_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^doc_action_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const docDef = db.getDocumentDefinition(docKey);
    const userDoc = user.documents?.[docKey] || { status: "missing" };
    const statusLabel = isUz ? userDoc.status === "approved" ? "\u2705 QABUL QILINDI VA TASDIQLANDI" : userDoc.status === "reviewing" ? "\u{1F7E1} MASLAHATCHI TEKSHIRUVIDA" : userDoc.status === "needs_correction" ? "\u{1F534} TUZATISH TALAB ETILADI" : "\u26AA YUKLANMAGAN" : userDoc.status === "approved" ? "\u2705 APPROVED & VERIFIED" : userDoc.status === "reviewing" ? "\u{1F7E1} UNDER ADVISOR REVIEW" : userDoc.status === "needs_correction" ? "\u{1F534} CORRECTION REQUIRED" : "\u26AA NOT UPLOADED YET";
    const docName = docDef ? docDef.name[user.lang] || docDef.name.en : docKey;
    const docDesc = docDef ? docDef.desc[user.lang] || docDef.desc.en : "";
    const reqText = isUz ? docDef?.required ? "Majburiy" : "Ixtiyoriy" : docDef?.required ? "Mandatory" : "Optional";
    let text = isUz ? `\u{1F4C4} <b>${escapeHtml(docName)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F4CC} <b>Holati:</b> <code>${statusLabel}</code>
\u2022 \u2B50 <b>Talab darajasi:</b> ${reqText}

\u{1F4DD} <b>Yo'riqnoma va Talablar:</b>
${escapeHtml(docDesc)}

` : `\u{1F4C4} <b>${escapeHtml(docName)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F4CC} <b>Status:</b> <code>${statusLabel}</code>
\u2022 \u2B50 <b>Requirement:</b> ${reqText}

\u{1F4DD} <b>Guide & Specifications:</b>
${escapeHtml(docDesc)}

`;
    if (userDoc.link) {
      text += isUz ? `\u{1F517} <b>Yuborilgan havola:</b> <a href="${escapeHtml(userDoc.link)}">${escapeHtml(userDoc.link)}</a>

` : `\u{1F517} <b>Submitted Link:</b> <a href="${escapeHtml(userDoc.link)}">${escapeHtml(userDoc.link)}</a>

`;
    }
    if (userDoc.fileId) {
      text += isUz ? `\u{1F4C1} <b>Yuklangan fayl:</b> <code>${escapeHtml(userDoc.fileName || "Hujjat fayli")}</code>

` : `\u{1F4C1} <b>Uploaded File:</b> <code>${escapeHtml(userDoc.fileName || "Document file")}</code>

`;
    }
    if (userDoc.feedbackNote) {
      text += isUz ? `\u{1F4AC} <b>Maslahatchi Izohi:</b>
<i>"${escapeHtml(userDoc.feedbackNote)}"</i>

` : `\u{1F4AC} <b>Counselor Feedback Note:</b>
<i>"${escapeHtml(userDoc.feedbackNote)}"</i>

`;
    }
    text += isUz ? `\u{1F447} <i>PDF fayl yuborish, rasm yuklash yoki havola kiritish uchun pastdagi tugmani bosing:</i>` : `\u{1F447} <i>Tap below to upload a PDF, send a photo, or paste a link:</i>`;
    const kb = {
      inline_keyboard: isUz ? [
        [{ text: "\u{1F4E4} Hujjat yoki Havola Yuborish", callback_data: `doc_upload_prompt_${docKey}` }],
        [{ text: "\u25C0\uFE0F Hujjatlar Ro'yxatiga Qaytish", callback_data: "back_to_docs" }]
      ] : [
        [{ text: "\u{1F4E4} Upload / Send File or Link", callback_data: `doc_upload_prompt_${docKey}` }],
        [{ text: "\u25C0\uFE0F Back to Documents", callback_data: "back_to_docs" }]
      ]
    };
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });
  bot.callbackQuery(/^doc_upload_prompt_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^doc_upload_prompt_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "Certified Document Verification & Counselor Review",
      uz: "Hujjatlarni Rasmiy Tekshirish va Maslahatchi Tasdig'i"
    });
    if (!hasAccess) return;
    const docDef = db.getDocumentDefinition(docKey);
    const docName = docDef ? docDef.name[user.lang] || docDef.name.en : docKey;
    db.setWaitingFor(userId, "document_upload", { docKey });
    await ctx.answerCallbackQuery();
    const promptText = isUz ? `\u{1F4E4} <b>${escapeHtml(docName)} hujjatini yuklash:</b>

Siz quyidagi usullardan birini tanlashingiz mumkin:
1. \u{1F4C1} <b>PDF yoki DOCX fayl</b> yuboring
2. \u{1F5BC}\uFE0F <b>Sifatli fotosurat</b> yuboring
3. \u{1F517} <b>Google Drive / OneDrive havolasini</b> yozib yuboring

<i>Hujjat fayli yoki havolani shu yerga yuboring:</i>` : `\u{1F4E4} <b>Upload ${escapeHtml(docName)}:</b>

You can:
1. \u{1F4C1} <b>Send a Document directly</b> (PDF, DOCX, etc.)
2. \u{1F5BC}\uFE0F <b>Send a Photo scan</b> from your gallery
3. \u{1F517} <b>Paste a shareable link</b> (Google Drive, OneDrive, Dropbox)

<i>Send your file or link in the chat now:</i>`;
    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("back_to_docs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleDocumentsMenu(ctx);
  });
}

// src/bot/data/exams.ts
var examSubjects = [
  {
    id: "pol-lang-b1",
    name: {
      en: "Polish Language \u2014 B1 Practice",
      uz: "Polyak tili \u2014 B1 Imtihon testi"
    },
    category: "Language",
    level: "B1",
    timeMinutes: 20,
    questions: [
      {
        id: 1,
        q: {
          en: "Wybierz poprawne s\u0142owo: 'Codziennie rano _____ kaw\u0119 i jem \u015Bniadanie.'",
          uz: "To'g'ri so'zni tanlang: 'Codziennie rano _____ kaw\u0119 i jem \u015Bniadanie.'"
        },
        options: ["pij\u0119", "pijesz", "pij\u0105", "pijemy"],
        correct: "pij\u0119",
        explanation: {
          en: "The first-person singular form of 'pi\u0107' in the present tense is 'pij\u0119' (I drink).",
          uz: "'Pi\u0107' (ichmoq) fe'lining 1-shaxs birlikdagi hozirgi zamon shakli 'pij\u0119' bo'ladi."
        }
      },
      {
        id: 2,
        q: {
          en: "Kt\xF3ra forma jest poprawna? 'Id\u0119 do _____ po chleb.'",
          uz: "Qaysi shakl to'g'ri? 'Id\u0119 do _____ po chleb.'"
        },
        options: ["sklepu", "sklep", "sklepie", "sklepem"],
        correct: "sklepu",
        explanation: {
          en: "The preposition 'do' requires Genitive case (Dope\u0142niacz): 'do sklepu'.",
          uz: "'Do' predlogidan keyin qaratqich kelishigi (Genitive) ishlatiladi: 'do sklepu'."
        }
      },
      {
        id: 3,
        q: {
          en: "Jak powiedzie\u0107 'Dzi\u0119kuj\u0119 bardzo' po angielsku?",
          uz: "'Dzi\u0119kuj\u0119 bardzo' iborasi qanday ma'noni bildiradi?"
        },
        options: ["Thank you very much / Katta rahmat", "Please / Iltimos", "Excuse me / Kechirasiz", "Good morning / Xayrli tong"],
        correct: "Thank you very much / Katta rahmat",
        explanation: {
          en: "'Dzi\u0119kuj\u0119 bardzo' means 'Thank you very much'.",
          uz: "'Dzi\u0119kuj\u0119 bardzo' \u2014 'Katta rahmat' degan ma'noni beradi."
        }
      },
      {
        id: 4,
        q: {
          en: "Wybierz liczb\u0119 mnog\u0105 dla s\u0142owa 'student':",
          uz: "'Student' so'zining ko'plik shakli qaysi?"
        },
        options: ["studenci", "studenty", "studenty", "studentowie"],
        correct: "studenci",
        explanation: {
          en: "Masculine personal plural of 'student' is 'studenci'.",
          uz: "'Student' otining erkak jinsi ko'plik shakli 'studenci' bo'ladi."
        }
      },
      {
        id: 5,
        q: {
          en: "Gdzie znajduje si\u0119 Wawel?",
          uz: "Vavel qal'asi (Wawel) qaysi shaharda joylashgan?"
        },
        options: ["w Krakowie", "w Warszawie", "we Wroc\u0142awiu", "w Gda\u0144sku"],
        correct: "w Krakowie",
        explanation: {
          en: "Wawel Castle is the historic royal castle located in Krak\xF3w.",
          uz: "Vavel qal'asi Polshaning qadimiy poytaxti Krakov shahrida joylashgan."
        }
      }
    ]
  },
  {
    id: "math-entrance",
    name: {
      en: "Mathematics Entrance Exam Prep",
      uz: "Matematika \u2014 Kirish imtihoniga tayyorgarlik"
    },
    category: "Entrance",
    level: "University Entrance",
    timeMinutes: 25,
    questions: [
      {
        id: 1,
        q: {
          en: "If f(x) = 2x\xB2 - 4x + 5, what is the minimum value of f(x)?",
          uz: "Agar f(x) = 2x\xB2 - 4x + 5 bo'lsa, funksiyaning eng kichik qiymati nechaga teng?"
        },
        options: ["3", "5", "1", "-3"],
        correct: "3",
        explanation: {
          en: "Vertex occurs at x = -b/(2a) = 4/(4) = 1. f(1) = 2(1) - 4(1) + 5 = 3.",
          uz: "Parabola uchi x = -b/(2a) = 4/4 = 1 nuqtada. f(1) = 2(1) - 4 + 5 = 3."
        }
      },
      {
        id: 2,
        q: {
          en: "What is the derivative of f(x) = ln(x\xB2 + 1)?",
          uz: "f(x) = ln(x\xB2 + 1) funksiyaning hosilasi nima?"
        },
        options: ["2x / (x\xB2 + 1)", "1 / (x\xB2 + 1)", "2x(x\xB2 + 1)", "x / (x\xB2 + 1)"],
        correct: "2x / (x\xB2 + 1)",
        explanation: {
          en: "By chain rule, d/dx[ln(u)] = u'/u = (2x)/(x\xB2 + 1).",
          uz: "Zanjir qoidasiga ko'ra: (ln u)' = u'/u = 2x / (x\xB2 + 1)."
        }
      },
      {
        id: 3,
        q: {
          en: "Solve the equation: log\u2082(x - 3) = 4",
          uz: "Tenglamani yeching: log\u2082(x - 3) = 4"
        },
        options: ["19", "16", "11", "7"],
        correct: "19",
        explanation: {
          en: "x - 3 = 2\u2074 = 16 => x = 19.",
          uz: "x - 3 = 2\u2074 = 16 => x = 19."
        }
      },
      {
        id: 4,
        q: {
          en: "What is the sum of the infinite geometric series: 6 + 3 + 1.5 + 0.75 + ...?",
          uz: "Cheksiz kamayuvchi geometrik progressiya yig'indisini toping: 6 + 3 + 1.5 + 0.75 + ..."
        },
        options: ["12", "18", "9", "15"],
        correct: "12",
        explanation: {
          en: "S = a / (1 - r) = 6 / (1 - 0.5) = 6 / 0.5 = 12.",
          uz: "S = a / (1 - q) = 6 / (1 - 0.5) = 12."
        }
      },
      {
        id: 5,
        q: {
          en: "If sin(\u03B1) = 3/5 and \u03B1 is in Quadrant I, what is cos(2\u03B1)?",
          uz: "Agar sin(\u03B1) = 3/5 bo'lsa va \u03B1 I chorakda bo'lsa, cos(2\u03B1) nimaga teng?"
        },
        options: ["7/25", "24/25", "-7/25", "16/25"],
        correct: "7/25",
        explanation: {
          en: "cos(2\u03B1) = 1 - 2sin\xB2(\u03B1) = 1 - 2(9/25) = 1 - 18/25 = 7/25.",
          uz: "cos(2\u03B1) = 1 - 2sin\xB2(\u03B1) = 1 - 2*(9/25) = 7/25."
        }
      }
    ]
  },
  {
    id: "biology-prep",
    name: {
      en: "Biology \u2014 Medical Prep Practice",
      uz: "Biologiya \u2014 Tibbiyot yo'nalishi testi"
    },
    category: "Science",
    level: "Advanced",
    timeMinutes: 20,
    questions: [
      {
        id: 1,
        q: {
          en: "Which organelle is known as the powerhouse of the cell and produces ATP?",
          uz: "Hujayraning energiya stansiyasi deb ataluvchi va ATF ishlab chiqaruvchi organoid qaysi?"
        },
        options: ["Mitochondria", "Ribosome", "Endoplasmic Reticulum", "Golgi Apparatus"],
        correct: "Mitochondria",
        explanation: {
          en: "Mitochondria perform cellular respiration to produce energy in the form of ATP.",
          uz: "Mitoxondriya hujayraviy nafas olish orqali ATF shaklida energiya ishlab chiqaradi."
        }
      },
      {
        id: 2,
        q: {
          en: "Which blood type is known as the universal donor for red blood cells?",
          uz: "Qon guruhlaridan qaysi biri eritrotsitlar bo'yicha universal donor hisoblanadi?"
        },
        options: ["O- (O negative)", "AB+ (AB positive)", "A+", "B-"],
        correct: "O- (O negative)",
        explanation: {
          en: "O negative red blood cells lack A, B, and Rh antigens, making them universal for transfusion.",
          uz: "O(I) manfiy qon guruhi A, B va rezus antigenlarga ega emasligi sababli universal donor hisoblanadi."
        }
      },
      {
        id: 3,
        q: {
          en: "DNA replication is considered:",
          uz: "DNK replikatsiyasi qanday jarayon hisoblanadi?"
        },
        options: ["Semi-conservative", "Conservative", "Dispersive", "Random"],
        correct: "Semi-conservative",
        explanation: {
          en: "DNA replication is semi-conservative: each daughter DNA molecule consists of one original and one new strand.",
          uz: "DNK replikatsiyasi yarim-konservativ usulda kechadi (bitta eski va bitta yangi zanjir)."
        }
      }
    ]
  },
  {
    id: "history-pol",
    name: {
      en: "Poland History, Geography & Culture",
      uz: "Polsha tarixi, geografiyasi va madaniyati"
    },
    category: "Culture",
    level: "General Knowledge",
    timeMinutes: 15,
    questions: [
      {
        id: 1,
        q: {
          en: "What is the capital city and currency of Poland?",
          uz: "Polshaning poytaxti va milliy valyutasi qaysi?"
        },
        options: [
          "Warsaw and Polish Z\u0142oty (PLN)",
          "Krak\xF3w and Euro (EUR)",
          "Gda\u0144sk and Koruna (CZK)",
          "Wroc\u0142aw and Forint (HUF)"
        ],
        correct: "Warsaw and Polish Z\u0142oty (PLN)",
        explanation: {
          en: "Warsaw (Warszawa) is the capital, and the currency is Polish Z\u0142oty (PLN).",
          uz: "Poytaxti \u2014 Varshava, milliy valyutasi \u2014 Polyak Zlotiyi (PLN)."
        }
      },
      {
        id: 2,
        q: {
          en: "In which year did Poland officially join the European Union (EU)?",
          uz: "Polsha qaysi yilda Yevropa Ittifoqiga (EU) rasman a'zo bo'lgan?"
        },
        options: ["2004", "1999", "2007", "2010"],
        correct: "2004",
        explanation: {
          en: "Poland joined the European Union on May 1, 2004.",
          uz: "Polsha 2004-yil 1-mayda Yevropa Ittifoqiga a'zo bo'ldi."
        }
      },
      {
        id: 3,
        q: {
          en: "Which famous Polish astronomer formulated the model of the universe that placed the Sun at the center?",
          uz: "Quyoshni koinot markaziga qo'yuvchi geliotsentrik modelni yaratgan mashhur polyak astronomi kim?"
        },
        options: ["Nicolaus Copernicus (Miko\u0142aj Kopernik)", "Marie Curie", "Fryderyk Chopin", "Jan Matejko"],
        correct: "Nicolaus Copernicus (Miko\u0142aj Kopernik)",
        explanation: {
          en: "Nicolaus Copernicus published 'De revolutionibus orbium coelestium' in 1543.",
          uz: "Nikolay Kopernik 1543-yilda koinotning geliotsentrik modelini e'lon qilgan."
        }
      }
    ]
  }
];

// src/bot/handlers/examHandler.ts
function setupExamHandler(bot) {
  const handleExamsMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "Practice Exams & University Placement Tests",
      uz: "Kirish Imtihonlari va Test Mashqlari"
    });
    if (!hasAccess) return;
    const title = t(user.lang, "exams_title");
    const choose = t(user.lang, "exam_choose_subject");
    const text = isUz ? `\u270D\uFE0F <b>Mashq Imtihonlari va Kirish Testlari</b>

Polsha universitetlarining kirish imtihonlari va til testlariga tayyorlaning:

\u{1F3AF} ${escapeHtml(choose)}` : `\u270D\uFE0F <b>Practice Exams & Placement Tests</b>

Prepare for Polish university entrance exams and language assessments:

\u{1F3AF} ${escapeHtml(choose)}`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getExamsListKeyboard(user.lang, examSubjects)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getExamsListKeyboard(user.lang, examSubjects)
    });
  };
  bot.command("exams", async (ctx) => handleExamsMenu(ctx));
  bot.callbackQuery("menu_exams", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleExamsMenu(ctx);
  });
  bot.hears([/.*Practice Exams.*/i, /.*Mashq Imtihonlari.*/i, /.*Exams.*/i], async (ctx) => handleExamsMenu(ctx));
  bot.callbackQuery(/^start_exam_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^start_exam_(.+)$/);
    if (!match) return;
    const examId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const subject = examSubjects.find((s) => s.id === examId);
    if (!subject || subject.questions.length === 0) {
      await ctx.answerCallbackQuery({ text: isUz ? "Test topilmadi" : "Test not found" });
      return;
    }
    if (examId !== "polish-b1") {
      const hasAccess = await checkPremiumAccess(ctx, user, {
        en: "Full University Entrance & Placement Exams",
        uz: "To'liq Kirish Imtihonlari va Fan Testlari"
      });
      if (!hasAccess) return;
    }
    db.updateUser(userId, {
      activeQuiz: {
        examId,
        currentQ: 0,
        answers: {},
        score: 0
      }
    });
    const firstQ = subject.questions[0];
    const subName = subject.name[user.lang] || subject.name.en;
    const qText = firstQ.q[user.lang] || firstQ.q.en;
    const text = isUz ? `\u{1F4DD} <b>${escapeHtml(subName)}</b>
\u23F1\uFE0F <b>Vaqt chegarasi:</b> ${subject.timeMinutes} daqiqa | \u{1F4CA} <b>Jami:</b> ${subject.questions.length} ta savol

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
<b>1-Savol (Jami ${subject.questions.length} tadan):</b>

\u2753 ${escapeHtml(qText)}` : `\u{1F4DD} <b>${escapeHtml(subName)}</b>
\u23F1\uFE0F <b>Time limit:</b> ${subject.timeMinutes} min | \u{1F4CA} <b>Total:</b> ${subject.questions.length} questions

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
<b>Question 1 of ${subject.questions.length}:</b>

\u2753 ${escapeHtml(qText)}`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getQuizQuestionKeyboard(firstQ.options, 0, examId)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getQuizQuestionKeyboard(firstQ.options, 0, examId)
    });
  });
  bot.callbackQuery(/^quiz_ans_([^_]+)_(\d+)_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^quiz_ans_([^_]+)_(\d+)_(\d+)$/);
    if (!match) return;
    const examId = match[1];
    const qIndex = parseInt(match[2], 10);
    const chosenOptIdx = parseInt(match[3], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const subject = examSubjects.find((s) => s.id === examId);
    if (!subject) return;
    const currentQuestion = subject.questions[qIndex];
    if (!currentQuestion) return;
    const chosenAnswer = currentQuestion.options[chosenOptIdx];
    const isCorrect = chosenAnswer === currentQuestion.correct;
    const activeQuiz = user.activeQuiz || { examId, currentQ: qIndex, answers: {}, score: 0 };
    activeQuiz.answers[qIndex] = chosenAnswer;
    if (isCorrect) activeQuiz.score += 1;
    const nextQIndex = qIndex + 1;
    activeQuiz.currentQ = nextQIndex;
    db.updateUser(userId, { activeQuiz });
    const feedbackIcon = isCorrect ? isUz ? "\u2705 To'g'ri javob!" : "\u2705 Correct!" : isUz ? "\u274C Noto'g'ri javob" : "\u274C Incorrect";
    await ctx.answerCallbackQuery({ text: feedbackIcon });
    if (nextQIndex >= subject.questions.length) {
      const percentage = Math.round(activeQuiz.score / subject.questions.length * 100);
      const passed = percentage >= 60;
      const subName2 = subject.name[user.lang] || subject.name.en;
      const finishText = isUz ? `\u{1F389} <b>${escapeHtml(subName2)} \u2014 Test Yakunlandi!</b>

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4CA} <b>Sizning Natijangiz:</b> ${activeQuiz.score} / ${subject.questions.length} (<b>${percentage}%</b>)
\u{1F4CC} <b>Xulosa:</b> ${passed ? "\u2705 MUVAFFAQIYATLI O'TDINGIZ" : "\u{1F534} KO'PROQ TAYYORGARLIK KERAK"}

` + (passed ? `\u{1F31F} Ajoyib natija! Sizning bilimlaringiz Polsha universitetlariga kirish talablariga mos keladi.` : `\u{1F4A1} Xavotir olmang! Mavzularni takrorlab, xohlagan vaqtingiz testni qayta topshirishingiz mumkin.`) : `\u{1F389} <b>${escapeHtml(subName2)} \u2014 Quiz Completed!</b>

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4CA} <b>Your Score:</b> ${activeQuiz.score} / ${subject.questions.length} (<b>${percentage}%</b>)
\u{1F4CC} <b>Result:</b> ${passed ? "\u2705 PASSED" : "\u{1F534} NEEDS MORE PRACTICE"}

` + (passed ? `\u{1F31F} Excellent job! Your knowledge aligns well with Polish university admission standards.` : `\u{1F4A1} Don't worry! Review the materials and retake the test when you feel ready.`);
      const kb = {
        inline_keyboard: isUz ? [
          [{ text: "\u{1F504} Testni Qayta Topshirish", callback_data: `start_exam_${examId}` }],
          [{ text: "\u270D\uFE0F Boshqa Testlarni Ko'rish", callback_data: "go_exams_menu" }],
          [{ text: "\u{1F3E0} Bosh Menyu", callback_data: "go_main_menu" }]
        ] : [
          [{ text: "\u{1F504} Retake This Test", callback_data: `start_exam_${examId}` }],
          [{ text: "\u270D\uFE0F Explore Other Tests", callback_data: "go_exams_menu" }],
          [{ text: "\u{1F3E0} Main Menu", callback_data: "go_main_menu" }]
        ]
      };
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(finishText, { parse_mode: "HTML", reply_markup: kb });
          return;
        } catch {
        }
      }
      await ctx.reply(finishText, { parse_mode: "HTML", reply_markup: kb });
      return;
    }
    const nextQ = subject.questions[nextQIndex];
    const subName = subject.name[user.lang] || subject.name.en;
    const qText = nextQ.q[user.lang] || nextQ.q.en;
    const nextText = isUz ? `\u{1F4DD} <b>${escapeHtml(subName)}</b>

<b>${nextQIndex + 1}-Savol (Jami ${subject.questions.length} tadan):</b>

\u2753 ${escapeHtml(qText)}` : `\u{1F4DD} <b>${escapeHtml(subName)}</b>

<b>Question ${nextQIndex + 1} of ${subject.questions.length}:</b>

\u2753 ${escapeHtml(qText)}`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(nextText, {
          parse_mode: "HTML",
          reply_markup: getQuizQuestionKeyboard(nextQ.options, nextQIndex, examId)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(nextText, {
      parse_mode: "HTML",
      reply_markup: getQuizQuestionKeyboard(nextQ.options, nextQIndex, examId)
    });
  });
  bot.callbackQuery("go_exams_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleExamsMenu(ctx);
  });
}

// src/bot/handlers/premiumHandler.ts
function setupPremiumHandler(bot) {
  const handlePremiumMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const statusBadge = user.isPremium ? isUz ? `\u{1F48E} <b>A'zolik Holati:</b> <b>${escapeHtml(user.premiumTier || "Full Premium")} (FAOLLASHTIRILGAN \u2705)</b>` + (user.premiumCode ? `
\u{1F511} <b>Faol Kod:</b> <code>${escapeHtml(user.premiumCode)}</code>` : "") : `\u{1F48E} <b>Membership Tier:</b> <b>${escapeHtml(user.premiumTier || "Full Premium")} (ACTIVE \u2705)</b>` + (user.premiumCode ? `
\u{1F511} <b>Active Code:</b> <code>${escapeHtml(user.premiumCode)}</code>` : "") : isUz ? `\u26AA <b>A'zolik Holati:</b> Oddiy Talaba (Free)` : `\u26AA <b>Membership Tier:</b> Free Student`;
    const text = isUz ? `\u{1F48E} <b>VIP Qabul & Premium A'zolik</b>

${statusBadge}

\u{1F31F} <b>Premium Imtiyozlari:</b>
${t(user.lang, "premium_benefits")}

` + (user.isPremium ? `\u2728 <i>Sizda qabul komissiyasi va hujjatlarni tezkor tasdiqlash uchun barcha VIP imkoniyatlar faol!</i>` : `\u{1F4A1} <i>Agar sizda faollashtirish promokodi bo'lsa, uni kiritish uchun pastdagi "Promokodni Faollashtirish" tugmasini bosing:</i>`) : `\u{1F48E} <b>VIP Admissions & Premium Access</b>

${statusBadge}

\u{1F31F} <b>Premium Benefits:</b>
${t(user.lang, "premium_benefits")}

` + (user.isPremium ? `\u2728 <i>You have full priority access to our admissions team & fast-track document processing!</i>` : `\u{1F4A1} <i>If you received an activation code from your consultant, tap "Activate Access Code" below to unlock full access:</i>`);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getPremiumKeyboard(user.lang, user.isPremium)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getPremiumKeyboard(user.lang, user.isPremium)
    });
  };
  bot.command("premium", async (ctx) => handlePremiumMenu(ctx));
  bot.callbackQuery("menu_premium", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePremiumMenu(ctx);
  });
  bot.hears([/.*Premium Access.*/i, /.*Premium A'zolik.*/i, /.*Premium.*/i], async (ctx) => handlePremiumMenu(ctx));
  bot.callbackQuery("premium_enter_code", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    db.setWaitingFor(userId, "premium_code");
    await ctx.answerCallbackQuery();
    const promptText = isUz ? `\u{1F511} <b>Faollashtirish Promokodini Kiriting:</b>

Sizga berilgan promokodni pastda yozib yuboring (masalan: <code>PTU-DGRZ-JWHB</code>):` : `\u{1F511} <b>Enter Your Activation Code:</b>

Type or paste your random activation code below (e.g. <code>PTU-DGRZ-JWHB</code>):`;
    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}

// src/bot/handlers/profileHandler.ts
function setupProfileHandler(bot) {
  const handleProfileMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    });
    const isUz = user.lang === "uz";
    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring." : "\u26A0\uFE0F <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      return;
    }
    const userApps = db.getUserApplications(userId);
    let appsSummary = isUz ? "<i>Aktiv arizalar mavjud emas. Ariza topshirish uchun ta'lim dasturlaridan birini tanlang!</i>" : "<i>No active applications yet. Select a degree in the Programs menu to apply!</i>";
    if (userApps.length > 0) {
      appsSummary = "";
      userApps.forEach((app) => {
        const stageIcon = app.stage === "Accepted" ? "\u2705" : app.stage === "University Review" ? "\u{1F3DB}\uFE0F" : app.stage === "Processing" ? "\u{1F7E1}" : app.stage === "Action Needed" ? "\u{1F534}" : "\u26AA";
        const stageName = isUz ? app.stage === "Submitted" ? "Topshirildi" : app.stage === "Processing" ? "Jarayonda" : app.stage === "University Review" ? "Universitet Tekshiruvida" : app.stage === "Action Needed" ? "Tuzatish Talab Etiladi" : app.stage === "Accepted" ? "Qabul Qilindi \u{1F389}" : app.stage : app.stage;
        appsSummary += `\u{1F4D8} <b>${escapeHtml(app.programName)}</b>
\u{1F3DB}\uFE0F ${escapeHtml(app.university)} (${escapeHtml(app.city)})
\u{1F4CC} ${isUz ? "Holati" : "Stage"}: ${stageIcon} <b>${escapeHtml(stageName)}</b>
` + (app.counselorNote ? `\u{1F4AC} ${isUz ? "Maslahatchi Izohi" : "Counselor Note"}: <i>"${escapeHtml(app.counselorNote)}"</i>
` : "") + `\u{1F4C5} ${isUz ? "Topshirilgan sana" : "Applied on"}: ${escapeHtml(app.submittedAt)}

`;
      });
    }
    const docs = user.documents || {};
    const totalDocs = Object.keys(docs).length || 7;
    const verifiedDocs = Object.values(docs).filter((d) => d.status === "approved").length;
    const filled = Math.max(0, Math.min(10, Math.round(verifiedDocs / totalDocs * 10)));
    const progressBar = "\u{1F7E9}".repeat(filled) + "\u2B1C".repeat(10 - filled);
    const savedCount = (user.savedPrograms || []).length;
    const fullName = user.fullName || user.firstName || "Student";
    const usernameDisplay = user.username ? `@${escapeHtml(user.username)}` : "<i>(mavjud emas)</i>";
    const notSetText = isUz ? "<i>(kiritilmagan)</i>" : "<i>(not set)</i>";
    const phoneDisplay = user.phone ? escapeHtml(user.phone) : notSetText;
    const tierDisplay = escapeHtml(user.premiumTier || "Free");
    const codeDisplay = user.premiumCode ? ` (Kod: <code>${escapeHtml(user.premiumCode)}</code>)` : "";
    const text = isUz ? `\u{1F464} <b>${escapeHtml(fullName)} \u2014 Talaba Profili</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} Foydalanuvchi ID: <code>${user.userId}</code>
\u2022 \u{1F4AC} Username: ${usernameDisplay}
\u2022 \u{1F4DE} Telefon: ${phoneDisplay}
\u2022 \u{1F393} Maqsad Qilingan Bosqich: <b>${escapeHtml(user.preferredLevel || "Bakalavr")}</b>
\u2022 \u{1F1FA}\u{1F1FF} Fuqarolik: ${escapeHtml(user.country || "O'zbekiston")}
\u2022 \u{1F310} Tanlangan Til: O'zbekcha \u{1F1FA}\u{1F1FF}
\u2022 \u{1F48E} A'zolik Darajasi: <b>${tierDisplay}</b>${codeDisplay}
\u2022 \u2B50 Saqlangan Dasturlar: <b>${savedCount} ta</b>

\u{1F4C1} <b>Hujjatlar Tayyorgarligi:</b>
${progressBar} <b>${verifiedDocs}/${totalDocs} Tasdiqlangan</b>

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4D1} <b>Universitetga Arizalar:</b>
${appsSummary}` : `\u{1F464} <b>${escapeHtml(fullName)} \u2014 Student Profile</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} User ID: <code>${user.userId}</code>
\u2022 \u{1F4AC} Username: ${usernameDisplay}
\u2022 \u{1F4DE} Phone: ${phoneDisplay}
\u2022 \u{1F393} Target Degree: <b>${escapeHtml(user.preferredLevel || "Bachelor")}</b>
\u2022 \u{1F1FA}\u{1F1FF} Citizenship: ${escapeHtml(user.country || "Uzbekistan")}
\u2022 \u{1F310} Language: English \u{1F1EC}\u{1F1E7}
\u2022 \u{1F48E} Membership: <b>${tierDisplay}</b>${codeDisplay}
\u2022 \u2B50 Saved Degrees: <b>${savedCount}</b>

\u{1F4C1} <b>Document Verification Progress:</b>
${progressBar} <b>${verifiedDocs}/${totalDocs} Verified</b>

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4D1} <b>Application Status:</b>
${appsSummary}`;
    const kb = {
      inline_keyboard: isUz ? [
        [{ text: `\u2B50 Saqlangan Dasturlar (${savedCount})`, callback_data: "view_saved_programs" }],
        [{ text: "\u{1F4DD} Ma'lumotlarni Qayta Kiritish", callback_data: "start_registration_wizard" }],
        [{ text: "\u{1F310} Tilni O'zgartirish (UZ / EN)", callback_data: "profile_switch_lang" }],
        [{ text: "\u{1F3E0} Bosh Menyu", callback_data: "go_main_menu" }]
      ] : [
        [{ text: `\u2B50 Saved Programs (${savedCount})`, callback_data: "view_saved_programs" }],
        [{ text: "\u{1F4DD} Update Details", callback_data: "start_registration_wizard" }],
        [{ text: "\u{1F310} Switch Language (EN / UZ)", callback_data: "profile_switch_lang" }],
        [{ text: "\u{1F3E0} Main Menu", callback_data: "go_main_menu" }]
      ]
    };
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  };
  bot.command("profile", async (ctx) => handleProfileMenu(ctx));
  bot.callbackQuery("menu_profile", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProfileMenu(ctx);
  });
  bot.hears([/.*My Profile.*/i, /.*Mening Profilim.*/i, /.*Profile.*/i], async (ctx) => handleProfileMenu(ctx));
  bot.callbackQuery("view_saved_programs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const savedIds = user.savedPrograms || [];
    const savedList = programs.filter((p) => savedIds.includes(p.id));
    await ctx.answerCallbackQuery();
    if (savedList.length === 0) {
      const emptyText = isUz ? `\u2B50 <b>Saqlangan Dasturlar</b>

Siz hali hech qaysi ta'lim dasturini saqlamadingiz. Ta'lim Dasturlari bo'limiga o'tib, yoqqan dasturlarni \u2B50 Saqlash tugmasi orqali belgilashingiz mumkin!` : `\u2B50 <b>Saved Programs</b>

You haven't saved any degree programs yet. Explore the Programs menu and tap \u2B50 Save Program to bookmark your favorites!`;
      const emptyKb = {
        inline_keyboard: isUz ? [
          [{ text: "\u{1F4DA} Dasturlarni Ko'rish", callback_data: "back_to_progs" }],
          [{ text: "\u25C0\uFE0F Profilga Qaytish", callback_data: "back_to_profile" }]
        ] : [
          [{ text: "\u{1F4DA} Browse Programs", callback_data: "back_to_progs" }],
          [{ text: "\u25C0\uFE0F Back to Profile", callback_data: "back_to_profile" }]
        ]
      };
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(emptyText, { parse_mode: "HTML", reply_markup: emptyKb });
          return;
        } catch {
        }
      }
      await ctx.reply(emptyText, { parse_mode: "HTML", reply_markup: emptyKb });
      return;
    }
    let text = isUz ? `\u2B50 <b>Saqlangan Ta'lim Dasturlaringiz (${savedList.length} ta):</b>

` : `\u2B50 <b>Your Saved Degree Programs (${savedList.length}):</b>

`;
    const buttons = savedList.map((p) => [
      {
        text: `\u{1F4D8} ${p.name} (${p.city})`,
        callback_data: `view_prog_${p.id}`
      }
    ]);
    buttons.push([
      {
        text: isUz ? "\u25C0\uFE0F Profilga Qaytish" : "\u25C0\uFE0F Back to Profile",
        callback_data: "back_to_profile"
      }
    ]);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buttons }
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons }
    });
  });
  bot.callbackQuery("profile_switch_lang", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(t(user.lang, "choose_language"), {
          reply_markup: getLanguageInlineKeyboard()
        });
        return;
      } catch {
      }
    }
    await ctx.reply(t(user.lang, "choose_language"), {
      reply_markup: getLanguageInlineKeyboard()
    });
  });
  bot.callbackQuery("start_registration_wizard", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    db.setWaitingFor(userId, "registration_name");
    const user = db.getUser(userId);
    const text = user.lang === "uz" ? `\u{1F4DD} <b>1-Qadam (3 tadan): To'liq Ismingiz</b>

Iltimos, to'liq ism va familiyangizni kiriting:` : `\u{1F4DD} <b>Step 1 of 3: Full Name</b>

Please enter your Full Name:`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
        return;
      } catch {
      }
    }
    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true }
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("back_to_profile", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProfileMenu(ctx);
  });
}

// src/bot/keyboards/adminKeyboards.ts
import { InlineKeyboard as InlineKeyboard3 } from "grammy";
function getAdminDashboardKeyboard(stats, lang = "en") {
  const isUz = lang === "uz";
  return new InlineKeyboard3().text(isUz ? `\u{1F465} Talabalar CRM (${stats.usersCount})` : `\u{1F465} Users CRM (${stats.usersCount})`, "admin_menu_users").text(isUz ? `\u{1F4CB} Arizalar (${stats.appsCount})` : `\u{1F4CB} Applications (${stats.appsCount})`, "admin_menu_apps").row().text(isUz ? `\u{1F4C1} Hujjatlar (${stats.pendingDocsCount} ta kutilmoqda)` : `\u{1F4C1} Review Queue (${stats.pendingDocsCount})`, "admin_menu_docs").text(isUz ? `\u{1F3DB}\uFE0F NAWA Arizalari (${stats.nawaCount})` : `\u{1F3DB}\uFE0F NAWA Apps (${stats.nawaCount})`, "admin_menu_nawa").row().text(isUz ? `\u{1F3DB}\uFE0F Universitetlar Boshqaruvi` : `\u{1F3DB}\uFE0F Manage Universities`, "admin_menu_manage_unis").text(isUz ? `\u{1F4D1} Hujjat Turlari` : `\u{1F4D1} Document Types`, "admin_menu_manage_docdefs").row().text(isUz ? `\u2B50 Sharhlar (${stats.reviewsCount || 0})` : `\u2B50 Reviews (${stats.reviewsCount || 0})`, "admin_menu_reviews").text(isUz ? `\u26A1 Promokodlar` : `\u26A1 Promo Codes`, "admin_menu_promos").row().text(isUz ? `\u{1F4E2} Global Xabar Yuborish` : `\u{1F4E2} Broadcast Message`, "admin_broadcast_start").text(isUz ? `\u{1F310} Til: O'zbekcha \u{1F1FA}\u{1F1FF}` : `\u{1F310} Lang: English \u{1F1EC}\u{1F1E7}`, "admin_switch_lang").row().text(isUz ? `\u{1F504} Yangilash` : `\u{1F504} Refresh Stats`, "admin_refresh").text(isUz ? `\u{1F3E0} Talaba Menyusi` : `\u{1F3E0} Student Menu`, "go_main_menu");
}
function getAdminUsersListKeyboard(users, page = 0, pageSize = 6, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  const start = page * pageSize;
  const pageUsers = users.slice(start, start + pageSize);
  pageUsers.forEach((u) => {
    const name = u.fullName || u.firstName || `User #${u.userId}`;
    const verifiedCount = Object.values(u.documents || {}).filter((d) => d.status === "approved").length;
    const totalDocs = Object.keys(u.documents || {}).length || 7;
    const tierBadge = u.isPremium ? "\u{1F48E}" : "\u26AA";
    kb.text(
      `${tierBadge} ${name.slice(0, 18)} (${verifiedCount}/${totalDocs} Docs)`,
      `admin_view_user_${u.userId}`
    ).row();
  });
  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const navRow = [];
  if (page > 0) {
    navRow.push({ text: "\u2B05\uFE0F Prev", data: `admin_users_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: "Next \u27A1\uFE0F", data: `admin_users_page_${page + 1}` });
  }
  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }
  kb.text(isUz ? "\u{1F50D} Talabani Qidirish" : "\u{1F50D} Search Student", "admin_search_user_prompt").text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminUserDetailKeyboard(user, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  kb.text(isUz ? "\u{1F381} Bir Martalik VIP Promokod Berish" : "\u{1F381} Assign VIP Single-Use Promo", `admin_assign_promo_${user.userId}`).row();
  if (user.isAdmin) {
    kb.text(isUz ? "\u{1F534} Admin Huquqini Olish" : "\u{1F534} Demote from Admin", `admin_toggle_admin_${user.userId}`);
  } else {
    kb.text(isUz ? "\u{1F451} Admin Huquqini Berish" : "\u{1F451} Promote to Admin", `admin_toggle_admin_${user.userId}`);
  }
  kb.row().text(isUz ? "\u25C0\uFE0F Talabalar Ro'yxatiga" : "\u25C0\uFE0F Back to Users", "admin_menu_users");
  return kb;
}
function getAdminApplicationsListKeyboard(apps, page = 0, pageSize = 6, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  const start = page * pageSize;
  const pageApps = apps.slice(start, start + pageSize);
  pageApps.forEach((a) => {
    const stageIcon = a.stage === "Accepted" ? "\u2705" : a.stage === "University Review" ? "\u{1F3DB}\uFE0F" : a.stage === "Processing" ? "\u{1F7E1}" : a.stage === "Action Needed" ? "\u{1F534}" : "\u26AA";
    kb.text(
      `${stageIcon} ${a.studentName.slice(0, 14)} - ${a.programName.slice(0, 16)}`,
      `admin_view_app_${a.id}`
    ).row();
  });
  const totalPages = Math.ceil(apps.length / pageSize) || 1;
  if (page > 0) kb.text("\u2B05\uFE0F Prev", `admin_apps_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next \u27A1\uFE0F", `admin_apps_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();
  kb.text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminApplicationDetailKeyboard(app, lang = "en") {
  const isUz = lang === "uz";
  return new InlineKeyboard3().text(isUz ? "\u{1F7E1} Holat: Jarayonda" : "\u{1F7E1} Set: Processing", `admin_set_stage_${app.id}_Processing`).text(isUz ? "\u{1F3DB}\uFE0F Holat: Univ Tekshiruvida" : "\u{1F3DB}\uFE0F Set: Univ Review", `admin_set_stage_${app.id}_University Review`).row().text(isUz ? "\u2705 Holat: Qabul Qilindi" : "\u2705 Set: Accepted", `admin_set_stage_${app.id}_Accepted`).text(isUz ? "\u{1F534} Holat: Tuzatish Kerak" : "\u{1F534} Set: Action Needed", `admin_set_stage_${app.id}_Action Needed`).row().text(isUz ? "\u{1F4AC} Talabaga Maslahatchi Izohi Yuborish" : "\u{1F4AC} Send Feedback Note to Student", `admin_feedback_prompt_${app.id}`).row().text(isUz ? "\u25C0\uFE0F Arizalar Ro'yxatiga" : "\u25C0\uFE0F Back to Applications", "admin_menu_apps");
}
function getAdminPendingDocsKeyboard(pendingList, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  if (pendingList.length === 0) {
    kb.text(isUz ? "\u{1F389} Tekshirish kutilayotgan hujjatlar yo'q" : "\u{1F389} No pending documents to review", "admin_main").row();
  } else {
    pendingList.forEach((item) => {
      const name = item.user.fullName || item.user.firstName || `User #${item.userId}`;
      const docName = item.doc.name[lang] || item.doc.name.en;
      kb.text(`\u{1F4C4} ${name.slice(0, 14)}: ${docName}`, `admin_review_doc_${item.userId}_${item.doc.id}`).row();
    });
  }
  kb.text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminDocReviewKeyboard(userId, docKey, lang = "en") {
  const isUz = lang === "uz";
  return new InlineKeyboard3().text(isUz ? "\u2705 Tasdiqlash (Qabul)" : "\u2705 Approve (Verified)", `admin_doc_decision_${userId}_${docKey}_approved`).text(isUz ? "\u{1F534} Rad Etish (Tuzatish)" : "\u{1F534} Reject (Needs Correction)", `admin_doc_decision_${userId}_${docKey}_needs_correction`).row().text(isUz ? "\u{1F4AC} Sabab Izohi Bilan Rad Etish" : "\u{1F4AC} Reject with Custom Reason Note", `admin_doc_reject_note_${userId}_${docKey}`).row().text(isUz ? "\u25C0\uFE0F Hujjatlar Navbatiga" : "\u25C0\uFE0F Back to Documents", "admin_menu_docs");
}
function getAdminPromoCodesKeyboard(promos, page = 0, pageSize = 6, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  const start = page * pageSize;
  const pagePromos = promos.slice(start, start + pageSize);
  pagePromos.forEach((p) => {
    const statusIcon = p.isExpired || !p.isActive ? "\u{1F534}" : p.usedCount >= p.maxUses ? "\u{1F512}" : "\u{1F7E2}";
    kb.text(`${statusIcon} ${p.code} (${p.tier} | ${p.usedCount}/${p.maxUses})`, `admin_view_promo_${p.code}`).row();
  });
  kb.text(isUz ? "\u26A1 Tasodifiy Promokod Yaratish" : "\u26A1 Generate Random Promo Code", "admin_gen_random_promo").row().text(isUz ? "\u2795 Maxsus Kod Yaratish" : "\u2795 Custom Code", "admin_create_promo_prompt").text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminPromoDetailKeyboard(promo, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  if (promo.isActive && !promo.isExpired) {
    kb.text(isUz ? "\u{1F534} Promokodni To'xtatish" : "\u{1F534} Expire / Deactivate Code", `admin_expire_promo_${promo.code}`).row();
  } else {
    kb.text(isUz ? "\u{1F7E2} Promokodni Qayta Faollashtirish" : "\u{1F7E2} Reactivate Code", `admin_reactivate_promo_${promo.code}`).row();
  }
  kb.text(isUz ? "\u{1F5D1}\uFE0F Promokodni Butunlay O'chirish" : "\u{1F5D1}\uFE0F Delete Promo Code", `admin_delete_promo_${promo.code}`).row();
  kb.text(isUz ? "\u25C0\uFE0F Promokodlar Ro'yxatiga" : "\u25C0\uFE0F Back to Promo Codes", "admin_menu_promos");
  return kb;
}
function getAdminUniversitiesKeyboard(unis, page = 0, pageSize = 6, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  const start = page * pageSize;
  const pageUnis = unis.slice(start, start + pageSize);
  pageUnis.forEach((u) => {
    kb.text(`\u{1F3DB}\uFE0F ${u.name.slice(0, 22)} (${u.city})`, `admin_view_uni_${u.id}`).row();
  });
  const totalPages = Math.ceil(unis.length / pageSize) || 1;
  if (page > 0) kb.text("\u2B05\uFE0F Prev", `admin_unis_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next \u27A1\uFE0F", `admin_unis_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();
  kb.text(isUz ? "\u2795 Yangi Universitet Qo'shish" : "\u2795 Add New University", "admin_add_uni_prompt").row().text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminUniversityEditKeyboard(uni, lang = "en") {
  const isUz = lang === "uz";
  return new InlineKeyboard3().url(isUz ? "\u{1F310} Rasmiy Veb-Sayt" : "\u{1F310} Official Link", uni.website || "https://studyinpoland.pl").row().text(isUz ? "\u270F\uFE0F Veb-Sayt Havolasini Tahrirlash" : "\u270F\uFE0F Edit Website Link", `admin_edit_uni_web_${uni.id}`).text(isUz ? "\u270F\uFE0F Kontrakt Narxini Tahrirlash" : "\u270F\uFE0F Edit Tuition Info", `admin_edit_uni_tui_${uni.id}`).row().text(isUz ? "\u{1F5D1}\uFE0F Universitetni O'chirish" : "\u{1F5D1}\uFE0F Delete University", `admin_delete_uni_${uni.id}`).row().text(isUz ? "\u25C0\uFE0F Universitetlar Ro'yxatiga" : "\u25C0\uFE0F Back to Universities", "admin_menu_manage_unis");
}
function getAdminDocDefsKeyboard(defs, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  Object.values(defs).forEach((d) => {
    const name = d.name[lang] || d.name.en;
    const reqBadge = d.required ? isUz ? "\u2B50 [Majburiy]" : "\u2B50 [Required]" : isUz ? "\u26AA [Ixtiyoriy]" : "\u26AA [Optional]";
    kb.text(`\u{1F4C4} ${name.slice(0, 18)} ${reqBadge}`, `admin_view_docdef_${d.id}`).row();
  });
  kb.text(isUz ? "\u2795 Yangi Hujjat Talabi Qo'shish" : "\u2795 Add New Document Requirement", "admin_add_docdef_prompt").row().text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminDocDefEditKeyboard(def, lang = "en") {
  const isUz = lang === "uz";
  return new InlineKeyboard3().text(
    def.required ? isUz ? "\u2B50 Ixtiyoriy Qilish" : "\u2B50 Make Optional" : isUz ? "\u2B50 Majburiy Qilish" : "\u2B50 Make Required",
    `admin_toggle_docdef_req_${def.id}`
  ).row().text(isUz ? "\u{1F5D1}\uFE0F Hujjat Turini O'chirish" : "\u{1F5D1}\uFE0F Delete Document Type", `admin_delete_docdef_${def.id}`).row().text(isUz ? "\u25C0\uFE0F Hujjat Turlariga Qaytish" : "\u25C0\uFE0F Back to Document Types", "admin_menu_manage_docdefs");
}
function getAdminReviewsListKeyboard(reviews, page = 0, pageSize = 6, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  const start = page * pageSize;
  const pageRevs = reviews.slice(start, start + pageSize);
  pageRevs.forEach((r) => {
    const statusIcon = r.status === "approved" ? "\u2705" : isUz ? "\u{1F7E1} [Kutilmoqda]" : "\u{1F7E1} [Pending]";
    kb.text(`${statusIcon} #${r.id} ${r.name.slice(0, 12)} (${r.rating}\u2B50)`, `admin_view_rev_${r.id}`).row();
  });
  const totalPages = Math.ceil(reviews.length / pageSize) || 1;
  if (page > 0) kb.text("\u2B05\uFE0F Prev", `admin_revs_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next \u27A1\uFE0F", `admin_revs_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();
  kb.text(isUz ? "\u2795 Yangi Sharh / Fikr Qo'shish" : "\u2795 Add New Review / Testimonial", "admin_add_rev_prompt").row().text(isUz ? "\u25C0\uFE0F Admin Bosh Panel" : "\u25C0\uFE0F Back to Admin", "admin_main");
  return kb;
}
function getAdminReviewEditKeyboard(review, lang = "en") {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard3();
  if (review.status === "pending") {
    kb.text(isUz ? "\u2705 Tasdiqlash & E'lon Qilish" : "\u2705 Approve & Publish", `admin_rev_decision_${review.id}_approve`).text(isUz ? "\u{1F534} Rad Etish & O'chirish" : "\u{1F534} Reject & Delete", `admin_rev_decision_${review.id}_reject`).row();
  }
  kb.text(isUz ? "\u270F\uFE0F Sharh Matnini Tahrirlash" : "\u270F\uFE0F Edit Review Text", `admin_edit_rev_text_${review.id}`).text(isUz ? "\u2B50 Bahoni O'zgartirish (1-5)" : "\u2B50 Change Rating (1-5)", `admin_edit_rev_rating_${review.id}`).row().text(isUz ? "\u{1F5D1}\uFE0F Sharhni O'chirish" : "\u{1F5D1}\uFE0F Delete Review", `admin_delete_rev_${review.id}`).row().text(isUz ? "\u25C0\uFE0F Sharhlar Ro'yxatiga" : "\u25C0\uFE0F Back to Reviews", "admin_menu_reviews");
  return kb;
}

// src/bot/handlers/textInputHandler.ts
function setupTextInputHandler(bot) {
  const cleanUpInput = async (ctx, userId) => {
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const user = db.getUser(userId);
    if (user.lastPromptMsgId && ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
      } catch {
      }
    }
  };
  bot.on("message:contact", async (ctx) => {
    const userId = ctx.from?.id;
    const contact = ctx.message?.contact;
    if (!userId || !contact) return;
    await cleanUpInput(ctx, userId);
    const user = db.getUser(userId);
    if (user.waitingFor === "registration_phone") {
      const phoneNumber = contact.phone_number.startsWith("+") ? contact.phone_number : `+${contact.phone_number}`;
      db.updateUser(userId, { phone: phoneNumber });
      db.setWaitingFor(userId, "registration_level");
      const levelPrompt = user.lang === "uz" ? `\u{1F393} <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>

Polshada maqsad qilgan ta'lim darajangizni tanlang:` : `\u{1F393} <b>Step 3 of 3: Target Degree Level</b>

Please choose the degree level you plan to study in Poland:`;
      const msg = await ctx.reply(levelPrompt, {
        parse_mode: "HTML",
        reply_markup: getOnboardingDegreeKeyboard(user.lang)
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });
  bot.on("message:document", async (ctx) => {
    const userId = ctx.from?.id;
    const document = ctx.message?.document;
    if (!userId || !document) return;
    const user = db.getUser(userId);
    if (user.waitingFor === "document_upload") {
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        db.submitDocument(userId, docKey, {
          fileId: document.file_id,
          fileName: document.file_name || "document.pdf",
          fileType: "document"
        });
        db.setWaitingFor(userId, null);
        const isUz = user.lang === "uz";
        const replyText = isUz ? `\u2705 <b>Hujjat Fayli Qabul Qilindi!</b>

\u{1F4C4} <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F4CE} <b>Fayl:</b> <code>${escapeHtml(document.file_name || "document.pdf")}</code>
\u{1F7E1} <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida

Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!` : `\u2705 <b>Document File Received!</b>

\u{1F4C4} <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F4CE} <b>File Name:</b> <code>${escapeHtml(document.file_name || "document.pdf")}</code>
\u{1F7E1} <b>Status:</b> Under Review by Admissions Advisors

You will be notified here as soon as our counselors verify your file!`;
        await ctx.reply(replyText, { parse_mode: "HTML" });
      }
    }
  });
  bot.on("message:photo", async (ctx) => {
    const userId = ctx.from?.id;
    const photos = ctx.message?.photo;
    if (!userId || !photos || photos.length === 0) return;
    const user = db.getUser(userId);
    if (user.waitingFor === "document_upload") {
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        const largestPhoto = photos[photos.length - 1];
        db.submitDocument(userId, docKey, {
          fileId: largestPhoto.file_id,
          fileName: "photo_scan.jpg",
          fileType: "photo"
        });
        db.setWaitingFor(userId, null);
        const isUz = user.lang === "uz";
        const replyText = isUz ? `\u2705 <b>Hujjat Fotosurati Qabul Qilindi!</b>

\u{1F4C4} <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F5BC}\uFE0F <b>Fayl:</b> Sifatli rasm skaneri
\u{1F7E1} <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida

Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!` : `\u2705 <b>Document Photo Received!</b>

\u{1F4C4} <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F5BC}\uFE0F <b>Image File:</b> High-Resolution Scan
\u{1F7E1} <b>Status:</b> Under Review by Admissions Advisors

You will be notified here as soon as our counselors verify your file!`;
        await ctx.reply(replyText, { parse_mode: "HTML" });
      }
    }
  });
  bot.callbackQuery(/^onboarding_level_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_level_(.+)$/);
    if (!match) return;
    const level = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.updateUser(userId, {
      preferredLevel: level,
      isRegistered: true,
      waitingFor: null,
      waitingPayload: null
    });
    await ctx.answerCallbackQuery();
    const fullName = user.fullName || user.firstName || "Student";
    const phone = user.phone || "<i>(not set)</i>";
    const congratsText = user.lang === "uz" ? `\u{1F389} <b>Tabriklaymiz, ${escapeHtml(fullName)}! Profilingiz Muvaffaqiyatli Yaratildi!</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F464} <b>Ism:</b> ${escapeHtml(fullName)}
\u2022 \u{1F4DE} <b>Telefon:</b> ${escapeHtml(phone)}
\u2022 \u{1F393} <b>Dastur Darajasi:</b> ${escapeHtml(level)}
\u2022 \u{1F48E} <b>A'zolik:</b> ${escapeHtml(user.premiumTier || "Free")}

\u{1F680} Endi siz Polsha universitetlarini ko'rishingiz, dasturlarni tanlashingiz va arizangizni boshlashingiz mumkin!` : `\u{1F389} <b>Congratulations, ${escapeHtml(fullName)}! Your Student Profile is Ready!</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F464} <b>Name:</b> ${escapeHtml(fullName)}
\u2022 \u{1F4DE} <b>Phone:</b> ${escapeHtml(phone)}
\u2022 \u{1F393} <b>Target Degree:</b> ${escapeHtml(level)}
\u2022 \u{1F48E} <b>Membership:</b> ${escapeHtml(user.premiumTier || "Free")}

\u{1F680} You can now browse universities, explore English-taught degrees, track documents, and practice entrance exams!`;
    try {
      await ctx.editMessageText(congratsText, { parse_mode: "HTML" });
    } catch {
    }
    await ctx.reply(`\u{1F3E0} <b>${escapeHtml(user.lang === "uz" ? "Bosh Menyu Ochildi" : "Main Menu Unlocked")}</b>`, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang)
    });
  });
  bot.on("message:text", async (ctx, next) => {
    const text = ctx.message?.text?.trim();
    const userId = ctx.from?.id;
    if (!userId || !text) return next();
    if (text.startsWith("/") || text.includes("\u{1F393}") || text.includes("\u{1F4DA}") || text.includes("\u{1F3DB}\uFE0F") || text.includes("\u{1F4CB}") || text.includes("\u270D\uFE0F") || text.includes("\u{1F48E}") || text.includes("\u{1F464}")) {
      return next();
    }
    const user = db.getUser(userId);
    if (!user.isRegistered && !user.isAdmin) {
      await cleanUpInput(ctx, userId);
      if (user.waitingFor === "registration_name") {
        const parts = text.split(" ");
        const firstName = parts[0] || text;
        const lastName = parts.slice(1).join(" ") || "";
        db.updateUser(userId, { fullName: text, firstName, lastName });
        db.setWaitingFor(userId, "registration_phone");
        const phonePrompt = user.lang === "uz" ? `\u{1F44B} Tanishganimdan xursandman, <b>${escapeHtml(text)}</b>!

\u{1F4DE} <b>2-Qadam (3 tadan): Telefon Raqamingiz</b>
Iltimos, telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):` : `\u{1F44B} Nice to meet you, <b>${escapeHtml(text)}</b>!

\u{1F4DE} <b>Step 2 of 3: Phone Number</b>
Please reply with your phone number (e.g. <code>+998901234567</code>):`;
        const msg2 = await ctx.reply(phonePrompt, {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        });
        db.setLastPromptMsgId(userId, msg2.message_id);
        return;
      }
      if (user.waitingFor === "registration_phone") {
        db.updateUser(userId, { phone: text });
        db.setWaitingFor(userId, "registration_level");
        const levelPrompt = user.lang === "uz" ? `\u{1F393} <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>

Polshada maqsad qilgan ta'lim darajangizni tanlang:` : `\u{1F393} <b>Step 3 of 3: Target Degree Level</b>

Please choose the degree level you plan to study in Poland:`;
        const msg2 = await ctx.reply(levelPrompt, {
          parse_mode: "HTML",
          reply_markup: getOnboardingDegreeKeyboard(user.lang)
        });
        db.setLastPromptMsgId(userId, msg2.message_id);
        return;
      }
      if (user.waitingFor === "registration_level") {
        const msg2 = await ctx.reply(
          user.lang === "uz" ? "\u26A0\uFE0F <b>Iltimos, avval ro'yxatdan o'tishni yakunlash uchun ta'lim darajangizni tanlang:</b>" : "\u26A0\uFE0F <b>Please select your target degree level above to complete registration:</b>",
          {
            parse_mode: "HTML",
            reply_markup: getOnboardingDegreeKeyboard(user.lang)
          }
        );
        db.setLastPromptMsgId(userId, msg2.message_id);
        return;
      }
      db.setWaitingFor(userId, "registration_name");
      const msg = await ctx.reply(
        user.lang === "uz" ? "\u{1F44B} <b>Assalomu alaykum! Botdan foydalanish uchun avval to'liq ism va familiyangizni kiriting:</b>" : "\u{1F44B} <b>Welcome! Please enter your Full Name to complete registration:</b>",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true }
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }
    if (user.waitingFor === "admin_feedback_app") {
      await cleanUpInput(ctx, userId);
      const appId = user.waitingPayload?.appId;
      if (appId) {
        const app = db.updateApplicationStage(appId, "Action Needed", text);
        db.setWaitingFor(userId, null);
        if (app) {
          try {
            await bot.api.sendMessage(
              app.userId,
              `\u{1F4AC} <b>Counselor Feedback on Application #${escapeHtml(app.id)}:</b>

"${escapeHtml(text)}"

\u{1F3DB}\uFE0F <b>University:</b> ${escapeHtml(app.university)}
\u{1F4D8} <b>Program:</b> ${escapeHtml(app.programName)}

Please review your documents and update your dossier.`,
              { parse_mode: "HTML" }
            );
          } catch {
          }
          await ctx.reply(`\u2705 Feedback note saved and sent to student for Application <b>${escapeHtml(appId)}</b>!`, {
            parse_mode: "HTML"
          });
        }
        return;
      }
    }
    if (user.waitingFor === "admin_feedback_doc") {
      await cleanUpInput(ctx, userId);
      const { targetUserId, docKey } = user.waitingPayload || {};
      if (targetUserId && docKey) {
        db.verifyDocument(targetUserId, docKey, "needs_correction", text);
        db.setWaitingFor(userId, null);
        try {
          await bot.api.sendMessage(
            targetUserId,
            `\u{1F534} <b>Document Correction Required: ${escapeHtml(docKey.toUpperCase())}</b>

\u{1F4AC} <b>Counselor Note:</b> "${escapeHtml(text)}"

Please upload a revised copy in the <b>Document Checklist</b> menu.`,
            { parse_mode: "HTML" }
          );
        } catch {
        }
        await ctx.reply(`\u2705 Rejection note saved and sent to student for <b>${escapeHtml(docKey)}</b>!`, {
          parse_mode: "HTML"
        });
        return;
      }
    }
    if (user.waitingFor === "admin_create_promo") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split(" ");
      const code = parts[0]?.toUpperCase().trim();
      const tier = parts[1] || "Full Premium";
      const maxUses = parseInt(parts[2] || "1", 10);
      if (code) {
        const created = db.createPromoCode({
          code,
          tier,
          maxUses
        });
        await ctx.reply(
          `\u2705 <b>Promo Code Created!</b>

\u2022 \u{1F511} Code: <code>${escapeHtml(created.code)}</code>
\u2022 \u{1F48E} Tier: <b>${escapeHtml(created.tier)}</b>
\u2022 \u{1F465} Max Uses: <b>${created.maxUses} (Single User)</b>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }
    if (user.waitingFor === "admin_search_user") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const results = db.searchUsers(text);
      if (results.length === 0) {
        await ctx.reply(`\u{1F50D} No students found matching "${escapeHtml(text)}".`, { parse_mode: "HTML" });
      } else {
        await ctx.reply(`\u{1F50D} <b>Search Results for "${escapeHtml(text)}" (${results.length} found):</b>`, {
          parse_mode: "HTML",
          reply_markup: getAdminUsersListKeyboard(results, 0)
        });
      }
      return;
    }
    if (user.waitingFor === "admin_broadcast_text") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const allUsers = db.getAllUsers();
      let sentCount = 0;
      await ctx.reply(`\u{1F680} Broadcasting announcement to <b>${allUsers.length}</b> students...`, { parse_mode: "HTML" });
      for (const u of allUsers) {
        try {
          await bot.api.sendMessage(
            u.userId,
            `\u{1F4E2} <b>PTU Official Announcement:</b>

${escapeHtml(text)}

\u{1F1F5}\u{1F1F1} <i>Poland Top Universities Team</i>`,
            { parse_mode: "HTML" }
          );
          sentCount++;
        } catch {
        }
      }
      await ctx.reply(`\u2705 Broadcast complete! Delivered to <b>${sentCount}</b> / <b>${allUsers.length}</b> students.`, {
        parse_mode: "HTML"
      });
      return;
    }
    if (user.waitingFor === "admin_add_university") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 4) {
        const id = parts[0].toLowerCase().replace(/\s+/g, "_");
        const name = parts[1];
        const abbr = parts[2] || id.toUpperCase();
        const city = parts[3] || "Warsaw";
        const type = parts[4] === "Private" ? "Private" : "Public";
        const ranking = parts[5] || "#Top 20";
        const tuition = parts[6] || "2,500 EUR/yr";
        const website = parts[7] || "https://studyinpoland.pl";
        const newUni = {
          id,
          name,
          abbr,
          city,
          type,
          founded: 1990,
          website,
          programsCount: 15,
          students: 12e3,
          internationalStudents: 1500,
          ranking,
          logo: "",
          description: {
            en: `${name} is a leading institution in ${city}, Poland.`,
            uz: `${name} \u2014 Polshaning ${city} shahridagi yetakchi oliygohi.`
          },
          faculties: ["Information Technology", "Business & Management", "Economics"],
          tuition: {
            eu: "Free / 0 EUR",
            nonEu: tuition,
            english: tuition
          },
          requirements: ["Secondary School Diploma", "English B2 Certificate", "Passport Copy"],
          deadline: "August 15"
        };
        db.saveUniversity(newUni);
        await ctx.reply(
          `\u2705 <b>New University Added Successfully!</b>

\u2022 \u{1F3DB}\uFE0F <b>Name:</b> ${escapeHtml(newUni.name)} (${escapeHtml(newUni.abbr)})
\u2022 \u{1F4CD} <b>City:</b> ${escapeHtml(newUni.city)}
\u2022 \u{1F310} <b>Website:</b> <a href="${escapeHtml(newUni.website)}">${escapeHtml(newUni.website)}</a>
\u2022 \u{1F4B0} <b>Tuition:</b> ${escapeHtml(newUni.tuition.english)}

<i>Students can now see and browse this university immediately!</i>`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `\u26A0\uFE0F <b>Invalid Format.</b> Please provide at least:
<code>id | Name | Abbr | City</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }
    if (user.waitingFor === "admin_edit_uni_web") {
      await cleanUpInput(ctx, userId);
      const uniId = user.waitingPayload?.uniId;
      db.setWaitingFor(userId, null);
      if (uniId) {
        const uni = db.getUniversity(uniId);
        if (uni) {
          uni.website = text;
          db.saveUniversity(uni);
          await ctx.reply(
            `\u2705 <b>Website Link Updated for ${escapeHtml(uni.name)}!</b>

\u{1F310} <b>New Link:</b> <a href="${escapeHtml(text)}">${escapeHtml(text)}</a>`,
            { parse_mode: "HTML" }
          );
        }
      }
      return;
    }
    if (user.waitingFor === "admin_edit_uni_tui") {
      await cleanUpInput(ctx, userId);
      const uniId = user.waitingPayload?.uniId;
      db.setWaitingFor(userId, null);
      if (uniId) {
        const uni = db.getUniversity(uniId);
        if (uni) {
          uni.tuition.english = text;
          uni.tuition.nonEu = text;
          db.saveUniversity(uni);
          await ctx.reply(
            `\u2705 <b>Tuition Updated for ${escapeHtml(uni.name)}!</b>

\u{1F4B0} <b>New Fee:</b> <code>${escapeHtml(text)}</code>`,
            { parse_mode: "HTML" }
          );
        }
      }
      return;
    }
    if (user.waitingFor === "admin_add_docdef") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        const id = parts[0].toLowerCase().replace(/\s+/g, "_");
        const nameEn = parts[1];
        const nameUz = parts[2] || nameEn;
        const descEn = parts[3] || `Official ${nameEn} document for admission.`;
        const descUz = parts[4] || `Qabul uchun ${nameUz} hujjati.`;
        const required = (parts[5] || "yes").toLowerCase().includes("y");
        const newDef = {
          id,
          name: { en: nameEn, uz: nameUz },
          desc: { en: descEn, uz: descUz },
          required
        };
        db.saveDocumentDefinition(newDef);
        await ctx.reply(
          `\u2705 <b>New Document Requirement Added!</b>

\u2022 \u{1F4C4} <b>Key:</b> <code>${escapeHtml(newDef.id)}</code>
\u2022 \u{1F1EC}\u{1F1E7} <b>Name (EN):</b> ${escapeHtml(newDef.name.en)}
\u2022 \u{1F1FA}\u{1F1FF} <b>Name (UZ):</b> ${escapeHtml(newDef.name.uz)}
\u2022 \u2B50 <b>Required:</b> ${newDef.required ? "YES" : "NO"}

<i>This document is now automatically visible in all students' Document Checklists!</i>`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `\u26A0\uFE0F <b>Invalid Format.</b> Please provide: <code>key | Name EN | Name UZ | Desc EN | Desc UZ | yes/no</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }
    if (user.waitingFor === "admin_add_review") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 5) {
        const name = parts[0];
        const country = parts[1] || "Uzbekistan";
        const university = parts[2] || "Warsaw University";
        const program = parts[3] || "International Studies";
        const rating = parseInt(parts[4] || "5", 10);
        const textEn = parts[5] || "";
        const textUz = parts[6] || textEn;
        const rev = db.addReview({
          name,
          country,
          university,
          program,
          rating,
          text: { en: textEn, uz: textUz },
          status: "approved"
        });
        await ctx.reply(
          `\u2705 <b>Review Published Live!</b>

\u2022 \u{1F464} <b>Student:</b> ${escapeHtml(rev.name)} (${escapeHtml(rev.country)})
\u2022 \u{1F3DB}\uFE0F <b>University:</b> ${escapeHtml(rev.university)} \u2014 ${escapeHtml(rev.program)}
\u2022 \u2B50 <b>Rating:</b> ${"\u2B50".repeat(rev.rating)}
\u2022 \u{1F4AC} <b>Text:</b> "${escapeHtml(rev.text.en)}"`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `\u26A0\uFE0F <b>Invalid Format.</b> Please provide: <code>Name | Country | University | Program | Rating(1-5) | Text EN | Text UZ</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }
    if (user.waitingFor === "admin_edit_review_text") {
      await cleanUpInput(ctx, userId);
      const revId = user.waitingPayload?.revId;
      db.setWaitingFor(userId, null);
      if (revId) {
        db.updateReview(revId, { text: { en: text, uz: text } });
        await ctx.reply(`\u2705 <b>Review #${revId} text updated successfully!</b>`, { parse_mode: "HTML" });
      }
      return;
    }
    if (user.waitingFor === "document_upload") {
      await cleanUpInput(ctx, userId);
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        db.submitDocument(userId, docKey, {
          link: text,
          fileType: "link"
        });
        db.setWaitingFor(userId, null);
        const isUz = user.lang === "uz";
        const replyText = isUz ? `\u2705 <b>Hujjat Havolasi Qabul Qilindi!</b>

\u{1F4C4} <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F517} <b>Havola:</b> <code>${escapeHtml(text)}</code>
\u{1F7E1} <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida

Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!` : `\u2705 <b>Document Link Submitted!</b>

\u{1F4C4} <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}
\u{1F517} <b>Link:</b> <code>${escapeHtml(text)}</code>
\u{1F7E1} <b>Status:</b> Under Review by Admissions Team

You will be notified here as soon as an advisor verifies your document!`;
        await ctx.reply(replyText, { parse_mode: "HTML" });
        return;
      }
    }
    if (user.waitingFor === "student_review_program") {
      await cleanUpInput(ctx, userId);
      const rating = user.waitingPayload?.rating || 5;
      db.setWaitingFor(userId, "student_review_text", { rating, program: text });
      const isUz = user.lang === "uz";
      const promptText = isUz ? `\u{1F4AC} <b>3-Qadam: Sharhingiz Matni</b>

Polshada o'qish, viza olish, yotoqxona yoki bot xizmatlari haqidagi fikr va maslahatlaringizni yozib yuboring:` : `\u{1F4AC} <b>Step 3: Review Description</b>

Please share your thoughts, tips, and feedback about studying in Poland or your application process:`;
      const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }
    if (user.waitingFor === "student_review_text") {
      await cleanUpInput(ctx, userId);
      const rating = user.waitingPayload?.rating || 5;
      const programRaw = user.waitingPayload?.program || "General Study";
      db.setWaitingFor(userId, null);
      const fullName = user.fullName || user.firstName || "Student";
      const parts = programRaw.split("-");
      const university = parts[0]?.trim() || "Poland University";
      const program = parts[1]?.trim() || programRaw;
      const rev = db.addReview({
        userId,
        name: fullName,
        country: user.country || "Uzbekistan",
        university,
        program,
        rating,
        text: { en: text, uz: text },
        status: "pending"
      });
      const isUz = user.lang === "uz";
      const replyMsg = isUz ? `\u{1F389} <b>Sharhingiz Muvaffaqiyatli Yuborildi!</b>

\u2022 \u{1F464} Ism: <b>${escapeHtml(rev.name)}</b>
\u2022 \u2B50 Baho: <b>${"\u2B50".repeat(rev.rating)}</b>
\u2022 \u{1F3DB}\uFE0F Universitet: <b>${escapeHtml(rev.university)}</b>
\u2022 \u{1F4AC} Fikr: <i>"${escapeHtml(text)}"</i>

\u{1F7E1} <i>Sharhingiz moderatorlar tomonidan ko'rib chiqilib, tez orada talabalar sharhlari ro'yxatida e'lon qilinadi. Katta rahmat!</i>` : `\u{1F389} <b>Review Submitted Successfully!</b>

\u2022 \u{1F464} Name: <b>${escapeHtml(rev.name)}</b>
\u2022 \u2B50 Rating: <b>${"\u2B50".repeat(rev.rating)}</b>
\u2022 \u{1F3DB}\uFE0F University: <b>${escapeHtml(rev.university)}</b>
\u2022 \u{1F4AC} Feedback: <i>"${escapeHtml(text)}"</i>

\u{1F7E1} <i>Your review is in moderation and will appear in the Student Reviews section shortly. Thank you!</i>`;
      await ctx.reply(replyMsg, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: isUz ? "\u{1F3E0} Bosh Menyu" : "\u{1F3E0} Main Menu", callback_data: "go_main_menu" }]]
        }
      });
      return;
    }
    if (user.waitingFor === "premium_code") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const res = db.redeemPromoCode(text, userId);
      const isUz = user.lang === "uz";
      if (res.success) {
        const successMsg = isUz ? `\u{1F389} <b>TABRIKLAYMIZ!</b>

Siz kiritgan <code>${escapeHtml(text.toUpperCase())}</code> promokodi muvaffaqiyatli faollashtirildi!
\u{1F31F} <b>Ochilgan A'zolik Darajasi:</b> <b>${escapeHtml(res.tier)}</b>

\u2022 Hujjatlar nazorati va qabul hujjatlarini yuklash imkoniyati
\u2022 Kirish imtihonlari va fan testlariga to'liq kirish
\u2022 Universitetlarga to'g'ridan-to'g'ri ariza topshirish huquqi
\u2022 Rasmiy maslahatchilar tomonidan hujjatlarni to'liq tekshirish
\u2022 Rasmiy NAWA SYRENA nostrifikatsiyasi va Polsha qasamyodli tarjimalari
\u2022 Shaxsiy koordinator: <a href="https://t.me/poland_admissions_bot">Admissions Team</a>` : `\u{1F389} <b>CONGRATULATIONS!</b>

Your code <code>${escapeHtml(text.toUpperCase())}</code> has been redeemed!
\u{1F31F} <b>Unlocked Tier:</b> <b>${escapeHtml(res.tier)}</b>

\u2022 Full access to Document Checklist & Certified Advisor Verification
\u2022 Full access to University Entrance & Placement Exams
\u2022 Direct university application filing
\u2022 Official NAWA SYRENA legalization & sworn translations
\u2022 Direct contact: <a href="https://t.me/poland_admissions_bot">Admissions Team</a>`;
        await ctx.reply(successMsg, { parse_mode: "HTML" });
      } else {
        const failMsg = isUz ? `\u274C <b>Faollashtirish Amalga Oshmadi</b>

Sabab: ${escapeHtml(res.error || "Kod topilmadi")}.
Iltimos, kiritilgan kodni tekshiring yoki yangi kod olish uchun maslahatchi bilan bog'laning:` : `\u274C <b>Activation Failed</b>

Reason: ${escapeHtml(res.error || "Code not recognized")}.
Please contact your consultant or tap below to purchase a code:`;
        await ctx.reply(failMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{
                text: isUz ? "\u{1F4AC} Maslahatchidan Kod Olish" : "\u{1F4AC} Contact Advisor for Access Code",
                url: "https://t.me/poland_admissions_bot"
              }],
              [{ text: isUz ? "\u{1F3E0} Bosh Menyu" : "\u{1F3E0} Main Menu", callback_data: "go_main_menu" }]
            ]
          }
        });
      }
      return;
    }
    return next();
  });
}

// src/bot/handlers/adminHandler.ts
function setupAdminHandler(bot) {
  const checkAdminAuth = (userId) => {
    if (!userId) return false;
    const user = db.getUser(userId);
    return user.isAdmin || isAdminUser(userId);
  };
  const renderAdminDashboard = async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) {
      await ctx.reply(
        "\u{1F512} <b>Admin Access Required</b>\n\nPlease provide the admin passcode using:\n<code>/admin &lt;passcode&gt;</code>",
        { parse_mode: "HTML" }
      );
      return;
    }
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const users = db.getAllUsers();
    const apps = db.getAllApplications();
    const pendingDocs = db.getPendingDocuments();
    const nawaApps = db.getAllNawaApplications();
    const allRevs = db.getAllReviews();
    const pendingRevs = db.getPendingReviews();
    const text = isUz ? `\u{1F39B}\uFE0F <b>PTU Administrator CRM Paneli</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4CA} <b>Tizim Statistikasi:</b>
\u2022 \u{1F465} Ro'yxatdan o'tgan talabalar: <b>${users.length}</b> ta
\u2022 \u{1F4CB} Universitet arizalari: <b>${apps.length}</b> ta
\u2022 \u{1F4C1} Tasdiqlash kutilayotgan hujjatlar: <b>${pendingDocs.length}</b> ta
\u2022 \u{1F3DB}\uFE0F NAWA arizalari: <b>${nawaApps.length}</b> ta
\u2022 \u2B50 Talabalar sharhlari: <b>${allRevs.length} ta (${pendingRevs.length} ta kutilmoqda)</b>

<i>Boshqarish uchun quyidagi bo'limlardan birini tanlang:</i>` : `\u{1F39B}\uFE0F <b>PTU Admin CRM Dashboard</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4CA} <b>Live System Overview:</b>
\u2022 \u{1F465} Registered Students: <b>${users.length}</b>
\u2022 \u{1F4CB} University Applications: <b>${apps.length}</b>
\u2022 \u{1F4C1} Documents Awaiting Review: <b>${pendingDocs.length}</b>
\u2022 \u{1F3DB}\uFE0F NAWA Applications: <b>${nawaApps.length}</b>
\u2022 \u2B50 Student Reviews: <b>${allRevs.length} (${pendingRevs.length} pending)</b>

<i>Select a management section below:</i>`;
    const kb = getAdminDashboardKeyboard(
      {
        usersCount: users.length,
        appsCount: apps.length,
        pendingDocsCount: pendingDocs.length,
        nawaCount: nawaApps.length,
        reviewsCount: allRevs.length
      },
      user.lang
    );
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  };
  bot.command("admin", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {
    }
    const text = ctx.message?.text || "";
    const args = text.split(" ").slice(1);
    const passedCode = args[0]?.trim();
    if (passedCode && passedCode === config2.adminPasscode) {
      db.updateUser(userId, { isAdmin: true });
      await ctx.reply("\u2705 <b>Admin access unlocked successfully!</b>", { parse_mode: "HTML" });
    }
    await renderAdminDashboard(ctx);
  });
  bot.callbackQuery("admin_main", async (ctx) => {
    await ctx.answerCallbackQuery();
    await renderAdminDashboard(ctx);
  });
  bot.callbackQuery("admin_refresh", async (ctx) => {
    const userId = ctx.from?.id;
    const user = userId ? db.getUser(userId) : void 0;
    await ctx.answerCallbackQuery({ text: user?.lang === "uz" ? "Statistika yangilandi" : "Refreshed live statistics" });
    await renderAdminDashboard(ctx);
  });
  bot.callbackQuery("admin_switch_lang", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const user = db.getUser(userId);
    const newLang = user.lang === "uz" ? "en" : "uz";
    db.setLanguage(userId, newLang);
    await ctx.answerCallbackQuery({
      text: newLang === "uz" ? "Admin tili: O'zbekcha \u{1F1FA}\u{1F1FF}" : "Admin language: English \u{1F1EC}\u{1F1E7}"
    });
    await renderAdminDashboard(ctx);
  });
  bot.callbackQuery("admin_menu_users", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const users = db.getAllUsers();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F465} <b>Talabalar CRM Bazasi (${users.length} nafar talaba)</b>

<i>Aloqa ma'lumotlari, hujjatlar, arizalar va VIP promokod berish uchun talabani tanlang:</i>` : `\u{1F465} <b>Student CRM Database (${users.length} registered students)</b>

<i>Tap any student below to view full contact info, uploaded documents, applications, or assign a VIP promo code:</i>`;
    const kb = getAdminUsersListKeyboard(users, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });
  bot.callbackQuery(/^admin_users_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_users_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : void 0;
    const isUz = adminUser?.lang === "uz";
    const users = db.getAllUsers();
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      isUz ? `\u{1F465} <b>Talabalar CRM Bazasi (${users.length} nafar talaba)</b>

<i>${page + 1}-sahifa:</i>` : `\u{1F465} <b>Student CRM Database (${users.length} registered students)</b>

<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminUsersListKeyboard(users, page, 6, adminUser?.lang)
      }
    );
  });
  bot.callbackQuery("admin_search_user_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    db.setWaitingFor(userId, "admin_search_user");
    await ctx.answerCallbackQuery();
    const promptText = adminUser.lang === "uz" ? "\u{1F50D} <b>Talabani Qidirish:</b>\nTalabaning Ismi, Username yoki Telefon raqamini yuboring:" : "\u{1F50D} <b>Search Student:</b>\nPlease send the student's Full Name, Username, or Phone:";
    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_view_user_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_user_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const isUz = adminUser?.lang === "uz";
    const apps = db.getUserApplications(targetUserId);
    const docs = user.documents || {};
    const verifiedDocs = Object.values(docs).filter((d) => d.status === "approved").length;
    let appsSummary = isUz ? "Mavjud emas" : "None";
    if (apps.length > 0) {
      appsSummary = apps.map((a) => `\u2022 #${a.id} ${a.programName} (${a.university}) \u2014 [${a.stage}]`).join("\n");
    }
    const text = isUz ? `\u{1F464} <b>Talaba Ma'lumotlari: ${escapeHtml(user.fullName || user.firstName || `Foydalanuvchi #${user.userId}`)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} User ID: <code>${user.userId}</code>
\u2022 \u{1F464} Username: ${user.username ? `@${escapeHtml(user.username)}` : "<i>(mavjud emas)</i>"}
\u2022 \u{1F4DE} Telefon: <code>${escapeHtml(user.phone || "kiritilmagan")}</code>
\u2022 \u{1F393} Bosqich: <b>${escapeHtml(user.preferredLevel || "Bakalavr")}</b>
\u2022 \u{1F48E} A'zolik: <b>${user.isPremium ? `\u{1F48E} ${user.premiumTier}` : "\u26AA Oddiy Talaba"}</b>
\u2022 \u{1F4C1} Tasdiqlangan Hujjatlar: <b>${verifiedDocs} / ${Object.keys(docs).length || 7}</b>
\u2022 \u{1F4C5} Ro'yxatdan o'tgan: ${escapeHtml(user.registeredAt)}
\u2022 \u23F1\uFE0F Oxirgi faollik: ${escapeHtml(user.lastActiveAt)}

\u{1F4CB} <b>Universitet Arizalari (${apps.length}):</b>
${escapeHtml(appsSummary)}` : `\u{1F464} <b>Student Dossier: ${escapeHtml(user.fullName || user.firstName || `User #${user.userId}`)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} User ID: <code>${user.userId}</code>
\u2022 \u{1F464} Username: ${user.username ? `@${escapeHtml(user.username)}` : "<i>(none)</i>"}
\u2022 \u{1F4DE} Phone: <code>${escapeHtml(user.phone || "not provided")}</code>
\u2022 \u{1F393} Target Degree: <b>${escapeHtml(user.preferredLevel || "Not specified")}</b>
\u2022 \u{1F48E} Membership: <b>${user.isPremium ? `\u{1F48E} ${user.premiumTier}` : "\u26AA Free Student"}</b>
\u2022 \u{1F4C1} Verified Docs: <b>${verifiedDocs} / ${Object.keys(docs).length || 7}</b>
\u2022 \u{1F4C5} Registered: ${escapeHtml(user.registeredAt)}
\u2022 \u23F1\uFE0F Last Active: ${escapeHtml(user.lastActiveAt)}

\u{1F4CB} <b>University Applications (${apps.length}):</b>
${escapeHtml(appsSummary)}`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_assign_promo_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_assign_promo_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);
    const promo = db.generatePersonalPromo(
      targetUserId,
      user.fullName || user.firstName || `User #${targetUserId}`,
      "Full Premium"
    );
    await ctx.answerCallbackQuery({ text: `VIP Code ${promo.code} created!` });
    try {
      await bot.api.sendMessage(
        targetUserId,
        `\u{1F381} <b>Admissions Consultant Gift!</b>

An advisor assigned you an exclusive Single-Use VIP Promo Code:
\u{1F511} <code>${escapeHtml(promo.code)}</code>

Tap <b>\u{1F48E} Premium A'zolik</b> in the bot menu to activate your full admissions package!`,
        { parse_mode: "HTML" }
      );
    } catch {
    }
    await ctx.reply(
      `\u2705 <b>Exclusive Single-Use Promo Code Generated & Sent to Student!</b>

\u2022 \u{1F464} Student: <b>${escapeHtml(user.fullName || user.firstName || "")}</b> (<code>${targetUserId}</code>)
\u2022 \u{1F511} Code: <code>${escapeHtml(promo.code)}</code>
\u2022 \u{1F48E} Tier: <b>${escapeHtml(promo.tier)}</b>`,
      {
        parse_mode: "HTML"
      }
    );
  });
  bot.callbackQuery(/^admin_toggle_admin_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_admin_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);
    const newStatus = !user.isAdmin;
    db.updateUser(targetUserId, { isAdmin: newStatus });
    await ctx.answerCallbackQuery({ text: `Admin role ${newStatus ? "granted" : "revoked"}` });
    const updatedUser = db.getUser(targetUserId);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminUserDetailKeyboard(updatedUser, adminUser?.lang)
    });
  });
  bot.callbackQuery("admin_menu_apps", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const apps = db.getAllApplications();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F4CB} <b>Universitet Arizalari Boshqaruvi (${apps.length} ta)</b>

<i>Qabul bosqichini o'zgartirish yoki talabaga izoh yuborish uchun arizani tanlang:</i>` : `\u{1F4CB} <b>University Applications Management (${apps.length} total)</b>

<i>Tap any application below to update admission stage or send counselor notes to the student:</i>`;
    const kb = getAdminApplicationsListKeyboard(apps, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });
  bot.callbackQuery(/^admin_apps_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_apps_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : void 0;
    const apps = db.getAllApplications();
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz" ? `\u{1F4CB} <b>Universitet Arizalari (${apps.length} ta)</b>

<i>${page + 1}-sahifa:</i>` : `\u{1F4CB} <b>University Applications (${apps.length} total)</b>

<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminApplicationsListKeyboard(apps, page, 6, adminUser?.lang)
      }
    );
  });
  bot.callbackQuery(/^admin_view_app_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_app_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const app = db.getApplication(appId);
    if (!app) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const isUz = adminUser?.lang === "uz";
    const student = db.getUser(app.userId);
    const text = isUz ? `\u{1F4CB} <b>Ariza Ma'lumotlari #${escapeHtml(app.id)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F464} Talaba: <b>${escapeHtml(app.studentName)}</b> (<code>${app.userId}</code>)
\u2022 \u{1F4DE} Telefon: <code>${escapeHtml(student.phone || "kiritilmagan")}</code>
\u2022 \u{1F3DB}\uFE0F Universitet: <b>${escapeHtml(app.university)}</b> (${escapeHtml(app.city)})
\u2022 \u{1F4D8} Dastur: <b>${escapeHtml(app.programName)}</b>
\u2022 \u{1F4CC} Bosqich: <code>${escapeHtml(app.stage)}</code>
` + (app.counselorNote ? `\u2022 \u{1F4AC} Maslahatchi Izohi: <i>"${escapeHtml(app.counselorNote)}"</i>
` : "") + `\u2022 \u{1F4C5} Topshirilgan: ${escapeHtml(app.submittedAt)}
\u2022 \u23F1\uFE0F Yangilangan: ${escapeHtml(app.updatedAt)}

<i>Qabul bosqichini tanlang:</i>` : `\u{1F4CB} <b>Application Dossier #${escapeHtml(app.id)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F464} Student: <b>${escapeHtml(app.studentName)}</b> (<code>${app.userId}</code>)
\u2022 \u{1F4DE} Phone: <code>${escapeHtml(student.phone || "not set")}</code>
\u2022 \u{1F3DB}\uFE0F University: <b>${escapeHtml(app.university)}</b> (${escapeHtml(app.city)})
\u2022 \u{1F4D8} Program: <b>${escapeHtml(app.programName)}</b>
\u2022 \u{1F4CC} Stage: <code>${escapeHtml(app.stage)}</code>
` + (app.counselorNote ? `\u2022 \u{1F4AC} Counselor Note: <i>"${escapeHtml(app.counselorNote)}"</i>
` : "") + `\u2022 \u{1F4C5} Submitted: ${escapeHtml(app.submittedAt)}
\u2022 \u23F1\uFE0F Updated: ${escapeHtml(app.updatedAt)}

<i>Change the admission stage below:</i>`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_set_stage_([^_]+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_set_stage_([^_]+)_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const newStage = match[2];
    const app = db.updateApplicationStage(appId, newStage);
    await ctx.answerCallbackQuery({ text: `Stage updated to ${newStage}` });
    if (app) {
      try {
        await bot.api.sendMessage(
          app.userId,
          `\u{1F514} <b>Application Status Update!</b>

Your application for <b>${escapeHtml(app.programName)}</b> at <b>${escapeHtml(app.university)}</b> is now:
\u{1F4CC} <b>${escapeHtml(newStage)}</b>

Check your profile to view counselor instructions.`,
          { parse_mode: "HTML" }
        );
      } catch {
      }
      const adminId = ctx.from?.id;
      const adminUser = adminId ? db.getUser(adminId) : void 0;
      await ctx.editMessageText(
        `\u2705 Application <b>${escapeHtml(app.id)}</b> updated to <b>${escapeHtml(newStage)}</b> and student notified!`,
        {
          parse_mode: "HTML",
          reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang)
        }
      );
    }
  });
  bot.callbackQuery(/^admin_feedback_prompt_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_feedback_prompt_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_feedback_app", { appId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u{1F4AC} <b>Send Counselor Note for Application #${escapeHtml(appId)}:</b>

Type the feedback or missing requirements message you want to send to the student:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("admin_menu_docs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const pendingList = db.getPendingDocuments();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F4C1} <b>Hujjatlarni Tekshirish Navbati (${pendingList.length} ta kutilmoqda)</b>

<i>Hujjatni ko'rish, tasdiqlash yoki qayta yuklash talab qilish uchun tanlang:</i>` : `\u{1F4C1} <b>Documents Verification Queue (${pendingList.length} pending review)</b>

<i>Tap any document below to view submitted files, approve, or request corrections:</i>`;
    const kb = getAdminPendingDocsKeyboard(pendingList, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });
  bot.callbackQuery(/^admin_review_doc_(\d+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_review_doc_(\d+)_(.+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];
    const student = db.getUser(targetUserId);
    const doc = student.documents?.[docKey];
    if (!doc) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const isUz = adminUser?.lang === "uz";
    let fileContentDesc = isUz ? "Fayl biriktirilmagan" : "No file attached";
    if (doc.link) {
      fileContentDesc = `\u{1F517} <b>${isUz ? "Havola" : "Submitted Link"}:</b> <a href="${escapeHtml(doc.link)}">${escapeHtml(doc.link)}</a>`;
    } else if (doc.fileId) {
      fileContentDesc = `\u{1F4C1} <b>${isUz ? "Fayl Nomi" : "File Name"}:</b> <code>${escapeHtml(doc.fileName || "File")}</code> (Type: ${doc.fileType})`;
    }
    const text = `\u{1F4C1} <b>Review Document: ${escapeHtml(docKey.toUpperCase())}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F464} Student: <b>${escapeHtml(student.fullName || student.firstName || "")}</b> (<code>${targetUserId}</code>)
\u2022 \u{1F4DE} Phone: <code>${escapeHtml(student.phone || "not set")}</code>
\u2022 \u{1F4CC} Status: <b>${escapeHtml(doc.status.toUpperCase())}</b>
\u2022 \u{1F4C5} Updated: ${escapeHtml(doc.updatedAt)}

${fileContentDesc}

<i>Choose an action below:</i>`;
    await ctx.answerCallbackQuery();
    if (doc.fileId) {
      try {
        if (doc.fileType === "photo") {
          await ctx.replyWithPhoto(doc.fileId, {
            caption: `\u{1F4F7} Photo for ${escapeHtml(docKey)} from ${escapeHtml(student.fullName || "")}`,
            parse_mode: "HTML"
          });
        } else {
          await ctx.replyWithDocument(doc.fileId, {
            caption: `\u{1F4C4} Document ${escapeHtml(doc.fileName || "")} for ${escapeHtml(docKey)}`,
            parse_mode: "HTML"
          });
        }
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminDocReviewKeyboard(targetUserId, docKey, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_doc_decision_(\d+)_([^_]+)_(approved|needs_correction)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_doc_decision_(\d+)_([^_]+)_(approved|needs_correction)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];
    const decision = match[3];
    db.verifyDocument(targetUserId, docKey, decision);
    const isApproved = decision === "approved";
    await ctx.answerCallbackQuery({ text: isApproved ? "Document Approved!" : "Correction requested" });
    try {
      if (isApproved) {
        await bot.api.sendMessage(
          targetUserId,
          `\u2705 <b>Document Verified!</b>

Your <b>${escapeHtml(docKey.toUpperCase())}</b> has been approved by admissions advisors.`,
          { parse_mode: "HTML" }
        );
      } else {
        await bot.api.sendMessage(
          targetUserId,
          `\u{1F534} <b>Document Correction Required!</b>

Your <b>${escapeHtml(docKey.toUpperCase())}</b> requires revision. Please re-upload in the Document Checklist.`,
          { parse_mode: "HTML" }
        );
      }
    } catch {
    }
    await ctx.editMessageText(
      `\u2705 Document <b>${escapeHtml(docKey)}</b> for student <code>${targetUserId}</code> marked as <b>${decision.toUpperCase()}</b>!`,
      { parse_mode: "HTML" }
    );
  });
  bot.callbackQuery(/^admin_doc_reject_note_(\d+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_doc_reject_note_(\d+)_(.+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_feedback_doc", { targetUserId, docKey });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u{1F4AC} <b>Rejection Note for ${escapeHtml(docKey.toUpperCase())}:</b>

Send the explanation of what needs to be fixed:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("admin_menu_promos", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const promos = db.getAllPromoCodes();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u26A1 <b>Promokodlar va Grantlar Boshqaruvi (${promos.length} ta kod)</b>

<i>Promokod tafsilotlarini ko'rish, o'chirish yoki yangi tasodifiy bir martalik kod yaratish:</i>` : `\u26A1 <b>Promo Codes & Grants Manager (${promos.length} codes)</b>

<i>Tap any promo code to view details, delete, expire or reactivate it, or generate a new random code:</i>`;
    const kb = getAdminPromoCodesKeyboard(promos, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });
  bot.callbackQuery("admin_gen_random_promo", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const promo = db.createPromoCode({
      tier: "Full Premium",
      maxUses: 1
      // Strictly 1 person
    });
    await ctx.answerCallbackQuery({ text: `Single-use code ${promo.code} generated!` });
    await ctx.reply(
      `\u26A1 <b>New Single-Use Promo Code Generated!</b>

\u2022 \u{1F511} Code: <code>${escapeHtml(promo.code)}</code>
\u2022 \u{1F48E} Tier: <b>${escapeHtml(promo.tier)}</b>
\u2022 \u{1F465} Max Uses: <b>1 (Single Student Exclusive)</b>
\u2022 \u{1F7E2} Status: <b>ACTIVE (Available)</b>

<i>Give this code to 1 student. As soon as it is entered, it is consumed and immediately becomes unavailable.</i>`,
      {
        parse_mode: "HTML"
      }
    );
  });
  bot.callbackQuery(/^admin_view_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];
    const promo = db.getPromoCode(codeKey);
    if (!promo) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const statusBadge = promo.isExpired || !promo.isActive ? "\u{1F534} EXPIRED / INACTIVE" : "\u{1F7E2} ACTIVE";
    const text = `\u{1F511} <b>Promo Code Details: <code>${escapeHtml(promo.code)}</code></b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F4CC} Status: <b>${statusBadge}</b>
\u2022 \u{1F48E} Tier: <b>${escapeHtml(promo.tier)}</b>
\u2022 \u{1F465} Uses: <b>${promo.usedCount} / ${promo.maxUses}</b>
\u2022 \u{1F4C5} Created: ${escapeHtml(promo.createdAt)}
` + (promo.assignedUserName ? `\u2022 \u{1F464} Assigned to: <b>${escapeHtml(promo.assignedUserName)}</b> (<code>${promo.assignedUserId}</code>)
` : "") + (promo.usedByUserName ? `\u2022 \u2705 Redeemed by: <b>${escapeHtml(promo.usedByUserName)}</b> on ${escapeHtml(promo.usedAt)}
` : "") + (promo.expiresAt ? `\u2022 \u23F3 Expiry Date: ${escapeHtml(promo.expiresAt)}
` : "");
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminPromoDetailKeyboard(promo, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminPromoDetailKeyboard(promo, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_expire_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_expire_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];
    db.expirePromoCode(codeKey);
    const promo = db.getPromoCode(codeKey);
    await ctx.answerCallbackQuery({ text: `Code ${codeKey} expired!` });
    await ctx.reply(`\u{1F534} Code <code>${escapeHtml(codeKey)}</code> is now <b>EXPIRED / DEACTIVATED</b>. Students can no longer redeem it.`, {
      parse_mode: "HTML"
    });
  });
  bot.callbackQuery(/^admin_reactivate_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_reactivate_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];
    db.reactivatePromoCode(codeKey);
    const promo = db.getPromoCode(codeKey);
    await ctx.answerCallbackQuery({ text: `Code ${codeKey} reactivated!` });
    await ctx.reply(`\u{1F7E2} Code <code>${escapeHtml(codeKey)}</code> is now <b>ACTIVE</b> again and can be redeemed by students.`, {
      parse_mode: "HTML"
    });
  });
  bot.callbackQuery(/^admin_delete_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];
    db.deletePromoCode(codeKey);
    await ctx.answerCallbackQuery({ text: `Code ${codeKey} deleted permanently!` });
    await ctx.reply(`\u{1F5D1}\uFE0F Promo code <code>${escapeHtml(codeKey)}</code> has been <b>permanently deleted</b> from the database.`, {
      parse_mode: "HTML"
    });
    const promos = db.getAllPromoCodes();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.reply(
      `\u26A1 <b>Promo Codes & Grants Manager (${promos.length} codes)</b>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminPromoCodesKeyboard(promos, 0, 6, adminUser?.lang)
      }
    );
  });
  bot.callbackQuery("admin_create_promo_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_create_promo");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u2795 <b>Create Custom Promo Code</b>

Please send in the format: <code>&lt;CODE&gt; &lt;TIER&gt; &lt;MAX_USES&gt;</code>
<i>Example (Single Student):</i> <code>PTU-VIP-GOLD Full Premium 1</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("admin_menu_manage_unis", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const unis = db.getAllUniversities();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F3DB}\uFE0F <b>Polsha Universitetlari Bazasi (${unis.length} ta oliygoh)</b>

<i>Rasmiy veb-sayt havolasini o'zgartirish, kontrakt narxini tahrirlash yoki universitetni o'chirish uchun tanlang:</i>` : `\u{1F3DB}\uFE0F <b>Polish Universities Database (${unis.length} institutions)</b>

<i>Tap any university to edit official website URL link, tuition, or delete it from the bot:</i>`;
    const kb = getAdminUniversitiesKeyboard(unis, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {
      }
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
  bot.callbackQuery(/^admin_unis_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_unis_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : void 0;
    const unis = db.getAllUniversities();
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz" ? `\u{1F3DB}\uFE0F <b>Polsha Universitetlari Bazasi (${unis.length} ta oliygoh)</b>

<i>${page + 1}-sahifa:</i>` : `\u{1F3DB}\uFE0F <b>Polish Universities Database (${unis.length} institutions)</b>

<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminUniversitiesKeyboard(unis, page, 6, adminUser?.lang)
      }
    );
  });
  bot.callbackQuery(/^admin_view_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const uni = db.getUniversity(uniId);
    if (!uni) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const text = `\u{1F3DB}\uFE0F <b>University Details: ${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} ID: <code>${escapeHtml(uni.id)}</code>
\u2022 \u{1F4CD} City: <b>${escapeHtml(uni.city)}</b>
\u2022 \u{1F3EB} Type: <b>${escapeHtml(uni.type)}</b>
\u2022 \u{1F3C6} Ranking: <b>${escapeHtml(uni.ranking)}</b>
\u2022 \u{1F310} Website Link: <a href="${escapeHtml(uni.website)}">${escapeHtml(uni.website)}</a>
\u2022 \u{1F4B0} English Tuition: <b>${escapeHtml(uni.tuition.english)}</b>
\u2022 \u{1F4B0} Non-EU Tuition: <b>${escapeHtml(uni.tuition.nonEu)}</b>
\u2022 \u{1F4C5} Deadline: <b>${escapeHtml(uni.deadline)}</b>
`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminUniversityEditKeyboard(uni, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminUniversityEditKeyboard(uni, adminUser?.lang)
    });
  });
  bot.callbackQuery("admin_add_uni_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_add_university");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u2795 <b>Add New University</b>

Please send in the format:
<code>&lt;ID&gt; | &lt;NAME&gt; | &lt;ABBR&gt; | &lt;CITY&gt; | &lt;TYPE(Public/Private)&gt; | &lt;RANKING&gt; | &lt;TUITION&gt; | &lt;WEBSITE_URL&gt;</code>

<i>Example:</i>
<code>cue | Cracow University of Economics | CUE | Krak\xF3w | Public | #12 | 2,200 EUR/yr | https://uek.krakow.pl</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_edit_uni_web_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_uni_web_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_edit_uni_web", { uniId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u{1F310} <b>Update Website Link for ${escapeHtml(uniId)}:</b>

Send the new official website URL (e.g. <code>https://en.uw.edu.pl</code>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_edit_uni_tui_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_uni_tui_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_edit_uni_tui", { uniId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u{1F4B0} <b>Update Tuition Fee for ${escapeHtml(uniId)}:</b>

Send the new tuition fee text (e.g. <code>2,400 EUR / year</code>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_delete_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    db.deleteUniversity(uniId);
    await ctx.answerCallbackQuery({ text: `University ${uniId} deleted!` });
    await ctx.reply(`\u{1F5D1}\uFE0F University <code>${escapeHtml(uniId)}</code> has been deleted.`, { parse_mode: "HTML" });
    const unis = db.getAllUniversities();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.reply(`\u{1F3DB}\uFE0F <b>Polish Universities Database (${unis.length} institutions)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminUniversitiesKeyboard(unis, 0, 6, adminUser?.lang)
    });
  });
  bot.callbackQuery("admin_menu_manage_docdefs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const docDefs = db.getDocumentDefinitions();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F4D1} <b>Hujjat Talablari Turlari (${Object.keys(docDefs).length} ta tur)</b>

<i>Majburiy yoki ixtiyoriy qilish, yoki o'chirish uchun hujjat turini tanlang:</i>` : `\u{1F4D1} <b>Document Checklist Requirements (${Object.keys(docDefs).length} types)</b>

<i>Tap any document requirement to toggle mandatory/optional status or delete it:</i>`;
    const kb = getAdminDocDefsKeyboard(docDefs, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {
      }
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
  bot.callbackQuery(/^admin_view_docdef_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_docdef_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const def = db.getDocumentDefinition(docKey);
    if (!def) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const text = `\u{1F4D1} <b>Document Requirement: ${escapeHtml(def.name.en)}</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F194} Key: <code>${escapeHtml(def.id)}</code>
\u2022 \u{1F1EC}\u{1F1E7} Name (EN): <b>${escapeHtml(def.name.en)}</b>
\u2022 \u{1F1FA}\u{1F1FF} Name (UZ): <b>${escapeHtml(def.name.uz)}</b>
\u2022 \u2B50 Mandatory: <b>${def.required ? "YES (Required)" : "NO (Optional)"}</b>
\u2022 \u{1F4DD} Description (EN): <i>${escapeHtml(def.desc.en)}</i>
\u2022 \u{1F4DD} Description (UZ): <i>${escapeHtml(def.desc.uz)}</i>
`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_toggle_docdef_req_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_docdef_req_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const def = db.getDocumentDefinition(docKey);
    if (!def) return;
    def.required = !def.required;
    db.saveDocumentDefinition(def);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.answerCallbackQuery({ text: `Requirement set to ${def.required ? "Required" : "Optional"}` });
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_delete_docdef_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_docdef_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    db.deleteDocumentDefinition(docKey);
    await ctx.answerCallbackQuery({ text: `Document type ${docKey} deleted!` });
    await ctx.reply(`\u{1F5D1}\uFE0F Document type <code>${escapeHtml(docKey)}</code> deleted.`, { parse_mode: "HTML" });
    const docDefs = db.getDocumentDefinitions();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.reply(`\u{1F4D1} <b>Document Checklist Requirements (${Object.keys(docDefs).length} types)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminDocDefsKeyboard(docDefs, adminUser?.lang)
    });
  });
  bot.callbackQuery("admin_add_docdef_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_add_docdef");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u2795 <b>Add New Document Type</b>

Please send in the format:
<code>&lt;KEY&gt; | &lt;NAME_EN&gt; | &lt;NAME_UZ&gt; | &lt;DESC_EN&gt; | &lt;DESC_UZ&gt; | &lt;REQUIRED(yes/no)&gt;</code>

<i>Example:</i>
<code>medical_cert | Medical Certificate | Tibbiy Ma'lumotnoma | General health fitness certificate | O'qishga yaroqlilik haqidagi tibbiy ma'lumotnoma | yes</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery("admin_menu_reviews", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const revs = db.getAllReviews();
    const pending = db.getPendingReviews();
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u2B50 <b>Talabalar Sharhlari Boshqaruvi (${revs.length} ta jami, ${pending.length} ta tasdiq kutilmoqda)</b>

<i>Tasdiqlash, matn/bahoni tahrirlash yoki o'chirish uchun sharhni tanlang:</i>` : `\u2B50 <b>Student Reviews & Testimonials (${revs.length} total, ${pending.length} pending)</b>

<i>Tap any review to approve, edit text/rating, or delete it:</i>`;
    const kb = getAdminReviewsListKeyboard(revs, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {
      }
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
  bot.callbackQuery(/^admin_revs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_revs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : void 0;
    const revs = db.getAllReviews();
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz" ? `\u2B50 <b>Talabalar Sharhlari (${revs.length} ta)</b>

<i>${page + 1}-sahifa:</i>` : `\u2B50 <b>Student Reviews (${revs.length} total)</b>

<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminReviewsListKeyboard(revs, page, 6, adminUser?.lang)
      }
    );
  });
  bot.callbackQuery(/^admin_view_rev_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_rev_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const rev = db.getReview(revId);
    if (!rev) return;
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    const statusBadge = rev.status === "approved" ? "\u{1F7E2} APPROVED & PUBLISHED" : "\u{1F7E1} PENDING MODERATION";
    const text = `\u2B50 <b>Review #${rev.id} Dossier</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2022 \u{1F4CC} Status: <b>${statusBadge}</b>
\u2022 \u{1F464} Student: <b>${escapeHtml(rev.name)}</b> (${escapeHtml(rev.country)})
\u2022 \u{1F3DB}\uFE0F University: <b>${escapeHtml(rev.university)}</b>
\u2022 \u{1F4D8} Program: <b>${escapeHtml(rev.program)}</b> (${escapeHtml(rev.year)})
\u2022 \u2B50 Rating: <b>${"\u2B50".repeat(rev.rating)} (${rev.rating}/5)</b>
\u2022 \u{1F4C5} Date: ${escapeHtml(rev.submittedAt)}

\u{1F4AC} <b>Review Text (EN):</b>
<i>"${escapeHtml(rev.text.en)}"</i>

\u{1F4AC} <b>Review Text (UZ):</b>
<i>"${escapeHtml(rev.text.uz)}"</i>
`;
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang)
        });
        return;
      } catch {
      }
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_rev_decision_(\d+)_(approve|reject)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_rev_decision_(\d+)_(approve|reject)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const isApprove = match[2] === "approve";
    db.moderateReview(revId, isApprove);
    await ctx.answerCallbackQuery({ text: isApprove ? "Review Published!" : "Review Rejected & Deleted" });
    const rev = db.getReview(revId);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    if (rev && isApprove) {
      await ctx.editMessageText(
        `\u2705 Review #${revId} approved and published live to all students!`,
        {
          parse_mode: "HTML",
          reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang)
        }
      );
    } else {
      await ctx.editMessageText(`\u{1F5D1}\uFE0F Review #${revId} rejected and removed from database.`, {
        parse_mode: "HTML"
      });
      const revs = db.getAllReviews();
      await ctx.reply(`\u2B50 <b>Student Reviews & Testimonials (${revs.length} total)</b>`, {
        parse_mode: "HTML",
        reply_markup: getAdminReviewsListKeyboard(revs, 0, 6, adminUser?.lang)
      });
    }
  });
  bot.callbackQuery("admin_add_rev_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_add_review");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u2795 <b>Add New Student Review / Testimonial</b>

Please send in the format:
<code>&lt;NAME&gt; | &lt;COUNTRY&gt; | &lt;UNIVERSITY&gt; | &lt;PROGRAM&gt; | &lt;RATING(1-5)&gt; | &lt;TEXT_EN&gt; | &lt;TEXT_UZ&gt;</code>

<i>Example:</i>
<code>Shoxrux Bek | Uzbekistan | Kozminski University | Finance (B.Sc) | 5 | Outstanding faculty and campus! | Ajoyib ta'lim va zamonaviy kampus!</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_edit_rev_text_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_rev_text_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_edit_review_text", { revId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u270F\uFE0F <b>Edit Text for Review #${revId}:</b>

Send the updated review text:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  bot.callbackQuery(/^admin_edit_rev_rating_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_rev_rating_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const rev = db.getReview(revId);
    if (!rev) return;
    rev.rating = rev.rating <= 1 ? 5 : rev.rating - 1;
    db.updateReview(revId, { rating: rev.rating });
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.answerCallbackQuery({ text: `Rating set to ${rev.rating}\u2B50` });
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang)
    });
  });
  bot.callbackQuery(/^admin_delete_rev_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_rev_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    db.deleteReview(revId);
    await ctx.answerCallbackQuery({ text: `Review #${revId} deleted!` });
    await ctx.reply(`\u{1F5D1}\uFE0F Review #${revId} deleted from database.`, { parse_mode: "HTML" });
    const revs = db.getAllReviews();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : void 0;
    await ctx.reply(`\u2B50 <b>Student Reviews & Testimonials (${revs.length} total)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminReviewsListKeyboard(revs, 0, 6, adminUser?.lang)
    });
  });
  bot.callbackQuery("admin_broadcast_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    db.setWaitingFor(userId, "admin_broadcast_text");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `\u{1F4E2} <b>Global Student Broadcast</b>

Send the announcement message you want to broadcast to all registered students in the bot:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}

// src/bot/handlers/reviewHandler.ts
function setupReviewHandler(bot) {
  const handleReviewsMenu = async (ctx, page = 0) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const approvedReviews = db.getApprovedReviews();
    const pageSize = 2;
    const start = page * pageSize;
    const pageItems = approvedReviews.slice(start, start + pageSize);
    let reviewsText = "";
    if (pageItems.length === 0) {
      reviewsText = isUz ? `<i>Hozircha sharhlar mavjud emas. Birinchi bo'lib o'z sharhingizni qoldiring!</i>` : `<i>No reviews yet. Be the first to share your experience studying in Poland!</i>`;
    } else {
      pageItems.forEach((rev) => {
        const text = rev.text[user.lang] || rev.text.en;
        reviewsText += `\u2B50 <b>${"\u2B50".repeat(rev.rating)}</b> | <b>${escapeHtml(rev.name)}</b> (${escapeHtml(rev.country)})
\u{1F3DB}\uFE0F <i>${escapeHtml(rev.university)}</i> \u2014 <code>${escapeHtml(rev.program)}</code> (${rev.year})
\u{1F4AC} "${escapeHtml(text)}"

`;
      });
    }
    const title = isUz ? `\u2B50 <b>Polshada O'qiyotgan Talabalar Fikrlari</b>

O'zbekistonlik va xalqaro talabalarning Polsha universitetlari, viza va yotoqxona bo'yicha real tajribalari:

${reviewsText}\u{1F4CC} <i>${page + 1}-sahifa (jami ${approvedReviews.length} ta sharh)</i>` : `\u2B50 <b>Student Experiences & Reviews</b>

Real feedback and advice from international students currently studying at top Polish universities:

${reviewsText}\u{1F4CC} <i>Page ${page + 1} (${approvedReviews.length} reviews total)</i>`;
    const kb = getReviewsKeyboard(user.lang, approvedReviews, page, pageSize);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {
      }
    }
    await ctx.reply(title, { parse_mode: "HTML", reply_markup: kb });
  };
  bot.command("reviews", async (ctx) => handleReviewsMenu(ctx));
  bot.callbackQuery("menu_reviews", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleReviewsMenu(ctx);
  });
  bot.callbackQuery(/^revs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^revs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    await ctx.answerCallbackQuery();
    await handleReviewsMenu(ctx, page);
  });
  bot.callbackQuery("review_write_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u270D\uFE0F <b>O'z Sharhingizni Qoldiring (1-Qadam: Baho)</b>

Polshadagi ta'lim yoki PTU boti xizmatlariga qanday baho berasiz?` : `\u270D\uFE0F <b>Write a Review (Step 1: Rating)</b>

How would you rate your experience studying in Poland or using PTU admissions?`;
    const kb = getReviewRatingKeyboard(user.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {
      }
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
  bot.callbackQuery(/^rev_rate_(\d)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^rev_rate_(\d)$/);
    if (!match) return;
    const rating = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    db.setWaitingFor(userId, "student_review_program", { rating });
    await ctx.answerCallbackQuery();
    const text = isUz ? `\u{1F3DB}\uFE0F <b>2-Qadam: Universitet va Mutaxassislik</b>

Qaysi universitet va fakultetda o'qiyapsiz (yoki topshirgansiz)?
<i>Masalan:</i> <code>University of Warsaw - Computer Science</code>` : `\u{1F3DB}\uFE0F <b>Step 2: University & Degree Program</b>

Which university and program are you studying at (or applied to)?
<i>Example:</i> <code>University of Warsaw - Computer Science</code>`;
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
        return;
      } catch {
      }
    }
    const msg = await ctx.reply(text, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}

// src/bot/index.ts
function createBot(token) {
  const activeToken = token || config2.botToken;
  if (!activeToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN. Please provide a valid token from @BotFather.");
  }
  const bot = new Bot(activeToken);
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Grammy error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });
  setupStartHandler(bot);
  setupUniversityHandler(bot);
  setupProgramHandler(bot);
  setupNawaHandler(bot);
  setupDocumentHandler(bot);
  setupExamHandler(bot);
  setupPremiumHandler(bot);
  setupReviewHandler(bot);
  setupProfileHandler(bot);
  setupTextInputHandler(bot);
  setupAdminHandler(bot);
  return bot;
}
async function startBot(token) {
  validateConfig();
  const activeToken = token || config2.botToken;
  if (!activeToken) {
    console.error("\u274C Cannot start Telegram Bot: BOT_TOKEN is missing.");
    console.log("\u{1F449} How to fix: Set BOT_TOKEN in your .env file or run with BOT_TOKEN=your_token");
    return;
  }
  const bot = createBot(activeToken);
  console.log("\u{1F680} Starting Poland Top Universities (PTU) Telegram Bot...");
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
  } catch (e) {
  }
  await bot.start({
    onStart: (botInfo) => {
      console.log(`\u2705 PTU Bot is running as @${botInfo.username} (ID: ${botInfo.id})`);
      console.log("\u{1F1F5}\u{1F1F1} Universities, Programs, NAWA, Exams & Document Tracker ready!");
    }
  });
}
var isDirectRun = process.env.npm_lifecycle_event === "bot" || process.env.npm_lifecycle_event === "bot:dev" || Boolean(process.argv[1]) && (process.argv[1].endsWith("src/bot/index.ts") || process.argv[1].endsWith("src\\bot\\index.ts") || process.argv[1].endsWith("src/bot/index.js") || process.argv[1].endsWith("src\\bot\\index.js"));
if (isDirectRun) {
  startBot();
}

// api/webhook.ts
var handleTelegramUpdate = null;
async function handler(req, res) {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: "ok",
        bot: "Poland Top Universities (PTU) Telegram Bot",
        message: "Vercel Webhook is online and operational \u{1F680}"
      })
    );
    return;
  }
  try {
    if (!handleTelegramUpdate) {
      const bot = createBot();
      handleTelegramUpdate = webhookCallback(bot, "http");
    }
    try {
      await db.syncFromCloud();
    } catch (e) {
    }
    return await handleTelegramUpdate(req, res);
  } catch (err) {
    console.error("Vercel Webhook execution error:", err);
    if (!res.headersSent) {
      res.statusCode = 200;
      res.end("OK");
    }
  }
}
export {
  handler as default
};
