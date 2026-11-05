// Développement local : compile l'API NestJS, la lance sur :3001 et démarre Vite sur :5173 (proxy /api).
const { spawn, execSync } = require('node:child_process');

execSync('npx tsc -p server/tsconfig.json', { stdio: 'inherit' });
const enfants = [
  spawn('node', ['server/dist/main.js'], { stdio: 'inherit', env: { ...process.env, PORT: '3001' } }),
  spawn('npx', ['vite'], { stdio: 'inherit', shell: true }),
];
const arreter = () => enfants.forEach((e) => e.kill());
process.on('SIGINT', arreter);
process.on('SIGTERM', arreter);
