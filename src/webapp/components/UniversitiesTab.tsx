import React, { useState } from "react";
import { UniversityItem, Language } from "../types";
import { triggerHaptic } from "../services/api";
import {
  Search,
  MapPin,
  Trophy,
  Euro,
  ExternalLink,
  GraduationCap,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

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

  // Extract unique cities
  const cities = ["all", "Warszawa", "Kraków", "Wrocław"];

  const filtered = universities.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase());
    const matchesCity =
      selectedCity === "all" ||
      u.city.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const openDetails = (uni: UniversityItem) => {
    triggerHaptic("light");
    setSelectedUni(uni);
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
            isUz ? "Universitet yoki shaharni qidirish..." : "Search universities or city..."
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

      {/* City Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => {
              triggerHaptic("light");
              setSelectedCity(city);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              selectedCity === city
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {city === "all"
              ? isUz
                ? "🏛️ Barcha shaharlar"
                : "🏛️ All Cities"
              : `📍 ${city}`}
          </button>
        ))}
      </div>

      {/* University Count Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isUz ? "Top Davlat Universitetlari" : "Top Ranked Universities"}
        </span>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          {filtered.length} {isUz ? "ta oliygoh" : "universities"}
        </span>
      </div>

      {/* List Cards */}
      <div className="space-y-3">
        {filtered.map((uni) => (
          <div
            key={uni.id}
            onClick={() => openDetails(uni)}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {uni.ranking && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/70 mb-1.5">
                    <Trophy className="w-3 h-3 text-amber-600" />
                    {uni.ranking}
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {uni.name}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {uni.city}
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <Euro className="w-3 h-3" />
                {uni.tuitionRange}
              </span>
            </div>

            {/* Popular Faculties Pills */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
              {uni.popularFaculties.slice(0, 3).map((fac, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium"
                >
                  {fac}
                </span>
              ))}
              {uni.popularFaculties.length > 3 && (
                <span className="px-1.5 py-0.5 text-slate-400 text-[11px]">
                  +{uni.popularFaculties.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-600">
              {isUz ? "Universitet topilmadi" : "No universities found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isUz
                ? "Qidiruv so'zini o'zgartirib ko'ring"
                : "Try a different search query"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Details Modal */}
      {selectedUni && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative p-4 border-b border-slate-100 flex items-start justify-between">
              <div className="pr-8">
                {selectedUni.ranking && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/70 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    {selectedUni.ranking}
                  </span>
                )}
                <h2 className="text-base font-extrabold text-slate-900">
                  {selectedUni.name}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedUni.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedUni(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase">
                    {isUz ? "O'qish narxi" : "Tuition Fee"}
                  </span>
                  <div className="text-sm font-extrabold text-blue-950 mt-0.5">
                    {selectedUni.tuitionRange}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">
                    {isUz ? "Qabul davri" : "Intake"}
                  </span>
                  <div className="text-xs font-bold text-blue-900 mt-0.5">
                    {selectedUni.intake || "Oktyabr 2026"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {isUz ? "Universitet haqida" : "About University"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {isUz ? selectedUni.description.uz : selectedUni.description.en}
                </p>
              </div>

              {/* Popular Faculties */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isUz ? "Asosiy fakultetlar" : "Popular Faculties"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedUni.popularFaculties.map((fac, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {fac}
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Link */}
              {selectedUni.websiteUrl && (
                <a
                  href={selectedUni.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-600 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {isUz ? "Rasmiy veb-sayt" : "Official Website"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              )}
            </div>

            {/* Modal Bottom Action Button */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  const id = selectedUni.id;
                  setSelectedUni(null);
                  onSelectUniversityPrograms(id);
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                {isUz
                  ? "Ushbu universitet dasturlarini ko'rish"
                  : "View Programs at this University"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
