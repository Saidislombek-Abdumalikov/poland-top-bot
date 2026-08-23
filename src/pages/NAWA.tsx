import { useState } from "react";

const steps = ["Personal info", "University info", "Documents", "Review", "Payment"];

export default function NAWA() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "", country: "", passport: "",
    university: "", program: "", startDate: "",
    diploma: "", translation: "", apostille: "",
    agreeTerms: false,
  });

  if (submitted) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#EDFAF3] flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#2E7D52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="text-h2 text-[#141413] mb-3">NAWA application submitted</h2>
        <p className="text-body text-[#5C5C57] mb-8">Your application has been submitted. Processing typically takes 3–6 weeks. You will receive updates by email.</p>
        <button onClick={() => { setSubmitted(false); setStarted(false); setStep(0); }} className="px-5 py-2.5 border border-[#E3E3DE] text-[#5C5C57] text-[14px] font-medium rounded-[6px] hover:bg-[#F8F8F7]">
          Back to NAWA
        </button>
      </div>
    );
  }

  if (started) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-h3 text-[#141413]">NAWA Application</h1>
          <button onClick={() => setStarted(false)} className="text-[13px] text-[#5C5C57] hover:text-[#141413]">← Cancel</button>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                  i < step ? "bg-[#2E7D52] text-white" : i === step ? "bg-[#1C4587] text-white" : "bg-[#F0F0EE] text-[#9E9E98]"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[12px] font-medium whitespace-nowrap ${i === step ? "text-[#141413]" : "text-[#9E9E98]"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="mx-2 w-6 h-px bg-[#E3E3DE] shrink-0" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-h4 text-[#141413] mb-4">Personal information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">First name</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder="Given name" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Last name</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder="Family name" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Date of birth</label>
                <input type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Country of citizenship</label>
                <input type="text" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder="e.g. Uzbekistan" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Passport number</label>
                <input type="text" value={form.passport} onChange={(e) => setForm({...form, passport: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587] font-mono" placeholder="AA1234567" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-h4 text-[#141413] mb-4">University information</h2>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">University name</label>
                <input type="text" value={form.university} onChange={(e) => setForm({...form, university: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder="University of Warsaw" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Program</label>
                <input type="text" value={form.program} onChange={(e) => setForm({...form, program: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder="Computer Science, BSc" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Study start date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-h4 text-[#141413] mb-2">Document links</h2>
              <p className="text-body-sm text-[#5C5C57] mb-4">Provide Google Drive, Dropbox, or OneDrive links to your documents.</p>
              {[
                { key: "diploma", label: "Educational diploma / certificate", placeholder: "https://drive.google.com/..." },
                { key: "translation", label: "Polish translation of diploma", placeholder: "https://drive.google.com/..." },
                { key: "apostille", label: "Apostille or notarization", placeholder: "https://drive.google.com/..." },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">{field.label}</label>
                  <input type="url" value={form[field.key as keyof typeof form] as string} onChange={(e) => setForm({...form, [field.key]: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" placeholder={field.placeholder} />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-h4 text-[#141413] mb-4">Review your application</h2>
              <div className="space-y-3">
                {[
                  ["Full name", `${form.firstName} ${form.lastName}`],
                  ["Date of birth", form.dob || "—"],
                  ["Country", form.country || "—"],
                  ["Passport", form.passport || "—"],
                  ["University", form.university || "—"],
                  ["Program", form.program || "—"],
                  ["Start date", form.startDate || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 py-2 border-b border-[#E3E3DE] last:border-0">
                    <span className="text-[13px] text-[#9E9E98]">{k}</span>
                    <span className="text-[13px] font-medium text-[#141413] text-right">{v || "—"}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-2 mt-4">
                <input type="checkbox" checked={form.agreeTerms} onChange={(e) => setForm({...form, agreeTerms: e.target.checked})} className="mt-0.5" />
                <span className="text-[12px] text-[#5C5C57]">I confirm that all information provided is accurate and complete.</span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-h4 text-[#141413] mb-2">Application fee</h2>
              <p className="text-body-sm text-[#5C5C57]">The NAWA document evaluation fee is 200 PLN. This covers processing and official review.</p>
              <div className="bg-[#F8F8F7] rounded-[8px] p-4 flex justify-between items-center">
                <span className="text-[14px] text-[#141413]">NAWA evaluation fee</span>
                <span className="text-[16px] font-semibold text-[#141413]">200 PLN</span>
              </div>
              <p className="text-[12px] text-[#9E9E98]">Payment is processed securely. You will receive a confirmation email with payment receipt.</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E3E3DE]">
            <button
              onClick={() => step === 0 ? setStarted(false) : setStep(step - 1)}
              className="px-4 py-2 border border-[#E3E3DE] rounded-[6px] text-[13px] font-medium text-[#5C5C57] hover:bg-[#F8F8F7]"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => step === steps.length - 1 ? setSubmitted(true) : setStep(step + 1)}
              disabled={step === 3 && !form.agreeTerms}
              className="px-5 py-2 bg-[#1C4587] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#163571] disabled:opacity-40"
            >
              {step === steps.length - 1 ? "Submit application" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-8">
          <div>
            <p className="text-label text-[#9E9E98] mb-2">Recognition</p>
            <h1 className="text-h1 text-[#141413] mb-4">NAWA Document Evaluation</h1>
            <p className="text-body-lg text-[#5C5C57]">
              NAWA (Polish National Agency for Academic Exchange) evaluates foreign educational documents for use in Poland. If your diploma was issued outside the EU, you may need NAWA recognition.
            </p>
          </div>

          {[
            { q: "What is NAWA?", a: "NAWA (Narodowa Agencja Wymiany Akademickiej) is the Polish national agency responsible for evaluating and recognizing foreign educational qualifications. Their recognition is accepted by all Polish universities and institutions." },
            { q: "Do I need NAWA recognition?", a: "You likely need NAWA if you studied outside the EU and your country does not have a bilateral agreement with Poland. Most students from Central Asia, the Middle East, Africa, and Asia require NAWA." },
            { q: "How long does it take?", a: "Standard processing takes 3–6 weeks from the date all documents are received. Expedited processing (2–3 weeks) is available for an additional fee." },
            { q: "What does it cost?", a: "The standard NAWA evaluation fee is 200 PLN. Additional fees may apply for certified translations or apostille services." },
          ].map((item) => (
            <div key={item.q}>
              <h3 className="text-h4 text-[#141413] mb-2">{item.q}</h3>
              <p className="text-body-sm text-[#5C5C57] leading-relaxed">{item.a}</p>
            </div>
          ))}

          <div>
            <h3 className="text-h4 text-[#141413] mb-3">How the process works</h3>
            <ol className="space-y-3">
              {[
                "Prepare your original diploma and transcripts",
                "Obtain apostille (or notarization for countries outside the Hague Convention)",
                "Get a certified Polish translation",
                "Submit application to NAWA with all documents",
                "Pay the evaluation fee",
                "Receive the NAWA decision letter",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#EEF2FB] flex items-center justify-center shrink-0 text-[10px] font-semibold text-[#1C4587]">{i + 1}</span>
                  <span className="text-body-sm text-[#5C5C57]">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-6 sticky top-20">
            <h2 className="text-h4 text-[#141413] mb-1">Start your NAWA application</h2>
            <p className="text-body-sm text-[#5C5C57] mb-5">Fill in your details and submit documents through our guided application form.</p>
            <button
              onClick={() => setStarted(true)}
              className="w-full py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] mb-3"
            >
              Start application
            </button>
            <p className="text-[12px] text-[#9E9E98] text-center">Takes about 10 minutes to complete</p>
          </div>

          <div className="bg-[#F8F8F7] border border-[#E3E3DE] rounded-[12px] p-5">
            <h3 className="text-[13px] font-semibold text-[#141413] mb-2">Need help?</h3>
            <p className="text-[12px] text-[#5C5C57] mb-3">Premium members get direct support from our advisors for NAWA preparation.</p>
            <a href="/premium" className="text-[12px] font-medium text-[#1C4587] hover:text-[#163571]">Learn about Premium →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
