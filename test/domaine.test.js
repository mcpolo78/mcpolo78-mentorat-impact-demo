const test = require('node:test');
const assert = require('node:assert/strict');
const { genererEtat } = require('../server/dist/domaine/generer');
const { scorer, proposer, fileAttente, POIDS } = require('../server/dist/domaine/appariement');
const { tableauDeBord, tauxInsertion } = require('../server/dist/domaine/indicateurs');
const { tirerAction, PLAFOND_JEUNES } = require('../server/dist/domaine/simulation');
const { creerAleatoire } = require('../server/dist/domaine/aleatoire');

const maintenant = new Date('2026-11-05T12:00:00Z');
const etat = genererEtat(maintenant);

const jeune = { id: 1, prenom: 'Test T.', programme: 'Insertion pro', domaine: 'Numérique', region: 'Grand Est', prioritaire: true,
  creneaux: ['Lun. soir', 'Sam. matin'], interets: ['CV et lettre', 'Entretien'], dateEntree: maintenant.toISOString(), statut: 'en_parcours', ateliers: 0 };
const mentor = { id: 1, prenom: 'Mentor M.', entreprise: 'X', domaine: 'Numérique', region: 'Grand Est', distanciel: false,
  creneaux: ['Lun. soir', 'Sam. matin'], interets: ['CV et lettre', 'Entretien'], capacite: 2 };

test('les données générées sont déterministes', () => {
  assert.deepEqual(genererEtat(maintenant), etat);
  assert.ok(etat.jeunes.length > 700 && etat.mentors.length === 300);
});

test('un mentor idéal obtient 100 points', () => {
  const { score, criteres } = scorer(jeune, mentor, 0);
  assert.equal(score, 100);
  assert.equal(criteres.reduce((s, c) => s + c.max, 0), Object.values(POIDS).reduce((a, b) => a + b, 0));
});

test('domaine voisin et distanciel donnent des points partiels', () => {
  const { criteres } = scorer(jeune, { ...mentor, domaine: 'Ingénierie', region: 'Occitanie', distanciel: true }, 1);
  const pts = Object.fromEntries(criteres.map((c) => [c.cle, c.points]));
  assert.equal(pts.domaine, 18);
  assert.equal(pts.region, 15);
  assert.ok(pts.disponibilite < POIDS.disponibilite);
});

test('les propositions excluent les mentors complets et hors région sans distanciel', () => {
  const j = fileAttente(etat)[0];
  const props = proposer(etat, j);
  assert.ok(props.length > 0 && props.length <= 3);
  for (const p of props) {
    assert.ok(p.mentor.charge < p.mentor.capacite);
    assert.ok(p.mentor.region === j.region || p.mentor.distanciel);
  }
  assert.ok(props.every((p, i) => i === 0 || props[i - 1].score >= p.score));
});

test('la file d’attente ne contient que des jeunes en mentorat sans binôme', () => {
  const avecMentor = new Set(etat.binomes.map((b) => b.jeuneId));
  for (const j of fileAttente(etat)) {
    assert.notEqual(j.programme, 'Orientation lycée');
    assert.ok(!avecMentor.has(j.id));
  }
});

test('le tableau de bord respecte les filtres', () => {
  const tout = tableauDeBord(etat, {}, maintenant);
  const ins = tableauDeBord(etat, { programme: 'Insertion pro' }, maintenant);
  assert.ok(ins.indicateurs.jeunesSuivis < tout.indicateurs.jeunesSuivis);
  assert.equal(ins.inscriptions.parProgramme['Orientation lycée'].reduce((a, b) => a + b, 0), 0);
  assert.equal(tout.inscriptions.mois.length, 12);
  assert.ok(tout.indicateurs.insertion6Mois > 0 && tout.indicateurs.insertion6Mois <= 100);
});

test('le taux d’insertion ne compte que les jeunes entrés depuis 6 mois', () => {
  const recent = { ...jeune, statut: 'emploi' };
  assert.equal(tauxInsertion([recent], maintenant).eligibles, 0);
  const ancien = { ...recent, dateEntree: '2026-01-01T00:00:00Z' };
  assert.deepEqual(tauxInsertion([ancien], maintenant), { taux: 100, eligibles: 1, inseres: 1 });
});

test('la simulation respecte le plafond d’inscriptions', () => {
  const plein = { ...etat, jeunes: Array.from({ length: PLAFOND_JEUNES }, (_, i) => ({ ...jeune, id: i + 1 })) };
  const a = creerAleatoire(1);
  for (let i = 0; i < 50; i++) assert.notEqual(tirerAction(plein, a, maintenant)?.type, 'jeune.inscrit');
});
