import React, { useState } from "react";
import { Language, UserProfile } from "../types";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Calculator,
  Languages,
  Calendar,
  Wallet,
  Plane,
  User,
  Phone,
  School,
} from "lucide-react";
import { triggerHaptic, submitOnboarding } from "../services/api";

interface NotRegisteredScreenProps {
  lang: Language;
  onComplete: (data: Partial<UserProfile>) => void;
  userId: number | undefined;
}

export const NotRegisteredScreen: React.FC<NotRegisteredScreenProps> = ({
  lang,
  onComplete,
  userId,
}) => {
  const isUz = lang === "uz";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    preferredLevel: "Bachelor",
    preferredField: "IT",
    educationStatus: "Maktab yoki litsey o'quvchisiman",
    birthYear: 2007,
    graduationYear: 2026,
    englishLevel: "IELTS 5.5 - 6.0",
    mathLevel: "Yaxshi (4 baho)",
    polishLevel: "None",
    budget: "2800 - 4400",
    targetIntake: "2026",
    hasPassport: "Yes",
    hasSat: "No",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 10;

  const handleNext = () => {
    triggerHaptic("light");
    if (step < totalSteps) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    triggerHaptic("light");
    if (step > 1) setStep((s) => s - 1);
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

  const updateForm = (key: keyof UserProfile, value: any, autoAdvance = true) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (autoAdvance) {
      setTimeout(() => {
        if (step < totalSteps) handleNext();
      }, 250);
    }
  };

  const OptionBtn = ({
    label,
    desc,
    value,
    field,
  }: {
    label: string;
    desc?: string;
    value: string;
    field: keyof UserProfile;
  }) => {
    const active = formData[field] === value;
    return (
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          updateForm(field, value);
        }}
        className={`w-full p-4 rounded-2xl text-left font-medium transition-all duration-200 border-2 ${
          active
            ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
            : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${active ? "text-blue-400" : "text-white"}`}>
              {label}
            </span>
            {desc && <span className="text-xs text-slate-400 mt-0.5">{desc}</span>}
          </div>
          {active && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Top Header & Progress Bar */}
      <div className="px-6 pt-6 pb-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`p-2 rounded-xl transition-all ${
                step === 1
                  ? "opacity-0 pointer-events-none"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                {isUz ? "Anketa Tahlili" : "Student Profile"}
              </span>
              <span className="text-xs font-bold text-slate-400 mt-0.5">
                {isUz ? "Qadam" : "Step"} {step} / {totalSteps}
              </span>
            </div>

            <div className="w-8" />
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col max-w-md mx-auto w-full">
        <div className="flex-1 space-y-5 animate-fade-in">
          {/* STEP 1: Degree Level */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Qaysi bosqichda o'qimoqchisiz?" : "What degree level are you aiming for?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Polshada maqsad qilgan ta'lim darajangizni tanlang:"
                  : "Choose your target level of education in Poland:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="preferredLevel"
                  value="Bachelor"
                  label={isUz ? "Bakalavriat (BSc / BA)" : "Bachelor's Degree"}
                  desc={isUz ? "3 – 4 yillik oliy ta'lim dasturi" : "3-4 year undergraduate degree"}
                />
                <OptionBtn
                  field="preferredLevel"
                  value="Master"
                  label={isUz ? "Magistratura (MSc / MA)" : "Master's Degree"}
                  desc={isUz ? "1.5 – 2 yillik ikkinchi bosqich ta'limi" : "1.5-2 year graduate program"}
                />
                <OptionBtn
                  field="preferredLevel"
                  value="PhD"
                  label={isUz ? "Tibbiyot / MD (5-6 yil)" : "Medicine / MD Program"}
                  desc={isUz ? "Shifokorlik yoki stomatologiya yaxlit dasturi" : "Full 5-6 year MD/Dentistry degree"}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Field of Study */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Qaysi soha sizga qiziq?" : "Which field interests you most?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Kelajakda qaysi mutaxassislik bo'yicha tahsil olmoqchisiz?"
                  : "Select your desired study domain:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="preferredField"
                  value="IT"
                  label={isUz ? "IT, Sun'iy Intellekt va Dasturlash" : "IT, AI & Computer Science"}
                  desc={isUz ? "Software engineering, Data Science, Kiberxavfsizlik" : "Software, Data Science, Cyber Security"}
                />
                <OptionBtn
                  field="preferredField"
                  value="Business"
                  label={isUz ? "Biznes, Moliya va Iqtisodiyot" : "Business, Finance & Economics"}
                  desc={isUz ? "Menejment, Xalqaro munosabatlar, Marketing" : "Management, International Business, Marketing"}
                />
                <OptionBtn
                  field="preferredField"
                  value="Engineering"
                  label={isUz ? "Muhandislik va Arxitektura" : "Engineering & Architecture"}
                  desc={isUz ? "Robototexnika, Mexatronika, Fuqarolik qurilishi" : "Robotics, Mechatronics, Civil Engineering"}
                />
                <OptionBtn
                  field="preferredField"
                  value="Medicine"
                  label={isUz ? "Tibbiyot, Farmatsiya va Salomatlik" : "Medicine, Pharmacy & Healthcare"}
                  desc={isUz ? "Umumiy tibbiyot, Stomatologiya, Biotexnologiya" : "General Medicine, Dentistry, Biotech"}
                />
                <OptionBtn
                  field="preferredField"
                  value="Humanities"
                  label={isUz ? "Gumanitar va Ijtimoiy fanlar" : "Social Sciences & Humanities"}
                  desc={isUz ? "Psixologiya, Huquqshunoslik, Tilshunoslik" : "Psychology, Law, Modern Languages"}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Current Education Status */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Hozirgi ta'lim holatingiz qanday?" : "What is your current education status?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Ayni vaqtda qayerda o'qiysiz yoki nima bilan bandsiz?"
                  : "Tell us about your current educational background:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="educationStatus"
                  value="school_student"
                  label={isUz ? "Maktab yoki litsey o'quvchisiman (10-11 sinf)" : "High school / Lyceum student"}
                  desc={isUz ? "Hali bitirganim yo'q, tez orada attestat olaman" : "Currently finishing secondary school"}
                />
                <OptionBtn
                  field="educationStatus"
                  value="school_graduated"
                  label={isUz ? "Maktab / Litsey / Kollejni bitirganman" : "Graduated secondary school / college"}
                  desc={isUz ? "Qo'limda attestat yoki kollej diplomi bor" : "Already hold diploma / certificate"}
                />
                <OptionBtn
                  field="educationStatus"
                  value="uni_student"
                  label={isUz ? "Universitet talabasiman (o'qishni ko'chirish)" : "Current university student (Transfer)"}
                  desc={isUz ? "O'zbekistonda yoki xorijda 1-2-3 kurs talabasiman" : "Seeking university transfer to Poland"}
                />
                <OptionBtn
                  field="educationStatus"
                  value="uni_graduated"
                  label={isUz ? "Universitetni bitirganman (Bakalavr diplomi bor)" : "University graduate (Bachelor holder)"}
                  desc={isUz ? "Magistratura bosqichida o'qishni reja qilyapman" : "Ready for Master's degree studies"}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Birth Year & Graduation Year */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Tug'ilgan va bitirish yilingiz" : "Birth Year & Graduation Year"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Sizga to'g'ri muddatlarni belgilash uchun tug'ilgan va bitirish yilingizni kiriting:"
                  : "Please enter your birth year and graduation year:"}
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    {isUz ? "Tug'ilgan yilingiz:" : "Birth Year:"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2004, 2005, 2006, 2007, 2008, 2009].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setFormData((prev) => ({ ...prev, birthYear: yr }));
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.birthYear === yr
                            ? "bg-blue-600 border-blue-400 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder={isUz ? "Boshqa yil (masalan: 2002)" : "Other year"}
                        value={formData.birthYear || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            birthYear: parseInt(e.target.value, 10) || undefined,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300">
                    {isUz ? "Maktab/Universitetni bitirgan yoki bitiradigan yilingiz:" : "Graduation Year:"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2023, 2024, 2025, 2026, 2027].map((gyr) => (
                      <button
                        key={gyr}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setFormData((prev) => ({ ...prev, graduationYear: gyr }));
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.graduationYear === gyr
                            ? "bg-emerald-600 border-emerald-400 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {gyr}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 mt-4 transition-colors"
                >
                  <span>{isUz ? "Davom etish" : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: English Proficiency (Detailed & Separate) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Ingliz tili bilim darajangiz qanday?" : "What is your English proficiency level?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Polsha universitetlariga to'g'ri topshirish uchun sertifikatingizni aniq ko'rsating:"
                  : "Accurately indicate your language certificate or current level:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="englishLevel"
                  value="IELTS 6.5+"
                  label="IELTS 6.5+ yoki TOEFL 85+"
                  desc={isUz ? "Barcha nufuzli davlat oliygohlariga to'g'ridan-to'g'ri qabul" : "Direct admission to top universities"}
                />
                <OptionBtn
                  field="englishLevel"
                  value="IELTS 5.5 - 6.0"
                  label="IELTS 5.5 – 6.0 (B2 daraja)"
                  desc={isUz ? "Aksariyat Polsha universitetlariga yetarli" : "Accepted by most Polish universities"}
                />
                <OptionBtn
                  field="englishLevel"
                  value="Duolingo 100+"
                  label="Duolingo English Test (100+ ball)"
                  desc={isUz ? "Online topshiriladigan xalqaro sertifikat" : "Online accepted language test"}
                />
                <OptionBtn
                  field="englishLevel"
                  value="Intermediate (No cert)"
                  label={isUz ? "Sertifikat yo'q, lekin inglizcha tushunaman" : "No certificate, but speak English (B1-B2)"}
                  desc={isUz ? "Universitet ichki testini topshirish imkoniyati bor" : "Can take internal university entrance test"}
                />
                <OptionBtn
                  field="englishLevel"
                  value="None"
                  label={isUz ? "Ingliz tilini endi o'rganmoqdaman (Nol daraja)" : "Beginner / No English proficiency"}
                  desc={isUz ? "Polshadagi 1 yillik tayyorlov kursi (Foundation) tavsiya etiladi" : "Language preparatory year recommended"}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Math Proficiency (Detailed & Separate) */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Matematika bo'yicha bilimingiz qanday?" : "How would you rate your Math skills?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "IT, Moliya va Texnika universitetlarida matematika asosiy mezon hisoblanadi:"
                  : "Math proficiency is critical for STEM, IT, and Finance faculties:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="mathLevel"
                  value="Excellent"
                  label={isUz ? "A'lo (5 baho / Olimpiada / Kuchli mantiq)" : "Excellent (A Grade / Olympiad level)"}
                  desc={isUz ? "Varshava Politexnika (PW) va AGH uchun a'lo daraja" : "Ready for top technical institutes"}
                />
                <OptionBtn
                  field="mathLevel"
                  value="Good"
                  label={isUz ? "Yaxshi (4 baho / Standart algebra va hisob)" : "Good (B Grade / Solid math)"}
                  desc={isUz ? "Dasturlash va muhandislik asoslarini bemalol o'rgana olaman" : "Comfortable with technical coursework"}
                />
                <OptionBtn
                  field="mathLevel"
                  value="Average"
                  label={isUz ? "O'rtacha (3 baho / Matematikadan biroz qiynalaman)" : "Average (C Grade / Prefer less math)"}
                  desc={isUz ? "Biznes, Menejment yoki Gumanitar sohalarga ko'proq mos" : "Better fit for business & humanities"}
                />
                <OptionBtn
                  field="mathLevel"
                  value="SAT Math 600+"
                  label="SAT Math sertifikatim bor (600+ ball)"
                  desc={isUz ? "Xalqaro matematika imtihoni natijasi mavjud" : "Hold official SAT Math score"}
                />
              </div>
            </div>
          )}

          {/* STEP 7: Polish Language */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Polyak tilini bilasizmi?" : "Do you know any Polish?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Polyak tilini B1-B2 darajada bilsangiz, Polsha davlat oliygohlarida mutlaqo BEPUL o'qishingiz mumkin!"
                  : "Proficiency in Polish allows you to study 100% tuition-free at Polish state universities:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="polishLevel"
                  value="None"
                  label={isUz ? "Polyak tilini bilmayman (Ingliz tilida o'qiyman)" : "No Polish (English-taught only)"}
                  desc={isUz ? "Ingliz tilidagi 100% xalqaro dasturlar" : "Full English-medium degrees"}
                />
                <OptionBtn
                  field="polishLevel"
                  value="Basic"
                  label={isUz ? "Boshlang'ich (A1 – A2 / Oddiy so'zlashuv)" : "Basic knowledge (A1-A2)"}
                  desc={isUz ? "Kundalik muloqot va moslashuv uchun foydali" : "Helpful for daily life"}
                />
                <OptionBtn
                  field="polishLevel"
                  value="B1+"
                  label={isUz ? "B1 – B2 daraja (Bepul davlat oliygohlari!)" : "B1-B2 Certified (Free public tuition!)"}
                  desc={isUz ? "Varshava (UW), Yagelloniya (UJ) kabi top universitetlarda tekin o'qish" : "Eligible for free studies in Polish"}
                />
              </div>
            </div>
          )}

          {/* STEP 8: Budget & Target Intake */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Yillik kontrakt byudjetingiz (USD)" : "Annual Tuition Budget (USD)"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Universitet to'lovi uchun yillik qancha byudjet ajratmoqchisiz?"
                  : "Select your expected yearly tuition expenditure:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="budget"
                  value="< 2800"
                  label={isUz ? "$2,800 gacha / yil (Hamyonbop variantlar)" : "Up to $2,800 / year (Affordable)"}
                  desc={isUz ? "WSB Merito, Vistula va tejamkor texnika dasturlari" : "WSB, Vistula, and regional tech colleges"}
                />
                <OptionBtn
                  field="budget"
                  value="2800 - 4400"
                  label={isUz ? "$2,800 – $4,400 / yil (O'rtacha toifa)" : "$2,800 – $4,400 / year (Standard Tier)"}
                  desc={isUz ? "PW, AGH, PWr, UEK, SWPS nufuzli dasturlari" : "Top technical and economics universities"}
                />
                <OptionBtn
                  field="budget"
                  value="> 4400"
                  label={isUz ? "$4,400 dan yuqori (Top xalqaro & Tibbiyot)" : "Above $4,400 / year (Premium & Medicine)"}
                  desc={isUz ? "Kozminski, PJATK, Tibbiyot universiteti (MUW)" : "Triple-accredited business and MD programs"}
                />
              </div>
            </div>
          )}

          {/* STEP 9: International Passport */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
                <Plane className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Xorijga chiqish pasportingiz bormi?" : "Do you have an International Passport?"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Polsha elchixonasi va universitetga ro'yxatdan o'tish uchun qizil pasport talab etiladi:"
                  : "A valid international passport is required for admissions and Schengen visa:"}
              </p>
              <div className="space-y-2.5 pt-2">
                <OptionBtn
                  field="hasPassport"
                  value="Yes"
                  label={isUz ? "Ha, qizil pasportim bor (Amalda)" : "Yes, I have a valid passport"}
                  desc={isUz ? "Hujjat topshirishga to'liq tayyorman" : "Ready to proceed with application"}
                />
                <OptionBtn
                  field="hasPassport"
                  value="No"
                  label={isUz ? "Yo'q, hali olmaganman (Lekin olmoqchiman)" : "No, not yet (Will apply soon)"}
                  desc={isUz ? "Davlat xizmatlari markazidan 10 kunda olish mumkin" : "Can be obtained in 10-14 days"}
                />
              </div>
            </div>
          )}

          {/* STEP 10: Full Name & Contact Phone */}
          {step === 10 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isUz ? "Shaxsiy ma'lumotlaringiz" : "Personal Information"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUz
                  ? "Siz bilan bog'lanish va shaxsiy portalingizni faollashtirish uchun ma'lumotlaringizni tasdiqlang:"
                  : "Confirm your details to activate your student admissions portal:"}
              </p>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {isUz ? "To'liq ism-familiyangiz:" : "Full Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder={isUz ? "Masalan: Alisher Navoiy" : "e.g. John Doe"}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {isUz ? "Telefon raqamingiz:" : "Phone Number:"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {isUz ? "Qachon Polshaga ketmoqchisiz?" : "Target Intake:"}
                  </label>
                  <select
                    value={formData.targetIntake || "2026"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetIntake: e.target.value }))}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="2026">{isUz ? "2026-yil Kuz (Oktyabr qabuli)" : "Fall 2026 (October intake)"}</option>
                    <option value="2027">{isUz ? "2027-yil (Kelgusi yil)" : "2027 Academic Year"}</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || !formData.fullName?.trim() || !formData.phone?.trim()}
                  onClick={handleSubmit}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 mt-4 transition-all shadow-lg shadow-blue-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? isUz
                        ? "Portalingiz tayyorlanmoqda..."
                        : "Preparing your portal..."
                      : isUz
                      ? "Arizani yakunlash va Portalni ochish"
                      : "Complete & Launch Portal"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
