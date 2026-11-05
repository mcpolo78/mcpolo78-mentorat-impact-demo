import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Notify, Dark } from 'quasar';
import iconSet from 'quasar/icon-set/svg-material-icons-outlined';
import 'quasar/dist/quasar.css';
import './theme.css';
import App from './App.vue';

createApp(App)
  .use(createPinia())
  .use(Quasar, {
    plugins: { Notify, Dark },
    iconSet,
    config: {
      dark: 'auto',
      brand: { primary: '#6250d6', secondary: '#1baf7a', accent: '#eb6834', positive: '#1a8f4a', negative: '#d23c3c', warning: '#c98500' },
      notify: { position: 'bottom', timeout: 2600 },
    },
  })
  .mount('#app');
