import { UserSessionData, University } from "../types";
import { config } from "../config";

export interface AIAnalysisResult {
  bestMatchUniIds: string[];
  adviceUz: string;
  adviceEn: string;
  roadmapSteps: {
    titleUz: string;
    titleEn: string;
    descUz: string;
    descEn: string;
    done: boolean;
  }[];
  generatedAt: string;
}

const getGeminiEndpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${config.geminiApiKey}`;

export async function analyzeStudentProfile(
  user: UserSessionData,
  availableUnis: University[]
): Promise<AIAnalysisResult> {
  // If user already has AI analysis, NEVER call AI again - return cached result!
  if (user.aiAnalysis && Array.isArray(user.aiAnalysis.bestMatchUniIds) && user.aiAnalysis.bestMatchUniIds.length > 0) {
    return user.aiAnalysis;
  }

  // Universities summary for prompt
  const uniList = availableUnis.map((u) => ({
    id: u.id,
    name: u.name,
    city: u.city,
    tuition: u.tuition?.english || u.tuition?.nonEu || "$3,000 / year",
    faculties: (u.faculties || []).slice(0, 4),
  }));

  const prompt = `You are the lead admissions AI counselor for Poland Top Universities (PTU).
Analyze this international student applicant profile:
- Full Name: ${user.fullName || "Student"}
- Birth Year: ${user.birthYear || user.age || "2006"}
- Current Education Status: ${user.educationStatus || "High school / Lyceum"}
- Graduation Year: ${user.graduationYear || "2026"}
- Target Degree Level: ${user.preferredLevel || "Bachelor"}
- Target Field of Study: ${user.preferredField || "IT"}
- English Language Certificate / Level: ${user.englishLevel || "None"}
- Polish Language Level: ${user.polishLevel || "None"}
- Math Proficiency: ${user.mathLevel || "Average"}
- SAT: ${user.hasSat || "No"}
- Budget (Tuition): ${user.budget || "Average ($2,800 - $4,400 USD)"}
- Target Intake Year: ${user.targetIntake || "2026"}
- Has International Passport: ${user.hasPassport || "Yes"}

Available Poland Universities:
${JSON.stringify(uniList, null, 2)}

TASK:
Recommend exactly 3 university IDs that best fit this student based on:
1. Field relevance (e.g. IT/Tech -> PW, AGH, PWr, PJATK; Business -> SGH, Kozminski, UEK; Medicine -> MUW, UJ; General/Low budget -> WSB, Vistula, PUT).
2. Language requirements (if Polish B1+, free public universities are viable; if no IELTS, private universities with Duolingo or prep year are better).
3. Budget affordability.

Write warm, encouraging, highly professional counseling advice in Uzbek ("adviceUz") addressing the student by name, and in English ("adviceEn").
Generate 4-5 custom roadmap checklist steps ("roadmapSteps") tailored to what they still need (e.g., getting passport, IELTS prep, uploading diploma). Mark steps as done: true or false.

