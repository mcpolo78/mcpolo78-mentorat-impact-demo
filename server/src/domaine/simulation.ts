// Simulation d'activité : un « tick » produit un événement plausible (inscription, atelier, insertion, nouveau mentor).
import { Aleatoire } from './aleatoire';
import { nouveauJeune, nouveauMentor } from './generer';
import { Etat, Jeune, Mentor } from './types';

export const PLAFOND_JEUNES = 1400;
export const PLAFOND_MENTORS = 380;

export type Action =
  | { type: 'jeune.inscrit'; jeune: Jeune }
  | { type: 'atelier.suivi'; jeuneId: number; atelier: string }
  | { type: 'jeune.insere'; jeuneId: number; statut: 'emploi' | 'formation' }
  | { type: 'mentor.inscrit'; mentor: Mentor };

const ATELIERS = ['Pitch et prise de parole', 'Découverte des métiers', 'CV express', 'Simulation d\'entretien', 'Visite d\'entreprise', 'Gestion du stress'];
const JOUR = 86_400_000;

export function tirerAction(etat: Etat, a: Aleatoire, maintenant = new Date()): Action | null {
  const type = a.pondere<Action['type']>([['jeune.inscrit', 38], ['atelier.suivi', 32], ['jeune.insere', 18], ['mentor.inscrit', 12]]);
  if (type === 'jeune.inscrit' && etat.jeunes.length < PLAFOND_JEUNES) {
    const id = Math.max(0, ...etat.jeunes.map((j) => j.id)) + 1;
    return { type, jeune: nouveauJeune(a, id, maintenant, maintenant) };
  }
  if (type === 'mentor.inscrit' && etat.mentors.length < PLAFOND_MENTORS) {
    const id = Math.max(0, ...etat.mentors.map((m) => m.id)) + 1;
    return { type, mentor: nouveauMentor(a, id) };
  }
  if (type === 'jeune.insere') {
    const candidats = etat.jeunes.filter(
      (j) => j.programme === 'Insertion pro' && j.statut === 'en_parcours' && maintenant.getTime() - new Date(j.dateEntree).getTime() > 60 * JOUR,
    );
    if (candidats.length) return { type, jeuneId: a.choix(candidats).id, statut: a.suivant() < 0.7 ? 'emploi' : 'formation' };
  }
  const actifs = etat.jeunes.filter((j) => j.statut === 'en_parcours');
  if (!actifs.length) return null;
  return { type: 'atelier.suivi', jeuneId: a.choix(actifs).id, atelier: a.choix(ATELIERS) };
}
