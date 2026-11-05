// Serveur local (développement) : http://localhost:3001/api
import { creerServeur } from './bootstrap';

const port = Number(process.env.PORT ?? 3001);
creerServeur().then((s) => s.listen(port, () => console.log(`API prête sur http://localhost:${port}/api`)));
