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
               publicación como "Publicación #4055363136".
     titulo    Cómo se llama la unidad en la tarjeta. Corto.
     precio    SOLO el número, sin puntos ni signo $. La página lo formatea sola.
     moneda    'ARS' para pesos, 'USD' para dólares.
     url       Enlace a la publicación de Mercado Libre.
               Si la publicación venció y todavía no se republicó, dejá el
               campo url en null: la tarjeta sigue con su precio y su botón
               de WhatsApp, pero sin botón ni enlace a Mercado Libre, hasta
               que haya un enlace vivo para poner.
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
   Actualizado el 5 de septiembre de 2026: Sprinter 2016, ML350 y Accelo se
   republicaron y cambiaron de id, de URL y de precio; a la H1 y a la Sprinter
   2019 se les bajó el precio al de Mercado Libre (la 2019 conserva su id y su
   URL: todavía no se republicó). La Amarok no se tocó.
   Actualizado el 10 de septiembre de 2026: la Sprinter 2019 se republicó y
   cambió de id y de URL, y bajaron cinco precios (Sprinter 2019, Sprinter
   2016, ML350, Accelo y Amarok). La H1 no cambió en Mercado Libre y sigue
   publicándose en $ 22.900.000 por la decisión del 05/09.
   Actualizado el 16 de septiembre de 2026: la Amarok se republicó y cambió de
   id y de URL, y su precio subió a US$ 29.500. Ningún otro precio cambió: los
   demás siguen como quedaron el 10/09, y la H1 sigue publicándose en
   $ 22.900.000 por la decisión del 05/09.
   Actualizado el 23 de septiembre de 2026: se sacó la Hyundai H1 (IBH185),
   vendida con cierre confirmado el 23/09, y la tarjeta "próximamente" de la
   Sprinter 2011 escolar (JYL060), vendida el 04/09. Quedan cinco unidades
   publicadas y ninguna por publicar.
   Actualizado el 10 de octubre de 2026: el Accelo, la Sprinter 2016 y el
   ML350 se republicaron entre el 04/10 y el 06/10 y cambiaron de id y de URL.
   Subieron tres precios: Accelo a US$ 67.000, Sprinter 2016 a $ 39.000.000 y
   Amarok a US$ 30.000 (la Amarok conserva su id). La publicación de la
   Sprinter 2019 venció cerca del 08/10 y todavía no se republicó: su tarjeta
   queda sin enlace a Mercado Libre hasta que tenga id nuevo.
   Actualizado más tarde el 10 de octubre de 2026: Lautaro republicó la
   Sprinter 2019 (id nuevo #4055363136, mismo precio) y la tarjeta vuelve a
   enlazar a Mercado Libre. Las cinco unidades tienen enlace.
   Actualizado el 14 de octubre de 2026: bajaron cinco precios en Mercado
   Libre, sin cambios de id: Accelo a US$ 66.000, Amarok a US$ 26.000,
   Sprinter 2019 a $ 52.000.000, Sprinter 2016 a $ 38.000.000 y ML350 a
   $ 22.000.000 (lectura pública de las fichas del 14/10).
   Actualizado el 17 de octubre de 2026: la Amarok se republicó y cambió de
   id y de URL (#4084892066), mismo precio US$ 26.000. Ningún otro cambio.
   ============================================================================= */

export const UNIDADES = [

  {
    id: '4031197440',
    titulo: 'Mercedes-Benz Accelo 1016 — camión plancha con auxilio',
    precio: 66000,
    moneda: 'USD',
    /* Republicada entre el 04/10 y el 06/10/2026 (id nuevo; el viejo
       #2064023885 quedó finalizado y su enlace está muerto). Precio subido a
       US$ 67.000, verificado en la ficha pública el 10/10. Antes estaba en
       US$ 66.000.
       Precio bajado a US$ 66.000 sin republicar (mismo id), verificado en la
       ficha pública el 14/10. */
    url: 'https://vehiculo.mercadolibre.com.ar/MLA-4031197440-mercedes-benz-accelo-1016-camion-plancha-auxilio-mecanico-_JM',
    estado: 'publicada',
    foto: 'accelo-1016-2016.webp',
    ficha: ['2016', '103.000 km', 'Carga 7.500 kg', 'Único dueño'],
    resumen: 'Camión plancha con equipo de auxilio mecánico. Plancha Sica con barandas volcables y desmontables, arcos y lona con cierre completo: se pueden trasladar vehículos protegidos de la intemperie. Preparado también para cargas generales.',
    otrosAvisos: [
      { nombre: 'deRuedas', url: 'https://www.deruedas.com.ar/vendo/Mercedes-Benz/Accelo/Usados/Salta?cod=818717' }
    ]
  },

  {
    id: '4084892066',
    titulo: 'Volkswagen Amarok V6 Highline — 3.0 258 cv 4x4 AT',
    precio: 26000,
    moneda: 'USD',
    /* Republicada entre el 11/09 y el 16/09/2026 (id nuevo; el viejo
       #3786044120 quedó finalizado y su enlace está muerto). Al republicarla
       se le subió el precio a US$ 29.500, verificado en la ficha pública el
       16/09. Antes estaba en US$ 28.000.
       Precio subido a US$ 30.000 sin republicar (mismo id), verificado en la
       ficha pública el 10/10.
       Precio bajado a US$ 26.000 sin republicar (mismo id), verificado en la
       ficha pública el 14/10.
       Republicada entre el 15/10 y el 17/10/2026 (id nuevo; el viejo
       #3956228786 quedó finalizado y su enlace está muerto). Mismo precio,
       US$ 26.000, verificado en la ficha pública el 17/10. */
    url: 'https://auto.mercadolibre.com.ar/MLA-4084892066-volkswagen-amarok-30-cd-tdi-258cv-v6-highline-4x4-at-_JM',
    estado: 'publicada',
    foto: 'amarok-v6-2023.webp',
    ficha: ['2023', '185.000 km', 'Diésel', 'Automática', 'Único dueño'],
    resumen: 'Amortiguación reforzada y neumáticos AT nuevos con 2.000 km, incluida la rueda de auxilio. Motor en óptimas condiciones y services hechos cada 10.000 km.'
  },

  {
    id: '4055363136',
    titulo: 'Mercedes-Benz Sprinter 515 — combi 19+1',
    precio: 52000000,
    moneda: 'ARS',
    /* Republicada entre el 08/09 y el 10/09/2026 (id nuevo; el viejo
       #1972787369 quedó finalizado y su enlace está muerto). Al republicarla
       se le bajó el precio a $ 54.000.000, verificado en la ficha pública el
       10/09. Antes estaba en $ 54.900.000. */
    /* Venció cerca del 08/10 y Lautaro la republicó a mano el 10/10/2026
       (id nuevo; el viejo #3932258578 quedó finalizado y su enlace está
       muerto). Mismo precio, $ 54.000.000, verificado en la ficha pública el
       10/10 (activa, Oro Premium).
       Precio bajado a $ 52.000.000 sin republicar (mismo id), verificado en la
       ficha pública el 14/10. */
    url: 'https://auto.mercadolibre.com.ar/MLA-4055363136-mercedes-benz-sprinter-21-515-combi-4325-150cv-191-_JM',
    estado: 'publicada',
    foto: 'sprinter-2019.webp',
    ficha: ['2019', '480.000 km', '19+1 pasajeros', 'Diésel', 'Único dueño'],
    resumen: 'Unidad habilitada CNRT, con mantenimiento hecho en nuestro taller. Se puede ver y probar.'
  },

  {
    id: '4031198338',
    titulo: 'Mercedes-Benz Sprinter 515 — combi 19+1',
    precio: 38000000,
    moneda: 'ARS',
    /* Republicada entre el 04/10 y el 06/10/2026 (id nuevo; el viejo
       #2064023927 quedó finalizado y su enlace está muerto). Precio subido a
       $ 39.000.000, verificado en la ficha pública el 10/10. Antes estaba en
       $ 38.000.000.
       Precio bajado a $ 38.000.000 sin republicar (mismo id), verificado en la
       ficha pública el 14/10. */
    url: 'https://auto.mercadolibre.com.ar/MLA-4031198338-mercedes-benz-sprinter-21-515-combi-4325-150cv-191-_JM',
    estado: 'publicada',
    foto: 'sprinter-2016.webp',
    ficha: ['2016', '684.000 km', '19+1 pasajeros', 'Diésel', 'Único dueño'],
    resumen: 'Motor a nuevo, recién rectificado. Único dueño desde cero, siempre dentro de la flota de la empresa.'
  },

  {
    id: '2154314473',
    titulo: 'Mercedes-Benz ML350 3.5 nafta — 4x4',
    precio: 22000000,
    moneda: 'ARS',
    /* Republicada entre el 04/10 y el 06/10/2026 (id nuevo; el viejo
       #2064024005 quedó finalizado y su enlace está muerto). El precio no
       cambió: $ 23.000.000, verificado en la ficha pública el 10/10.
       Precio bajado a $ 22.000.000 sin republicar (mismo id), verificado en la
       ficha pública el 14/10. */
    url: 'https://auto.mercadolibre.com.ar/MLA-2154314473-mercedes-benz-clase-ml-35-ml350-nafta-_JM',
    estado: 'publicada',
    foto: 'ml350-2007.webp',
    /* La ficha de Mercado Libre y la descripción no coincidían en los kilómetros.
       Lautaro confirmó el 16/08 que valen los 120.000 km de la ficha. */
    ficha: ['2007', '120.000 km', '4x4', 'Automática', 'Nafta', '272 hp'],
    resumen: 'Se le cambiaron amortiguadores, parrillas y bujes. Neumáticos nuevos Kumho y pantalla multimedia con cámara. Estado general impecable.'
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
