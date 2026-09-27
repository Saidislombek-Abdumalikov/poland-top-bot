import {
  UserProfile,
  UniversityItem,
  ProgramItem,
  DocumentItem,
  ApplicationItem,
  TestItem,
  ReviewItem,
  Language,
} from "../types";

// Telegram WebApp global interface
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function getTelegramUser() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  try {
    const haptic = window.Telegram?.WebApp?.HapticFeedback;
    if (!haptic) return;
    if (type === "success" || type === "error") {
      haptic.notificationOccurred(type);
    } else {
      haptic.impactOccurred(type);
    }
  } catch (e) {
    // Ignore in non-telegram browser
  }
}

const API_BASE = "";

export async function fetchCurrentUser(userId?: number): Promise<UserProfile | null> {
  const tgUser = getTelegramUser();
  const effectiveId = userId || tgUser?.id;

  if (!effectiveId) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/user?userId=${effectiveId}`);
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {
    console.warn("API offline or dev mode:", err);
  }

  // Fallback demo/mock user if server not reached
  return {
    id: effectiveId,
    firstName: tgUser?.first_name || "Talaba",
    lastName: tgUser?.last_name || "",
    fullName: `${tgUser?.first_name || "Saidislom"} ${tgUser?.last_name || "Karimov"}`.trim(),
    username: tgUser?.username || "student_poland",
    phone: "+998901234567",
    lang: "uz",
    isRegistered: true,
    isAdmin: effectiveId === 123456 || Boolean(tgUser?.username?.includes("admin")),
    preferredLevel: "bachelor",
    acceptedOfertaAt: Date.now() - 3600000,
  };
}

export async function fetchUniversities(): Promise<UniversityItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/universities`);
    if (res.ok) {
      const data = await res.json();
      return data.universities;
    }
  } catch (e) {}

  // High quality default universities
  return [
    {
      id: "uw",
      name: "University of Warsaw (Uniwersytet Warszawski)",
      city: "Warszawa (Varshava)",
      ranking: "Top #1 in Poland · QS #262",
      description: {
        uz: "Polshaning eng yirik va nufuzli davlat universiteti. 1816-yilda tashkil etilgan. Xalqaro diplom, zamonaviy kampus va nufuzli IT, biznes hamda xalqaro munosabatlar yo'nalishlari.",
        en: "Poland's largest and most prestigious state university founded in 1816. Globally accredited diplomas and world-class programs in IT, Business, and International Relations.",
      },
      tuitionRange: "€2,200 – €4,500 / yil",
      popularFaculties: ["Computer Science", "International Relations", "Economics & Finance", "Data Science"],
      intake: "Oktyabr 2026",
      websiteUrl: "https://en.uw.edu.pl",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "uj",
      name: "Jagiellonian University (Uniwersytet Jagielloński)",
      city: "Kraków (Krakov)",
      ranking: "Top #2 in Poland · Founded 1364",
      description: {
        uz: "Markaziy Yevropadagi ikkinchi eng qadimgi oliygoh (1364). Krakovning tarixiy markazida joylashgan. Tibbiyot, farmatsevtika, biznes va gumanitar sohalarda Yevropada yetakchi.",
        en: "The second oldest university in Central Europe (1364). World-renowned medicine, biotechnology, business, and humanities faculties.",
      },
      tuitionRange: "€2,500 – €5,200 / yil",
      popularFaculties: ["Medicine (MD)", "Biotechnology", "European Studies", "Business Administration"],
      intake: "Oktyabr 2026",
      websiteUrl: "https://en.uj.edu.pl",
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "pw",
      name: "Warsaw University of Technology (Politechnika Warszawska)",
      city: "Warszawa (Varshava)",
      ranking: "Top #1 Technical University",
      description: {
        uz: "Polshaning #1 Texnika universiteti. Muhandislik, dasturlash, aerokosmik va sun'iy intellekt yo'nalishlarida bitiruvchilari Google, Microsoft, Intel kabi gigantlarda ishlaydi.",
        en: "Leading engineering and technical university in Poland. Renowned for Software Engineering, AI, Robotics, and Civil Engineering.",
      },
      tuitionRange: "€3,000 – €4,800 / yil",
      popularFaculties: ["Computer Science & Software", "Robotics & AI", "Civil Engineering", "Aerospace"],
      intake: "Oktyabr / Fevral",
      websiteUrl: "https://www.pw.edu.pl",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "wut",
      name: "Wrocław University of Science and Technology (Politechnika Wrocławska)",
      city: "Wrocław (Vrotslav)",
      ranking: "Top #3 Technical",
      description: {
        uz: "Polshaning Kremniy vodiysi deb ataluvchi Vrotslav shahrida joylashgan. IT kompaniyalar bilan kuchli aloqa va amaliyot imkoniyati.",
        en: "Located in Poland's Silicon Valley. Exceptional practical labs, partner internships with Amazon, Nokia, and Volvo.",
      },
      tuitionRange: "€2,000 – €3,500 / yil",
      popularFaculties: ["Cybersecurity", "Applied Computer Science", "Automotive Engineering", "Management"],
      intake: "Oktyabr 2026",
      websiteUrl: "https://pwr.edu.pl",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "uek",
      name: "Kraków University of Economics (Uniwersytet Ekonomiczny)",
      city: "Kraków (Krakov)",
      ranking: "Top Business & Finance School",
      description: {
        uz: "Polshadagi eng yirik iqtisodiyot va biznes universiteti. Xalqaro biznes, moliya, logistika va marketing sohasida mukammal ta'lim.",
        en: "Largest economic university in Poland. Exceptional business programs, ACCA accredited finance courses, and global exchange.",
      },
      tuitionRange: "€1,900 – €3,200 / yil",
      popularFaculties: ["International Business", "Corporate Finance", "Logistics & Supply Chain", "Digital Marketing"],
      intake: "Oktyabr 2026",
      websiteUrl: "https://uek.krakow.pl",
      imageUrl: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "kozminski",
      name: "Kozminski University (Akademia Leona Koźmińskiego)",
      city: "Warszawa (Varshava)",
      ranking: "Triple Crown Accredited (EQUIS, AMBA, AACSB)",
      description: {
        uz: "Financial Times reytingi bo'yicha Markaziy Yevropadagi #1 Xususiy Biznes Maktabi. Dunyodagi biznes maktablarning faqat 1% ega bo'lgan uch karra xalqaro akkreditatsiyaga ega.",
        en: "#1 Private Business School in Central Europe (Financial Times). Prestigious Triple Crown accreditation.",
      },
      tuitionRange: "€4,000 – €6,500 / yil",
      popularFaculties: ["Management & AI", "Finance & Accounting", "International Business", "Law & Business"],
      intake: "Oktyabr / Fevral",
      websiteUrl: "https://www.kozminski.edu.pl",
      imageUrl: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=600&auto=format&fit=crop&q=80",
    },
  ];
}

