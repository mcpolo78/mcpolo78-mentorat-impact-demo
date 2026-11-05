import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { PROGRAMMES, REGIONS } from '../domaine/types';
import { Filtre } from '../domaine/indicateurs';
import { LimiteurGuard } from './limiteur.guard';
import { MentoratService } from './services';

function filtre(programme?: string, region?: string): Filtre {
  if (programme && !(PROGRAMMES as readonly string[]).includes(programme)) throw new BadRequestException('Programme inconnu');
  if (region && !(REGIONS as readonly string[]).includes(region)) throw new BadRequestException('Région inconnue');
  return { programme: programme || undefined, region: region || undefined };
}

function entier(v: unknown, nom: string) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new BadRequestException(`${nom} invalide`);
  return n;
}

@Controller()
export class MentoratController {
  constructor(private readonly service: MentoratService) {}

  @Get('sante')
  sante() {
    return { ok: true, base: this.service.nature, bus: 'memoire', programmes: PROGRAMMES, regions: REGIONS };
  }

  @Get('tableau-de-bord')
  tableau(@Query('programme') programme?: string, @Query('region') region?: string) {
    return this.service.tableau(filtre(programme, region));
  }

  @Get('file-attente')
  file(@Query('programme') programme?: string, @Query('region') region?: string, @Query('limite') limite = '30') {
    return this.service.file(filtre(programme, region), Math.min(60, entier(limite, 'limite')));
  }

  @Post('binomes')
  @UseGuards(LimiteurGuard)
  valider(@Body() corps: { jeuneId?: unknown; mentorId?: unknown }) {
    return this.service.validerBinome(entier(corps?.jeuneId, 'jeuneId'), entier(corps?.mentorId, 'mentorId'));
  }

  @Get('evenements')
  evenements(@Query('apres') apres = '0') {
    return this.service.evenements(entier(apres, 'apres'));
  }

  @Post('simulation/tick')
  @HttpCode(200)
  @UseGuards(LimiteurGuard)
  tick() {
    return this.service.tick();
  }
}
