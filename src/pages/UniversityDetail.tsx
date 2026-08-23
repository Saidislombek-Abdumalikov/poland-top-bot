import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const universityData: Record<string, any> = {
  uw: {
    name: "University of Warsaw",
    abbr: "UW",
    city: "Warsaw",
    founded: 1816,
    type: "Public research university",
    website: "www.uw.edu.pl",
    programs: 214,
    students: 42000,
    internationalStudents: 3800,
    ranking: "Top 3 in Poland",
    logo: "UW",
    description: "The University of Warsaw is the largest university in Poland and one of the most prestigious research universities in Central Europe. Founded in 1816, it has a tradition of academic excellence spanning over two centuries.",
    faculties: ["Faculty of Law and Administration", "Faculty of Mathematics, Informatics and Mechanics", "Faculty of Physics", "Faculty of History", "Faculty of Economics", "Faculty of Linguistics", "Faculty of Psychology", "Faculty of Sociology"],
    admissionInfo: {
      requirements: ["Secondary school diploma (matura or equivalent)", "Language proficiency certificate (English B2 or IELTS 6.0+)", "Transcript of academic records", "Copy of passport", "Motivation letter (for some programs)"],
      deadline: "May 31, 2025 (for October 2025 intake)",
      process: "Online application through the university portal. Selection based on grade point average and entrance examination for some programs.",
    },
    tuition: {
      eu: "Free (EU citizens enrolled in Polish-language programs)",
      nonEu: "2,000–5,000 PLN per year (varies by program)",
      english: "8,000–20,000 PLN per year (English-taught programs)",
    },
    featured: [
      { name: "Computer Science (BSc)", level: "Bachelor", lang: "English", city: "Warsaw" },
      { name: "International Relations (MA)", level: "Master", lang: "English", city: "Warsaw" },
      { name: "Economics (BSc)", level: "Bachelor", lang: "Polish/English", city: "Warsaw" },
      { name: "Law (LLM)", level: "Master", lang: "Polish", city: "Warsaw" },
    ],
  },
  uj: {
    name: "Jagiellonian University",
    abbr: "JU",
    city: "Kraków",
    founded: 1364,
    type: "Public research university",
    website: "www.uj.edu.pl",
    programs: 196,
    students: 38000,
    internationalStudents: 4200,
    ranking: "Top 2 in Poland",
    logo: "JU",
    description: "Jagiellonian University is the oldest and one of the most prestigious universities in Poland, established in 1364 by King Casimir the Great. It is a comprehensive research university with a rich tradition of academic excellence.",
    faculties: ["Faculty of Law and Administration", "Faculty of Medicine", "Faculty of Philosophy", "Faculty of History", "Faculty of Physics, Astronomy and Applied Computer Science", "Faculty of Biochemistry", "Faculty of Management and Social Communication"],
    admissionInfo: {
      requirements: ["Secondary school diploma", "English proficiency (B2 minimum)", "Passport copy", "Academic transcripts", "Portfolio (for arts programs)"],
      deadline: "June 15, 2025",
      process: "Online application. Competition-based selection for popular programs.",
    },
    tuition: {
      eu: "Free (Polish-taught programs for EU citizens)",
      nonEu: "1,500–4,000 PLN per year",
      english: "7,000–18,000 PLN per year",
    },
    featured: [
      { name: "Medicine (MD)", level: "Master", lang: "English", city: "Kraków" },
      { name: "European Studies (BA)", level: "Bachelor", lang: "English", city: "Kraków" },
      { name: "Psychology (MSc)", level: "Master", lang: "Polish/English", city: "Kraków" },
    ],
  },
};

const defaultData = universityData.uw;

const tabs = ["Overview", "Programs", "Admission", "Tuition", "Reviews"];

