import React from "react";
import { UserProfile, Language } from "../types";
import { triggerHaptic } from "../services/api";
import { Globe, ShieldCheck } from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  lang,
  onLanguageChange,
  onOpenAdmin,
}) => {
  const toggleLang = () => {
    triggerHaptic("light");
    onLanguageChange(lang === "uz" ? "en" : "uz");
  };

  const displayName = user?.fullName || user?.firstName || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Flag */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
          🇵🇱
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Poland Top
            </span>
            {user?.isAdmin && (
              <span
                onClick={onOpenAdmin}
                className="cursor-pointer inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 active:scale-95 transition-transform"
              >
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                CRM
              </span>
            )}
          </div>
          <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
            Universities Portal
          </h1>
        </div>
      </div>

      {/* User & Language Pill */}
      <div className="flex items-center gap-2">
        {/* Language switch */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
          title="Change Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{lang === "uz" ? "UZ" : "EN"}</span>
        </button>

        {/* User avatar initials */}
        <div
          className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-blue-100"
          title={displayName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};
