import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E3E3DE] mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#1C4587] rounded-[4px] flex items-center justify-center">
                <span className="text-white font-bold text-xs">PL</span>
              </div>
              <span className="font-semibold text-[#141413] text-[15px] tracking-tight">PTU</span>
            </Link>
            <p className="text-[13px] text-[#5C5C57] leading-relaxed max-w-[200px]">
              Poland Top Universities — helping international students find their degree in Poland.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a href="#" className="text-[#9E9E98] hover:text-[#141413]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-label text-[#9E9E98] mb-3">Platform</p>
            <ul className="space-y-2">
              {[
                ["Universities", "/universities"],
                ["Programs", "/programs"],
                ["AI & Tools", "/tools"],
                ["Exams", "/exams"],
                ["NAWA", "/nawa"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-[13px] text-[#5C5C57] hover:text-[#141413]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-label text-[#9E9E98] mb-3">Resources</p>
            <ul className="space-y-2">
              {[
                ["Student Reviews", "/reviews"],
                ["Documents", "/documents"],
                ["Premium", "/premium"],
                ["Dashboard", "/dashboard"],
                ["Applications", "/applications"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-[13px] text-[#5C5C57] hover:text-[#141413]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-label text-[#9E9E98] mb-3">Contact</p>
            <ul className="space-y-2">
              <li><a href="mailto:info@ptu.edu" className="text-[13px] text-[#5C5C57] hover:text-[#141413]">info@ptu.edu</a></li>
              <li><a href="#" className="text-[13px] text-[#5C5C57] hover:text-[#141413]">Telegram Channel</a></li>
              <li><a href="#" className="text-[13px] text-[#5C5C57] hover:text-[#141413]">Privacy Policy</a></li>
              <li><a href="#" className="text-[13px] text-[#5C5C57] hover:text-[#141413]">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E3E3DE] pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-[12px] text-[#9E9E98]">© 2024 PTU — Poland Top Universities. All rights reserved.</p>
          <p className="text-[12px] text-[#9E9E98]">Information is for reference only. Verify details with universities directly.</p>
        </div>
      </div>
    </footer>
  );
}
