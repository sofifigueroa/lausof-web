// Las decisiones que siguen abiertas con Lautaro, en un solo lugar.
//
// Cada valor por omisión es la recomendación de la etapa 3 o 4 del pipeline
// (~/lausof/web/demo-reservas-2026-11-06/). Su respuesta es un cambio de una
// línea acá, o en `perfil.tienda.elecciones` (scripts/entorno.mjs), que pisa
// estos valores clave por clave.

export const ELECCIONES = Object.freeze({
  // Barra fija del teléfono en las páginas de turismo con precio, en inglés.
  // Lautaro, 06/11 (ruling 5 A, D5): WhatsApp · Book, como en castellano.
  // La otra forma, la de 3a §6.1: 'correo-whatsapp-reservar' (Email · WhatsApp · Book).
  barraEn: 'whatsapp-reservar',

  // Páginas de eventos y grupos (3c §8). Lautaro, 06/11 (ruling 3, D6): se
  // construye A y decide al verla en vivo.
  // A: 'por-dia-y-presupuesto' = el vehículo con chofer por día, con el precio
  //    del tramo de personas, más la tarjeta «Pedir presupuesto» del evento.
  // B: 'solo-presupuesto' = sólo la tarjeta del evento.
  eventos: 'por-dia-y-presupuesto',

  // S1, la línea «ARS 260.000 por persona» bajo el neto (3c §2.4). Sólo se ve
  // si el catálogo manda `por_persona_texto` (Apacheta lo manda sólo a una
  // empresa demo). A: 'demo' = encendida en la demo, apagada en producción
  //    hasta su sí en la página de la etapa 5.
  // 'siempre' = encendida también en producción (con su sí).
  // B: 'nunca' = sólo el total del tramo.
  porPersona: 'demo',

  // Etiqueta de «Botón de arrepentimiento» (fila legal del pie) en EN y PT (4-textos §9).
  // A: 'es-con-traduccion' = «Botón de arrepentimiento (withdraw from a purchase)».
  // B: 'solo-es' = la etiqueta literal en castellano, sin traducción.
  arrepentimientoEtiqueta: 'es-con-traduccion',

  // Leyenda del precio neto en EN y PT (4-textos §0.3).
  // A: 'es-con-traduccion'. B: 'traduccion' (sólo la traducción).
  netoEtiqueta: 'es-con-traduccion',

  // Idiomas con vitrina (3a §6.3). A: los tres. B: ['es'] (EN y PT quedan
  // como hoy, más el chat).
  idiomas: ['es', 'en', 'pt'],

  // Error del catálogo (3a §3.3): además de WhatsApp, «Ver precios y reservar»
  // lleva a la compra de Apacheta del primer servicio, sin personas: la compra
  // las pregunta. false = sólo WhatsApp (el camino de contacto de hoy).
  compraEnError: true,
});

const VALORES = {
  barraEn: ['correo-whatsapp-reservar', 'whatsapp-reservar'],
  eventos: ['por-dia-y-presupuesto', 'solo-presupuesto'],
  porPersona: ['demo', 'siempre', 'nunca'],
  arrepentimientoEtiqueta: ['es-con-traduccion', 'solo-es'],
  netoEtiqueta: ['es-con-traduccion', 'traduccion'],
  compraEnError: [true, false],
};

/** Las elecciones vigentes: las de acá, pisadas por las del perfil. Valida cada valor. */
export function eleccionesDe(perfil) {
  const propias = (perfil && perfil.tienda && perfil.tienda.elecciones) || {};
  const e = { ...ELECCIONES, ...propias };
  for (const clave of Object.keys(propias)) {
    if (!(clave in ELECCIONES)) throw new Error(`elección desconocida: ${clave}`);
  }
  for (const [clave, validos] of Object.entries(VALORES)) {
    if (!validos.includes(e[clave])) throw new Error(`elección ${clave}: «${e[clave]}» no es ${validos.join(' ni ')}`);
  }
  if (!Array.isArray(e.idiomas) || !e.idiomas.every((i) => ['es', 'en', 'pt'].includes(i))) throw new Error('elección idiomas: es, en o pt');
  return Object.freeze(e);
}

/** ¿La línea por persona va en este perfil? (S1: en producción sólo con su sí). */
export const porPersonaEn = (e, perfil) => e.porPersona === 'siempre' || (e.porPersona === 'demo' && Boolean(perfil && perfil.nombre !== 'produccion'));
