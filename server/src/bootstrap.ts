import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

/** Construit l'application NestJS sur une instance Express (réutilisée par la fonction Vercel). */
export async function creerServeur() {
  const serveur = express();
  serveur.disable('x-powered-by');
  const app = await NestFactory.create(AppModule, new ExpressAdapter(serveur), { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');
  await app.init();
  return serveur;
}
