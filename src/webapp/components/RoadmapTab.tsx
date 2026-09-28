import React, { useMemo } from "react";
import { UserProfile, UniversityItem, Language } from "../types";
import { CheckCircle2, Circle, MapPin, GraduationCap, DollarSign, Languages, Wallet, BookOpen, Building2, Compass, ShieldCheck } from "lucide-react";
import { triggerHaptic } from "../services/api";

interface RoadmapStepItem {
  title: string;
  desc: string;
  done: boolean;
  statusLabel?: string;
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

  // Clean admissions advice (strictly no AI buzzwords)
  const counselorAdvice = useMemo(() => {
    if (ai) {
      return isUz ? ai.adviceUz : ai.adviceEn;
    }
    return isUz
      ? `Sizning akademik ko'rsatkichlaringiz, til bilish darajangiz va byudjetingiz inobatga olinib, Siz uchun eng maqbul universitetlar va qabul rejasi shakllantirildi. Yo'l xaritasidagi barcha bosqichlarni ketma-ket bajaring.`
      : `Based on your academic background, language skills, and budget, optimal universities and an admission schedule have been tailored for you. Follow the roadmap steps in order.`;
  }, [ai, isUz]);

  // Sequential admissions steps
  const steps: RoadmapStepItem[] = useMemo(() => {
    const arr: RoadmapStepItem[] = [];

    // Step 1: Passport
    const hasPassport = user.hasPassport === "Yes" || user.hasPassport === "Ha";
    arr.push({
      title: isUz ? "1-Bosqich: Xorijga chiqish pasporti" : "Step 1: International Passport",
      desc: hasPassport
        ? (isUz ? "Xorijga chiqish (qizil) pasportingiz mavjud. Qabul jarayoniga tayyorsiz." : "You have your international passport ready for enrollment.")
        : (isUz ? "Davlat xizmatlari markaziga murojaat qilib xorijga chiqish pasportini oling." : "Apply for your international passport as soon as possible."),
      done: hasPassport,
      statusLabel: hasPassport ? (isUz ? "Tayyor" : "Ready") : (isUz ? "Talab etiladi" : "Required"),
      icon: hasPassport ? CheckCircle2 : MapPin,
    });

    // Step 2: Language Proficiency
    const hasLanguage = Boolean(user.englishLevel && !user.englishLevel.includes("Boshlang'ich") && !user.englishLevel.includes("None"));
    arr.push({
      title: isUz ? "2-Bosqich: Til talablarini tasdiqlash" : "Step 2: Language Requirements",
      desc: user.polishLevel === "B1+"
        ? (isUz ? "Polyak tili B1+ darajangiz bor. Davlat universitetlarida BEPUL ta'lim olish imkoniyatingiz mavjud!" : "Polish B1+ verified. You can study tuition-free in public universities!")
        : hasLanguage
        ? (isUz ? `${user.englishLevel} darajangiz Polsha oliygohlariga qabul uchun mos keladi.` : `Your ${user.englishLevel} matches admissions requirements.`)
        : (isUz ? "IELTS, Duolingo yoki oliygohning ichki ingliz tili imtihoniga tayyorgarlik ko'ring." : "Prepare for IELTS, Duolingo, or internal university English test."),
      done: Boolean(hasLanguage || user.polishLevel === "B1+"),
      statusLabel: hasLanguage || user.polishLevel === "B1+" ? (isUz ? "Bajarildi" : "Passed") : (isUz ? "Jarayonda" : "In Progress"),
      icon: Languages,
    });

    // Step 3: Academic & Subjects (Math/Scores)
    const isGoodMath = user.mathLevel?.includes("A'lo") || user.mathLevel?.includes("Yaxshi") || user.hasSat === "Yes";
    arr.push({
      title: isUz ? "3-Bosqich: Maktab yoki Diplom baholari" : "Step 3: Academic Records & Transcripts",
      desc: isGoodMath
        ? (isUz ? "Matematika va umumiy GPA baholaringiz IT va muhandislik yo'nalishlariga to'liq yetarli." : "Your math and GPA records meet admission standards for your target field.")
        : (isUz ? "Attestat yoki diplom baholaringizni Apostil qildirishga tayyorlang." : "Prepare your academic transcripts and apostille certification."),
      done: Boolean(isGoodMath),
      statusLabel: isGoodMath ? (isUz ? "Tasdiqlangan" : "Verified") : (isUz ? "Kutilmoqda" : "Pending"),
      icon: BookOpen,
    });

    // Step 4: Documents Upload
    arr.push({
      title: isUz ? "4-Bosqich: Hujjatlarni yuklash va tekshiruv" : "Step 4: Upload & Verify Documents",
      desc: isUz
        ? "Attestat (diplom), pasport nusxasi va 3.5x4.5 fotosuratingizni 'Hujjatlar' bo'limiga yuklang."
        : "Upload your diploma, passport, and photos in the Documents section for verification.",
      done: false,
      statusLabel: isUz ? "Yuklash kutilmoqda" : "Awaiting Upload",
      icon: ShieldCheck,
    });

    // Step 5: Application & Offer Letter
    arr.push({
      title: isUz ? "5-Bosqich: Ariza topshirish va Qabul xati" : "Step 5: Apply & Receive Acceptance Letter",
      desc: isUz
        ? "Tanlangan Polsha universitetiga rasmiy ariza yuboriladi va rasmiy Zaświadczenie (qabul xati) olinadi."
        : "Your application is submitted to the chosen university to secure your official acceptance letter.",
      done: false,
      statusLabel: isUz ? "Navbatdagi qadam" : "Next Step",
      icon: GraduationCap,
    });

    // Step 6: Visa & Departure
    arr.push({
      title: isUz ? "6-Bosqich: Viza va Polshaga parvoz" : "Step 6: Student Visa & Departure",
      desc: isUz
        ? "VFS Global orqali D-turi milliy talaba vizasiga hujjatlar topshiriladi va Varshavaga kutib olish tashkillashtiriladi."
        : "Submit for National Type-D student visa and coordinate departure and arrival in Poland.",
      done: false,
      statusLabel: isUz ? "Yakuniy bosqich" : "Final Stage",
      icon: Compass,
    });

    return arr;
  }, [user, isUz]);

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-7xl mx-auto w-full">
      {/* Admissions Advisor Recommendation Banner (Clean, NO AI mentions) */}
      <div className="bg-slate-900/90 rounded-[2rem] p-5 sm:p-6 text-white/95 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
                <Compass className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {isUz ? "Qabul Maslahatchisi Tavsiyasi" : "Admissions Recommendation"}
              </span>
            </div>
            <span className="text-xs font-semibold text-white/60 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-white/5">
              {user.preferredField || "IT"} • {user.preferredLevel || "Bakalavr"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-tight text-white/95">
            {isUz ? `Salom, ${user.fullName || user.firstName || "Talaba"}!` : `Hello, ${user.fullName || user.firstName || "Student"}!`}
          </h2>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5">
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              {counselorAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Top University Matches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-white/95 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>{isUz ? "Siz uchun mos oliygohlar" : "Top Matches for You"}</span>
          </h3>
          <span className="text-xs font-bold text-white/60">
            {recommendedUnis.length} {isUz ? "ta oliygoh" : "universities"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedUnis.map((u, idx) => (
            <div
              key={u.id}
              className="bg-slate-900/80 rounded-[1.5rem] p-5 shadow-lg border border-white/10 hover:border-white/20 transition-all relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-black text-[11px] border border-blue-500/30">
                    #{idx + 1} {isUz ? "Tavsiya" : "Match"}
                  </span>
                  <span className="text-xs text-white/60 font-medium">{u.city}</span>
                </div>

                <h4 className="font-black text-white/95 text-base leading-snug">
                  {u.name}
                </h4>

                {u.ranking && (
                  <p className="text-xs text-blue-400/90 font-medium">
                    {u.ranking}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/10">
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{u.tuitionRange}</span>
                </div>

                <span className="text-[11px] font-semibold text-white/60">
                  📅 {u.intake || "15-Iyul 2026"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sequential Admissions Roadmap Timeline */}
      <div className="space-y-4 pt-2">
        <div className="px-1 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-white/95 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <span>{isUz ? "Qabul Yo'l Xaritasi" : "Admissions Roadmap"}</span>
          </h3>
          <span className="text-xs font-bold text-white/60">
            {steps.filter(s => s.done).length} / {steps.length} {isUz ? "bajarildi" : "completed"}
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className={`bg-slate-900/80 rounded-2xl p-4 sm:p-5 border transition-all flex items-start gap-4 ${
                  st.done
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : idx === steps.findIndex(s => !s.done)
                    ? "border-blue-500/40 bg-blue-950/10"
                    : "border-white/10"
                }`}
              >
                {/* Step Status Badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    st.done
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : idx === steps.findIndex(s => !s.done)
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                      : "bg-slate-800 text-white/50 border-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Step Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-white/95 text-sm sm:text-base leading-snug">
                      {st.title}
                    </h4>
                    {st.statusLabel && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border w-fit ${
                          st.done
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-white/75 border-white/10"
                        }`}
                      >
                        {st.statusLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-normal">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
