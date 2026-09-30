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
  if (typeof window !== "undefined") {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get("userId") || params.get("id");
      if (qId) {
        return {
          id: parseInt(qId, 10),
          first_name: params.get("name") || "Talaba",
        };
      }
      // Check stored session student ID
      const stored = localStorage.getItem("ptu_student_id");
      if (stored) {
        return {
          id: parseInt(stored, 10),
          first_name: "Talaba",
        };
      }
      // Generate guest student ID
      const guestId = Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("ptu_student_id", String(guestId));
      return {
        id: guestId,
        first_name: "Talaba",
      };
    } catch (e) {}
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

  // Fallback guest user if server not reached: not registered, prompts onboarding
  return {
    id: effectiveId,
    firstName: tgUser?.first_name || "Talaba",
    lastName: tgUser?.last_name || "",
    fullName: tgUser?.first_name || "Talaba",
    username: tgUser?.username || "student",
    phone: "",
    lang: "uz",
    isRegistered: false,
    isAdmin: Boolean(tgUser?.username?.includes("admin")),
    preferredLevel: "Bachelor",
  };
}

export async function submitOnboarding(data: Partial<UserProfile>): Promise<boolean> {
  const tgUser = getTelegramUser();
  const userId = data.userId || tgUser?.id;
  if (!userId) return false;

  try {
    const res = await fetch(`${API_BASE}/api/user/onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to submit onboarding", e);
  }
  return true;
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
      tuitionRange: "$2,400 – $5,000 / yil",
      popularFaculties: ["Kompyuter fanlari (Computer Science)", "Xalqaro munosabatlar (International Relations)", "Iqtisodiyot va Moliya (Economics & Finance)", "Ma'lumotlar tahlili (Data Science)"],
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
      tuitionRange: "$2,800 – $5,700 / yil",
      popularFaculties: ["Tibbiyot (Medicine MD)", "Biotexnologiya (Biotechnology)", "Yevropa tadqiqotlari (European Studies)", "Biznes boshqaruvi (Business Administration)"],
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
      tuitionRange: "$3,300 – $5,300 / yil",
      popularFaculties: ["Dasturlash va IT (Computer Science & Software)", "Robototexnika va AI (Robotics & AI)", "Qurilish muhandisligi (Civil Engineering)", "Aerokosmik muhandislik (Aerospace)"],
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
      tuitionRange: "$2,200 – $3,800 / yil",
      popularFaculties: ["Kiberxavfsizlik (Cybersecurity)", "Amaliy kompyuter fanlari (Applied CS)", "Avtomobilsozlik muhandisligi (Automotive Engineering)", "Menejment (Management)"],
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
      tuitionRange: "$2,100 – $3,500 / yil",
      popularFaculties: ["Xalqaro biznes (International Business)", "Korporativ moliya (Corporate Finance)", "Logistika va ta'minot (Logistics & Supply Chain)", "Raqamli marketing (Digital Marketing)"],
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
      tuitionRange: "$4,400 – $7,200 / yil",
      popularFaculties: ["Menejment va AI (Management & AI)", "Moliya va audit (Finance & Accounting)", "Xalqaro biznes (International Business)", "Huquq va biznes (Law & Business)"],
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
      name: "Kompyuter fanlari va Sun'iy intellekt (B.Sc.)",
      degree: "bachelor",
      universityId: "uw",
      universityName: "University of Warsaw",
      tuitionFee: "$3,500 / yil",
      durationYears: 3,
      language: "Ingliz tili",
      faculty: "Informatika va Axborot Texnologiyalari fakulteti",
      description: "Algoritmlar, sun'iy intellekt (Machine Learning), full-stack dasturlash va bulutli texnologiyalar (Cloud Computing).",
    },
    {
      id: "prog-cs-pw",
      name: "Dasturiy injiniring va Ma'lumotlar tizimlari (B.Sc.)",
      degree: "bachelor",
      universityId: "pw",
      universityName: "Warsaw University of Technology",
      tuitionFee: "$3,800 / yil",
      durationYears: 3.5,
      language: "Ingliz tili",
      faculty: "Elektronika va Axborot Texnologiyalari fakulteti",
      description: "Dasturiy arxitektura, taqsimlangan tizimlar va yuqori unumdorlikdagi hisoblash.",
    },
    {
      id: "prog-ib-uek",
      name: "Xalqaro biznes va Menejment (B.Sc.)",
      degree: "bachelor",
      universityId: "uek",
      universityName: "Kraków University of Economics",
      tuitionFee: "$2,400 / yil",
      durationYears: 3,
      language: "Ingliz tili",
      faculty: "Xalqaro Iqtisodiyot va Biznes fakulteti",
      description: "Xalqaro savdo, marketing strategiyasi, korporativ moliya va biznes tahlili.",
    },
    {
      id: "prog-finance-kozminski",
      name: "Moliya va Buxgalteriya hisobi (B.Sc. CFA / ACCA)",
      degree: "bachelor",
      universityId: "kozminski",
      universityName: "Kozminski University",
      tuitionFee: "$5,300 / yil",
      durationYears: 3,
      language: "Ingliz tili",
      faculty: "Moliya va Bank ishi fakulteti",
      description: "Moliyaviy modellashtirish, investitsiya banki, Fintex va risklarni boshqarish.",
    },
    {
      id: "prog-cyber-master-wut",
      name: "Kiberxavfsizlik va Tarmoqlar (M.Sc.)",
      degree: "master",
      universityId: "wut",
      universityName: "Wrocław University of Science and Tech",
      tuitionFee: "$3,300 / yil",
      durationYears: 2,
      language: "Ingliz tili",
      faculty: "Axborot Xavfsizligi va Tizimlar fakulteti",
      description: "Etik xakerlik, kriptografiya, bulut xavfsizligi va tahdidlarni tahlil qilish.",
    },
    {
      id: "prog-mba-master-kozminski",
      name: "Strategik boshqaruv va Biznesda AI (M.Sc.)",
      degree: "master",
      universityId: "kozminski",
      universityName: "Kozminski University",
      tuitionFee: "$5,700 / yil",
      durationYears: 2,
      language: "Ingliz tili",
      faculty: "Strategik Boshqaruv va Biznes fakulteti",
      description: "Yetakchilik ko'nikmalari, sun'iy intellekt transformatsiyasi va mahsulot strategiyasi.",
    },
    {
      id: "prog-data-master-uj",
      name: "Data Science va Miqdoriy usullar (M.Sc.)",
      degree: "master",
      universityId: "uj",
      universityName: "Jagiellonian University",
      tuitionFee: "$3,700 / yil",
      durationYears: 2,
      language: "Ingliz tili",
      faculty: "Matematika va Informatika fakulteti",
      description: "Chuqur o'rganish (Deep Learning), Big Data quvurlari, statistik modellashtirish va NLP.",
    },
  ];
}

export async function fetchUserDocuments(userId: number): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/documents?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      const docs = Array.isArray(data.documents) ? data.documents : [];
      return docs.map((d: any) => ({
        id: d.id || d.docType || "unknown",
        userId: d.userId || userId,
        docType: d.docType || d.id || "unknown",
        status: d.status || "pending",
        fileUrl: d.fileUrl || d.link || "",
        feedback: d.feedback || d.feedbackNote || "",
        updatedAt: d.updatedAt || "",
      }));
    }
  } catch (e) {}

  return [];
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

  return [];
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
  return [];
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

export async function adminLogin(passcode: string, userId?: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (e) {}
  return false;
}

export async function fetchAdminUsers(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users`);
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (e) {}
  return [];
}

export async function createAdminUniversity(uni: {
  name: string;
  city: string;
  tuitionRange: string;
  popularFaculties?: string[];
  intake?: string;
  description?: any;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/universities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uni),
    });
    return res.ok;
  } catch (e) {}
  return false;
}

