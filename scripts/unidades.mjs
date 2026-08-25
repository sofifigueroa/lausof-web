/* =============================================================================
   CONFIGURACIÓN DE UNIDADES — ES EL ÚNICO LUGAR QUE HAY QUE TOCAR
   -----------------------------------------------------------------------------
   CÓMO ACTUALIZAR PRECIOS (o cualquier dato de una unidad):
     1. Editá acá abajo lo que cambió (precio, estado, enlace, foto...).
     2. Corré desde la carpeta del sitio:  node scripts/generar-flota.mjs
     3. Listo: el script reescribe las tarjetas y los datos para Google
        dentro de flota-en-venta.html. No hay que tocar el HTML a mano
        (las zonas generadas están marcadas con <!-- GENERADO ... -->).

   Antes las tarjetas se armaban con JavaScript en el navegador; ahora vienen
   escritas en el HTML para que Google, Bing y las vistas previas de WhatsApp
   vean las unidades sin ejecutar nada. Por eso hace falta el paso 2.

   Cada unidad tiene estos campos:

     id        Número de publicación de Mercado Libre, sin la sigla MLA.
               Sirve de referencia: es el número que aparece al pie de la
               publicación como "Publicación #1972787369".
     titulo    Cómo se llama la unidad en la tarjeta. Corto.
     precio    SOLO el número, sin puntos ni signo $. La página lo formatea sola.
     moneda    'ARS' para pesos, 'USD' para dólares.
     url       Enlace a la publicación de Mercado Libre.
               ¡OJO! Tiene que ser el enlace largo con el nombre del vehículo
               (el que termina en _JM). Los enlaces cortos del tipo
               articulo.mercadolibre.com.ar/MLA-1234567- le piden al visitante
               que inicie sesión y no muestran la publicación.
     estado    'publicada'    → la tarjeta enlaza a Mercado Libre.
               'proximamente' → la tarjeta se muestra en gris, SIN enlace.
     foto      Archivo de la foto de portada, dentro de assets/unidades/.
               Dejar en null si todavía no hay foto.
     ficha     Los datos duros que se muestran arriba de la descripción.
     resumen   Descripción corta. Es un resumen de lo que dice la publicación.
     otrosAvisos  Opcional. Otros sitios donde está publicada la misma unidad,
               como { nombre: 'deRuedas', url: '...' }. Se muestran como un
               enlace chico al pie de la tarjeta. El precio de referencia es
               siempre el de Mercado Libre: los otros sitios lo redondean, así
               que de ellos va el enlace y nada más.

   PARA AGREGAR UNA UNIDAD: copiá un bloque entero { ... }, pegalo donde
   corresponda y cambiá los datos. El orden de esta lista es el orden en que
   aparecen en la página.

   PARA SACAR UNA UNIDAD YA VENDIDA: borrá su bloque { ... } completo.

   Datos verificados en las publicaciones el 12 de agosto de 2026.
   La Amarok se verificó el 15 de agosto de 2026, el día que se publicó.
   ============================================================================= */

