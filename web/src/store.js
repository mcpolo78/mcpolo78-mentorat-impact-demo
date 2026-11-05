import { defineStore } from 'pinia';

async function api(chemin, options) {
  const r = await fetch(`/api${chemin}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const corps = await r.json().catch(() => null);
  if (!r.ok) throw new Error(corps?.message ?? `Erreur ${r.status}`);
  return corps;
}

const requete = (f) => {
  const p = new URLSearchParams();
  if (f.programme) p.set('programme', f.programme);
  if (f.region) p.set('region', f.region);
  return p.toString();
};

export const useMentorat = defineStore('mentorat', {
  state: () => ({
    sante: null,
    filtre: { programme: '', region: '' },
    tableau: null,
    file: { total: 0, jeunes: [] },
    selection: null,
    evenements: [],
    dernierId: 0,
    simulation: true,
    ticks: 0,
    chargement: false,
    enValidation: null,
  }),
  getters: {
    jeuneSelectionne: (s) => s.file.jeunes.find((j) => j.id === s.selection) ?? s.file.jeunes[0] ?? null,
  },
  actions: {
    async demarrer() {
      this.sante = await api('/sante').catch(() => null);
      await Promise.all([this.rafraichir(), this.lireEvenements()]);
    },
    async rafraichir() {
      this.chargement = true;
      try {
        const q = requete(this.filtre);
        const [tableau, file] = await Promise.all([api(`/tableau-de-bord?${q}`), api(`/file-attente?${q}&limite=40`)]);
        this.tableau = tableau;
        this.file = file;
        if (!file.jeunes.some((j) => j.id === this.selection)) this.selection = file.jeunes[0]?.id ?? null;
      } finally {
        this.chargement = false;
      }
    },
    async lireEvenements() {
      const nouveaux = await api(`/evenements?apres=${this.dernierId}`);
      if (!nouveaux.length) return false;
      this.dernierId = nouveaux[nouveaux.length - 1].id;
      this.evenements = [...nouveaux.reverse(), ...this.evenements].slice(0, 40);
      return true;
    },
    async valider(jeuneId, mentorId) {
      this.enValidation = mentorId;
      try {
        const liste = this.file.jeunes;
        const i = liste.findIndex((j) => j.id === jeuneId);
        await api('/binomes', { method: 'POST', body: JSON.stringify({ jeuneId, mentorId }) });
        this.selection = (liste[i + 1] ?? liste[i - 1])?.id ?? null;
        this.file = { total: this.file.total - 1, jeunes: liste.filter((j) => j.id !== jeuneId) };
        await Promise.all([this.lireEvenements(), this.rafraichir()]);
      } finally {
        this.enValidation = null;
      }
    },
    async tick() {
      if (!this.simulation) return;
      await api('/simulation/tick', { method: 'POST' }).catch(() => null);
      // Pause automatique au bout de 5 minutes pour ne pas écrire en continu dans la base.
      if (++this.ticks >= 60) this.simulation = false;
    },
  },
});
