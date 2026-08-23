import { useState } from "react";
import { Link } from "react-router-dom";

const tools = [
  {
    id: "finder",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="#1C4587" strokeWidth="1.5"/>
        <path d="M13.5 13.5l3 3" stroke="#1C4587" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    name: "University Finder",
    description: "Answer a few questions about your preferences and academic background, and we'll suggest the best-matching universities for you.",
    status: "Available",
    premium: false,
    category: "Discovery",
  },
  {
    id: "degree",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L2 7l8 4 8-4-8-4zM2 13l8 4 8-4M2 10l8 4 8-4" stroke="#1C4587" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    name: "Degree Finder",
    description: "Not sure which field of study suits you? Answer questions about your interests and get program recommendations across Polish universities.",
    status: "Available",
    premium: false,
    category: "Discovery",
  },
  {
    id: "checklist",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 6h12M4 10h12M4 14h8" stroke="#1C4587" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 13l1.5 1.5 2.5-2.5" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    name: "Document Checklist",
    description: "Generate a personalized document checklist based on your citizenship, university, and program. Know exactly what you need.",
    status: "Available",
    premium: true,
    category: "Application",
  },
  {
    id: "assistant",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="10" rx="2" stroke="#1C4587" strokeWidth="1.5"/>
        <path d="M7 16h6" stroke="#1C4587" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 8.5h2M11 8.5h2M7 11h6" stroke="#1C4587" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    name: "Admission Assistant",
    description: "Ask questions about the Polish university system, visa requirements, NAWA, and the application process. Get clear, accurate answers.",
    status: "Available",
    premium: true,
    category: "Guidance",
  },
  {
    id: "nawa-helper",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" stroke="#1C4587" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    name: "NAWA Guide",
    description: "Step-by-step guide to the NAWA document legalization process. Find out whether you need NAWA and what documents to prepare.",
    status: "Available",
    premium: false,
    category: "Guidance",
  },
  {
    id: "compare",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="6" height="12" rx="1.5" stroke="#1C4587" strokeWidth="1.5"/>
        <rect x="12" y="3" width="6" height="14" rx="1.5" stroke="#1C4587" strokeWidth="1.5"/>
        <path d="M9 11h2" stroke="#1C4587" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    name: "Program Comparison",
    description: "Compare up to 3 programs side by side — tuition, duration, requirements, language, deadlines, and more.",
    status: "Coming soon",
    premium: true,
    category: "Discovery",
  },
];

const categories = ["All", "Discovery", "Application", "Guidance"];

export default function AITools() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = tools.filter((t) => activeCategory === "All" || t.category === activeCategory);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResponse("Based on your question, here is a summary:\n\nPoland offers a wide range of English-taught degree programs at both public and private universities. Tuition for international students typically ranges from 2,000 to 20,000 PLN per year depending on the institution and program type. EU citizens studying in Polish-taught programs may qualify for free tuition.\n\nFor more detailed guidance specific to your situation, consider activating Premium access.");
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Tools</p>
        <h1 className="text-h1 text-[#141413] mb-2">AI & Tools</h1>
        <p className="text-body text-[#5C5C57] max-w-[540px]">Practical tools to help you navigate the Polish university application process. No jargon, no guesswork.</p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-[5px] text-[13px] font-medium transition-colors ${
              activeCategory === cat ? "bg-[#1C4587] text-white" : "bg-white border border-[#E3E3DE] text-[#5C5C57] hover:bg-[#F8F8F7]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {filtered.map((tool) => (
          <div key={tool.id} className={`bg-white border rounded-[10px] p-5 flex flex-col ${tool.status === "Coming soon" ? "opacity-60" : "border-[#E3E3DE] hover:border-[#1C4587]/30 hover:shadow-sm"} transition-all`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#EEF2FB] flex items-center justify-center">
                {tool.icon}
              </div>
              <div className="flex items-center gap-1.5">
                {tool.premium && (
                  <span className="text-[10px] font-semibold text-[#5B4B2E] bg-[#FAF6EF] border border-[#5B4B2E]/15 px-1.5 py-0.5 rounded-[3px]">Premium</span>
                )}
                {tool.status === "Coming soon" && (
                  <span className="text-[10px] font-medium text-[#9E9E98] bg-[#F8F8F7] px-1.5 py-0.5 rounded-[3px]">Soon</span>
                )}
              </div>
            </div>
            <h3 className="text-[14px] font-semibold text-[#141413] mb-1.5">{tool.name}</h3>
            <p className="text-body-sm text-[#5C5C57] flex-1 mb-4">{tool.description}</p>
            {tool.status === "Coming soon" ? (
              <button disabled className="w-full py-2 border border-[#E3E3DE] rounded-[6px] text-[13px] font-medium text-[#9E9E98] cursor-not-allowed">
                Coming soon
              </button>
            ) : tool.premium ? (
              <Link to="/premium" className="block w-full py-2 border border-[#E3E3DE] rounded-[6px] text-[13px] font-medium text-[#5C5C57] hover:bg-[#F8F8F7] text-center">
                Requires Premium →
              </Link>
            ) : (
              <button
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                className="w-full py-2 bg-[#1C4587] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#163571]"
              >
                {activeTool === tool.id ? "Close" : "Open tool"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Admission Assistant panel */}
      {activeTool === "finder" || activeTool === "degree" || activeTool === "nawa-helper" ? (
        <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-6">
          <h2 className="text-h4 text-[#141413] mb-1">
            {tools.find((t) => t.id === activeTool)?.name}
          </h2>
          <p className="text-body-sm text-[#5C5C57] mb-5">Ask a question and get an answer about studying in Poland.</p>

          <form onSubmit={handleAsk} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about studying in Poland..."
              className="flex-1 h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587]"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 h-10 bg-[#1C4587] text-white text-[13.5px] font-medium rounded-[6px] hover:bg-[#163571] disabled:opacity-40"
            >
              {loading ? "..." : "Ask"}
            </button>
          </form>

          {response && (
            <div className="bg-[#F8F8F7] rounded-[8px] p-4">
              <p className="text-body-sm text-[#141413] whitespace-pre-line leading-relaxed">{response}</p>
            </div>
          )}

          {!response && !loading && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-[#9E9E98] mb-1">Suggested questions:</p>
              {[
                "What is NAWA and do I need it?",
                "How much does tuition cost for international students?",
                "What English proficiency score is required?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-left px-3.5 py-2 bg-white border border-[#E3E3DE] rounded-[6px] text-[13px] text-[#5C5C57] hover:text-[#141413] hover:border-[#1C4587]/30"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
