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
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-3xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                {isUz ? "Hujjatlar Paketi" : "Application Dossier"}
              </span>
              <h3 className="text-sm font-extrabold text-white">
                {isUz ? "Qabulga Tayyorlik Holati" : "Admissions Readiness"}
              </h3>
            </div>
          </div>
          <span className="text-lg font-black bg-white/20 px-2.5 py-1 rounded-xl backdrop-blur-sm">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden p-0.5">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-blue-100 font-medium pt-1">
          <span>
            {approvedCount} / {total} {isUz ? "tasdiqlangan" : "verified"}
          </span>
          {reviewingCount > 0 && (
            <span className="text-amber-200">
              ⏳ {reviewingCount} {isUz ? "tekshiruvda" : "under review"}
            </span>
          )}
        </div>
      </div>

      {/* Checklist Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isUz ? "Majburiy Hujjatlar Ro'yxati" : "Required Documents Checklist"}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          5 {isUz ? "ta talab qilinadi" : "items"}
        </span>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {docDefs.map((def) => {
          const doc = getDocStatus(def.id);
          const status = doc?.status || "pending";

          return (
            <div
              key={def.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      status === "approved"
                        ? "bg-emerald-100 text-emerald-600"
                        : status === "reviewing"
                        ? "bg-amber-100 text-amber-600"
                        : status === "needs_correction"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {def.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {def.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  {status === "approved" && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-bold border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isUz ? "Tasdiqlangan" : "Approved"}
                    </span>
                  )}
                  {status === "reviewing" && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      {isUz ? "Tekshirilmoqda" : "Under Review"}
                    </span>
                  )}
                  {status === "needs_correction" && (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-xs font-bold border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isUz ? "Tuzatish lozim" : "Needs Correction"}
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium">
                      ⚪ {isUz ? "Kutilmoqda" : "Pending Upload"}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenUpload(def.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                    status === "approved"
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
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
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl">
                  <b>{isUz ? "Maslahatchi eslatmasi:" : "Advisor note:"}</b> {doc.feedback}
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      {isUz ? "Hujjat fayl havolasi (Google Drive / Telegram / URL):" : "File URL or Cloud link:"}
                    </label>
                    <input
                      type="url"
                      value={fileUrlInput}
                      onChange={(e) => setFileUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      {isUz
                        ? "Agar havolangiz bo'lmasa, pastdagi tugmani bosing — namunaviy hujjat yuklanadi."
                        : "Or tap submit below to attach directly for advisor review."}
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
                  disabled={isUploading}
                  onClick={handleUploadSubmit}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
