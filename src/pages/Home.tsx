import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const universities = [
  { id: "uw", name: "University of Warsaw", city: "Warsaw", type: "Public", programs: 214, logo: "UW", description: "Poland's largest and most prestigious research university, founded in 1816." },
  { id: "uj", name: "Jagiellonian University", city: "Kraków", type: "Public", programs: 196, logo: "JU", description: "One of Europe's oldest universities, founded in 1364, with rich academic heritage." },
  { id: "pw", name: "Warsaw University of Technology", city: "Warsaw", type: "Public", programs: 87, logo: "WUT", description: "Leading technical university in Poland with strong engineering programs." },
  { id: "ag", name: "AGH University of Krakow", city: "Kraków", type: "Public", programs: 72, logo: "AGH", description: "Renowned for science, technology, and engineering programs." },
];

const stats = [
  { value: "180+", label: "Universities" },
  { value: "4,200+", label: "Degree programs" },
  { value: "38", label: "Cities" },
  { value: "12,000+", label: "Int'l students" },
];

const features = [
  {
    title: "Search & Compare",
    description: "Browse thousands of bachelor's, master's, and doctoral programs with powerful filters.",
  },
  {
    title: "Admission Guidance",
    description: "Understand requirements, documents, and deadlines for each university and program.",
  },
  {
    title: "Student Reviews",
    description: "Read authentic experiences from students currently studying across Poland.",
  },
  {
    title: "Application Support",
    description: "Submit documents and track your application status from one organized place.",
  },
];

