import React, { useState, useEffect } from "react";
import { ApplicationItem, DocumentItem, Language, UniversityItem } from "../types";
import {
  fetchAdminStats,
  fetchAllApplications,
  fetchAllDocuments,
  fetchAdminUsers,
  updateApplicationStage,
  updateDocumentStatus,
  updateAdminUniversity,
  deleteAdminUniversity,
  fetchAdminBroadcasts,
  sendAdminBroadcast,
  deleteAdminBroadcast,
  BroadcastLogItem,
  triggerHaptic,
} from "../services/api";
import {
  BarChart3,
  Users,
  FileCheck2,
  GraduationCap,
  Building2,
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
  Edit3,
  X,
  MessageSquare,
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
  const [unis, setUnis] = useState<UniversityItem[]>([]);

  // Search & Inputs
  const [studentSearch, setStudentSearch] = useState("");
  const [counselorInput, setCounselorInput] = useState<{ [appId: string]: string }>({});
  const [docFeedback, setDocFeedback] = useState<{ [docId: string]: string }>({});

  // University Editing State
  const [editingUni, setEditingUni] = useState<UniversityItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("Warszawa");
  const [editTuition, setEditTuition] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editDescUz, setEditDescUz] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editFaculties, setEditFaculties] = useState<string[]>([]);
  const [newFacInput, setNewFacInput] = useState("");
  const [uniSavedSuccess, setUniSavedSuccess] = useState(false);
  const [isSavingUni, setIsSavingUni] = useState(false);

  // Broadcast History State
  const [broadcasts, setBroadcasts] = useState<BroadcastLogItem[]>([]);
  const [broadcastText, setBroadcastText] = useState("");
  const [selectedBroadcastTarget, setSelectedBroadcastTarget] = useState<string>("all");
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, u, a, d, bcList] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAllApplications(),
        fetchAllDocuments(),
        fetchAdminBroadcasts(),
      ]);
      if (s) setStats(s);
      if (u) setStudents(u);
      if (a) setApps(a);
      if (d) setDocs(d);
      if (bcList) setBroadcasts(bcList);

      const uniRes = await fetch("/api/universities").then(r => r.json()).catch(() => null);
      if (uniRes && uniRes.universities) setUnis(uniRes.universities);
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

  const startEditingUni = (u: UniversityItem) => {
    triggerHaptic("light");
    setEditingUni(u);
    setEditName(u.name || "");
    setEditCity(u.city || "Warszawa");
    setEditTuition(u.tuitionRange || "$3,000 / yil");
    setEditDeadline(u.intake || "15-Iyul 2026");
    setEditDescUz(typeof u.description === "object" ? u.description.uz || "" : String(u.description || ""));
    setEditDescEn(typeof u.description === "object" ? u.description.en || "" : String(u.description || ""));
    setEditFaculties(Array.isArray(u.popularFaculties) ? [...u.popularFaculties] : []);
    setNewFacInput("");
    setUniSavedSuccess(false);
    // Scroll to top of editing section
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleAddFaculty = () => {
    if (!newFacInput.trim()) return;
    triggerHaptic("light");
    setEditFaculties((prev) => [...prev, newFacInput.trim()]);
    setNewFacInput("");
  };

  const handleRemoveFaculty = (index: number) => {
    triggerHaptic("light");
    setEditFaculties((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveUniEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUni) return;
    setIsSavingUni(true);
    triggerHaptic("medium");
    await updateAdminUniversity(editingUni.id, {
      name: editName,
      city: editCity,
      tuitionRange: editTuition,
      intake: editDeadline,
      description: { uz: editDescUz, en: editDescEn },
      popularFaculties: editFaculties,
    });
    setUnis((prev) =>
      prev.map((u) =>
        u.id === editingUni.id
          ? {
              ...u,
              name: editName,
              city: editCity,
              tuitionRange: editTuition,
              intake: editDeadline,
              description: { uz: editDescUz, en: editDescEn },
              popularFaculties: editFaculties,
            }
          : u
      )
    );
    setIsSavingUni(false);
    setUniSavedSuccess(true);
    triggerHaptic("success");
    setTimeout(() => setUniSavedSuccess(false), 3500);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    const targetUserId = selectedBroadcastTarget === "all" ? undefined : Number(selectedBroadcastTarget);
    const targetStudent = targetUserId ? students.find((s) => s.userId === targetUserId) : null;
    const targetName = targetStudent
      ? (targetStudent.fullName || `Talaba #${targetUserId}`)
      : (isUz ? "Barcha talabalar" : "All students");

    if (!confirm(isUz ? `${targetName}ga Telegram orqali xabar yuborilsinmi?` : `Send Telegram message to ${targetName}?`)) {
      return;
    }
    setBroadcastSending(true);
    triggerHaptic("medium");
    const res = await sendAdminBroadcast(broadcastText.trim(), targetUserId);
    setBroadcastSending(false);
    if (res.success) {
      setBroadcastResult(
        isUz
          ? `✅ Xabar ${targetName}ga Telegram orqali muvaffaqiyatli yetkazildi!`
          : `✅ Message delivered to ${targetName} via Telegram!`
      );
      // Prepend exact server record with real ID from database
      if (res.broadcast) {
        setBroadcasts((prev) => [res.broadcast!, ...prev]);
      } else {
        const fresh = await fetchAdminBroadcasts();
        setBroadcasts(fresh);
      }
      setBroadcastText("");
    } else {
      setBroadcastResult(isUz ? "❌ Yuborishda xatolik yuz berdi" : "❌ Error sending broadcast");
    }
    triggerHaptic("success");
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (
      !confirm(
        isUz
          ? "⚠️ Ushbu xabarni talabalarning Telegram chatidan ham butunlay o'chirib tashlashni tasdiqlaysizmi?"
          : "Delete this announcement from students' Telegram chats?"
      )
    ) {
      return;
    }
    triggerHaptic("medium");
    const ok = await deleteAdminBroadcast(id);
    if (ok) {
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      triggerHaptic("success");
    } else {
      alert(isUz ? "Xabarni o'chirishda xatolik yuz berdi" : "Failed to delete broadcast");
    }
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
              {apps.map((app) => {
                const s = students.find((st) => st.userId === app.userId);
                const studentName = s?.fullName || app.studentName || `Talaba #${app.userId}`;
                const studentPhone = s?.phone || app.studentPhone;
                const studentUsername = s?.username || app.studentUsername;

                return (
                  <div
                    key={app.id}
                    className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3 hover:border-slate-600 transition-colors"
                  >
                    {/* Student Info Banner */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                          👤
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white/95 block leading-tight">
                            {studentName}
                          </span>
                          {studentPhone && (
                            <span className="text-[11px] text-white/70 font-mono">
                              📞 {studentPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        {studentUsername && (
                          <span className="text-blue-400 font-mono bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/40">
                            @{studentUsername}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          ID: {app.userId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block mb-1">
                          {app.degree?.toUpperCase() || "DEGREE"}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {app.programName}
                        </h4>
                        <p className="text-xs text-slate-400">{app.universityName}</p>
                      </div>
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
              );
            })}

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
              {docs.map((doc) => {
                const s = students.find((st) => st.userId === doc.userId);
                const studentName = s?.fullName || (doc as any).studentName || `Talaba #${doc.userId}`;
                const studentPhone = s?.phone || (doc as any).studentPhone;
                const studentUsername = s?.username || (doc as any).studentUsername;

                return (
                  <div
                    key={doc.id}
                    className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3 hover:border-slate-600 transition-colors"
                  >
                    {/* Student Info Banner */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                          👤
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white/95 block leading-tight">
                            {studentName}
                          </span>
                          {studentPhone && (
                            <span className="text-[11px] text-white/70 font-mono">
                              📞 {studentPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        {studentUsername && (
                          <span className="text-blue-400 font-mono bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/40">
                            @{studentUsername}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          ID: {doc.userId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 block font-mono">
                          {doc.docType}
                        </span>
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
              );
            })}

              {docs.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800">
                  {isUz ? "Hujjatlar navbati bo'sh" : "No documents in queue"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: MANAGE / UPDATE UNIVERSITIES */}
        {section === "unis" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{isUz ? "Oliygohlar Ma'lumotlarini Yangilash" : "Update University Information"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUz
                  ? "Tahrirlash uchun quyidagi ro'yxatdan universitetni tanlang. Narx, deadline va fakultetlarni o'zgartiring."
                  : "Select a university below to edit its name, city, tuition fees, deadlines, and faculties."}
              </p>
            </div>

            {/* University Editing Form Modal/Card */}
            {editingUni && (
              <form onSubmit={handleSaveUniEdit} className="bg-slate-800/80 border-2 border-blue-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      {isUz ? "Tahrirlanmoqda" : "Editing University"}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{editingUni.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUni(null)}
                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">
                      {isUz ? "Universitet Nomi:" : "University Name:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">
                      {isUz ? "Shahar:" : "City:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">
                      {isUz ? "O'qish narxi (USD / yil):" : "Tuition Fee (USD / year):"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editTuition}
                      onChange={(e) => setEditTuition(e.target.value)}
                      placeholder="$3,000 / yil"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">
                      {isUz ? "Qabul muddati (Deadline):" : "Admissions Deadline:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      placeholder="15-Iyul 2026"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">
                    {isUz ? "Tavsif (O'zbek tilida):" : "Description (Uzbek):"}
                  </label>
                  <textarea
                    rows={2}
                    value={editDescUz}
                    onChange={(e) => setEditDescUz(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Faculties Editor */}
                <div className="space-y-2 pt-2 border-t border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold">
                      {isUz ? "Fakultetlar Ro'yxati (Inglizcha | O'zbekcha):" : "Faculties List (English | Uzbek):"}
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {editFaculties.length} {isUz ? "ta fakultet" : "faculties"}
                    </span>
                  </div>

                  {/* Add faculty row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFacInput}
                      onChange={(e) => setNewFacInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFaculty();
                        }
                      }}
                      placeholder={
                        isUz
                          ? "Masalan: Faculty of Computer Science | Kompyuter fanlari fakulteti"
                          : "e.g. Faculty of Computer Science | Kompyuter fanlari"
                      }
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFaculty}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUz ? "Qo'shish" : "Add"}</span>
                    </button>
                  </div>

                  {/* Existing faculties pills */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editFaculties.map((fac, idx) => {
                      const parts = fac.split("|").map((s) => s.trim());
                      const titleEn = parts[0];
                      const titleUz = parts[1] || "";
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{titleEn}</span>
                            {titleUz && (
                              <span className="text-[11px] text-slate-400">{titleUz}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaculty(idx)}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                  <button
                    type="submit"
                    disabled={isSavingUni}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-600/30"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingUni ? (isUz ? "Saqlanmoqda..." : "Saving...") : (isUz ? "O'zgarishlarni Saqlash" : "Save Changes")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingUni(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
                  >
                    {isUz ? "Bekor qilish" : "Cancel"}
                  </button>
                </div>

                {uniSavedSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{isUz ? "Universitet ma'lumotlari muvaffaqiyatli saqlandi!" : "University updated successfully!"}</span>
                  </div>
                )}
              </form>
            )}

            {/* List of Universities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {isUz ? "Mavjud Universitetlar Katalogi" : "Existing Universities Catalog"}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {unis.length} {isUz ? "ta oliygoh" : "institutions"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unis.map((u) => (
                  <div
                    key={u.id}
                    className={`bg-slate-800/60 border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                      editingUni?.id === u.id
                        ? "border-blue-500 bg-slate-800/90 shadow-lg shadow-blue-500/10"
                        : "border-slate-700/80 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white">{u.name}</h4>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                          {u.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                        {typeof u.description === "object" ? u.description.uz || u.description.en : u.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>📅 {u.intake || "15-Iyul 2026"}</span>
                        <span>📚 {u.popularFaculties?.length || 0} {isUz ? "ta fakultet" : "faculties"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-700/50">
                      <span className="text-xs font-bold text-emerald-400">
                        {u.tuitionRange || "$3,000 / yil"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditingUni(u)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isUz ? "Tahrirlash" : "Edit"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(isUz ? "Rostdan ham ushbu universitetni o'chirasizmi?" : "Delete university?")) {
                              await deleteAdminUniversity(u.id);
                              setUnis(unis.filter((uni) => uni.id !== u.id));
                              if (editingUni?.id === u.id) setEditingUni(null);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: BROADCAST ANNOUNCEMENT & HISTORY WITH TELEGRAM DELETE */}
        {section === "broadcast" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                <span>{isUz ? "Barcha Talabalarga E'lon Yuborish" : "Broadcast Announcement"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUz
                  ? "Ushbu xabar barcha talabalarning Telegram chatiga bot nomidan yuboriladi va adminga ko'rinib turadi."
                  : "This message will be instantly sent via the Telegram Bot to all students and tracked in history."}
              </p>
            </div>

            <div className="space-y-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
              {/* Recipient Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isUz ? "Xabar qabul qiluvchi (Kimga):" : "Recipient:"}</span>
                </label>
                <select
                  value={selectedBroadcastTarget}
                  onChange={(e) => setSelectedBroadcastTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">
                    📢 {isUz ? `Barcha talabalar (${students.length} ta)` : `All students (${students.length})`}
                  </option>
                  {students.map((s) => (
                    <option key={s.userId} value={String(s.userId)}>
                      👤 {s.fullName || `Talaba #${s.userId}`} {s.phone ? `(${s.phone})` : ""} {s.username ? `@${s.username}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={5}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder={
                  isUz
                    ? "Xabar matnini kiriting (talabaning Telegram botiga to'g'ridan-to'g'ri boradi)..."
                    : "Enter announcement message..."
                }
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleSendBroadcast}
                  disabled={broadcastSending || !broadcastText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcastSending
                    ? isUz
                      ? "Yuborilmoqda..."
                      : "Sending..."
                    : isUz
                    ? "Xabarni Yuborish"
                    : "Send Message"}
                </button>

                {broadcastResult && (
                  <p className="text-xs font-semibold text-emerald-400">
                    {broadcastResult}
                  </p>
                )}
              </div>
            </div>

            {/* Broadcast History & Delete List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>{isUz ? "Yuborilgan Xabarlar Tarixi" : "Broadcast History"}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {broadcasts.length} {isUz ? "ta xabar" : "messages"}
                </span>
              </div>

              {broadcasts.length === 0 ? (
                <div className="py-8 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
                  {isUz ? "Hozircha yuborilgan xabarlar mavjud emas" : "No messages have been sent yet"}
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          👤 {b.targetName || (isUz ? "Barcha talabalar" : "All students")}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          🕒 {new Date(b.sentAt).toLocaleString(isUz ? "uz-UZ" : "en-US")}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed flex-1">
                          {b.message}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcast(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                          title={isUz ? "Telegramdan ham o'chirish" : "Delete from Telegram"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isUz ? "O'chirish" : "Delete"}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px] text-slate-400 font-mono">
                        <span className="text-emerald-400 font-semibold">
                          👥 {b.sentCount} {isUz ? "ta talabaga yetkazildi" : "students received"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
