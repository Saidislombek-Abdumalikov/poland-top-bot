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
    <nav className="fixed bottom-0 sm:bottom-4 left-0 right-0 max-w-lg mx-auto z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 sm:rounded-2xl px-3 py-2 flex items-center justify-around shadow-sm sm:shadow-md">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className={`flex-1 relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              isActive
                ? "text-slate-900 font-bold"
                : "text-slate-400 hover:text-slate-700 font-medium"
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 bg-slate-100 rounded-xl -z-10" />
            )}

            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? "scale-105 stroke-[2.3]" : "stroke-[1.8]"
                }`}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[11px] mt-1 tracking-tight truncate max-w-[72px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
