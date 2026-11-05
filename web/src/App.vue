<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useMentorat } from './store';
import EnTete from './components/EnTete.vue';
import Indicateurs from './components/Indicateurs.vue';
import GraphInscriptions from './components/GraphInscriptions.vue';
import GraphInsertion from './components/GraphInsertion.vue';
import FileAttente from './components/FileAttente.vue';
import FilDirect from './components/FilDirect.vue';

const store = useMentorat();
const $q = useQuasar();
let minuteurs = [];
let enAttente = false;

async function boucleEvenements() {
  if (document.hidden) return;
  try {
    const nouveau = await store.lireEvenements();
    // Un événement modifie les chiffres : on recalcule (une seule requête à la fois).
    if (nouveau && !enAttente) {
      enAttente = true;
      await store.rafraichir().finally(() => (enAttente = false));
    }
  } catch {
    /* réseau : on réessaiera au prochain passage */
  }
}

onMounted(async () => {
  try {
    await store.demarrer();
  } catch (e) {
    $q.notify({ type: 'negative', message: `API indisponible : ${e.message}` });
  }
  minuteurs = [
    setInterval(boucleEvenements, 3000),
    setInterval(() => !document.hidden && store.tick(), 5000),
  ];
});
onBeforeUnmount(() => minuteurs.forEach(clearInterval));
watch(() => ({ ...store.filtre }), () => store.rafraichir());
</script>

<template>
  <div class="page">
    <EnTete />
    <Indicateurs />
    <div class="colonnes">
      <div class="pile">
        <GraphInscriptions />
        <GraphInsertion />
      </div>
      <FileAttente class="colonne-centre" />
      <FilDirect class="colonne-droite" />
    </div>
  </div>
</template>
