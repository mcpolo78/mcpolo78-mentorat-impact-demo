// Générateur pseudo-aléatoire déterministe (mulberry32) : mêmes données à chaque génération.
export function creerAleatoire(graine: number) {
  let a = graine >>> 0;
  const suivant = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entier = (min: number, max: number) => min + Math.floor(suivant() * (max - min + 1));
  const choix = <T>(liste: readonly T[]): T => liste[Math.floor(suivant() * liste.length)];
  const plusieurs = <T>(liste: readonly T[], n: number): T[] => {
    const copie = [...liste];
    const sortie: T[] = [];
    while (sortie.length < n && copie.length) sortie.push(copie.splice(Math.floor(suivant() * copie.length), 1)[0]);
    return sortie;
  };
  const pondere = <T>(options: [T, number][]): T => {
    const total = options.reduce((s, [, p]) => s + p, 0);
    let r = suivant() * total;
    for (const [v, p] of options) {
      r -= p;
      if (r <= 0) return v;
    }
    return options[options.length - 1][0];
  };
  return { suivant, entier, choix, plusieurs, pondere };
}
export type Aleatoire = ReturnType<typeof creerAleatoire>;
