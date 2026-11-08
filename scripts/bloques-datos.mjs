/* =============================================================================
   DATOS DE CADA PÁGINA PARA LOS BLOQUES COMPARTIDOS — los lee scripts/bloques.mjs
   -----------------------------------------------------------------------------
   Lo único que cambia de una página a otra en los bloques que genera
   scripts/bloques.mjs (cierre, pie de contacto y barra del teléfono):

     asunto   el asunto de los enlaces de correo de la página (el pie, el
              cierre y la barra de empresas). Sin asunto, el de su idioma.
     cierre   el bloque de cierre: título (h2), textos (párrafos), id de la
              sección (si los enlaces de la página saltan a él), una nota
              opcional en HTML y `sinLogo` (galería y golf cierran sin el logo
              decorativo, por diseño: tests/contenido.test.js). Sin `cierre`, la página no lleva bloque de
              cierre (los avisos de privacidad y las 404).

   Todo lo demás (botones, rótulos, teléfono, correo, dirección, puntaje de
   Google, habilitaciones) vive en scripts/empresa.mjs (DATOS) y es igual en
   todas las páginas de un idioma.

   Se armó el 08/11/2026 (ronda 1 de lausof.com) leyendo el texto de cada
   página en producción (1d3c66b): los títulos y textos de los cierres son los
   que ya estaban, palabra por palabra. Desde entonces se editan acá.
   ============================================================================= */

