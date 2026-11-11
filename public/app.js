'use strict';

// Colores por tipo (para insignias y barras)
// Colores oscuros a proposito: el texto blanco de las insignias debe tener contraste AA (4,5:1)
const TYPE_COLORS = {
  Normal: '#6d6d4e', Fire: '#c4501a', Water: '#3a68c0', Electric: '#8a6d00', Grass: '#37802a', Ice: '#267878',
  Fighting: '#b02a25', Poison: '#8d3a8d', Ground: '#8a6a1f', Flying: '#6a55c8', Psychic: '#d03a72', Bug: '#6a7a10',
  Rock: '#7f6e20', Ghost: '#5d4a8a', Dragon: '#5a2fe0', Dark: '#5a463a', Steel: '#6a6a8c', Fairy: '#c24a70',
};
const STATS = [['HP', 'hp'], ['Ataque', 'attack'], ['Defensa', 'defense'], ['At. esp.', 'sp_atk'], ['Def. esp.', 'sp_def'], ['Velocidad', 'speed']];

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const color = (t) => TYPE_COLORS[t] || '#667';
const badge = (t) => `<span class="badge" style="background:${color(t)}">${esc(t)}</span>`;

// Imagen del Pokémon: no se consulta ninguna API. La URL se arma con el nombre
// (sprites de pokemondb.net, juego X/Y: cubren las generaciones 1 a 6 y las mega-evoluciones).
const SPRITE_BASE = 'https://img.pokemondb.net/sprites/x-y/normal/';
const plain = (s) => s.toLowerCase().replace('♀', '-f').replace('♂', '-m').replace(/[.'’%]/g, '').replace(/é/g, 'e')
  .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
function spriteSlugs(rawName) {
  const name = rawName.replace(/50% Forme$/, '');
  // "CharizardMega Charizard X" -> charizard-mega-x ; "KyogrePrimal Kyogre" -> kyogre-primal
  let m = name.match(/^(.+?)(Mega|Primal) .*?(?: ([XY]))?$/);
  if (m) {
    const base = plain(m[1]);
    return [`${base}-${m[2].toLowerCase()}${m[3] ? `-${m[3].toLowerCase()}` : ''}`, base];
  }
  // "DeoxysAttack Forme" -> deoxys-attack ; "HoopaHoopa Unbound" -> hoopa-unbound
  m = name.match(/^([A-Z][a-zé'.-]*[a-zé])([A-Z].*)$/);
  if (m) {
    const base = plain(m[1]);
    const words = m[2].split(' ');
    const form = words[0] === m[1] ? words[1] : words[0];
    return [`${base}-${plain(form)}`, base];
  }
  return [plain(name)];
}
// Nombre para mostrar: "VenusaurMega Venusaur" -> "Venusaur Mega" ; "DeoxysAttack Forme" -> "Deoxys (Attack)".
// En la base de datos el nombre no se modifica (la búsqueda usa el original).
function prettyName(raw) {
  const name = raw.replace(/(\D)50% Forme$/, '$1 50%');
  let m = name.match(/^(.+?)(Mega|Primal) .*?(?: ([XY]))?$/);
  if (m) return `${m[1]} ${m[2]}${m[3] ? ` ${m[3]}` : ''}`;
  m = name.match(/^([A-Z][a-zé'.-]*[a-zé])([A-Z].*)$/);
  if (m) {
    const form = m[2].replace(`${m[1]} `, '').replace(new RegExp(` ${m[1]}$`), '').replace(/ (Forme|Cloak|Mode|Size)$/, '');
    return `${m[1]} (${form})`;
  }
  return name;
}
const sprite = (name, cls = '') => {
  const [first, ...rest] = spriteSlugs(name);
  return `<img class="sprite ${cls}" src="${SPRITE_BASE}${first}.png" data-rest="${rest.join('|')}" alt="" loading="lazy" decoding="async" width="96" height="96">`;
};
// Si la imagen no existe, prueba la forma base y, si tampoco, deja el hueco vacío.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('sprite')) return;
  const rest = (img.dataset.rest || '').split('|').filter(Boolean);
  if (rest.length) { img.dataset.rest = rest.slice(1).join('|'); img.src = `${SPRITE_BASE}${rest[0]}.png`; }
  else img.style.visibility = 'hidden';
}, true);

let state = { page: 1, pages: 1 };
let timer;

async function api(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function cardHtml(p) {
  const stats = STATS.map(([label, key]) => {
    const pct = Math.min(100, Math.round((p[key] / 255) * 100));
    return `<div class="stat"><span>${label}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><span class="v">${p[key]}</span></div>`;
  }).join('');
  return `<button type="button" class="card" data-id="${p.id}" aria-label="Ver detalle de ${esc(prettyName(p.name))}">
    <div class="row1"><span class="name">${esc(prettyName(p.name))}</span><span class="id">ID ${p.id}</span></div>
    <div class="art">${sprite(p.name)}</div>
    <div class="body">
      <div class="badges">${badge(p.type1)}${p.type2 ? badge(p.type2) : ''}${p.legendary ? '<span class="badge leg">Legendario</span>' : ''}</div>
      <div class="total">Total <b>${p.total}</b></div>${stats}
    </div></button>`;
}

async function search(page = 1) {
  const params = new URLSearchParams({ page });
  if ($('q').value.trim()) params.set('q', $('q').value.trim());
  if ($('type').value) params.set('type', $('type').value);
  if ($('gen').value) params.set('gen', $('gen').value);
  if ($('legendary').checked) params.set('legendary', '1');

  const status = $('status');
  status.className = 'status';
  status.textContent = 'Buscando…';
  try {
    const data = await api(`/api/pokemon?${params}`);
    state = { page: data.page, pages: data.pages };
    $('cards').innerHTML = data.results.map(cardHtml).join('');
    status.textContent = data.total
      ? `${data.total} resultado${data.total === 1 ? '' : 's'}`
      : 'No se encontraron Pokémon con esos criterios.';
    $('pageinfo').textContent = `Página ${data.page} de ${data.pages}`;
    $('prev').disabled = data.page <= 1;
    $('next').disabled = data.page >= data.pages;
  } catch (err) {
    $('cards').innerHTML = '';
    status.className = 'status error';
    status.textContent = `No se pudo consultar la base de datos: ${err.message}`;
  }
}

async function showDetail(id) {
  try {
    const p = await api(`/api/pokemon/${id}`);
    $('d-title').textContent = prettyName(p.name);
    $('d-body').innerHTML = `
      <div class="d-art">${sprite(p.name, 'big')}</div>
      <div class="badges">${badge(p.type1)}${p.type2 ? badge(p.type2) : ''}${p.legendary ? '<span class="badge leg">Legendario</span>' : ''}</div>
      <dl class="facts">
        <dt>ID</dt><dd>${p.id}</dd>
        <dt>N.º Pokédex (columna #)</dt><dd>${p.dex_number}</dd>
        <dt>Generación</dt><dd>${p.generation}</dd>
        <dt>Puntos totales</dt><dd>${p.total}</dd>
      </dl>
      ${STATS.map(([label, key]) => `<div class="stat"><span>${label}</span><div class="track"><div class="fill" style="width:${Math.min(100, Math.round((p[key] / 255) * 100))}%"></div></div><span class="v">${p[key]}</span></div>`).join('')}`;
    $('detail').showModal();
  } catch (err) {
    $('status').className = 'status error';
    $('status').textContent = err.message;
  }
}

function drawChart(porTipo) {
  const max = Math.max(...porTipo.map((t) => t.promedio_total));
  $('chart').innerHTML = porTipo.map((t) => `
    <div class="bar-row" title="${esc(t.tipo)}: ${t.cantidad} Pokémon">
      <span>${esc(t.tipo)}</span>
      <div class="track"><div class="fill" style="width:${(t.promedio_total / max) * 100}%"></div></div>
      <span class="val">${t.promedio_total}</span>
    </div>`).join('');
}

async function init() {
  try {
    const [stats, types] = await Promise.all([api('/api/stats'), api('/api/types')]);
    $('t-total').textContent = stats.resumen.total;
    $('t-tipos').textContent = types.length;
    $('t-leg').textContent = stats.resumen.legendarios;
    $('t-prom').textContent = stats.resumen.promedio_total;
    drawChart(stats.porTipo);
    $('type').innerHTML += types.map((t) => `<option>${esc(t)}</option>`).join('');
  } catch (err) {
    $('status').className = 'status error';
    $('status').textContent = `No se pudo cargar el resumen: ${err.message}`;
  }
  search(1);
}

$('form').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => search(1), 250); });
$('form').addEventListener('submit', (e) => e.preventDefault());
$('clear').addEventListener('click', () => { $('form').reset(); search(1); });
$('prev').addEventListener('click', () => search(state.page - 1));
$('next').addEventListener('click', () => search(state.page + 1));
$('cards').addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) showDetail(c.dataset.id); });
$('d-close').addEventListener('click', () => $('detail').close());
$('detail').addEventListener('click', (e) => { if (e.target === $('detail')) $('detail').close(); });

init();
