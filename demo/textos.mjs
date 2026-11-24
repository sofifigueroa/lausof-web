/* =============================================================================
   TEXTOS QUE SÓLO EXISTEN EN LA DEMO
   -----------------------------------------------------------------------------
   Fuente: ~/lausof/web/demo-reservas-2026-11-06/4-textos.md §5 y §7.
   La carpeta demo/ no se publica en producción (_redirects la devuelve con
   404!); sólo `node scripts/demo.mjs armar` lee estos textos.

   - FRANJA (copy 4, 4-textos §7.1): la marca de la demo arriba de cada página.
     El texto es el borrador de Apacheta sin «Demostración», que repetía la
     etiqueta DEMO de al lado (auditoría N7); main se lo pasa a Apacheta con
     R12 a para que su franja diga lo mismo y el que pasa de lausof.com al
     pago lea un solo mensaje.
   - PREFIJO_TITULO (§7.3): «[Demo] » antes del <title>, igual en los tres
     idiomas.
   - FAQ_PRECIO (§5, O11 del manifiesto): la respuesta de «¿Cuánto cuesta?»
     que reemplaza a «la cotización se envía por escrito» en las páginas cuya
     vitrina muestra al menos un monto. Producción conserva el texto de hoy.
   ============================================================================= */

export const FRANJA = {
  es: { etiqueta: 'DEMO', texto: 'precios de prueba · no se cobra', aria: 'Sitio de demostración' },
  en: { etiqueta: 'DEMO', texto: 'test prices · nothing is charged', aria: 'Demo site' },
  pt: { etiqueta: 'DEMO', texto: 'preços de teste · nada é cobrado', aria: 'Site de demonstração' },
};

export const PREFIJO_TITULO = '[Demo] ';

// Respuestas de 4-textos §5 (tienda.faq.precio y tienda.faq.precio_evento), revisión 4b:
// el precio es el total del grupo según cuántas personas viajan (3c), sin el
// momento del pago (auditoría B2: seña o total se elige en la compra).
// «Precios y reserva» enlaza a #precios, la sección de la vitrina (#reservar ya es
// «Cómo reservar» en 22 páginas de producción; 7-contrato-overlay.md, pedido 1).
export const RESPUESTA_PRECIO = {
  es: {
    precio: 'El precio de cada viaje está en «<a href="#precios">Precios y reserva</a>», más arriba en esta página: es el total para todo el grupo, con chofer, según cuántas personas viajan, y ahí mismo se reserva. Para otro recorrido o un grupo más grande, el presupuesto se arma en el chat o por WhatsApp.',
    evento: 'El vehículo con chofer por día tiene su precio en «<a href="#precios">Precios y reserva</a>», más arriba, según cuántas personas viajan. El viaje completo del evento se presupuesta según el programa, desde esa misma sección, el chat o WhatsApp.',
  },
  en: {
    precio: 'The price of each trip is in «<a href="#precios">Prices and booking</a>», further up this page: it is the total for the whole group, with a driver, by how many people travel, and booking is right there. For a different route or a larger group, the quote is put together in the chat or on WhatsApp.',
    evento: 'The vehicle with a driver by the day is priced in «<a href="#precios">Prices and booking</a>», further up, by how many people travel. The full event trip is quoted to its plan, from that same section, the chat or WhatsApp.',
  },
  pt: {
    precio: 'O preço de cada viagem está em «<a href="#precios">Preços e reserva</a>», mais acima nesta página: é o total para todo o grupo, com motorista, conforme quantas pessoas viajam, e ali mesmo se reserva. Para outro roteiro ou um grupo maior, o orçamento é montado no chat ou pelo WhatsApp.',
  },
};

// Páginas con la pregunta «¿Cuánto cuesta?» cuya vitrina muestra un monto
// según el mapa de 3a §2 (páginas de evento: una tarjeta con precio, la combi
// por día). Quedan afuera a propósito: los dos sentidos inversos (sin precio
// hasta R9), agencias-y-hoteles y las de empresas (sin vitrina) y los hubs de
// turismo (no tienen una sección «Precios y reserva» a la que remitir).
// O11 se aplica sólo si la vitrina de la página tiene una tarjeta con precio
// (data-tienda-con-precio, pedido 3 del contrato): sin eso, el texto de hoy queda.
export const FAQ_PRECIO = {
  'alquiler-combi-con-chofer-salta.html': 'precio',
  'traslado-aeropuerto-salta.html': 'precio',
  'traslado-salta-cachi.html': 'precio',
  'traslado-salta-cafayate.html': 'precio',
  'traslado-salta-jujuy.html': 'precio',
  'traslado-salta-san-pedro-de-atacama.html': 'precio',
  'traslado-salta-uyuni.html': 'precio',
  'feriados-fines-de-semana-largos.html': 'evento',
  'traslado-carnaval-quebrada-de-humahuaca.html': 'evento',
  'traslado-serenata-a-cafayate.html': 'evento',
  'traslados-casamientos.html': 'evento',
  'en/minibus-with-driver-salta.html': 'precio',
  'en/salinas-grandes-from-salta.html': 'precio',
  'en/salta-airport-transfer.html': 'precio',
  'en/salta-to-cachi-transfer.html': 'precio',
  'en/salta-to-cafayate-transfer.html': 'precio',
  'en/salta-to-jujuy-transfer.html': 'precio',
  'en/salta-to-purmamarca-tilcara-humahuaca.html': 'precio',
  'en/salta-to-san-pedro-de-atacama.html': 'precio',
  'en/salta-to-uyuni.html': 'precio',
  'en/transfer-carnival-quebrada-de-humahuaca.html': 'evento',
  'en/wedding-transportation.html': 'evento',
  'pt/traslado-salta-cafayate.html': 'precio',
  'pt/traslado-salta-san-pedro-de-atacama.html': 'precio',
  'pt/traslado-salta-uyuni.html': 'precio',
};
