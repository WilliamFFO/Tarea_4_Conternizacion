// Funcion serverless (Cloudflare Worker). No hay servidor que administrar:
// Cloudflare la ejecuta solo cuando llega una peticion a /api/* y la apaga despues.
// La base de datos (D1) llega a traves del "binding" env.DB definido en wrangler.toml.

const COLUMNS =
  'id, dex_number, name, type1, type2, total, hp, attack, defense, sp_atk, sp_def, speed, generation, legendary';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });

// Busqueda con filtros y paginacion.
//   q: si es un numero se busca por ID (llave primaria); si es texto, por nombre (columna unica)
async function listPokemon(url, env) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
  const type = (url.searchParams.get('type') || '').trim().slice(0, 20);
  const gen = Number.parseInt(url.searchParams.get('gen'), 10);
  const legendary = url.searchParams.get('legendary') === '1';
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page'), 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(url.searchParams.get('limit'), 10) || 24));

  const where = [];
  const params = [];
  if (q) {
    if (/^\d+$/.test(q)) {
      where.push('id = ?');
      params.push(Number(q));
    } else {
      where.push("name LIKE ? ESCAPE '\\'");
      params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    }
  }
  if (type) {
    where.push('(type1 = ? OR type2 = ?)');
    params.push(type, type);
  }
  if (Number.isInteger(gen)) {
    where.push('generation = ?');
    params.push(gen);
  }
  if (legendary) where.push('legendary = 1');
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Consultas parametrizadas (bind): evitan inyeccion SQL
  const [count, rows] = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM pokemon ${clause}`).bind(...params),
    env.DB.prepare(`SELECT ${COLUMNS} FROM pokemon ${clause} ORDER BY id LIMIT ? OFFSET ?`).bind(
      ...params,
      limit,
      (page - 1) * limit,
    ),
  ]);
  const total = count.results[0].n;
  return json({ total, page, pages: Math.max(1, Math.ceil(total / limit)), limit, results: rows.results });
}

async function getPokemon(id, env) {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM pokemon WHERE id = ?`).bind(id).first();
  return row ? json(row) : json({ error: `No existe un Pokémon con ID ${id}` }, 404);
}

// Datos agregados para las tarjetas resumen y la grafica
async function getStats(env) {
  const [resumen, porTipo, porGeneracion] = await env.DB.batch([
    env.DB.prepare(
      'SELECT COUNT(*) AS total, SUM(legendary) AS legendarios, ROUND(AVG(total), 1) AS promedio_total FROM pokemon',
    ),
    env.DB.prepare(
      'SELECT type1 AS tipo, COUNT(*) AS cantidad, ROUND(AVG(total), 1) AS promedio_total FROM pokemon GROUP BY type1 ORDER BY promedio_total DESC',
    ),
    env.DB.prepare('SELECT generation, COUNT(*) AS cantidad FROM pokemon GROUP BY generation ORDER BY generation'),
  ]);
  return json(
    { resumen: resumen.results[0], porTipo: porTipo.results, porGeneracion: porGeneracion.results },
    200,
    { 'cache-control': 'public, max-age=60' },
  );
}

async function getTypes(env) {
  const { results } = await env.DB.prepare(
    'SELECT type1 AS tipo FROM pokemon UNION SELECT type2 FROM pokemon WHERE type2 IS NOT NULL ORDER BY 1',
  ).all();
  return json(results.map((r) => r.tipo), 200, { 'cache-control': 'public, max-age=300' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
    try {
      if (url.pathname === '/api/pokemon') return await listPokemon(url, env);
      const m = url.pathname.match(/^\/api\/pokemon\/(\d+)$/);
      if (m) return await getPokemon(Number(m[1]), env);
      if (url.pathname === '/api/stats') return await getStats(env);
      if (url.pathname === '/api/types') return await getTypes(env);
      return json({ error: 'Ruta no encontrada' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'Error interno al consultar la base de datos' }, 500);
    }
  },
};
