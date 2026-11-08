// Vitrina (scripts/tienda.mjs): qué ofrece cada página, página → servicios del
// catálogo de Apacheta, en orden (el más pedido primero, UI-69; diseño en
// ~/lausof/web/demo-reservas-2026-11-06/3a-diseno-experiencia.md §2). Es el único dato
// propio de Web en la vitrina: precios, nombres, descripciones, vehículos y
// capacidades salen siempre del catálogo (contrato §3.2, RC-0b).
//
// Las claves son las del tarifario v2 (`productos.prod_id`). El catálogo se
// cruza por `servicios[].clave` y, si no la trae, por `servicios[].id`
// (pedido R13 a Apacheta, 7-contrato-overlay.md). Una clave que el catálogo
// no trae no dibuja su tarjeta (3a §3.3).

// Cada servicio: qué renglón de unidad lleva (4-textos §2.3; null = sin
// precio publicado, la tarjeta es «Pedir presupuesto») y su nombre en
// castellano en la semilla de la demo de Apacheta (lane/demo-semilla,
// scripts/demo/reservas/tarifario-v2-0411.json, columna tipo_de_servicio).
// El nombre sólo cruza el mapa con el catálogo mientras el catálogo no traiga
// `clave` (pedido R13); nunca se muestra: lo que se ve sale del catálogo.
const S = (unidad, nombre = null) => Object.freeze({ unidad, nombre });
export const SERVICIOS = Object.freeze({
  cafayate: S('excursion', 'Cafayate (Quebrada de las Conchas)'),
  tr_cafayate: S('traslado', 'Salta – Cafayate (un tramo)'),
  valles_1d: S('excursion', 'Vuelta a los Valles en 1 día (Cachi – Ruta 40 – Cafayate)'),
  valles_2d: S('varios_dias', 'Vuelta a los Valles Calchaquíes (noche en Cafayate o Cachi)'),
  valles_3d: S('varios_dias', 'Valles en 3 días (Cachi – Molinos – Angastaco – Cafayate)'),
  cachi: S('excursion', 'Cachi (Cuesta del Obispo y Los Cardones)'),
  tr_cachi: S('traslado', 'Salta – Cachi (un tramo)'),
  quebrada: S('excursion', 'Quebrada de Humahuaca (Purmamarca, Tilcara, Humahuaca)'),
  hornocal: S('excursion', 'Quebrada de Humahuaca + Serranías del Hornocal'),
  tr_purmamarca: S('traslado', 'Salta – Purmamarca (un tramo)'),
  tr_tilcara: S('traslado', 'Salta – Tilcara (un tramo)'),
  tr_humahuaca: S('traslado', 'Salta – Humahuaca (un tramo)'),
  salinas_purma: S('excursion', 'Salinas Grandes por Purmamarca y Cuesta de Lipán'),
  salinas_sac: S('excursion', 'Vuelta a las Nubes (S. A. de los Cobres – Salinas Grandes – Purmamarca)'),
  sac_viaducto: S('excursion', 'San Antonio de los Cobres y Viaducto La Polvorilla'),
  iruya_1d: S('excursion', 'Iruya en el día'),
  tren_combo: S('tren', 'Tren a las Nubes «Solo Tren» + traslado privado (pasaje aparte)'),
  salta_jujuy: S('traslado', 'Salta – San Salvador de Jujuy (un tramo)'),
  aeropuerto: S('traslado', 'Aeropuerto – centro de Salta (un tramo)'),
  spa_ida: S('traslado', 'Salta – San Pedro de Atacama, solo ida'),
  spa_ida_vuelta: S('varios_dias', 'Salta – San Pedro de Atacama, ida y vuelta con un día libre'),
  uyuni_ida: S('traslado', 'Salta – Uyuni (pueblo), solo ida; el salar con operador boliviano, aparte'),
  // Por día: el renglón lleva los km incluidos de la opción (4-textos §2.3, por_dia).
  charter_dia: S('por_dia', 'Vehículo con chofer a disposición (día, hasta 250 km)'),
  charter_medio: S('traslado', 'Vehículo con chofer a disposición (4 h, hasta 40 km)'),
  // Sin renglón en el tarifario: Apacheta los lista con `precio: null` (R9; R14 para el resto).
  spa_vuelta: S(null, 'San Pedro de Atacama → Salta'),
  uyuni_vuelta: S(null, 'Uyuni → Salta'),
  '4x4_mensual': S(null),
  ev_carnaval: S(null), ev_serenata: S(null), ev_milagro: S(null), ev_trail: S(null), ev_semana_santa: S(null), ev_feriados: S(null),
  ev_recitales: S(null), ev_casamiento: S(null), ev_clubes: S(null), ev_golf: S(null), ev_peregrinacion: S(null), ev_estudio: S(null),
});

