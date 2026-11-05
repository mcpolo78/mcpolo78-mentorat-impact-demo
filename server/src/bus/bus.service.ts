import { Injectable, Logger } from '@nestjs/common';
import { MessageBus, TypeEvenement } from '../domaine/contrats';

type Abonne = (m: MessageBus) => Promise<unknown> | unknown;

/**
 * Bus d'événements en mémoire, au même contrat qu'un échange RabbitMQ (type versionné + charge utile).
 * `publier` attend la fin des consommateurs : en serverless, rien ne doit tourner après la réponse HTTP.
 * Pour passer à RabbitMQ, il suffit de remplacer cette classe par un adaptateur amqplib (publish / consume).
 */
@Injectable()
export class BusService {
  private readonly log = new Logger('Bus');
  private readonly abonnes = new Map<string, Abonne[]>();

  abonner(type: TypeEvenement | '*', abonne: Abonne) {
    this.abonnes.set(type, [...(this.abonnes.get(type) ?? []), abonne]);
  }

  async publier(m: MessageBus) {
    const cibles = [...(this.abonnes.get(m.type) ?? []), ...(this.abonnes.get('*') ?? [])];
    const resultats = await Promise.allSettled(cibles.map((a) => a(m)));
    for (const r of resultats) if (r.status === 'rejected') this.log.error(`${m.type} : ${r.reason}`);
  }
}
