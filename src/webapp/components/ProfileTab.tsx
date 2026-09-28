import React, { useState } from "react";
import { UserProfile, ApplicationItem, ReviewItem, Language } from "../types";
import { triggerHaptic, addReview } from "../services/api";
import {
  Phone,
  CheckCircle2,
  GraduationCap,
  Star,
  Send,
  X,
} from "lucide-react";

interface ProfileTabProps {
  user: UserProfile | null;
  applications: ApplicationItem[];
  reviews: ReviewItem[];
  lang: Language;
  onRefreshReviews: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  applications,
  reviews,
  lang,
  onRefreshReviews,
}) => {
  const isUz = lang === "uz";
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [targetUni, setTargetUni] = useState("University of Warsaw");
  const [targetProg, setTargetProg] = useState("Computer Science");
  const [submittingReview, setSubmittingReview] = useState(false);

  const displayName = user?.fullName || user?.firstName || "Student";
  const phone = user?.phone || "+998 90 123 45 67";
  const preferredLevel = isUz
    ? user?.preferredLevel?.toLowerCase().includes("master")
      ? "Magistratura"
      : user?.preferredLevel?.toLowerCase().includes("phd")
      ? "Doktorantura"
      : "Bakalavriat"
    : user?.preferredLevel?.toLowerCase().includes("master")
    ? "Master's Degree"
    : user?.preferredLevel?.toLowerCase().includes("phd")
    ? "PhD"
    : "Bachelor's Degree";

  const handleSendReview = async () => {
    if (!comment.trim() || !user) return;
    setSubmittingReview(true);
    triggerHaptic("heavy");

    await addReview({
      userId: user.id,
      studentName: displayName,
      rating,
      universityName: targetUni,
      programName: targetProg,
      comment: comment.trim(),
    });

    setSubmittingReview(false);
    triggerHaptic("success");
    setShowReviewModal(false);
    setComment("");
    onRefreshReviews();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Student Profile Card - Sleek Dark Design */}
      <div className="relative bg-slate-900 rounded-[2rem] p-6 shadow-xl overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 mb-6">
          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/10">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {displayName}
              </h2>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            </div>
            <p className="text-[13px] font-medium text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {phone}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest mb-1">
              {isUz ? "Ta'lim Bosqichi" : "Degree Level"}
            </span>
            <span className="font-bold text-white text-sm">{preferredLevel}</span>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest mb-1">
              {isUz ? "Ommaviy Oferta" : "Terms & Oferta"}
            </span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {isUz ? "Qabul qilingan" : "Accepted"}
            </span>
            {user?.acceptedOfertaAt && (
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                {new Date(user.acceptedOfertaAt).toLocaleDateString(isUz ? "uz-UZ" : "en-US")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Applications Tracker */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100/80 text-slate-700 flex items-center justify-center border border-slate-200/50 shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {isUz ? "Mening Arizalarim" : "My Applications"}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/50">
            {applications.length} {isUz ? "ta" : "total"}
          </span>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-3 pt-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                      {app.programName}
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium mt-0.5">{app.universityName}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-slate-900 text-white uppercase tracking-wider shadow-sm flex-shrink-0">
                    {(() => {
                      if (isUz) {
                        switch (app.stage) {
                          case "submitted":
                            return "Yuborilgan";
                          case "documents_pending":
                            return "Hujjatlar kutilmoqda";
                          case "reviewing":
                            return "Ko'rib chiqilmoqda";
                          case "university_review":
                            return "Universitet tekshiruvida";
                          case "accepted":
                            return "Qabul qilindi";
                          case "rejected":
                            return "Rad etildi";
                          default:
                            return String(app.stage).replace(/_/g, " ");
                        }
                      }
                      return String(app.stage).replace(/_/g, " ");
                    })()}
                  </span>
                </div>

                {app.counselorNotes && (
                  <div className="p-3 bg-blue-50/50 rounded-xl text-[13px] text-slate-700 border border-blue-100/50 leading-relaxed">
                    <span className="font-black block text-[10px] text-blue-500 uppercase tracking-wider mb-1">
                      {isUz ? "Maslahatchi izohi:" : "Counselor Note:"}
                    </span>
                    {app.counselorNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-[13px] font-medium text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-2">
            {isUz ? "Hozircha arizalar topshirilmagan" : "No applications submitted yet"}
          </div>
        )}
      </div>

      {/* Official Admissions Advisor Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-[2rem] p-5 border border-blue-900/60 shadow-lg text-white flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
            {isUz ? "Rasmiy Maslahatchi" : "Official Admissions Advisor"}
          </span>
          <h4 className="text-sm font-bold text-white">
            {isUz ? "Savollar yoki yordam kerakmi?" : "Need admissions help?"}
          </h4>
          <p className="text-xs text-blue-200/90 font-mono">
            {isUz ? "Murojaat uchun: @mirzausmon1" : "Contact on Telegram: @mirzausmon1"}
          </p>
        </div>
        <a
          href="https://t.me/mirzausmon1"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shrink-0 transition-colors shadow-lg shadow-blue-600/30"
        >
          {isUz ? "Bog'lanish" : "Contact"}
        </a>
      </div>

      {/* Student Reviews Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {isUz ? "Talabalar Fikrlari" : "Student Reviews"}
            </h3>
          </div>

          {applications.some(a => a.stage === "accepted") && (
            <button
              onClick={() => {
                triggerHaptic("light");
                setShowReviewModal(true);
              }}
              className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              + {isUz ? "Fikr bildirish" : "Write Review"}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {reviews.slice(0, 3).map((rev) => (
            <div
              key={rev.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {rev.studentName}
                </span>
                <div className="flex text-amber-500 text-xs">
                  {"★".repeat(rev.rating)}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              <div className="text-[10px] text-slate-400">
                {rev.universityName} · {rev.programName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {isUz ? "Sharh Qoldirish" : "Write Review"}
              </h3>
              <button onClick={() => setShowReviewModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-xl"
                  >
                    <span className={s <= rating ? "text-amber-500" : "text-slate-200"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isUz ? "Fikringizni yozing..." : "Your review..."}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 resize-none"
              />
            </div>

            <button
              onClick={handleSendReview}
              disabled={submittingReview || !comment.trim()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isUz ? "Yuborish" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
