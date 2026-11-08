/* =============================================================================
   TARJETAS DE DESTINO de los hubs (las <article class="card circuito">): la
   etiqueta corta y el enlace «Ver … →» de cada una. Lo escribe
   scripts/tarjetas.mjs. Ronda 8 de lausof.com, 08/11/2026.

   Cada tarjeta, en el orden en que está en la página:
   - `titulo`: el <h3> de la tarjeta, tal cual (sirve de control: si la
     página cambia el orden o el título, el generador corta con error).
   - `etiqueta`: un dato corto para leer de un vistazo (foto, etiqueta, una
     línea y «Ver … →», como las tarjetas de Norte Travel: 1-investigacion.md
     §R-B). Nunca un dato nuevo: `fuente.texto` tiene que estar, tal cual, en
     la duración de «Datos del viaje» de `fuente.pagina` (scripts/viaje-datos.mjs,
     que a su vez se comprueba contra el texto de esa página) o, con
     `pagina: 'tarjeta'`, en la descripción de la misma tarjeta. En portugués,
     cuando el destino sólo tiene página en español, la etiqueta es la
     traducción del texto fuente. `null` = sin etiqueta (con `motivo`).
   - `enlace`: el texto del enlace de la tarjeta, sin la flecha. Si la tarjeta
     no tiene enlace, `href` lo agrega (la primera línea del mensaje; los
     renglones los pone scripts/prefill.mjs). `null` = el enlace queda como
     está.
   Reglas (rondas-2026-11-07/BRIEF.md): sin precios ni «desde», sin
   cantidades de flota, cada página en su idioma.
   ============================================================================= */

