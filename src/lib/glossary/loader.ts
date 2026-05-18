import momcozyJson from '@/data/glossaries/momcozy.json';
import type { Glossary } from '@/types';

export const BUILTIN_GLOSSARIES: Glossary[] = [
  {
    id: 'momcozy',
    isBuiltin: true,
    ...(momcozyJson as Omit<Glossary, 'id' | 'isBuiltin'>),
  },
];

export function loadGlossary(id: string): Glossary | null {
  if (id === 'none' || !id) return null;
  const builtin = BUILTIN_GLOSSARIES.find((g) => g.id === id);
  if (builtin) return builtin;
  // 自定义术语库等第四批接入 IndexedDB
  return null;
}
