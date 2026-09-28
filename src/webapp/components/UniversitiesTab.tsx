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
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isUz ? "Polsha Davlat Universitetlari" : "Polish Universities"}
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">
            {isUz
              ? "Oliygohni tanlang va mos ta'lim yo'nalishlarini ko'ring"
              : "Select a university to view available degree programs"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 transition-colors group-focus-within:text-slate-800" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUz ? "Qidirish..." : "Search..."}
            className="w-full pl-10 pr-9 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
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
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105"
                : "bg-white/60 backdrop-blur-md text-slate-500 hover:text-slate-800 border border-slate-200/60 hover:bg-white"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((uni) => (
          <div
            key={uni.id}
            onClick={() => handleEnterUni(uni.id)}
            className="group relative bg-white border border-slate-200/60 rounded-[1.5rem] p-5 flex flex-col justify-between hover:border-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 to-transparent rounded-full opacity-50 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium tracking-wide">
                <span className="flex items-center gap-1.5 uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  {uni.city}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight group-hover:text-slate-800 transition-colors">
                {uni.name}
              </h3>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100/80 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/50">
                <Euro className="w-3.5 h-3.5 text-slate-400" />
                <span>{uni.tuitionRange || "€2,500 / yil"}</span>
              </div>

              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-300">
            <p className="text-base font-bold text-slate-700">
              {isUz ? "Universitet topilmadi" : "No universities found"}
            </p>
            <p className="text-[13px] text-slate-500 mt-2 font-medium">
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
