# Passerelle · impact & mentorat (démo)

Démo full-stack d'un outil interne pour une association d'égalité des chances : un **tableau de bord d'impact**
(jeunes accompagnés, part de jeunes prioritaires, binômes, insertion à 6 mois) et un **moteur d'appariement
mentor / jeune** au score explicable. **Toutes les données sont fictives** (prénoms + initiale, entreprises inventées).

## Ce que montre la démo

- **API NestJS 10** (`server/src`) : contrôleur, service, garde de limitation de débit, injection d'un port de persistance.
  Routes : `/api/sante`, `/api/tableau-de-bord`, `/api/file-attente`, `POST /api/binomes`, `/api/evenements`, `POST /api/simulation/tick`.
- **Moteur d'appariement** (`server/src/domaine/appariement.ts`) : score sur 100 = domaine (35, domaine voisin 50 %),
  proximité (25, distanciel 60 %), créneaux communs (20), besoins partagés (15), places libres (5).
  Mentors complets et mentors hors région sans distanciel exclus. Chaque critère est affiché avec son explication.
- **Indicateurs d'impact** (`server/src/domaine/indicateurs.ts`) : inscriptions mensuelles par programme,
  insertion à 6 mois (emploi ou formation) par région, file d'attente et délai moyen, filtres programme / région.
- **Bus d'événements** (`server/src/bus`) : événements **versionnés** (`binome.cree.v1`, `jeune.inscrit.v1`…)
  décrits dans `domaine/contrats.ts`, publiés puis consommés par le journal (fil en direct).
  Même contrat qu'un échange RabbitMQ : seul l'adaptateur change.
- **Prisma + PostgreSQL** (`prisma/schema.prisma`, `server/src/depot`) : deux adaptateurs derrière le même port,
  Postgres si `DATABASE_URL` est défini, sinon données générées en mémoire. Création de binôme en transaction,
  contrainte d'unicité pour éviter un double appariement.
- **Front Vue 3 + Quasar + Pinia** (`web/src`) : tableau de bord sur un seul écran, graphiques Chart.js,
  transitions douces, thème clair / sombre, simulation d'activité (pause automatique après 5 minutes).
- **Qualité** : 13 tests (`node --test`) sur le domaine et l'API de bout en bout, CI GitHub Actions, `docker-compose` pour Postgres.

## Lancer en local

```bash
npm install
npm run dev            # API NestJS sur :3001 + Vite sur :5173 (données en mémoire)
npm test               # tests du domaine et de l'API
```

Avec Postgres :

```bash
docker compose up -d
export DATABASE_URL=postgresql://demo:demo@localhost:5432/mentorat
npm run db:push && npm run build:server && npm run db:seed
npm run dev
```

## Déploiement

Vercel : le front est construit par Vite (`dist/`), l'API NestJS est compilée par `tsc` (`server/dist`)
et servie par la fonction `api/index.js`. Au build, `scripts/preparer-base.js` synchronise le schéma et recharge
les données fictives si une base est branchée (Neon via Vercel > Storage).
