import React, { useState, useEffect } from "react";
import {
  UserProfile,
  UniversityItem,
  ProgramItem,
  DocumentItem,
  ApplicationItem,
  TestItem,
  ReviewItem,
  TabType,
  Language,
} from "./types";
import {
  fetchCurrentUser,
  fetchUniversities,
  fetchPrograms,
  fetchUserDocuments,
  fetchUserApplications,
  fetchTests,
  fetchReviews,
} from "./services/api";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { UniversitiesTab } from "./components/UniversitiesTab";
import { ProgramsTab } from "./components/ProgramsTab";
import { DocumentsTab } from "./components/DocumentsTab";
import { TestsTab } from "./components/TestsTab";
import { ProfileTab } from "./components/ProfileTab";
import { AdminPortal } from "./components/AdminPortal";
import { NotRegisteredScreen } from "./components/NotRegisteredScreen";
import { RoadmapTab } from "./components/RoadmapTab";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("roadmap");
  const [lang, setLang] = useState<Language>("uz");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Navigation filters & Admin View
  const [filterUniForPrograms, setFilterUniForPrograms] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    // Expand Telegram WebApp to full mobile height
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {}
    }

    async function initialize() {
      setLoading(true);
      try {
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isAdminUrl = urlParams?.get("admin") === "true";
        if (isAdminUrl) {
          setIsAdminView(true);
        }

        const u = await fetchCurrentUser();
        if (u) {
          setUser(u);
          setLang(u.lang || "uz");

          try {
            const [docs, apps] = await Promise.all([
              fetchUserDocuments(u.id),
              fetchUserApplications(u.id),
            ]);
            setDocuments(Array.isArray(docs) ? docs : []);
            setApplications(Array.isArray(apps) ? apps : []);
          } catch (e) {
            console.warn("Docs/apps fetch error:", e);
          }
        }

        try {
          const [unis, progs, tsts, revs] = await Promise.all([
            fetchUniversities(),
            fetchPrograms(),
            fetchTests(),
            fetchReviews(),
          ]);
          setUniversities(Array.isArray(unis) ? unis : []);
          setPrograms(Array.isArray(progs) ? progs : []);
          setTests(Array.isArray(tsts) ? tsts : []);
          setReviews(Array.isArray(revs) ? revs : []);
        } catch (e) {
          console.warn("Catalog fetch error:", e);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const handleSelectUniversityPrograms = (universityId: string) => {
    setFilterUniForPrograms(universityId);
    setActiveTab("programs");
  };

  const reloadUserDocuments = async () => {
    if (!user) return;
    const docs = await fetchUserDocuments(user.id);
    setDocuments(Array.isArray(docs) ? docs : []);
  };

  const reloadUserApplications = async () => {
    if (!user) return;
    const apps = await fetchUserApplications(user.id);
    setApplications(Array.isArray(apps) ? apps : []);
  };

  const reloadReviews = async () => {
    const revs = await fetchReviews();
    setReviews(Array.isArray(revs) ? revs : []);
  };

  // Check pending docs
  const pendingDocsCount = (documents || []).filter(
    (d) => d.status === "pending" || d.status === "needs_correction"
  ).length;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
          🇵🇱
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">
            Poland Top Universities
          </h2>
          <p className="text-xs text-slate-400">
            {lang === "uz" ? "Portal yuklanmoqda..." : "Loading portal..."}
          </p>
        </div>
      </div>
    );
  }

  // If in Admin Portal Mode
  if (isAdminView) {
    return (
      <AdminPortal
        onBack={() => setIsAdminView(false)}
        lang={lang}
      />
    );
  }

  // Gatekeeping: if not registered or no accepted terms
  const isRegisteredAndAgreed = Boolean(user?.isRegistered);

  if (!isRegisteredAndAgreed) {
    return (
      <div className="app-container w-full min-h-screen bg-slate-950 flex flex-col">
        <main className="flex-1 max-w-lg mx-auto w-full flex items-center justify-center">
          <NotRegisteredScreen 
            lang={lang} 
            userId={user?.id}
            onComplete={async (data) => {
              if (user) {
                setUser({ ...user, ...data, isRegistered: true });
                setActiveTab("roadmap"); // Show roadmap right after onboarding
                try {
                  const freshUser = await fetchCurrentUser();
                  if (freshUser) setUser(freshUser);
                } catch (e) {}
              }
            }} 
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container w-full min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        user={user}
        lang={lang}
        onLanguageChange={setLang}
      />

      {/* Main Tab Content - Full screen width with responsive container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-24 space-y-4 overflow-y-auto">
        {activeTab === "roadmap" && user && (
          <RoadmapTab user={user} universities={universities} lang={lang} />
        )}

        {activeTab === "unis" && (
          <UniversitiesTab
            universities={universities}
            lang={lang}
            onSelectUniversityPrograms={handleSelectUniversityPrograms}
          />
        )}

        {activeTab === "programs" && (
          <ProgramsTab
            programs={programs}
            lang={lang}
            user={user}
            initialUniversityFilter={filterUniForPrograms}
            onApplicationSubmitted={reloadUserApplications}
          />
        )}

        {activeTab === "docs" && (
          <DocumentsTab
            documents={documents}
            lang={lang}
            user={user}
            onRefreshDocs={reloadUserDocuments}
          />
        )}

        {activeTab === "tests" && (
          <TestsTab
            tests={tests}
            lang={lang}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            applications={applications}
            reviews={reviews}
            lang={lang}
            onRefreshReviews={reloadReviews}
          />
        )}
      </main>

      {/* Fixed Bottom Dock Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={lang}
        docsPendingCount={pendingDocsCount}
      />
    </div>
  );
};
