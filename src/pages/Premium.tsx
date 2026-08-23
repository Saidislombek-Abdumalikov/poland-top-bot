import { useState } from "react";
import { Link } from "react-router-dom";

const benefits = [
  { title: "Full program details", description: "Access complete admission requirements, document lists, and application procedures for every program." },
  { title: "Advanced search filters", description: "Filter by tuition range, GPA requirements, application status, and more." },
  { title: "Application tracking", description: "Submit documents through PTU and track your application status in real time." },
  { title: "Admission assistant", description: "AI-powered guidance to help you understand requirements and prepare your application." },
  { title: "Document review", description: "Our team reviews your documents before submission to catch common errors." },
  { title: "Priority support", description: "Get direct answers from our Poland education advisors via Telegram." },
];

export default function Premium() {
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");

  const handleActivate = () => {
    if (!code.trim()) return;
    setCodeStatus("loading");
    setTimeout(() => {
      setCodeStatus(code.trim().toUpperCase() === "PTU2025" ? "valid" : "invalid");
    }, 1000);
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="max-w-[640px]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5B4B2E] bg-[#FAF6EF] border border-[#5B4B2E]/15 px-2.5 py-1 rounded-[4px] mb-5">
              Premium Access
            </span>
            <h1 className="text-h1 text-[#141413] mb-4">Get full access to PTU</h1>
            <p className="text-body-lg text-[#5C5C57]">
              Premium gives you complete program information, advanced tools, and personal guidance throughout your university application process in Poland.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Benefits */}
          <div className="lg:col-span-3">
            <p className="text-label text-[#9E9E98] mb-6">What you get</p>
            <div className="space-y-6">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#EDFAF3] flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#141413] mb-0.5">{b.title}</p>
                    <p className="text-body-sm text-[#5C5C57]">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-[#F8F8F7] rounded-[10px] border border-[#E3E3DE]">
              <p className="text-[13px] text-[#5C5C57]">
                PTU Premium is available through your education consultant or institutional partner. If you received an access code, activate it below.
              </p>
            </div>
          </div>

          {/* Activation panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Access code */}
            <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-6">
              <h2 className="text-h4 text-[#141413] mb-1">Activate with access code</h2>
              <p className="text-body-sm text-[#5C5C57] mb-5">Enter the access code provided by your advisor or institution.</p>

              {codeStatus === "valid" ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-[#EDFAF3] flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4 4 8-8" stroke="#2E7D52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[15px] font-semibold text-[#141413] mb-1">Premium activated!</p>
                  <p className="text-body-sm text-[#5C5C57] mb-4">Your account now has full premium access.</p>
                  <Link to="/dashboard" className="block w-full py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] text-center">
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter access code (e.g. PTU2025)"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setCodeStatus("idle"); }}
                    className={`w-full h-10 px-3.5 bg-[#F8F8F7] border rounded-[6px] text-[14px] text-[#141413] placeholder-[#9E9E98] focus:outline-none mb-2 font-mono tracking-wider ${
                      codeStatus === "invalid" ? "border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10" : "border-[#E3E3DE] focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
                    }`}
                  />
                  {codeStatus === "invalid" && (
                    <p className="text-[12px] text-[#B91C1C] mb-2">Invalid access code. Please check and try again.</p>
                  )}
                  <button
                    onClick={handleActivate}
                    disabled={!code.trim() || codeStatus === "loading"}
                    className="w-full h-10 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {codeStatus === "loading" ? "Checking..." : "Activate"}
                  </button>
                </>
              )}
            </div>

            {/* Contact */}
            <div className="bg-[#F8F8F7] border border-[#E3E3DE] rounded-[12px] p-5">
              <h3 className="text-[13px] font-semibold text-[#141413] mb-1">Don't have a code?</h3>
              <p className="text-[12px] text-[#5C5C57] mb-3">Contact us through Telegram to get premium access for your studies.</p>
              <a href="#" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1C4587] hover:text-[#163571]">
                Contact via Telegram →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
