import React, { useState } from "react";
import { UniversityItem, Language } from "../types";
import { triggerHaptic } from "../services/api";
import { Search, MapPin, DollarSign, ArrowRight, X, ExternalLink, Calendar, GraduationCap, Building2 } from "lucide-react";

interface UniversitiesTabProps {
  universities: UniversityItem[];
  lang: Language;
  onSelectUniversityPrograms: (universityId: string) => void;
}

export const UniversitiesTab: React.FC<UniversitiesTabProps> = ({
  universities,
  lang,
  onSelectUniversityPrograms,
}) => {
  const isUz = lang === "uz";
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedUni, setSelectedUni] = useState<UniversityItem | null>(null);

  const cities = ["all", "Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź"];

  const filtered = universities.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q);
    const matchesCity =
      selectedCity === "all" ||
      u.city.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const handleCardClick = (uni: UniversityItem) => {
    triggerHaptic("medium");
    setSelectedUni(uni);
  };

  const handleGoToPrograms = (uniId: string) => {
    triggerHaptic("medium");
    setSelectedUni(null);
    onSelectUniversityPrograms(uniId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-8">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white/95 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span>{isUz ? "Polsha Universitetlari" : "Polish Universities"}</span>
          </h2>
          <p className="text-[13px] text-white/75 mt-1 font-medium">
            {isUz
              ? "Oliygohni tanlang va batafsil ma'lumotlarni ko'ring"
              : "Select a university to inspect details and available faculties"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80 group">
          <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-3 transition-colors group-focus-within:text-blue-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUz ? "Universitet yoki shahar bo'yicha qidiruv..." : "Search universities..."}
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
      </div>

      {/* City Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => {
              triggerHaptic("light");
              setSelectedCity(city);
            }}
            className={`px-4 py-2 rounded-2xl text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCity === city
                ? "bg-blue-600 text-white/95 shadow-lg shadow-blue-600/30 border border-blue-400/40"
                : "bg-slate-900/70 text-white/75 hover:text-white/95 border border-white/10 hover:bg-slate-800/80"
            }`}
          >
            {city === "all"
              ? isUz
                ? "Barcha shaharlar"
                : "All Cities"
              : city}
          </button>
        ))}
      </div>

      {/* Universities Grid: Compact & Clean (No giant faculty dump) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((uni) => (
          <div
            key={uni.id}
            onClick={() => handleCardClick(uni)}
            className="group relative bg-slate-900/80 border border-white/10 rounded-[1.5rem] p-5 flex flex-col justify-between hover:border-white/20 hover:bg-slate-900 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl"
          >
            {/* Top Row: City & Ranking */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 uppercase font-bold text-white/75 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {uni.city}
                </span>
                {uni.ranking && (
                  <span className="text-[11px] font-semibold text-blue-400 truncate max-w-[130px]">
                    {uni.ranking}
                  </span>
                )}
              </div>

              {/* University Title */}
              <h3 className="font-black text-white/95 text-base sm:text-lg leading-snug group-hover:text-blue-300 transition-colors">
                {uni.name}
              </h3>

              {/* Compact Faculty Count Tag (NOT the entire list) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-white/75 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {uni.popularFaculties?.length || 0} {isUz ? "ta fakultet mavjud" : "faculties available"}
                  </span>
                </span>
              </div>
            </div>

            {/* Bottom Row: Tuition & View Details Button */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1 text-xs font-bold text-white/85 bg-slate-800/70 px-3 py-1.5 rounded-xl border border-white/5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{uni.tuitionRange || "$2,800 / yil"}</span>
              </div>

              <span className="flex items-center gap-1 text-xs font-bold text-white/75 group-hover:text-white/95 transition-colors">
                <span>{isUz ? "Batafsil" : "Details"}</span>
                <span className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                </span>
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900/50 rounded-[2rem] border border-dashed border-white/10">
            <p className="text-base font-bold text-white/85">
              {isUz ? "Universitet topilmadi" : "No universities found"}
            </p>
            <p className="text-[13px] text-white/60 mt-2 font-medium">
              {isUz
                ? "Qidiruv so'zini yoki shahar filtrini o'zgartirib ko'ring"
                : "Try a different search query or city"}
            </p>
          </div>
        )}
      </div>

      {/* University Detail Modal (Opens when user taps on a university) */}
      {selectedUni && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div
            className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-t-[2rem] sm:rounded-[2rem] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-slate-900/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/75 bg-slate-800 px-2.5 py-1 rounded-xl border border-white/5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    {selectedUni.city}
                  </span>
                  {selectedUni.ranking && (
                    <span className="text-xs font-bold text-blue-400">
                      {selectedUni.ranking}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white/95 leading-snug">
                  {selectedUni.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedUni(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white/75 hover:text-white/95 flex items-center justify-center transition-colors border border-white/10 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-white/60 uppercase block">
                    {isUz ? "Kontrakt to'lovi" : "Tuition Fee"}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-black text-white/95">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>{selectedUni.tuitionRange || "$2,800 / yil"}</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-white/60 uppercase block">
                    {isUz ? "Qabul muddati" : "Intake Deadline"}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-black text-white/95">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{selectedUni.intake || "15-Iyul 2026"}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedUni.description && (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/75">
                    {isUz ? "Universitet haqida" : "About University"}
                  </h4>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {typeof selectedUni.description === "object"
                      ? selectedUni.description[lang] || selectedUni.description.en || ""
                      : selectedUni.description}
                  </p>
                </div>
              )}

              {/* Full Faculties List (with English Title and smaller Uzbek Subtitle) */}
              {selectedUni.popularFaculties && selectedUni.popularFaculties.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/85 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      <span>
                        {isUz ? "Mavjud Fakultetlar" : "Faculties"} ({selectedUni.popularFaculties.length} ta)
                      </span>
                    </h4>
                    <span className="text-[11px] text-white/60">
                      {isUz ? "Ingliz va polyak tilida" : "English & Polish"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedUni.popularFaculties.map((fac, idx) => {
                      const parts = fac.split("|").map((s) => s.trim());
                      const titleEn = parts[0];
                      const titleUz = parts[1] || "";
                      return (
                        <div
                          key={idx}
                          className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 space-y-1 hover:border-white/20 transition-colors"
                        >
                          <span className="text-sm font-bold text-white/95 leading-snug block">
                            {titleEn}
                          </span>
                          {titleUz && (
                            <span className="text-xs text-white/75 font-normal leading-snug block">
                              {titleUz}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Website Link if available */}
              {selectedUni.websiteUrl && (
                <a
                  href={selectedUni.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-blue-400/40 text-xs font-bold text-white/85 hover:text-white/95 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>{isUz ? "Rasmiy veb-saytiga o'tish" : "Visit Official Website"}</span>
                  </span>
                  <span className="text-blue-400 text-xs font-mono">
                    {selectedUni.websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
            </div>

            {/* Modal Footer / Action Button */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/90 flex gap-3">
              <button
                onClick={() => setSelectedUni(null)}
                className="px-5 py-3 rounded-2xl bg-slate-800 text-white/75 hover:text-white/95 font-bold text-sm transition-colors border border-white/10"
              >
                {isUz ? "Yopish" : "Close"}
              </button>
              <button
                onClick={() => handleGoToPrograms(selectedUni.id)}
                className="flex-1 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white/95 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{isUz ? "Dasturlarni ko'rish va ariza topshirish" : "View Programs & Apply"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