const reviews = [
  { name: "Amir Tashkentov", country: "Uzbekistan", university: "Jagiellonian University", program: "Computer Science, BSc", rating: 5, text: "PTU helped me find the right program and understand what documents I needed. The NAWA guidance was particularly helpful — I had no idea where to start." },
  { name: "Sara Mohamadi", country: "Iran", university: "University of Warsaw", program: "International Relations, MA", rating: 5, text: "Finding an English-taught master's in Warsaw was much easier with PTU's filters. The program details are very accurate and up to date." },
  { name: "David Osei", country: "Ghana", university: "Warsaw University of Technology", program: "Civil Engineering, BSc", rating: 4, text: "I used PTU to compare three universities before deciding. The admission requirements section saved me weeks of research." },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (level) params.set("level", level);
    if (city) params.set("city", city);
    navigate(`/programs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero — split layout */}
      <section className="bg-white border-b border-[#E3E3DE] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[420px]">
            {/* Text side */}
            <div className="flex flex-col justify-center py-14 lg:py-20 pr-0 lg:pr-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FB] rounded-[4px] mb-6 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1C4587]"></span>
                <span className="text-[12px] font-medium text-[#1C4587]">2025 / 2026 intake now open</span>
              </div>
              <h1 className="text-display text-[#141413] mb-5">
                Find Your<br />Degree<br />in Poland
              </h1>
              <p className="text-body-lg text-[#5C5C57] mb-9 max-w-[440px]">
                Discover universities, degree programs, admission requirements and resources for international students studying in Poland.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link to="/programs" className="px-5 py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] transition-colors">
                  Explore Programs
                </Link>
                <Link to="/universities" className="px-5 py-2.5 border border-[#E3E3DE] text-[#5C5C57] text-[14px] font-medium rounded-[6px] hover:bg-[#F8F8F7] hover:text-[#141413] transition-colors">
                  Browse Universities
                </Link>
              </div>
            </div>

            {/* Photo side */}
            <div className="hidden lg:block relative -mr-0 self-stretch">
              <div className="absolute inset-y-0 left-8 right-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1759093886641-83ca4c2beac1?w=900&h=600&fit=crop&auto=format"
                  alt="Student reading on university campus"
                  className="w-full h-full object-cover"
                />
                {/* Subtle left fade to white */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="bg-[#F8F8F7] border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <p className="text-label text-[#9E9E98] mb-3">Quick program search</p>
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Program name or university..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
                />
              </div>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="sm:w-44 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                <option value="">Degree level</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
                <option value="mba">MBA</option>
              </select>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="sm:w-40 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                <option value="">Any city</option>
                <option value="warsaw">Warsaw</option>
                <option value="krakow">Kraków</option>
                <option value="wroclaw">Wrocław</option>
                <option value="poznan">Poznań</option>
                <option value="gdansk">Gdańsk</option>
              </select>
              <button type="submit" className="h-10 px-6 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] shrink-0 transition-colors">
                Search
              </button>
            </div>
          </form>
          <p className="text-[12px] text-[#9E9E98] mt-3">
            Or{" "}
            <Link to="/programs" className="text-[#1C4587] hover:text-[#163571]">browse all programs</Link>
            {" "}with advanced filters
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:divide-x divide-[#E3E3DE]">
            {stats.map((stat, i) => (
              <div key={stat.label} className={i > 0 ? "sm:pl-6" : ""}>
                <div className="text-[28px] font-semibold text-[#141413] tracking-tight">{stat.value}</div>
                <div className="text-[13px] text-[#5C5C57] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured universities */}
      <section className="bg-[#F8F8F7] border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-label text-[#9E9E98] mb-2">Top institutions</p>
              <h2 className="text-h2 text-[#141413]">Featured universities</h2>
            </div>
            <Link to="/universities" className="text-[13px] text-[#1C4587] font-medium hover:text-[#163571]">View all →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E3E3DE] border border-[#E3E3DE] rounded-[10px] overflow-hidden">
            {universities.map((uni) => (
              <Link key={uni.id} to={`/universities/${uni.id}`} className="bg-white p-6 hover:bg-[#FAFAF9] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-[6px] bg-[#EEF2FB] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#1C4587]">{uni.logo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-semibold text-[#141413] group-hover:text-[#1C4587] transition-colors leading-snug">{uni.name}</h3>
                      <span className="shrink-0 text-[11px] text-[#9E9E98]">{uni.programs} programs</span>
                    </div>
                    <p className="text-[12px] text-[#9E9E98] mt-0.5 mb-2">{uni.city} · {uni.type}</p>
                    <p className="text-[13px] text-[#5C5C57] line-clamp-2">{uni.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-b border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-label text-[#9E9E98] mb-3">How it works</p>
              <h2 className="text-h2 text-[#141413] mb-4">Everything you need to study in Poland</h2>
              <p className="text-body text-[#5C5C57] mb-6">PTU brings together university information, admission guidance, and application tools in one place.</p>
              <Link to="/tools" className="text-[13px] text-[#1C4587] font-medium hover:text-[#163571]">Explore AI tools →</Link>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <div key={f.title}>
                  <div className="w-7 h-7 rounded-[5px] bg-[#EEF2FB] flex items-center justify-center mb-3">
                    <span className="text-[11px] font-bold text-[#1C4587]">{i + 1}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#141413] mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-[#5C5C57] leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA — calm, no glow */}
      <section className="bg-[#1C4587]">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-label text-blue-300 mb-3">Premium</p>
              <h2 className="text-h2 text-white mb-3">
                Full access to admission details, documents, and personal guidance
              </h2>
              <p className="text-[14px] text-blue-200 leading-relaxed">
                Premium members get complete program information, document checklists, direct advisor support, and application tracking.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
              <Link to="/premium" className="px-5 py-2.5 bg-white text-[#1C4587] text-[14px] font-medium rounded-[6px] hover:bg-blue-50 text-center transition-colors">
                Get Premium Access
              </Link>
              <Link to="/premium" className="px-5 py-2.5 border border-white/25 text-white text-[14px] font-medium rounded-[6px] hover:bg-white/10 text-center transition-colors">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Student reviews */}
      <section className="bg-[#F8F8F7] border-t border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-label text-[#9E9E98] mb-2">Community</p>
              <h2 className="text-h2 text-[#141413]">What students say</h2>
            </div>
            <Link to="/reviews" className="text-[13px] text-[#1C4587] font-medium hover:text-[#163571]">All reviews →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(r.rating)].map((_, i) => (
                    <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#1C4587"><path d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.5-.5z"/></svg>
                  ))}
                </div>
                <p className="text-[13px] text-[#141413] leading-relaxed mb-4">"{r.text}"</p>
                <div>
                  <p className="text-[12px] font-medium text-[#141413]">{r.name}</p>
                  <p className="text-[11px] text-[#9E9E98]">{r.program} · {r.university}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City guide strip */}
      <section className="bg-white border-t border-[#E3E3DE]">
        <div className="max-w-[1280px] mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-5">
            <p className="text-[13px] font-medium text-[#141413]">Study cities in Poland</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["Warsaw", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Lublin", "Katowice"].map((c) => (
              <Link
                key={c}
                to={`/programs?city=${c.toLowerCase()}`}
                className="px-3.5 py-1.5 bg-[#F8F8F7] border border-[#E3E3DE] rounded-[5px] text-[13px] text-[#5C5C57] hover:bg-[#EEF2FB] hover:text-[#1C4587] hover:border-[#1C4587]/20 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
