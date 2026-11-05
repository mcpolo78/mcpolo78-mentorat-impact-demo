// Point d'entrée Vercel : toute requête /api/* est réécrite ici (voir vercel.json).
const { creerServeur } = require('../server/dist/bootstrap');

let pret;
module.exports = async (req, res) => {
  pret ??= creerServeur();
  const serveur = await pret;
  return serveur(req, res);
};
