import React from "react";
import { Language } from "../types";
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface NotRegisteredScreenProps {
  lang: Language;
}

export const NotRegisteredScreen: React.FC<NotRegisteredScreenProps> = ({ lang }) => {
  const isUz = lang === "uz";

  const handleOpenBot = () => {
    const botUrl = "https://t.me/poland_top_universitiesbot";
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(botUrl);
    } else {
      window.location.href = botUrl;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xl ring-8 ring-rose-50 animate-bounce">
        <Lock className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-black text-slate-900 leading-tight">
          {isUz ? "Ro'yxatdan O'tish Talab Qilinadi" : "Registration Required"}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {isUz
            ? "Poland Top Universities talabalar portaliga kirish faqat ro'yxatdan o'tgan va Ommaviy Ofertani qabul qilgan foydalanuvchilar uchun ochiq."
            : "Access to the Poland Top Universities student portal is restricted to registered students who have verified their contact and accepted terms."}
        </p>
      </div>

      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200/90 text-left space-y-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          {isUz ? "Kirish uchun 3 ta qadam:" : "3 Steps to unlock access:"}
        </span>
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
            1
          </span>
          <span>{isUz ? "Botda ismingizni kiriting" : "Provide your full name in bot"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
            2
          </span>
          <span>{isUz ? "Telefon raqamingizni tasdiqlang" : "Verify phone number"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
            3
          </span>
          <span>{isUz ? "Ofertani '✅ Roziman' deb tasdiqlang" : "Accept Terms & Oferta"}</span>
        </div>
      </div>

      <button
        onClick={handleOpenBot}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span>{isUz ? "Telegram Botda Ro'yxatdan O'tish" : "Register via Telegram Bot"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
