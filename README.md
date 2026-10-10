# Lausof SRL — Sitio web

Rediseño del sitio de [Lausof SRL](https://www.lausof.com), empresa de transporte y logística de Salta, Argentina (pasajeros, cargas generales y refrigeradas, 4x4, auxilio y remolques).

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
- **Alt descriptivo en cada `<img>`**, también en los slides ocultos de los
  slideshows: el contenedor con `role="img"` ya aplana los hijos para los
  lectores de pantalla, así que el alt de los slides no molesta a la
  accesibilidad y es lo único que indexa Google Imágenes. Solo los logos
  decorativos de cierre y la foto de fondo del hero/encabezado llevan `alt=""`.

## Fotos responsive (AVIF + WebP en varios anchos)

Cada foto se escribe en el HTML como un `<img>` común **con `sizes`**, y
después se corre

```bash
node scripts/imagenes.mjs              # genera variantes y reescribe las páginas
node scripts/imagenes.mjs --comprobar  # no escribe nada; sale con 1 si falta algo
```

El script (necesita ImageMagick 7 con AVIF: `brew install imagemagick`) genera
al lado de cada `foto.webp` las variantes `foto-400w.webp`, `-640w`, `-960w`…
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
  va a elegir el `<picture>` (bajaría la foto dos veces). En la portada,
  `data-movil="assets/pasajeros-1-quebrada.webp"` hace la dirección de arte
  de mobile (≤720px).
- **Slideshows**: el hijo n-ésimo del `.slideshow` ahora es el `<picture>`
  (`picture{display:contents}` lo deja fuera del layout); los retardos se
  escriben `.slideshow picture:nth-child(n) img`.

Dos cosas que hay que recordar al tocar el código:

- **La hoja de estilos tiene cache-busting a mano** (`css/styles.css?v=21`). Cada
  vez que se cambia el CSS hay que subir ese número en los dos HTML, o quien ya
  entró sigue viendo la hoja vieja.
- **Las fotos de cada tarjeta rotan con una animación por cantidad de fotos**
  (`slideshow-1`, `-3`, `-4`, `-6`, `-9`). Si a una tarjeta se le agrega o se le
  saca una foto, hay que cambiarle la clase, o la rotación queda desfasada.

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
| `link_position` | `header`, `hero`, `cta_final`, `quick_bar` (la barra fija de abajo), `footer`, o el `id` de la sección que contiene el enlace (`servicios`, `services`…) |
| `link_text` | el texto visible del enlace ("Cotizar por WhatsApp"). Si el texto es un número o una casilla, va el nombre del canal |

**Dónde vive:** `js/contacto.js`, un solo listener delegado sobre el documento.
Cada página lo carga en el `<head>` con
`<script defer src="/js/contacto.js?v=1"></script>`, siempre con ruta absoluta
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
  otros cuatro son propios: para verlos en los informes hay que registrarlos
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
`contact_page_path` y `link_position`.

**Cómo probarlo:**

- `npm test` corre `tests/medicion.test.js`: ejecuta el script de verdad contra
  un documento de utilería y revisa cada canal, los parámetros, que no viajen
  datos personales, que no haya error sin `gtag`, y que todas las páginas
  carguen el script.
- En el navegador: herramientas de desarrollo → Red → filtrar `collect`, hacer
  clic en un botón de contacto y buscar `en=contact_whatsapp` (o `_phone`,
  `_email`) en el pedido. En GA4 aparece a los pocos minutos en el informe de
  tiempo real.

## Cómo verlo en local

Abrir `index.html` en el navegador (doble click), o servirlo:

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
servicio, capacidad de carga de 7,5 toneladas del camión plancha, más de una
década de trabajo en la Puna y los 120.000 km de la ML350. De todo eso siguen
faltando los números (CNRT, AMT, legajo de la agencia) y el nombre de la
aseguradora, que son lo único que se publica cuando lleguen.

**10/10/2026 (BUILD-BRIEF de Lautaro):** se quedan en el sitio las
afirmaciones que el cliente busca para reservar, aunque el papel esté en
trámite: guardia de auxilio las 24 hs, agencia de turismo habilitada,
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

- [x] **Guardia de auxilio las 24 hs**: confirmada por la familia el 10/10/2026
      (BUILD-BRIEF); figura en la portada (ES y EN) y en el JSON-LD
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
- [ ] **Grúa levantando un vehículo**, de día y bien encuadrada, para la primera
      tarjeta del sitio

Del lado técnico:

- [ ] DNS: apuntar `lausof.com` acá (ver más abajo — ojo con el mail)
- [ ] Reclamar y completar el **perfil de Google de la empresa**. Para "grúa
      Salta" y las búsquedas locales rinde más que cualquier cambio del sitio

## Publicación

El deploy publica la carpeta entera (`npx netlify-cli deploy --prod --dir .`,
ver `WEB-LANE-HANDOFF.md`): el CLI sólo deja afuera lo que empieza con punto.
Por eso `_redirects` tiene reglas `404!` para todo lo que está en la raíz y no
es el sitio (`README.md`, `package.json`, `package-lock.json`, `tests/`,
`scripts/`). Si se suma un archivo o carpeta interna a la raíz, necesita su
regla en el mismo commit; `tests/seo.test.js` lo exige.

El dominio `lausof.com` ya existe (hoy apunta a Wix). Plan:

1. Subir este repo a GitHub y activar **GitHub Pages** (o conectar a **Netlify/Cloudflare Pages**) — hosting gratuito.
2. Probar en la URL provisoria (`*.github.io` / `*.netlify.app`).
3. Con el OK de la familia, apuntar el DNS de `lausof.com` al nuevo hosting (requiere acceso al registrador del dominio).
