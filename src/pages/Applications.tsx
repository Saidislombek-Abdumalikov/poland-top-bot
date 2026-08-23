import { Link } from "react-router-dom";

const trackingSteps = [
  { label: "Application submitted", done: true, date: "Jan 10, 2025" },
  { label: "Documents under review", done: true, date: "Jan 15, 2025" },
  { label: "Application processing", done: false, date: "Expected: Feb 1, 2025" },
  { label: "University response", done: false, date: "Expected: Mar 2025" },
  { label: "Completed", done: false, date: "" },
];

export default function Applications() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Applications</p>
        <h1 className="text-h1 text-[#141413]">My applications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] px-2 py-0.5 bg-[#FFFBEB] text-[#B45309] rounded-[3px] font-medium">In progress</span>
                </div>
                <h2 className="text-h4 text-[#141413]">Computer Science, BSc</h2>
                <p className="text-[13px] text-[#5C5C57]">University of Warsaw · Warsaw</p>
                <p className="text-[12px] text-[#9E9E98] mt-1">Applied: January 10, 2025 · Deadline: May 31, 2025</p>
              </div>
              <Link to="/documents" className="shrink-0 px-3.5 py-1.5 border border-[#E3E3DE] text-[13px] font-medium text-[#5C5C57] rounded-[6px] hover:bg-[#F8F8F7]">
                Documents
              </Link>
            </div>

            {/* Horizontal timeline desktop */}
            <div className="hidden md:block">
              <div className="relative flex items-start justify-between">
                {/* Connecting line */}
                <div className="absolute top-3 left-0 right-0 h-px bg-[#E3E3DE]" />
                {trackingSteps.map((step, i) => (
                  <div key={step.label} className="relative flex flex-col items-center text-center" style={{ width: `${100 / trackingSteps.length}%` }}>
                    <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center mb-2 ${
                      step.done ? "bg-[#2E7D52]" : i === trackingSteps.findIndex((s) => !s.done) ? "bg-[#1C4587]" : "bg-white border-2 border-[#E3E3DE]"
                    }`}>
                      {step.done ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : i === trackingSteps.findIndex((s) => !s.done) ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : null}
                    </div>
                    <p className={`text-[11px] font-medium leading-tight ${
                      step.done ? "text-[#2E7D52]" : i === trackingSteps.findIndex((s) => !s.done) ? "text-[#1C4587]" : "text-[#9E9E98]"
                    }`}>{step.label}</p>
                    {step.date && <p className="text-[10px] text-[#9E9E98] mt-0.5">{step.date}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical timeline mobile */}
            <div className="md:hidden space-y-0 mt-2">
              {trackingSteps.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? "bg-[#2E7D52]" : i === trackingSteps.findIndex((s) => !s.done) ? "bg-[#1C4587]" : "bg-white border border-[#E3E3DE]"
                    }`}>
                      {step.done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {i < trackingSteps.length - 1 && <div className={`w-px flex-1 min-h-[24px] ${step.done ? "bg-[#2E7D52]/40" : "bg-[#E3E3DE]"}`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-[13px] font-medium ${step.done ? "text-[#141413]" : i === trackingSteps.findIndex((s) => !s.done) ? "text-[#1C4587]" : "text-[#9E9E98]"}`}>{step.label}</p>
                    {step.date && <p className="text-[11px] text-[#9E9E98]">{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents status */}
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
            <h3 className="text-h4 text-[#141413] mb-4">Document status</h3>
            <div className="space-y-2">
              {[
                { name: "Passport copy", status: "approved" },
                { name: "Academic transcripts", status: "approved" },
                { name: "Diploma", status: "reviewing" },
                { name: "English certificate", status: "needs_correction" },
                { name: "Passport photo", status: "missing" },
              ].map((d) => {
                const configs: Record<string, { label: string; color: string; bg: string }> = {
                  approved: { label: "Approved", color: "#2E7D52", bg: "#EDFAF3" },
                  reviewing: { label: "Under review", color: "#B45309", bg: "#FFFBEB" },
                  needs_correction: { label: "Needs correction", color: "#B91C1C", bg: "#FEF2F2" },
                  missing: { label: "Missing", color: "#9E9E98", bg: "#F0F0EE" },
                };
                const c = configs[d.status];
                return (
                  <div key={d.name} className="flex items-center justify-between py-1.5">
                    <span className="text-[13px] text-[#141413]">{d.name}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-[3px]" style={{ color: c.color, background: c.bg }}>{c.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E3E3DE]">
              <Link to="/documents" className="text-[13px] text-[#1C4587] font-medium hover:text-[#163571]">Manage documents →</Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
            <h3 className="text-h4 text-[#141413] mb-3">Application details</h3>
            <div className="space-y-2.5">
              {[
                ["Application ID", "#PTU-2025-0841"],
                ["Submitted", "January 10, 2025"],
                ["Deadline", "May 31, 2025"],
                ["Study mode", "Full-time"],
                ["Intake", "October 2025"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-[12px] text-[#9E9E98]">{k}</span>
                  <span className="text-[12px] font-medium text-[#141413] text-right font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FFFBEB] border border-[#B45309]/20 rounded-[10px] p-4">
            <p className="text-[13px] font-semibold text-[#B45309] mb-1">Action required</p>
            <p className="text-[12px] text-[#5C5C57] mb-2">Your English certificate needs to be re-submitted.</p>
            <Link to="/documents" className="text-[12px] font-medium text-[#B45309]">Fix document →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
