import { useState } from "react";

type DocStatus = "missing" | "submitted" | "reviewing" | "approved" | "needs_correction";

const statusConfig: Record<DocStatus, { label: string; color: string; bg: string }> = {
  missing: { label: "Missing", color: "#9E9E98", bg: "#F0F0EE" },
  submitted: { label: "Submitted", color: "#1C4587", bg: "#EEF2FB" },
  reviewing: { label: "Under review", color: "#B45309", bg: "#FFFBEB" },
  approved: { label: "Approved", color: "#2E7D52", bg: "#EDFAF3" },
  needs_correction: { label: "Needs correction", color: "#B91C1C", bg: "#FEF2F2" },
};

interface Doc {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: DocStatus;
  link: string;
  submittedAt?: string;
}

export default function Documents() {
  const [docs, setDocs] = useState<Doc[]>([
    { id: "passport", name: "Passport copy", description: "Clear color scan of your valid passport", required: true, status: "approved", link: "https://drive.google.com/example", submittedAt: "Jan 12, 2025" },
    { id: "diploma", name: "Secondary school diploma", description: "Original diploma or certificate with apostille", required: true, status: "reviewing", link: "https://drive.google.com/example", submittedAt: "Jan 15, 2025" },
    { id: "transcript", name: "Academic transcripts", description: "Official transcripts from your secondary school", required: true, status: "approved", link: "https://drive.google.com/example", submittedAt: "Jan 12, 2025" },
    { id: "english", name: "English proficiency certificate", description: "IELTS, TOEFL, or equivalent (B2 minimum)", required: true, status: "needs_correction", link: "", submittedAt: "Jan 14, 2025" },
    { id: "nawa", name: "NAWA recognition decision", description: "If your diploma is from outside the EU", required: false, status: "missing", link: "" },
    { id: "photo", name: "Passport-size photograph", description: "Recent color photo, white background, 35×45mm", required: true, status: "missing", link: "" },
    { id: "motivation", name: "Motivation letter", description: "Personal statement (500–800 words)", required: false, status: "submitted", link: "https://drive.google.com/example", submittedAt: "Jan 16, 2025" },
    { id: "health", name: "Health insurance", description: "European Health Insurance Card or private insurance", required: true, status: "missing", link: "" },
  ]);

  const [editDoc, setEditDoc] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");

  const submitDoc = (id: string) => {
    if (!linkInput.trim()) return;
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, link: linkInput, status: "submitted", submittedAt: "Today" } : d));
    setEditDoc(null);
    setLinkInput("");
  };

  const approved = docs.filter((d) => d.status === "approved").length;
  const total = docs.filter((d) => d.required).length;
  const progress = Math.round((approved / total) * 100);

  return (
    <div className="max-w-[860px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-label text-[#9E9E98] mb-1">Application</p>
        <h1 className="text-h1 text-[#141413] mb-2">Documents</h1>
        <p className="text-body text-[#5C5C57]">Submit document links and track their review status.</p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-[#E3E3DE] rounded-[10px] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#141413]">Required documents progress</p>
          <p className="text-[13px] font-semibold text-[#141413]">{approved}/{total} approved</p>
        </div>
        <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden">
          <div className="h-full bg-[#2E7D52] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-[#9E9E98] mt-1.5">{progress}% of required documents approved</p>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {docs.map((doc) => {
          const status = statusConfig[doc.status];
          return (
            <div key={doc.id} className="bg-white border border-[#E3E3DE] rounded-[8px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-[14px] font-medium text-[#141413]">{doc.name}</h3>
                    {!doc.required && <span className="text-[10px] text-[#9E9E98] bg-[#F0F0EE] px-1.5 py-0.5 rounded-[3px]">Optional</span>}
                  </div>
                  <p className="text-[12px] text-[#9E9E98] mb-2">{doc.description}</p>
                  {doc.submittedAt && <p className="text-[11px] text-[#9E9E98]">Submitted: {doc.submittedAt}</p>}
                  {doc.status === "needs_correction" && (
                    <p className="text-[12px] text-[#B91C1C] mt-1">Please upload a higher-resolution scan or a newer certificate.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px]" style={{ color: status.color, background: status.bg }}>
                    {status.label}
                  </span>
                  {(doc.status === "missing" || doc.status === "needs_correction") && (
                    <button
                      onClick={() => { setEditDoc(doc.id); setLinkInput(doc.link); }}
                      className="px-3 py-1 text-[12px] font-medium bg-[#1C4587] text-white rounded-[5px] hover:bg-[#163571]"
                    >
                      {doc.status === "needs_correction" ? "Re-submit" : "Submit link"}
                    </button>
                  )}
                </div>
              </div>

              {editDoc === doc.id && (
                <div className="mt-3 pt-3 border-t border-[#E3E3DE]">
                  <p className="text-[12px] text-[#5C5C57] mb-2">Paste a shareable link to your document (Google Drive, Dropbox, OneDrive):</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="flex-1 h-9 px-3 border border-[#E3E3DE] rounded-[5px] text-[13px] focus:outline-none focus:border-[#1C4587]"
                    />
                    <button onClick={() => submitDoc(doc.id)} className="px-3.5 py-1.5 bg-[#1C4587] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#163571]">
                      Submit
                    </button>
                    <button onClick={() => setEditDoc(null)} className="px-3 py-1.5 border border-[#E3E3DE] text-[12px] text-[#5C5C57] rounded-[5px] hover:bg-[#F8F8F7]">
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9E9E98] mt-1">Make sure the link is set to "anyone with link can view"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-[#F8F8F7] border border-[#E3E3DE] rounded-[10px]">
        <p className="text-[13px] font-medium text-[#141413] mb-1">Need help with documents?</p>
        <p className="text-[12px] text-[#5C5C57]">Premium members get document review and preparation support from our team. <a href="/premium" className="text-[#1C4587] hover:text-[#163571]">Learn about Premium →</a></p>
      </div>
    </div>
  );
}
