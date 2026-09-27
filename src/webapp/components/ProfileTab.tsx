import React, { useState } from "react";
import { UserProfile, ApplicationItem, ReviewItem, Language } from "../types";
import { triggerHaptic, addReview, adminLogin } from "../services/api";
import {
  Phone,
  CheckCircle2,
  Clock,
  GraduationCap,
  Star,
  MessageSquare,
  Send,
  X,
  Shield,
  Key,
} from "lucide-react";

interface ProfileTabProps {
  user: UserProfile | null;
  applications: ApplicationItem[];
  reviews: ReviewItem[];
  lang: Language;
  onOpenAdmin: () => void;
  onRefreshReviews: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  applications,
  reviews,
  lang,
  onOpenAdmin,
  onRefreshReviews,
}) => {
  const isUz = lang === "uz";
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [targetUni, setTargetUni] = useState("University of Warsaw");
  const [targetProg, setTargetProg] = useState("Computer Science");
  const [submittingReview, setSubmittingReview] = useState(false);

  const displayName = user?.fullName || user?.firstName || "Student";
  const phone = user?.phone || "+998 90 123 45 67";
  const preferredLevel = user?.preferredLevel === "master" ? "Magistratura" : "Bakalavriat";

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

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    const ok = await adminLogin(passcode, user?.id);
    if (ok) {
      triggerHaptic("success");
      setShowAdminLogin(false);
      onOpenAdmin();
    } else {
      triggerHaptic("error");
      setPasscodeError(true);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              {phone}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isUz ? "Ta'lim Bosqichi" : "Degree Level"}
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{preferredLevel}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isUz ? "Ommaviy Oferta" : "Terms & Oferta"}
            </span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
              ✅ {isUz ? "Qabul qilingan" : "Accepted"}
            </span>
          </div>
        </div>
      </div>

      {/* Applications Tracker */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {isUz ? "Mening Arizalarim" : "My Applications"}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {applications.length} {isUz ? "ta" : "total"}
          </span>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {app.programName}
                    </h4>
                    <p className="text-xs text-slate-500">{app.universityName}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800 uppercase">
                    {app.stage}
                  </span>
                </div>

                {app.counselorNotes && (
                  <div className="p-2.5 bg-white rounded-lg text-xs text-slate-700 border border-slate-200">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">
                      {isUz ? "Maslahatchi izohi:" : "Counselor Note:"}
                    </span>
                    {app.counselorNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            {isUz ? "Hozircha arizalar topshirilmagan" : "No applications submitted yet"}
          </div>
        )}
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

          <button
            onClick={() => {
              triggerHaptic("light");
              setShowReviewModal(true);
            }}
            className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors"
          >
            + {isUz ? "Fikr bildirish" : "Write Review"}
          </button>
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

      {/* Discrete Admin Access Section */}
      <div className="pt-4 pb-8 flex flex-col items-center justify-center text-center">
        {user?.isAdmin ? (
          <button
            onClick={() => {
              triggerHaptic("medium");
              onOpenAdmin();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{isUz ? "Admin Portalga O'tish" : "Open Admin Portal"}</span>
          </button>
        ) : (
          <div>
            {!showAdminLogin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                <span>{isUz ? "Boshqaruv (Admin)" : "Staff Login"}</span>
              </button>
            ) : (
              <form onSubmit={handleAdminAuth} className="flex items-center gap-2 mt-2">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError(false);
                  }}
                  placeholder="Admin passcode..."
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Kirish
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            {passcodeError && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                {isUz ? "Parol noto'g'ri" : "Invalid passcode"}
              </p>
            )}
          </div>
        )}
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
