// Modèle métier de la démo. Toutes les données sont fictives et générées.

export const PROGRAMMES = ['Orientation lycée', 'Réussite études', 'Insertion pro'] as const;
export type Programme = (typeof PROGRAMMES)[number];

/** Programmes où un jeune est accompagné par un mentor bénévole. */
export const PROGRAMMES_MENTORAT: Programme[] = ['Réussite études', 'Insertion pro'];

export const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Hauts-de-France',
  "Provence-Alpes-Côte d'Azur",
  'Occitanie',
  'Nouvelle-Aquitaine',
  'Grand Est',
] as const;

export const DOMAINES = ['Numérique', 'Ingénierie', 'Commerce', 'Finance', 'Droit', 'Santé', 'Social', 'Arts & design'] as const;

/** Domaines voisins : un mentor d'un domaine proche reste pertinent. */
export const FAMILLES: string[][] = [
  ['Numérique', 'Ingénierie'],
  ['Commerce', 'Finance', 'Droit'],
  ['Santé', 'Social'],
  ['Arts & design'],
];

export const CRENEAUX = ['Lun. soir', 'Mar. soir', 'Mer. après-midi', 'Jeu. soir', 'Ven. midi', 'Sam. matin'] as const;

export const INTERETS = [
  'Prise de parole',
  'CV et lettre',
  'Réseau pro',
  'Alternance',
  'Entrepreneuriat',
  'Confiance en soi',
  'Méthodes de travail',
  'Entretien',
  'Stage',
  'Mobilité',
] as const;

export type Statut = 'en_parcours' | 'emploi' | 'formation' | 'sans_solution';

export interface Jeune {
  id: number;
  prenom: string;
  programme: Programme;
  domaine: string;
  region: string;
  prioritaire: boolean;
  creneaux: string[];
  interets: string[];
  dateEntree: string; // ISO
  statut: Statut;
  ateliers: number;
}

export interface Mentor {
  id: number;
  prenom: string;
  entreprise: string;
  domaine: string;
  region: string;
  distanciel: boolean;
  creneaux: string[];
  interets: string[];
  capacite: number;
}

export interface Binome {
  id: number;
  jeuneId: number;
  mentorId: number;
  score: number;
  creeLe: string; // ISO
}

export interface Evenement {
  id: number;
  type: string;
  version: number;
  message: string;
  donnees: Record<string, unknown>;
  creeLe: string; // ISO
}

export interface Etat {
  jeunes: Jeune[];
  mentors: Mentor[];
  binomes: Binome[];
}