export const PAGINAS = {
  "404.html": {
    "asunto": "Consulta desde lausof.com"
  },
  "agencias-y-hoteles.html": {
    "asunto": "Pedido de cotización — Agencias y hoteles",
    "cierre": {
      "titulo": "¿Armamos el próximo programa de su agencia?",
      "textos": [
        "Envíenos las fechas, el recorrido y cuántos viajan. Con esos datos, la cotización se envía por escrito, por WhatsApp o por correo."
      ]
    }
  },
  "alquiler-4x4.html": {
    "asunto": "Alquiler de camioneta 4x4",
    "cierre": {
      "titulo": "¿Una 4x4 para el viaje o para la operación?",
      "textos": [
        "Cuéntenos las fechas, el recorrido y, si es para una empresa, el plazo del alquiler. Le respondemos con el presupuesto por escrito, con las condiciones claras."
      ],
      "id": "contacto"
    }
  },
  "alquiler-autoelevadores.html": {
    "asunto": "Pedido de cotización — alquiler de autoelevadores",
    "cierre": {
      "titulo": "¿Necesitás un autoelevador en Salta?",
      "textos": [
        "Contanos qué hay que mover, dónde y por cuánto tiempo. Te respondemos con el presupuesto por escrito."
      ]
    }
  },
  "alquiler-combi-con-chofer-salta.html": {
    "asunto": "Pedido de cotización — Combi con chofer por día",
    "cierre": {
      "titulo": "¿Armamos los días del grupo?",
      "textos": [
        "Envíenos las fechas, el horario aproximado, el recorrido y cuántos viajan. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "cargas-refrigeradas.html": {
    "asunto": "Pedido de cotización — cargas refrigeradas",
    "cierre": {
      "titulo": "¿Tenés una carga que necesita frío?",
      "textos": [
        "Contanos qué llevás, desde dónde y hasta dónde. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "charter-recitales.html": {
    "asunto": "Pedido de cotización — combis a recitales y festivales",
    "cierre": {
      "titulo": "¿Tu grupo ya tiene las entradas?",
      "textos": [
        "Contanos la fecha, el evento y cuántos viajan. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "clubes-deportivos.html": {
    "asunto": "Pedido de cotización — traslados para clubes y delegaciones",
    "cierre": {
      "titulo": "¿Tu equipo juega de visitante?",
      "textos": [
        "Contanos la fecha del partido, a dónde viajan y cuántos son. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "deposito-galpon.html": {
    "asunto": "Pedido de cotización — depósito y galpón",
    "cierre": {
      "titulo": "¿Buscás depósito o una base en Salta?",
      "textos": [
        "Contanos qué necesitás guardar o mover y por cuánto tiempo. Con esos datos, la propuesta se envía por escrito."
      ]
    }
  },
  "empresas-y-mineria.html": {
    "asunto": "Pedido de cotización — empresas y minería",
    "cierre": {
      "titulo": "Pedir una cotización",
      "textos": [
        "Por WhatsApp, mail o teléfono."
      ],
      "id": "contacto"
    }
  },
  "en/404.html": {
    "asunto": "Quote request"
  },
  "en/4x4-rental.html": {
    "asunto": "Quote request — 4x4 pickup rental",
    "cierre": {
      "titulo": "Do you need a 4x4 pickup for your trip or your operation?",
      "textos": [
        "Tell us your dates, your route and, for a company, the rental term. We reply with the quote in writing, with the conditions clear."
      ],
      "id": "contact"
    }
  },
  "en/business-and-mining.html": {
    "asunto": "Quote request — business and mining",
    "cierre": {
      "titulo": "Request a quote",
      "textos": [
        "By email, WhatsApp or phone."
      ],
      "id": "contact"
    }
  },
  "en/crew-transport-lithium-projects.html": {
    "asunto": "Quote request — Crew transport for lithium projects",
    "cierre": {
      "titulo": "Does your project need crews up in the Puna?",
      "textos": [
        "Tell us where the project is, how the shifts work and how many people go up. You get a written quote."
      ]
    }
  },
  "en/film-production-logistics.html": {
    "asunto": "Quote request — film production logistics",
    "cierre": {
      "titulo": "Are you putting a shoot together in Salta?",
      "textos": [
        "Send us the dates, the locations and what has to move, and we will come back with a written quote."
      ],
      "id": "contact"
    }
  },
  "en/ground-transport-for-tour-operators.html": {
    "asunto": "Quote request — Tour operators and hotels",
    "cierre": {
      "titulo": "Planning your next program in the north?",
      "textos": [
        "Send us the dates, the route and how many are traveling. You get a written quote."
      ]
    }
  },
  "en/holy-week-salta-jujuy.html": {
    "asunto": "Quote request — Holy Week 2027 in Salta",
    "cierre": {
      "titulo": "Do you have your Holy Week dates?",
      "textos": [
        "Send us your days, how many are traveling and what you want to see. We reply in English with a plan and a written quote."
      ]
    }
  },
  "en/index.html": {
    "asunto": "Quote request",
    "cierre": {
      "titulo": "A trip, a group or a crew to move?",
      "textos": [
        "Tell us what, from where and to where. We reply with a written quote."
      ]
    }
  },
  "en/international-trips.html": {
    "asunto": "Quote request — international trip from Salta",
    "cierre": {
      "titulo": "Where is your group heading?",
      "textos": [
        "Tell us the destination, the date, how many are traveling, where we pick you up, one way or return, and a name and contact for the booking."
      ]
    }
  },
  "en/jujuy-utmb-trail-race-transfers.html": {
    "asunto": "Quote request — Jujuy trail race transfers 2027",
    "cierre": {
      "titulo": "Got your bib?",
      "textos": [
        "Tell us your distance, how many are traveling, your flights and where you are staying. We reply in English with a transfer plan and a written quote."
      ]
    }
  },
  "en/minibus-with-driver-salta.html": {
    "asunto": "Quote request — Minibus with driver by the day",
    "cierre": {
      "titulo": "Planning your days in the north?",
      "textos": [
        "Send us the dates, a rough schedule, the route and how many are traveling. You get a written quote."
      ]
    }
  },
  "en/mining-logistics.html": {
    "asunto": "Quote request — mining logistics",
    "cierre": {
      "titulo": "Does your operation need to go up to the Puna?",
      "textos": [
        "Tell us what has to move (crews, cargo or equipment) and between which points. We reply with a written quote.",
        "To get a useful quote in one round, include: the service; dates; origin and destination; number of passengers, or cargo type, weight and temperature; your company and a contact."
      ],
      "id": "contact"
    }
  },
  "en/personnel-transport.html": {
    "asunto": "Quote request — personnel transport",
    "cierre": {
      "titulo": "Do you need to move your people?",
      "textos": [
        "To get a useful quote in one round, include: the service; the dates; origin and destination; how many passengers are traveling; and your company and a contact. We reply with a written quote."
      ],
      "id": "contact"
    }
  },
  "en/privacy.html": {
    "asunto": "Privacy question"
  },
  "en/refrigerated-freight.html": {
    "asunto": "Quote request — refrigerated freight",
    "cierre": {
      "titulo": "Do you have a load that needs to stay cold?",
      "textos": [
        "Tell us what you are moving, from where, to where and at what temperature. We reply with a written quote."
      ]
    }
  },
  "en/salinas-grandes-from-salta.html": {
    "asunto": "Quote request — Salinas Grandes from Salta",
    "cierre": {
      "titulo": "Planning Salinas Grandes?",
      "textos": [
        "Tell us the date, where the trip starts and ends, how many people are traveling, and a name and contact for the booking. We reply with a written quote."
      ]
    }
  },
  "en/salta-airport-transfer.html": {
    "asunto": "Quote request — Salta airport transfer",
    "cierre": {
      "titulo": "Arriving in Salta?",
      "textos": [
        "Send us the flight number, the date, how many are traveling and where you are heading from the airport. You get a written quote."
      ]
    }
  },
  "en/salta-to-cachi-transfer.html": {
    "asunto": "Quote request — Salta to Cachi transfer",
    "cierre": {
      "titulo": "Planning the trip to Cachi?",
      "textos": [
        "Tell us the date, how many are traveling, and whether it is one way to Cachi, there and back in a day, or the full loop on Ruta 40. You get a written quote."
      ]
    }
  },
  "en/salta-to-cafayate-transfer.html": {
    "asunto": "Quote request — Salta to Cafayate transfer",
    "cierre": {
      "titulo": "Planning the trip to Cafayate?",
      "textos": [
        "Tell us the date, how many are traveling, whether it is one way, a day trip or several days, and where we pick you up. You get a written quote."
      ]
    }
  },
  "en/salta-to-jujuy-transfer.html": {
    "asunto": "Quote request — Salta to Jujuy transfer",
    "cierre": {
      "titulo": "Shall we drive you from Salta to Jujuy?",
      "textos": [
        "Send us the date, how many are traveling, where we pick you up and whether it is one way or return. You get a written quote."
      ]
    }
  },
  "en/salta-to-purmamarca-tilcara-humahuaca.html": {
    "asunto": "Quote request — Salta to Purmamarca, Tilcara and Humahuaca",
    "cierre": {
      "titulo": "Planning the Quebrada?",
      "textos": [
        "Tell us the dates, where the trip starts and ends, how many people are traveling and how many suitcases, and a name and contact for the booking. We reply with a written quote."
      ]
    }
  },
  "en/salta-to-san-antonio-de-los-cobres.html": {
    "asunto": "Quote request — Salta to San Antonio de los Cobres",
    "cierre": {
      "titulo": "Heading up to the Puna?",
      "textos": [
        "Tell us the date, how many are traveling, whether it is one way, a day trip or part of a longer trip, and where we pick you up. You get a written quote."
      ]
    }
  },
  "en/salta-to-san-pedro-de-atacama.html": {
    "asunto": "Quote request — Salta to San Pedro de Atacama",
    "cierre": {
      "titulo": "Ready to plan the crossing?",
      "textos": [
        "Tell us the date, how many are traveling, where we pick you up, one way or return, and a name and contact for the booking."
      ]
    }
  },
  "en/salta-to-uyuni.html": {
    "asunto": "Quote request — Salta to Uyuni",
    "cierre": {
      "titulo": "Ready to plan the trip to Uyuni?",
      "textos": [
        "Tell us the date, how many are traveling, where we pick you up, one way or return, and a name and contact for the booking."
      ]
    }
  },
  "en/san-pedro-de-atacama-to-salta.html": {
    "asunto": "Quote request — San Pedro de Atacama to Salta",
    "cierre": {
      "titulo": "Shall we pick you up in San Pedro de Atacama?",
      "textos": [
        "Tell us the date, how many are traveling, where we pick you up, where you are going in Salta, and a name and contact for the booking."
      ]
    }
  },
  "en/tours-and-transfers.html": {
    "asunto": "Quote request — transfers and day trips in Salta",
    "cierre": {
      "titulo": "Ready to plan the trip?",
      "textos": [
        "Tell us the route or destination, the dates, where the trip starts and ends, how many people are traveling, and a name and contact for the booking. With that we can send you a price straight away."
      ]
    }
  },
  "en/train-to-the-clouds-transfer.html": {
    "asunto": "Quote request — ride to the Tren a las Nubes",
    "cierre": {
      "titulo": "Holding a train-only ticket?",
      "textos": [
        "Send us the date, how many are traveling and where you are staying in Salta. We reply in English with a written quote and a pickup time."
      ]
    }
  },
  "en/transfer-carnival-quebrada-de-humahuaca.html": {
    "asunto": "Quote request — Quebrada de Humahuaca carnival",
    "cierre": {
      "titulo": "Already have your carnival dates?",
      "textos": [
        "Tell us the days, the village and how many are traveling. We reply in English with a written quote."
      ],
      "id": "quote"
    }
  },
  "en/uyuni-to-salta.html": {
    "asunto": "Quote request — Uyuni to Salta",
    "cierre": {
      "titulo": "Shall we pick you up in Uyuni, Tupiza or Villazón?",
      "textos": [
        "Tell us the date, how many are traveling, where we pick you up, where you are going in Salta, and a name and contact for the booking."
      ]
    }
  },
  "en/warehouse.html": {
    "asunto": "Quote request — warehousing in Salta",
    "cierre": {
      "titulo": "Looking for warehouse space or a base in Salta?",
      "textos": [
        "Tell us what you need to store or move and for how long. We reply with a written proposal."
      ]
    }
  },
  "en/wedding-transportation.html": {
    "asunto": "Quote request — wedding guest transportation in Salta",
    "cierre": {
      "titulo": "Planning a wedding in Salta?",
      "textos": [
        "Tell us the date, where the ceremony and the party are, how many guests need transport, and which hotels they are staying at. You get a written quote."
      ]
    }
  },
  "feriados-fines-de-semana-largos.html": {
    "asunto": "Pedido de cotización — viaje en un fin de semana largo",
    "cierre": {
      "titulo": "¿El grupo ya eligió el fin de semana?",
      "textos": [
        "Con la fecha, el destino y la cantidad de pasajeros, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "flota-en-venta.html": {
    "asunto": "Consulta — flota en venta",
    "cierre": {
      "titulo": "¿Te interesa alguna unidad?",
      "textos": [
        "Escribinos y te contamos el estado real de la unidad, la documentación y cómo coordinar para verla en Salta Capital."
      ],
      "id": "contacto",
      "nota": "Las consultas por las unidades van al WhatsApp de ventas: <a href=\"https://wa.me/5493875092489?text=Hola%20Lausof%2C%20quiero%20consultar%20por%20una%20unidad%20en%20venta%0AUnidad%3A%20\" target=\"_blank\" rel=\"noopener\">387 509-2489</a>."
    }
  },
  "galeria.html": {
    "asunto": "Consulta sobre la flota",
    "cierre": {
      "sinLogo": true,
      "titulo": "Para cotizar un servicio",
      "textos": [
        "Basta con el servicio, la fecha, el origen y el destino, y los pasajeros o la carga."
      ]
    }
  },
  "golf-torneos.html": {
    "asunto": "Pedido de cotización — traslados para torneos de golf",
    "cierre": {
      "sinLogo": true,
      "titulo": "¿Tenés que mover una delegación o un grupo?",
      "textos": [
        "Contanos cuántos son, desde dónde y hasta dónde. Con esos datos, la cotización se envía por escrito. Para delegaciones de otros deportes, mirá <a href=\"/clubes-deportivos.html\">clubes y delegaciones deportivas</a>."
      ]
    }
  },
  "index.html": {
    "asunto": "Pedido de cotización",
    "cierre": {
      "titulo": "¿Tenés un viaje, un grupo o un equipo para trasladar?",
      "textos": [
        "Contanos qué, desde dónde y hasta dónde. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "logistica-minera.html": {
    "asunto": "Pedido de cotización — logística minera",
    "cierre": {
      "titulo": "¿Tu operación necesita subir a la Puna?",
      "textos": [
        "Contanos qué hay que mover —personal, cargas o equipos—, desde dónde y hasta dónde. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "peregrinaciones-eventos.html": {
    "asunto": "Pedido de cotización — peregrinaciones, casamientos y eventos",
    "cierre": {
      "titulo": "¿Están armando un viaje en grupo?",
      "textos": [
        "Contanos la fecha, de dónde salen y cuántos son. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "privacidad.html": {
    "asunto": "Consulta sobre privacidad"
  },
  "producciones.html": {
    "asunto": "Pedido de cotización — producciones y rodajes",
    "cierre": {
      "titulo": "¿Están armando un rodaje en Salta?",
      "textos": [
        "Contanos fechas, locaciones y qué hay que mover. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "pt/index.html": {
    "asunto": "Pedido de orçamento — Lausof",
    "cierre": {
      "titulo": "Tem uma viagem, um grupo ou uma equipe para transportar?",
      "textos": [
        "Conte o quê, de onde e para onde. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "pt/passeios-e-traslados.html": {
    "asunto": "Pedido de orçamento — passeios em Salta e Jujuy",
    "cierre": {
      "titulo": "Vamos montar a próxima viagem?",
      "textos": [
        "Conte o destino, as datas, onde a viagem começa e termina, quantas pessoas viajam e um nome de contato. Com isso enviamos o orçamento. Pode escrever em português."
      ]
    }
  },
  "pt/privacidade.html": {
    "asunto": "Consulta sobre privacidade"
  },
  "pt/salinas-grandes-saindo-de-salta.html": {
    "asunto": "Pedido de orçamento — Salinas Grandes saindo de Salta",
    "cierre": {
      "titulo": "Vamos organizar o passeio às Salinas?",
      "textos": [
        "Mande a data, onde a viagem começa e termina, quantas pessoas viajam e um nome de contato. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "pt/traslado-salta-cafayate.html": {
    "asunto": "Pedido de orçamento — Salta a Cafayate",
    "cierre": {
      "titulo": "Vamos organizar a viagem a Cafayate?",
      "textos": [
        "Mande a data, quantas pessoas viajam, se é só ida, dia inteiro ou vários dias, e onde buscamos vocês. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "pt/traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "asunto": "Pedido de orçamento — Salta a Purmamarca, Tilcara e Humahuaca",
    "cierre": {
      "titulo": "Vamos organizar a viagem à Quebrada?",
      "textos": [
        "Mande as datas, onde a viagem começa e termina, quantas pessoas viajam e quantas malas levam, e um nome de contato. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "pt/traslado-salta-san-pedro-de-atacama.html": {
    "asunto": "Pedido de orçamento — Salta a San Pedro de Atacama",
    "cierre": {
      "titulo": "Vamos para San Pedro de Atacama?",
      "textos": [
        "Mande a data, quantas pessoas viajam, onde buscamos vocês e se é só ida ou ida e volta. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "pt/traslado-salta-uyuni.html": {
    "asunto": "Pedido de orçamento — Salta a Uyuni",
    "cierre": {
      "titulo": "Vamos para Uyuni?",
      "textos": [
        "Mande a data, quantas pessoas viajam, onde buscamos vocês e se é só ida ou ida e volta. Respondemos com o orçamento por escrito. Pode escrever em português."
      ]
    }
  },
  "salinas-grandes-desde-salta.html": {
    "asunto": "Pedido de cotización — Salinas Grandes desde Salta",
    "cierre": {
      "titulo": "¿Organizamos la salida a las Salinas?",
      "textos": [
        "Envíenos la fecha, dónde empieza y termina el viaje, cuántas personas viajan y un nombre de contacto. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "semana-santa-salta-jujuy.html": {
    "asunto": "Pedido de cotización — Semana Santa 2027 en Salta y Jujuy",
    "cierre": {
      "titulo": "¿Ya tienen fechas para Semana Santa?",
      "textos": [
        "Cuéntenos los días, cuántos viajan y qué quieren conocer. Con esos datos, el plan y la cotización se envían por escrito."
      ],
      "id": "contacto"
    }
  },
  "transporte-de-personal-obras-de-litio.html": {
    "asunto": "Pedido de cotización — Personal para obras de litio",
    "cierre": {
      "titulo": "¿Su obra necesita subir gente a la Puna?",
      "textos": [
        "Cuéntenos dónde es la obra, cómo son los turnos y cuántos suben. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "transporte-de-personal.html": {
    "asunto": "Pedido de cotización — transporte de personal",
    "cierre": {
      "titulo": "¿Tenés que mover a tu gente?",
      "textos": [
        "Contanos cuántas personas viajan, desde dónde y con qué frecuencia. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslado-aeropuerto-salta.html": {
    "asunto": "Pedido de cotización — Traslado desde el aeropuerto de Salta",
    "cierre": {
      "titulo": "¿Coordinamos su llegada a Salta?",
      "textos": [
        "Envíenos el número de vuelo, la fecha, cuántos viajan y adónde van desde el aeropuerto. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-carnaval-quebrada-de-humahuaca.html": {
    "asunto": "Pedido de cotización — Carnaval de la Quebrada",
    "cierre": {
      "titulo": "¿El grupo ya tiene las fechas del carnaval?",
      "textos": [
        "Con los días, el pueblo y la cantidad de pasajeros, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslado-salta-cachi.html": {
    "asunto": "Pedido de cotización — Salta a Cachi",
    "cierre": {
      "titulo": "¿Armamos el viaje a Cachi?",
      "textos": [
        "Envíenos la fecha, cuántos viajan y si es solo ida a Cachi, ida y vuelta en el día o el circuito completo por la Ruta 40. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-cafayate.html": {
    "asunto": "Pedido de cotización — Salta a Cafayate",
    "cierre": {
      "titulo": "¿Organizamos el viaje a Cafayate?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, si es solo ida, día completo o varios días, y dónde los buscamos. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-jujuy.html": {
    "asunto": "Pedido de cotización — Traslado de Salta a Jujuy",
    "cierre": {
      "titulo": "¿Viajamos de Salta a Jujuy?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, dónde los buscamos y si es solo ida o ida y vuelta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "asunto": "Pedido de cotización — Salta a Purmamarca, Tilcara y Humahuaca",
    "cierre": {
      "titulo": "¿Organizamos el viaje a la Quebrada?",
      "textos": [
        "Envíenos las fechas, dónde empieza y termina el viaje, cuántas personas viajan y cuántas valijas llevan, y un nombre de contacto. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-san-antonio-de-los-cobres.html": {
    "asunto": "Pedido de cotización — Salta a San Antonio de los Cobres",
    "cierre": {
      "titulo": "¿Subimos a la Puna?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, si es solo ida, en el día o parte de un viaje más largo, y dónde los buscamos. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-san-pedro-de-atacama.html": {
    "asunto": "Pedido de cotización — Salta a San Pedro de Atacama",
    "cierre": {
      "titulo": "¿Viajamos a San Pedro de Atacama?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, dónde los buscamos y si es solo ida o ida y vuelta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-salta-uyuni.html": {
    "asunto": "Pedido de cotización — Salta a Uyuni",
    "cierre": {
      "titulo": "¿Viajamos a Uyuni?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, dónde los buscamos y si es solo ida o ida y vuelta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-san-pedro-de-atacama-salta.html": {
    "asunto": "Pedido de cotización — San Pedro de Atacama a Salta",
    "cierre": {
      "titulo": "¿Lo buscamos en San Pedro de Atacama?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, dónde los buscamos y a dónde van en Salta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslado-serenata-a-cafayate.html": {
    "asunto": "Pedido de cotización — Serenata a Cafayate",
    "cierre": {
      "titulo": "¿El grupo ya eligió la noche?",
      "textos": [
        "Con la noche, la cantidad de pasajeros y el punto de salida, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslado-tren-a-las-nubes.html": {
    "asunto": "Pedido de cotización — traslado al Tren a las Nubes",
    "cierre": {
      "titulo": "¿Ya tiene el pasaje Solo Tren?",
      "textos": [
        "Cuéntenos la fecha, cuántos viajan y dónde se alojan. Con esos datos, la cotización del traslado se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslado-uyuni-salta.html": {
    "asunto": "Pedido de cotización — Uyuni a Salta",
    "cierre": {
      "titulo": "¿Lo buscamos en Uyuni, Tupiza o Villazón?",
      "textos": [
        "Envíenos la fecha, cuántos viajan, dónde los buscamos y a dónde van en Salta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslados-casamientos.html": {
    "asunto": "Pedido de cotización — traslados para casamientos",
    "cierre": {
      "titulo": "¿Organizamos los traslados de su casamiento?",
      "textos": [
        "Envíenos la fecha, el lugar de la ceremonia y de la fiesta, cuántos invitados necesitan traslado y desde qué hoteles o barrios. Con esos datos, la cotización se envía por escrito."
      ]
    }
  },
  "traslados-empresas.html": {
    "asunto": "Pedido de cotización — traslados corporativos y congresos",
    "cierre": {
      "titulo": "¿Tenés un evento o una comitiva por delante?",
      "textos": [
        "Contanos la fecha, cuántas personas viajan y el recorrido. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslados-fiesta-del-milagro.html": {
    "asunto": "Pedido de cotización — Fiesta del Milagro",
    "cierre": {
      "titulo": "¿Su grupo ya está organizando el Milagro?",
      "textos": [
        "Cuéntenos de dónde salen, cuántos son y qué día llegan a Salta. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "traslados-trail-jujuy-utmb.html": {
    "asunto": "Pedido de cotización — carrera de trail en Jujuy",
    "cierre": {
      "titulo": "¿Ya tiene su dorsal?",
      "textos": [
        "Cuéntenos qué distancia corren, cuántos son y cuándo llegan. Con esos datos, el plan de traslados y la cotización se envían por escrito."
      ],
      "id": "contacto"
    }
  },
  "turismo.html": {
    "asunto": "Pedido de cotización — turismo en Salta y Jujuy",
    "cierre": {
      "titulo": "¿Armamos el próximo viaje?",
      "textos": [
        "Cuéntenos el destino, las fechas, dónde empieza y termina el viaje, cuántas personas viajan y un nombre de contacto. Con eso le enviamos la cotización."
      ]
    }
  },
  "viajes-de-estudio.html": {
    "asunto": "Pedido de cotización — viajes de estudio",
    "cierre": {
      "titulo": "¿Están organizando una salida educativa?",
      "textos": [
        "Contanos la fecha, el destino y cuántos alumnos y acompañantes viajan. Con esos datos, la cotización se envía por escrito."
      ],
      "id": "contacto"
    }
  },
  "viajes-internacionales.html": {
    "asunto": "Pedido de cotización — viaje internacional desde Salta",
    "cierre": {
      "titulo": "¿A dónde viaja su grupo?",
      "textos": [
        "Envíenos el destino, la fecha, cuántos viajan, dónde los buscamos y si es solo ida o ida y vuelta. Con esos datos, la cotización se envía por escrito."
      ]
    }
  }
};

// El párrafo de enlaces del pie de cada portada (va después de los idiomas).
export const PIE_PORTADAS = {
  "index.html": "<a href=\"/flota-en-venta.html\">Flota en venta →</a> · <a href=\"/turismo.html\">Turismo en Salta →</a> · <a href=\"/feriados-fines-de-semana-largos.html\">Feriados y fines de semana largos →</a> · <a href=\"/traslado-salta-purmamarca-tilcara-humahuaca.html\">Salta a Purmamarca y Humahuaca →</a> · <a href=\"/salinas-grandes-desde-salta.html\">Salinas Grandes →</a> · <a href=\"/galeria.html\">Galería →</a> · <a href=\"/deposito-galpon.html\">Depósito y galpón →</a>",
  "en/index.html": "English pages: <a href=\"/en/personnel-transport.html\">Personnel transport</a> · <a href=\"/en/mining-logistics.html\">Mining logistics</a> · <a href=\"/en/crew-transport-lithium-projects.html\">Crew transport for lithium projects</a> · <a href=\"/en/tours-and-transfers.html\">Tours and transfers</a> · <a href=\"/en/ground-transport-for-tour-operators.html\">For tour operators and hotels</a> · <a href=\"/en/salta-to-purmamarca-tilcara-humahuaca.html\">Salta to Purmamarca and Humahuaca</a> · <a href=\"/en/salinas-grandes-from-salta.html\">Salinas Grandes from Salta</a> · <a href=\"/en/international-trips.html\">International trips</a> · <a href=\"/en/4x4-rental.html\">4x4 rental</a> · <a href=\"/en/salta-airport-transfer.html\">Salta airport transfer</a> · <a href=\"/en/minibus-with-driver-salta.html\">Minibus with driver by the day</a> · <a href=\"/en/refrigerated-freight.html\">Refrigerated freight</a> · <a href=\"/en/warehouse.html\">Warehouse</a> · <a href=\"/en/film-production-logistics.html\">Film and TV productions</a>",
  "pt/index.html": "<a href=\"/pt/passeios-e-traslados.html\">Passeios e traslados →</a> · <a href=\"/pt/traslado-salta-cafayate.html\">Salta a Cafayate →</a> · <a href=\"/pt/traslado-salta-purmamarca-tilcara-humahuaca.html\">Salta a Purmamarca e Humahuaca →</a> · <a href=\"/pt/salinas-grandes-saindo-de-salta.html\">Salinas Grandes →</a> · <a href=\"/pt/traslado-salta-san-pedro-de-atacama.html\">Salta a San Pedro de Atacama →</a> · <a href=\"/pt/traslado-salta-uyuni.html\">Salta a Uyuni →</a> · <a href=\"/feriados-fines-de-semana-largos.html\">Feriados e fins de semana prolongados (em espanhol) →</a> · <a href=\"/galeria.html\">Galeria (em espanhol) →</a> · <a href=\"/deposito-galpon.html\">Depósito e galpão (em espanhol) →</a>"
};