export default function UniversityDetail() {
  const { id } = useParams();
  const uni = universityData[id || ""] || defaultData;
  const [activeTab, setActiveTab] = useState("Overview");
  const [saved, setSaved] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-[8px] bg-[#EEF2FB] flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-[#1C4587]">{uni.logo}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-h1 text-[#141413] mb-1">{uni.name}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[13px] text-[#5C5C57]">{uni.city}</span>
                    <span className="text-[#E3E3DE]">·</span>
                    <span className="text-[13px] text-[#5C5C57]">{uni.type}</span>
                    <span className="text-[#E3E3DE]">·</span>
                    <span className="text-[13px] text-[#5C5C57]">Founded {uni.founded}</span>
                    <span className="text-[#E3E3DE]">·</span>
                    <a href="#" className="text-[13px] text-[#1C4587] hover:text-[#163571]">{uni.website}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`px-3.5 py-2 rounded-[6px] text-[13px] font-medium border transition-colors ${
                      saved ? "bg-[#EEF2FB] text-[#1C4587] border-[#1C4587]/20" : "bg-white text-[#5C5C57] border-[#E3E3DE] hover:bg-[#F8F8F7]"
                    }`}
                  >
                    {saved ? "✓ Saved" : "Save"}
                  </button>
                  <Link to="/premium" className="px-3.5 py-2 bg-[#1C4587] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#163571]">
                    Apply Now
                  </Link>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                {[
                  { value: uni.programs, label: "Programs" },
                  { value: `${(uni.students / 1000).toFixed(0)}k`, label: "Students" },
                  { value: uni.internationalStudents.toLocaleString(), label: "International" },
                  { value: uni.ranking, label: "Ranking" },
                ].map((s) => (
                  <div key={s.label} className="pr-5 border-r last:border-0 border-[#E3E3DE]">
                    <div className="text-[15px] font-semibold text-[#141413]">{s.value}</div>
                    <div className="text-[11px] text-[#9E9E98]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "border-[#1C4587] text-[#1C4587]"
                    : "border-transparent text-[#5C5C57] hover:text-[#141413]"
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
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-h3 text-[#141413] mb-3">About</h2>
                <p className="text-body text-[#5C5C57] leading-relaxed">{uni.description}</p>
              </div>
              <div>
                <h2 className="text-h3 text-[#141413] mb-3">Faculties</h2>
                <ul className="space-y-2">
                  {uni.faculties.map((f: string) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1C4587] shrink-0"></span>
                      <span className="text-body-sm text-[#5C5C57]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
                <h3 className="text-[13px] font-semibold text-[#141413] mb-3">Quick info</h3>
                <div className="space-y-3">
                  {[
                    ["City", uni.city],
                    ["Type", uni.type],
                    ["Founded", uni.founded],
                    ["Ranking", uni.ranking],
                    ["Website", uni.website],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-2">
                      <span className="text-[12px] text-[#9E9E98]">{k}</span>
                      <span className="text-[12px] font-medium text-[#141413] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/premium" className="block bg-[#1C4587] text-white text-center py-2.5 rounded-[8px] text-[13px] font-medium hover:bg-[#163571]">
                View full admission guide →
              </Link>
            </div>
          </div>
        )}

        {activeTab === "Programs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h3 text-[#141413]">Programs at {uni.name}</h2>
              <Link to={`/programs?university=${id}`} className="text-[13px] text-[#1C4587] font-medium">View all {uni.programs} programs →</Link>
            </div>
            <div className="border border-[#E3E3DE] rounded-[10px] overflow-hidden">
              {uni.featured.map((p: any, i: number) => (
                <Link
                  key={i}
                  to="/programs/cs-warsaw"
                  className={`flex items-center justify-between p-4 hover:bg-[#F8F8F7] transition-colors group ${i > 0 ? "border-t border-[#E3E3DE]" : ""}`}
                >
                  <div>
                    <p className="text-[14px] font-medium text-[#141413] group-hover:text-[#1C4587]">{p.name}</p>
                    <p className="text-[12px] text-[#9E9E98] mt-0.5">{p.level} · {p.lang} · {p.city}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#9E9E98] group-hover:text-[#1C4587]">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Admission" && (
          <div className="max-w-[720px] space-y-8">
            <div>
              <h2 className="text-h3 text-[#141413] mb-4">Admission requirements</h2>
              <ul className="space-y-2.5">
                {uni.admissionInfo.requirements.map((req: string) => (
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
            <div className="bg-[#F8F8F7] rounded-[8px] p-5">
              <h3 className="text-[13px] font-semibold text-[#141413] mb-2">Application deadline</h3>
              <p className="text-body-sm text-[#5C5C57]">{uni.admissionInfo.deadline}</p>
            </div>
            <div>
              <h3 className="text-h4 text-[#141413] mb-2">Application process</h3>
              <p className="text-body-sm text-[#5C5C57]">{uni.admissionInfo.process}</p>
            </div>
            <div className="border border-[#1C4587]/20 bg-[#EEF2FB] rounded-[8px] p-5">
              <p className="text-[13px] font-semibold text-[#1C4587] mb-1">Full admission guide available in Premium</p>
              <p className="text-[12px] text-[#5C5C57] mb-3">Get detailed step-by-step guidance, document checklists, and direct support.</p>
              <Link to="/premium" className="inline-flex px-3.5 py-1.5 bg-[#1C4587] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#163571]">
                Get Premium Access
              </Link>
            </div>
          </div>
        )}

        {activeTab === "Tuition" && (
          <div className="max-w-[600px] space-y-6">
            <h2 className="text-h3 text-[#141413]">Tuition information</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "EU citizens (Polish programs)", value: uni.tuition.eu },
                { label: "Non-EU citizens", value: uni.tuition.nonEu },
                { label: "English-taught programs", value: uni.tuition.english },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between p-4 bg-white border border-[#E3E3DE] rounded-[8px] gap-3">
                  <span className="text-[13px] text-[#5C5C57]">{item.label}</span>
                  <span className="text-[13px] font-semibold text-[#141413] text-right">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-[#9E9E98]">Tuition amounts are approximate and may change. Always verify with the university directly.</p>
          </div>
        )}

        {activeTab === "Reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h3 text-[#141413]">Student reviews</h2>
              <Link to="/reviews" className="text-[13px] text-[#1C4587] font-medium">All reviews →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Amir T.", country: "Uzbekistan", program: "Computer Science", rating: 5, text: "Great research facilities and helpful international office. The city of Warsaw is amazing." },
                { name: "Maria K.", country: "Ukraine", program: "International Relations", rating: 4, text: "Strong faculty and good network. Registration process was a bit complex but manageable." },
              ].map((r) => (
                <div key={r.name} className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(r.rating)].map((_, i) => (
                      <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#1C4587"><path d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.5-.5z"/></svg>
                    ))}
                  </div>
                  <p className="text-body-sm text-[#141413] mb-3">"{r.text}"</p>
                  <p className="text-[12px] font-medium text-[#141413]">{r.name} · {r.country}</p>
                  <p className="text-[11px] text-[#9E9E98]">{r.program}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
