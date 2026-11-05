<script setup>
import { computed } from 'vue';
import { outlinedGroups, outlinedVolunteerActivism, outlinedHandshake, outlinedWork } from '@quasar/extras/material-icons-outlined';
import { useMentorat } from '../store';

const store = useMentorat();
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const cartes = computed(() => {
  const i = store.tableau?.indicateurs;
  if (!i) return [];
  return [
    { icone: outlinedGroups, libelle: 'Jeunes accompagnés', valeur: nf.format(i.jeunesSuivis), detail: `+${i.nouveauxCeMois} ce mois · ${nf.format(i.ateliersSuivis)} ateliers suivis` },
    { icone: outlinedVolunteerActivism, libelle: 'Jeunes prioritaires', valeur: `${nf.format(i.partPrioritaires)} %`, detail: 'issus de milieux populaires', jauge: i.partPrioritaires },
    { icone: outlinedHandshake, libelle: 'Binômes actifs', valeur: nf.format(i.binomesActifs), detail: `+${i.binomesCeMois} ce mois · ${i.fileAttente} jeunes en attente (${i.attenteMoyenneJours} j en moy.)` },
    { icone: outlinedWork, libelle: 'Insertion à 6 mois', valeur: `${nf.format(i.insertion6Mois)} %`, detail: `en emploi ou en formation · base ${i.insertionBase} jeunes`, jauge: i.insertion6Mois },
  ];
});
</script>

<template>
  <section class="indicateurs" aria-label="Indicateurs clés">
    <div v-for="c in cartes" :key="c.libelle" class="carte">
      <div class="icone"><q-icon :name="c.icone" size="20px" /></div>
      <div class="contenu">
        <div class="libelle">{{ c.libelle }}</div>
        <transition name="fondu" mode="out-in"><div :key="c.valeur" class="valeur">{{ c.valeur }}</div></transition>
        <div class="detail">{{ c.detail }}</div>
      </div>
      <q-circular-progress v-if="c.jauge !== undefined" :value="c.jauge" size="44px" :thickness="0.16" color="primary"
        track-color="grey-3" class="jauge" :animation-speed="500" />
    </div>
    <template v-if="!cartes.length">
      <q-skeleton v-for="n in 4" :key="n" height="78px" class="carte" />
    </template>
  </section>
</template>

<style scoped>
.indicateurs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.carte { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--bord); border-radius: 14px; padding: 12px 14px; min-height: 78px; }
.icone { width: 38px; height: 38px; border-radius: 10px; background: var(--accent-doux); color: var(--accent); display: grid; place-items: center; flex: none; }
.contenu { flex: 1; min-width: 0; }
.libelle { font-size: 12px; color: var(--texte-2); }
.valeur { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; font-variant-numeric: tabular-nums; }
.detail { font-size: 11.5px; color: var(--texte-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jauge :deep(.q-circular-progress__track) { color: var(--grille) !important; }
@media (max-width: 1100px) { .indicateurs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .jauge { display: none; } .detail { white-space: normal; } .valeur { font-size: 22px; } }
</style>
