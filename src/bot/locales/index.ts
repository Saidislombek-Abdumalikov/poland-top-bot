import { Language } from "../types";
import { en } from "./en";
import { uz } from "./uz";

export const translations = { en, uz };

export function t(lang: Language, key: keyof typeof en, params?: Record<string, string | number>): string {
  const currentLang = lang || "en";
  let text = translations[currentLang]?.[key] || translations.en[key] || String(key);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }

  return text;
}
