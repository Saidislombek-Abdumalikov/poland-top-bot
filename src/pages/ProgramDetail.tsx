import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const programData: Record<string, any> = {
  "cs-uw": {
    name: "Computer Science",
    university: "University of Warsaw",
    uniId: "uw",
    city: "Warsaw",
    level: "Bachelor of Science",
    lang: "English",
    tuition: "8,500 PLN per year",
    duration: "3 years (6 semesters)",
    deadline: "May 31, 2025",
    status: "Open",
    about: "This program provides a strong foundation in computer science theory and practical skills. Students gain expertise in algorithms, data structures, programming languages, software engineering, and emerging areas such as machine learning and distributed systems. The curriculum is taught entirely in English and is designed for international students.",
    requirements: ["High school diploma or equivalent with strong mathematics background", "English proficiency: IELTS 6.5 or TOEFL iBT 87 or equivalent", "Academic transcripts", "Passport copy", "Motivation letter"],
    process: ["Submit online application at rekrutacja.uw.edu.pl", "Upload required documents", "Pay application fee (85 PLN)", "Receive admission decision (within 4–6 weeks)", "Pay tuition deposit", "Obtain student visa (if required)"],
    documents: ["Secondary school certificate (apostilled)", "Official English translation of diploma", "IELTS/TOEFL certificate", "Passport (valid for at least 1 year)", "Passport-sized photo", "Health insurance confirmation"],
  },
  "med-uj": {
    name: "Medicine (MD Program)",
    university: "Jagiellonian University",
    uniId: "uj",
    city: "Kraków",
    level: "Doctor of Medicine (6-year program)",
    lang: "English",
    tuition: "18,000 PLN per year",
    duration: "6 years",
    deadline: "April 30, 2025",
    status: "Open",
    about: "The English-language medical program at Jagiellonian University is one of the most respected in Central Europe. The curriculum follows European standards and graduates receive a degree recognized across the EU. Clinical training takes place at university hospitals in Kraków.",
    requirements: ["High school diploma with biology and chemistry", "MCAT or equivalent entrance exam", "English proficiency certificate", "Academic transcripts", "Medical fitness certificate", "Reference letter"],
    process: ["Online application submission", "Entrance exam (biology, chemistry, physics)", "Document verification", "Admissions interview", "Enrollment and tuition payment"],
    documents: ["Apostilled secondary school diploma", "Transcripts", "English proficiency certificate", "Medical fitness certificate", "Passport copy", "Application photos"],
  },
};

const fallbackProgram = programData["cs-uw"];

const tabs = ["About", "Requirements", "Documents", "Tuition"];

