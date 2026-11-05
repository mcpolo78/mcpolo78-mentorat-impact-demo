import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MentoratController } from './api/controleurs';
import { MentoratService } from './api/services';
import { BusService } from './bus/bus.service';
import { DEPOT, Depot } from './depot/depot';
import { DepotMemoire } from './depot/memoire';
import { DepotPrisma } from './depot/prisma';

let partage: Depot | undefined;

/** Postgres si DATABASE_URL est défini, sinon données générées en mémoire. */
export function choisirDepot(): Depot {
  if (!partage) partage = process.env.DATABASE_URL ? new DepotPrisma(new PrismaClient()) : new DepotMemoire();
  return partage;
}

@Module({
  controllers: [MentoratController],
  providers: [BusService, MentoratService, { provide: DEPOT, useFactory: choisirDepot }],
})
export class AppModule {}
