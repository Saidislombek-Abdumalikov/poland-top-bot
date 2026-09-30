import React, { useState } from "react";
import { ProgramItem, Language, UserProfile } from "../types";
import { triggerHaptic, applyToProgram } from "../services/api";
import {
  Search,
  GraduationCap,
  DollarSign,
  Clock,
  Send,
  CheckCircle2,
  Bookmark,
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface ProgramsTabProps {
  programs: ProgramItem[];
  lang: Language;
  user: UserProfile | null;
  initialUniversityFilter?: string | null;
  onApplicationSubmitted?: () => void;
}

export const ProgramsTab: React.FC<ProgramsTabProps> = ({
  programs,
  lang,
  user,
  initialUniversityFilter = null,
  onApplicationSubmitted,
}) => {
  const isUz = lang === "uz";
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<"all" | "bachelor" | "master">("all");
  const [activeUniFilter, setActiveUniFilter] = useState<string | null>(initialUniversityFilter);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [applyingProgram, setApplyingProgram] = useState<ProgramItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("light");
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filtered = (programs || []).filter((p) => {
    const matchesDegree = degreeFilter === "all" || p.degree === degreeFilter;
    const pName = (p.name || "").toLowerCase();
    const pUni = (p.universityName || "").toLowerCase();
    const pFac = (p.faculty || "").toLowerCase();
    const q = (search || "").toLowerCase();
    const matchesSearch = pName.includes(q) || pUni.includes(q) || pFac.includes(q);
    const matchesUni = !activeUniFilter || p.universityId === activeUniFilter;
    return matchesDegree && matchesSearch && matchesUni;
  });

  const handleApplyClick = (prog: ProgramItem) => {
    triggerHaptic("medium");
    setApplyingProgram(prog);
    setAppliedSuccess(false);
  };

  const handleConfirmApply = async () => {
    if (!applyingProgram || !user) return;
    setSubmitting(true);
    triggerHaptic("heavy");

    const res = await applyToProgram(user.id, applyingProgram.id);
    setSubmitting(false);

    if (res.success) {
      triggerHaptic("success");
      setAppliedSuccess(true);
      setTimeout(() => {
        setApplyingProgram(null);
        setAppliedSuccess(false);
        onApplicationSubmitted?.();
      }, 1800);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full pb-8">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-3 transition-colors group-focus-within:text-blue-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isUz
              ? "Dastur, soha yoki universitet..."
              : "Search degree, faculty or university..."
          }
          className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-3 text-white/50 hover:text-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* University Filter Active Banner */}
      {activeUniFilter && (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-white/85 truncate">
            {isUz ? "Filtr:" : "Filtered by:"}{" "}
            {programs.find((p) => p.universityId === activeUniFilter)?.universityName ||
              activeUniFilter}
          </span>
          <button
            onClick={() => setActiveUniFilter(null)}
            className="text-[11px] font-black uppercase text-white/60 hover:text-white/95 flex items-center gap-1 ml-2 transition-colors bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/5"
          >
            <X className="w-3.5 h-3.5" />
            {isUz ? "Tozalash" : "Clear"}
          </button>
        </div>
      )}

      {/* Degree Segmented Control */}
      <div className="bg-slate-900/90 border border-white/10 p-1.5 rounded-[1.25rem] flex text-[13px] font-bold shadow-lg">
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("all");
          }}
          className={`flex-1 py-1.5 rounded-[1rem] transition-all duration-300 ${
            degreeFilter === "all"
              ? "bg-blue-600 text-white/95 shadow-md shadow-blue-600/30"
              : "text-white/60 hover:text-white/85"
          }`}
        >
          {isUz ? "Barcha" : "All"}
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("bachelor");
          }}
          className={`flex-1 py-1.5 rounded-[1rem] transition-all duration-300 ${
            degreeFilter === "bachelor"
              ? "bg-blue-600 text-white/95 shadow-md shadow-blue-600/30"
              : "text-white/60 hover:text-white/85"
          }`}
        >
          🎓 {isUz ? "Bakalavr" : "Bachelor"}
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("master");
          }}
          className={`flex-1 py-1.5 rounded-[1rem] transition-all duration-300 ${
            degreeFilter === "master"
              ? "bg-blue-600 text-white/95 shadow-md shadow-blue-600/30"
              : "text-white/60 hover:text-white/85"
          }`}
        >
          🏛️ {isUz ? "Magistratura" : "Master"}
        </button>
      </div>

      {/* Program Count Header */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">
          {isUz ? "Dasturlar" : "Programs"}
        </span>
        <span className="text-xs font-bold text-white/85 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
          {filtered.length} {isUz ? "ta dastur" : "programs"}
        </span>
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prog) => {
          const isBookmarked = bookmarkedIds.includes(prog.id);

          return (
            <div
              key={prog.id}
              className="group relative bg-slate-900/80 border border-white/10 rounded-[1.5rem] p-5 flex flex-col justify-between hover:border-white/20 hover:bg-slate-900 transition-all duration-300 overflow-hidden shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        prog.degree === "bachelor"
                          ? "bg-blue-600/30 text-blue-400 border border-blue-500/30"
                          : "bg-purple-600/30 text-purple-400 border border-purple-500/30"
                      }`}
                    >
                      {prog.degree === "bachelor"
                        ? isUz
                          ? "Bakalavriat"
                          : "Bachelor"
                        : isUz
                        ? "Magistratura"
                        : "Master"}
                    </span>
                    <span className="text-[11px] text-white/75 font-semibold bg-slate-800/80 px-2 py-0.5 rounded-lg border border-white/5">
                      {prog.durationYears} {isUz ? "yil" : "years"}
                    </span>
                  </div>
                  <h3 className="font-black text-white/95 text-base leading-tight group-hover:text-blue-300 transition-colors">
                    {prog.name}
                  </h3>
                  <p className="text-[13px] font-medium text-white/75 mt-1">
                    {prog.universityName}
                  </p>

                  {prog.faculty && (
                    <div className="mt-2 flex flex-col bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-white/90 leading-snug">
                        {prog.faculty.split("|")[0].trim()}
                      </span>
                      {prog.faculty.includes("|") && (
                        <span className="text-[10px] text-white/60 font-normal leading-snug">
                          {prog.faculty.split("|")[1].trim()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => toggleBookmark(prog.id, e)}
                  className={`p-2 rounded-xl transition-all border ${
                    isBookmarked
                      ? "text-blue-400 bg-blue-500/20 border-blue-500/30"
                      : "text-white/40 bg-slate-800/80 border-white/5 hover:text-white/80"
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarked ? "fill-blue-400" : ""}`}
                  />
                </button>
              </div>

              {/* Meta Badges */}
              <div className="flex flex-wrap gap-1.5 text-[11px] pt-3.5 mt-3.5 border-t border-white/10 relative z-10">
                <span className="flex items-center gap-1 font-bold text-white/90 bg-slate-800/90 border border-white/5 px-2.5 py-1 rounded-xl">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  {prog.tuitionFee}
                </span>
                <span className="flex items-center gap-1 font-bold text-white/75 bg-slate-800/90 border border-white/5 px-2.5 py-1 rounded-xl">
                  🌐 {prog.language}
                </span>
                {prog.admissionMethod && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-300 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-lg">
                    📋 {prog.admissionMethod}
                  </span>
                )}
                {prog.ieltsMin && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-lg">
                    IELTS {prog.ieltsMin}+
                  </span>
                )}
                {prog.verified && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
                    ✅ Verified
                  </span>
                )}
              </div>

              {/* Source Link & Action Apply Button */}
              <div className="mt-3.5 flex items-center gap-2">
                {prog.sourceUrl && (
                  <a
                    href={prog.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white/80 hover:text-white rounded-[1.25rem] border border-white/10 transition-colors shrink-0"
                    title={isUz ? "Rasmiy sayt sahifasi" : "Official source link"}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleApplyClick(prog)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white/95 rounded-[1.25rem] font-bold text-[13px] shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isUz ? "Ariza topshirish" : "Apply for Admission"}
                  <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
            <p className="text-sm font-semibold text-white/85">
              {isUz ? "Dastur topilmadi" : "No programs found"}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {isUz ? "Filtrlarni tozalab ko'ring" : "Try clearing your filters"}
            </p>
          </div>
        )}
      </div>

      {/* 1-Click Application Bottom Sheet Modal */}
      {applyingProgram && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in">
          <div
            className="w-full max-w-md bg-slate-950 border border-white/15 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
                  🚀
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white/95">
                    {isUz ? "Qabul Arizasini Rasmiylashtirish" : "Submit Admission Application"}
                  </h3>
                  <span className="text-[11px] text-white/60 font-medium">
                    {applyingProgram.universityName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setApplyingProgram(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-white/60 flex items-center justify-center hover:bg-slate-700 hover:text-white/95 border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {appliedSuccess ? (
                <div className="py-8 text-center space-y-3 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-white/95">
                    {isUz ? "Arizangiz Qabul Qilindi!" : "Application Submitted!"}
                  </h3>
                  <p className="text-xs text-white/75 max-w-xs mx-auto leading-relaxed">
                    {isUz
                      ? "Arizangiz qabul koordinatori va universitet komissiyasiga muvaffaqiyatli yo'naltirildi. Holatni 'Kabinet' bo'limida kuzatishingiz mumkin."
                      : "Your application has been logged and sent to advisors. You can track progress in the Cabinet tab."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Selected Program Card */}
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] uppercase font-bold text-blue-400">
                      {isUz ? "Tanlangan Dastur" : "Selected Program"}
                    </div>
                    <div className="text-sm font-bold text-white/95 mt-0.5">
                      {applyingProgram.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/75 mt-1">
                      <span>💰 {applyingProgram.tuitionFee}</span>
                      <span>⏳ {applyingProgram.durationYears} {isUz ? "yil" : "years"}</span>
                    </div>
                  </div>

                  {/* Student Pre-verified Details */}
                  <div className="bg-blue-950/30 p-3.5 rounded-2xl border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isUz ? "Tasdiqlangan Profil Ma'lumotlari" : "Verified Student Info"}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                        {isUz ? "Oferta Roziligi Bor" : "Oferta Accepted"}
                      </span>
                    </div>

                    <div className="text-xs text-white/80 space-y-1">
                      <div>
                        <b>{isUz ? "F.I.SH:" : "Name:"}</b> {user?.fullName || "Student"}
                      </div>
                      <div>
                        <b>{isUz ? "Telefon:" : "Phone:"}</b> {user?.phone || "+998 90 123 45 67"}
                      </div>
                      <div>
                        <b>{isUz ? "Telegram ID:" : "TG ID:"}</b> {user?.id}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {isUz
                        ? "Ariza topshirilgach, qabul koordinatori hujjatlaringizni tekshirib, 24 soat ichida bog'lanadi."
                        : "After submission, an admissions advisor will verify your documents within 24 hours."}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!appliedSuccess && (
              <div className="p-4 border-t border-white/10 bg-slate-900/90">
                <button
                  disabled={submitting}
                  onClick={handleConfirmApply}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white/95 rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{isUz ? "Topshirilmoqda..." : "Submitting..."}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isUz ? "Arizani Tasdiqlash va Yuborish" : "Confirm and Submit"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
