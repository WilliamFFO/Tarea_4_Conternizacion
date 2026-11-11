// Genera el documento de entrega (HTML y PDF) con el codigo fuente, el script de la
// base de datos y los enlaces.
// Uso: node scripts/build_entrega.mjs --video "https://..." --app "https://..."
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const video = arg('video', 'PENDIENTE: pegar aquí el enlace público del video');
const app = arg('app', 'PENDIENTE: pegar aquí la URL de la aplicación desplegada');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const code = (title, path, note = '') =>
  `<h3>${esc(title)} <small>${esc(path)}</small></h3>${note ? `<p class="note">${note}</p>` : ''}<pre>${esc(read(path))}</pre>`;
const link = (u) => (/^https?:\/\//.test(u) ? `<a href="${esc(u)}">${esc(u)}</a>` : `<span class="pend">${esc(u)}</span>`);

const seed = read('db/seed.sql');
const seedHead = seed.split('\n\n').slice(0, 4).join('\n\n');

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Entrega Actividad Sumativa U4</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font: 11pt/1.45 "Segoe UI", Arial, sans-serif; color: #172036; }
  h1 { font-size: 21pt; margin: 0 0 4pt; } h2 { font-size: 14pt; margin: 20pt 0 6pt; border-bottom: 2px solid #3b4cca; padding-bottom: 3pt; page-break-after: avoid; }
  h3 { font-size: 11pt; margin: 14pt 0 4pt; page-break-after: avoid; } h3 small { color: #566179; font-weight: 400; font-family: Consolas, monospace; font-size: 9pt; margin-left: 6pt; }
  pre { font: 7.6pt/1.35 Consolas, "Cascadia Mono", monospace; background: #f4f6fb; border: 1px solid #dbe1ee; border-radius: 4pt; padding: 7pt 9pt; white-space: pre-wrap; word-break: break-word; margin: 4pt 0 8pt; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0; } th, td { border: 1px solid #c9d1e4; padding: 4pt 7pt; text-align: left; vertical-align: top; font-size: 10pt; } th { background: #e9edfb; }
  .sub { color: #566179; margin: 0 0 14pt; } .note { color: #566179; font-size: 9.5pt; margin: 2pt 0; } .pend { background: #fff3c4; padding: 1pt 5pt; border-radius: 3pt; }
  a { color: #2a378f; } .break { page-break-before: always; }
</style></head><body>

<h1>Creación de aplicación usando el patrón serverless</h1>
<p class="sub">Módulo: Contenerización de Aplicaciones de Software · Unidad 4 · Actividad Sumativa</p>

<h2>1. Enlaces de la entrega</h2>
<table>
  <tr><th>Video explicativo (público)</th><td>${link(video)}</td></tr>
  <tr><th>Aplicación desplegada</th><td>${link(app)}</td></tr>
</table>

<h2>2. Descripción</h2>
<p>Se descargó el dataset público <em>Pokemon with stats</em> (800 filas, 13 columnas, CSV), se cargó completo en una base de datos serverless (<strong>Cloudflare D1</strong>) y se desarrolló una aplicación web serverless que permite visualizar los datos en tarjetas, buscarlos por <strong>ID</strong> (llave primaria) o por <strong>nombre</strong> (columna única), filtrarlos por tipo, generación y legendarios, y ver una gráfica con el promedio de puntos por tipo.</p>
<table>
  <tr><th>Capa</th><th>Servicio</th><th>Archivo</th><th>Por qué</th></tr>
  <tr><td>Presentación</td><td>Workers Static Assets</td><td>public/</td><td>Sitio estático servido desde la red global, sin servidor propio</td></tr>
  <tr><td>Lógica</td><td>Cloudflare Workers (función serverless)</td><td>src/worker.js</td><td>Se ejecuta solo cuando llega una petición; escala sola; el navegador nunca habla directo con la base de datos</td></tr>
  <tr><td>Datos</td><td>Cloudflare D1 (SQL serverless)</td><td>db/schema.sql, db/seed.sql</td><td>El dataset es tabular (CSV), por lo que encaja en SQL; sin servidor de base de datos que administrar</td></tr>
</table>
<p class="note">La columna original «#» se repite (solo 721 valores distintos en 800 filas, por las mega-evoluciones), por eso la tabla usa un <code>id</code> propio como llave primaria y <code>name</code> (única) como columna secundaria de búsqueda.</p>

<h2>3. Script de la base de datos</h2>
${code('Estructura de la tabla', 'db/schema.sql')}
${code('Script que genera la carga de datos desde el CSV', 'scripts/csv_to_sql.mjs')}
<h3>Carga de datos <small>db/seed.sql</small></h3>
<p class="note">Contiene las 800 filas del dataset en sentencias INSERT por lotes de 25. Aquí se muestran los primeros lotes; el archivo completo está en el Anexo A.</p>
<pre>${esc(seedHead)}

-- ... (continúa hasta la fila 800; ver Anexo A) ...</pre>

<h2 class="break">4. Código fuente de la aplicación</h2>
${code('Función serverless (API)', 'src/worker.js')}
${code('Configuración de Cloudflare', 'wrangler.toml')}
${code('Interfaz web: HTML', 'public/index.html')}
${code('Interfaz web: JavaScript', 'public/app.js')}
${code('Interfaz web: estilos', 'public/style.css')}

<h2 class="break">Anexo A. Script completo de carga (db/seed.sql)</h2>
<pre>${esc(seed)}</pre>

</body></html>`;

mkdirSync(join(root, 'entrega'), { recursive: true });
const htmlPath = join(root, 'entrega', 'Entrega_Actividad_U4.html');
const pdfPath = join(root, 'entrega', 'Entrega_Actividad_U4.pdf');
writeFileSync(htmlPath, html, 'utf8');

const edge = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!edge) {
  console.log('HTML generado; no se encontró Edge/Chrome para crear el PDF. Abre el HTML e imprímelo como PDF.');
} else {
  // Se borra el PDF anterior para no dar por bueno uno viejo. Si no se genera, cierra Edge e inténtalo de nuevo
  // (o abre el HTML de la carpeta entrega y guárdalo como PDF con Ctrl+P).
  rmSync(pdfPath, { force: true });
  spawnSync(edge, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' });
  console.log(existsSync(pdfPath) ? `OK: ${pdfPath}` : 'No se pudo crear el PDF');
}
