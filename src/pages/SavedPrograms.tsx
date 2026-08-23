import { useState } from "react";
import { Link } from "react-router-dom";

const initial = [
  { id: "cs-uw", name: "Computer Science", university: "University of Warsaw", city: "Warsaw", level: "Bachelor", tuition: "8,500 PLN/yr", deadline: "May 31, 2025", status: "Open" },
  { id: "med-uj", name: "Medicine", university: "Jagiellonian University", city: "Kraków", level: "Master", tuition: "18,000 PLN/yr", deadline: "April 30, 2025", status: "Open" },
  { id: "mba-koz", name: "MBA", university: "Kozminski University", city: "Warsaw", level: "Master", tuition: "28,000 PLN/yr", deadline: "Rolling", status: "Open" },
  { id: "ir-uw", name: "International Relations", university: "University of Warsaw", city: "Warsaw", level: "Master", tuition: "12,000 PLN/yr", deadline: "June 15, 2025", status: "Open" },
  { id: "env-pwr", name: "Environmental Engineering", university: "Wrocław University of Technology", city: "Wrocław", level: "Master", tuition: "7,500 PLN/yr", deadline: "May 30, 2025", status: "Open" },
];

export default function SavedPrograms() {
  const [saved, setSaved] = useState(initial);

  const remove = (id: string) => setSaved((prev) => prev.filter((p) => p.id !== id));

  if (saved.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
        <h1 className="text-h2 text-[#141413] mb-3">No saved programs</h1>
        <p className="text-body text-[#5C5C57] mb-6">Programs you save will appear here for easy comparison.</p>
        <Link to="/programs" className="px-5 py-2.5 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571]">
          Explore Programs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-label text-[#9E9E98] mb-1">Your list</p>
          <h1 className="text-h1 text-[#141413]">Saved programs</h1>
        </div>
        <Link to="/programs" className="text-[13px] text-[#1C4587] font-medium">Browse more →</Link>
      </div>

      <div className="space-y-2">
        {saved.map((p) => (
          <div key={p.id} className="bg-white border border-[#E3E3DE] rounded-[8px] p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-[15px] font-semibold text-[#141413]">{p.name}</h3>
                <span className="text-[11px] px-1.5 py-0.5 bg-[#EEF2FB] text-[#1C4587] rounded-[3px] font-medium">{p.level}</span>
                <span className="text-[11px] px-1.5 py-0.5 bg-[#EDFAF3] text-[#2E7D52] rounded-[3px] font-medium">{p.status}</span>
              </div>
              <p className="text-[13px] text-[#5C5C57] mb-2">{p.university} · {p.city}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12px] text-[#9E9E98]">💰 {p.tuition}</span>
                <span className="text-[12px] text-[#9E9E98]">🗓 Deadline: {p.deadline}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <Link to={`/programs/${p.id}`} className="px-3 py-1.5 text-[12px] font-medium text-[#1C4587] border border-[#1C4587]/30 rounded-[5px] hover:bg-[#EEF2FB]">
                View
              </Link>
              <button onClick={() => remove(p.id)} className="px-3 py-1.5 text-[12px] font-medium text-[#9E9E98] border border-[#E3E3DE] rounded-[5px] hover:text-[#B91C1C] hover:border-[#B91C1C]/30">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
