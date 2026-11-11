-- =====================================================================
-- Estructura de la base de datos serverless (Cloudflare D1, motor SQLite)
-- Dataset: Pokemon with stats (800 filas, 13 columnas originales)
--
-- Notas de diseno:
--   * "id" es la llave primaria propia (1..800). La columna original "#"
--     NO es unica (las mega-evoluciones repiten el numero), por eso se
--     guarda aparte como "dex_number".
--   * "name" es UNICA: sirve como columna secundaria de busqueda.
--   * "type2" admite NULL (muchos pokemon tienen un solo tipo).
--   * "legendary" es booleano guardado como 0/1 (SQLite no tiene BOOLEAN).
-- =====================================================================

DROP TABLE IF EXISTS pokemon;

CREATE TABLE pokemon (
  id          INTEGER PRIMARY KEY,           -- llave primaria (1..800)
  dex_number  INTEGER NOT NULL,              -- columna original "#"
  name        TEXT    NOT NULL UNIQUE,       -- nombre unico
  type1       TEXT    NOT NULL,              -- tipo principal
  type2       TEXT,                          -- tipo secundario (puede ser NULL)
  total       INTEGER NOT NULL,              -- suma de las 6 estadisticas
  hp          INTEGER NOT NULL,
  attack      INTEGER NOT NULL,
  defense     INTEGER NOT NULL,
  sp_atk      INTEGER NOT NULL,              -- columna original "Sp. Atk"
  sp_def      INTEGER NOT NULL,              -- columna original "Sp. Def"
  speed       INTEGER NOT NULL,
  generation  INTEGER NOT NULL,              -- generacion 1..6
  legendary   INTEGER NOT NULL DEFAULT 0     -- 0 = no, 1 = si
);

-- Indices para acelerar las busquedas y filtros de la aplicacion
CREATE INDEX idx_pokemon_type1      ON pokemon (type1);
CREATE INDEX idx_pokemon_type2      ON pokemon (type2);
CREATE INDEX idx_pokemon_generation ON pokemon (generation);
