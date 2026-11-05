<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { useMentorat } from '../store';
import { jetons } from '../couleurs';
import { infobulle, useTheme } from '../graphiques';

const store = useMentorat();
const theme = useTheme();
const regions = computed(() => store.tableau?.insertionParRegion ?? []);
const moyenne = computed(() => store.tableau?.indicateurs.insertion6Mois ?? 0);

// Plugin : trait vertical pour la moyenne nationale, et valeur au bout de chaque barre.
const reperes = {
  id: 'reperes',
  afterDatasetsDraw(chart) {
    const j = jetons();
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(moyenne.value);
    ctx.save();
    ctx.strokeStyle = j.texte3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    chart.getDatasetMeta(0).data.forEach((barre, i) => {
      ctx.fillStyle = j.texte2;
      ctx.fillText(`${chart.data.datasets[0].data[i]} %`, barre.x + 6, barre.y);
    });
    ctx.restore();
  },
};

const donnees = computed(() => {
  theme.value;
  const j = jetons();
  return {
    labels: regions.value.map((r) => r.region.replace("Provence-Alpes-Côte d'Azur", 'PACA')),
    datasets: [{
      label: 'Insertion à 6 mois',
      data: regions.value.map((r) => r.taux),
      backgroundColor: j.series[2],
      hoverBackgroundColor: j.series[2],
      borderRadius: 4,
      borderSkipped: 'start',
      barPercentage: 0.66,
    }],
  };
});

const options = computed(() => {
  theme.value;
  const j = jetons();
  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    layout: { padding: { right: 36 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...infobulle(j),
        callbacks: {
          title: (items) => regions.value[items[0].dataIndex]?.region,
          label: (item) => {
            const r = regions.value[item.dataIndex];
            return ` ${r.taux} % (${r.inseres} sur ${r.eligibles} jeunes)`;
          },
        },
      },
    },
    scales: {
      x: { min: 0, max: 100, grid: { color: j.grille }, border: { display: false }, ticks: { color: j.texte3, callback: (v) => `${v} %`, maxTicksLimit: 6 } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: j.texte2 } },
    },
  };
});
</script>

<template>
  <section class="panneau">
    <div class="panneau-titre">Insertion à 6 mois par région <small>programme Insertion pro · pointillé = moyenne</small></div>
    <div class="panneau-corps">
      <div v-if="store.tableau && !regions.length" class="vide discret">Pas de suivi d'insertion pour ce programme.</div>
      <Bar v-else :key="theme" :data="donnees" :options="options" :plugins="[reperes]" aria-label="Taux d'insertion à 6 mois par région" role="img" />
    </div>
  </section>
</template>

<style scoped>
.vide { height: 100%; display: grid; place-items: center; font-size: 13px; }
</style>
