import { readFile, stat } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../build/.vite/manifest.json', import.meta.url), 'utf8'));
const css = await readFile(new URL('../src/HospitalDashboard.css', import.meta.url), 'utf8');
const hospitalEntry = Object.entries(manifest).find(([key]) => key.endsWith('HospitalDashboard.jsx'));
const patientEntry = Object.entries(manifest).find(([key]) => key.endsWith('HospitalPatient360Page.jsx'));
if (!hospitalEntry || !patientEntry) throw new Error('Rotas hospitalares nao foram separadas em chunks lazy.');
const hospitalBytes = (await stat(new URL(`../build/${hospitalEntry[1].file}`, import.meta.url))).size;
const requirements = ['@media(max-width:900px)', '@media(max-width:620px)', '@media(prefers-reduced-motion:reduce)', '@media(forced-colors:active)', '.ach-skip-link', ':focus-visible'];
const missing = requirements.filter((item) => !css.includes(item));
if (missing.length) throw new Error(`Contratos responsivos/a11y ausentes: ${missing.join(', ')}`);
console.log(JSON.stringify({ hospitalChunk: hospitalEntry[1].file, hospitalChunkBytes: hospitalBytes, patient360Chunk: patientEntry[1].file, responsiveBreakpoints: [900, 620], reducedMotion: true, forcedColors: true, skipLink: true }, null, 2));