export default function ProgramDetail() {
  const { id } = useParams();
  const program = programData[id || ""] || fallbackProgram;
  const [activeTab, setActiveTab] = useState("About");
  const [saved, setSaved] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#9E9E98] mb-5">
            <Link to="/programs" className="hover:text-[#5C5C57]">Programs</Link>
            <span>›</span>
            <Link to={`/universities/${program.uniId}`} className="hover:text-[#5C5C57]">{program.university}</Link>
            <span>›</span>
            <span className="text-[#141413]">{program.name}</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium ${program.status === "Open" ? "bg-[#EDFAF3] text-[#2E7D52]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>
                  Applications {program.status}
                </span>
              </div>
              <h1 className="text-h1 text-[#141413] mb-2">{program.name}</h1>
              <Link to={`/universities/${program.uniId}`} className="text-[14px] text-[#1C4587] font-medium hover:text-[#163571]">{program.university}</Link>
              <p className="text-[13px] text-[#5C5C57] mt-1">{program.city} · {program.level}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSaved(!saved)}
                className={`px-3.5 py-2 rounded-[6px] text-[13px] font-medium border transition-colors ${saved ? "bg-[#EEF2FB] text-[#1C4587] border-[#1C4587]/20" : "bg-white text-[#5C5C57] border-[#E3E3DE] hover:bg-[#F8F8F7]"}`}
              >
                {saved ? "✓ Saved" : "Save"}
              </button>
              <Link to="/documents" className="px-4 py-2 bg-[#1C4587] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#163571]">
                Start Application
              </Link>
            </div>
          </div>

          {/* Key info row */}
          <div className="flex items-center gap-5 mt-6 flex-wrap">
            {[
              { label: "Language", value: program.lang },
              { label: "Duration", value: program.duration },
              { label: "Tuition", value: program.tuition },
              { label: "Deadline", value: program.deadline },
            ].map((item) => (
              <div key={item.label} className="pr-5 border-r last:border-0 border-[#E3E3DE]">
                <div className="text-[11px] text-[#9E9E98] mb-0.5">{item.label}</div>
                <div className="text-[13px] font-medium text-[#141413]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === tab ? "border-[#1C4587] text-[#1C4587]" : "border-transparent text-[#5C5C57] hover:text-[#141413]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {activeTab === "About" && (
              <div>
                <h2 className="text-h3 text-[#141413] mb-4">About the program</h2>
                <p className="text-body text-[#5C5C57] leading-relaxed">{program.about}</p>
              </div>
            )}

            {activeTab === "Requirements" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-h3 text-[#141413] mb-4">Admission requirements</h2>
                  <ul className="space-y-2.5">
                    {program.requirements.map((req: string) => (
                      <li key={req} className="flex items-start gap-3">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#EDFAF3] flex items-center justify-center shrink-0">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <span className="text-body-sm text-[#5C5C57]">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-h4 text-[#141413] mb-3">Application process</h3>
                  <ol className="space-y-2.5">
                    {program.process.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 w-5 h-5 rounded-full border border-[#1C4587]/30 flex items-center justify-center shrink-0 text-[10px] font-medium text-[#1C4587]">{i + 1}</span>
                        <span className="text-body-sm text-[#5C5C57]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {activeTab === "Documents" && (
              <div>
                <h2 className="text-h3 text-[#141413] mb-4">Required documents</h2>
                <div className="space-y-2">
                  {program.documents.map((doc: string) => (
                    <div key={doc} className="flex items-center justify-between p-3.5 bg-white border border-[#E3E3DE] rounded-[7px]">
                      <span className="text-[13px] text-[#141413]">{doc}</span>
                      <span className="text-[11px] text-[#9E9E98] bg-[#F8F8F7] px-2 py-0.5 rounded-[3px]">Required</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[#EEF2FB] rounded-[8px] border border-[#1C4587]/20">
                  <p className="text-[13px] font-medium text-[#1C4587] mb-1">Upload your documents on PTU</p>
                  <p className="text-[12px] text-[#5C5C57] mb-3">Submit document links through your PTU account and track their review status.</p>
                  <Link to="/documents" className="inline-flex px-3.5 py-1.5 bg-[#1C4587] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#163571]">
                    Go to Documents
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "Tuition" && (
              <div className="space-y-5">
                <h2 className="text-h3 text-[#141413]">Tuition & fees</h2>
                <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[13px] text-[#9E9E98] mb-1">Annual tuition</p>
                      <p className="text-h2 text-[#141413]">{program.tuition}</p>
                    </div>
                    <span className="text-[11px] px-2 py-1 bg-[#EEF2FB] text-[#1C4587] rounded-[4px] font-medium">International student rate</span>
                  </div>
                  <p className="text-[12px] text-[#9E9E98]">Amounts are approximate. Confirm with the university's admissions office.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
              <h3 className="text-[13px] font-semibold text-[#141413] mb-4">Apply to this program</h3>
              <Link
                to="/documents"
                className="block w-full py-2.5 bg-[#1C4587] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#163571] text-center mb-2"
              >
                Start Application
              </Link>
              <button
                onClick={() => setSaved(!saved)}
                className="block w-full py-2.5 border border-[#E3E3DE] text-[#5C5C57] text-[13px] font-medium rounded-[6px] hover:bg-[#F8F8F7]"
              >
                {saved ? "✓ Saved" : "Save for later"}
              </button>
            </div>

            <div className="bg-[#FAF6EF] border border-[#5B4B2E]/10 rounded-[10px] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold text-[#5B4B2E] bg-[#5B4B2E]/10 px-2 py-0.5 rounded-[3px]">PREMIUM</span>
              </div>
              <h3 className="text-[13px] font-semibold text-[#141413] mb-1">Full admission guide</h3>
              <p className="text-[12px] text-[#5C5C57] mb-3">Step-by-step guidance, document checklist, and direct support from our advisors.</p>
              <Link to="/premium" className="text-[12px] font-medium text-[#5B4B2E] hover:text-[#3D3020]">
                Get Premium Access →
              </Link>
            </div>

            <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
              <h3 className="text-[13px] font-semibold text-[#141413] mb-3">Deadline</h3>
              <p className="text-[20px] font-semibold text-[#141413]">{program.deadline}</p>
              <p className="text-[12px] text-[#9E9E98] mt-1">for {new Date().getFullYear() + 1} intake</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
