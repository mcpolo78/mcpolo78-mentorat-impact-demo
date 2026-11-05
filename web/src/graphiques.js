import { onBeforeUnmount, ref } from 'vue';
import { BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.font.family = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.font.size = 11;

/** Change de clé quand le thème clair/sombre change, pour redessiner les graphiques avec les bons jetons. */
export function useTheme() {
  const version = ref(0);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const maj = () => version.value++;
  mq.addEventListener('change', maj);
  onBeforeUnmount(() => mq.removeEventListener('change', maj));
  return version;
}

export function infobulle(j) {
  return {
    backgroundColor: j.surface,
    titleColor: j.texte,
    bodyColor: j.texte2,
    borderColor: j.grille,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
  };
}
