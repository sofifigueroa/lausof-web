# Lausof SRL — Sitio web

Rediseño del sitio de [Lausof SRL](https://www.lausof.com), empresa de transporte y logística de Salta, Argentina (pasajeros, cargas generales y refrigeradas, 4x4 y taller).

## Objetivo del rediseño

- **Conversión por WhatsApp**: cada servicio tiene su botón con mensaje pre-armado, para que las consultas lleguen clasificadas.
- **Confianza**: habilitaciones, seguros, flota a la vista y testimonios reales.
- **Identidad**: paleta derivada del logo (azul marino, azules, dorado insignia).

## Estructura

```
lausof-web/
├── index.html              # página principal (one-page)
├── flota-en-venta.html     # unidades a la venta (enlace discreto en el pie)
├── robots.txt
├── sitemap.xml
├── css/
│   ├── styles.css          # estilos (tokens de color/tipografía arriba del archivo)
│   └── flota.css           # sólo lo que agrega la página de flota en venta
└── assets/
    ├── unidades/                 # fotos de portada de cada publicación
    ├── *.webp                    # fotos del sitio (calidad 80; el JPEG original queda al lado)
    ├── *-400w.webp, *.avif, …    # variantes generadas por scripts/imagenes.mjs (no se editan a mano)
    ├── *.jpg                     # originales, fuente de futuros recortes; el HTML no los usa
    ├── og-portada.jpg / og-flota.jpg  # 1200×630 para las previews de WhatsApp/Facebook (og:image va SIEMPRE en JPEG: los scrapers no toman bien WebP)
    ├── favicon-96.png            # favicon liviano
    ├── apple-touch-icon.png      # 180×180 sobre fondo blanco
    ├── logo-horizontal.png       # original
    ├── logo-horizontal-web.webp  # optimizado (760px, navbar)
    ├── logo-insignia.png         # original
    └── logo-insignia-web.webp    # optimizado (340px, cierres de página)
```

## Convención para fotos nuevas

- **Nombre descriptivo en español, con guiones**: `servicio-lugar-lausof.webp`
  (p. ej. `auxilio-quebrada-de-las-flechas-lausof.webp`). El nombre del archivo
  es una señal para Google Imágenes; "IMG_4032.jpg" no dice nada.
- **Formato WebP calidad 80** (`cwebp -q 80 -m 6 -metadata none foto.jpg -o foto.webp`),
  guardando el JPEG original al lado. Las variantes AVIF y de menor ancho las
  genera `scripts/imagenes.mjs` (ver "Fotos responsive"). Excepción: las imágenes de `og:image`
  van en JPEG 1200×630, porque los scrapers de WhatsApp/Facebook manejan mal
  el WebP.
- **Alt descriptivo en cada `<img>`**, también en cada cuadro de una galería:
  es lo único que indexa Google Imágenes. Solo los logos decorativos de cierre
  y la foto de fondo del hero/encabezado llevan `alt=""` (las miniaturas de las
  galerías también, pero esas las arma `js/galeria.js` y no están en el HTML).
- **Patentes difuminadas** (Lautaro, 05/11/2026): toda foto que se pone en una
  página nueva o en un lugar nuevo va con las patentes ilegibles, las de Lausof
  y las de cualquier otro vehículo, en el `.jpg`, en el `.webp` y en todas sus
  variantes. Con la biblioteca de fotos lo hace la exportación. Las fotos de la
  fase 1 de fotos se difuminaron a mano (ver «Galería de fotos»).

## Fotos responsive (AVIF + WebP en varios anchos)

Cada foto se escribe en el HTML como un `<img>` común **con `sizes`**, y
después se corre

```bash
node scripts/imagenes.mjs              # genera variantes y reescribe las páginas
node scripts/imagenes.mjs --comprobar  # no escribe nada; sale con 1 si falta algo
```

El script (necesita ImageMagick 7 con AVIF: `brew install imagemagick`) genera
al lado de cada `foto.webp` las variantes `foto-400w.webp`, `-560w`, `-640w`, `-960w`…
(sólo anchos menores al original) y `foto.avif`, `foto-400w.avif`…, todas a
partir del mismo `.webp` publicado (mismo recorte, mismos colores), y envuelve
el `<img>` en `<picture>` con la fuente AVIF y el `srcset`. El `.webp`
original queda como `src` (fallback). Es idempotente; `tests/imagenes.test.js`
falla si una página quedó sin regenerar o si falta una variante.

Lo que el script no decide y va escrito a mano en el `<img>`:

- **`sizes`**: cuánto mide la foto en pantalla en cada ancho. Los valores
  actuales se midieron en Chrome a 360–1920 px de ancho (10/10/2026) y, si la
  foto va con `object-fit:cover`, con el ancho que realmente ocupa la foto
  recortada. Para una foto nueva, copiar el `sizes` de otra en la misma
  grilla.
- **`width`/`height`** del archivo real (evitan saltos de layout).
- **`loading="lazy" decoding="async"`** en toda foto, salvo el logo del menú
  y la foto del hero/encabezado.
- **La foto del hero/encabezado** (la LCP de cada página) es un `<img>` con
  `fetchpriority="high"` dentro de `.hero-photo`/`.page-head-photo`; el
  encuadre que antes daba `background-position` ahora es
  `.page-head-photo img{object-position:…}` en la hoja de cada página. No se
  precarga: ya está en el HTML, y una precarga no sabe qué formato ni ancho
  va a elegir el `<picture>` (bajaría la foto dos veces). En las portadas es
  desde el 05/11/2026 la misma foto en todos los anchos (el minibús en la
  quebrada, una unidad de pasajeros): en desktop va a la derecha del texto y
  en el teléfono queda de fondo, detrás del título.
- **Recorte de teléfono** (`data-movil-media`): el encabezado de `turismo.html`
  y `en/tours-and-transfers.html` lleva
  `data-movil="…/ruta-68-cafayate-salta-lausof-movil.webp" data-movil-media="(max-width: 480px)"`.
  En un teléfono la foto queda limitada por el alto del encabezado y se ve
  sólo su franja central; el recorte es esa franja (900×1067, centrada, alto
  completo), así que se ven los mismos píxeles a la misma escala con la mitad
  de bytes (AVIF 290 KB → 143 KB). Medido el 13/10/2026 en la PC: captura a
  412 px lado a lado sin diferencia visible (RMSE 0,4–0,6 %), y LCP de
  Lighthouse 12.6.1 mobile (simulado, 3 corridas por página, servidor local)
  3,5 s → 2,7–2,9 s en las dos páginas. Para repetir la medición: servir la
  carpeta con `python3 -m http.server` y correr Lighthouse contra
  `/turismo.html` y `/en/tours-and-transfers.html` con
  `--form-factor=mobile --throttling-method=simulate`. Un recorte nuevo
  tiene que conservar el alto del original (`tests/imagenes.test.js`).

Dos cosas que hay que recordar al tocar el código:

- **Todo se pide con ruta desde la raíz** (`/css/styles.css?v=28`, `/assets/…`,
  `/js/…`, y la portada como `/`, nunca `index.html`), en español igual que en
  inglés. Netlify sirve cada página también como `/turismo/` o `/turismo.html/`,
  y desde ahí una ruta relativa (`css/…`) da 404 y la página sale sin diseño
  (auditoría 03/11/2026). `node scripts/rutas-raiz.mjs` corrige las páginas
  solo; `tests/rutas-raiz.test.js` corta si vuelve una ruta relativa. Cada
  página lleva además en `_redirects` su 301 desde la variante sin `.html`
  (`/turismo` → `/turismo.html`); una página nueva necesita su renglón (hay test).
- **La hoja de estilos tiene cache-busting a mano** (`/css/styles.css?v=28`). Cada
  vez que se cambia el CSS hay que subir ese número en los dos HTML, o quien ya
  entró sigue viendo la hoja vieja.
- **Ninguna imagen se mueve sola.** La rotación de fotos de las tarjetas
  (`rotarFotos`, 3,4 s por foto, sin pausa) se borró el 05/11/2026: ninguna
  tarjeta la usaba y habría fallado WCAG 2.2.2. `tests/galeria.test.js` corta
  cualquier animación o temporizador sobre fotos (ver «Galería de fotos»).

## Galería de fotos (fase 1 de fotos, 05/11/2026)

Diseño y decisiones: `web/imagenes-2026-11-05/` (3b-diseno-sitio.md §1–§3 y
su nota del 05/11 sobre autoplay o manual por lugar; textos en 4-textos.md §2).

- **Una galería que maneja el visitante**: `js/galeria.js` (diferido, sin
  librerías) + `css/galeria-componente.css`. En el HTML va una
  `<section class="galeria">` con 3 a 5 `<figure>` (foto + pie) dentro de
  `.galeria-pista`; el marcado exacto está arriba de `js/galeria.js` y lo
  vigila `tests/galeria.test.js`. Sin JavaScript es una tira que se desliza
  con el dedo; con JavaScript suma miniaturas, anterior/siguiente, contador,
  ←/→/Inicio/Fin y «Ampliar», que abre un `<dialog>` con la foto a su ancho
  real como mucho. Mide el uso con el evento GA4 `galeria` (`accion`:
  miniatura, anterior, siguiente, ampliar).
- **Las fotos de la galería no le compiten a la del encabezado** (06/11/2026):
  con `loading="lazy"` solo, Chrome pide las fotos de una galería cercana al
  borde (su margen es 1250–2500 px) mientras baja la del encabezado. Por eso,
  con JavaScript, las fotos de la pista quedan en espera (`display:none`, el
  `<picture>` guarda el cuadro 4:3) hasta que `js/galeria.js` le pone
  `.galeria-cerca` a la sección: al acercarse a 300 px de la pantalla o al
  terminar de cargar la página, lo que pase primero. Las miniaturas se piden
  sólo al acercarse. La galería con `data-lcp` no espera. Lighthouse móvil
  simulado, cargas refrigeradas: LCP 2,25 → 1,95 s; `galeria.js` en sí no
  pesaba (sacarlo dejaba 2,25 s). Sin JavaScript carga todo como siempre.
- **Dónde va**: sólo donde el visitante mira varias vistas de una misma cosa
  (un tipo de unidad, un camión, una ruta). Con menos de 3 fotos no hay
  galería: van fijas, con su pie. Ninguna rota sola. Si algún día una tira que
  sólo ambienta tiene que rotar, se construye con pausa visible, 5–7 s, freno
  con el mouse y el foco, nada en teléfonos ni con movimiento reducido, y se
  cambia el test para exigir ese control.
- **Página de flota** (`galeria.html`): un bloque por tipo de unidad, con el
  nombre, el orden y el texto de la tabla «Qué podemos mover» de la portada
  (el test los compara). Hasta 5 fotos por tipo, elegidas a mano; ninguna
  página muestra todas las fotos que hay. Un tipo sin foto propia y limpia va
  sin galería, sin «próximamente».
- **Techos de fotos por página** (`tests/galeria.test.js`): portadas 5, hubs 7,
  páginas de servicio y de ruta 6 (encabezado + una galería de ≤5), flota ≤5
  por tipo. `golf-torneos.html` es la única excepción fechada (caras sin
  permiso, fase 2) y sólo puede bajar.
- **Fotos retiradas**: una sola lista en `tests/servicios-retirados.test.js`
  (grúa, camión rotulado «AUXILIO», teléfono viejo), con las que quedan a
  propósito hasta la revisión del logo (~04/01/2027).
- **Anuncio al lector de pantalla** (WCAG 4.1.3): la pista se desplaza sin
  cambiar el DOM, así que no anuncia nada; anuncia el contador, una región
  `aria-live="polite"` con la parte visible («2 de 3») oculta al lector y una
  parte sólo para el lector («Foto 2 de 3: pie»). Arranca vacía y se llena
  tras un gesto del visitante (la página no anuncia las galerías al cargar);
  con la foto ampliada anuncia el contador del diálogo y el de atrás se calla.
- **Control en navegador**: `node scripts/galeria-navegador.mjs` (teclado,
  diálogo, foco, anuncio, deslizar, nada que se mueva, sin scroll horizontal a 390 y 1440 en las
  páginas tocadas; `--capturas DIR` guarda PNG). Usa Chrome sin ventana y el
  protocolo de DevTools, sin dependencias. En la PC de pruebas va por el gate:
  `~/.lausof-fleet/remote-gate.sh --no-db --require-clean <worktree> -- node scripts/galeria-navegador.mjs`.
- **Patentes de la fase 1**, difuminadas en `.jpg`, `.webp` y variantes:
  `refrigerados-3-interior-v2`, `refrigerados-4-trasera-v2`, `pasajeros-4-ruta-v2`,
  `4x4-1-salinas-v2`, `4x4-3-cerros-v2`, `pasajeros-3-taller-v2`, `pasajeros-5-flota-v2`
  y `galeria/lausof-salinasgrandes-combis-v2`. Las variantes se rehicieron con
  los mismos parámetros de `scripts/imagenes.mjs`, que no regenera lo que ya
  existe.
- **Una foto que cambia, cambia de nombre.** `/assets/*` se sirve un año como
  `immutable` (`_headers`): si se reescriben los bytes de un archivo con el
  mismo nombre, quien ya lo vio sigue viendo el viejo. Al difuminar o
  retocar una foto publicada se le suma `-v2`, `-v3`… a todas sus variantes
  (`foto-v2.webp`, `foto-v2-400w.avif`…) y se cambian todas las referencias;
  así se hizo con las 8 de arriba (antes sin `-v2`).

## Fotos de la biblioteca (`assets/fotos/`, lote 1 del 06/11/2026)

Las fotos que Lautaro aprueba de la biblioteca «Fotos para mostrar»
(`web/imagenes-2026-11-05/3a-diseno-biblioteca.md`) entran en
`assets/fotos/<categoría>/<servicio-lugar>-lausof-vN.webp`, con su `.jpg` al
lado, 1600 px en el lado largo, sin metadatos (GPS incluido) y con **todas**
las patentes difuminadas. Cada una se revisó a tamaño completo antes de entrar.

- **`assets/fotos/biblioteca.json`** es la lista: id del registro (`F0044`…),
  archivo, medidas, `alt_es`, crédito, lote, fecha de aprobación, `sha256` del
  `.webp` y `usos` (las páginas que la muestran). Sólo campos públicos. Las
  rechazadas van en `rechazadas` (F0326, lote 1).
- **`tests/biblioteca.test.js`** corta: un archivo en `assets/fotos/` que no esté
  en la lista; una página que use de ahí una foto que no esté; una foto rechazada;
  bytes que cambian sin cambiar de nombre (el `sha256`); `usos` desactualizado;
  y una foto de la biblioteca en un encabezado con menos de 1600 px de ancho o
  vertical (3b §1.1).
- **Para sumar una foto aprobada:** exportarla con el mismo difuminado, copiarla
  a su categoría, agregarla a `biblioteca.json`, ponerla en la página, correr
  `node scripts/imagenes.mjs` y actualizar `usos`.
- **Lote 1:** 40 fotos aprobadas, 16 en uso. Encabezados que tenían la insignia
  vieja (producciones, alquiler 4x4, charter, clubes, estudio, combi con chofer,
  casamientos, internacionales, empresas; ES/EN donde existe) y el de cargas
  refrigeradas; las galerías de la página de flota; la galería del furgón en
  cargas refrigeradas ES/EN; la tira de Salinas Grandes ES/EN/PT; la foto de
  autoelevadores. Además, dos fotos con insignia salieron por su gemela limpia
  que ya estaba en el repo: `galeria/lausof-4x4-salinasgrandes` →
  `4x4-1-salinas-v2` y `galeria/lausof-combi-ruta40-cachi-cafayate` →
  `pasajeros-4-ruta-v2`.
- **Lote 2 (06/11/2026):** Lautaro aprobó 64; entran al repo sólo las 8 que
  van en una página (las demás quedan en la biblioteca de Drive y en
  `web/imagenes-2026-11-05/curaduria-2/`; tabla de lugares y motivos en
  `web/imagenes-2026-11-05/9-notas-builder-lote2.md`). Fotos con la insignia
  vieja que salen: `turismo/camino-de-ripio-4x4-lausof` de sus 18 páginas →
  la Amarok en ripio de altura (F0042), y `turismo/purmamarca-cerro-siete-colores-lausof`
  de 20 de sus 23 → Purmamarca y el cerro de los Siete Colores (F0083; queda
  en peregrinaciones y en la tarjeta de Uyuni de viajes internacionales ES/EN,
  donde la vieja muestra las combis y la nueva sería sólo paisaje). `4x4-3-cerros-v2` (insignia)
  → la camioneta con baliza (F0254). `refrigerados-1-lateral` (722 px) → el
  mismo Iveco de costado a 1280 px (F0183), en las portadas y producciones. La
  página de flota suma la galería del camión 4x4 refrigerado (F0193, F0145,
  F0152); logística minera muestra ese camión en su tarjeta (antes había un
  Iveco común) y la flota en la Puna (F0104) en «Cargas y equipos a los salares».

## Flota en venta

Los precios, los enlaces y las unidades salen de **un solo archivo**:
`scripts/unidades.mjs`. Después de editarlo hay que correr

```bash
node scripts/generar-flota.mjs
```

que reescribe las tarjetas y los datos para Google dentro de
`flota-en-venta.html` (las zonas generadas están marcadas con
`<!-- GENERADO ... -->`; no se tocan a mano). Cuando se republica una unidad
cambia su número de publicación: hay que pegar el enlace largo de Mercado
Libre, el que termina en `_JM`. Los enlaces cortos le piden al visitante que
inicie sesión y no muestran nada.

Dos cosas propias de esta página:

- **El WhatsApp no es el mismo que el de la home.** Las unidades se consultan al
  **387 509-2489**, que es la línea de ventas y se atiende por mensaje, no por
  llamada. Por eso ese número aparece sólo como enlace `wa.me` y nunca como
  `tel:`. Los teléfonos de la empresa, que sí toman llamadas, siguen siendo los
  del pie. Si cambia el número de ventas hay que tocar la constante `WHATSAPP`
  y los enlaces `wa.me` de esta página, y ninguno de `index.html`.
- **Una unidad puede estar publicada en más de un sitio** (`otrosAvisos` en su
  bloque de configuración). De esos avisos va sólo el enlace: el precio que vale
  es el de Mercado Libre, porque los demás sitios lo redondean.

## Versión en inglés

El sitio se publica en dos idiomas. El español es el original; el inglés vive
bajo `/en/` y hoy son ocho páginas más su propia 404:

| Español | Inglés |
|---|---|
| `index.html` | `en/index.html` |
| `logistica-minera.html` | `en/mining-logistics.html` |
| `transporte-de-personal.html` | `en/personnel-transport.html` |
| `turismo.html` | `en/tours-and-transfers.html` |
| `alquiler-4x4.html` | `en/4x4-rental.html` |
| `cargas-refrigeradas.html` | `en/refrigerated-freight.html` |
| `deposito-galpon.html` | `en/warehouse.html` |
| `producciones.html` | `en/film-production-logistics.html` |

**El mapa `pares` de `tests/util.js` es la única fuente de verdad** de qué
página tiene gemela. De ahí salen el hreflang, el selector de idioma, el
sitemap y la guardia de que ninguna página de `/en/` quede huérfana. `en/404.html`
no entra al mapa: no se indexa, no lleva hreflang y no va al sitemap.

Cuatro reglas que no se negocian:

- **Todas las rutas de `/en/` son root-absolutas** (`/css/styles.css?v=25`,
  `/assets/…`, `/logistica-minera.html`). Una ruta relativa desde un
  subdirectorio resuelve a `/en/assets/…` y rompe las imágenes. Hay un test.
- **El hreflang tiene que ser recíproco.** Las tres líneas (`es`, `en`,
  `x-default`) son idénticas en las dos gemelas y el `x-default` apunta
  **siempre** al español. Si una sola de las dos no apunta a la otra, Google
  descarta el bloque entero.
- **La portada de cada idioma es un directorio** (`/` y `/en/`), nunca
  `/en/index.html` (que redirige 301). Vale para la canónica, el hreflang, el
  sitemap y el `href` del selector.
- **Un solo `.lang-switch` por página**, el de la barra superior. El enlace de
  idioma del pie lleva la misma forma en las 27 páginas pero **sin** esa clase:
  con dos, la guardia del selector cuenta dos enlaces y falla.

**Para sumar una gemela nueva:** se escriben las dos páginas, se agrega el
renglón a `pares`, se le pone a la española el bloque hreflang (debajo de la
canónica), el `og:locale:alternate` y el selector deep-link, se suma el `<url>`
al sitemap y se suben los contadores de `tests/paginas.test.js` (URLs del
sitemap) y `tests/contenido.test.js` (logos decorativos). Las dos gemelas van
**en el mismo deploy**: media gemela publicada es peor que ninguna.

El generador `scripts/generar-flota.mjs` no se tocó y `flota-en-venta.html`
**no tiene gemela inglesa** (sus textos están hardcodeados en castellano dentro
del generador). Las páginas en inglés no la enlazan.

## Versión en portugués (Brasil)

Desde el 03/11/2026 hay 7 páginas en portugués de Brasil bajo `/pt/`, sólo
para el mercado brasileño de turismo (recomendación y reglas:
`web/seo-deep-2026-11-03/E-languages-markets.md` §3): portada, paseos y
traslados, San Pedro de Atacama, Uyuni, Salinas Grandes, Cafayate y la
Quebrada. El mapa es `paresPt` en `tests/util.js` (clave = página en español).

- **Grupos es/en/pt:** cada página del mapa y sus dos gemelas llevan el mismo
  bloque hreflang de cuatro líneas (es, en, pt, x-default al español). Las
  demás páginas siguen con su par ES/EN y **no** llevan `pt`.
- **Selector y pie:** en esos grupos hay un `.lang-switch` por cada otro
  idioma (orden es · en · pt) y un enlace de pie por cada otro idioma.
- `<html lang="pt-BR">`, `og:locale` pt_BR, `inLanguage` "pt-BR". El
  correo es sólo `transporte@lausof.com`; el WhatsApp abre con "Olá Lausof".
  Los renglones en portugués están en `scripts/prefill.mjs` (`pt` de cada tipo).
- Los enlaces a páginas que no tienen versión pt van a la página en español,
  con `hreflang="es"` y la aclaración "(em espanhol)".
- Los datos para el viajero brasileño (vuelo GOL Rio–Salta desde el
  17/12/2026, documentos por la Decisión MERCOSUL/CMC 10/26, julio como
  temporada alta) viven en `#brasil` de `pt/passeios-e-traslados.html`, con
  fuente y fecha; las otras páginas enlazan ahí. Guardias:
  `tests/portugues.test.js`.
- No hay 404 en portugués: una ruta inexistente bajo `/pt/` cae en la 404 en
  español. Los scripts recorren `/en/` y `/pt/` desde `CARPETAS_IDIOMA` en
  `scripts/rutas-raiz.mjs`.

## Hub «Empresas y minería» (05/11/2026)

Estructura del sitio aprobada el 05/11/2026 (`~/lausof/web/estructura-sitio-2026-11-05/`:
diseño `3a-diseno-estructura.md` §3.3 y §3.6.1, wireframes `3a-wireframes/hub-empresas-*`,
textos `4-textos.md` §2, decisiones `DECISION-2026-11-05.md`).

- **Páginas:** `empresas-y-mineria.html` y `en/business-and-mining.html`, gemelas en
  `pares`. No hay hub en portugués: el sitio pt es sólo de turismo.
- **Orden:** migas, encabezado (H1, bajada, tres caminos: WhatsApp, mail y pedido de
  documentación), las ocho pruebas en el orden de compras (CNRT, AMT, todas las zonas
  mineras, 24 h, Factura A, flota y taller, desde 2010, viajes internacionales),
  `#personal` y `#cargas` (EN `#crew`, `#freight`), `#seguridad`, `#equipamiento`,
  `#como-trabajamos`, `#documentacion` y el cierre `#contacto`. Las fichas sin página
  propia llevan ancla: `#traslado-de-vehiculos`, `#taller` (EN `#vehicle-transfers`,
  `#workshop`, `#corporate-transfers`, `#forklifts`).
- **Reglas:** todo el texto sale de lo ya publicado (seguridad de la portada,
  equipamiento de minería); sin cantidades de flota, aseguradora, número de AMT,
  clientes, portales de contratistas (salvo en el panel del servicio, abajo) ni promesa
  de tiempo de respuesta. En español,
  impersonal (sin vos ni tú).
- **Contacto:** tipo `empresa` en `scripts/prefill.mjs`; el pedido de documentación es
  un `mailto` con `data-prefill="proveedor"` y asunto «Documentación para alta de
  proveedor» (EN «Supplier registration — Lausof documents»). En teléfono la barra fija
  es Llamar · Mail · WhatsApp (`.wa-bar.tres`).
- **Servicio «Documentación de ingreso»** (EN «Mine entry documents»; aprobado el
  05/11/2026, `~/lausof/web/servicio-documentacion-2026-11-05/`, alcance D6B: vehículos
  y personal). La oficina carga y mantiene al día los papeles de los vehículos y del
  personal de un contratista en los portales de las mineras. Vive en el hub, sin página
  propia: ficha en `#personal`/`#crew` después de «4x4 mensual», panel
  `#documentacion-flota` (EN `#fleet-documents`) primero dentro de `#documentacion`,
  al lado del alta de proveedor (`.docs-par`), un ítem del menú y un enlace en
  «Otros servicios» de litio. Botones con `data-prefill="documentacion-flota"` y asunto
  propio `ASUNTO_FLOTA` (`tests/util.js`). SICOP, Exactian y Minexus se nombran sólo en
  ese panel, una vez cada uno, con la nota `.nota-marcas`; ninguna otra página los
  nombra. GA4 lo cuenta por `link_position` = `documentacion-flota` / `fleet-documents`.
  Guardias: `tests/hub-empresas.test.js` y `tests/documentacion-flota.test.js`.
- **Miga de la sección:** las 14 páginas de empresas llevan
  `Inicio › Empresas y minería › Personal para minería | Cargas › página`, visible y
  como `BreadcrumbList`. `.crumbs` vive en `styles.css` (antes en `turismo.css`).
- **Anclas nuevas:** `alquiler-4x4.html#empresas` y `en/4x4-rental.html#companies`
  (la 4x4 mensual para empresas, enlazada desde el hub).
- Guardias: `tests/hub-empresas.test.js`.

## Ficha de la empresa en los datos estructurados

Todas las páginas referencian la entidad `https://www.lausof.com/#empresa`
por su `@id`. Como cada buscador lee cada página por separado, la ficha
(razón social LAUSOF S.R.L., marca Lausof Transportes, Junín 1334, la línea
387 526-9009, CUIT, logo y la habilitación CNRT N.º 60284 como `identifier`
y `hasCertification`) va escrita en todas:

```bash
node scripts/empresa.mjs              # escribe el bloque GENERADO:EMPRESA en cada página
node scripts/empresa.mjs --comprobar  # no escribe nada; sale con 1 si falta o cambió
```

Los datos salen de un solo lugar, `FICHA` en `scripts/empresa.mjs`. La
portada no lleva el bloque generado: su JSON-LD es la ficha ampliada
(descripción, horario, fotos, catálogo) y tiene que repetir igual cada dato
de `FICHA`. Una página nueva necesita correr el script antes del commit;
`tests/empresa.test.js` falla si una página no resuelve `#empresa`, si el
bloque quedó viejo o si la ficha publica algo que la política de
afirmaciones deja afuera (número de AMT, aseguradora, otros teléfonos).

## Medición de contactos

El sitio no tiene formularios: un contacto es un clic en WhatsApp, en un
teléfono o en un mail. Cada uno de esos clics manda su propio evento a Google
Analytics 4 (propiedad `G-GHHRS5LDE7`), para poder contarlos por canal, página,
idioma y país.

| Evento | Se manda al hacer clic en… |
|---|---|
| `contact_whatsapp` | un enlace a `wa.me` o `api.whatsapp.com` |
| `contact_phone` | un enlace `tel:` |
| `contact_email` | un enlace `mailto:` |

Los tres llevan los mismos parámetros:

| Parámetro | Valor |
|---|---|
| `contact_channel` | `whatsapp`, `phone` o `email` |
| `page_language` | `es` o `en` (sale del `lang` de la página) |
| `contact_page_path` | la ruta de la página (`/turismo.html`, `/en/`) |
| `link_position` | `header`, `hero`, `puerta` (las tres puertas de las portadas), `cta_final`, `quick_bar` (la barra fija de abajo), `footer`, o el `id` de la sección que contiene el enlace (`servicios`, `services`…) |
| `link_text` | el texto visible del enlace ("Cotizar por WhatsApp"). Si el texto es un número o una casilla, va el nombre del canal |
| `seccion` | el `data-seccion` del `<body>`: `turismo`, `empresas`, `inicio` o `institucional` |
| `tipo` | el `data-tipo` del `<body>`: el tipo de la página en `PAGINAS` (`scripts/prefill.mjs`), p. ej. `pasajeros`, `refrigerado`, `empresa` |

`seccion` y `tipo` los escribe `scripts/menu.mjs` en cada página y sirven
para leer los contactos por sección del sitio (estructura del 05/11/2026,
`web/estructura-sitio-2026-11-05/3a-diseno-estructura.md` §7). Si una página
no los tiene, el parámetro no va.

**Dónde vive:** `js/contacto.js`, un solo listener delegado sobre el documento.
Cada página lo carga en el `<head>` con
`<script defer src="/js/contacto.js?v=2"></script>`, siempre con ruta absoluta
(las páginas de `/en/` y las 404 se sirven desde otras rutas). Un enlace de
contacto nuevo queda medido solo; una página nueva tiene que llevar esa línea
(hay un test). `/js/*` se cachea un año: **si se cambia el archivo hay que
subir el `?v=` en todas las páginas**, igual que con la hoja de estilos.

**Lo que no hace, a propósito:** no frena ni modifica la navegación (el enlace
se abre igual si Analytics está bloqueado o falla) y no manda ningún dato
personal: ni el número, ni la casilla, ni el mensaje pre-armado de WhatsApp.

**Por qué estos nombres** (documentación de Google consultada el 10/10/2026):

- Google pide usar un evento recomendado cuando la acción coincide con uno
  ([Custom events](https://support.google.com/analytics/answer/12229021)). El
  más cercano es `generate_lead`, que se define como "submits a form or a
  request for information"
  ([Recommended events](https://support.google.com/analytics/answer/9267735)).
  Un clic que abre WhatsApp o el teléfono todavía no envió nada, así que no se
  usa `generate_lead`: contaría como lead lo que es una intención de contacto,
  y quedaría mezclado con leads reales si un día se suma un formulario. Esto es
  una decisión de criterio, no una regla de Google. Son eventos propios, con
  nombres que cumplen las reglas (letras, números y guion bajo, empiezan con
  letra, sin nombres reservados:
  [Event naming rules](https://support.google.com/analytics/answer/13316687)).
- Son tres eventos y no uno con un parámetro porque un evento clave se marca
  por nombre de evento: así cada canal se cuenta solo, sin pasos extra.
- Límites ([Event collection limits](https://support.google.com/analytics/answer/9267744)):
  nombre de evento y de parámetro hasta 40 caracteres, valor hasta 100, 25
  parámetros por evento. El script recorta los valores a 100.
- `link_text` es un parámetro que GA4 ya conoce (dimensión "Link text"). Los
  otros seis son propios: para verlos en los informes hay que registrarlos
  como dimensiones personalizadas de evento en el administrador de GA4
  ([Custom events](https://support.google.com/analytics/answer/12229021)). La
  página y el país ya vienen solos en todos los eventos.

**Doble conteo.** La medición mejorada de GA4 sigue mandando su evento `click`
automático en los enlaces que salen del dominio
([Enhanced measurement](https://support.google.com/analytics/answer/9216061)),
o sea que un clic en WhatsApp genera `click` y `contact_whatsapp`. Son dos
eventos con nombres distintos y no se suman entre sí: los contactos se cuentan
con `contact_*`, y `click` no se marca como evento clave.

**En GA4 (no se hace desde el código):** marcar `contact_whatsapp`,
`contact_phone` y `contact_email` como eventos clave (Admin → Data display →
Events; si todavía no aparecen, "Create event" con el mismo nombre y "Mark as
key event":
[Mark events as key events](https://support.google.com/analytics/answer/13128484)),
y registrar las dimensiones personalizadas `contact_channel`, `page_language`,
`contact_page_path`, `link_position`, `seccion` y `tipo`.

**Cómo probarlo:**

- `npm test` corre `tests/medicion.test.js`: ejecuta el script de verdad contra
  un documento de utilería y revisa cada canal, los parámetros, que no viajen
  datos personales, que no haya error sin `gtag`, y que todas las páginas
  carguen el script.
- En el navegador: herramientas de desarrollo → Red → filtrar `collect`, hacer
  clic en un botón de contacto y buscar `en=contact_whatsapp` (o `_phone`,
  `_email`) en el pedido. En GA4 aparece a los pocos minutos en el informe de
  tiempo real.

## Servicios retirados (04/11/2026)

Decisiones de Lautaro del 04/11/2026; las vigila `tests/servicios-retirados.test.js`
y la parte 4x4 de `tests/alquiler-mineria.test.js`.

- **Grúa y remolque.** La grúa de plancha (Accelo 1016) se vendió y el
  remolque para particulares ya no se ofrece. `grua-salta.html` y
  `en/tow-truck-salta.html` redirigen con `301!` a `/` y `/en/`. No vuelven:
  "plancha", "grúa"/"tow truck", aseguradoras, los 7,5 t ni la tarjeta de
  auxilio 24 hs. Lo que sí se ofrece, en minería, cargas y empresas: el
  **traslado de vehículos para empresas y mineras**, cotizado a pedido y
  coordinado por Lausof (el camión lo pone un tercero que no se nombra), sin
  prometer 24 hs ni unidad propia. Los mecánicos propios pueden ir hasta el
  vehículo (asistencia mecánica en el lugar).
- **4x4 sin chofer para turistas.** No se ofrece: en Salta el alquiler a
  turistas es "rent a car" y pide habilitación provincial (Decreto 2461/00,
  modificado por los 2112/10 y 636/14; `web/tarifario/informes/alquiler.md`).
  `alquiler-4x4.html` y `en/4x4-rental.html` conservan su URL: a viajeros, 4x4
  con chofer (también a Chile y Bolivia); a empresas y contratistas, alquiler
  mensual con o sin chofer. A quien quiere manejar o dejar la camioneta en
  otra ciudad, una línea honesta: no, pero se le pueden recomendar empresas de
  alquiler habilitadas (sin nombrarlas) o hacer el viaje con chofer.
- **Pendiente fuera del código:** el logo (`logo-horizontal*`) todavía dice
  "Pasajeros | Cargas | Remolques" en la imagen (el `alt` ya es "Transportes
  Lausof"), y `og-portada.jpg` muestra camiones pintados con "Auxilio
  mecánico". Hacen falta versiones nuevas de esas dos imágenes.

## Mensajes pre-armados de WhatsApp y correo

Cada `wa.me` y cada `mailto:` lleva, debajo de su primera línea, los datos
para cotizar como renglones para completar (fecha, pasajeros, lugar de
salida, solo ida o ida y vuelta, y lo propio del servicio: vuelo en el
aeropuerto, ubicación y vehículo en la asistencia mecánica, días y si es
viajero o empresa en la 4x4).
Los arma `scripts/prefill.mjs`; no se escriben a mano.

```bash
node scripts/prefill.mjs              # reescribe los enlaces de todas las páginas
node scripts/prefill.mjs --comprobar  # no escribe nada; sale con 1 si algo no está al día
```

- **La primera línea** (la que nombra el servicio, la ruta o la fecha del
  evento) se escribe en el HTML y el script no la cambia.
- **Los renglones** salen del tipo de la página (`PAGINAS` en el script) o del
  atributo `data-prefill="tipo"` de un enlace que cotiza otra cosa (el
  taller en la portada, las tareas de minería y rodajes).
- **El wa.me del pie**, sin texto, toma la primera línea más usada en la página.
- **El correo** conserva destinatario, copia a transporte@ y asunto, y suma el
  `body=` con los mismos renglones.
- **Página nueva:** agregar su renglón en `PAGINAS` (tipos en `TIPOS`), correr
  el script y commitear el HTML. `tests/prefill.test.js` falla si una página con
  contacto no tiene tipo o quedó sin regenerar.
- Las zonas `<!-- GENERADO:... -->` (tarjetas de la flota) son de otro script y
  no se tocan.
- `js/contacto.js` no cambia: mide el clic por el `href` y nunca manda el texto.

## Menú, secciones y portadas (estructura del 05/11/2026)

Estructura aprobada por Lautaro el 05/11/2026 (opción A, sin mover ninguna
URL): `~/lausof/web/estructura-sitio-2026-11-05/` (diseño `3a-diseno-estructura.md`
y `3a-wireframes/`, textos `4-textos.md`, decisiones `DECISION-2026-11-05.md`).

- **Dos secciones**: «Turismo y traslados» (hub `/turismo.html`) y «Empresas y
  minería» (hub `/empresas-y-mineria.html`, en inglés
  `/en/business-and-mining.html`), con dos líneas: Personal para minería y
  Cargas. El orden de las líneas en todo el sitio es Turismo y traslados ·
  Personal para minería · Cargas.
- **El menú sale de un solo lugar**, `scripts/menu.mjs`, como el prefill:

  ```bash
  node scripts/menu.mjs              # reescribe el menú y los atributos de <body>
  node scripts/menu.mjs --comprobar  # no escribe nada; sale con 1 si algo quedó viejo
  ```

  Escribe en cada página la zona `<!-- GENERADO:MENU -->` (los dos
  desplegables de escritorio, la etiqueta de sección y el botón «Menú» con su
  hoja en el teléfono), la zona `<!-- GENERADO:PIE -->` de las portadas (las
  dos columnas de sección del pie), en el pie de todas las páginas las zonas
  `<!-- GENERADO:FACTURACION -->` («Datos de facturación»: razón social, CUIT,
  factura) y `<!-- GENERADO:LEGAL -->` (las dos líneas finales), con los
  textos de `PIE_DATOS` (una línea extra de una página va en
  `EXTRAS_FACTURACION`), y, en `<body>`, `data-seccion`
  (`turismo`/`empresas`/`inicio`/`institucional`), `data-linea`
  (`personal`/`cargas`, sólo empresas) y `data-tipo` (el tipo de `PAGINAS` de
  `prefill.mjs`). Esos atributos hoy no los lee nada: son el enganche del
  asistente del sitio, que se instala más adelante.
- **Página nueva**: si es de empresas, va en `EMPRESAS` (con su línea); si es
  institucional, en `INSTITUCIONAL`; si no, queda en turismo. Correr el
  script y commitear el HTML. Lo vigila `tests/menu.test.js` (menú al día e
  igual en todas las páginas de un idioma, enlaces que existen, ninguna URL
  movida, el sitemap no achica).
- **Enlaces entre secciones** (3a §3.4, `tests/cruces.test.js`): una página
  de turismo llega a las de empresas sólo por el menú y por la zona
  `<!-- GENERADO:CRUCE -->` del pie (un enlace al hub de empresas; en las de
  empresas, al hub de turismo), que también escribe `scripts/menu.mjs`. En el
  cuerpo no lleva enlaces a empresas salvo las excepciones de `PERMITIDOS`
  en el test (San Antonio de los Cobres → logística minera, agencias →
  traslados corporativos), y nunca enlaces, fotos ni prefill de cargas. Minería
  y cargas sí se enlazan entre sí. El test lee la sección de cada página de su
  `data-seccion`, así que una página nueva queda cubierta sola.
- **Desplegables con `<details>`**: abren y cierran sin JavaScript;
  `/js/menu.js` sólo cierra lo abierto al tocar afuera, con Escape o al elegir
  un enlace. En el teléfono (≤880 px) el idioma se ve como código (ES, EN, PT)
  para que entre el botón «Menú».
- **Portadas**: un H1 sólo de transporte de pasajeros y las tres líneas como
  tres puertas en la primera pantalla (1440×900 y 390 px), con la barra de
  afirmaciones debajo. El texto nuevo va en registro impersonal (las páginas
  viejas siguen en voseo, decisión d). Lo vigila `tests/portadas.test.js`.

## Cabeceras de seguridad

El bloque `/*` de `_headers` manda en todas las páginas `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, un
`Permissions-Policy` que niega cámara, micrófono, ubicación, pagos y sensores, y
`Content-Security-Policy: frame-ancestors 'self'` (nadie enmarca el sitio). HSTS
lo pone Netlify solo.

La política de contenido completa va como `Content-Security-Policy-Report-Only`:
no bloquea nada, sólo avisa en la consola con "[Report Only]". No se aplica
todavía porque GA4 con funciones de anuncios pide un dominio `google.<TLD>`
por país y uno que falte cortaría la medición sin que nadie lo vea. Para
aplicarla: revisar en producción la consola de varias páginas (y un clic en
WhatsApp) sin avisos, y mover la línea a `Content-Security-Policy`. Si una
página empieza a cargar algo de otro dominio (una fuente, un mapa, un video),
`tests/cabeceras.test.js` corta hasta que se lo sume a la política. Después de
cada deploy que toque `_headers`: `curl -sI https://www.lausof.com/turismo.html`.

## Cómo verlo en local

Servirlo (abrirlo con doble click ya no sirve: las rutas son desde la raíz y
`file://` no tiene raíz):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Pendientes

El sitio ya está online, así que nada de esto va al HTML hasta tenerlo
confirmado: mejor que falte un dato a que figure uno equivocado.

Cada pendiente está marcado en el HTML con un comentario `PENDIENTE:` en el
lugar exacto donde entra el dato. Se pueden buscar todos con
`grep -n PENDIENTE index.html`.

El **16/08** Lautaro confirmó una tanda de datos y esas afirmaciones ya están
publicadas: habilitaciones CNRT y AMT vigentes, seguro de carga y pasajeros
vigente, agencia de turismo habilitada, registro de temperatura durante el
viaje, psicofísicos y ART de los choferes al día, GPS en las unidades en
servicio, más de una década de trabajo en la Puna y los 120.000 km de la
ML350. (La capacidad de carga de 7,5 toneladas era del camión plancha, el
Accelo 1016, vendido: salió del sitio el 04/11/2026.) De todo eso siguen
faltando los números (CNRT, AMT, legajo de la agencia) y el nombre de la
aseguradora, que son lo único que se publica cuando lleguen.

**10/10/2026 (BUILD-BRIEF de Lautaro):** se quedan en el sitio las
afirmaciones que el cliente busca para reservar, aunque el papel esté en
trámite: atención las 24 hs, agencia de turismo habilitada,
habilitación AMT como afirmación general (nunca su número de permiso ni de
expediente) y viajes al exterior (Chile, Bolivia y otros destinos). Las
vigila `tests/contenido.test.js`.

Papeles y habilitaciones:

- [ ] **N° de habilitación CNRT y N° de habilitación AMT**. Que las dos están
      vigentes lo confirmó Lautaro el 16/08 y ya figura en la franja y en la
      tarjeta de personal; falta el número de cada una para poder publicarlo
- [ ] **N° de legajo de la agencia de turismo**. Que está habilitada ya figura en
      la tarjeta de turismo; falta el legajo
- [ ] **Aseguradora**: qué compañía y qué cubre (RC, carga, pasajeros). El seguro
      vigente ya figura en la franja y en Seguridad, pero sin nombre de compañía
- [ ] **Condición frente al IVA** (¿Responsable Inscripto?) → datos para proveedores
- [ ] **Razón social exacta como figura en el registro**: aparece como "LAUSOF
      TRANSPORTES..." en distintas fuentes, así que hasta que papá la confirme
      letra por letra va sólo "Lausof S.R.L.", que sí está confirmado → datos
      para proveedores y ficha de Google. El CUIT (30-71146774-9) ya está

Contacto:

- [x] **Atención las 24 hs**: era la guardia de auxilio, confirmada por la familia
      el 10/10/2026 (BUILD-BRIEF); desde el 04/11/2026, sin grúa, figura como
      atención de la empresa en el pie de las portadas y en el JSON-LD
- [ ] **Horarios de atención** de oficina, si se quieren publicar aparte
- [ ] **Dirección**: Junín 1334 y Siria 1333 son dos. ¿Cuál puede visitar un
      cliente? Y en las facturas figura una tercera (Los Perales 22): hay que
      saber cuál va en el sitio y cuál en los datos fiscales
- [ ] **Perfil de Google de la empresa**: el enlace, para poner "Ver las reseñas
      en Google" debajo de los testimonios. Es lo que prueba que son reales
- [ ] ¿Los **tres teléfonos** del pie siguen activos y quién atiende cada uno?
      (El WhatsApp de ventas ya está resuelto: 387 509-2489, sólo mensajes)

Servicios y capacidades:

- [ ] **Depósito**: metros disponibles para alquilar, y si la cámara frigorífica
      está funcionando hoy
- [ ] **Cantidad de teléfonos satelitales**: es un dato interno y **no se
      publica** — el sitio dice que hay teléfono satelital a bordo en los
      servicios de altura, nunca cuántos. Sirve para saber a cuántos servicios
      simultáneos se puede responder
- [ ] **Turismo**: ¿se trabaja con guías propios, de la agencia, o sólo la unidad
      con chofer? Con eso vuelve el "con o sin guía" del primer renglón
- [ ] **Año de fundación** → sección Nosotros
- [ ] **Carpeta de presentación** de la empresa en PDF: ¿existe?

Fotos que faltan (para Sofi):

- [ ] **Galpón y cámara frigorífica** — no hay ninguna, y es un servicio que
      queremos vender
- [ ] **Taller** — hay una sola foto para una tarjeta entera

Del lado técnico:

- [ ] DNS: apuntar `lausof.com` acá (ver más abajo — ojo con el mail)
- [ ] Reclamar y completar el **perfil de Google de la empresa**. Para las
      búsquedas locales rinde más que cualquier cambio del sitio

## Publicación

El deploy publica la carpeta entera (`npx netlify-cli deploy --prod --dir .`,
ver `WEB-LANE-HANDOFF.md`): el CLI sólo deja afuera lo que empieza con punto.
Por eso `_redirects` tiene reglas `404!` para todo lo que está en la raíz y no
es el sitio (`README.md`, `package.json`, `package-lock.json`, `tests/`,
`scripts/`). Si se suma un archivo o carpeta interna a la raíz, necesita su
regla en el mismo commit; `tests/seo.test.js` lo exige. La excepción es el
archivo de la clave de IndexNow (`d1eb0835b80b7ebe76ad80c22dc86589.txt`), que
sí es público: ver la sección siguiente.

### Antes de cada commit que toque páginas: `lastmod` desde git

El `<lastmod>` de cada URL de `sitemap.xml` es la fecha (hora de Salta) del
último commit que tocó su archivo `.html`. No se escribe a mano:

```bash
node scripts/lastmod.mjs              # reescribe los <lastmod>; sitemap.xml entra en el mismo commit
node scripts/lastmod.mjs --comprobar  # no escribe nada; sale con 1 si alguno no coincide con git
```

- Un archivo con cambios sin commitear cuenta como "hoy"; uno limpio, la
  fecha de autor de su último commit (un rebase no la mueve).
- El script no toca el `dateModified` del JSON-LD ni la línea visible
  "Actualizado el …": esa es la fecha en que se revisó el contenido y la
  cambia quien lo revisa. Los tests piden que esas dos coincidan entre sí y
  que el `lastmod` no sea anterior.
- `tests/lastmod.test.js` falla si un `<lastmod>` no coincide con git. Una
  página nueva sólo necesita su `<url>` en el sitemap; la fecha la pone el
  script.
- Por qué: Google usa el `lastmod` sólo si es consistente y verificable
  contra la última modificación de la página
  (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap,
  leída el 13/10/2026), y `scripts/indexnow.mjs` elige qué avisar con esos
  mismos valores.

### Después de cada deploy: avisar a Bing con IndexNow

IndexNow es el protocolo con el que Bing (y Yandex, Seznam, Naver, Yep...)
se enteran enseguida de qué páginas son nuevas o cambiaron, sin esperar a que
el rastreador pase. Google no lo usa: para Google sigue valiendo el sitemap
y Search Console. Fuentes: https://www.indexnow.org/documentation y
https://www.bing.com/indexnow/getstarted (leídas el 10/10/2026).

- **Clave:** `d1eb0835b80b7ebe76ad80c22dc86589`, publicada en
  https://www.lausof.com/d1eb0835b80b7ebe76ad80c22dc86589.txt (opción 1 del
  protocolo: archivo en la raíz, cubre todo el host). No es secreta. No se
  borra ni se renombra: sin ese archivo cada aviso da 403.
- **Cuándo:** después de cada deploy a producción que agregue páginas o les
  cambie el `<lastmod>` en `sitemap.xml`. Sólo lo que cambió: Bing pide no
  reenviar URLs viejas que no cambiaron.
- **Cómo** (desde la carpeta del sitio, ya desplegado):

  ```bash
  # Lo normal: lo que cambió en el sitemap desde el commit del deploy anterior
  node scripts/indexnow.mjs --desde <sha del deploy anterior> --prueba   # mira la lista
  node scripts/indexnow.mjs --desde <sha del deploy anterior>            # envía
  # Alternativa por fecha de lastmod
  node scripts/indexnow.mjs --desde 2026-10-10
  # Todas las URLs (sólo la primera vez o con el sitio rehecho)
  node scripts/indexnow.mjs --todas
  ```

  El script compara los `<lastmod>`, que salen de git (`scripts/lastmod.mjs`),
  y con `--desde <sha>` suma las páginas cuyo archivo cambió desde ese commit.
  Si el sitemap no coincide con git, corta antes de enviar y pide correr
  `node scripts/lastmod.mjs`. Antes de enviar comprueba que el
  archivo de la clave esté en vivo; después imprime el código HTTP:
  **200 o 202 = recibido** (202: clave todavía en validación). 403 = clave no
  publicada, 422 = URL de otro host, 429 = demasiados pedidos (esperar, no
  reintentar en loop). Sale con código 1 si no fue 200/202.
- **Dónde mirar el resultado:** Bing Webmaster Tools → IndexNow. Que llegue el
  aviso no garantiza que la página se indexe.
- Tests: `tests/indexnow.test.js` (formato de la clave, archivo en la raíz,
  ninguna regla de `_redirects` lo tapa, selección de URLs y pedido).

El dominio `lausof.com` ya existe (hoy apunta a Wix). Plan:

1. Subir este repo a GitHub y activar **GitHub Pages** (o conectar a **Netlify/Cloudflare Pages**) — hosting gratuito.
2. Probar en la URL provisoria (`*.github.io` / `*.netlify.app`).
3. Con el OK de la familia, apuntar el DNS de `lausof.com` al nuevo hosting (requiere acceso al registrador del dominio).
