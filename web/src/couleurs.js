// Lit les jetons CSS pour les graphiques (mêmes couleurs en clair et en sombre, pas d'inversion automatique).
export function jetons() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return {
    surface: v('--surface'), texte: v('--texte'), texte2: v('--texte-2'), texte3: v('--texte-3'), grille: v('--grille'),
    series: [v('--serie-1'), v('--serie-2'), v('--serie-3')],
  };
}
