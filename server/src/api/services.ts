import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { creerAleatoire } from '../domaine/aleatoire';
import { fileAttente, proposer, scorer, chargeMentors } from '../domaine/appariement';
import { message } from '../domaine/contrats';
import { Filtre, filtrer, tableauDeBord } from '../domaine/indicateurs';
import { tirerAction } from '../domaine/simulation';
import { BusService } from '../bus/bus.service';
import { ConflitError, Depot, DEPOT } from '../depot/depot';

const JOUR = 86_400_000;

@Injectable()
export class MentoratService implements OnModuleInit {
  constructor(@Inject(DEPOT) private readonly depot: Depot, private readonly bus: BusService) {}

  /** Consommateur « journal » : chaque événement du bus est historisé pour le fil en direct. */
  onModuleInit() {
    this.bus.abonner('*', (m) => this.depot.journaliser(m));
  }

  get nature() {
    return this.depot.nature;
  }

  async tableau(f: Filtre) {
    return tableauDeBord(await this.depot.etat(), f);
  }

  async file(f: Filtre, limite: number) {
    const etat = await this.depot.etat();
    const maintenant = Date.now();
    const charge = chargeMentors(etat);
    const file = fileAttente({ ...etat, jeunes: filtrer(etat.jeunes, f) });
    return {
      total: file.length,
      jeunes: file.slice(0, limite).map((j) => ({
        ...j,
        attenteJours: Math.max(0, Math.floor((maintenant - new Date(j.dateEntree).getTime()) / JOUR)),
        propositions: proposer(etat, j, 3, charge),
      })),
    };
  }

  async validerBinome(jeuneId: number, mentorId: number) {
    const etat = await this.depot.etat();
    const jeune = fileAttente(etat).find((j) => j.id === jeuneId);
    const mentor = etat.mentors.find((m) => m.id === mentorId);
    if (!jeune) throw new HttpException('Ce jeune n’est plus en file d’attente', HttpStatus.CONFLICT);
    if (!mentor) throw new HttpException('Mentor introuvable', HttpStatus.NOT_FOUND);
    const { score } = scorer(jeune, mentor, chargeMentors(etat).get(mentor.id) ?? 0);
    try {
      const binome = await this.depot.creerBinome(jeuneId, mentorId, score);
      await this.bus.publier(
        message('binome.cree', `${jeune.prenom} et ${mentor.prenom} forment un binôme (score ${score})`, {
          binomeId: binome.id, jeuneId, mentorId, score, domaine: jeune.domaine, region: jeune.region,
        }),
      );
      return binome;
    } catch (e) {
      if (e instanceof ConflitError) throw new HttpException(e.message, HttpStatus.CONFLICT);
      throw e;
    }
  }

  async evenements(apres: number) {
    return this.depot.evenements(apres, 40);
  }

  /** Un pas de simulation : une action plausible, appliquée puis publiée sur le bus. */
  async tick() {
    const etat = await this.depot.etat();
    const a = creerAleatoire((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    const action = tirerAction(etat, a);
    if (!action) return null;
    await this.depot.appliquer(action);
    const jeune = 'jeuneId' in action ? etat.jeunes.find((j) => j.id === action.jeuneId) : undefined;
    const m =
      action.type === 'jeune.inscrit'
        ? message(action.type, `${action.jeune.prenom} rejoint « ${action.jeune.programme} » (${action.jeune.region})`, {
            programme: action.jeune.programme, region: action.jeune.region, prioritaire: action.jeune.prioritaire,
          })
        : action.type === 'mentor.inscrit'
          ? message(action.type, `${action.mentor.prenom} (${action.mentor.entreprise}) devient mentor en ${action.mentor.domaine}`, {
              domaine: action.mentor.domaine, region: action.mentor.region, capacite: action.mentor.capacite,
            })
          : action.type === 'atelier.suivi'
            ? message(action.type, `${jeune?.prenom} a suivi l’atelier « ${action.atelier} »`, { jeuneId: action.jeuneId, atelier: action.atelier })
            : message(action.type, `${jeune?.prenom} décroche ${action.statut === 'emploi' ? 'un emploi' : 'une formation qualifiante'}`, {
                jeuneId: action.jeuneId, statut: action.statut,
              });
    await this.bus.publier(m);
    return m;
  }
}
