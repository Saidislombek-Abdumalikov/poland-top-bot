import React, { useState } from "react";
import { TestItem, Language } from "../types";
import { triggerHaptic } from "../services/api";
import {
  BookOpenCheck,
  Download,
  Clock,
  FileCheck,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface TestsTabProps {
  tests: TestItem[];
  lang: Language;
}

export const TestsTab: React.FC<TestsTabProps> = ({ tests, lang }) => {
  const isUz = lang === "uz";
  const [selectedSubject, setSelectedSubject] = useState("all");

  const subjects = [
    "all",
    isUz ? "Polyak tili" : "Polish Language",
    isUz ? "Matematika" : "Mathematics",
    isUz ? "Ingliz tili" : "English",
    isUz ? "Fizika" : "Physics",
  ];

  const filtered = tests.filter((t) => {
    if (selectedSubject === "all") return true;
    return (
      t.subject.toLowerCase().includes(selectedSubject.toLowerCase()) ||
      t.title.uz.toLowerCase().includes(selectedSubject.toLowerCase())
    );
  });

  const handleDownload = (test: TestItem) => {
    triggerHaptic("medium");
    if (test.downloadUrl) {
      window.open(test.downloadUrl, "_blank");
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Banner */}
      <div className="relative bg-slate-900 overflow-hidden text-white rounded-[2rem] p-6 shadow-xl space-y-4">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-[14px] bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold backdrop-blur-md border border-indigo-400/20">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em] leading-none block mb-1">
              {isUz ? "Tayyorgarlik Bazasidir" : "Exam Preparation"}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              {isUz ? "Universitet Kirish Imtihonlari" : "Entrance Exams & Tests"}
            </h3>
          </div>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed font-medium relative z-10 max-w-lg">
          {isUz
            ? "Polsha davlat universitetlariga qabul uchun zarur namunaviy test savollari, yechimlar va B1 polyak tili sinovlari."
            : "Sample exam papers, solutions, and B1 state language test materials for university admissions in Poland."}
        </p>
      </div>

      {/* Subject Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {subjects.map((sub, i) => (
          <button
            key={i}
            onClick={() => {
              triggerHaptic("light");
              setSelectedSubject(sub);
            }}
            className={`px-4 py-2 rounded-[1rem] text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
              selectedSubject === sub
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105"
                : "bg-white/60 backdrop-blur-md text-slate-500 border border-slate-200/60 hover:text-slate-800 hover:bg-white"
            }`}
          >
            {sub === "all" ? (isUz ? "📚 Barcha fanlar" : "📚 All Subjects") : sub}
          </button>
        ))}
      </div>

      {/* Tests List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((test) => (
          <div
            key={test.id}
            className="group bg-white/80 backdrop-blur-md rounded-[1.5rem] p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 hover:border-slate-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200/50 mb-3">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                {test.subject}
              </span>
              <h4 className="font-black text-slate-900 text-base leading-snug">
                {isUz ? test.title.uz : test.title.en}
              </h4>
              
              <p className="text-[13px] text-slate-600 leading-relaxed font-medium mt-2 bg-slate-50/50 p-3 rounded-[1rem] border border-slate-100/80">
                {isUz ? test.description.uz : test.description.en}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80">
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                {test.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {test.durationMinutes} {isUz ? "daqiqa" : "mins"}
                  </span>
                )}
                {test.format && (
                  <span className="bg-slate-100/80 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                    {test.format}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDownload(test)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[1rem] text-[11px] font-black shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {isUz ? "Yuklab olish" : "Download PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
