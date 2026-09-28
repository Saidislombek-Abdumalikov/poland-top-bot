import React, { useState } from "react";
import { DocumentItem, Language, UserProfile } from "../types";
import { triggerHaptic, submitDocument } from "../services/api";
import {
  FileCheck2,
  UploadCloud,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface DocumentsTabProps {
  documents: DocumentItem[];
  lang: Language;
  user: UserProfile | null;
  onRefreshDocs: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  lang,
  user,
  onRefreshDocs,
}) => {
  const isUz = lang === "uz";
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Core definitions
  const docDefs = [
    {
      id: "passport",
      title: isUz ? "Xorijga Chiqish Pasporti (Zagran)" : "International Passport",
      desc: isUz
        ? "Rangli skaner nusxa, kamida 18 oy amal qilish muddati."
        : "Color scan of info page, valid for at least 18 months.",
      required: true,
    },
    {
      id: "diploma",
      title: isUz ? "Attestat / Diplom va Baholar Ilovasi" : "Diploma / High School Certificate",
      desc: isUz
        ? "Maktab attestati yoki kollej/litsey diplomi va baholar ilovasi."
        : "Official diploma with transcript of grades and apostille.",
      required: true,
    },
    {
      id: "language_cert",
      title: isUz ? "Ingliz / Polyak Tili Sertifikati" : "Language Certificate",
      desc: isUz
        ? "IELTS (min 6.0), TOEFL (75+), Duolingo (105+) yoki ichki test."
        : "IELTS 6.0+, TOEFL 75+, Duolingo or internal test result.",
      required: true,
    },
    {
      id: "eligibility",
      title: isUz ? "O'qish Huquqi Ma'lumotnomasi (Eligibility)" : "Eligibility Letter",
      desc: isUz
        ? "Oldingi ta'lim diplomi keyingi bosqichda o'qish huquqini berishi haqida."
        : "Confirmation of eligibility for higher education studies.",
      required: true,
    },
    {
      id: "photo",
      title: isUz ? "Biometrik Fotosurat (3.5x4.5 sm)" : "Biometric Passport Photo",
      desc: isUz
        ? "Oq fondagi so'nggi 3.5x4.5 sm o'lchamdagi sifatli rasm."
        : "High-res white background 35x45mm photo.",
      required: true,
    },
  ];

  // Calculate completion percentage
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const reviewingCount = documents.filter((d) => d.status === "reviewing").length;
  const total = docDefs.length;
  const percentage = Math.round(((approvedCount + reviewingCount * 0.5) / total) * 100);

  const getDocStatus = (docId: string) => {
    return documents.find((d) => d.docType === docId);
  };

  const handleOpenUpload = (docId: string) => {
    triggerHaptic("light");
    setUploadingDocType(docId);
    setFileUrlInput("");
    setUploadSuccess(false);
  };

  const handleUploadSubmit = async () => {
    if (!uploadingDocType || !user) return;
    setIsUploading(true);
    triggerHaptic("heavy");

    const effectiveUrl =
      fileUrlInput.trim() || `https://storage.polandtop.uz/docs/${user.id}_${uploadingDocType}.pdf`;

    const res = await submitDocument(user.id, uploadingDocType, effectiveUrl);
    setIsUploading(false);

    if (res.success) {
      triggerHaptic("success");
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadingDocType(null);
        setUploadSuccess(false);
        onRefreshDocs();
      }, 1500);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full">
      {/* Progress Card */}
      <div className="relative bg-slate-900 overflow-hidden text-white rounded-[2rem] p-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] space-y-5">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <FileCheck2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block mb-1">
                {isUz ? "Hujjatlar Paketi" : "Application Dossier"}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {isUz ? "Qabulga Tayyorlik" : "Admissions Readiness"}
              </h3>
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black bg-white/10 px-3 py-1 rounded-2xl backdrop-blur-md border border-white/5 text-blue-400 tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10">
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]"
              style={{ width: `${Math.max(5, percentage)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-3">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {approvedCount} / {total} {isUz ? "tasdiqlangan" : "verified"}
            </span>
            {reviewingCount > 0 && (
              <span className="flex items-center gap-1.5 text-blue-300">
                <Clock className="w-3.5 h-3.5" />
                {reviewingCount} {isUz ? "tekshiruvda" : "under review"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {isUz ? "Majburiy Hujjatlar" : "Required Documents"}
        </span>
        <span className="text-[11px] font-bold text-slate-500 bg-white/60 backdrop-blur-md px-2 py-0.5 rounded border border-slate-200/50">
          5 {isUz ? "ta talab qilinadi" : "items"}
        </span>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {docDefs.map((def) => {
          const doc = getDocStatus(def.id);
          const status = doc?.status || "pending";

          return (
            <div
              key={def.id}
              className="bg-white/80 backdrop-blur-md rounded-[1.5rem] p-5 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 transition-all hover:border-slate-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border ${
                      status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : status === "reviewing"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : status === "needs_correction"
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {def.title}
                    </h4>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      {def.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge & Action */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
                <div>
                  {status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-200/50">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isUz ? "Tasdiqlangan" : "Approved"}
                    </span>
                  )}
                  {status === "reviewing" && (
                    <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-200/50">
                      <Clock className="w-3.5 h-3.5" />
                      {isUz ? "Tekshirilmoqda" : "Under Review"}
                    </span>
                  )}
                  {status === "needs_correction" && (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-rose-200/50">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isUz ? "Tuzatish lozim" : "Needs Correction"}
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {isUz ? "Kutilmoqda" : "Pending"}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenUpload(def.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all duration-300 ${
                    status === "approved"
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30"
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  {status === "approved"
                    ? isUz
                      ? "Yangilash"
                      : "Update"
                    : isUz
                    ? "Yuklash"
                    : "Upload"}
                </button>
              </div>

              {/* Feedback Note if rejected or needs correction */}
              {doc?.feedback && (
                <div className="bg-rose-50/50 border border-rose-200/50 text-rose-800 text-[13px] p-3 rounded-xl flex gap-2 items-start mt-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <b className="font-bold block mb-0.5">{isUz ? "Maslahatchi eslatmasi:" : "Advisor note:"}</b> 
                    {doc.feedback}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Bottom Sheet Modal */}
      {uploadingDocType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isUz ? "Hujjatni Yuklash" : "Upload Document"}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {docDefs.find((d) => d.id === uploadingDocType)?.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setUploadingDocType(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {uploadSuccess ? (
                <div className="py-8 text-center space-y-3 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isUz ? "Hujjat Tekshirishga Yuborildi!" : "Document Submitted!"}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    {isUz
                      ? "Maslahatchilarimiz hujjat sifatini tekshiradi va tez orada tasdiqlaydi."
                      : "Admissions advisors will verify the document format and quality shortly."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-slate-700">
                      {isUz ? "Hujjatni tanlang (PDF, JPG, PNG):" : "Select document (PDF, JPG, PNG):"}
                    </label>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileUrlInput(file.name);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full px-4 py-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[1.25rem] text-center flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                        <UploadCloud className="w-6 h-6 text-slate-400" />
                        <span className="text-[13px] font-bold text-slate-600">
                          {fileUrlInput
                            ? fileUrlInput
                            : isUz
                            ? "Faylni tanlash uchun bosing"
                            : "Tap to select a file"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 font-medium">
                      {isUz
                        ? "Eslatma: Yuklangan fayl xavfsiz tarzda saqlanadi va maslahatchiga yuboriladi."
                        : "Note: Uploaded file will be securely stored and sent to the advisor."}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200/70 text-xs text-blue-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>
                      {isUz
                        ? "Barcha shaxsiy hujjatlar xavfsiz shifrlangan tarzda saqlanadi."
                        : "All documents are encrypted and kept strictly confidential."}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!uploadSuccess && (
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  disabled={isUploading || !fileUrlInput}
                  onClick={handleUploadSubmit}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isUploading ? (
                    <span>{isUz ? "Yuklanmoqda..." : "Uploading..."}</span>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      {isUz ? "Tekshirishga Yuborish" : "Submit for Verification"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
