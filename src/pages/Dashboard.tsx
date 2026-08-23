import { Link } from "react-router-dom";

const trackingSteps = [
  { label: "Application submitted", done: true, date: "Jan 10, 2025" },
  { label: "Documents under review", done: true, date: "Jan 15, 2025" },
  { label: "Application processing", done: false, date: "Expected: Feb 1" },
  { label: "University response", done: false, date: "Expected: Mar 2025" },
  { label: "Completed", done: false, date: "" },
];

const recentActivity = [
  { text: "Passport document approved", time: "2 hours ago", type: "success" },
  { text: "English certificate needs correction", time: "1 day ago", type: "warning" },
  { text: "Diploma submitted for review", time: "3 days ago", type: "info" },
];

export default function Dashboard() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-h2 text-[#141413]">Good morning, Amir</h1>
        <p className="text-body text-[#5C5C57] mt-1">Here's what's happening with your applications.</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Active applications", value: "1", href: "/applications", color: "text-[#1C4587]" },
          { label: "Documents", value: "3/8 done", href: "/documents", color: "text-[#2E7D52]" },
          { label: "Saved programs", value: "5", href: "/saved", color: "text-[#141413]" },
          { label: "Premium", value: "Active", href: "/premium", color: "text-[#5B4B2E]" },
        ].map((card) => (
          <Link key={card.label} to={card.href} className="bg-white border border-[#E3E3DE] rounded-[10px] p-4 hover:border-[#1C4587]/30 hover:shadow-sm transition-all group">
            <div className={`text-[22px] font-semibold mb-0.5 ${card.color}`}>{card.value}</div>
            <div className="text-[12px] text-[#9E9E98]">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application tracking */}
        <div className="lg:col-span-2 bg-white border border-[#E3E3DE] rounded-[10px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h4 text-[#141413]">Application status</h2>
            <Link to="/applications" className="text-[12px] text-[#1C4587] hover:text-[#163571]">View details →</Link>
          </div>

          <div className="text-[13px] font-medium text-[#141413] mb-1">Computer Science, BSc</div>
          <div className="text-[12px] text-[#9E9E98] mb-6">University of Warsaw · Applied Jan 10, 2025</div>

          {/* Timeline */}
          <div className="space-y-0">
            {trackingSteps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    step.done ? "bg-[#2E7D52]" : i === trackingSteps.findIndex((s) => !s.done) ? "bg-[#1C4587]" : "bg-[#F0F0EE] border border-[#E3E3DE]"
                  }`}>
                    {step.done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : i === trackingSteps.findIndex((s) => !s.done) ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  {i < trackingSteps.length - 1 && (
                    <div className={`w-px flex-1 min-h-[28px] ${step.done ? "bg-[#2E7D52]/40" : "bg-[#E3E3DE]"}`} />
                  )}
                </div>
                <div className="pb-5">
                  <p className={`text-[13px] font-medium ${step.done ? "text-[#141413]" : i === trackingSteps.findIndex((s) => !s.done) ? "text-[#1C4587]" : "text-[#9E9E98]"}`}>
                    {step.label}
                  </p>
                  {step.date && <p className="text-[11px] text-[#9E9E98] mt-0.5">{step.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
            <h2 className="text-h4 text-[#141413] mb-4">Recent activity</h2>
            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.text} className="flex items-start gap-2.5">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.type === "success" ? "bg-[#2E7D52]" : a.type === "warning" ? "bg-[#B45309]" : "bg-[#1C4587]"}`} />
                  <div>
                    <p className="text-[13px] text-[#141413]">{a.text}</p>
                    <p className="text-[11px] text-[#9E9E98]">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
            <h2 className="text-h4 text-[#141413] mb-3">Quick actions</h2>
            <div className="space-y-1.5">
              {[
                { label: "Submit missing documents", href: "/documents" },
                { label: "Explore more programs", href: "/programs" },
                { label: "View saved programs", href: "/saved" },
                { label: "Ask AI assistant", href: "/tools" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="block px-3 py-2 text-[13px] text-[#5C5C57] hover:text-[#141413] hover:bg-[#F8F8F7] rounded-[5px] transition-colors"
                >
                  {action.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* Pending action */}
          <div className="bg-[#FFFBEB] border border-[#B45309]/20 rounded-[10px] p-4">
            <p className="text-[13px] font-semibold text-[#B45309] mb-1">Action needed</p>
            <p className="text-[12px] text-[#5C5C57] mb-2">Your English certificate needs to be re-submitted.</p>
            <Link to="/documents" className="text-[12px] font-medium text-[#B45309] hover:text-[#92400E]">Go to Documents →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
