import React, { useState } from "react";
import { Language, UserProfile } from "../types";
import { ArrowRight, ArrowLeft, CheckCircle2, GraduationCap, Plane, Sparkles } from "lucide-react";
import { triggerHaptic, submitOnboarding } from "../services/api";

interface NotRegisteredScreenProps {
  lang: Language;
  onComplete: (data: Partial<UserProfile>) => void;
  userId: number | undefined;
}

export const NotRegisteredScreen: React.FC<NotRegisteredScreenProps> = ({ lang, onComplete, userId }) => {
  const isUz = lang === "uz";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 8;

  const handleNext = () => {
    triggerHaptic("light");
    if (step < totalSteps) setStep(s => s + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    triggerHaptic("light");
    if (step > 1) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    triggerHaptic("medium");
    const success = await submitOnboarding({ ...formData, userId });
    setIsSubmitting(false);
    if (success) {
      triggerHaptic("success");
      onComplete(formData);
    }
  };

  const updateForm = (key: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Auto-advance for select buttons
    if (["preferredLevel", "hasPassport", "budget", "preferredField", "englishLevel", "polishLevel", "mathLevel", "hasSat", "targetIntake"].includes(key)) {
      setTimeout(() => {
        if (step < totalSteps) handleNext();
      }, 300);
    }
  };

  const OptionBtn = ({ label, value, field }: { label: string, value: string, field: keyof UserProfile }) => {
    const active = formData[field] === value;
    return (
      <button
        onClick={() => {
          triggerHaptic("light");
          updateForm(field, value);
        }}
        className={`w-full p-4 rounded-[1.25rem] text-left font-bold text-sm transition-all duration-300 border-2 ${
          active 
            ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.2)]" 
            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          {active && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <div className="px-6 pt-8 pb-4 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrev} disabled={step === 1} className={`p-2 rounded-full ${step === 1 ? 'opacity-0' : 'bg-slate-100 text-slate-600 active:scale-95'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {isUz ? "Qadam" : "Step"} {step} / {totalSteps}
          </span>
          <div className="w-9"></div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
        <div className="flex-1 space-y-6 animate-fade-in">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Qaysi bosqichda o'qimoqchisiz?" : "What level of study are you aiming for?"}
              </h2>
              <div className="space-y-3 mt-8">
                <OptionBtn field="preferredLevel" value="Bachelor" label={isUz ? "Bakalavriat" : "Bachelor's Degree"} />
                <OptionBtn field="preferredLevel" value="Master" label={isUz ? "Magistratura" : "Master's Degree"} />
                <OptionBtn field="preferredLevel" value="PhD" label={isUz ? "Doktorantura" : "PhD"} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Qaysi soha sizga qiziq?" : "Which field interests you?"}
              </h2>
              <div className="space-y-3 mt-6">
                <OptionBtn field="preferredField" value="IT" label={isUz ? "IT va Kompyuter fanlari" : "IT & Computer Science"} />
                <OptionBtn field="preferredField" value="Business" label={isUz ? "Biznes, Iqtisodiyot va Moliya" : "Business, Economics & Finance"} />
                <OptionBtn field="preferredField" value="Engineering" label={isUz ? "Muhandislik" : "Engineering"} />
                <OptionBtn field="preferredField" value="Medicine" label={isUz ? "Tibbiyot" : "Medicine"} />
                <OptionBtn field="preferredField" value="Humanities" label={isUz ? "Gumanitar va ijtimoiy fanlar" : "Humanities & Social Sciences"} />
                <OptionBtn field="preferredField" value="Undecided" label={isUz ? "Hali tanlamadim" : "I don't know yet"} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Til bilish darajangiz" : "Language Proficiency"}
              </h2>
              
              <div className="space-y-5 mt-6">
                <div>
                  <label className="text-[13px] font-bold text-slate-700 block mb-3">
                    {isUz ? "Ingliz tili (Sertifikat):" : "English Certificate:"}
                  </label>
                  <div className="space-y-2.5">
                    <OptionBtn field="englishLevel" value="IELTS" label="IELTS 6.0+ / TOEFL 80+" />
                    <OptionBtn field="englishLevel" value="Duolingo" label="Duolingo 100+" />
                    <OptionBtn field="englishLevel" value="None" label={isUz ? "Sertifikat yo'q" : "No certificate yet"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Polyak tili va Matematika" : "Polish Language & Math"}
              </h2>
              
              <div className="space-y-5 mt-6">
                <div>
                  <label className="text-[13px] font-bold text-slate-700 block mb-3">
                    {isUz ? "Polyak tilini bilasizmi?" : "Do you know Polish?"}
                  </label>
                  <div className="space-y-2.5">
                    <OptionBtn field="polishLevel" value="B1+" label={isUz ? "Ha (B1 yoki yuqori)" : "Yes (B1+)"} />
                    <OptionBtn field="polishLevel" value="Basic" label={isUz ? "Biroz tushunaman (A1/A2)" : "Basic knowledge"} />
                    <OptionBtn field="polishLevel" value="None" label={isUz ? "Umuman bilmayman" : "None"} />
                  </div>
                </div>

                <div className="pt-4">
                  <label className="text-[13px] font-bold text-slate-700 block mb-3">
                    {isUz ? "Matematika bo'yicha bilimingiz:" : "Math Proficiency:"}
                  </label>
                  <div className="space-y-2.5">
                    <OptionBtn field="mathLevel" value="Excellent" label={isUz ? "A'lo (Olimpiada / SAT darajasi)" : "Excellent"} />
                    <OptionBtn field="mathLevel" value="Average" label={isUz ? "O'rtacha (Maktab dasturi)" : "Average"} />
                    <OptionBtn field="mathLevel" value="Poor" label={isUz ? "Qiziqmayman / Past" : "Poor / Not interested"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "O'qish uchun yillik byudjetingiz" : "Yearly Tuition Budget"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isUz ? "Bu faqat shartnoma (kontrakt) narxi uchun, yashash xarajatlari kiritilmagan." : "Tuition fee only, excludes living expenses."}
              </p>
              <div className="space-y-3 mt-6">
                <OptionBtn field="budget" value="< 2800" label={isUz ? "$2,800 gacha (Arzonroq)" : "Up to $2,800"} />
                <OptionBtn field="budget" value="2800 - 4400" label={isUz ? "$2,800 – $4,400 (O'rtacha)" : "$2,800 – $4,400"} />
                <OptionBtn field="budget" value="> 4400" label={isUz ? "$4,400 dan yuqori (Top universitetlar)" : "Above $4,400 (Top-tier)"} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Qachon Polshaga ketmoqchisiz?" : "When do you plan to go?"}
              </h2>
              <div className="space-y-3 mt-6">
                <OptionBtn field="targetIntake" value="2025" label={isUz ? "2025-yil Kuz (Tez orada)" : "Fall 2025 (Soon)"} />
                <OptionBtn field="targetIntake" value="2026" label={isUz ? "2026-yil" : "2026"} />
                <OptionBtn field="targetIntake" value="Later" label={isUz ? "Keyinroq" : "Later / Undecided"} />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <Plane className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Xorijga chiqish pasportingiz bormi?" : "Do you have an international passport?"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isUz ? "Qizil pasport vizaga hujjat topshirish uchun zarur." : "Required for visa application."}
              </p>
              <div className="space-y-3 mt-6">
                <OptionBtn field="hasPassport" value="Yes" label={isUz ? "Ha, bor" : "Yes, I have one"} />
                <OptionBtn field="hasPassport" value="No" label={isUz ? "Yo'q, hali olmaganman" : "No, not yet"} />
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {isUz ? "Ismingiz va yoshingiz" : "Name and Age"}
              </h2>
              <p className="text-[13px] text-slate-500 font-medium">
                {isUz ? "Nihoyat, shaxsiy profilingizni yakunlaymiz." : "Finally, let's complete your personal profile."}
              </p>
              
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                    {isUz ? "To'liq ism-sharifingiz:" : "Full Name:"}
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={e => updateForm("fullName", e.target.value)}
                    placeholder={isUz ? "Masalan: Alisher Navoiy" : "E.g. Alisher Navoiy"}
                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                    {isUz ? "Yoshingiz:" : "Age:"}
                  </label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={e => updateForm("age", parseInt(e.target.value) || undefined)}
                    placeholder="18"
                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-700 block mb-1.5">
                    {isUz ? "Telefon raqamingiz:" : "Phone Number:"}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={e => updateForm("phone", e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="pt-6 mt-auto">
          <button
            onClick={step === totalSteps ? handleSubmit : handleNext}
            disabled={isSubmitting || (step === totalSteps && (!formData.fullName || !formData.age || !formData.phone))}
            className="w-full py-4 px-4 bg-slate-900 text-white rounded-[1.25rem] font-bold text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? (
              <span>{isUz ? "Saqlanmoqda..." : "Saving..."}</span>
            ) : step === totalSteps ? (
              <span>{isUz ? "Tugatish & Natijani Ko'rish" : "Finish & View Results"}</span>
            ) : (
              <span>{isUz ? "Keyingisi" : "Next"}</span>
            )}
            {!isSubmitting && step < totalSteps && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
