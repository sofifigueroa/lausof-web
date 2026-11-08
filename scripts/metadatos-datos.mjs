/* =============================================================================
   TÍTULO Y DESCRIPCIÓN DE CADA PÁGINA — los escribe scripts/metadatos.mjs
   -----------------------------------------------------------------------------
   La única fuente del <title> y de la meta description de las 82 páginas, y
   de sus copias: og:title, og:description y el name y la description del
   nodo WebPage del JSON-LD (1b C5; tests de rutas, eventos, b2b…). Ronda 9
   de lausof.com, 08/11/2026. Hasta esa fecha cada página los escribía a mano
   y 71 de 80 títulos pasaban de 65 caracteres y 46 descripciones de 160
   (auditoría técnica del 03/11, L1 y L2).

   Reglas:
   - Título: hasta 65 caracteres, con la frase que la página ya ganaba al
     principio y la marca al final, corta: « | Lausof». Google: «avoid
     unnecessarily long or verbose text… the title link is truncated…
     typically to fit the device width» y «consider including just your site
     name at the beginning or end of each <title> element, separated… with a
     delimiter such as a hyphen, colon, or pipe»
     (developers.google.com/search/docs/appearance/title-link, actualizada el
     10/12/2025, leída el 08/11/2026). En español y portugués, mayúscula sólo
     al empezar y en los nombres propios (FundéuRAE, «títulos, escritura
     correcta»); en inglés, Title Case.
   - Descripción: hasta 160 caracteres, la oferta primero; sin «Cotizá por
     WhatsApp» (los botones ya lo dicen) y en el registro de la página.
   - Sin precios, sin «desde» como precio, sin cantidades de flota
     (rondas-2026-11-07/BRIEF.md).
   - LARGOS: las 3 portadas pasan de 65 a propósito. Su título lleva los
     servicios que fijó la decisión de Lautaro del 03/11/2026 (tests/seo.test.js:
     turismo, minería, empresas, aeropuerto y charter); se acortó sin sacar
     ninguno.
   Cambiar un título o una descripción: editarlo acá y correr
   `node scripts/metadatos.mjs`; tests/paginas.test.js fija a conciencia los
   títulos que llevan palabras ganadas.
   ============================================================================= */

export const LIMITES = { titulo: 65, descripcion: 160 };

export const LARGOS = {
  'index.html': 'título de la portada: los cinco servicios de la decisión del 03/11/2026',
  'en/index.html': 'título de la portada en inglés: Tours, Mining, Airport y Charter (tests/seo.test.js)',
  'pt/index.html': 'título de la portada en portugués: Passeios, mineração, aeroporto y charter (tests/seo.test.js)',
};

