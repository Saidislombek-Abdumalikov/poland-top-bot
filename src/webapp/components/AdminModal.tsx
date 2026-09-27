import React, { useState, useEffect } from "react";
import { ApplicationItem, DocumentItem, Language } from "../types";
import {
  fetchAdminStats,
  fetchAllApplications,
  fetchAllDocuments,
  updateApplicationStage,
  updateDocumentStatus,
  triggerHaptic,
} from "../services/api";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  FileCheck2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Search,
  Check,
} from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isUz = lang === "uz";
  const [activeTab, setActiveTab] = useState<"stats" | "apps" | "docs">("stats");
  const [stats, setStats] = useState({
    totalStudents: 148,
    totalApplications: 62,
    pendingDocs: 19,
    acceptedStudents: 34,
  });
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");
  const [counselorInput, setCounselorInput] = useState<{ [appId: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const s = await fetchAdminStats();
    if (s) setStats(s);

    const a = await fetchAllApplications();
    setApps(a);

    const d = await fetchAllDocuments();
    setDocs(d);
  };

  if (!isOpen) return null;

  const handleStageChange = async (appId: string, stage: string) => {
    triggerHaptic("medium");
    const notes = counselorInput[appId] || "";
    await updateApplicationStage(appId, stage, notes);
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, stage: stage as any, counselorNotes: notes } : a))
    );
    triggerHaptic("success");
  };

  const handleDocStatusChange = async (docId: string, status: string) => {
    triggerHaptic("medium");
    await updateDocumentStatus(docId, status);
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: status as any } : d))
    );
    triggerHaptic("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-md p-0 animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Admin Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                  Admissions CRM
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-white">
                {isUz ? "Admin Boshqaruv Markazi" : "Admissions Management"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="bg-slate-100 p-1.5 flex gap-1 border-b border-slate-200">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("stats");
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "stats"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isUz ? "Statistika" : "Overview"}</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("apps");
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "apps"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{isUz ? "Arizalar" : "Applications"}</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("docs");
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "docs"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{isUz ? "Hujjatlar" : "Documents"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: STATS */}
          {activeTab === "stats" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {isUz ? "Jami Ro'yxatdan O'tgan" : "Registered Students"}
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {stats.totalStudents}
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block">
                    {isUz ? "Jami Topshirilgan Ariza" : "Total Applications"}
                  </span>
                  <div className="text-xl font-black text-blue-900 mt-1">
                    {stats.totalApplications}
                  </div>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">
                    {isUz ? "Kutilayotgan Hujjatlar" : "Pending Documents"}
                  </span>
                  <div className="text-xl font-black text-amber-900 mt-1">
                    {stats.pendingDocs}
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                    {isUz ? "Qabul Qilingan Talabalar" : "Accepted Students"}
                  </span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {stats.acceptedStudents}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">
                  {isUz ? "📌 Tezkor Yo'riqnoma" : "📌 Quick Actions"}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {isUz
                    ? "Talabalar yuborgan arizalarni 'Arizalar' bo'limida ko'rib, bosqichini o'zgartirishingiz mumkin. Hujjatlarni tasdiqlash uchun 'Hujjatlar' bo'limidan foydalaning."
                    : "Review submitted student applications and advance them through admission stages. Verify student documents in the Documents queue."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === "apps" && (
            <div className="space-y-3">
              {apps.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  {isUz ? "Hozircha arizalar mavjud emas." : "No applications yet."}
                </div>
              ) : (
                apps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {app.programName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app.universityName} • Student ID: {app.userId}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {app.stage}
                      </span>
                    </div>

                    {/* Counselor Note Input */}
                    <div>
                      <input
                        type="text"
                        placeholder={
                          isUz ? "Maslahatchi sharhi yozish..." : "Add counselor note..."
                        }
                        value={counselorInput[app.id] ?? (app.counselorNotes || "")}
                        onChange={(e) =>
                          setCounselorInput({ ...counselorInput, [app.id]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>

                    {/* Stage Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => handleStageChange(app.id, "reviewing")}
                        className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg hover:bg-amber-200 active:scale-95"
                      >
                        ⏳ Tekshiruvda
                      </button>
                      <button
                        onClick={() => handleStageChange(app.id, "university_review")}
                        className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-200 active:scale-95"
                      >
                        🏛️ Universitetda
                      </button>
                      <button
                        onClick={() => handleStageChange(app.id, "accepted")}
                        className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg hover:bg-emerald-200 active:scale-95"
                      >
                        🎉 Qabul!
                      </button>
                      <button
                        onClick={() => handleStageChange(app.id, "rejected")}
                        className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-lg hover:bg-rose-200 active:scale-95"
                      >
                        ❌ Rad
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTS QUEUE */}
          {activeTab === "docs" && (
            <div className="space-y-3">
              {docs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  {isUz ? "Hujjatlar navbati bo'sh." : "Document queue empty."}
                </div>
              ) : (
                docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {doc.docType.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Student ID: {doc.userId}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          doc.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "reviewing"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    {doc.fileUrl && (
                      <div className="text-[11px] text-blue-600 truncate bg-white p-2 rounded-lg border border-slate-200">
                        🔗 {doc.fileUrl}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleDocStatusChange(doc.id, "approved")}
                        className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isUz ? "Tasdiqlash" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDocStatusChange(doc.id, "needs_correction")}
                        className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        {isUz ? "Tuzatish so'rash" : "Reject/Fix"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
