import { useState } from "react";
import { Link } from "react-router-dom";

export default function Profile() {
  const [form, setForm] = useState({
    firstName: "Amir",
    lastName: "Tashkentov",
    email: "amir.tashkentov@email.com",
    phone: "+998 91 234 5678",
    country: "Uzbekistan",
    language: "English",
    preferredCity: "Warsaw",
    preferredLevel: "Bachelor",
    preferredField: "Technology",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[860px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Account</p>
        <h1 className="text-h1 text-[#141413]">Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSave}>
            {/* Personal info */}
            <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5 mb-4">
              <h2 className="text-h4 text-[#141413] mb-4">Personal information</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">First name</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Last name</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Country of citizenship</label>
                  <input type="text" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] focus:outline-none focus:border-[#1C4587]" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Preferred language</label>
                  <select value={form.language} onChange={(e) => setForm({...form, language: e.target.value})} className="w-full h-10 px-3 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                    <option value="English">English</option>
                    <option value="Uzbek">Uzbek</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Study preferences */}
            <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5 mb-4">
              <h2 className="text-h4 text-[#141413] mb-4">Study preferences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Preferred city</label>
                  <select value={form.preferredCity} onChange={(e) => setForm({...form, preferredCity: e.target.value})} className="w-full h-10 px-3 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                    <option value="">Any city</option>
                    <option>Warsaw</option><option>Kraków</option><option>Wrocław</option><option>Poznań</option><option>Gdańsk</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Degree level</label>
                  <select value={form.preferredLevel} onChange={(e) => setForm({...form, preferredLevel: e.target.value})} className="w-full h-10 px-3 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                    <option>Bachelor</option><option>Master</option><option>PhD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Field of study</label>
                  <select value={form.preferredField} onChange={(e) => setForm({...form, preferredField: e.target.value})} className="w-full h-10 px-3 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587]">
                    <option>Technology</option><option>Engineering</option><option>Business</option><option>Medicine</option><option>Law</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="px-5 py-2 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571]">
                {saved ? "✓ Saved" : "Save changes"}
              </button>
              <button type="button" className="px-5 py-2 border border-[#E3E3DE] text-[#5C5C57] text-[14px] font-medium rounded-[6px] hover:bg-[#F8F8F7]">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Avatar */}
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#EEF2FB] flex items-center justify-center mb-3">
              <span className="text-[22px] font-bold text-[#1C4587]">AT</span>
            </div>
            <p className="text-[14px] font-semibold text-[#141413]">{form.firstName} {form.lastName}</p>
            <p className="text-[12px] text-[#9E9E98] mb-3">{form.email}</p>
            <span className="text-[11px] font-semibold text-[#5B4B2E] bg-[#FAF6EF] border border-[#5B4B2E]/15 px-2.5 py-1 rounded-[4px]">Premium</span>
          </div>

          {/* Account links */}
          <div className="bg-white border border-[#E3E3DE] rounded-[10px] overflow-hidden">
            {[
              { label: "My Applications", href: "/applications" },
              { label: "Saved Programs", href: "/saved" },
              { label: "Documents", href: "/documents" },
              { label: "Premium Access", href: "/premium" },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="flex items-center justify-between px-5 py-3 border-b last:border-0 border-[#E3E3DE] hover:bg-[#F8F8F7] text-[13px] text-[#5C5C57] hover:text-[#141413]">
                {item.label}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            ))}
          </div>

          <button className="w-full py-2.5 border border-[#E3E3DE] text-[#B91C1C] text-[13.5px] font-medium rounded-[8px] hover:bg-[#FEF2F2] hover:border-[#B91C1C]/30 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
