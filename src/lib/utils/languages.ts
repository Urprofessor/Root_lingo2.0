import languagesData from '@/data/languages.json';
import type { Language } from '@/types';

export const ALL_LANGUAGES: Language[] = languagesData.languages;

export function getLanguage(id: string): Language | undefined {
  return ALL_LANGUAGES.find((lang) => lang.id === id);
}

export function getLanguageLabel(id: string): string {
  return getLanguage(id)?.label || id;
}

export function getLanguageEnLabel(id: string): string {
  return getLanguage(id)?.labelEn || id;
}
