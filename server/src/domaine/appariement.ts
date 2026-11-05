// Moteur d'appariement mentor / jeune : un score sur 100, détaillé critère par critère pour rester explicable.
import { Etat, FAMILLES, Jeune, Mentor, PROGRAMMES_MENTORAT } from './types';

export const POIDS = { domaine: 35, region: 25, creneaux: 20, interets: 15, disponibilite: 5 } as const;

export interface Critere {
  cle: keyof typeof POIDS;
  libelle: string;
  points: number;
  max: number;
  detail: string;
}

export interface Proposition {
  mentor: Mentor & { charge: number };
  score: number;
  criteres: Critere[];
}

const famille = (d: string) => FAMILLES.find((f) => f.includes(d)) ?? [d];

export function chargeMentors(etat: Etat): Map<number, number> {
  const charge = new Map<number, number>();
  for (const b of etat.binomes) charge.set(b.mentorId, (charge.get(b.mentorId) ?? 0) + 1);
  return charge;
}

export function scorer(jeune: Jeune, mentor: Mentor, charge: number): { score: number; criteres: Critere[] } {
  const criteres: Critere[] = [];

  const memeDomaine = jeune.domaine === mentor.domaine;
  const voisin = !memeDomaine && famille(jeune.domaine).includes(mentor.domaine);
  criteres.push({
    cle: 'domaine', libelle: 'Domaine', max: POIDS.domaine,
    points: memeDomaine ? POIDS.domaine : voisin ? Math.round(POIDS.domaine * 0.5) : 0,
    detail: memeDomaine ? `Même domaine : ${mentor.domaine}` : voisin ? `Domaine voisin : ${mentor.domaine}` : `Autre domaine : ${mentor.domaine}`,
  });

  const memeRegion = jeune.region === mentor.region;
  criteres.push({
    cle: 'region', libelle: 'Proximité', max: POIDS.region,
    points: memeRegion ? POIDS.region : mentor.distanciel ? Math.round(POIDS.region * 0.6) : 0,
    detail: memeRegion ? `Même région` : mentor.distanciel ? `À distance (${mentor.region})` : `Autre région, pas de distanciel`,
  });

  const communs = jeune.creneaux.filter((c) => mentor.creneaux.includes(c));
  criteres.push({
    cle: 'creneaux', libelle: 'Créneaux', max: POIDS.creneaux,
    points: Math.round((POIDS.creneaux * communs.length) / Math.max(1, jeune.creneaux.length)),
    detail: communs.length ? communs.join(', ') : 'Aucun créneau commun',
  });

  const union = new Set([...jeune.interets, ...mentor.interets]);
  const partages = jeune.interets.filter((i) => mentor.interets.includes(i));
  criteres.push({
    cle: 'interets', libelle: 'Besoins', max: POIDS.interets,
    points: Math.min(POIDS.interets, Math.round((POIDS.interets * partages.length * 2) / Math.max(1, union.size))),
    detail: partages.length ? partages.join(', ') : 'Aucun besoin en commun',
  });

  const libre = Math.max(0, mentor.capacite - charge);
  criteres.push({
    cle: 'disponibilite', libelle: 'Disponibilité', max: POIDS.disponibilite,
    points: Math.round((POIDS.disponibilite * libre) / mentor.capacite),
    detail: `${libre} place${libre > 1 ? 's' : ''} libre${libre > 1 ? 's' : ''} sur ${mentor.capacite}`,
  });

  return { score: criteres.reduce((s, c) => s + c.points, 0), criteres };
}

/** Meilleurs mentors disponibles pour un jeune (mentors complets exclus, hors région sans distanciel exclus). */
export function proposer(etat: Etat, jeune: Jeune, n = 3, charge = chargeMentors(etat)): Proposition[] {
  return etat.mentors
    .filter((m) => (charge.get(m.id) ?? 0) < m.capacite)
    .filter((m) => m.region === jeune.region || m.distanciel)
    .map((m) => {
      const c = charge.get(m.id) ?? 0;
      return { mentor: { ...m, charge: c }, ...scorer(jeune, m, c) };
    })
    .sort((x, y) => y.score - x.score || x.mentor.id - y.mentor.id)
    .slice(0, n);
}

/** Jeunes en programme de mentorat, encore en parcours et sans mentor, du plus ancien au plus récent. */
export function fileAttente(etat: Etat): Jeune[] {
  const avecMentor = new Set(etat.binomes.map((b) => b.jeuneId));
  return etat.jeunes
    .filter((j) => PROGRAMMES_MENTORAT.includes(j.programme) && j.statut === 'en_parcours' && !avecMentor.has(j.id))
    .sort((a, b) => a.dateEntree.localeCompare(b.dateEntree) || a.id - b.id);
}
