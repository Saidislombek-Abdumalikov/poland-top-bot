import { InlineKeyboard, Keyboard } from "grammy";
import { Language } from "../types";
import { config } from "../config";

export function getPhoneRequestKeyboard(lang: Language): Keyboard {
  const isUz = lang === "uz";
  return new Keyboard()
    .requestContact(isUz ? "📱 Telefon raqamni yuborish" : "📱 Share Phone Number")
    .resized()
    .oneTime();
}

export function getMainMenuKeyboard(lang: Language, userId?: number): InlineKeyboard {
  const isUz = lang === "uz";
  const baseUrl = config.webappUrl || "https://poland-top-bot.onrender.com";
  const webappUrl = userId ? `${baseUrl}?userId=${userId}` : baseUrl;

  return new InlineKeyboard()
    .webApp(isUz ? "🚀 Portalga Kirish" : "🚀 Open Student Portal", webappUrl)
    .row()
    .text(isUz ? "📄 Ommaviy Oferta" : "📄 Terms & Oferta", "menu_oferta")
    .url(isUz ? "💬 Maslahatchi" : "💬 Advisor", `https://t.me/${config.advisorUsername}`);
}

export function getLanguageInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🇬🇧 English", "set_lang_en")
    .text("🇺🇿 O'zbekcha", "set_lang_uz");
}

export function getOnboardingLanguageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🇬🇧 English", "onboarding_lang_en")
    .text("🇺🇿 O'zbekcha", "onboarding_lang_uz");
}

export function getOnboardingDegreeKeyboard(lang: Language): InlineKeyboard {
  return new InlineKeyboard()
    .text("🎓 Bachelor's (BSc / BA)", "onboarding_level_Bachelor")
    .row()
    .text("🎓 Master's (MSc / MA)", "onboarding_level_Master")
    .row()
    .text("🏥 Medicine / Pharmacy (MD)", "onboarding_level_PhD")
    .row()
    .text("💼 MBA / Postgraduate", "onboarding_level_MBA");
}

export function getOfertaKeyboard(lang: Language = "uz"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard().text(isUz ? "✅ Roziman" : "✅ I Agree", "accept_oferta");
}

export function getOfertaViewKeyboard(lang: Language = "uz"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard().text(isUz ? "◀️ Asosiy Menyu" : "◀️ Main Menu", "go_main_menu");
}
