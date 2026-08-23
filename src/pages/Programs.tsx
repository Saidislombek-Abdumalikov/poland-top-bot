import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const programs = [
  { id: "cs-uw", name: "Computer Science", university: "University of Warsaw", city: "Warsaw", level: "Bachelor", lang: "English", tuition: "8,500 PLN/yr", deadline: "May 31, 2025", status: "Open", field: "Technology", mode: "Full-time" },
  { id: "ir-uw", name: "International Relations", university: "University of Warsaw", city: "Warsaw", level: "Master", lang: "English", tuition: "12,000 PLN/yr", deadline: "June 15, 2025", status: "Open", field: "Social Sciences", mode: "Full-time" },
  { id: "med-uj", name: "Medicine", university: "Jagiellonian University", city: "Kraków", level: "Master", lang: "English", tuition: "18,000 PLN/yr", deadline: "April 30, 2025", status: "Open", field: "Medicine", mode: "Full-time" },
  { id: "ce-pw", name: "Civil Engineering", university: "Warsaw University of Technology", city: "Warsaw", level: "Bachelor", lang: "English", tuition: "9,000 PLN/yr", deadline: "May 15, 2025", status: "Open", field: "Engineering", mode: "Full-time" },
  { id: "mba-koz", name: "MBA", university: "Kozminski University", city: "Warsaw", level: "Master", lang: "English", tuition: "28,000 PLN/yr", deadline: "Rolling", status: "Open", field: "Business", mode: "Part-time" },
  { id: "econ-sgh", name: "Economics", university: "SGH Warsaw School of Economics", city: "Warsaw", level: "Bachelor", lang: "Polish/English", tuition: "4,500 PLN/yr", deadline: "June 1, 2025", status: "Open", field: "Economics", mode: "Full-time" },
  { id: "env-pwr", name: "Environmental Engineering", university: "Wrocław University of Technology", city: "Wrocław", level: "Master", lang: "English", tuition: "7,500 PLN/yr", deadline: "May 30, 2025", status: "Open", field: "Engineering", mode: "Full-time" },
  { id: "law-uj", name: "European and International Law", university: "Jagiellonian University", city: "Kraków", level: "Master", lang: "English", tuition: "10,000 PLN/yr", deadline: "June 30, 2025", status: "Open", field: "Law", mode: "Full-time" },
  { id: "cs-agh", name: "Computer Science & Engineering", university: "AGH University of Krakow", city: "Kraków", level: "Bachelor", lang: "English", tuition: "7,000 PLN/yr", deadline: "June 10, 2025", status: "Open", field: "Technology", mode: "Full-time" },
  { id: "psy-amu", name: "Psychology", university: "Adam Mickiewicz University", city: "Poznań", level: "Master", lang: "English", tuition: "9,500 PLN/yr", deadline: "May 20, 2025", status: "Open", field: "Social Sciences", mode: "Full-time" },
  { id: "bio-uj", name: "Biotechnology", university: "Jagiellonian University", city: "Kraków", level: "Bachelor", lang: "English", tuition: "8,000 PLN/yr", deadline: "June 5, 2025", status: "Open", field: "Science", mode: "Full-time" },
  { id: "arch-pw", name: "Architecture", university: "Warsaw University of Technology", city: "Warsaw", level: "Master", lang: "English", tuition: "11,500 PLN/yr", deadline: "July 1, 2025", status: "Open", field: "Architecture", mode: "Full-time" },
  { id: "finance-sgh", name: "Finance & Accounting", university: "SGH Warsaw School of Economics", city: "Warsaw", level: "Master", lang: "English", tuition: "12,000 PLN/yr", deadline: "June 20, 2025", status: "Open", field: "Economics", mode: "Full-time" },
  { id: "data-pw", name: "Data Science", university: "Warsaw University of Technology", city: "Warsaw", level: "Master", lang: "English", tuition: "10,500 PLN/yr", deadline: "May 25, 2025", status: "Open", field: "Technology", mode: "Full-time" },
  { id: "phd-uw", name: "Computer Science (PhD)", university: "University of Warsaw", city: "Warsaw", level: "PhD", lang: "English", tuition: "Free", deadline: "July 15, 2025", status: "Open", field: "Technology", mode: "Full-time" },
];

