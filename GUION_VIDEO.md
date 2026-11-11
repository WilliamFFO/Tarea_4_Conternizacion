# Guion del video — Actividad Sumativa U4 (listo para leer)

**Duración:** unos 14 minutos. **MUESTRA** = lo que pones en pantalla. **LEE** = lo que dices, tal cual.
Lee con calma. Donde dice *[pausa]* respira. Donde dice *[espera]*, deja que termine el comando antes de seguir hablando.

---

## Antes de grabar (5 minutos)

1. Abre las **diapositivas**: doble clic en `presentacion\diapositivas.html`. Pulsa **F** para pantalla completa. Flechas ← → para cambiar.
2. Abre tu **app**: https://pokedex-serverless.pokedex-maestria.workers.dev y recárgala con **Ctrl+F5**. Navega un momento para que carguen las imágenes.
3. En el navegador deja abiertas **dos pestañas del panel de Cloudflare**: **D1 → pokedex-db** (pestaña *Overview*) y **Workers & Pages → pokedex-serverless** (pestaña *Overview*). Arriba a la izquierda el panel muestra tu correo: si no quieres que se vea en el video, grábalo sin esa esquina.
4. Abre una terminal en la carpeta `Tarea4`, con letra grande, y escribe `cls`.
5. Ten abiertos en el editor: `data\pokemon.csv`, `db\schema.sql`, `scripts\csv_to_sql.mjs`, `wrangler.toml`, `src\worker.js` y la carpeta `public\`.
6. Cierra notificaciones. Haz una prueba de 10 segundos de audio.

---

## 1. Introducción (≈ 1:30)

**MUESTRA:** diapositiva 1 (portada). Luego la diapositiva 2.

**LEE:**

> Hola, soy William Fernando Fuentes Ossa. En esta actividad construí una aplicación web con el patrón serverless. Se llama Pokédex Serverless.
>
> El proyecto hace cuatro cosas. Primero, descargué un dataset público de Pokémon con 800 registros. Segundo, lo cargué completo en una base de datos serverless en la nube. Tercero, desarrollé una aplicación web que consulta esos datos con funciones serverless. Y cuarto, la desplegué con una URL pública.
>
> *[pasa a la diapositiva 2]*
>
> Serverless no significa que no existan servidores. Significa que yo no los administro. El proveedor los aprovisiona, los escala automáticamente y solo cobra por uso.
>
> Mi aplicación tiene tres capas. La capa de presentación es un sitio estático. La capa de lógica es una función serverless. Y la capa de datos es una base de datos gestionada por el proveedor. Usé Cloudflare: Workers para la función y D1 para la base de datos.

---

## 2. El dataset (≈ 1:15)

**MUESTRA:** el archivo `data\pokemon.csv` en el editor (que se vean las columnas). Luego la diapositiva 3.

**LEE:**

> El dataset se llama Pokemon with stats. Tiene 800 filas y 13 columnas. Hay texto, como el nombre y los tipos; números enteros, como los puntos de salud y de ataque; y un valor booleano, la columna Legendary.
>
> *[pasa a la diapositiva 3]*
>
> Al revisarlo encontré un detalle importante: la primera columna, el signo numeral, se repite. Las mega-evoluciones comparten el número de su Pokémon base. Por ejemplo, Venusaur y su mega-evolución tienen los dos el número 3. Hay 800 filas, pero solo 721 valores distintos. Por eso no puedo usarla como identificador único.
>
> Mi solución fue crear un ID propio, del 1 al 800, como llave primaria. Y el nombre sí es único, así que lo uso como segunda columna de búsqueda.

---

## 3. Crear la base de datos y mostrar su estructura (≈ 2:30)

**MUESTRA:** el panel de Cloudflare con `pokedex-db`. Luego en la terminal:

```
npx wrangler d1 list
```

Después abre `db\schema.sql` en el editor. Al final, en la terminal:

```
npx wrangler d1 execute pokedex-db --remote --command "PRAGMA table_info(pokemon)"
```

**LEE:**

> La base de datos es Cloudflare D1. Es una base de datos relacional serverless que usa SQL de SQLite. No elegí tamaño de servidor, ni sistema operativo, ni configuré infraestructura. Solo la creé con un comando y Cloudflare se encarga del resto.
>
> *[pantalla del panel D1 → pokedex-db, pestaña Overview. Señala cada cosa con el cursor]*
>
> Esta es la base de datos en el panel de Cloudflare. Se llama pokedex-db y tiene este identificador único. Está en la región de Norteamérica Este. Abajo veo que contiene una tabla y ocupa unos ciento veintitrés kilobytes. Y estas gráficas muestran las consultas que ha recibido. Todo esto lo administra Cloudflare: yo no configuré ningún servidor. Arriba hay una pestaña Console y un botón Explore Data, donde puedo ver los datos de la tabla.
>
> *[pasa a la terminal]*
>
> Y desde la terminal la listo con este comando. *[espera]* Aquí aparece, con el mismo identificador.
>
> *[abre schema.sql]*
>
> Este es el script que crea la estructura. La tabla se llama pokemon y tiene catorce columnas: las trece del dataset más mi ID propio. El id es la llave primaria. El nombre es único. La columna type2 admite valores nulos, porque muchos Pokémon tienen un solo tipo. Y legendary es un booleano guardado como cero o uno. También creé índices por tipo y por generación, para acelerar los filtros.
>
> *[corre el PRAGMA y espera]*
>
> Esta consulta muestra la estructura real que quedó en la nube: los nombres de las columnas, sus tipos de dato, cuáles son obligatorias y cuál es la llave primaria.

---

## 4. Cargar los datos y mostrar la evidencia (≈ 2:00)

**MUESTRA:** `scripts\csv_to_sql.mjs` unos segundos. Luego en la terminal (te pedirá confirmar dos veces: escribe `y` y Enter cada vez):

```
npm run db:remote
```

```
npx wrangler d1 execute pokedex-db --remote --command "SELECT COUNT(*) AS filas FROM pokemon"
```

```
npx wrangler d1 execute pokedex-db --remote --command "SELECT id, name, type1, type2, total FROM pokemon LIMIT 5"
```

Al final, en el panel de Cloudflare (D1 → `pokedex-db`), pulsa **Explore Data** (o la pestaña **Console**) y muestra la tabla `pokemon` con sus filas.

**LEE:**

> Para cargar los datos escribí un script en Node. Lee el archivo CSV, valida que cada fila tenga sus trece columnas y que los números sean enteros, y genera el archivo seed.sql con sentencias INSERT en lotes de veinticinco filas.
>
> Ahora lo ejecuto contra la base de datos en la nube. Este comando primero crea la tabla y luego carga los datos. Wrangler me pide confirmar, y respondo que sí.
>
> *[espera]* Terminó. Procesó treinta y dos sentencias, que son los treinta y dos lotes de veinticinco filas.
>
> Para comprobar que la carga fue completa, cuento los registros. *[espera]* Son ochocientas filas: todas las del dataset.
>
> Y aquí veo los primeros cinco registros, con su tipo y su total de puntos. *[espera]*
>
> En el panel de Cloudflare están los mismos datos, directamente en la nube.

---

## 5. La aplicación y sus componentes (≈ 2:30)

**MUESTRA:** diapositiva 4. Luego, en el editor, uno por uno: `wrangler.toml`, la carpeta `public\` y `src\worker.js`.

**LEE:**

> La aplicación tiene tres componentes, y explico por qué usé cada uno.
>
> *[diapositiva 4]* El navegador entra por la red de Cloudflare. Si pide una página, recibe archivos estáticos. Si pide algo bajo /api, se ejecuta mi función, y solo esa función habla con la base de datos.
>
> *[abre wrangler.toml]* Primero, la configuración. Aquí declaro dos cosas. La carpeta public como sitio estático, con la regla run_worker_first, que ejecuta la función solo para las rutas que empiezan con /api. Y el binding de D1: así la función accede a la base de datos con el nombre DB. Fíjense que no hay contraseñas ni cadenas de conexión en el código.
>
> *[muestra public]* Segundo, el sitio estático: HTML, CSS y JavaScript. Es estático porque no necesita lógica en el servidor. Se sirve desde la red global de Cloudflare, rápido y sin servidor propio.
>
> *[abre worker.js]* Tercero, la función serverless. Es el único código que corre en el servidor, y solo se ejecuta cuando llega una petición. Tiene cuatro rutas: la lista con filtros y paginación, el detalle de un Pokémon, las estadísticas y la lista de tipos. Si la búsqueda es un número, consulta por ID. Si es texto, busca por nombre. Todas las consultas son parametrizadas, para evitar la inyección SQL. Y la función es de solo lectura: cualquier método distinto de GET responde con error 405.

---

## 6. Despliegue (≈ 1:00)

**MUESTRA:** en la terminal:

```
npm run deploy
```

Que se vea la URL final.

**LEE:**

> Para desplegar uso un solo comando. Wrangler sube el sitio estático, sube la función y la conecta con la base de datos. *[espera]*
>
> Al terminar me entrega una URL pública con HTTPS. No creé máquinas, no abrí puertos y no instalé nada en un servidor. Esta es la dirección: pokedex-serverless, punto, pokedex-maestria, punto, workers, punto, dev.
>
> *[pantalla del panel Workers & Pages → pokedex-serverless, pestaña Overview. Señala cada cosa con el cursor]*
>
> Y esta es la función en el panel de Cloudflare, en producción. Aquí está la dirección pública, en workers.dev. El diagrama muestra cómo se conecta: a la derecha, en Bindings, la base de datos D1 con el nombre DB, apuntando a pokedex-db. Es la conexión que declaré en el archivo wrangler.toml. Abajo, las métricas de las últimas veinticuatro horas: las invocaciones de la función, un tiempo de CPU de apenas un milisegundo y cero errores. Y en Deployments aparecen mis despliegues, hechos con Wrangler. Aquí se ve la idea de serverless: no hay una máquina que yo vigile; solo hay una función, su conexión a la base de datos y las métricas de uso.

---

## 7. Demostración (≈ 2:00)

**MUESTRA:** la app en el navegador, en este orden: indicadores y gráfica → buscar `31` → buscar `25` → buscar `char` → Tipo **Dragon** + **Solo legendarios** → **Limpiar** → cambiar de página → clic en una tarjeta.

**LEE:**

> Esta es la aplicación desplegada. Arriba hay cuatro indicadores que salen de la base de datos: ochocientos Pokémon, dieciocho tipos, sesenta y cinco legendarios y un promedio de cuatrocientos treinta y cinco puntos totales.
>
> *[baja a la gráfica]* La gráfica muestra el promedio de puntos por tipo. El tipo Dragon es el más fuerte, con quinientos cincuenta puntos.
>
> *[baja al buscador, escribe 31]* Ahora busco por ID. Escribo treinta y uno. La función detecta que es un número y consulta por la llave primaria: devuelve Pikachu.
>
> *[escribe 25]* Si escribo veinticinco, devuelve Rattata, no Pikachu. Esto es así porque el ID es el número de fila de mi base de datos, no el número de la Pokédex original.
>
> *[escribe char]* Ahora busco por nombre. Escribo char. Devuelve seis resultados: Charmander, Charmeleon, Charizard, sus dos mega-evoluciones, y también Chimchar, porque contiene esas letras.
>
> *[limpia, elige Dragon y marca legendarios]* Ahora uso los filtros. Tipo Dragon y solo legendarios: dieciséis resultados, como Latias, Latios, Rayquaza, Dialga y Palkia, incluyendo algunas mega-evoluciones.
>
> *[pulsa Limpiar]* Limpio los filtros. La lista está paginada: veinticuatro Pokémon por página, treinta y cuatro páginas. *[cambia de página]*
>
> Y si hago clic en un Pokémon, se abre el detalle, con sus estadísticas completas. *[abre una tarjeta y ciérrala]*

---

## 8. Justificación del servicio y del patrón (≈ 2:30) — vale 50 puntos

**MUESTRA:** diapositivas 5, 6 y 7.

**LEE:**

> *[diapositiva 5]* Para justificar mi elección, comparo las tres tecnologías que vimos en el curso.
>
> Con contenedores, yo empaqueto la aplicación, pero la máquina donde corre es mi responsabilidad y está encendida siempre. Con Kubernetes tengo escalado y alta disponibilidad, pero administro un clúster. Con serverless, el proveedor administra todo el servidor, el escalado es automático, incluso hasta cero, y pago solo por uso.
>
> *[diapositiva 6]* ¿Por qué serverless para esta aplicación? Porque es una aplicación de solo lectura, con tráfico intermitente y un dataset pequeño. Tener un contenedor o un clúster encendido todo el día sería pagar por capacidad ociosa. Con serverless pago por uso, escala sola y no administro infraestructura.
>
> ¿Por qué Cloudflare? Porque Workers y D1 están integrados, tienen plan gratuito y se despliegan con un solo comando. Y elegí D1 porque es relacional: el dataset es un archivo CSV, es decir, tabular, y encaja de forma natural en una tabla SQL con llave primaria e índices.
>
> El patrón que apliqué es Functions as a Service, apoyado en servicios gestionados, a veces llamado Backend as a Service. La lógica vive en funciones pequeñas, sin estado y activadas por eventos; aquí, el evento es una petición HTTP. Como la función no guarda estado, el proveedor puede crear o eliminar copias cuando quiera. Por eso el escalado es automático.
>
> *[diapositiva 7]* También hay limitaciones. Primero, el arranque en frío: si la función lleva tiempo sin usarse, la primera petición puede tardar un poco más. Segundo, el plan gratuito tiene límites diarios. Y tercero, la dependencia del proveedor, que reduzco usando SQL estándar y JavaScript, que son portables.

> **Nota para ti (no la leas):** la rúbrica pide usar conceptos vistos en clase. Los términos que uso (FaaS, BaaS, sin estado, orientado a eventos, escalado automático, pago por uso, arranque en frío, dependencia del proveedor) son los habituales de serverless. Compáralos con la lectura de la Unidad 4 y, si ahí usan otra palabra para alguno, cámbiala en la lectura.

---

## Cierre (≈ 0:30)

**MUESTRA:** diapositiva 7 (la del resumen en morado).

**LEE:**

> En resumen: descargué un dataset público, lo cargué completo en una base de datos serverless, desarrollé una aplicación con funciones serverless que busca por ID y por nombre, y la desplegué sin administrar un solo servidor. Gracias.

---

## Después de grabar

- [ ] Se vio la **creación** de la base de datos, su **estructura**, la **carga completa** (800 filas) y el **despliegue**.
- [ ] Explicaste cada componente y **por qué** lo usaste.
- [ ] El video está en **Público** o **No listado** y abre en una ventana de incógnito.
- [ ] Pásame el enlace y genero el PDF final con tu URL y el código actual.
