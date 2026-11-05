<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { useMentorat } from '../store';
import { jetons } from '../couleurs';
import { infobulle, useTheme } from '../graphiques';

const store = useMentorat();
const theme = useTheme();

const donnees = computed(() => {
  theme.value;
  const t = store.tableau?.inscriptions;
  const j = jetons();
  if (!t) return { labels: [], datasets: [] };
  return {
    labels: t.mois,
    datasets: Object.entries(t.parProgramme).map(([programme, valeurs], i) => ({ vide: valeurs.every((v) => v === 0),
      label: programme,
      data: valeurs,
      backgroundColor: j.series[i],
      hoverBackgroundColor: j.series[i],
      borderColor: j.surface,
      borderWidth: { top: 2 },
      borderSkipped: 'start',
      borderRadius: 4,
      barPercentage: 0.72,
      categoryPercentage: 0.9,
    })).filter((d) => !d.vide),
  };
});

const options = computed(() => {
  theme.value;
  const j = jetons();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'start', labels: { color: j.texte2, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 8, boxHeight: 8, padding: 12 } },
      tooltip: { ...infobulle(j), callbacks: { footer: (items) => `Total : ${items.reduce((s, x) => s + x.parsed.y, 0)} inscriptions` } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: j.texte3 } },
      y: { stacked: true, grid: { color: j.grille }, border: { display: false }, ticks: { color: j.texte3, maxTicksLimit: 5 } },
    },
  };
});
</script>

<template>
  <section class="panneau">
    <div class="panneau-titre">Inscriptions par mois <small>12 mois glissants, par programme</small></div>
    <div class="panneau-corps">
      <Bar :key="theme" :data="donnees" :options="options" aria-label="Inscriptions mensuelles par programme" role="img" />
    </div>
  </section>
</template>