export const UNIDADES = [

  {
    id: '3738952536',
    titulo: 'Mercedes-Benz Accelo 1016 — camión plancha con auxilio',
    precio: 69369,
    moneda: 'USD',
    url: 'https://vehiculo.mercadolibre.com.ar/MLA-3738952536-mercedes-benz-accelo-1016-camion-plancha-auxilio-mecanico-_JM',
    estado: 'publicada',
    foto: 'accelo-1016-2016.webp',
    ficha: ['2016', '103.000 km', 'Carga 7.500 kg', 'Único dueño'],
    resumen: 'Camión plancha con equipo de auxilio mecánico. Plancha Sica con barandas volcables y desmontables, arcos y lona con cierre completo: se pueden trasladar vehículos protegidos de la intemperie. Preparado también para cargas generales.',
    otrosAvisos: [
      { nombre: 'deRuedas', url: 'https://www.deruedas.com.ar/vendo/Mercedes-Benz/Accelo/Usados/Salta?cod=818717' }
    ]
  },

  {
    id: '3786044120',
    titulo: 'Volkswagen Amarok V6 Highline — 3.0 258 cv 4x4 AT',
    precio: 30000,
    moneda: 'USD',
    url: 'https://auto.mercadolibre.com.ar/MLA-3786044120-volkswagen-amarok-30-cd-tdi-258cv-v6-highline-4x4-at-_JM',
    estado: 'publicada',
    foto: 'amarok-v6-2023.webp',
    ficha: ['2023', '185.000 km', 'Diésel', 'Automática', 'Único dueño'],
    resumen: 'Amortiguación reforzada y neumáticos AT nuevos con 2.000 km, incluida la rueda de auxilio. Motor en óptimas condiciones y services hechos cada 10.000 km.'
  },

  {
    id: '1972787369',
    titulo: 'Mercedes-Benz Sprinter 515 — combi 19+1',
    precio: 59000000,
    moneda: 'ARS',
    url: 'https://auto.mercadolibre.com.ar/MLA-1972787369-mercedes-benz-sprinter-21-515-combi-4325-150cv-191-_JM',
    estado: 'publicada',
    foto: 'sprinter-2019.webp',
    ficha: ['2019', '480.000 km', '19+1 pasajeros', 'Diésel', 'Único dueño'],
    resumen: 'Motor y estado general excelentes, funciona todo. Unidad habilitada CNRT, con el mantenimiento hecho por nuestro propio taller.'
  },

  {
    id: '3738699720',
    titulo: 'Mercedes-Benz Sprinter 515 — combi 19+1',
    precio: 39369369,
    moneda: 'ARS',
    url: 'https://auto.mercadolibre.com.ar/MLA-3738699720-mercedes-benz-sprinter-21-515-combi-4325-150cv-191-_JM',
    estado: 'publicada',
    foto: 'sprinter-2016.webp',
    ficha: ['2016', '684.000 km', '19+1 pasajeros', 'Diésel', 'Único dueño'],
    resumen: 'Motor a nuevo, recién rectificado. Único dueño desde cero, siempre dentro de la flota de la empresa.'
  },

  {
    id: '1947677517',
    titulo: 'Hyundai H1 2.5 Premium — 12 asientos',
    precio: 23900000,
    moneda: 'ARS',
    url: 'https://auto.mercadolibre.com.ar/MLA-1947677517-hyundai-h1-25-premium-1-at-_JM',
    estado: 'publicada',
    foto: 'hyundai-h1-2009.webp',
    ficha: ['2009', '320.000 km', '12 asientos', 'Automática', 'Diésel'],
    resumen: 'Motor hecho a nuevo y caja automática. Neumáticos nuevos, aire acondicionado delantero y trasero funcionando, pantalla multimedia y sensores de estacionamiento. Service y mantenimiento al día.'
  },

  {
    id: '3738703124',
    titulo: 'Mercedes-Benz ML350 3.5 nafta — 4x4',
    precio: 25000000,
    moneda: 'ARS',
    url: 'https://auto.mercadolibre.com.ar/MLA-3738703124-mercedes-benz-clase-ml-35-ml350-nafta-_JM',
    estado: 'publicada',
    foto: 'ml350-2007.webp',
    /* La ficha de Mercado Libre y la descripción no coincidían en los kilómetros.
       Lautaro confirmó el 16/08 que valen los 120.000 km de la ficha. */
    ficha: ['2007', '120.000 km', '4x4', 'Automática', 'Nafta', '272 hp'],
    resumen: 'Se le cambiaron amortiguadores, parrillas y bujes. Neumáticos nuevos Kumho y pantalla multimedia con cámara. Estado general impecable, con detalles menores de pintura.'
  },

  {
    id: null,
    titulo: 'Mercedes-Benz Sprinter — combi 19+1 escolar',
    precio: null,
    moneda: 'ARS',
    url: null,
    estado: 'proximamente',
    foto: null,
    ficha: ['2011', '19+1 pasajeros', 'Diésel'],
    resumen: 'Unidad escolar de la flota. La vamos a publicar en los próximos días.'
  }

];

/* WhatsApp de ventas (387 509-2489), en formato internacional y sin signos.
   Es distinto del número general de la empresa que usa la home: esta línea es
   sólo para las unidades en venta y se atiende por mensaje, no por llamada.
   Si cambia, hay que cambiarlo también en los enlaces wa.me fijos de
   flota-en-venta.html (encabezado, contacto y barra de mobile). */
export const WHATSAPP = '5493875092489';

/* true  → las unidades que todavía no se publicaron se muestran al final, en
           gris y sin enlace, con un botón para que avisemos cuando salgan.
   false → no se muestran y quedan sólo las publicadas.
   Se dejan visibles mientras estén de verdad por publicarse: una tarjeta
   "próximamente" de tres meses deja de ser información y pasa a ser ruido. */
export const MOSTRAR_PROXIMAS = true;
