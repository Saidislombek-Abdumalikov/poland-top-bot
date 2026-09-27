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
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              {isUz ? "Tayyorgarlik Bazasidir" : "Exam Preparation Repository"}
            </span>
            <h3 className="text-sm font-extrabold text-white">
              {isUz ? "Universitet Kirish Imtihonlari" : "Entrance Exams & Tests"}
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isUz
            ? "Polsha davlat universitetlariga qabul uchun zarur namunaviy test savollari, yechimlar va B1 polyak tili sinovlari."
            : "Sample exam papers, solutions, and B1 state language test materials for university admissions in Poland."}
        </p>
      </div>

      {/* Subject Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {subjects.map((sub, i) => (
          <button
            key={i}
            onClick={() => {
              triggerHaptic("light");
              setSelectedSubject(sub);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              selectedSubject === sub
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {sub === "all" ? (isUz ? "📚 Barcha fanlar" : "📚 All Subjects") : sub}
          </button>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filtered.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 mb-1.5">
                  <FileCheck className="w-3 h-3 text-blue-600" />
                  {test.subject}
                </span>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {isUz ? test.title.uz : test.title.en}
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {isUz ? test.description.uz : test.description.en}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                {test.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {test.durationMinutes} {isUz ? "daqiqa" : "mins"}
                  </span>
                )}
                {test.format && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {test.format}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDownload(test)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 hover:opacity-95"
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
