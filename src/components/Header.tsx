import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Universities", href: "/universities" },
  { label: "Programs", href: "/programs" },
  { label: "Reviews", href: "/reviews" },
  { label: "AI & Tools", href: "/tools" },
  { label: "Exams", href: "/exams" },
  { label: "NAWA", href: "/nawa" },
  { label: "Documents", href: "/documents" },
];

const mobileNavItems = [
  ...navItems,
  { label: "Dashboard", href: "/dashboard" },
  { label: "Saved Programs", href: "/saved" },
];

// Minimal language translations for demonstration
const langLabels: Record<string, Record<string, string>> = {
  en: {
    "Universities": "Universities",
    "Programs": "Programs",
    "Reviews": "Reviews",
    "AI & Tools": "AI & Tools",
    "Exams": "Exams",
    "NAWA": "NAWA",
    "Documents": "Documents",
    "Sign in": "Sign in",
    "Premium": "Premium",
    "Dashboard": "Dashboard",
    "Saved Programs": "Saved Programs",
  },
  uz: {
    "Universities": "Universitetlar",
    "Programs": "Dasturlar",
    "Reviews": "Sharhlar",
    "AI & Tools": "AI va Vositalar",
    "Exams": "Imtihonlar",
    "NAWA": "NAWA",
    "Documents": "Hujjatlar",
    "Sign in": "Kirish",
    "Premium": "Premium",
    "Dashboard": "Boshqaruv paneli",
    "Saved Programs": "Saqlangan dasturlar",
  },
};

export default function Header({ lang = "en", onLangChange }: { lang?: string; onLangChange?: (l: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const t = (key: string) => langLabels[lang]?.[key] ?? key;
  const isActive = (href: string) => location.pathname === href || (href !== "/" && location.pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="w-7 h-7 bg-[#1C4587] rounded-[4px] flex items-center justify-center">
              <span className="text-white font-bold text-[11px] tracking-tight">PTU</span>
            </div>
            <span className="font-semibold text-[#141413] text-[15px] tracking-tight hidden sm:block">Poland Top Universities</span>
            <span className="font-semibold text-[#141413] text-[15px] tracking-tight sm:hidden">PTU</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-1.5 rounded-[5px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive(item.href)
                    ? "text-[#1C4587] bg-[#EEF2FB]"
                    : "text-[#5C5C57] hover:text-[#141413] hover:bg-[#F0F0EE]"
                }`}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
            {/* Lang toggle */}
            <div className="flex items-center border border-[#E3E3DE] rounded-[5px] overflow-hidden text-[12px] font-medium">
              <button
                onClick={() => onLangChange?.("en")}
                className={`px-2.5 py-1 transition-colors ${lang === "en" ? "bg-[#1C4587] text-white" : "text-[#5C5C57] hover:bg-[#F0F0EE]"}`}
              >
                EN
              </button>
              <button
                onClick={() => onLangChange?.("uz")}
                className={`px-2.5 py-1 transition-colors ${lang === "uz" ? "bg-[#1C4587] text-white" : "text-[#5C5C57] hover:bg-[#F0F0EE]"}`}
              >
                UZ
              </button>
            </div>

            <Link to="/login" className="px-3.5 py-1.5 text-[13px] font-medium text-[#5C5C57] hover:text-[#141413] transition-colors">
              {t("Sign in")}
            </Link>

            {/* User menu (simulated logged-in state) */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C4587] text-white text-[13px] font-medium rounded-[5px] hover:bg-[#163571] transition-colors"
              >
                {t("Premium")}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#E3E3DE] rounded-[8px] shadow-sm py-1 z-50">
                  {[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Applications", href: "/applications" },
                    { label: "Saved Programs", href: "/saved" },
                    { label: "Profile", href: "/profile" },
                  ].map((item) => (
                    <Link key={item.href} to={item.href} onClick={() => setUserMenuOpen(false)} className="block px-3.5 py-2 text-[13px] text-[#5C5C57] hover:text-[#141413] hover:bg-[#F8F8F7]">
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-[#E3E3DE] mt-1 pt-1">
                    <button className="block w-full text-left px-3.5 py-2 text-[13px] text-[#B91C1C] hover:bg-[#FEF2F2]">Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile right */}
          <div className="lg:hidden ml-auto flex items-center gap-2">
            {/* Lang toggle mobile */}
            <div className="flex items-center border border-[#E3E3DE] rounded-[4px] overflow-hidden text-[11px] font-medium">
              <button onClick={() => onLangChange?.("en")} className={`px-2 py-1 ${lang === "en" ? "bg-[#1C4587] text-white" : "text-[#5C5C57]"}`}>EN</button>
              <button onClick={() => onLangChange?.("uz")} className={`px-2 py-1 ${lang === "uz" ? "bg-[#1C4587] text-white" : "text-[#5C5C57]"}`}>UZ</button>
            </div>
            <button
              className="p-2 text-[#5C5C57] hover:text-[#141413]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Click outside close for user menu */}
        {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-white">
          <div className="px-6 py-4 space-y-1 overflow-y-auto max-h-full pb-20">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-[6px] text-[15px] font-medium transition-colors ${
                  isActive(item.href) ? "text-[#1C4587] bg-[#EEF2FB]" : "text-[#141413] hover:bg-[#F8F8F7]"
                }`}
              >
                {t(item.label)}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-[#E3E3DE] space-y-2">
              <Link to="/premium" onClick={() => setMenuOpen(false)} className="block py-2.5 bg-[#1C4587] text-white text-[15px] font-medium rounded-[6px] text-center hover:bg-[#163571]">
                {t("Premium")}
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 text-[15px] font-medium text-[#5C5C57] text-center hover:text-[#141413]">
                {t("Sign in")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
