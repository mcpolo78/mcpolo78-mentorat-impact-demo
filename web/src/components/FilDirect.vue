<script setup>
import {
  outlinedHandshake, outlinedPersonAdd, outlinedSchool, outlinedWork, outlinedFavorite, outlinedBolt,
} from '@quasar/extras/material-icons-outlined';
import { useMentorat } from '../store';

const store = useMentorat();
const icones = {
  'binome.cree': outlinedHandshake,
  'jeune.inscrit': outlinedPersonAdd,
  'atelier.suivi': outlinedSchool,
  'jeune.insere': outlinedWork,
  'mentor.inscrit': outlinedFavorite,
};
const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
function quand(iso) {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 86_400_000 ? heure.format(d) : date.format(d);
}
function relancer(v) {
  if (v) store.ticks = 0;
}
</script>

<template>
  <section class="panneau">
    <div class="panneau-titre">
      <span class="direct" :class="{ actif: store.simulation }" />
      Fil en direct
      <q-space />
      <q-toggle v-model="store.simulation" dense size="sm" color="primary" label="Simulation" left-label @update:model-value="relancer" />
    </div>
    <div class="contrat discret"><q-icon :name="outlinedBolt" size="13px" /> Événements versionnés publiés sur le bus, puis consommés par le journal</div>
    <div class="panneau-corps defile">
      <transition-group name="glisse" tag="ol" class="fil">
        <li v-for="e in store.evenements" :key="e.id" class="evt" :class="e.type.replace('.', '-')">
          <span class="evt-icone"><q-icon :name="icones[e.type] ?? outlinedBolt" size="16px" /></span>
          <div class="evt-texte">
            <div class="evt-msg">{{ e.message }}</div>
            <div class="evt-meta"><code>{{ e.type }}.v{{ e.version }}</code> · {{ quand(e.creeLe) }}</div>
          </div>
        </li>
      </transition-group>
    </div>
  </section>
</template>

<style scoped>
.direct { width: 8px; height: 8px; border-radius: 50%; background: var(--texte-3); }
.direct.actif { background: #d23c3c; animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(210, 60, 60, 0.45); } 50% { box-shadow: 0 0 0 5px rgba(210, 60, 60, 0); } }
.contrat { display: flex; align-items: center; gap: 4px; font-size: 11px; padding: 0 14px 6px; }
.fil { list-style: none; margin: 0; padding: 0; position: relative; }
.evt { display: flex; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--bord); }
.evt-icone { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; flex: none; background: var(--accent-doux); color: var(--accent); }
.binome-cree .evt-icone { background: var(--accent); color: #fff; }
.evt-texte { min-width: 0; }
.evt-msg { font-size: 12.5px; line-height: 1.3; }
.evt-meta { font-size: 11px; color: var(--texte-3); margin-top: 2px; }
.evt-meta code { font-size: 10.5px; background: var(--grille); padding: 0 4px; border-radius: 4px; color: var(--texte-2); }
</style>