export const METADATOS = {
  "404.html": {
    "titulo": "Página no encontrada | Lausof",
    "descripcion": "La página que buscás no existe o cambió de dirección. Desde acá llegás a turismo, transporte de personal, cargas y logística minera en Salta."
  },
  "agencias-y-hoteles.html": {
    "titulo": "Transporte para agencias y hoteles en Salta y Jujuy | Lausof",
    "descripcion": "Traslados y excursiones con chofer para agencias de viajes, hoteles y operadores extranjeros en Salta y Jujuy, en nombre de su agencia. Cotización por escrito."
  },
  "alquiler-4x4.html": {
    "titulo": "Alquiler de 4x4 con chofer en Salta: viajeros y empresas | Lausof",
    "descripcion": "Camionetas 4x4 con chofer en Salta para viajeros: Puna, Ruta 40, Salinas Grandes, Chile y Bolivia. Para empresas y mineras, alquiler mensual con o sin chofer."
  },
  "alquiler-autoelevadores.html": {
    "titulo": "Alquiler de autoelevadores en Salta, con o sin operador | Lausof",
    "descripcion": "Autoelevadores Michigan de 3 y 4 toneladas en Salta, con o sin operador, por jornada o por período, en nuestro galpón o en tu obra o depósito."
  },
  "alquiler-combi-con-chofer-salta.html": {
    "titulo": "Alquiler de combi con chofer por día en Salta | Lausof",
    "descripcion": "Combi de 19+1 plazas con chofer por día o por varios días en Salta, Jujuy y el norte: el chofer espera en cada parada. Cotización por escrito."
  },
  "cargas-refrigeradas.html": {
    "titulo": "Cargas refrigeradas en Salta: cadena de frío y cámara | Lausof",
    "descripcion": "Cargas refrigeradas en Salta y el NOA: congelados y frescos con cadena de frío, registro de temperatura, camión 4x4 refrigerado y depósito con cámara."
  },
  "charter-recitales.html": {
    "titulo": "Alquiler de combi para recitales y festivales en Salta | Lausof",
    "descripcion": "Combis 19+1 con chofer para ir en grupo a recitales y festivales en Jujuy y Tucumán: el chofer espera y el grupo vuelve junto la misma noche."
  },
  "clubes-deportivos.html": {
    "titulo": "Traslados para clubes y delegaciones deportivas | Lausof",
    "descripcion": "Combis 19+1 con chofer para delegaciones deportivas: rugby, hockey y fútbol juvenil a partidos de visitante y torneos en Salta, Jujuy, Tucumán y el NOA."
  },
  "deposito-galpon.html": {
    "titulo": "Depósito y galpón en Salta con cámara de frío | Lausof",
    "descripcion": "Depósito y galpón propio en Salta Capital: almacenaje por período, consolidación, cross-dock, guarda en frío y playa de maniobras con taller en el predio."
  },
  "empresas-y-mineria.html": {
    "titulo": "Transporte de Personal y Cargas para Minería y Empresas | Lausof",
    "descripcion": "Transporte de cuadrillas, cadena de frío y cargas generales en Salta, Jujuy y la Puna. Habilitación CNRT, Factura A y cotización por WhatsApp o correo."
  },
  "feriados-fines-de-semana-largos.html": {
    "titulo": "Feriados y fines de semana largos 2026-2027 en Salta | Lausof",
    "descripcion": "Feriados y fines de semana largos de noviembre de 2026 a diciembre de 2027, con su fuente oficial, y los viajes en grupo que salen de Salta en esas fechas."
  },
  "flota-en-venta.html": {
    "titulo": "Flota en venta: unidades usadas en Salta | Lausof",
    "descripcion": "Unidades de la flota de Lausof en venta en Salta Capital: combis Sprinter 19+1, Volkswagen Amarok V6 y Mercedes-Benz ML350. Se pueden ver y probar."
  },
  "galeria.html": {
    "titulo": "Flota de Lausof: combis, camiones y 4x4 en Salta",
    "descripcion": "Fotos de las unidades de Lausof por tipo: combis 19+1 plazas, camiones térmicos con equipo de frío, camionetas 4x4, taller y depósito en Salta."
  },
  "golf-torneos.html": {
    "titulo": "Traslados de delegaciones a torneos de golf | Lausof",
    "descripcion": "Lausof SRL ha llevado delegaciones y grupos a torneos de golf en el NOA. Fotos de esos eventos y contacto por WhatsApp para traslados especiales."
  },
  "index.html": {
    "titulo": "Transporte de Pasajeros en Salta: Turismo, Minería, Empresas, Aeropuerto, Charter | Lausof",
    "descripcion": "Turismo y excursiones, personal para minería y empresas, cargas refrigeradas, aeropuerto y charter para grupos en Salta y Jujuy, con habilitación CNRT."
  },
  "logistica-minera.html": {
    "titulo": "Transporte y logística minera en Salta y la Puna | Lausof",
    "descripcion": "Personal a campamentos mineros, cargas y equipos a los salares de Salta, Jujuy y Catamarca, y asistencia mecánica en ruta sobre los 4.000 metros."
  },
  "peregrinaciones-eventos.html": {
    "titulo": "Peregrinaciones, casamientos y eventos en combi | Lausof",
    "descripcion": "Combis 19+1 con chofer para peregrinaciones, casamientos y eventos familiares en Salta, Jujuy y el NOA, con ida y vuelta la misma noche."
  },
  "privacidad.html": {
    "titulo": "Privacidad | Lausof",
    "descripcion": "Qué datos recibe Lausof por el sitio, WhatsApp, teléfono y correo, para qué se usan, quién los recibe y cómo pedir verlos, corregirlos o borrarlos."
  },
  "producciones.html": {
    "titulo": "Apoyo logístico para rodajes en Salta y la Puna | Lausof",
    "descripcion": "Camionetas 4x4 para ripio y altura, combis para el equipo técnico y asistencia mecánica en locación, para rodajes en Salta, la Puna, la Quebrada y los Valles."
  },
  "salinas-grandes-desde-salta.html": {
    "titulo": "Salinas Grandes desde Salta: unos 255 km y 4 h en combi | Lausof",
    "descripcion": "De Salta a las Salinas Grandes son unos 255 km y 4 h 10 de manejo por Purmamarca y la Cuesta de Lipán. Excursión en combi con chofer, en el día o con una noche."
  },
  "semana-santa-salta-jujuy.html": {
    "titulo": "Semana Santa 2027 en Salta y Jujuy: traslados con chofer | Lausof",
    "descripcion": "Semana Santa 2027 va del miércoles 24 al domingo 28 de marzo. Combis y 4x4 con chofer a Cafayate, Cachi y la Quebrada, y traslados al aeropuerto."
  },
  "transporte-de-personal-obras-de-litio.html": {
    "titulo": "Transporte de personal para obras de litio en la Puna | Lausof",
    "descripcion": "Combis con chofer para obras de litio en la Puna de Salta, Jujuy y Catamarca: cambios de turno de día y de noche, picos de dotación y campamentos."
  },
  "transporte-de-personal.html": {
    "titulo": "Transporte de personal en Salta: combis con chofer | Lausof",
    "descripcion": "Combis 19+1 con chofer para el personal de empresas, obras, clínicas, colegios y eventos en Salta: recorridos fijos o a demanda. Habilitación CNRT y AMT."
  },
  "traslado-aeropuerto-salta.html": {
    "titulo": "Traslado del aeropuerto de Salta al centro y hoteles | Lausof",
    "descripcion": "Traslado del aeropuerto de Salta (SLA) a su hotel, unos 11 a 13 km y 20 minutos, o directo a Cafayate, Purmamarca, Cachi o Jujuy, en combi 19+1 con chofer."
  },
  "traslado-carnaval-quebrada-de-humahuaca.html": {
    "titulo": "Carnaval 2027 en la Quebrada y Salta: combi con chofer | Lausof",
    "descripcion": "Carnaval 2027: la Quebrada del 6 al 9 de febrero y los corsos de Salta. Combi 19+1 con chofer, ida y vuelta cada noche o la unidad a disposición del grupo."
  },
  "traslado-salta-cachi.html": {
    "titulo": "Traslado de Salta a Cachi: unos 157 km y 2 h 30 | Lausof",
    "descripcion": "De Salta a Cachi son unos 157 km y 2 h 30 de manejo por la Cuesta del Obispo y Los Cardones. Combi o 4x4 con chofer, y el circuito a Cafayate por la Ruta 40."
  },
  "traslado-salta-cafayate.html": {
    "titulo": "Traslado de Salta a Cafayate en combi con chofer | Lausof",
    "descripcion": "Traslado de Salta a Cafayate por la Ruta 68 y la Quebrada de las Conchas: solo ida, día completo con bodegas o varios días. Combis de 19+1 con chofer."
  },
  "traslado-salta-jujuy.html": {
    "titulo": "Traslado de Salta a Jujuy y al aeropuerto de Jujuy | Lausof",
    "descripcion": "Traslado de Salta a San Salvador de Jujuy, unos 120 km y 1 h 35 por la autopista, o al aeropuerto de Jujuy (JUJ). Combi 19+1 con chofer, en los dos sentidos."
  },
  "traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "titulo": "Traslado de Salta a Purmamarca, Tilcara y Humahuaca | Lausof",
    "descripcion": "Combi con chofer de Salta o el aeropuerto a Purmamarca, Tilcara y Humahuaca: solo ida, en el día o varios días, para grupos. Rutas, tiempos y altura."
  },
  "traslado-salta-san-antonio-de-los-cobres.html": {
    "titulo": "Traslado de Salta a San Antonio de los Cobres | Lausof",
    "descripcion": "Traslado de Salta a San Antonio de los Cobres por la Ruta 51 y la Quebrada del Toro, con el viaducto La Polvorilla: altura, tiempos y unidad. Combi o 4x4."
  },
  "traslado-salta-san-pedro-de-atacama.html": {
    "titulo": "Traslado privado de Salta a San Pedro de Atacama | Lausof",
    "descripcion": "Traslado de Salta a San Pedro de Atacama (Chile) por Purmamarca, Salinas Grandes y el Paso de Jama, en combi 19+1 o 4x4 con chofer. Solo ida o ida y vuelta."
  },
  "traslado-salta-uyuni.html": {
    "titulo": "Traslado privado de Salta a Uyuni, Bolivia | Lausof",
    "descripcion": "Traslado privado de Salta al Salar de Uyuni (Bolivia) por la Quebrada de Humahuaca, La Quiaca y Tupiza, en combi 19+1 o 4x4 con chofer. Solo ida o ida y vuelta."
  },
  "traslado-san-pedro-de-atacama-salta.html": {
    "titulo": "Traslado privado de San Pedro de Atacama a Salta | Lausof",
    "descripcion": "Traslado privado de San Pedro de Atacama (Chile) a Salta por el Paso de Jama, Salinas Grandes y Purmamarca, en combi 19+1 o 4x4 con chofer. Frontera y SENASA."
  },
  "traslado-serenata-a-cafayate.html": {
    "titulo": "Traslado a la Serenata a Cafayate 2027 desde Salta | Lausof",
    "descripcion": "Combi 19+1 con chofer de Salta a la Serenata a Cafayate, 25, 26 y 27 de febrero de 2027: 189 km por la RN 68, con el chofer esperando y la vuelta en la noche."
  },
  "traslado-tren-a-las-nubes.html": {
    "titulo": "Traslado al Tren a las Nubes desde Salta | Lausof",
    "descripcion": "El Solo Tren sube en San Antonio de los Cobres y no incluye el viaje hasta ahí: lo hacemos desde Salta en combi o 4x4 con chofer, ida y vuelta en el día."
  },
  "traslado-uyuni-salta.html": {
    "titulo": "Traslado privado de Uyuni a Salta, también desde Tupiza | Lausof",
    "descripcion": "Traslado privado de Uyuni (Bolivia) a Salta por Villazón, La Quiaca y la Quebrada de Humahuaca, en combi 19+1 o 4x4 con chofer. También desde Tupiza o Villazón."
  },
  "traslados-casamientos.html": {
    "titulo": "Traslados para casamientos en Salta, fincas y bodegas | Lausof",
    "descripcion": "Combis con chofer para los invitados de su casamiento en Salta: hoteles, salón, fincas y bodegas de Cafayate, con vueltas de madrugada. Cotización por escrito."
  },
  "traslados-empresas.html": {
    "titulo": "Traslados corporativos y congresos en Salta | Lausof",
    "descripcion": "Traslados corporativos en combis 19+1 con chofer: congresos, eventos de empresa, comitivas y viajes Salta–Jujuy–Tucumán, con habilitación CNRT y factura A."
  },
  "traslados-fiesta-del-milagro.html": {
    "titulo": "Traslados para la Fiesta del Milagro 2027 en Salta | Lausof",
    "descripcion": "Combis con chofer para peregrinos y parroquias que llegan a Salta para el Milagro (15 de septiembre de 2027): apoyo en el camino y regreso al pueblo."
  },
  "traslados-trail-jujuy-utmb.html": {
    "titulo": "Traslados para Jujuy Fuerza Sagrada by UTMB 2027 | Lausof",
    "descripcion": "Combis con chofer para corredores y acompañantes del trail de Jujuy (31/3 al 4/4/2027): aeropuertos de Salta y Jujuy, largadas en Tilcara e Incahuasi y regreso."
  },
  "turismo.html": {
    "titulo": "Turismo en Salta y Jujuy: traslados en combi y 4x4 | Lausof",
    "descripcion": "Traslados turísticos por Salta y Jujuy: Cafayate, Cachi, Humahuaca, Purmamarca, Salinas Grandes e Iruya, en combi con chofer o camioneta 4x4."
  },
  "viajes-de-estudio.html": {
    "titulo": "Viajes de estudio para colegios y universidades | Lausof",
    "descripcion": "Combis 19+1 con chofer para viajes de estudio y salidas educativas a la Quebrada, Purmamarca y Salinas Grandes. Habilitación CNRT y seguro de pasajeros."
  },
  "viajes-internacionales.html": {
    "titulo": "Viajes internacionales desde Salta: Chile y Bolivia | Lausof",
    "descripcion": "Traslados privados de Salta a Chile, Bolivia y otros destinos, en combi 19+1 o 4x4 con chofer: San Pedro de Atacama por el Paso de Jama y Uyuni por La Quiaca."
  },
  "en/404.html": {
    "titulo": "Page not found | Lausof",
    "descripcion": "This page does not exist or has moved. From here you can reach Lausof SRL in Salta, Argentina: personnel transport, mining logistics, freight and transfers."
  },
  "en/4x4-rental.html": {
    "titulo": "4x4 Rental in Salta with a Driver: Travelers, Companies | Lausof",
    "descripcion": "4x4 pickups with a driver in Salta, Argentina, for travelers: the Puna, Route 40, the salt flats, Chile and Bolivia. Monthly rental for companies and mining."
  },
  "en/business-and-mining.html": {
    "titulo": "Crew Transport and Freight for Mining and Business | Lausof",
    "descripcion": "Crew transport, cold chain and general freight across Salta, Jujuy and the Puna. CNRT licensed, Factura A invoices, quotes by WhatsApp or email."
  },
  "en/crew-transport-lithium-projects.html": {
    "titulo": "Crew Transport for Lithium Projects in the Puna | Lausof",
    "descripcion": "Minibuses with a driver for contractors and EPCs on lithium projects in the Puna of Salta, Jujuy and Catamarca: shift changes, staffing peaks and camp runs."
  },
  "en/film-production-logistics.html": {
    "titulo": "Film Production Logistics in Salta and the Puna | Lausof",
    "descripcion": "4x4 pickups for gravel and altitude, minibuses for the crew and our own mechanics on location. Logistics for shoots in Salta and the Puna. Request a quote."
  },
  "en/ground-transport-for-tour-operators.html": {
    "titulo": "Ground Transport for Tour Operators in Salta and Jujuy | Lausof",
    "descripcion": "Ground transport for tour operators, travel agencies and hotels in Salta and Jujuy: airport pickups, day trips and multi-day programs, on your behalf."
  },
  "en/holy-week-salta-jujuy.html": {
    "titulo": "Holy Week 2027 in Salta and Jujuy: Private Driver | Lausof",
    "descripcion": "Holy Week 2027 in northwest Argentina runs from Wednesday, March 24 to Easter Sunday, March 28. Private minibus or 4x4 with driver for day trips and transfers."
  },
  "en/index.html": {
    "titulo": "Passenger Transport in Salta: Tours, Mining, Airport, Charter | Lausof",
    "descripcion": "Tours, crew transport and refrigerated freight for mining and business, airport transfers and group charters in Salta and Jujuy. CNRT-licensed, family-owned."
  },
  "en/international-trips.html": {
    "titulo": "International Trips from Salta: Chile and Bolivia | Lausof",
    "descripcion": "Private transfers from Salta to Chile, Bolivia and beyond in a 19-seat minibus or 4x4 with driver: San Pedro de Atacama, Uyuni and trips on request."
  },
  "en/jujuy-utmb-trail-race-transfers.html": {
    "titulo": "Jujuy Fuerza Sagrada by UTMB 2027 Transfers | Lausof",
    "descripcion": "Private minibus with driver for runners and crews at the Jujuy trail race, March 31 to April 4, 2027: airport pickups and early starts in Tilcara and Incahuasi."
  },
  "en/minibus-with-driver-salta.html": {
    "titulo": "Minibus with Driver by the Day in Salta | Lausof",
    "descripcion": "Hire a 19-seat minibus with a private driver by the day or for several days in Salta and Jujuy: the driver waits at every stop and follows your route."
  },
  "en/mining-logistics.html": {
    "titulo": "Mining Logistics in Salta and the Puna | Lausof",
    "descripcion": "Crew transport to mine camps, cargo to the salt flats of Salta, Jujuy and Catamarca, and on-site mechanics above 4,000 m across the Puna. CNRT-licensed."
  },
  "en/personnel-transport.html": {
    "titulo": "Personnel Transport in Salta: Minibuses with Driver | Lausof",
    "descripcion": "19-seat minibuses with a professional driver for companies, contractors and mine sites in Salta: fixed routes, crew changes and visitor transfers."
  },
  "en/privacy.html": {
    "titulo": "Privacy | Lausof",
    "descripcion": "What data Lausof receives through its website, WhatsApp, phone and email, what it is used for, who receives it, and how to see, correct or delete it."
  },
  "en/refrigerated-freight.html": {
    "titulo": "Refrigerated Freight in Salta, Argentina: Cold Chain | Lausof",
    "descripcion": "Frozen and chilled cargo across Salta and northwest Argentina with an unbroken cold chain, a temperature log in transit and cold room storage. Request a quote."
  },
  "en/salinas-grandes-from-salta.html": {
    "titulo": "Salinas Grandes from Salta: about 255 km and 4 Hours | Lausof",
    "descripcion": "Salta city to Salinas Grandes is about 255 km and 4 h 10 min of driving one way, via Purmamarca and the Cuesta de Lipán. Private minibus with driver for groups."
  },
  "en/salta-airport-transfer.html": {
    "titulo": "Salta Airport Transfer (SLA) by Private Minibus | Lausof",
    "descripcion": "Private transfer from Salta airport (SLA) to your hotel, about 11 to 13 km and 20 minutes, or on to Cafayate, Purmamarca, Cachi or Jujuy, by 19-seat minibus."
  },
  "en/salta-to-cachi-transfer.html": {
    "titulo": "Salta to Cachi Transfer: about 157 km and 2 h 30 | Lausof",
    "descripcion": "Salta to Cachi is about 157 km and 2 h 30 of driving over the Cuesta del Obispo. Private minibus or 4x4 with driver, and the Ruta 40 loop to Cafayate."
  },
  "en/salta-to-cafayate-transfer.html": {
    "titulo": "Salta to Cafayate Private Transfer by Minibus | Lausof",
    "descripcion": "Private transfer from Salta to Cafayate on Ruta 68 through the Quebrada de las Conchas: one way, a day trip with wineries, or several days, with a driver."
  },
  "en/salta-to-jujuy-transfer.html": {
    "titulo": "Salta to Jujuy Transfer and Jujuy Airport (JUJ) | Lausof",
    "descripcion": "Private transfer from Salta to San Salvador de Jujuy, about 120 km and 1 h 35, or to Jujuy airport (JUJ). 19-seat minibus with driver, both ways; written quote."
  },
  "en/salta-to-purmamarca-tilcara-humahuaca.html": {
    "titulo": "Salta to Purmamarca, Tilcara and Humahuaca Transfer | Lausof",
    "descripcion": "Private minibus with driver from Salta or Salta airport to Purmamarca, Tilcara and Humahuaca: one way, day trip or several days. Road, times and altitude."
  },
  "en/salta-to-san-antonio-de-los-cobres.html": {
    "titulo": "Salta to San Antonio de los Cobres Transfer | Lausof",
    "descripcion": "Private transfer from Salta to San Antonio de los Cobres on Route 51 through the Quebrada del Toro, with the La Polvorilla viaduct: altitude, times, vehicle."
  },
  "en/salta-to-san-pedro-de-atacama.html": {
    "titulo": "Private Transfer from Salta to San Pedro de Atacama | Lausof",
    "descripcion": "Private transfer from Salta to San Pedro de Atacama, Chile, via Purmamarca, Salinas Grandes and the Jama Pass, by 19-seat minibus or 4x4 with driver."
  },
  "en/salta-to-uyuni.html": {
    "titulo": "Private Transfer from Salta to Uyuni, Bolivia | Lausof",
    "descripcion": "Private transfer from Salta to the Uyuni salt flat in Bolivia via Humahuaca, La Quiaca and Tupiza, in a 19-seat minibus or 4x4 with driver. One way or return."
  },
  "en/san-pedro-de-atacama-to-salta.html": {
    "titulo": "Private Transfer from San Pedro de Atacama to Salta | Lausof",
    "descripcion": "Private transfer from San Pedro de Atacama, Chile, to Salta via the Jama Pass and Purmamarca, in a 19-seat minibus or 4x4 with driver. Border and entry rules."
  },
  "en/tours-and-transfers.html": {
    "titulo": "Private Transfers and Day Trips in Salta and Jujuy | Lausof",
    "descripcion": "Private transfers and day trips from Salta: airport pickups, Cafayate, Humahuaca, Salinas Grandes and Cachi by minibus or 4x4 with a licensed driver."
  },
  "en/train-to-the-clouds-transfer.html": {
    "titulo": "Tren a las Nubes Transfer from Salta | Lausof",
    "descripcion": "The Solo Tren (train only) ticket boards at San Antonio de los Cobres and leaves the road to you. Private minibus or 4x4 with driver from Salta, same day."
  },
  "en/transfer-carnival-quebrada-de-humahuaca.html": {
    "titulo": "Carnival 2027 in the Quebrada de Humahuaca and Salta | Lausof",
    "descripcion": "Carnival 2027 in the Quebrada de Humahuaca, February 6 to 9, and the Salta city parades. 19-seat minibus with driver, nightly round trips or for your group."
  },
  "en/uyuni-to-salta.html": {
    "titulo": "Private Transfer from Uyuni to Salta, also from Tupiza | Lausof",
    "descripcion": "Private transfer from Uyuni, Bolivia, to Salta via Villazón, La Quiaca and the Quebrada de Humahuaca, in a minibus or 4x4 with driver. Also from Tupiza."
  },
  "en/warehouse.html": {
    "titulo": "Warehouse and Storage in Salta, Argentina | Lausof",
    "descripcion": "Warehouse in the city of Salta, Argentina: about 3,000 m² with a truck yard, storage by period, consolidation, cross-docking and a cold room. Request a quote."
  },
  "en/wedding-transportation.html": {
    "titulo": "Wedding Transportation in Salta, Argentina | Lausof",
    "descripcion": "Guest shuttles for destination weddings in Salta, Argentina: airport pickups, hotels, fincas and Cafayate wineries, late-night returns. Minibuses with a driver."
  },
  "pt/index.html": {
    "titulo": "Transporte de passageiros em Salta: Passeios, mineração, aeroporto, charter | Lausof",
    "descripcion": "Passeios e traslados, pessoal para mineração e empresas, cargas refrigeradas às minas, aeroporto e charter para grupos em Salta e Jujuy, com habilitação CNRT."
  },
  "pt/passeios-e-traslados.html": {
    "titulo": "Passeios e traslados em Salta e Jujuy: van e 4x4 | Lausof",
    "descripcion": "Passeios e traslados privativos em Salta e Jujuy: Cafayate, Cachi, Humahuaca, Purmamarca, Salinas Grandes e Iruya, de van ou 4x4 com motorista."
  },
  "pt/privacidade.html": {
    "titulo": "Privacidade | Lausof",
    "descripcion": "Quais dados a Lausof recebe pelo site, WhatsApp, telefone e e-mail, para que são usados, quem os recebe e como pedir para vê-los, corrigi-los ou apagá-los."
  },
  "pt/salinas-grandes-saindo-de-salta.html": {
    "titulo": "Salinas Grandes saindo de Salta: passeio de van | Lausof",
    "descripcion": "Salinas Grandes saindo de Salta: uns 255 km por Purmamarca e a Cuesta de Lipán. Passeio privativo de van com motorista, no mesmo dia ou com uma noite."
  },
  "pt/traslado-salta-cafayate.html": {
    "titulo": "Traslado e passeio de Salta a Cafayate de van | Lausof",
    "descripcion": "Traslado e passeio de Salta a Cafayate pela Ruta 68 e a Quebrada de las Conchas: só ida, dia inteiro com vinícolas ou vários dias, de van com motorista."
  },
  "pt/traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "titulo": "Traslado de Salta a Purmamarca, Tilcara e Humahuaca | Lausof",
    "descripcion": "Traslado de van com motorista de Salta ou do aeroporto até Purmamarca, Tilcara e Humahuaca: só ida, bate-volta ou vários dias. Estradas, tempos e altitude."
  },
  "pt/traslado-salta-san-pedro-de-atacama.html": {
    "titulo": "De Salta a San Pedro de Atacama: traslado privado | Lausof",
    "descripcion": "Traslado privativo de Salta a San Pedro de Atacama pelo Paso de Jama, de van ou 4x4 com motorista. Só ida ou ida e volta. Fronteira, documentos e SAG."
  },
  "pt/traslado-salta-uyuni.html": {
    "titulo": "Traslado privado de Salta a Uyuni (Bolívia) | Lausof",
    "descripcion": "Traslado privativo de Salta a Uyuni, na Bolívia, por Humahuaca, La Quiaca–Villazón e Tupiza, de van ou 4x4 com motorista. Fronteira e documentos."
  }
};
