<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { outlinedSchedule, outlinedPlace, outlinedCheck, outlinedPsychology } from '@quasar/extras/material-icons-outlined';
import { useMentorat } from '../store';

const store = useMentorat();
const $q = useQuasar();
const jeune = computed(() => store.jeuneSelectionne);
const couleurProgramme = { 'Orientation lycée': 'var(--serie-1)', 'Réussite études': 'var(--serie-2)', 'Insertion pro': 'var(--serie-3)' };
const initiales = (p) => p.split(' ').map((x) => x[0]).join('');
const attente = (j) => (j <= 0 ? "aujourd'hui" : `${j} j`);
const niveau = (s) => (s >= 80 ? 'fort' : s >= 60 ? 'bon' : 'moyen');

async function valider(p) {
  const j = jeune.value;
  try {
    await store.valider(j.id, p.mentor.id);
    $q.notify({ type: 'positive', message: `Binôme créé : ${j.prenom} et ${p.mentor.prenom} (score ${p.score})` });
  } catch (e) {
    $q.notify({ type: 'warning', message: e.message });
    store.rafraichir();
  }
}
</script>

<template>
  <section class="panneau">
    <div class="panneau-titre">
      Appariement mentor / jeune
      <small>{{ store.file.total }} jeunes en attente d'un mentor · score sur 100, détaillé par critère</small>
    </div>
    <div class="panneau-corps grille">
      <!-- File d'attente -->
      <div class="liste defile" role="listbox" aria-label="Jeunes en attente">
        <transition-group name="glisse" tag="div" class="liste-int">
          <button v-for="j in store.file.jeunes" :key="j.id" class="ligne" :class="{ actif: jeune && j.id === jeune.id }"
            role="option" :aria-selected="jeune && j.id === jeune.id" @click="store.selection = j.id">
            <span class="puce" :style="{ background: couleurProgramme[j.programme] }" />
            <span class="nom">{{ j.prenom }}</span>
            <span class="meta">{{ j.domaine }}</span>
            <span class="attente" :class="{ longue: j.attenteJours > 30 }">{{ attente(j.attenteJours) }}</span>
          </button>
        </transition-group>
        <div v-if="!store.file.jeunes.length && store.tableau" class="vide discret">Aucun jeune en attente 🎉</div>
      </div>

      <!-- Détail et propositions -->
      <div class="detail defile">
        <transition name="fondu" mode="out-in">
          <div v-if="jeune" :key="jeune.id" class="detail-int">
            <div class="fiche">
              <div class="avatar grand">{{ initiales(jeune.prenom) }}</div>
              <div class="fiche-texte">
                <div class="fiche-nom">
                  {{ jeune.prenom }}
                  <q-badge v-if="jeune.prioritaire" color="primary" class="q-ml-xs" label="Prioritaire" />
                </div>
                <div class="fiche-meta">
                  <span><span class="puce" :style="{ background: couleurProgramme[jeune.programme] }" />{{ jeune.programme }}</span>
                  <span>{{ jeune.domaine }}</span>
                  <span><q-icon :name="outlinedPlace" size="13px" />{{ jeune.region }}</span>
                  <span><q-icon :name="outlinedSchedule" size="13px" />en attente {{ attente(jeune.attenteJours) }}</span>
                </div>
                <div class="etiquettes">
                  <q-chip v-for="c in jeune.creneaux" :key="c" dense square size="11px" class="chip-creneau">{{ c }}</q-chip>
                  <q-chip v-for="b in jeune.interets" :key="b" dense square size="11px" class="chip-besoin">{{ b }}</q-chip>
                </div>
              </div>
            </div>

            <div class="sous-titre"><q-icon :name="outlinedPsychology" size="15px" /> 3 meilleurs mentors disponibles</div>
            <div v-for="(p, rang) in jeune.propositions" :key="p.mentor.id" class="proposition" :class="{ premier: rang === 0 }">
              <div class="prop-tete">
                <div class="avatar">{{ initiales(p.mentor.prenom) }}</div>
                <div class="prop-id">
                  <div class="prop-nom">{{ p.mentor.prenom }} <span class="discret">· {{ p.mentor.entreprise }}</span></div>
                  <div class="prop-meta">{{ p.mentor.domaine }} · {{ p.mentor.region }}{{ p.mentor.distanciel ? ' · distanciel' : '' }} · {{ p.mentor.charge }}/{{ p.mentor.capacite }} filleul{{ p.mentor.capacite > 1 ? 's' : '' }}</div>
                </div>
                <div class="score" :class="niveau(p.score)">
                  <q-circular-progress :value="p.score" size="42px" :thickness="0.18" color="primary" track-color="grey-3" show-value
                    :animation-speed="500" class="anneau">
                    <span class="score-val">{{ p.score }}</span>
                  </q-circular-progress>
                </div>
                <q-btn :icon="outlinedCheck" :label="rang === 0 ? 'Valider' : ''" :round="rang !== 0" :unelevated="rang === 0" :outline="rang !== 0"
                  no-caps dense color="primary" class="valider" :loading="store.enValidation === p.mentor.id"
                  :disable="store.enValidation !== null" :aria-label="`Valider le binôme avec ${p.mentor.prenom}`" @click="valider(p)" />
              </div>
              <div class="criteres">
                <div v-for="c in p.criteres" :key="c.cle" class="critere">
                  <span class="c-lib">{{ c.libelle }}</span>
                  <div class="c-barre"><div class="c-plein" :style="{ width: `${(100 * c.points) / c.max}%` }" /></div>
                  <span class="c-pts">{{ c.points }}/{{ c.max }}</span>
                  <span class="c-det" :title="c.detail">{{ c.detail }}</span>
                </div>
              </div>
            </div>
            <div v-if="!jeune.propositions.length" class="vide discret">Aucun mentor disponible pour l'instant.</div>
          </div>
          <div v-else-if="!store.tableau" key="chargement" class="detail-int">
            <q-skeleton v-for="n in 4" :key="n" height="120px" class="q-mb-sm" />
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grille { display: grid; grid-template-columns: minmax(170px, 0.62fr) minmax(0, 1.38fr); gap: 12px; }
.liste { border-right: 1px solid var(--bord); padding-right: 8px; min-height: 0; }
.liste-int { position: relative; display: flex; flex-direction: column; gap: 2px; }
.ligne { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 8px 1fr auto; grid-template-rows: auto auto; column-gap: 8px; align-items: center;
  padding: 7px 8px; border-radius: 9px; cursor: pointer; transition: background 0.2s ease, transform 0.2s ease; width: 100%; }
