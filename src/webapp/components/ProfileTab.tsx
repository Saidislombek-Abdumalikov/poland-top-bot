import React, { useState } from "react";
import { UserProfile, ApplicationItem, ReviewItem, Language } from "../types";
import { triggerHaptic, addReview } from "../services/api";
import {
  UserCheck,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  GraduationCap,
  Star,
  MessageSquare,
  Lock,
  ChevronRight,
  Send,
  X,
  ExternalLink,
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

  return (
    <div className="space-y-4">
      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-blue-50">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900 truncate">
                {displayName}
              </h2>
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              {phone}
            </p>
          </div>
        </div>

        {/* Verification Status Details */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isUz ? "Ta'lim Bosqichi" : "Degree Level"}
            </span>
            <span className="font-bold text-slate-800">{preferredLevel}</span>
          </div>
          <div className="p-2 bg-emerald-50/70 border border-emerald-200/50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
              {isUz ? "Ommaviy Oferta" : "Terms & Oferta"}
            </span>
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              ✅ {isUz ? "Qabul qilingan" : "Accepted"}
            </span>
          </div>
        </div>
      </div>

      {/* Admin CRM Entry Card */}
      {user?.isAdmin && (
        <div
          onClick={() => {
            triggerHaptic("medium");
            onOpenAdmin();
          }}
          className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-4 shadow-lg cursor-pointer active:scale-[0.98] transition-all border border-amber-400/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
                <ShieldCheck className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Administrator
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mt-0.5">
                  {isUz ? "Admin CRM Boshqaruv Paneli" : "Admin CRM Management"}
                </h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs text-slate-300 mt-2.5">
            {isUz
              ? "Barcha talabalar arizalari, hujjatlar tekshiruvi va statistikani boshqarish."
              : "Manage applicant dossiers, document verifications, and student admissions."}
          </p>
        </div>
      )}

      {/* Applications Tracker */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {isUz ? "Mening Arizalarim" : "My Admission Applications"}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {applications.length} {isUz ? "ta" : "total"}
          </span>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => {
              const stages = [
                { key: "submitted", label: isUz ? "Yuborildi" : "Submitted" },
                { key: "reviewing", label: isUz ? "Tekshiruv" : "Review" },
                { key: "university_review", label: isUz ? "Universitet" : "University" },
                { key: "accepted", label: isUz ? "Qabul! 🎉" : "Accepted! 🎉" },
              ];

              const currentIdx =
                app.stage === "accepted"
                  ? 3
                  : app.stage === "university_review"
                  ? 2
                  : app.stage === "reviewing"
                  ? 1
                  : 0;

              return (
                <div
                  key={app.id}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{app.programName}</h4>
                    <p className="text-xs font-medium text-slate-500">{app.universityName}</p>
                  </div>

                  {/* Stage Step Indicator */}
                  <div className="flex items-center justify-between pt-1">
                    {stages.map((st, i) => {
                      const isDone = i <= currentIdx;
                      return (
                        <div key={st.key} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isDone
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isDone ? "✓" : i + 1}
                          </div>
                          <span
                            className={`text-[10px] mt-1 font-semibold text-center ${
                              isDone ? "text-blue-900" : "text-slate-400"
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {app.counselorNotes && (
                    <div className="bg-blue-50/80 border border-blue-200/70 p-2.5 rounded-xl text-xs text-blue-900 leading-relaxed">
                      <b>{isUz ? "Maslahatchi sharhi:" : "Counselor Note:"}</b>{" "}
                      {app.counselorNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              {isUz
                ? "Siz hali dasturga ariza topshirmagansiz."
                : "You have not submitted any applications yet."}
            </p>
          </div>
        )}
      </div>

      {/* Support Contact Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            💬
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {isUz ? "Qabul Koordinatori bilan aloqa" : "Contact Admissions Advisor"}
            </h4>
            <p className="text-xs text-slate-500">@polandM7 (Telegram)</p>
          </div>
        </div>
        <a
          href="https://t.me/polandM7"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>{isUz ? "Yozish" : "Message"}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Student Reviews Section */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {isUz ? "Talabalar Fikrlari" : "Student Reviews & Ratings"}
            </h3>
            <span className="text-xs text-slate-400">
              {reviews.length} {isUz ? "ta izoh" : "reviews"}
            </span>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              setShowReviewModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{isUz ? "+ Fikr bildirish" : "+ Add Review"}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{rev.studentName}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-blue-700 font-semibold">
                {rev.universityName} • {rev.programName}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                {isUz ? "Taqriz va Fikr Qoldirish" : "Submit Student Review"}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUz ? "Bahoingiz (1 - 5 yulduz):" : "Your Rating:"}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setRating(star);
                      }}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUz ? "Universitet nomi:" : "University Name:"}
                </label>
                <input
                  type="text"
                  value={targetUni}
                  onChange={(e) => setTargetUni(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUz ? "Ta'lim dasturi:" : "Program Name:"}
                </label>
                <input
                  type="text"
                  value={targetProg}
                  onChange={(e) => setTargetProg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUz ? "Fikr va taassurotlaringiz:" : "Your Experience & Review:"}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isUz
                      ? "Polshadagi o'qish, viza va qabul jarayoni haqida fikringiz..."
                      : "Share your experience about admissions, visa and studies..."
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                disabled={submittingReview || !comment.trim()}
                onClick={handleSendReview}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUz ? "Fikrni yuborish" : "Publish Review"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
