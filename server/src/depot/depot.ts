// Port de persistance : deux adaptateurs (Postgres via Prisma, ou mémoire si aucune base n'est branchée).
import { Action } from '../domaine/simulation';
import { MessageBus } from '../domaine/contrats';
import { Binome, Etat, Evenement } from '../domaine/types';

export const DEPOT = Symbol('DEPOT');

export class ConflitError extends Error {}

export interface Depot {
  readonly nature: 'postgres' | 'memoire';
  etat(): Promise<Etat>;
  creerBinome(jeuneId: number, mentorId: number, score: number): Promise<Binome>;
  appliquer(action: Action): Promise<void>;
  journaliser(m: MessageBus): Promise<Evenement>;
  evenements(apres: number, limite: number): Promise<Evenement[]>;
}

export const LIMITE_JOURNAL = 300;

/** Quelques événements de départ, pour que le fil ne soit pas vide à l'ouverture. */
export function journalInitial(etat: Etat): MessageBus[] {
  const mentors = new Map(etat.mentors.map((m) => [m.id, m]));
  const jeunes = new Map(etat.jeunes.map((j) => [j.id, j]));
  return [...etat.binomes]
    .sort((a, b) => a.creeLe.localeCompare(b.creeLe))
    .slice(-8)
    .map((b) => ({
      type: 'binome.cree' as const,
      version: 1,
      message: `${jeunes.get(b.jeuneId)?.prenom} et ${mentors.get(b.mentorId)?.prenom} forment un binôme`,
      donnees: { jeuneId: b.jeuneId, mentorId: b.mentorId, score: b.score },
      emisLe: b.creeLe,
    }));
}
