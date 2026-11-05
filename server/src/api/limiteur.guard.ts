import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/** Limite simple des écritures par adresse IP (démo publique) : 40 requêtes par minute. */
@Injectable()
export class LimiteurGuard implements CanActivate {
  private static readonly compteurs = new Map<string, { debut: number; n: number }>();

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const ip = String(req.headers['x-forwarded-for'] ?? req.ip ?? '?').split(',')[0].trim();
    const maintenant = Date.now();
    const c = LimiteurGuard.compteurs.get(ip);
    if (!c || maintenant - c.debut > 60_000) {
      LimiteurGuard.compteurs.set(ip, { debut: maintenant, n: 1 });
      if (LimiteurGuard.compteurs.size > 5000) LimiteurGuard.compteurs.clear();
      return true;
    }
    if (++c.n > 40) throw new HttpException('Trop de requêtes, réessayez dans une minute', HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
