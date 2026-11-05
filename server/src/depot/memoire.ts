import { genererEtat } from '../domaine/generer';
import { MessageBus } from '../domaine/contrats';
import { Action } from '../domaine/simulation';
import { Binome, Etat, Evenement } from '../domaine/types';
import { ConflitError, Depot, journalInitial, LIMITE_JOURNAL } from './depot';

export class DepotMemoire implements Depot {
  readonly nature = 'memoire' as const;
  private donnees: Etat;
  private journal: Evenement[] = [];
  private suivant = 1;

  constructor(etat: Etat = genererEtat()) {
    this.donnees = etat;
    for (const m of journalInitial(etat)) this.ajouter(m);
  }

  async etat(): Promise<Etat> {
    return structuredClone(this.donnees);
  }

  async creerBinome(jeuneId: number, mentorId: number, score: number): Promise<Binome> {
    const { jeunes, mentors, binomes } = this.donnees;
    const jeune = jeunes.find((j) => j.id === jeuneId);
    const mentor = mentors.find((m) => m.id === mentorId);
    if (!jeune || !mentor) throw new ConflitError('Jeune ou mentor introuvable');
    if (binomes.some((b) => b.jeuneId === jeuneId)) throw new ConflitError('Ce jeune a déjà un mentor');
    if (binomes.filter((b) => b.mentorId === mentorId).length >= mentor.capacite) throw new ConflitError('Ce mentor est complet');
    const binome = { id: Math.max(0, ...binomes.map((b) => b.id)) + 1, jeuneId, mentorId, score, creeLe: new Date().toISOString() };
    binomes.push(binome);
    return binome;
  }

  async appliquer(action: Action): Promise<void> {
    const { jeunes, mentors } = this.donnees;
    if (action.type === 'jeune.inscrit') jeunes.push(action.jeune);
    else if (action.type === 'mentor.inscrit') mentors.push(action.mentor);
    else {
      const j = jeunes.find((x) => x.id === action.jeuneId);
      if (!j) return;
      if (action.type === 'atelier.suivi') j.ateliers++;
      else j.statut = action.statut;
    }
  }

  async journaliser(m: MessageBus): Promise<Evenement> {
    return this.ajouter(m);
  }

  async evenements(apres: number, limite: number): Promise<Evenement[]> {
    return this.journal.filter((e) => e.id > apres).slice(-limite);
  }

  private ajouter(m: MessageBus): Evenement {
    const e = { id: this.suivant++, type: m.type, version: m.version, message: m.message, donnees: m.donnees, creeLe: m.emisLe };
    this.journal.push(e);
    if (this.journal.length > LIMITE_JOURNAL) this.journal.splice(0, this.journal.length - LIMITE_JOURNAL);
    return e;
  }
}
