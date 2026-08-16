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
    ├── logo-horizontal.png       # original
    ├── logo-horizontal-web.png   # optimizado (720px, navbar/footer)
    ├── logo-insignia.png         # original
    └── logo-insignia-web.png     # optimizado (480px, hero/favicon)
```

Dos cosas que hay que recordar al tocar el código:

- **La hoja de estilos tiene cache-busting a mano** (`css/styles.css?v=21`). Cada
  vez que se cambia el CSS hay que subir ese número en los dos HTML, o quien ya
  entró sigue viendo la hoja vieja.
- **Las fotos de cada tarjeta rotan con una animación por cantidad de fotos**
  (`slideshow-1`, `-3`, `-4`, `-6`, `-9`). Si a una tarjeta se le agrega o se le
  saca una foto, hay que cambiarle la clase, o la rotación queda desfasada.

## Flota en venta

Los precios, los enlaces y las unidades salen de **un solo bloque** al principio
del `<script>` de `flota-en-venta.html` (buscar `CONFIGURACIÓN DE UNIDADES`).
Cuando se republica una unidad cambia su número de publicación: hay que pegar el
enlace largo de Mercado Libre, el que termina en `_JM`. Los enlaces cortos le
piden al visitante que inicie sesión y no muestran nada.

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

- [ ] **Horarios de atención** reales, y si hay **guardia para auxilio fuera de
      hora** (por eso el sitio no promete nada de 24 horas)
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

El dominio `lausof.com` ya existe (hoy apunta a Wix). Plan:

1. Subir este repo a GitHub y activar **GitHub Pages** (o conectar a **Netlify/Cloudflare Pages**) — hosting gratuito.
2. Probar en la URL provisoria (`*.github.io` / `*.netlify.app`).
3. Con el OK de la familia, apuntar el DNS de `lausof.com` al nuevo hosting (requiere acceso al registrador del dominio).
