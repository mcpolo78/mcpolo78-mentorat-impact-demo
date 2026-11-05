import { Prisma, PrismaClient } from '@prisma/client';
import { MessageBus } from '../domaine/contrats';
import { Action } from '../domaine/simulation';
import { Binome, Etat, Evenement, Jeune, Programme, Statut } from '../domaine/types';
import { ConflitError, Depot, LIMITE_JOURNAL } from './depot';

const iso = (d: Date) => d.toISOString();

export class DepotPrisma implements Depot {
  readonly nature = 'postgres' as const;
  constructor(private readonly db: PrismaClient) {}

  async etat(): Promise<Etat> {
    const [jeunes, mentors, binomes] = await Promise.all([
      this.db.jeune.findMany({ orderBy: { id: 'asc' } }),
      this.db.mentor.findMany({ orderBy: { id: 'asc' } }),
      this.db.binome.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return {
      jeunes: jeunes.map((j) => ({ ...j, programme: j.programme as Programme, statut: j.statut as Statut, dateEntree: iso(j.dateEntree) })),
      mentors,
      binomes: binomes.map((b) => ({ ...b, creeLe: iso(b.creeLe) })),
    };
  }

  async creerBinome(jeuneId: number, mentorId: number, score: number): Promise<Binome> {
    try {
      const b = await this.db.$transaction(async (tx) => {
        const mentor = await tx.mentor.findUnique({ where: { id: mentorId }, include: { _count: { select: { binomes: true } } } });
        if (!mentor) throw new ConflitError('Mentor introuvable');
        if (mentor._count.binomes >= mentor.capacite) throw new ConflitError('Ce mentor est complet');
        return tx.binome.create({ data: { jeuneId, mentorId, score } });
      });
      return { ...b, creeLe: iso(b.creeLe) };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2003')) {
        throw new ConflitError('Ce jeune a déjà un mentor');
      }
      throw e;
    }
  }

  async appliquer(action: Action): Promise<void> {
    if (action.type === 'jeune.inscrit') {
      const { id: _id, ...j } = action.jeune;
      await this.db.jeune.create({ data: { ...j, dateEntree: new Date(j.dateEntree) } });
    } else if (action.type === 'mentor.inscrit') {
      const { id: _id, ...m } = action.mentor;
      await this.db.mentor.create({ data: m });
    } else if (action.type === 'atelier.suivi') {
      await this.db.jeune.updateMany({ where: { id: action.jeuneId }, data: { ateliers: { increment: 1 } } });
    } else {
      await this.db.jeune.updateMany({ where: { id: action.jeuneId, statut: 'en_parcours' }, data: { statut: action.statut } });
    }
  }

  async journaliser(m: MessageBus): Promise<Evenement> {
    const e = await this.db.evenement.create({
      data: { type: m.type, version: m.version, message: m.message, donnees: m.donnees as Prisma.InputJsonValue, creeLe: new Date(m.emisLe) },
    });
    if (e.id % 25 === 0) await this.db.evenement.deleteMany({ where: { id: { lte: e.id - LIMITE_JOURNAL } } });
    return this.convertir(e);
  }

  async evenements(apres: number, limite: number): Promise<Evenement[]> {
    const lignes = await this.db.evenement.findMany({ where: { id: { gt: apres } }, orderBy: { id: 'desc' }, take: limite });
    return lignes.reverse().map((e) => this.convertir(e));
  }

  private convertir(e: { id: number; type: string; version: number; message: string; donnees: Prisma.JsonValue; creeLe: Date }): Evenement {
    return { ...e, donnees: (e.donnees ?? {}) as Record<string, unknown>, creeLe: iso(e.creeLe) };
  }
}

/** Utilisé par le script de chargement initial. */
export async function chargerEtat(db: PrismaClient, etat: Etat, journal: MessageBus[]) {
  await db.$transaction([
    db.evenement.deleteMany(),
    db.binome.deleteMany(),
    db.jeune.deleteMany(),
    db.mentor.deleteMany(),
    db.jeune.createMany({ data: etat.jeunes.map((j: Jeune) => ({ ...j, dateEntree: new Date(j.dateEntree) })) }),
    db.mentor.createMany({ data: etat.mentors }),
    db.binome.createMany({ data: etat.binomes.map((b) => ({ ...b, creeLe: new Date(b.creeLe) })) }),
    db.evenement.createMany({
      data: journal.map((m) => ({ type: m.type, version: m.version, message: m.message, donnees: m.donnees as Prisma.InputJsonValue, creeLe: new Date(m.emisLe) })),
    }),
  ]);
  // Les identifiants ont été insérés explicitement : on recale les séquences.
  for (const table of ['Jeune', 'Mentor', 'Binome']) {
    await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`);
  }
}
