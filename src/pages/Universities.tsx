import { useState } from "react";
import { Link } from "react-router-dom";

const allUniversities = [
  { id: "uw", name: "University of Warsaw", city: "Warsaw", type: "Public", programs: 214, logo: "UW", languages: ["Polish", "English"], description: "Poland's largest and most prestigious research university.", tuition: "Free–4,000 PLN" },
  { id: "uj", name: "Jagiellonian University", city: "Kraków", type: "Public", programs: 196, logo: "JU", languages: ["Polish", "English"], description: "One of Europe's oldest universities, founded in 1364.", tuition: "Free–5,000 PLN" },
  { id: "pw", name: "Warsaw University of Technology", city: "Warsaw", type: "Public", programs: 87, logo: "WUT", languages: ["Polish", "English"], description: "Leading technical university in Poland.", tuition: "Free–4,500 PLN" },
  { id: "ag", name: "AGH University of Krakow", city: "Kraków", type: "Public", programs: 72, logo: "AGH", languages: ["Polish", "English"], description: "Renowned for science and engineering programs.", tuition: "Free–3,500 PLN" },
  { id: "pwr", name: "Wrocław University of Technology", city: "Wrocław", type: "Public", programs: 63, logo: "PWr", languages: ["Polish", "English"], description: "Top technical university in Lower Silesia.", tuition: "Free–4,000 PLN" },
  { id: "amu", name: "Adam Mickiewicz University", city: "Poznań", type: "Public", programs: 158, logo: "AMU", languages: ["Polish", "English"], description: "Major research university in Poznań.", tuition: "Free–3,800 PLN" },
  { id: "pg", name: "Gdańsk University of Technology", city: "Gdańsk", type: "Public", programs: 54, logo: "GUT", languages: ["Polish", "English"], description: "Leading technical university on the Baltic coast.", tuition: "Free–4,200 PLN" },
  { id: "swps", name: "SWPS University", city: "Warsaw", type: "Private", programs: 41, logo: "SWPS", languages: ["Polish", "English"], description: "Well-regarded private university focused on social sciences.", tuition: "14,000–28,000 PLN" },
  { id: "kozminski", name: "Kozminski University", city: "Warsaw", type: "Private", programs: 28, logo: "KU", languages: ["Polish", "English"], description: "Top-ranked private business university in Central Europe.", tuition: "18,000–36,000 PLN" },
  { id: "sgh", name: "SGH Warsaw School of Economics", city: "Warsaw", type: "Public", programs: 35, logo: "SGH", languages: ["Polish", "English"], description: "Prestigious economics and business university.", tuition: "Free–5,000 PLN" },
  { id: "ug", name: "University of Gdańsk", city: "Gdańsk", type: "Public", programs: 102, logo: "UG", languages: ["Polish", "English"], description: "Comprehensive research university in Gdańsk.", tuition: "Free–3,500 PLN" },
  { id: "ul", name: "University of Łódź", city: "Łódź", type: "Public", programs: 89, logo: "UL", languages: ["Polish", "English"], description: "Major university in central Poland.", tuition: "Free–3,200 PLN" },
];

const cities = ["Warsaw", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź"];

export default function Universities() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");

  const filtered = allUniversities.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter && u.city !== cityFilter) return false;
    if (typeFilter && u.type !== typeFilter) return false;
    if (langFilter && !u.languages.includes(langFilter)) return false;
    return true;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Directory</p>
        <h1 className="text-h1 text-[#141413]">Universities in Poland</h1>
        <p className="text-body text-[#5C5C57] mt-2">{allUniversities.length} universities listed · {filtered.length} matching your filters</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          placeholder="Search universities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 px-3.5 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="sm:w-36 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]"
        >
          <option value="">Any city</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-36 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]"
        >
          <option value="">Public & Private</option>
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="sm:w-40 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]"
        >
          <option value="">Any language</option>
          <option value="English">English programs</option>
          <option value="Polish">Polish programs</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-h3 text-[#9E9E98] mb-2">No universities found</p>
          <p className="text-body-sm text-[#9E9E98] mb-4">Try adjusting your filters</p>
          <button
            onClick={() => { setSearch(""); setCityFilter(""); setTypeFilter(""); setLangFilter(""); }}
            className="px-4 py-2 border border-[#E3E3DE] rounded-[6px] text-[14px] font-medium text-[#5C5C57] hover:bg-[#F8F8F7]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E3E3DE] border border-[#E3E3DE] rounded-[10px] overflow-hidden">
          {filtered.map((uni) => (
            <Link
              key={uni.id}
              to={`/universities/${uni.id}`}
              className="bg-white p-5 hover:bg-[#FAFAF9] transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[5px] bg-[#EEF2FB] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#1C4587]">{uni.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-[#141413] group-hover:text-[#1C4587] transition-colors leading-snug">{uni.name}</h3>
                    <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-[3px] ${uni.type === "Public" ? "bg-[#EDFAF3] text-[#2E7D52]" : "bg-[#FAF6EF] text-[#5B4B2E]"}`}>
                      {uni.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#9E9E98] mb-2">{uni.city} · {uni.programs} programs</p>
                  <p className="text-[13px] text-[#5C5C57] mb-2">{uni.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#9E9E98]">Tuition: {uni.tuition}</span>
                    {uni.languages.map((l) => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 bg-[#F0F0EE] text-[#5C5C57] rounded-[3px]">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
