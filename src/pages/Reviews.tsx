import { useState } from "react";

const reviews = [
  { id: 1, name: "Amir Tashkentov", country: "Uzbekistan", university: "Jagiellonian University", program: "Computer Science, BSc", rating: 5, year: "2nd year", text: "PTU helped me find the right program and understand what documents I needed. The NAWA guidance was particularly helpful. I had no idea where to start and the platform gave me a clear roadmap.", avatar: "AT" },
  { id: 2, name: "Sara Mohamadi", country: "Iran", university: "University of Warsaw", program: "International Relations, MA", rating: 5, year: "1st year", text: "Finding an English-taught master's in Warsaw was much easier with PTU's filters. The program details are very accurate and the deadline reminders saved me from missing the application window.", avatar: "SM" },
  { id: 3, name: "David Osei", country: "Ghana", university: "Warsaw University of Technology", program: "Civil Engineering, BSc", rating: 4, year: "3rd year", text: "I used PTU to compare three universities before deciding. The admission requirements section saved me weeks of research. Living in Warsaw as a student is great — very affordable.", avatar: "DO" },
  { id: 4, name: "Fatima Al-Hassan", country: "Jordan", university: "Jagiellonian University", program: "Medicine, MD", rating: 5, year: "4th year", text: "The medical program in Kraków is excellent. PTU helped me understand the NAWA process, which was the most confusing part. Would recommend to any student from the Middle East.", avatar: "FA" },
  { id: 5, name: "Nguyen Van An", country: "Vietnam", university: "AGH University", program: "Computer Science, BSc", rating: 4, year: "2nd year", text: "Solid technical education at AGH. PTU's university comparison was useful for picking between AGH and WUT. The campus is good and Kraków is a beautiful city.", avatar: "NA" },
  { id: 6, name: "Olena Kovalenko", country: "Ukraine", university: "Adam Mickiewicz University", program: "Psychology, MA", rating: 5, year: "2nd year", text: "AMU has a strong psychology department. PTU connected me with the right advisor when I had questions about document equivalency. Very professional service.", avatar: "OK" },
];

export default function Reviews() {
  const [search, setSearch] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "", university: "", program: "", rating: "5", text: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = reviews.filter((r) => {
    if (search && !r.text.toLowerCase().includes(search.toLowerCase()) && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (uniFilter && r.university !== uniFilter) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-label text-[#9E9E98] mb-1">Community</p>
          <h1 className="text-h1 text-[#141413]">Student reviews</h1>
          <p className="text-body text-[#5C5C57] mt-2">Real experiences from international students studying in Poland.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-[#1C4587] text-white text-[13.5px] font-medium rounded-[6px] hover:bg-[#163571] shrink-0"
        >
          Share your experience
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-6 mb-8">
          <h2 className="text-h4 text-[#141413] mb-5">Share your experience</h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-[#EDFAF3] flex items-center justify-center mx-auto mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[14px] font-medium text-[#141413]">Thank you for sharing!</p>
              <p className="text-body-sm text-[#5C5C57]">Your review will appear after verification.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Full name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]" placeholder="Your name" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Country</label>
                <input type="text" required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]" placeholder="Your country" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">University</label>
                <input type="text" required value={formData.university} onChange={(e) => setFormData({...formData, university: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]" placeholder="University name" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Program</label>
                <input type="text" required value={formData.program} onChange={(e) => setFormData({...formData, program: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]" placeholder="Program name" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Rating</label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" onClick={() => setFormData({...formData, rating: String(n)})} className={`text-[20px] ${Number(formData.rating) >= n ? "text-[#1C4587]" : "text-[#E3E3DE]"}`}>★</button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Your experience</label>
                <textarea required rows={4} value={formData.text} onChange={(e) => setFormData({...formData, text: e.target.value})} className="w-full px-3.5 py-2.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587] resize-none" placeholder="Share your experience studying in Poland..." />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="px-5 py-2 bg-[#1C4587] text-white text-[13.5px] font-medium rounded-[6px] hover:bg-[#163571]">Submit review</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-[#E3E3DE] text-[#5C5C57] text-[13.5px] font-medium rounded-[6px] hover:bg-[#F8F8F7]">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-10 px-3.5 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] placeholder-[#9E9E98] focus:outline-none focus:border-[#1C4587]" />
        <select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)} className="sm:w-64 h-10 px-3 bg-white border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
          <option value="">All universities</option>
          {[...new Set(reviews.map((r) => r.university))].map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Reviews grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white border border-[#E3E3DE] rounded-[10px] p-5">
            <div className="flex items-center gap-0.5 mb-3">
              {[...Array(r.rating)].map((_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#1C4587"><path d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.5-.5z"/></svg>
              ))}
              {[...Array(5 - r.rating)].map((_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#E3E3DE"><path d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.5-.5z"/></svg>
              ))}
            </div>
            <p className="text-body-sm text-[#141413] mb-4 leading-relaxed">"{r.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#EEF2FB] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#1C4587]">{r.avatar}</span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#141413]">{r.name} · {r.country}</p>
                <p className="text-[11px] text-[#9E9E98]">{r.program} · {r.university}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-h3 text-[#9E9E98]">No reviews match your search</p>
        </div>
      )}
    </div>
  );
}