// El título del bloque (4-textos §2.1) es el nombre corto de la página, el de
// sus migas; sin migas, `h2_corto` (por idioma) y, si tampoco hay, el <h1> de
// la página, que es su propio nombre para lo que ofrece.
// `cabeza`: servicio de la línea de precio del encabezado (null = sin línea).
// `barra`: la barra del teléfono pasa a WhatsApp · Reservar (3a §6.1).
// `tramos: 'primero'`: la tarjeta muestra sólo el primer tramo de personas (el
//   del vehículo más chico, que es el que la compra asigna a esas personas);
//   más personas, «Pedir presupuesto». Es la página de la 4x4 (3c §8): Web no
//   elige un vehículo, acota el rango a lo que la página ofrece. La página de
//   la combi muestra todos los tramos hasta que el catálogo publique el por día
//   por vehículo (R18, diferido por Apacheta 06/11: dato de la semilla).
// `despues`: el bloque va después de esa sección (por idioma) en lugar de
//   después de las migas.
const destino = (servicios, extra = {}) => ({ tipo: 'destino', bloques: [{ servicios: servicios.map((clave) => ({ clave })) }], cabeza: servicios[0], barra: true, ...extra });

const evento = (clave, extra = {}) => ({
  tipo: 'evento',
  // El vehículo con chofer por día, por tramo de personas, y el viaje del evento a medida (3c §8, wireframe 05).
  bloques: [{ servicios: [{ clave: 'charter_dia' }, { clave }] }],
  cabeza: null,
  barra: false,
  ...extra,
});

