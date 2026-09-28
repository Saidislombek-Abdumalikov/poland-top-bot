import React from "react";
import { UserProfile, Language } from "../types";
import { triggerHaptic } from "../services/api";
import { Globe } from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  lang,
  onLanguageChange,
}) => {
  const toggleLang = () => {
    triggerHaptic("light");
    onLanguageChange(lang === "uz" ? "en" : "uz");
  };

  const displayName = (user?.fullName || user?.firstName || "Student").trim();
  const words = displayName.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 0
      ? words
          .map((n) => n[0] || "")
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "ST";

  return (
    <div className="sticky top-2 sm:top-4 z-30 px-3 sm:px-6 mx-auto w-full max-w-7xl">
      <header className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-3xl px-4 py-2.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {/* Brand & Flag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-md font-bold text-lg sm:text-xl border border-white/10 transform transition-transform hover:scale-105">
            🇵🇱
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 leading-tight">
              Poland Top
            </div>
            <h1 className="text-[13px] sm:text-[15px] font-black text-white/95 tracking-tight leading-tight">
              Universities
            </h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/90 text-white/85 hover:text-white/95 hover:bg-slate-700/80 active:scale-95 transition-all duration-300 shadow-sm border border-white/10"
            title="Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-white/60" />
            <span>{lang === "uz" ? "UZ" : "EN"}</span>
          </button>

          {/* User Initials Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white/95 font-bold text-xs flex items-center justify-center shadow-md select-none border border-white/20"
            title={displayName}
          >
            {initials}
          </div>
        </div>
      </header>
    </div>
  );
};