.ligne:hover { background: var(--accent-doux); }
.ligne:focus-visible { outline: 2px solid var(--accent); }
.ligne.actif { background: var(--accent-doux); box-shadow: inset 3px 0 0 var(--accent); }
.ligne .puce { grid-row: span 2; }
.nom { font-size: 13px; font-weight: 600; }
.meta { grid-column: 2; font-size: 11.5px; color: var(--texte-3); }
.attente { grid-column: 3; grid-row: 1 / span 2; font-size: 11.5px; color: var(--texte-2); font-variant-numeric: tabular-nums; }
.attente.longue { color: #c26a00; font-weight: 600; }
.puce { display: inline-block; width: 8px; height: 8px; border-radius: 3px; margin-right: 4px; vertical-align: 1px; }
.ligne .puce { margin: 0; }
.detail { min-height: 0; padding-right: 4px; }
.fiche { display: flex; gap: 12px; padding: 4px 0 10px; border-bottom: 1px solid var(--bord); }
.fiche-texte { min-width: 0; }
.fiche-nom { font-size: 16px; font-weight: 700; }
.fiche-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--texte-2); margin-top: 2px; }
.fiche-meta span { display: inline-flex; align-items: center; gap: 3px; }
.etiquettes { margin-top: 4px; margin-left: -4px; }
.chip-creneau { background: var(--accent-doux); color: var(--accent); }
.chip-besoin { background: transparent; border: 1px solid var(--bord); color: var(--texte-2); }
.sous-titre { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--texte-2); margin: 10px 0 6px; }
.avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--accent-doux); color: var(--accent); display: grid; place-items: center; font-size: 12px; font-weight: 700; flex: none; }
.avatar.grand { width: 44px; height: 44px; font-size: 15px; }
.proposition { border: 1px solid var(--bord); border-radius: 12px; padding: 8px 10px; margin-bottom: 8px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.proposition:hover { border-color: var(--accent); }
.proposition.premier { box-shadow: 0 0 0 1px var(--accent) inset; }
.prop-tete { display: flex; align-items: center; gap: 10px; }
.prop-id { flex: 1; min-width: 0; }
.prop-nom { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prop-meta { font-size: 11.5px; color: var(--texte-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.score-val { font-size: 13px; font-weight: 700; color: var(--texte); }
.anneau :deep(.q-circular-progress__track) { color: var(--grille) !important; }
.criteres { display: grid; gap: 2px; margin-top: 6px; }
.critere { display: grid; grid-template-columns: 78px 90px 36px minmax(0, 1fr); align-items: center; gap: 8px; font-size: 11.5px; }
.c-lib { color: var(--texte-2); }
.c-barre { height: 6px; border-radius: 3px; background: var(--grille); overflow: hidden; }
.c-plein { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
.c-pts { color: var(--texte-2); font-variant-numeric: tabular-nums; text-align: right; }
.c-det { color: var(--texte-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vide { padding: 24px 0; text-align: center; font-size: 13px; }
@media (max-width: 700px) {
  .grille { grid-template-columns: 1fr; grid-template-rows: 180px minmax(0, 1fr); }
  .liste { border-right: 0; border-bottom: 1px solid var(--bord); }
  .critere { grid-template-columns: 70px 60px 34px minmax(0, 1fr); }
}
</style>
