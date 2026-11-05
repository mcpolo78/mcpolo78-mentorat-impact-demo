<script setup>
import { computed } from 'vue';
import { outlinedStorage, outlinedHub } from '@quasar/extras/material-icons-outlined';
import { useMentorat } from '../store';

const store = useMentorat();
const programmes = computed(() => [{ label: 'Tous', value: '' }, ...(store.sante?.programmes ?? []).map((p) => ({ label: p, value: p }))]);
const regions = computed(() => [{ label: 'Toutes les régions', value: '' }, ...(store.sante?.regions ?? []).map((r) => ({ label: r, value: r }))]);
</script>

<template>
  <header class="entete">
    <div class="marque">
      <div class="logo" aria-hidden="true">
        <svg viewBox="0 0 64 64"><path d="M14 42c6-12 12-18 18-18s12 6 18 18" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" /><circle cx="32" cy="20" r="5" fill="currentColor" /></svg>
      </div>
      <div class="marque-texte">
        <div class="titre">Passerelle <span>· impact &amp; mentorat</span></div>
        <div class="sous-titre">Suivi des jeunes accompagnés et appariement avec des mentors bénévoles · données fictives</div>
      </div>
    </div>
    <div class="filtres">
      <q-btn-toggle v-model="store.filtre.programme" :options="programmes" no-caps unelevated dense rounded
        toggle-color="primary" color="transparent" text-color="grey-7" class="bascule" />
      <q-select v-model="store.filtre.region" :options="regions" emit-value map-options dense outlined rounded
        options-dense class="region" aria-label="Région" />
    </div>
    <div class="pastilles">
      <span class="pastille" :class="{ ok: store.sante }">
        <q-icon :name="outlinedStorage" size="14px" />
        {{ store.sante ? (store.sante.base === 'postgres' ? 'PostgreSQL' : 'Mémoire') : '…' }}
      </span>
      <span class="pastille ok" title="Bus d'événements versionnés">
        <q-icon :name="outlinedHub" size="14px" /> Bus
      </span>
    </div>
  </header>
</template>

<style scoped>
.entete { display: flex; align-items: center; gap: 16px; min-height: 48px; }
.marque { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.logo { width: 38px; height: 38px; border-radius: 11px; background: var(--accent); color: #fff; display: grid; place-items: center; flex: none; }
.logo svg { width: 24px; height: 24px; }
.marque-texte { min-width: 0; }
.titre { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.titre span { font-weight: 500; color: var(--texte-2); }
.sous-titre { font-size: 12px; color: var(--texte-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.filtres { display: flex; align-items: center; gap: 10px; }
.bascule { border: 1px solid var(--bord); background: var(--surface); padding: 3px; gap: 2px; border-radius: 999px; }
.bascule :deep(.q-btn) { border-radius: 999px !important; padding: 4px 12px; min-height: 30px; font-size: 13px; transition: background-color 0.25s ease, color 0.25s ease; }
.bascule :deep(.q-btn:not(.bg-primary):hover) { background: var(--accent-doux); }
.bascule :deep(.q-btn:before) { box-shadow: none; }
.region { width: 190px; }
.region :deep(.q-field__control) { background: var(--surface); }
.pastilles { display: flex; gap: 6px; flex: none; }
.pastille { white-space: nowrap; }
.pastille { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--bord); color: var(--texte-2); background: var(--surface); }
.pastille.ok::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #1a8f4a; }
@media (max-width: 1100px) {
  .entete { flex-wrap: wrap; }
  .sous-titre { white-space: normal; }
  .filtres { flex-wrap: wrap; }
}
</style>