export const TARJETAS = {
  'turismo.html': [
    { titulo: 'Cafayate y la Quebrada de las Conchas', etiqueta: '2 h 30 de manejo', fuente: { pagina: 'traslado-salta-cafayate.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver el viaje a Cafayate' } },
    { titulo: 'Cachi y la Cuesta del Obispo', etiqueta: '2 h 30 de manejo', fuente: { pagina: 'traslado-salta-cachi.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver el viaje a Cachi' } },
    { titulo: 'Quebrada de Humahuaca y Purmamarca', etiqueta: '2 h 50 hasta Purmamarca', fuente: { pagina: 'traslado-salta-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 hasta Purmamarca' }, enlace: { texto: 'Ver el viaje a Purmamarca y Humahuaca' } },
    { titulo: 'Salinas Grandes', etiqueta: '4 h 10 de manejo', fuente: { pagina: 'salinas-grandes-desde-salta.html', texto: '4 h 10 de manejo' }, enlace: { texto: 'Ver el viaje a Salinas Grandes' } },
    { titulo: 'Iruya', etiqueta: 'En dos días', fuente: { pagina: 'tarjeta', texto: 'en dos días' }, enlace: { texto: 'Consultar el viaje a Iruya', href: 'https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20consultar%20un%20viaje%20a%20Iruya' } },
    { titulo: 'San Antonio de los Cobres y la Puna', etiqueta: '3 h de manejo', fuente: { pagina: 'traslado-salta-san-antonio-de-los-cobres.html', texto: '3 h de manejo' }, enlace: { texto: 'Ver el viaje a San Antonio de los Cobres' } },
  ],
  'en/tours-and-transfers.html': [
    { titulo: 'Cafayate and the Quebrada de las Conchas', etiqueta: '2 h 30 of driving', fuente: { pagina: 'en/salta-to-cafayate-transfer.html', texto: '2 h 30 of driving' }, enlace: { texto: 'See the trip to Cafayate' } },
    { titulo: 'Cachi and the Cuesta del Obispo', etiqueta: '2 h 30 of driving', fuente: { pagina: 'en/salta-to-cachi-transfer.html', texto: '2 h 30 of driving' }, enlace: { texto: 'See the trip to Cachi' } },
    { titulo: 'Quebrada de Humahuaca and Purmamarca', etiqueta: '2 h 50 to Purmamarca', fuente: { pagina: 'en/salta-to-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 to Purmamarca' }, enlace: { texto: 'See the trip to Purmamarca and Humahuaca' } },
    { titulo: 'Salinas Grandes', etiqueta: '4 h 10 one way', fuente: { pagina: 'en/salinas-grandes-from-salta.html', texto: '4 h 10 one way' }, enlace: { texto: 'See the trip to Salinas Grandes' } },
    { titulo: 'Iruya', etiqueta: 'Best over two days', fuente: { pagina: 'tarjeta', texto: 'best over two days' }, enlace: { texto: 'Ask about the trip to Iruya', href: 'mailto:transporte@lausof.com?subject=Quote%20request%20%E2%80%94%20trip%20to%20Iruya' } },
    { titulo: 'San Antonio de los Cobres and the Puna', etiqueta: '3 h of driving', fuente: { pagina: 'en/salta-to-san-antonio-de-los-cobres.html', texto: '3 h of driving' }, enlace: { texto: 'See the trip to San Antonio de los Cobres' } },
  ],
  'pt/passeios-e-traslados.html': [
    { titulo: 'Cafayate e a Quebrada de las Conchas', etiqueta: '2 h 30 de direção', fuente: { pagina: 'pt/traslado-salta-cafayate.html', texto: '2 h 30 de direção' }, enlace: { texto: 'Ver a viagem para Cafayate' } },
    { titulo: 'Cachi e a Cuesta del Obispo', etiqueta: '2 h 30 de direção', fuente: { pagina: 'traslado-salta-cachi.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver a viagem para Cachi (em espanhol)' } },
    { titulo: 'Quebrada de Humahuaca e Purmamarca', etiqueta: '2 h 50 até Purmamarca', fuente: { pagina: 'pt/traslado-salta-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 até Purmamarca' }, enlace: { texto: 'Ver a viagem para Purmamarca e Humahuaca' } },
    { titulo: 'Salinas Grandes', etiqueta: '4 h 10 de estrada', fuente: { pagina: 'pt/salinas-grandes-saindo-de-salta.html', texto: '4 h 10 de estrada' }, enlace: { texto: 'Ver a viagem para Salinas Grandes' } },
    { titulo: 'Iruya', etiqueta: 'Em dois dias', fuente: { pagina: 'tarjeta', texto: 'em dois dias' }, enlace: { texto: 'Consultar a viagem para Iruya', href: 'https://wa.me/5493875269009?text=Ol%C3%A1%20Lausof%2C%20quero%20consultar%20uma%20viagem%20para%20Iruya' } },
    { titulo: 'San Antonio de los Cobres e a Puna', etiqueta: '3 h de direção', fuente: { pagina: 'traslado-salta-san-antonio-de-los-cobres.html', texto: '3 h de manejo' }, enlace: { texto: 'Ver a viagem para San Antonio de los Cobres (em espanhol)' } },
  ],
  // Las tarjetas internacionales abren su descripción con la distancia y los
  // días de viaje: una etiqueta repetiría la misma línea (1b L4, L12).
  'viajes-internacionales.html': [
    { titulo: 'San Pedro de Atacama, Chile', etiqueta: null, motivo: 'la descripción ya empieza con la distancia y el día de viaje', enlace: { texto: 'Ver el viaje a San Pedro de Atacama' } },
    { titulo: 'Uyuni, Bolivia', etiqueta: null, motivo: 'la descripción ya empieza con la distancia y los dos días', enlace: { texto: 'Ver el viaje a Uyuni' } },
    { titulo: 'Otros destinos, a pedido', etiqueta: null, motivo: 'el título ya dice «a pedido»', enlace: null },
  ],
  'en/international-trips.html': [
    { titulo: 'San Pedro de Atacama, Chile', etiqueta: null, motivo: 'the description already opens with the distance and the day of travel', enlace: { texto: 'See the trip to San Pedro de Atacama' } },
    { titulo: 'Uyuni, Bolivia', etiqueta: null, motivo: 'the description already opens with the distance and the two days', enlace: { texto: 'See the trip to Uyuni' } },
    { titulo: 'Other destinations, on request', etiqueta: null, motivo: 'the title already says «on request»', enlace: null },
  ],
};
