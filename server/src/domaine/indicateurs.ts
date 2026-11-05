// Indicateurs d'impact du tableau de bord, calculés à partir de l'état (filtrable par programme et région).
import { fileAttente } from './appariement';
import { Etat, Jeune, PROGRAMMES, REGIONS } from './types';

export interface Filtre {
  programme?: string;
  region?: string;
}

const JOUR = 86_400_000;
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function filtrer(jeunes: Jeune[], f: Filtre) {
  return jeunes.filter((j) => (!f.programme || j.programme === f.programme) && (!f.region || j.region === f.region));
}

const pourcent = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : 0);

/** Insertion à 6 mois : jeunes du programme Insertion pro entrés depuis au moins 182 jours, en emploi ou en formation. */
export function tauxInsertion(jeunes: Jeune[], maintenant: Date) {
  const eligibles = jeunes.filter(
    (j) => j.programme === 'Insertion pro' && maintenant.getTime() - new Date(j.dateEntree).getTime() >= 182 * JOUR,
  );
  const inseres = eligibles.filter((j) => j.statut === 'emploi' || j.statut === 'formation');
  return { taux: pourcent(inseres.length, eligibles.length), eligibles: eligibles.length, inseres: inseres.length };
}

export function tableauDeBord(etat: Etat, f: Filtre, maintenant = new Date()) {
  const jeunes = filtrer(etat.jeunes, f);
  const ids = new Set(jeunes.map((j) => j.id));
  const binomes = etat.binomes.filter((b) => ids.has(b.jeuneId));
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const insertion = tauxInsertion(jeunes, maintenant);

  // Inscriptions par mois et par programme, sur 12 mois glissants.
  const mois = Array.from({ length: 12 }, (_, i) => new Date(maintenant.getFullYear(), maintenant.getMonth() - 11 + i, 1));
  const cleMois = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const index = new Map(mois.map((d, i) => [cleMois(d), i]));
  const parProgramme = Object.fromEntries(PROGRAMMES.map((p) => [p, new Array(12).fill(0)])) as Record<string, number[]>;
  for (const j of jeunes) {
    const i = index.get(cleMois(new Date(j.dateEntree)));
    if (i !== undefined) parProgramme[j.programme][i]++;
  }

  // Insertion à 6 mois par région (le filtre région ne s'applique pas ici, pour garder la comparaison).
  const pourRegions = filtrer(etat.jeunes, { programme: f.programme });
  const regions = REGIONS.map((r) => ({ region: r, ...tauxInsertion(pourRegions.filter((j) => j.region === r), maintenant) }))
    .filter((r) => r.eligibles > 0)
    .sort((a, b) => b.taux - a.taux);

  const file = fileAttente({ ...etat, jeunes });
  return {
    genereLe: maintenant.toISOString(),
    indicateurs: {
      jeunesSuivis: jeunes.length,
      nouveauxCeMois: jeunes.filter((j) => new Date(j.dateEntree) >= debutMois).length,
      partPrioritaires: pourcent(jeunes.filter((j) => j.prioritaire).length, jeunes.length),
      binomesActifs: binomes.length,
      binomesCeMois: binomes.filter((b) => new Date(b.creeLe) >= debutMois).length,
      insertion6Mois: insertion.taux,
      insertionBase: insertion.eligibles,
      fileAttente: file.length,
      attenteMoyenneJours: file.length
        ? Math.round(file.reduce((s, j) => s + (maintenant.getTime() - new Date(j.dateEntree).getTime()) / JOUR, 0) / file.length)
        : 0,
      ateliersSuivis: jeunes.reduce((s, j) => s + j.ateliers, 0),
    },
    inscriptions: { mois: mois.map((d) => MOIS_COURTS[d.getMonth()]), parProgramme },
    insertionParRegion: regions,
  };
}
