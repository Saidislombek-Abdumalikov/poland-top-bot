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

  const filtered = programs.filter((p) => {
    const matchesDegree = degreeFilter === "all" || p.degree === degreeFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.universityName.toLowerCase().includes(search.toLowerCase()) ||
      p.faculty.toLowerCase().includes(search.toLowerCase());
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isUz
              ? "Dastur, soha yoki universitet..."
              : "Search degree, faculty or university..."
          }
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* University Filter Active Banner */}
      {activeUniFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 truncate">
            {isUz ? "Filtr:" : "Filtered by:"}{" "}
            {programs.find((p) => p.universityId === activeUniFilter)?.universityName ||
              activeUniFilter}
          </span>
          <button
            onClick={() => setActiveUniFilter(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 ml-2"
          >
            <X className="w-3.5 h-3.5" />
            {isUz ? "Tozalash" : "Clear"}
          </button>
        </div>
      )}

      {/* Degree Segmented Control */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-bold">
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("all");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            degreeFilter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {isUz ? "Barcha bosqichlar" : "All Degrees"}
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("bachelor");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            degreeFilter === "bachelor"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎓 {isUz ? "Bakalavr (3-4 y)" : "Bachelor"}
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setDegreeFilter("master");
          }}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            degreeFilter === "master"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🏛️ {isUz ? "Magistratura (2 y)" : "Master"}
        </button>
      </div>

      {/* Program Count Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isUz ? "Mavjud Ta'lim Dasturlari" : "Available Academic Programs"}
        </span>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          {filtered.length} {isUz ? "ta dastur" : "programs"}
        </span>
      </div>

      {/* Programs List */}
      <div className="space-y-3">
        {filtered.map((prog) => {
          const isBookmarked = bookmarkedIds.includes(prog.id);

          return (
            <div
              key={prog.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        prog.degree === "bachelor"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
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
                    <span className="text-[11px] text-slate-500 font-medium">
                      • {prog.durationYears} {isUz ? "yil" : "years"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {prog.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {prog.universityName}
                  </p>
                </div>

                <button
                  onClick={(e) => toggleBookmark(prog.id, e)}
                  className={`p-2 rounded-xl transition-all ${
                    isBookmarked
                      ? "text-amber-500 bg-amber-50"
                      : "text-slate-400 bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarked ? "fill-amber-500" : ""}`}
                  />
                </button>
              </div>

              {/* Meta Badges */}
              <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Euro className="w-3.5 h-3.5" />
                  {prog.tuitionFee}
                </span>
                <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                  🌐 {prog.language}
                </span>
              </div>

              {/* Action Apply Button */}
              <button
                onClick={() => handleApplyClick(prog)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isUz ? "Ariza topshirish" : "Apply for Admission"}
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
