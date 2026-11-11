// Convierte data/pokemon.csv en db/seed.sql (INSERT por lotes).
// Uso: node scripts/csv_to_sql.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csv = readFileSync(join(root, 'data', 'pokemon.csv'), 'utf8').replace(/^﻿/, '');

// Lector de CSV minimo que respeta comillas
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}

const [header, ...data] = parseCsv(csv);
if (header.length !== 13) throw new Error(`Se esperaban 13 columnas y hay ${header.length}`);

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const int = (s, col) => {
  const n = Number(s);
  if (!Number.isInteger(n)) throw new Error(`Valor no entero en ${col}: "${s}"`);
  return n;
};

const names = new Set();
const tuples = data.map((r, i) => {
  const [dex, name, t1, t2, total, hp, atk, def, spa, spd, spe, gen, leg] = r;
  if (names.has(name)) throw new Error(`Nombre repetido: ${name}`);
  names.add(name);
  return '(' + [
    i + 1, int(dex, '#'), q(name), q(t1), t2 === '' ? 'NULL' : q(t2),
    int(total, 'Total'), int(hp, 'HP'), int(atk, 'Attack'), int(def, 'Defense'),
    int(spa, 'Sp. Atk'), int(spd, 'Sp. Def'), int(spe, 'Speed'), int(gen, 'Generation'),
    leg.trim().toLowerCase() === 'true' ? 1 : 0,
  ].join(', ') + ')';
});

const cols = 'id, dex_number, name, type1, type2, total, hp, attack, defense, sp_atk, sp_def, speed, generation, legendary';
const BATCH = 25;
let sql = `-- Generado por scripts/csv_to_sql.mjs a partir de data/pokemon.csv\n-- Filas: ${tuples.length}\n\n`;
for (let i = 0; i < tuples.length; i += BATCH) {
  sql += `INSERT INTO pokemon (${cols}) VALUES\n  ${tuples.slice(i, i + BATCH).join(',\n  ')};\n\n`;
}
writeFileSync(join(root, 'db', 'seed.sql'), sql, 'utf8');
console.log(`OK: ${tuples.length} filas -> db/seed.sql`);