Respond ONLY with valid JSON in this exact structure:
{
  "bestMatchUniIds": ["id1", "id2", "id3"],
  "adviceUz": "...",
  "adviceEn": "...",
  "roadmapSteps": [
    {
      "titleUz": "...",
      "titleEn": "...",
      "descUz": "...",
      "descEn": "...",
      "done": false
    }
  ]
}`;

  try {
    const response = await fetch(getGeminiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.bestMatchUniIds) && parsed.bestMatchUniIds.length > 0) {
          return {
            bestMatchUniIds: parsed.bestMatchUniIds.slice(0, 3),
            adviceUz: parsed.adviceUz || "Sizning ma'lumotlaringiz asosida eng mos oliygohlar tanlandi.",
            adviceEn: parsed.adviceEn || "Top matched universities selected based on your profile.",
            roadmapSteps: Array.isArray(parsed.roadmapSteps) ? parsed.roadmapSteps : [],
            generatedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch (err) {
    console.warn("Gemini API call failed, using heuristic fallback:", err);
  }

  // Graceful rule-based fallback if API call fails or times out
  return generateHeuristicAnalysis(user, availableUnis);
}

function generateHeuristicAnalysis(user: UserSessionData, availableUnis: University[]): AIAnalysisResult {
  let matchedIds: string[] = [];

  const field = (user.preferredField || "").toLowerCase();
  const polish = user.polishLevel;
  const english = user.englishLevel;
  const budget = user.budget;

  if (polish === "B1+") {
    matchedIds = ["uw", "uj", "pw"];
  } else if (field.includes("it") || field.includes("comp")) {
    if (user.mathLevel === "Excellent" || user.hasSat === "Yes") {
      matchedIds = ["pw", "agh", "pjatk"];
    } else {
      matchedIds = ["pjatk", "vistula", "wsb"];
    }
  } else if (field.includes("business") || field.includes("econ")) {
    matchedIds = ["sgh", "kozminski", "uek"];
  } else if (field.includes("med")) {
    matchedIds = ["muw", "uj", "lazarski"];
  } else if (field.includes("eng")) {
    matchedIds = ["pw", "pwr", "put"];
  } else {
    matchedIds = ["uw", "vistula", "wsb"];
  }

  // Filter existing
  const validIds = matchedIds.filter((id) => availableUnis.some((u) => u.id === id));
  const finalIds = validIds.length >= 3 ? validIds.slice(0, 3) : availableUnis.slice(0, 3).map((u) => u.id);

  const steps = [
    {
      titleUz: user.hasPassport === "No" ? "Xorijga chiqish pasportini oling" : "Xorijga chiqish pasporti tayyor",
      titleEn: user.hasPassport === "No" ? "Get your International Passport" : "Passport is Ready",
      descUz: user.hasPassport === "No" ? "Davlat xizmatlari markazidan qizil pasportga ariza topshiring." : "Sizda amaldagi xorijiy pasport mavjud.",
      descEn: user.hasPassport === "No" ? "Apply for your international passport." : "You have a valid passport.",
      done: user.hasPassport !== "No",
    },
    {
      titleUz: english === "None" ? "Ingliz tili sertifikatini topshirish" : `${english || "Til"} sertifikati tayyor`,
      titleEn: english === "None" ? "Pass English Language Exam" : `${english || "Language"} Certificate Ready`,
      descUz: english === "None" ? "IELTS yoki Duolingo testiga ro'yxatdan o'ting va topshiring." : "Sertifikatingiz qabul talablariga to'liq javob beradi.",
      descEn: english === "None" ? "Register and pass IELTS or Duolingo." : "Your certificate meets admission requirements.",
      done: english !== "None",
    },
    {
      titleUz: "Attestat / Diplomga Apostil qo'yish",
      titleEn: "Get Apostille on Diploma",
      descUz: "Maktab attestati yoki litsey diplomiga Ta'lim inspeksiyasidan apostil muhri oling.",
      descEn: "Obtain an official Apostille stamp on your graduation certificate.",
      done: false,
    },
    {
      titleUz: "Hujjatlarni portalga yuklash",
      titleEn: "Upload Documents to Portal",
      descUz: "Pasport va attestat skaner nusxasini 'Hujjatlar' bo'limiga yuklang.",
      descEn: "Upload scans of passport and diploma to the Documents tab.",
      done: false,
    },
    {
      titleUz: "Universitetga qabul va viza olish",
      titleEn: "Admission Letter & Polish Visa",
      descUz: "Rasmiy taklifnoma (Zaświadczenie) olingandan so'ng konsullikka viza topshirish.",
      descEn: "Receive official acceptance letter and apply for a national student visa.",
      done: false,
    },
  ];

  return {
    bestMatchUniIds: finalIds,
    adviceUz: `Sizning ${user.preferredField || "tanlangan"} yo'nalishingiz va ${user.preferredLevel || "Bakalavriat"} bosqichi bo'yicha Polshaning yetakchi oliygohlari saralandi. Ushbu oliygohlar xalqaro akkreditatsiyaga ega bo'lib, bitiruvchilari Yevropa Ittifoqida erkin ishlash huquqiga ega bo'ladi.`,
    adviceEn: `Based on your chosen field and degree level, top Polish universities have been selected. These institutions hold international accreditation and grant degrees recognized throughout the European Union.`,
    roadmapSteps: steps,
    generatedAt: new Date().toISOString(),
  };
}
