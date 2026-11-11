# Pokédex Serverless — Actividad Sumativa Unidad 4

- **Aplicación desplegada:** <https://pokedex-serverless.pokedex-maestria.workers.dev/>
- **Video explicativo:** <https://www.youtube.com/watch?v=cKFu1Bos6qs>

Aplicación web **serverless** que lee un dataset de 800 Pokémon guardado en una **base de datos serverless**.

| Capa | Servicio de Cloudflare | Archivo |
|---|---|---|
| Presentación (HTML, CSS, JS) | **Workers Static Assets** (sitio estático en la red global) | `public/` |
| Lógica (API) | **Workers** (funciones serverless) | `src/worker.js` |
| Datos | **D1** (base de datos SQL serverless, motor SQLite) | `db/schema.sql`, `db/seed.sql` |

```
Navegador ──► Cloudflare (borde) ──┬─► archivos estáticos (index.html, app.js, style.css)
                                   └─► /api/*  ──► Worker (función) ──► D1 (SQL)
```

No hay servidores ni contenedores que administrar: Cloudflare ejecuta la función solo cuando llega una petición.

## Dataset

*Pokemon with stats* (800 filas, 13 columnas), archivo `data/pokemon.csv`.
La columna `#` **se repite** (las mega-evoluciones comparten número: solo hay 721 valores distintos), por eso la tabla usa un `id` propio (1–800) como llave primaria y `name` (única) como segunda columna de búsqueda.

## Estructura del proyecto

```
data/pokemon.csv          dataset original
db/schema.sql             estructura de la tabla (script de la base de datos)
db/seed.sql               800 INSERT generados desde el CSV
scripts/csv_to_sql.mjs    convierte el CSV en seed.sql
src/worker.js             funciones serverless (API)
public/                   interfaz web
wrangler.toml             configuración de Cloudflare
```

## Probar en tu computador (sin cuenta)

```bash
npm install
npm run db:local
npm run dev
```

Abre <http://127.0.0.1:8787>.

## Desplegar en Cloudflare (gratis)

Necesitas una cuenta gratuita de Cloudflare (<https://dash.cloudflare.com/sign-up>). Esa parte la haces tú.

**1. Iniciar sesión desde la terminal** (se abre el navegador para autorizar):

```bash
npx wrangler login
```

**2. Crear la base de datos serverless:**

```bash
npx wrangler d1 create pokedex-db
```

Copia el `database_id` que muestra y pégalo en `wrangler.toml`, en lugar de `REEMPLAZAR-CON-EL-ID-DE-TU-BASE-DE-DATOS`.

**3. Crear la tabla y cargar los 800 registros en la nube:**

```bash
npm run db:remote
```

(Pide confirmación: responde `y`.)

**4. Comprobar la estructura y la carga en la nube:**

```bash
npx wrangler d1 execute pokedex-db --remote --command "SELECT COUNT(*) AS filas FROM pokemon"
```

```bash
npx wrangler d1 execute pokedex-db --remote --command "PRAGMA table_info(pokemon)"
```

**5. Publicar la aplicación:**

```bash
npm run deploy
```

Al terminar muestra la URL pública, con la forma `https://pokedex-serverless.<tu-subdominio>.workers.dev`. Esa URL va en el documento de entrega.

## API

| Ruta | Qué hace |
|---|---|
| `GET /api/pokemon?q=&type=&gen=&legendary=1&page=` | Lista paginada. Si `q` es un número busca por **ID**; si es texto, por **nombre** |
| `GET /api/pokemon/:id` | Detalle de un Pokémon |
| `GET /api/stats` | Totales y promedios por tipo y por generación |
| `GET /api/types` | Lista de tipos |

Las consultas usan parámetros (`bind`), no concatenan texto, para evitar inyección SQL.

## Límites del plan gratuito (consulta las páginas oficiales)

- Workers: 100.000 peticiones por día. ([Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/))
- D1: 5 millones de filas leídas y 100.000 escritas por día, y 5 GB de almacenamiento. ([Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/))

## Generar el documento de entrega

```bash
node scripts/build_entrega.mjs --video "ENLACE_DEL_VIDEO" --app "URL_DE_LA_APP"
```

Crea `entrega/Entrega_Actividad_U4.pdf` con el código fuente, el script de la base de datos y los enlaces.