export const PAGINAS = Object.freeze({
  'traslado-salta-cafayate.html': destino(['cafayate', 'tr_cafayate', 'valles_2d'],
    { en: 'en/salta-to-cafayate-transfer.html', pt: 'pt/traslado-salta-cafayate.html' }),
  'traslado-salta-cachi.html': destino(['cachi', 'tr_cachi', 'valles_1d', 'valles_2d', 'valles_3d'],
    { en: 'en/salta-to-cachi-transfer.html' }),
  'traslado-salta-purmamarca-tilcara-humahuaca.html': destino(['quebrada', 'hornocal', 'tr_purmamarca', 'tr_tilcara', 'tr_humahuaca'],
    { en: 'en/salta-to-purmamarca-tilcara-humahuaca.html', pt: 'pt/traslado-salta-purmamarca-tilcara-humahuaca.html' }),
  'salinas-grandes-desde-salta.html': destino(['salinas_purma', 'salinas_sac'],
    { en: 'en/salinas-grandes-from-salta.html', pt: 'pt/salinas-grandes-saindo-de-salta.html' }),
  'traslado-salta-san-antonio-de-los-cobres.html': destino(['sac_viaducto'],
    { en: 'en/salta-to-san-antonio-de-los-cobres.html' }),
  'traslado-tren-a-las-nubes.html': destino(['tren_combo'],
    { en: 'en/train-to-the-clouds-transfer.html' }),
  'traslado-salta-jujuy.html': destino(['salta_jujuy'], { en: 'en/salta-to-jujuy-transfer.html' }),
  'traslado-aeropuerto-salta.html': destino(['aeropuerto'], { en: 'en/salta-airport-transfer.html' }),
  'traslado-salta-san-pedro-de-atacama.html': destino(['spa_ida', 'spa_ida_vuelta'],
    { en: 'en/salta-to-san-pedro-de-atacama.html', pt: 'pt/traslado-salta-san-pedro-de-atacama.html' }),
  'traslado-salta-uyuni.html': destino(['uyuni_ida'],
    { en: 'en/salta-to-uyuni.html', pt: 'pt/traslado-salta-uyuni.html' }),
  // Sentido inverso: sin renglón en el tarifario hasta R9; sólo «Pedir presupuesto».
  'traslado-san-pedro-de-atacama-salta.html': destino(['spa_vuelta'],
    { tipo: 'presupuesto', cabeza: null, barra: false, en: 'en/san-pedro-de-atacama-to-salta.html' }),
  'traslado-uyuni-salta.html': destino(['uyuni_vuelta'],
    { tipo: 'presupuesto', cabeza: null, barra: false, en: 'en/uyuni-to-salta.html' }),
  'viajes-internacionales.html': destino(['spa_ida', 'spa_ida_vuelta', 'uyuni_ida'],
    { cabeza: null, barra: false, en: 'en/international-trips.html' }),
  'alquiler-combi-con-chofer-salta.html': destino(['charter_dia', 'charter_medio'],
    { en: 'en/minibus-with-driver-salta.html' }),
  'alquiler-4x4.html': {
    tipo: 'destino',
    bloques: [
      { servicios: [{ clave: 'charter_dia', tramos: 'primero' }, { clave: 'charter_medio', tramos: 'primero' }] },
      // La 4x4 mensual para empresas: presupuesto, después de la sección que la presenta (3a §2, A7).
      { servicios: [{ clave: '4x4_mensual' }], despues: { es: 'para-quien', en: 'who-its-for' } },
    ],
    cabeza: 'charter_dia',
    cabezaTramos: 'primero',
    barra: true,
    // Sin migas (4-textos §2.1, tienda.bloque.h2_corto).
    h2_corto: { es: '4x4 con chofer', en: '4x4 with a driver' },
    en: 'en/4x4-rental.html',
  },
  // Eventos y grupos (3c §8): el vehículo por día con precio + el viaje del evento a medida.
  'traslado-carnaval-quebrada-de-humahuaca.html': evento('ev_carnaval', { en: 'en/transfer-carnival-quebrada-de-humahuaca.html' }),
  'traslado-serenata-a-cafayate.html': evento('ev_serenata'),
  'traslados-fiesta-del-milagro.html': evento('ev_milagro'),
  'traslados-trail-jujuy-utmb.html': evento('ev_trail', { en: 'en/jujuy-utmb-trail-race-transfers.html' }),
  'semana-santa-salta-jujuy.html': evento('ev_semana_santa', { en: 'en/holy-week-salta-jujuy.html' }),
  'feriados-fines-de-semana-largos.html': evento('ev_feriados'),
  'charter-recitales.html': evento('ev_recitales'),
  'traslados-casamientos.html': evento('ev_casamiento', { en: 'en/wedding-transportation.html' }),
  'clubes-deportivos.html': evento('ev_clubes'),
  'golf-torneos.html': evento('ev_golf'),
  'peregrinaciones-eventos.html': evento('ev_peregrinacion'),
  'viajes-de-estudio.html': evento('ev_estudio'),
});

// Hub de turismo (3a §2, wireframe 02): cada tarjeta de circuito, en el orden
// en que aparece en la página, suma la zona de precio del día completo y
// «Reservar»; un solo contador «Personas» bajo la bajada las mueve a todas (3c §3).
export const HUB = Object.freeze({
  paginas: { es: 'turismo.html', en: 'en/tours-and-transfers.html', pt: 'pt/passeios-e-traslados.html' },
  circuitos: ['cafayate', 'cachi', 'quebrada', 'salinas_purma', 'iruya_1d', 'sac_viaducto'],
});

/** Idioma de un archivo del sitio por su carpeta. */
export const idiomaDe = (archivo) => (archivo.startsWith('en/') ? 'en' : archivo.startsWith('pt/') ? 'pt' : 'es');

/**
 * Lo que la vitrina pone en un archivo, en su idioma, o null si no lleva nada.
 */
export function ofertaDe(archivo) {
  const idioma = idiomaDe(archivo);
  for (const [es, p] of Object.entries(PAGINAS)) {
    const propio = idioma === 'es' ? es : p[idioma];
    if (propio !== archivo) continue;
    return { ...p, idioma, es };
  }
  return null;
}
