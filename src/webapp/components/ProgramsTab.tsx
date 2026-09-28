import React, { useState } from "react";
import { ProgramItem, Language, UserProfile } from "../types";
import { triggerHaptic, applyToProgram } from "../services/api";
import {
  Search,
  GraduationCap,
  Euro,
  Clock,
  Send,
  CheckCircle2,
  Bookmark,
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
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
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 transition-colors group-focus-within:text-slate-800" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isUz
              ? "Dastur, soha yoki universitet..."
              : "Search degree, faculty or university..."
          }
          className="w-full pl-10 pr-9 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* University Filter Active Banner */}
      {activeUniFilter && (
        <div className="bg-slate-900/5 backdrop-blur-sm border border-slate-900/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 truncate">
            {isUz ? "Filtr:" : "Filtered by:"}{" "}
            {programs.find((p) => p.universityId === activeUniFilter)?.universityName ||
              activeUniFilter}
          </span>
          <button
            onClick={() => setActiveUniFilter(null)}
            className="text-[11px] font-black uppercase text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-2 transition-colors bg-white/50 px-2 py-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
            {isUz ? "Tozalash" : "Clear"}
          </button>
        </div>
      )}

      {/* Degree Segmented Control */}
      <div className="bg-white/40 backdrop-blur-md border border-slate-200/50 p-1.5 rounded-[1.25rem] flex text-[13px] font-bold shadow-sm">
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("all");
          }}
          className={`flex-1 py-1.5 rounded-[1rem] transition-all duration-300 ${
            degreeFilter === "all"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
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
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
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
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          🏛️ {isUz ? "Magistratura" : "Master"}
        </button>
      </div>

      {/* Program Count Header */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {isUz ? "Dasturlar" : "Programs"}
        </span>
        <span className="text-xs font-bold text-slate-600 bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/50">
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
              className="group relative bg-white border border-slate-200/60 rounded-[1.5rem] p-5 flex flex-col justify-between hover:border-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        prog.degree === "bachelor"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-700 text-white"
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
                    <span className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      {prog.durationYears} {isUz ? "yil" : "years"}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-slate-800 transition-colors">
                    {prog.name}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">
                    {prog.universityName}
                  </p>
                </div>

                <button
                  onClick={(e) => toggleBookmark(prog.id, e)}
                  className={`p-2 rounded-xl transition-all ${
                    isBookmarked
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-300 bg-white hover:bg-slate-50 hover:text-slate-400"
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarked ? "fill-slate-900" : ""}`}
                  />
                </button>
              </div>

              {/* Meta Badges */}
              <div className="flex flex-wrap gap-2 text-[11px] pt-4 mt-4 border-t border-slate-100/80 relative z-10">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                  <Euro className="w-3.5 h-3.5 text-slate-400" />
                  {prog.tuitionFee}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-600 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                  🌐 {prog.language}
                </span>
              </div>

              {/* Action Apply Button */}
              <button
                onClick={() => handleApplyClick(prog)}
                className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] font-bold text-[13px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                {isUz ? "Ariza topshirish" : "Apply for Admission"}
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-600">
              {isUz ? "Dastur topilmadi" : "No programs found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isUz ? "Filtrlarni tozalab ko'ring" : "Try clearing your filters"}
            </p>
          </div>
        )}
      </div>

      {/* 1-Click Application Bottom Sheet Modal */}
      {applyingProgram && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  🚀
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isUz ? "Qabul Arizasini Rasmiylashtirish" : "Submit Admission Application"}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {applyingProgram.universityName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setApplyingProgram(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {appliedSuccess ? (
                <div className="py-8 text-center space-y-3 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isUz ? "Arizangiz Qabul Qilindi!" : "Application Submitted!"}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    {isUz
                      ? "Arizangiz qabul koordinatori va universitet komissiyasiga muvaffaqiyatli yo'naltirildi. Holatni 'Kabinet' bo'limida kuzatishingiz mumkin."
                      : "Your application has been logged and sent to advisors. You can track progress in the Cabinet tab."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Selected Program Card */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-blue-600">
                      {isUz ? "Tanlangan Dastur" : "Selected Program"}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {applyingProgram.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>💰 {applyingProgram.tuitionFee}</span>
                      <span>⏳ {applyingProgram.durationYears} {isUz ? "yil" : "years"}</span>
                    </div>
                  </div>

                  {/* Student Pre-verified Details */}
                  <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        {isUz ? "Tasdiqlangan Profil Ma'lumotlari" : "Verified Student Info"}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-200/70 text-blue-800 rounded">
                        {isUz ? "Oferta Roziligi Bor" : "Oferta Accepted"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
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

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
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
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  disabled={submitting}
                  onClick={handleConfirmApply}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
