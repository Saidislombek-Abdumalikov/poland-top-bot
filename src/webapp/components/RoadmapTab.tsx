import React, { useMemo } from "react";
import { UserProfile, UniversityItem, Language } from "../types";
import { CheckCircle2, Circle, MapPin, BrainCircuit, GraduationCap, DollarSign, Languages, Wallet, BookOpen } from "lucide-react";
import { triggerHaptic } from "../services/api";

interface RoadmapTabProps {
  user: UserProfile;
  universities: UniversityItem[];
  lang: Language;
}

export const RoadmapTab: React.FC<RoadmapTabProps> = ({ user, universities, lang }) => {
  const isUz = lang === "uz";

  // AI-like Logic to Recommend Universities based on UserProfile
  const recommendedUnis = useMemo(() => {
    let filtered = [...universities];

    // 1. Language constraint
    if (user.polishLevel === "B1+") {
      // Polish B1+ means they can study for FREE at public universities (UW, UJ, PW)
      filtered = filtered.filter(u => 
        u.id === "uw" || u.id === "uj" || u.id === "pw" || u.id === "agh"
      );
    } else {
      // If they don't know Polish, maybe English programs.
      // Private are more flexible, Public need IELTS/Duolingo
      if (user.englishLevel === "None") {
         // No cert yet, recommend private that accept Duolingo or have language year
         filtered = filtered.filter(u => u.id === "kozminski" || u.id === "swps" || u.id === "pjatk");
      }
    }

    // 2. Field of Study constraint
    if (user.preferredField === "IT") {
      filtered = filtered.filter(u => 
        u.id === "pw" || u.id === "agh" || u.id === "pwr" || u.id === "pjatk" || u.id === "uw"
      );
    } else if (user.preferredField === "Business") {
      filtered = filtered.filter(u => 
        u.id === "kozminski" || u.id === "sgh" || u.id === "uek" || u.id === "uw"
      );
    } else if (user.preferredField === "Medicine") {
      filtered = filtered.filter(u => u.id === "uj" || u.id === "uw");
    } else if (user.preferredField === "Engineering") {
      filtered = filtered.filter(u => u.id === "pw" || u.id === "agh" || u.id === "pwr" || u.id === "pg");
    }

    // 3. Budget constraint (if they don't know Polish)
    if (user.polishLevel !== "B1+" && user.budget === "< 2500") {
      filtered = filtered.filter(u => 
        !u.tuitionRange.includes("4,") && !u.tuitionRange.includes("5,") && !u.tuitionRange.includes("6,")
      );
    }

    // Fallback if too strict
    if (filtered.length === 0) {
      filtered = universities.slice(0, 3);
    }

    return filtered.slice(0, 3); // Top 3 recommendations
  }, [user, universities]);

  // Generate Steps
  const steps = useMemo(() => {
    const arr = [];
    
    // Step 1: Passport
    if (user.hasPassport === "No") {
      arr.push({
        title: isUz ? "Xorijga chiqish pasportini oling" : "Get your International Passport",
        desc: isUz ? "Davlat xizmatlari markazidan (Zagran) pasportga ariza bering." : "Apply for your red passport at the nearest registry.",
        icon: MapPin,
        done: false
      });
    } else {
      arr.push({
        title: isUz ? "Pasport tayyor" : "Passport Ready",
        desc: isUz ? "Sizda xorijga chiqish pasporti mavjud." : "You already have your passport.",
        icon: CheckCircle2,
        done: true
      });
    }

    // Step 2: Language
    if (user.polishLevel === "B1+") {
      arr.push({
        title: isUz ? "Polyak tili B1+" : "Polish Language B1+",
        desc: isUz ? "Zo'r! Davlat universitetlarida BEPUL o'qish imkoniyatingiz bor." : "Great! You can study for FREE at public universities.",
        icon: Languages,
        done: true
      });
    } else if (user.englishLevel === "None") {
      arr.push({
        title: isUz ? "Ingliz tili sertifikati" : "English Certificate",
        desc: isUz ? "Tezroq IELTS yoki Duolingo topshirishingiz kerak." : "You need to pass IELTS or Duolingo as soon as possible.",
        icon: BookOpen,
        done: false
      });
    } else {
      arr.push({
        title: isUz ? "Til sertifikati tayyor" : "Language Cert Ready",
        desc: isUz ? `${user.englishLevel} sertifikatingiz qabul uchun yetarli.` : `Your ${user.englishLevel} is sufficient for admission.`,
        icon: CheckCircle2,
        done: true
      });
    }

    // Step 3: Math/SAT
    if (user.preferredField === "IT" || user.preferredField === "Engineering") {
      if (user.mathLevel !== "Excellent" && user.hasSat !== "Yes") {
        arr.push({
          title: isUz ? "Matematika / SAT" : "Math / SAT",
          desc: isUz ? "Muhandislik/IT uchun matematikka urg'u bering yoki SAT topshiring." : "Focus on Math or pass SAT for IT/Engineering.",
          icon: BrainCircuit,
          done: false
        });
      }
    }

    // Step 4: Budget
    if (user.budget === "< 2500" && user.polishLevel !== "B1+") {
      arr.push({
        title: isUz ? "Byudjetni rejalashtirish" : "Budget Planning",
        desc: isUz ? "Yillik €2500 dan kam narxli universitetlarni ko'rib chiqamiz." : "We will look for universities under €2500/year.",
        icon: Wallet,
        done: true
      });
    }

    // Final Step
    arr.push({
      title: isUz ? "Hujjatlarni portalga yuklash" : "Upload Documents to Portal",
      desc: isUz ? "Attestat va pasportingizni 'Hujjatlar' bo'limiga yuklang." : "Upload your diploma and passport in the Documents tab.",
      icon: GraduationCap,
      done: false
    });

    return arr;
  }, [user, isUz]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit className="w-6 h-6 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              {isUz ? "AI Tahlili" : "AI Analysis"}
            </span>
          </div>
          <h2 className="text-2xl font-black leading-tight mb-2">
            {isUz ? `Salom, ${user.firstName || 'Talaba'}!` : `Hello, ${user.firstName || 'Student'}!`}
          </h2>
          <p className="text-sm text-blue-100/80 leading-relaxed">
            {isUz 
              ? "Sizning ma'lumotlaringiz asosida maxsus yo'l xaritasi va eng mos oliygohlar ro'yxatini tuzdik." 
              : "We've built a personalized roadmap and university recommendations based on your profile."}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black text-slate-900 mb-4 px-2">
          {isUz ? "Siz uchun mos oliygohlar" : "Top Matches for You"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedUnis.map((u, idx) => (
            <div key={u.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  #{idx + 1}
                </div>
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1 pr-10">{u.name}</h4>
              <p className="text-xs text-slate-500 font-medium mb-3">{u.city}</p>
              
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 py-1.5 px-3 rounded-xl w-fit">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                {u.tuitionRange}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2">
        <h3 className="text-lg font-black text-slate-900 mb-6">
          {isUz ? "Shaxsiy Yo'l Xaritasi (Roadmap)" : "Your Personal Roadmap"}
        </h3>
        
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-300 before:to-slate-200">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-8">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3 fill-current" />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${step.done ? 'text-emerald-500' : 'text-blue-500'}`} />
                    <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
          
        </div>
      </div>

    </div>
  );
};
