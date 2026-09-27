import React, { useState } from "react";
import { UniversityItem, Language } from "../types";
import { triggerHaptic } from "../services/api";
import { Search, MapPin, Euro, ArrowRight, X } from "lucide-react";

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

  const cities = ["all", "Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk"];

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

  const handleEnterUni = (uniId: string) => {
    triggerHaptic("medium");
    onSelectUniversityPrograms(uniId);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {isUz ? "Polsha Davlat Universitetlari" : "Polish Universities"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isUz
              ? "Oliygohni tanlang va mos ta'lim yo'nalishlarini ko'ring"
              : "Select a university to view available degree programs"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUz ? "Qidirish..." : "Search..."}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* City Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => {
              triggerHaptic("light");
              setSelectedCity(city);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCity === city
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {city === "all"
              ? isUz
                ? "Barchasi"
                : "All Cities"
              : city}
          </button>
        ))}
      </div>

      {/* Universities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((uni) => (
          <div
            key={uni.id}
            onClick={() => handleEnterUni(uni.id)}
            className="group bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all duration-150 cursor-pointer"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {uni.city}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-blue-900 transition-colors">
                {uni.name}
              </h3>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                <Euro className="w-3.5 h-3.5 text-slate-500" />
                <span>{uni.tuitionRange || "€2,500 / yil"}</span>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 group-hover:translate-x-0.5 transition-transform">
                {isUz ? "Kirish" : "Enter"}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-slate-600">
              {isUz ? "Universitet topilmadi" : "No universities found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isUz
                ? "Qidiruv so'zini yoki shahar filtrini o'zgartirib ko'ring"
                : "Try a different search query or city"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