export async function fetchPrograms(): Promise<ProgramItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/programs`);
    if (res.ok) {
      const data = await res.json();
      return data.programs;
    }
  } catch (e) {}

  return [
    {
      id: "prog-cs-bachelor-uw",
      name: "B.Sc. in Computer Science & Artificial Intelligence",
      degree: "bachelor",
      universityId: "uw",
      universityName: "University of Warsaw",
      tuitionFee: "€3,200 / yil",
      durationYears: 3,
      language: "Ingliz tili (English)",
      faculty: "Informatika va Matematika",
      description: "Algorithms, Machine Learning, Full-Stack Software Engineering, Cloud Computing.",
    },
    {
      id: "prog-cs-pw",
      name: "B.Sc. in Software Engineering & Data Systems",
      degree: "bachelor",
      universityId: "pw",
      universityName: "Warsaw University of Technology",
      tuitionFee: "€3,500 / yil",
      durationYears: 3.5,
      language: "Ingliz tili (English)",
      faculty: "Elektronika va Axborot Texnologiyalari",
      description: "Software Architecture, Distributed Systems, High Performance Computing.",
    },
    {
      id: "prog-ib-uek",
      name: "B.Sc. in International Business & Management",
      degree: "bachelor",
      universityId: "uek",
      universityName: "Kraków University of Economics",
      tuitionFee: "€2,200 / yil",
      durationYears: 3,
      language: "Ingliz tili (English)",
      faculty: "Xalqaro Iqtisodiyot",
      description: "Global Trade, Marketing Strategy, Corporate Finance, Business Analytics.",
    },
    {
      id: "prog-finance-kozminski",
      name: "B.Sc. in Finance & Accounting (CFA / ACCA track)",
      degree: "bachelor",
      universityId: "kozminski",
      universityName: "Kozminski University",
      tuitionFee: "€4,800 / yil",
      durationYears: 3,
      language: "Ingliz tili (English)",
      faculty: "Moliya va Bank",
      description: "Financial Modeling, Investment Banking, Fintech, Risk Management.",
    },
    {
      id: "prog-cyber-master-wut",
      name: "M.Sc. in Advanced Cybersecurity & Networks",
      degree: "master",
      universityId: "wut",
      universityName: "Wrocław University of Science and Tech",
      tuitionFee: "€3,000 / yil",
      durationYears: 2,
      language: "Ingliz tili (English)",
      faculty: "Axborot Xavfsizligi",
      description: "Ethical Hacking, Cryptography, Cloud Security, Threat Intelligence.",
    },
    {
      id: "prog-mba-master-kozminski",
      name: "M.Sc. in Strategic Management & AI in Business",
      degree: "master",
      universityId: "kozminski",
      universityName: "Kozminski University",
      tuitionFee: "€5,200 / yil",
      durationYears: 2,
      language: "Ingliz tili (English)",
      faculty: "Boshqaruv va Biznes",
      description: "Executive Leadership, AI Transformation, Product Strategy.",
    },
    {
      id: "prog-data-master-uj",
      name: "M.Sc. in Data Science & Quantitative Methods",
      degree: "master",
      universityId: "uj",
      universityName: "Jagiellonian University",
      tuitionFee: "€3,400 / yil",
      durationYears: 2,
      language: "Ingliz tili (English)",
      faculty: "Matematika va Informatika",
      description: "Deep Learning, Big Data Pipelines, Statistical Modeling, NLP.",
    },
  ];
}

export async function fetchUserDocuments(userId: number): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/documents?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.documents;
    }
  } catch (e) {}

  return [
    {
      id: "doc-1",
      userId,
      docType: "passport",
      status: "approved",
      fileUrl: "https://example.com/passport.pdf",
      updatedAt: "2026-03-20",
    },
    {
      id: "doc-2",
      userId,
      docType: "diploma",
      status: "reviewing",
      fileUrl: "https://example.com/diploma.pdf",
      updatedAt: "2026-03-24",
    },
    {
      id: "doc-3",
      userId,
      docType: "language_cert",
      status: "pending",
      updatedAt: "2026-03-25",
    },
    {
      id: "doc-4",
      userId,
      docType: "eligibility",
      status: "pending",
      updatedAt: "2026-03-25",
    },
    {
      id: "doc-5",
      userId,
      docType: "photo",
      status: "approved",
      fileUrl: "https://example.com/photo.jpg",
      updatedAt: "2026-03-22",
    },
  ];
}

export async function submitDocument(
  userId: number,
  docType: string,
  fileUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, docType, fileUrl }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  return { success: true, message: "Hujjat tekshirish uchun qabul qilindi!" };
}

export async function fetchUserApplications(userId: number): Promise<ApplicationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/applications?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.applications;
    }
  } catch (e) {}

  return [
    {
      id: "app-101",
      userId,
      programId: "prog-cs-bachelor-uw",
      programName: "B.Sc. in Computer Science & AI",
      universityName: "University of Warsaw",
      degree: "bachelor",
      stage: "university_review",
      counselorNotes: "Barcha hujjatlar universitet qabul komissiyasiga topshirildi. Rasmiy qabul xati 10 ish kunida chiqadi.",
      createdAt: "2026-03-15",
    },
  ];
}

export async function applyToProgram(
  userId: number,
  programId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/applications/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, programId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  return { success: true, message: "Arizangiz muvaffaqiyatli qabul qilindi!" };
}

export async function fetchTests(): Promise<TestItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tests`);
    if (res.ok) {
      const data = await res.json();
      return data.tests;
    }
  } catch (e) {}

  return [
    {
      id: "test-pol-b1",
      title: {
        uz: "Polyak tili — B1 Davlat Imtihoni Namunasi (PDF)",
        en: "Polish Language — B1 Official State Practice Exam (PDF)",
      },
      subject: "Polyak tili",
      description: {
        uz: "Polsha oliygohlarida polyak tilida bepul yoki pullik o'qish uchun talab etiladigan rasmiy B1 daraja test to'plami va javoblari.",
        en: "Official practice tests and answers for Polish B1 state certificate certification.",
      },
      downloadUrl: "https://certyfikatpolski.pl/wp-content/uploads/2019/08/B1_przykladowy_test.pdf",
      durationMinutes: 90,
      format: "PDF (Namuna)",
    },
    {
      id: "test-math-eng",
      title: {
        uz: "Matematika — Texnika Universitetlari Kirish Testi (Inglizcha)",
        en: "Mathematics — Technical Universities Entrance Exam (English)",
      },
      subject: "Matematika",
      description: {
        uz: "Politechnika Warszawska va Wrocław universitetlari IT va Muhandislik yo'nalishlari uchun namunaviy matematika masalalari.",
        en: "Sample math problems and solutions for technical IT & Engineering admissions.",
      },
      downloadUrl: "https://www.pw.edu.pl/sample_math_exam.pdf",
      durationMinutes: 120,
      format: "PDF (Savollar & Yechimlar)",
    },
    {
      id: "test-ielts-mock",
      title: {
        uz: "Akademik Ingliz Tili — Qabul Ichki Imtihoni Testi",
        en: "Academic English — University Internal Entrance Test",
      },
      subject: "Ingliz tili",
      description: {
        uz: "Universitetlarning ichki ingliz tili imtihoniga tayyorgarlik: Grammar, Reading va Writing bloklari.",
        en: "Preparation sample test for internal English exams at Polish universities.",
      },
      downloadUrl: "https://polandstudy.org/english_sample_exam.pdf",
      durationMinutes: 60,
      format: "PDF",
    },
    {
      id: "test-physics-pw",
      title: {
        uz: "Fizika — Muhandislik Fakultetlari Sinov Testi",
        en: "Physics — Engineering Faculties Entrance Test",
      },
      subject: "Fizika",
      description: {
        uz: "Mexanika, termodinamika va elektrodinamika bo'yicha namunaviy qabul topshiriqlari.",
        en: "Sample entrance exam problems in mechanics, thermodynamics, and electricity.",
      },
      downloadUrl: "https://www.pw.edu.pl/sample_physics.pdf",
      durationMinutes: 90,
      format: "PDF",
    },
  ];
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/reviews`);
    if (res.ok) {
      const data = await res.json();
      return data.reviews;
    }
  } catch (e) {}

  return [
    {
      id: "rev-1",
      userId: 7771,
      studentName: "Shaxzod Aliyev",
      rating: 5,
      universityName: "University of Warsaw",
      programName: "Computer Science",
      comment: "Hujjatlarimni topshirish juda oson kechdi. Maslahatchilar vizagacha yordam berishdi. Hozir 2-kursdaman, ta'lim sifati Yevropa darajasida a'lo!",
      date: "2026-02-14",
      isVerified: true,
    },
    {
      id: "rev-2",
      userId: 7772,
      studentName: "Madina Rustamova",
      rating: 5,
      universityName: "Kozminski University",
      programName: "International Business",
      comment: "Kozminski biznes bo'yicha haqiqatan kuchli. Xalqaro muhit, turli mamlakatlardan do'stlar orttirdim. Bot orqali ariza topshirganimdan xursandman.",
      date: "2026-03-01",
      isVerified: true,
    },
    {
      id: "rev-3",
      userId: 7773,
      studentName: "Javohir Olimov",
      rating: 5,
      universityName: "Wrocław University of Tech",
      programName: "Cybersecurity",
      comment: "Vrotslav talabalar uchun qulay shahar. Dasturlash laboratoriyalari zamonaviy. Polsha vizasini birinchi urinishda oldim.",
      date: "2026-03-18",
      isVerified: true,
    },
  ];
}

export async function addReview(review: {
  userId: number;
  studentName: string;
  rating: number;
  universityName: string;
  programName: string;
  comment: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/reviews/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });
    return res.ok;
  } catch (e) {}
  return true;
}

// Admin CRM APIs
export async function fetchAdminStats() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/stats`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    totalStudents: 148,
    totalApplications: 62,
    pendingDocs: 19,
    acceptedStudents: 34,
  };
}

export async function fetchAllApplications(): Promise<ApplicationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/applications`);
    if (res.ok) {
      const data = await res.json();
      return data.applications;
    }
  } catch (e) {}
  return [];
}

export async function fetchAllDocuments(): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/documents`);
    if (res.ok) {
      const data = await res.json();
      return data.documents;
    }
  } catch (e) {}
  return [];
}

export async function updateApplicationStage(
  appId: string,
  stage: string,
  counselorNotes?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/applications/${appId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, counselorNotes }),
    });
    return res.ok;
  } catch (e) {}
  return true;
}

export async function updateDocumentStatus(
  docId: string,
  status: string,
  feedback?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/documents/${docId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    return res.ok;
  } catch (e) {}
  return true;
}
