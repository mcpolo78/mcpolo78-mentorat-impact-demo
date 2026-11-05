// Charge le jeu de données fictif dans PostgreSQL (efface les tables de la démo).
const { PrismaClient } = require('@prisma/client');
const { genererEtat } = require('../server/dist/domaine/generer');
const { journalInitial } = require('../server/dist/depot/depot');
const { chargerEtat } = require('../server/dist/depot/prisma');

(async () => {
  const db = new PrismaClient();
  const etat = genererEtat();
  await chargerEtat(db, etat, journalInitial(etat));
  console.log(`[seed] ${etat.jeunes.length} jeunes, ${etat.mentors.length} mentors, ${etat.binomes.length} binômes chargés.`);
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
