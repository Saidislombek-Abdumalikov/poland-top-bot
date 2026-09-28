import React from "react";
import { TabType, Language } from "../types";
import { triggerHaptic } from "../services/api";
import {
  Building2,
  GraduationCap,
  FileCheck2,
  BookOpenCheck,
  User,
} from "lucide-react";

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lang: Language;
  docsPendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  lang,
  docsPendingCount = 0,
}) => {
  const isUz = lang === "uz";

  const tabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: "unis",
      label: isUz ? "Oliygohlar" : "Universities",
      icon: Building2,
    },
    {
      id: "programs",
      label: isUz ? "Dasturlar" : "Programs",
      icon: GraduationCap,
    },
    {
      id: "docs",
      label: isUz ? "Hujjatlar" : "Documents",
      icon: FileCheck2,
      badge: docsPendingCount > 0 ? docsPendingCount : undefined,
    },
    {
      id: "tests",
      label: isUz ? "Imtihonlar" : "Tests",
      icon: BookOpenCheck,
    },
    {
      id: "profile",
      label: isUz ? "Kabinet" : "Cabinet",
      icon: User,
    },
  ];

  const handleSelect = (id: TabType) => {
    triggerHaptic("light");
    onChangeTab(id);
  };

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl p-1.5 flex items-center justify-between shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className={`relative flex flex-col items-center justify-center pt-2 pb-1.5 rounded-2xl transition-all duration-300 ease-out active:scale-90 flex-1 ${
              isActive
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {/* Active Pill Background */}
            <div
              className={`absolute inset-0 bg-white/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-opacity duration-300 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="relative z-10">
              <Icon
                className={`w-[22px] h-[22px] transition-all duration-300 ${
                  isActive ? "stroke-[2.5] scale-110 -translate-y-0.5" : "stroke-[1.8]"
                }`}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm z-20">
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              className={`text-[10px] mt-1 z-10 transition-all duration-300 tracking-tight ${
                isActive ? "font-bold opacity-100" : "font-medium opacity-80"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
