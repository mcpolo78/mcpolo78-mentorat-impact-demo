// Jeu de données fictif : prénoms courants + initiale, entreprises inventées, aucune donnée réelle.
import { creerAleatoire, Aleatoire } from './aleatoire';
import {
  CRENEAUX, DOMAINES, Etat, INTERETS, Jeune, Mentor, Programme, REGIONS, Statut,
} from './types';

const PRENOMS = [
  'Inès', 'Yanis', 'Lina', 'Rayan', 'Sarah', 'Adam', 'Aya', 'Nolan', 'Camille', 'Mehdi', 'Léa', 'Ibrahim',
  'Chloé', 'Sofiane', 'Maëlys', 'Hugo', 'Fatou', 'Lucas', 'Manon', 'Moussa', 'Jade', 'Théo', 'Yasmine', 'Enzo',
  'Nour', 'Samuel', 'Imane', 'Kylian', 'Emma', 'Bilal', 'Anaïs', 'Mathis', 'Salomé', 'Amine', 'Louise', 'Wassim',
];
const LETTRES = 'ABCDEFGHJKLMNOPRSTV';
const ENTREPRISES = [
  'Banque Horizon', 'Studio Pixel', 'Clinique des Lilas', 'Énergies Vives', 'Cabinet Ancre', 'Logistique Nova',
  'Assurances Boréal', 'Agence Méridien', 'Rail & Co', 'Atelier Tisserand', 'Hôpital Saint-Rémi', 'Data Lumen',
];
const REGIONS_POIDS: [string, number][] = [
  ['Île-de-France', 34], ['Auvergne-Rhône-Alpes', 16], ['Hauts-de-France', 14], ["Provence-Alpes-Côte d'Azur", 11],
  ['Occitanie', 10], ['Nouvelle-Aquitaine', 8], ['Grand Est', 7],
];
/** Taux d'insertion à 6 mois visé par région : de quoi voir des écarts sur le graphique. */
const INSERTION_REGION: Record<string, number> = {
  'Île-de-France': 0.74, 'Auvergne-Rhône-Alpes': 0.71, 'Hauts-de-France': 0.58, "Provence-Alpes-Côte d'Azur": 0.63,
  Occitanie: 0.66, 'Nouvelle-Aquitaine': 0.69, 'Grand Est': 0.61,
};
const JOUR = 86_400_000;

export function prenomFictif(a: Aleatoire) {
  return `${a.choix(PRENOMS)} ${a.choix([...LETTRES])}.`;
}

export function nouveauJeune(a: Aleatoire, id: number, dateEntree: Date, maintenant: Date): Jeune {
  const programme = a.pondere<Programme>([['Orientation lycée', 40], ['Réussite études', 32], ['Insertion pro', 28]]);
  const region = a.pondere(REGIONS_POIDS);
  const anciennete = (maintenant.getTime() - dateEntree.getTime()) / JOUR;
  let statut: Statut = 'en_parcours';
  if (programme === 'Insertion pro' && anciennete > 100) {
    const p = INSERTION_REGION[region] ?? 0.65;
    const r = a.suivant();
    statut = r < p * 0.72 ? 'emploi' : r < p ? 'formation' : anciennete > 182 ? 'sans_solution' : 'en_parcours';
  }
  return {
    id,
    prenom: prenomFictif(a),
    programme,
    domaine: a.choix(DOMAINES),
    region,
    prioritaire: a.suivant() < 0.76,
    creneaux: a.plusieurs(CRENEAUX, a.entier(1, 3)),
    interets: a.plusieurs(INTERETS, a.entier(2, 4)),
    dateEntree: dateEntree.toISOString(),
    statut,
    ateliers: programme === 'Orientation lycée' ? a.entier(1, 6) : a.entier(0, Math.min(10, Math.floor(anciennete / 25))),
  };
}

export function nouveauMentor(a: Aleatoire, id: number): Mentor {
  return {
    id,
    prenom: prenomFictif(a),
    entreprise: a.choix(ENTREPRISES),
    domaine: a.choix(DOMAINES),
    region: a.pondere(REGIONS_POIDS),
    distanciel: a.suivant() < 0.55,
    creneaux: a.plusieurs(CRENEAUX, a.entier(1, 4)),
    interets: a.plusieurs(INTERETS, a.entier(2, 5)),
    capacite: a.pondere([[1, 3], [2, 4], [3, 2]]),
  };
}

/** Génère l'état initial : ~950 jeunes sur 12 mois, 300 mentors, des binômes déjà formés. */
export function genererEtat(maintenant = new Date(), graine = 2026): Etat {
  const a = creerAleatoire(graine);
  const jeunes: Jeune[] = [];
  let id = 1;
  for (let mois = 11; mois >= 0; mois--) {
    // Saisonnalité : pics à la rentrée et en janvier.
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - mois, 1);
    const m = d.getMonth();
    const volume = 72 + (m === 8 || m === 9 ? 46 : 0) + (m === 0 ? 24 : 0) + (m === 6 || m === 7 ? -30 : 0) + a.entier(-8, 12);
    for (let i = 0; i < volume; i++) {
      const jour = new Date(d.getTime() + a.entier(0, 27) * JOUR + a.entier(8, 18) * 3_600_000);
      if (jour > maintenant) continue;
      jeunes.push(nouveauJeune(a, id++, jour, maintenant));
    }
  }
  const mentors = Array.from({ length: 300 }, (_, i) => nouveauMentor(a, i + 1));

  // Binômes historiques : la plupart des jeunes en mentorat entrés il y a plus de 3 semaines ont un mentor.
  const charge = new Map<number, number>();
  const binomes: Etat['binomes'] = [];
  for (const j of jeunes) {
    if (j.programme === 'Orientation lycée') continue;
    const age = (maintenant.getTime() - new Date(j.dateEntree).getTime()) / JOUR;
    if (age < a.entier(10, 30) || a.suivant() < 0.015) continue;
    const candidats = mentors.filter((m) => (charge.get(m.id) ?? 0) < m.capacite && (m.region === j.region || m.distanciel));
    if (!candidats.length) continue;
    const meme = candidats.filter((m) => m.domaine === j.domaine);
    const m = a.choix(meme.length ? meme : candidats);
    charge.set(m.id, (charge.get(m.id) ?? 0) + 1);
    binomes.push({
      id: binomes.length + 1,
      jeuneId: j.id,
      mentorId: m.id,
      score: a.entier(58, 94),
      creeLe: new Date(new Date(j.dateEntree).getTime() + a.entier(5, 20) * JOUR).toISOString(),
    });
  }
  return { jeunes, mentors, binomes };
}
