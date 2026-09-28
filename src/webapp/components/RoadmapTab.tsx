import React, { useMemo } from "react";
import { UserProfile, UniversityItem, Language } from "../types";
import { CheckCircle2, Circle, MapPin, BrainCircuit, GraduationCap, DollarSign, Languages, Wallet, BookOpen, Sparkles, Building2 } from "lucide-react";
import { triggerHaptic } from "../services/api";

interface RoadmapStepItem {
  title: string;
  desc: string;
  done: boolean;
  icon: any;
}

interface RoadmapTabProps {
  user: UserProfile;
  universities: UniversityItem[];
  lang: Language;
}

export const RoadmapTab: React.FC<RoadmapTabProps> = ({ user, universities, lang }) => {
  const isUz = lang === "uz";
  const ai = user.aiAnalysis;

  // Recommended Universities: prioritize AI matched IDs if available, else heuristic
  const recommendedUnis = useMemo(() => {
    if (ai && Array.isArray(ai.bestMatchUniIds) && ai.bestMatchUniIds.length > 0) {
      const matched = universities.filter((u) => ai.bestMatchUniIds.includes(u.id));
      if (matched.length > 0) return matched.slice(0, 3);
    }

    let filtered = [...universities];

    // 1. Language constraint
    if (user.polishLevel === "B1+") {
      filtered = filtered.filter((u) =>
        u.id === "uw" || u.id === "uj" || u.id === "pw" || u.id === "agh"
      );
    } else if (user.englishLevel === "None") {
      filtered = filtered.filter((u) => u.id === "kozminski" || u.id === "swps" || u.id === "pjatk" || u.id === "vistula" || u.id === "wsb");
    }

    // 2. Field of Study constraint
    const field = (user.preferredField || "").toLowerCase();
    if (field.includes("it") || field.includes("comp")) {
      filtered = filtered.filter((u) =>
        u.id === "pw" || u.id === "agh" || u.id === "pwr" || u.id === "pjatk" || u.id === "vistula"
      );
    } else if (field.includes("business") || field.includes("econ")) {
      filtered = filtered.filter((u) =>
        u.id === "sgh" || u.id === "kozminski" || u.id === "uek" || u.id === "lazarski"
      );
    } else if (field.includes("med")) {
      filtered = filtered.filter((u) => u.id === "muw" || u.id === "uj" || u.id === "lazarski");
    } else if (field.includes("eng")) {
      filtered = filtered.filter((u) => u.id === "pw" || u.id === "agh" || u.id === "pwr" || u.id === "put" || u.id === "pg");
    }

    // 3. Budget constraint
    if (user.polishLevel !== "B1+" && (user.budget === "< 2800" || user.budget === "< 2500")) {
      filtered = filtered.filter((u) =>
        !u.tuitionRange.includes("4,") && !u.tuitionRange.includes("5,") && !u.tuitionRange.includes("6,") && !u.tuitionRange.includes("7,")
      );
    }

    if (filtered.length === 0) {
      filtered = universities.slice(0, 3);
    }

    return filtered.slice(0, 3);
  }, [user, universities, ai]);

  // Roadmap Steps: Use AI custom steps if available, else standard checklist
  const steps: RoadmapStepItem[] = useMemo(() => {
    if (ai && Array.isArray(ai.roadmapSteps) && ai.roadmapSteps.length > 0) {
      return ai.roadmapSteps.map((st: any) => ({
        title: isUz ? st.titleUz : st.titleEn,
        desc: isUz ? st.descUz : st.descEn,
        done: Boolean(st.done),
        icon: st.done ? CheckCircle2 : Sparkles,
      }));
    }

    const arr: RoadmapStepItem[] = [];

    // Step 1: Passport
    if (user.hasPassport === "No") {
      arr.push({
        title: isUz ? "Xorijga chiqish pasportini oling" : "Get your International Passport",
        desc: isUz ? "Davlat xizmatlari markazidan xorijga chiqish pasportiga ariza bering." : "Apply for your red passport at the nearest registry.",
        icon: MapPin,
        done: false,
      });
    } else {
      arr.push({
        title: isUz ? "Pasport tayyor" : "Passport Ready",
        desc: isUz ? "Sizda xorijga chiqish pasporti mavjud." : "You already have your passport.",
        icon: CheckCircle2,
        done: true,
      });
    }

    // Step 2: Language
    if (user.polishLevel === "B1+") {
      arr.push({
        title: isUz ? "Polyak tili B1+" : "Polish Language B1+",
        desc: isUz ? "Zo'r! Davlat universitetlarida BEPUL o'qish imkoniyatingiz bor." : "Great! You can study for FREE at public universities.",
        icon: Languages,
        done: true,
      });
    } else if (user.englishLevel === "None") {
      arr.push({
        title: isUz ? "Ingliz tili sertifikati" : "English Certificate",
        desc: isUz ? "Tezroq IELTS yoki Duolingo topshirishingiz kerak." : "You need to pass IELTS or Duolingo as soon as possible.",
        icon: BookOpen,
        done: false,
      });
    } else {
      arr.push({
        title: isUz ? "Til sertifikati tayyor" : "Language Cert Ready",
        desc: isUz ? `${user.englishLevel} sertifikatingiz qabul uchun yetarli.` : `Your ${user.englishLevel} is sufficient for admission.`,
        icon: CheckCircle2,
        done: true,
      });
    }

    // Step 3: Math / STEM
    if (user.preferredField === "IT" || user.preferredField === "Engineering") {
      if (user.mathLevel !== "Excellent" && user.hasSat !== "Yes") {
        arr.push({
          title: isUz ? "Matematika / SAT" : "Math / SAT",
          desc: isUz ? "Muhandislik/IT uchun matematikaga urg'u bering yoki SAT topshiring." : "Focus on Math or pass SAT for IT/Engineering.",
          icon: BrainCircuit,
          done: false,
        });
      }
    }

    // Step 4: Budget
    if ((user.budget === "< 2800" || user.budget === "< 2500") && user.polishLevel !== "B1+") {
      arr.push({
        title: isUz ? "Byudjetni rejalashtirish" : "Budget Planning",
        desc: isUz ? "Yillik $2,800 dan kam narxli universitetlarni ko'rib chiqamiz." : "We will look for universities under $2,800/year.",
        icon: Wallet,
        done: true,
      });
    }

    // Step 5: Document Upload
    arr.push({
      title: isUz ? "Hujjatlarni portalga yuklash" : "Upload Documents to Portal",
      desc: isUz ? "Attestat va pasportingizni 'Hujjatlar' bo'limiga yuklang." : "Upload your diploma and passport in the Documents tab.",
      icon: GraduationCap,
      done: false,
    });

    return arr;
  }, [user, isUz, ai]);

  const counselorAdvice = useMemo(() => {
    if (ai) {
      return isUz ? ai.adviceUz : ai.adviceEn;
    }
    return isUz
      ? `Sizning profil ma'lumotlaringiz asosida eng mos Polsha oliygohlari va qabul yo'l xaritasi shakllantirildi. Har bir bosqichni ketma-ket bajaring.`
      : `Based on your profile, the top matched Polish universities and your admission roadmap have been created. Follow each step sequentially.`;
  }, [ai, isUz]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* AI Counselor Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {isUz ? "AI Qabul Maslahatchisi (Gemini)" : "AI Admissions Counselor"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
            {isUz ? `Salom, ${user.fullName || user.firstName || "Talaba"}!` : `Hello, ${user.fullName || user.firstName || "Student"}!`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {counselorAdvice}
          </p>
        </div>
      </div>

      {/* Top 3 University Matches */}
      <div>
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>{isUz ? "Siz uchun mos oliygohlar" : "Top Matches for You"}</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {recommendedUnis.length} {isUz ? "ta oliygoh" : "universities"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedUnis.map((u, idx) => (
            <div
              key={u.id}
              className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200/70 hover:border-slate-800 hover:shadow-md transition-all relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black text-[11px] border border-blue-100">
                    #{idx + 1} {isUz ? "Tavsiya" : "Match"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{u.city}</span>
                </div>

                <h4 className="font-black text-slate-900 text-base leading-snug">{u.name}</h4>

                {/* Faculties with English title + Uzbek subtitle */}
                {u.popularFaculties && u.popularFaculties.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isUz ? "Fakultetlar" : "Faculties"}
                    </span>
                    {u.popularFaculties.slice(0, 2).map((fac, fIdx) => {
                      const parts = fac.split("|").map((s) => s.trim());
                      const titleEn = parts[0];
                      const titleUz = parts[1] || "";
                      return (
                        <div
                          key={fIdx}
                          className="flex flex-col bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100"
                        >
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {titleEn}
                          </span>
                          {titleUz && (
                            <span className="text-[10px] text-slate-400 font-medium leading-tight">
                              {titleUz}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{u.tuitionRange}</span>
                </div>

                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  📅 {u.intake || "15-Iyul 2026"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap Checklist */}
      <div className="px-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <span>🎯</span>
          <span>{isUz ? "Shaxsiy Qabul Yo'l Xaritasi" : "Your Personal Roadmap"}</span>
        </h3>

        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-300 before:to-slate-200">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group pb-8"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                    step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 fill-current" />
                  )}
                </div>

                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${step.done ? "text-emerald-500" : "text-blue-500"}`} />
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
