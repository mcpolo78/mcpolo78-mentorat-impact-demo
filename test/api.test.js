// Test de bout en bout de l'API NestJS (mode mémoire).
const test = require('node:test');
const assert = require('node:assert/strict');

delete process.env.DATABASE_URL;
const { creerServeur } = require('../server/dist/bootstrap');

let base;
let http;
test.before(async () => {
  const app = await creerServeur();
  await new Promise((ok) => (http = app.listen(0, ok)));
  base = `http://127.0.0.1:${http.address().port}/api`;
});
test.after(() => http.close());

const get = (c) => fetch(base + c).then(async (r) => ({ status: r.status, corps: await r.json() }));
const post = (c, corps) =>
  fetch(base + c, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps ?? {}) })
    .then(async (r) => ({ status: r.status, corps: await r.json().catch(() => null) }));

test('santé en mode mémoire', async () => {
  const { corps } = await get('/sante');
  assert.equal(corps.base, 'memoire');
});

test('filtre inconnu refusé', async () => {
  assert.equal((await get('/tableau-de-bord?programme=Inconnu')).status, 400);
});

test('valider un binôme le retire de la file et publie un événement', async () => {
  const file = (await get('/file-attente?limite=5')).corps;
  const j = file.jeunes[0];
  const avant = (await get('/tableau-de-bord')).corps.indicateurs.binomesActifs;
  const r = await post('/binomes', { jeuneId: j.id, mentorId: j.propositions[0].mentor.id });
  assert.equal(r.status, 201);
  assert.equal(r.corps.score, j.propositions[0].score);
  const apres = (await get('/tableau-de-bord')).corps.indicateurs.binomesActifs;
  assert.equal(apres, avant + 1);
  const evts = (await get('/evenements?apres=0')).corps;
  assert.equal(evts.at(-1).type, 'binome.cree');
  // Deuxième validation pour le même jeune : conflit.
  assert.equal((await post('/binomes', { jeuneId: j.id, mentorId: j.propositions[1].mentor.id })).status, 409);
});

test('corps invalide refusé', async () => {
  assert.equal((await post('/binomes', { jeuneId: 'abc' })).status, 400);
});

test('un pas de simulation produit un événement versionné', async () => {
  const r = await post('/simulation/tick');
  assert.equal(r.status, 200);
  assert.match(r.corps.type, /^(jeune|atelier|mentor)\./);
  assert.equal(r.corps.version, 1);
});