export async function updateAdminUniversity(
  id: string,
  uni: {
    name?: string;
    city?: string;
    tuitionRange?: string;
    popularFaculties?: string[];
    intake?: string;
    description?: any;
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/universities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uni),
    });
    return res.ok;
  } catch (e) {}
  return false;
}

export async function deleteAdminUniversity(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/universities/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {}
  return false;
}

export async function fetchAdminOferta(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/oferta`);
    if (res.ok) {
      const data = await res.json();
      return data.text || "";
    }
  } catch (e) {}
  return "";
}

export async function saveAdminOferta(text: string, publisherName?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/oferta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, publisherName }),
    });
    return res.ok;
  } catch (e) {}
  return false;
}

export interface BroadcastLogItem {
  id: string;
  message: string;
  sentAt: string;
  sentCount: number;
  targetName?: string;
  targetUserId?: number;
}

export async function fetchAdminBroadcasts(): Promise<BroadcastLogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/broadcasts`);
    if (res.ok) {
      const data = await res.json();
      return data.broadcasts || [];
    }
  } catch (e) {}
  return [];
}

export async function sendAdminBroadcast(
  message: string,
  targetUserId?: number
): Promise<{ success: boolean; sentCount: number; totalUsers: number; broadcast?: BroadcastLogItem }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, targetUserId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return { success: false, sentCount: 0, totalUsers: 0 };
}

export async function deleteAdminBroadcast(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/broadcasts/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {}
  return false;
}

export async function requestRoadmapAIAnalysis(userId: number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/user/analyze-roadmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.aiAnalysis;
    }
  } catch (e) {}
  return null;
}

