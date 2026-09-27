import React, { useState, useEffect } from "react";
import { ApplicationItem, DocumentItem, Language, UniversityItem } from "../types";
import {
  fetchAdminStats,
  fetchAllApplications,
  fetchAllDocuments,
  fetchAdminUsers,
  updateApplicationStage,
  updateDocumentStatus,
  createAdminUniversity,
  deleteAdminUniversity,
  fetchAdminOferta,
  saveAdminOferta,
  sendAdminBroadcast,
  triggerHaptic,
} from "../services/api";
import {
  BarChart3,
  Users,
  FileCheck2,
  GraduationCap,
  Building2,
  FileText,
  Send,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Save,
  Check,
  ExternalLink,
} from "lucide-react";

interface AdminPortalProps {
  onBack: () => void;
  lang: Language;
}

type AdminSection =
  | "stats"
  | "students"
  | "apps"
  | "docs"
  | "unis"
  | "oferta"
  | "broadcast";

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBack, lang }) => {
  const isUz = lang === "uz";
  const [section, setSection] = useState<AdminSection>("stats");
  const [loading, setLoading] = useState(false);

  // States
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApplications: 0,
    pendingDocs: 0,
    acceptedStudents: 0,
  });
  const [students, setStudents] = useState<any[]>([]);
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [ofertaText, setOfertaText] = useState("");
  const [ofertaSaved, setOfertaSaved] = useState(false);

  // Search & Inputs
  const [studentSearch, setStudentSearch] = useState("");
  const [counselorInput, setCounselorInput] = useState<{ [appId: string]: string }>({});
  const [docFeedback, setDocFeedback] = useState<{ [docId: string]: string }>({});

  // New University Form
  const [newUniName, setNewUniName] = useState("");
  const [newUniCity, setNewUniCity] = useState("Warszawa");
  const [newUniTuition, setNewUniTuition] = useState("€2,500 / yil");

  // Broadcast Form
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, u, a, d, o] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAllApplications(),
        fetchAllDocuments(),
        fetchAdminOferta(),
      ]);
      if (s) setStats(s);
      if (u) setStudents(u);
      if (a) setApps(a);
      if (d) setDocs(d);
      if (o) setOfertaText(o);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

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
    const feedback = docFeedback[docId] || "";
    await updateDocumentStatus(docId, status, feedback);
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: status as any, feedback } : d))
    );
    triggerHaptic("success");
  };

  const handleCreateUni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim()) return;
    triggerHaptic("medium");
    await createAdminUniversity({
      name: newUniName.trim(),
      city: newUniCity,
      tuitionRange: newUniTuition,
    });
    setNewUniName("");
    alert(isUz ? "Universitet muvaffaqiyatli qo'shildi!" : "University added successfully!");
    triggerHaptic("success");
  };

  const handleSaveOferta = async () => {
    if (!ofertaText.trim()) return;
    triggerHaptic("medium");
    await saveAdminOferta(ofertaText.trim(), "SuperAdmin");
    setOfertaSaved(true);
    setTimeout(() => setOfertaSaved(false), 3000);
    triggerHaptic("success");
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    if (!confirm(isUz ? "Barcha talabalarga xabar yuborilsinmi?" : "Send broadcast to all students?")) {
      return;
    }
    setBroadcastSending(true);
    triggerHaptic("medium");
    const res = await sendAdminBroadcast(broadcastText.trim());
    setBroadcastSending(false);
    if (res.success) {
      setBroadcastResult(
        isUz
          ? `✅ Xabar ${res.sentCount} ta talabaga yetkazildi!`
          : `✅ Broadcast sent to ${res.sentCount} students!`
      );
      setBroadcastText("");
    } else {
      setBroadcastResult(isUz ? "❌ Yuborishda xatolik yuz berdi" : "❌ Error sending broadcast");
    }
    triggerHaptic("success");
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      String(s.userId).includes(q)
    );
  });

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isUz ? "Chiqish" : "Back to Student View"}</span>
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {isUz ? "PTU Administrator Paneli" : "PTU Admin Control Center"}
            </h1>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {stats.totalStudents} {isUz ? "talaba" : "students"}
          </div>
        </div>
      </header>

      {/* Admin Navigation Pills */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "stats", label: isUz ? "Statistika" : "Overview", icon: BarChart3 },
            { id: "students", label: isUz ? "Talabalar" : "Students", icon: Users },
            { id: "apps", label: isUz ? "Arizalar" : "Applications", icon: GraduationCap },
            { id: "docs", label: isUz ? "Hujjatlar" : "Documents", icon: FileCheck2 },
            { id: "unis", label: isUz ? "Oliygohlar" : "Universities", icon: Building2 },
            { id: "oferta", label: isUz ? "Oferta" : "Terms", icon: FileText },
            { id: "broadcast", label: isUz ? "E'lon Yuborish" : "Broadcast", icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic("light");
                  setSection(tab.id as AdminSection);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* SECTION 1: OVERVIEW / STATS */}
        {section === "stats" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Tizim Ko'rsatkichlari" : "System Statistics"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUz ? "Jonli qabul statistikasi va arizalar holati" : "Real-time admissions and registration metrics"}
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium block">
                  {isUz ? "Ro'yxatdan o'tganlar" : "Total Students"}
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {stats.totalStudents}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium block">
                  {isUz ? "Arizalar soni" : "Total Applications"}
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {stats.totalApplications}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium block">
                  {isUz ? "Kutilayotgan hujjatlar" : "Pending Documents"}
                </span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">
                  {stats.pendingDocs}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <span className="text-xs text-slate-400 font-medium block">
                  {isUz ? "Qabul qilinganlar" : "Accepted Students"}
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                  {stats.acceptedStudents}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {isUz ? "Tezkor Amallar" : "Quick Actions"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSection("broadcast")}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isUz ? "Talabalarga e'lon yuborish" : "Send announcement"}
                </button>
                <button
                  onClick={() => setSection("docs")}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {isUz ? "Hujjatlarni tekshirish" : "Review documents"}
                </button>
                <button
                  onClick={() => setSection("unis")}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {isUz ? "Yangi universitet qo'shish" : "Add university"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: STUDENTS DIRECTORY */}
        {section === "students" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isUz ? "Talabalar Ro'yxati" : "Students Directory"}
                </h2>
                <p className="text-xs text-slate-400">
                  {filteredStudents.length} {isUz ? "ta talaba topildi" : "students found"}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder={isUz ? "Ism yoki telefon..." : "Search name or phone..."}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{isUz ? "Ism / Familiya" : "Full Name"}</th>
                    <th className="py-3 px-4">{isUz ? "Telefon" : "Phone"}</th>
                    <th className="py-3 px-4">TG ID</th>
                    <th className="py-3 px-4">{isUz ? "Bosqich" : "Degree"}</th>
                    <th className="py-3 px-4">Oferta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        {s.fullName || "Student"}
                        {s.username && (
                          <span className="text-slate-400 text-[11px] block font-mono">
                            @{s.username}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{s.phone || "—"}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{s.userId}</td>
                      <td className="py-3 px-4 text-slate-300">{s.preferredLevel || "Bachelor"}</td>
                      <td className="py-3 px-4">
                        {s.acceptedOfertaAt ? (
                          <span className="text-emerald-400 font-semibold">✅ Qabul qilingan</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">⏳ Kutilmoqda</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {isUz ? "Talabalar topilmadi" : "No students found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: APPLICATIONS MANAGEMENT */}
        {section === "apps" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Qabul Arizalari" : "Applications Management"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz ? "Talabalar yuborgan arizalarning bosqichlarini boshqaring" : "Manage student application stages and counselor notes"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">
                        {app.degree?.toUpperCase() || "DEGREE"}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {app.programName}
                      </h4>
                      <p className="text-xs text-slate-400">{app.universityName}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-200">
                      ID: {app.userId}
                    </span>
                  </div>

                  {/* Stage Switcher */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      {isUz ? "Ariza Bosqichi:" : "Current Stage:"}
                    </label>
                    <select
                      value={app.stage}
                      onChange={(e) => handleStageChange(app.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-slate-500"
                    >
                      <option value="submitted">1. Yuborilgan (Submitted)</option>
                      <option value="documents_pending">2. Hujjatlar kutilmoqda (Docs Pending)</option>
                      <option value="reviewing">3. Ko'rib chiqilmoqda (Reviewing)</option>
                      <option value="university_review">4. Universitetda tekshiruv (Uni Review)</option>
                      <option value="accepted">5. ✅ Qabul qilindi / Offer berildi (Accepted)</option>
                      <option value="rejected">6. ❌ Rad etildi (Rejected)</option>
                    </select>
                  </div>

                  {/* Counselor Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      {isUz ? "Maslahatchi Izohi:" : "Counselor Notes:"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={app.counselorNotes || ""}
                        onChange={(e) =>
                          setCounselorInput((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder={isUz ? "Talaba uchun izoh..." : "Note for student..."}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleStageChange(app.id, app.stage)}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition-colors"
                      >
                        {isUz ? "Saqlash" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {apps.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800">
                  {isUz ? "Hozircha arizalar mavjud emas" : "No applications found"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: DOCUMENTS VERIFICATION */}
        {section === "docs" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Hujjatlar Tekshiruvi" : "Document Review Queue"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz ? "Talabalar yuklagan hujjatlarni tasdiqlang yoki qayta yuklashga qaytaring" : "Approve or request corrections for student documents"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block font-mono">
                        {doc.docType}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Talaba ID: {doc.userId}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        doc.status === "approved"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : doc.status === "needs_correction"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isUz ? "Faylni ko'rish / yuklab olish" : "View / Download File"}
                    </a>
                  )}

                  {/* Feedback Note */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      defaultValue={doc.feedback || ""}
                      onChange={(e) =>
                        setDocFeedback((prev) => ({ ...prev, [doc.id]: e.target.value }))
                      }
                      placeholder={isUz ? "Izoh yoki kamchilik sababi..." : "Correction reason..."}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDocStatusChange(doc.id, "approved")}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                    >
                      ✅ {isUz ? "Tasdiqlash" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDocStatusChange(doc.id, "needs_correction")}
                      className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
                    >
                      ⚠️ {isUz ? "Qayta topshirish" : "Needs Correction"}
                    </button>
                  </div>
                </div>
              ))}

              {docs.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800">
                  {isUz ? "Hujjatlar navbati bo'sh" : "No documents in queue"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: MANAGE UNIVERSITIES */}
        {section === "unis" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Oliygohlarni Boshqarish" : "Manage Universities"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz ? "Yangi universitet ma'lumotlarini qo'shing" : "Add or update university catalog entries"}
              </p>
            </div>

            {/* Add Uni Form */}
            <form onSubmit={handleCreateUni} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4 max-w-xl">
              <h3 className="text-sm font-semibold text-white">
                {isUz ? "Yangi Universitet Qo'shish" : "Add New University"}
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">
                  {isUz ? "Universitet Nomi:" : "University Name:"}
                </label>
                <input
                  type="text"
                  required
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  placeholder="Masalan: Warsaw University of Technology"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">
                    {isUz ? "Shahar:" : "City:"}
                  </label>
                  <select
                    value={newUniCity}
                    onChange={(e) => setNewUniCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="Warszawa">Warszawa</option>
                    <option value="Kraków">Kraków</option>
                    <option value="Wrocław">Wrocław</option>
                    <option value="Poznań">Poznań</option>
                    <option value="Gdańsk">Gdańsk</option>
                    <option value="Łódź">Łódź</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">
                    {isUz ? "O'qish narxi:" : "Tuition Fee:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUniTuition}
                    onChange={(e) => setNewUniTuition(e.target.value)}
                    placeholder="€2,500 / yil"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isUz ? "Universitetni Saqlash" : "Save University"}
              </button>
            </form>
          </div>
        )}

        {/* SECTION 6: OFERTA EDITOR */}
        {section === "oferta" && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Ommaviy Oferta Matni" : "Terms & Public Oferta"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz ? "Botda va portalda ko'rinadigan rasmiy oferta shartlarini tahrirlang" : "Edit the legal terms and agreement presented to new students"}
              </p>
            </div>

            <textarea
              rows={12}
              value={ofertaText}
              onChange={(e) => setOfertaText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 leading-relaxed"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveOferta}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isUz ? "Ofertani Saqlash" : "Save Terms"}
              </button>

              {ofertaSaved && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {isUz ? "Muvaffaqiyatli yangilandi!" : "Saved successfully!"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SECTION 7: BROADCAST ANNOUNCEMENT */}
        {section === "broadcast" && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUz ? "Barcha Talabalarga E'lon Yuborish" : "Broadcast Announcement"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Ushbu xabar ro'yxatdan o'tgan barcha talabalarning Telegram chatiga bot nomidan yuboriladi"
                  : "This message will be instantly sent via the Telegram Bot to all registered students"}
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={6}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder={
                  isUz
                    ? "E'lon matnini kiriting (masalan: Yangi grantlar yoki muddatlar haqida)..."
                    : "Enter announcement message..."
                }
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />

              <button
                onClick={handleSendBroadcast}
                disabled={broadcastSending || !broadcastText.trim()}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {broadcastSending
                  ? isUz
                    ? "Yuborilmoqda..."
                    : "Sending..."
                  : isUz
                  ? "E'lonni Yuborish"
                  : "Send Broadcast"}
              </button>

              {broadcastResult && (
                <p className="text-xs font-semibold text-slate-300 pt-2">
                  {broadcastResult}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
