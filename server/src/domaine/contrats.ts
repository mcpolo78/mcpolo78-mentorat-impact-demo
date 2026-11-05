// Contrats d'interface des événements publiés sur le bus (versionnés, comme un échange avec l'équipe Data).
export const EVENEMENTS = {
  'binome.cree': 1,
  'jeune.inscrit': 1,
  'atelier.suivi': 1,
  'jeune.insere': 1,
  'mentor.inscrit': 1,
} as const;

export type TypeEvenement = keyof typeof EVENEMENTS;

export interface MessageBus<T = Record<string, unknown>> {
  type: TypeEvenement;
  version: number;
  message: string;
  donnees: T;
  emisLe: string;
}

export function message<T extends Record<string, unknown>>(type: TypeEvenement, texte: string, donnees: T): MessageBus<T> {
  return { type, version: EVENEMENTS[type], message: texte, donnees, emisLe: new Date().toISOString() };
}