const fields = ["Technology", "Engineering", "Business", "Medicine", "Law", "Science", "Social Sciences", "Economics", "Architecture"];
const cities = ["Warsaw", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź"];
const levels = ["Bachelor", "Master", "PhD", "MBA"];

function CheckboxGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold text-[#141413] uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onChange(selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt])}
              className="w-3.5 h-3.5 rounded-[3px] border-[#D0D0CC] accent-[#1C4587]"
            />
            <span className="text-[13px] text-[#5C5C57] group-hover:text-[#141413]">{opt}</span>
            <span className="ml-auto text-[11px] text-[#9E9E98]">
              {programs.filter((p) => {
                if (label === "Field") return p.field === opt;
                if (label === "City") return p.city === opt;
                if (label === "Level") return p.level === opt;
                return false;
              }).length}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Programs() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedLevels, setSelectedLevels] = useState<string[]>(searchParams.get("level") ? [searchParams.get("level")!] : []);
  const [selectedCities, setSelectedCities] = useState<string[]>(searchParams.get("city") ? [searchParams.get("city")!] : []);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [langFilter, setLangFilter] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = programs.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.university.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedLevels.length && !selectedLevels.includes(p.level)) return false;
    if (selectedCities.length && !selectedCities.includes(p.city)) return false;
    if (selectedFields.length && !selectedFields.includes(p.field)) return false;
    if (langFilter === "english" && !p.lang.includes("English")) return false;
    return true;
  });

  const activeCount = [
    selectedLevels.length > 0 ? selectedLevels.length : 0,
    selectedCities.length > 0 ? selectedCities.length : 0,
    selectedFields.length > 0 ? selectedFields.length : 0,
    langFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => { setSelectedLevels([]); setSelectedCities([]); setSelectedFields([]); setLangFilter(""); };
  const toggleSave = (id: string) => setSavedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const FilterPanel = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] font-semibold text-[#141413]">Filters</p>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-[12px] text-[#B91C1C] hover:text-[#991B1B]">Clear all ({activeCount})</button>
        )}
      </div>

      <CheckboxGroup label="Level" options={levels} selected={selectedLevels} onChange={setSelectedLevels} />
      <div className="border-t border-[#E3E3DE] mb-5" />
      <CheckboxGroup label="City" options={cities} selected={selectedCities} onChange={setSelectedCities} />
      <div className="border-t border-[#E3E3DE] mb-5" />
      <CheckboxGroup label="Field" options={fields} selected={selectedFields} onChange={setSelectedFields} />
      <div className="border-t border-[#E3E3DE] mb-5" />

      <p className="text-[11px] font-semibold text-[#141413] uppercase tracking-wide mb-2">Language</p>
      <div className="space-y-1.5">
        {["", "english"].map((val) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="lang"
              value={val}
              checked={langFilter === val}
              onChange={() => setLangFilter(val)}
              className="accent-[#1C4587]"
            />
            <span className="text-[13px] text-[#5C5C57]">{val === "" ? "Any language" : "English only"}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-label text-[#9E9E98] mb-1">Search</p>
        <h1 className="text-h1 text-[#141413]">Programs in Poland</h1>
      </div>

      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Program name or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-8.5 pr-4 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
          />
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className={`md:hidden h-10 px-4 rounded-[6px] text-[13.5px] font-medium border flex items-center gap-1.5 ${activeCount > 0 ? "border-[#1C4587] text-[#1C4587] bg-[#EEF2FB]" : "border-[#E3E3DE] text-[#5C5C57] bg-white"}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[13.5px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
          <option value="relevance">Sort: Relevance</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="tuition-low">Sort: Tuition ↑</option>
          <option value="tuition-high">Sort: Tuition ↓</option>
        </select>
      </div>

      <div className="flex gap-7">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <FilterPanel />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#9E9E98] mb-4">{filtered.length} programs found</p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-[#E3E3DE] rounded-[10px] bg-white">
              <p className="text-h3 text-[#9E9E98] mb-2">No programs found</p>
              <p className="text-[13px] text-[#9E9E98] mb-4">Try different keywords or adjust your filters</p>
              <button onClick={() => { setSearch(""); clearAll(); }} className="px-4 py-2 border border-[#E3E3DE] rounded-[6px] text-[14px] font-medium text-[#5C5C57] hover:bg-[#F8F8F7]">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white border border-[#E3E3DE] rounded-[8px] p-4 hover:border-[#1C4587]/30 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link to={`/programs/${p.id}`} className="text-[15px] font-semibold text-[#141413] group-hover:text-[#1C4587] transition-colors">{p.name}</Link>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium ${
                          p.level === "Bachelor" ? "bg-[#EEF2FB] text-[#1C4587]" :
                          p.level === "Master" ? "bg-[#FAF6EF] text-[#5B4B2E]" :
                          p.level === "PhD" ? "bg-[#EDFAF3] text-[#2E7D52]" : "bg-[#F0F0EE] text-[#5C5C57]"
                        }`}>{p.level}</span>
                      </div>
                      <p className="text-[13px] text-[#5C5C57] mb-2">{p.university} · {p.city}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-[12px] text-[#9E9E98]">{p.lang}</span>
                        <span className="text-[12px] text-[#9E9E98]">{p.tuition}</span>
                        <span className="text-[12px] text-[#9E9E98]">Deadline: {p.deadline}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#EDFAF3] text-[#2E7D52] rounded-[3px] font-medium">{p.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleSave(p.id)}
                        title={savedIds.has(p.id) ? "Remove from saved" : "Save program"}
                        className={`w-8 h-8 rounded-[5px] border flex items-center justify-center transition-colors ${savedIds.has(p.id) ? "bg-[#EEF2FB] border-[#1C4587]/20 text-[#1C4587]" : "border-[#E3E3DE] text-[#9E9E98] hover:text-[#1C4587] hover:border-[#1C4587]/30"}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill={savedIds.has(p.id) ? "currentColor" : "none"}>
                          <path d="M2 2h9v10l-4.5-2.5L2 12V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <Link to={`/programs/${p.id}`} className="px-3 py-1.5 text-[12px] font-medium text-[#1C4587] border border-[#1C4587]/25 rounded-[5px] hover:bg-[#EEF2FB] transition-colors">
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[14px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[15px] font-semibold text-[#141413]">Filters</p>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-[#5C5C57] hover:text-[#141413]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <FilterPanel />
            <div className="mt-6 pt-4 border-t border-[#E3E3DE]">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571]"
              >
                Show {filtered.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
