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
   - `linea`: la única línea de la tarjeta (el <p> después del <h3>), una
     frase corta: dónde y cómo es el viaje, no todo lo que la página cuenta
     (ronda 9, 08/11/2026; 1b L29, L4).
   - `enlace`: el texto del enlace de la tarjeta, sin la flecha. Si la tarjeta
     no tiene enlace, `href` lo agrega (la primera línea del mensaje; los
     renglones los pone scripts/prefill.mjs). `null` = el enlace queda como
     está.
   Reglas (rondas-2026-11-07/BRIEF.md): sin precios ni «desde», sin
   cantidades de flota, cada página en su idioma.
   ============================================================================= */

export const TARJETAS = {
  'turismo.html': [
    { titulo: 'Cafayate y la Quebrada de las Conchas', linea: "La Ruta 68, la Garganta del Diablo y los viñedos, con asfalto todo el camino.", etiqueta: '2 h 30 de manejo', fuente: { pagina: 'traslado-salta-cafayate.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver el viaje a Cafayate' } },
    { titulo: 'Cachi y la Cuesta del Obispo', linea: "El camino de montaña a los Valles Calchaquíes, con tramos de ripio cerca del abra.", etiqueta: '2 h 30 de manejo', fuente: { pagina: 'traslado-salta-cachi.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver el viaje a Cachi' } },
    { titulo: 'Quebrada de Humahuaca y Purmamarca', linea: "El cerro de los Siete Colores, los pueblos de la Quebrada y el mirador del Hornocal.", etiqueta: '2 h 50 hasta Purmamarca', fuente: { pagina: 'traslado-salta-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 hasta Purmamarca' }, enlace: { texto: 'Ver el viaje a Purmamarca y Humahuaca' } },
    { titulo: 'Salinas Grandes', linea: "Por San Antonio de los Cobres o por Jujuy, en unidades preparadas para la altura.", etiqueta: '4 h 10 de manejo', fuente: { pagina: 'salinas-grandes-desde-salta.html', texto: '4 h 10 de manejo' }, enlace: { texto: 'Ver el viaje a Salinas Grandes' } },
    { titulo: 'Iruya', linea: "Un camino de ripio lento, en unidades preparadas, que rinde más en dos días.", etiqueta: 'En dos días', fuente: { pagina: 'tarjeta', texto: 'en dos días' }, enlace: { texto: 'Consultar el viaje a Iruya', href: 'https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20consultar%20un%20viaje%20a%20Iruya' } },
    { titulo: 'San Antonio de los Cobres y la Puna', linea: "La zona del Tren a las Nubes y del viaducto La Polvorilla, que conocemos por años de trabajo en la Puna.", etiqueta: '3 h de manejo', fuente: { pagina: 'traslado-salta-san-antonio-de-los-cobres.html', texto: '3 h de manejo' }, enlace: { texto: 'Ver el viaje a San Antonio de los Cobres' } },
  ],
  'en/tours-and-transfers.html': [
    { titulo: 'Cafayate and the Quebrada de las Conchas', linea: "Ruta 68, the Garganta del Diablo and the vineyards, paved the whole way.", etiqueta: '2 h 30 of driving', fuente: { pagina: 'en/salta-to-cafayate-transfer.html', texto: '2 h 30 of driving' }, enlace: { texto: 'See the trip to Cafayate' } },
    { titulo: 'Cachi and the Cuesta del Obispo', linea: "The mountain road to the Calchaquí Valleys, with gravel sections near the top.", etiqueta: '2 h 30 of driving', fuente: { pagina: 'en/salta-to-cachi-transfer.html', texto: '2 h 30 of driving' }, enlace: { texto: 'See the trip to Cachi' } },
    { titulo: 'Quebrada de Humahuaca and Purmamarca', linea: "The Cerro de los Siete Colores, the villages of the gorge and the Hornocal viewpoint.", etiqueta: '2 h 50 to Purmamarca', fuente: { pagina: 'en/salta-to-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 to Purmamarca' }, enlace: { texto: 'See the trip to Purmamarca and Humahuaca' } },
    { titulo: 'Salinas Grandes', linea: "Through San Antonio de los Cobres or through Jujuy, in vehicles prepared for altitude.", etiqueta: '4 h 10 one way', fuente: { pagina: 'en/salinas-grandes-from-salta.html', texto: '4 h 10 one way' }, enlace: { texto: 'See the trip to Salinas Grandes' } },
    { titulo: 'Iruya', linea: "A slow gravel road, in a vehicle built for it, and best over two days.", etiqueta: 'Best over two days', fuente: { pagina: 'tarjeta', texto: 'best over two days' }, enlace: { texto: 'Ask about the trip to Iruya', href: 'mailto:transporte@lausof.com?subject=Quote%20request%20%E2%80%94%20trip%20to%20Iruya' } },
    { titulo: 'San Antonio de los Cobres and the Puna', linea: "The area of the Tren a las Nubes and the La Polvorilla viaduct, which we know from years of work in the Puna.", etiqueta: '3 h of driving', fuente: { pagina: 'en/salta-to-san-antonio-de-los-cobres.html', texto: '3 h of driving' }, enlace: { texto: 'See the trip to San Antonio de los Cobres' } },
  ],
  'pt/passeios-e-traslados.html': [
    { titulo: 'Cafayate e a Quebrada de las Conchas', linea: "A Ruta 68, a Garganta del Diablo e os vinhedos, com asfalto o caminho todo.", etiqueta: '2 h 30 de direção', fuente: { pagina: 'pt/traslado-salta-cafayate.html', texto: '2 h 30 de direção' }, enlace: { texto: 'Ver a viagem para Cafayate' } },
    { titulo: 'Cachi e a Cuesta del Obispo', linea: "A estrada de montanha dos Valles Calchaquíes, com trechos de cascalho perto do passo.", etiqueta: '2 h 30 de direção', fuente: { pagina: 'traslado-salta-cachi.html', texto: '2 h 30 de manejo' }, enlace: { texto: 'Ver a viagem para Cachi (em espanhol)' } },
    { titulo: 'Quebrada de Humahuaca e Purmamarca', linea: "O Cerro de los Siete Colores, os povoados da Quebrada e o mirante do Hornocal.", etiqueta: '2 h 50 até Purmamarca', fuente: { pagina: 'pt/traslado-salta-purmamarca-tilcara-humahuaca.html', texto: '2 h 50 até Purmamarca' }, enlace: { texto: 'Ver a viagem para Purmamarca e Humahuaca' } },
    { titulo: 'Salinas Grandes', linea: "Por San Antonio de los Cobres ou por Jujuy, em veículos preparados para a altitude.", etiqueta: '4 h 10 de estrada', fuente: { pagina: 'pt/salinas-grandes-saindo-de-salta.html', texto: '4 h 10 de estrada' }, enlace: { texto: 'Ver a viagem para Salinas Grandes' } },
    { titulo: 'Iruya', linea: "Uma estrada de cascalho lenta, em veículos preparados, que rende mais em dois dias.", etiqueta: 'Em dois dias', fuente: { pagina: 'tarjeta', texto: 'em dois dias' }, enlace: { texto: 'Consultar a viagem para Iruya', href: 'https://wa.me/5493875269009?text=Ol%C3%A1%20Lausof%2C%20quero%20consultar%20uma%20viagem%20para%20Iruya' } },
    { titulo: 'San Antonio de los Cobres e a Puna', linea: "A região do Tren a las Nubes e do viaduto La Polvorilla, que conhecemos pelos anos de trabalho na Puna.", etiqueta: '3 h de direção', fuente: { pagina: 'traslado-salta-san-antonio-de-los-cobres.html', texto: '3 h de manejo' }, enlace: { texto: 'Ver a viagem para San Antonio de los Cobres (em espanhol)' } },
  ],
  // Las tarjetas internacionales abren su descripción con la distancia y los
  // días de viaje: una etiqueta repetiría la misma línea (1b L4, L12).
  'viajes-internacionales.html': [
    { titulo: 'San Pedro de Atacama, Chile', linea: "Unos 590 km por el Paso de Jama, a 4.200 m: un día completo de viaje, todo asfaltado.", etiqueta: null, motivo: 'la descripción ya empieza con la distancia y el día de viaje', enlace: { texto: 'Ver el viaje a San Pedro de Atacama' } },
    { titulo: 'Uyuni, Bolivia', linea: "Unos 690 km por la Quebrada de Humahuaca, La Quiaca y Tupiza: lo recomendamos en dos días.", etiqueta: null, motivo: 'la descripción ya empieza con la distancia y los dos días', enlace: { texto: 'Ver el viaje a Uyuni' } },
    { titulo: 'Otros destinos, a pedido', linea: "Otras ciudades de Chile o Bolivia, o un viaje por los dos países: díganos a dónde va y lo armamos.", etiqueta: null, motivo: 'el título ya dice «a pedido»', enlace: null },
  ],
  'en/international-trips.html': [
    { titulo: 'San Pedro de Atacama, Chile', linea: "About 590 km over the Jama Pass at 4,200 m (13,800 ft): a full day on paved roads.", etiqueta: null, motivo: 'the description already opens with the distance and the day of travel', enlace: { texto: 'See the trip to San Pedro de Atacama' } },
    { titulo: 'Uyuni, Bolivia', linea: "About 690 km via the Quebrada de Humahuaca, La Quiaca and Tupiza, best over two days.", etiqueta: null, motivo: 'the description already opens with the distance and the two days', enlace: { texto: 'See the trip to Uyuni' } },
    { titulo: 'Other destinations, on request', linea: "Other towns in Chile or Bolivia, or a trip through both: tell us the destination and we plan it.", etiqueta: null, motivo: 'the title already says «on request»', enlace: null },
  ],
};
