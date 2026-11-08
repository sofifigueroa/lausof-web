/* =============================================================================
   LAS MIGAS DE PAN DE CADA PÁGINA — las lee scripts/encabezado.mjs
   -----------------------------------------------------------------------------
   Una sola fuente para la miga visible (nav.crumbs) de las 80 páginas. Hasta
   el 08/11/2026 había tres formas (crumbs en 56 páginas, migas dentro del
   encabezado en las 12 de eventos, ninguna en 7) escritas a mano
   (rondas-2026-11-07/2-estado-actual.md, W4).

     MIGAS[página]  nombre  lo que dice la miga cuando es la página actual
                    padre   el enlace del nivel de arriba (sin padre: la portada
                            de su idioma)
                    clase   una clase de más para la nav (hub-crumbs: las migas
                            del hub de empresas van entre la barra y el
                            encabezado)
     NODOS[idioma]  los niveles que no son una página con su propia miga, o
                    que en las migas de otras páginas se nombran distinto: las
                    secciones del hub de empresas (#cargas, #personal…), el
                    hub de turismo («Turismo», más corto que su propio
                    nombre) y la página en español que enlazan las de
                    portugués.
     INICIO         el primer nivel de cada idioma.
     ROTULO         el aria-label de la nav en cada idioma (el más usado al
                    08/11/2026: «Ubicación», «Breadcrumb», «Navegação estrutural»).

   El nombre de un nivel intermedio sale de NODOS o, si no está, del nombre de
   esa página en MIGAS: cambiar «Turismo» acá lo cambia en todas las migas. El
   BreadcrumbList del JSON-LD de cada página tiene que decir lo mismo (lo
   revisa `node scripts/encabezado.mjs --comprobar`).
   ============================================================================= */

export const INICIO = {
  es: { nombre: 'Inicio', href: '/' },
  en: { nombre: 'Home', href: '/en/' },
  pt: { nombre: 'Início', href: '/pt/' },
};

export const ROTULO = { es: 'Ubicación', en: 'Breadcrumb', pt: 'Navegação estrutural' };

export const NODOS = {
  es: {
    '/turismo.html': { nombre: 'Turismo' },
    '/empresas-y-mineria.html#cargas': { nombre: 'Cargas', padre: '/empresas-y-mineria.html' },
    '/empresas-y-mineria.html#personal': { nombre: 'Personal para minería', padre: '/empresas-y-mineria.html' },
  },
  en: {
    '/en/business-and-mining.html#crew': { nombre: 'Mining crew transport', padre: '/en/business-and-mining.html' },
    '/en/business-and-mining.html#freight': { nombre: 'Freight', padre: '/en/business-and-mining.html' },
  },
  pt: {
    '/viajes-internacionales.html': { nombre: 'Viagens internacionais (em espanhol)', padre: '/pt/passeios-e-traslados.html' },
  },
};

export const MIGAS = {
  "agencias-y-hoteles.html": { nombre: "Para agencias y hoteles", padre: "/turismo.html" },
  "alquiler-4x4.html": { nombre: "Camionetas 4x4" },
  "alquiler-autoelevadores.html": { nombre: "Autoelevadores", padre: "/empresas-y-mineria.html#cargas" },
  "alquiler-combi-con-chofer-salta.html": { nombre: "Combi con chofer por día", padre: "/turismo.html" },
  "cargas-refrigeradas.html": { nombre: "Cargas refrigeradas", padre: "/empresas-y-mineria.html#cargas" },
  "charter-recitales.html": { nombre: "Recitales y festivales" },
  "clubes-deportivos.html": { nombre: "Clubes y delegaciones" },
  "deposito-galpon.html": { nombre: "Depósito y cámara de frío", padre: "/empresas-y-mineria.html#cargas" },
  "empresas-y-mineria.html": { nombre: "Empresas y minería", clase: "hub-crumbs" },
  "feriados-fines-de-semana-largos.html": { nombre: "Feriados y fines de semana largos" },
  "flota-en-venta.html": { nombre: "Flota en venta" },
  "logistica-minera.html": { nombre: "Logística minera", padre: "/empresas-y-mineria.html#personal" },
  "peregrinaciones-eventos.html": { nombre: "Peregrinaciones y eventos" },
  "privacidad.html": { nombre: "Privacidad" },
  "producciones.html": { nombre: "Producciones", padre: "/empresas-y-mineria.html#personal" },
  "salinas-grandes-desde-salta.html": { nombre: "Salinas Grandes desde Salta", padre: "/turismo.html" },
  "semana-santa-salta-jujuy.html": { nombre: "Semana Santa", padre: "/turismo.html" },
  "transporte-de-personal-obras-de-litio.html": { nombre: "Personal para obras de litio", padre: "/empresas-y-mineria.html#personal" },
  "transporte-de-personal.html": { nombre: "Transporte de personal", padre: "/empresas-y-mineria.html#personal" },
  "traslado-aeropuerto-salta.html": { nombre: "Traslado desde el aeropuerto", padre: "/turismo.html" },
  "traslado-carnaval-quebrada-de-humahuaca.html": { nombre: "Carnaval de la Quebrada", padre: "/feriados-fines-de-semana-largos.html" },
  "traslado-salta-cachi.html": { nombre: "Salta – Cachi y Ruta 40", padre: "/turismo.html" },
  "traslado-salta-cafayate.html": { nombre: "Salta – Cafayate", padre: "/turismo.html" },
  "traslado-salta-jujuy.html": { nombre: "Traslado Salta – Jujuy", padre: "/turismo.html" },
  "traslado-salta-purmamarca-tilcara-humahuaca.html": { nombre: "Salta a Purmamarca, Tilcara y Humahuaca", padre: "/turismo.html" },
  "traslado-salta-san-antonio-de-los-cobres.html": { nombre: "Salta – San Antonio de los Cobres", padre: "/turismo.html" },
  "traslado-salta-san-pedro-de-atacama.html": { nombre: "Salta – San Pedro de Atacama", padre: "/viajes-internacionales.html" },
  "traslado-salta-uyuni.html": { nombre: "Salta – Uyuni", padre: "/viajes-internacionales.html" },
  "traslado-san-pedro-de-atacama-salta.html": { nombre: "San Pedro de Atacama – Salta", padre: "/viajes-internacionales.html" },
  "traslado-serenata-a-cafayate.html": { nombre: "Serenata a Cafayate", padre: "/feriados-fines-de-semana-largos.html" },
  "traslado-tren-a-las-nubes.html": { nombre: "Tren a las Nubes", padre: "/turismo.html" },
  "traslado-uyuni-salta.html": { nombre: "Uyuni – Salta", padre: "/viajes-internacionales.html" },
  "traslados-casamientos.html": { nombre: "Casamientos", padre: "/peregrinaciones-eventos.html" },
  "traslados-empresas.html": { nombre: "Traslados corporativos", padre: "/empresas-y-mineria.html#personal" },
  "traslados-fiesta-del-milagro.html": { nombre: "Fiesta del Milagro", padre: "/peregrinaciones-eventos.html" },
  "traslados-trail-jujuy-utmb.html": { nombre: "Trail en Jujuy", padre: "/clubes-deportivos.html" },
  "turismo.html": { nombre: "Turismo en Salta y Jujuy" },
  "viajes-de-estudio.html": { nombre: "Viajes de estudio" },
  "viajes-internacionales.html": { nombre: "Viajes internacionales", padre: "/turismo.html" },
  "en/4x4-rental.html": { nombre: "4x4 pickup rental" },
  "en/business-and-mining.html": { nombre: "Business & mining", clase: "hub-crumbs" },
  "en/crew-transport-lithium-projects.html": { nombre: "Crew transport for lithium projects", padre: "/en/business-and-mining.html#crew" },
  "en/film-production-logistics.html": { nombre: "Film productions", padre: "/en/business-and-mining.html#crew" },
  "en/ground-transport-for-tour-operators.html": { nombre: "For tour operators and hotels", padre: "/en/tours-and-transfers.html" },
  "en/holy-week-salta-jujuy.html": { nombre: "Holy Week", padre: "/en/tours-and-transfers.html" },
  "en/international-trips.html": { nombre: "International trips", padre: "/en/tours-and-transfers.html" },
  "en/jujuy-utmb-trail-race-transfers.html": { nombre: "Jujuy trail race", padre: "/en/tours-and-transfers.html" },
  "en/minibus-with-driver-salta.html": { nombre: "Minibus with driver by the day", padre: "/en/tours-and-transfers.html" },
  "en/mining-logistics.html": { nombre: "Mining logistics", padre: "/en/business-and-mining.html#crew" },
  "en/personnel-transport.html": { nombre: "Crew transport", padre: "/en/business-and-mining.html#crew" },
  "en/privacy.html": { nombre: "Privacy" },
  "en/refrigerated-freight.html": { nombre: "Refrigerated freight", padre: "/en/business-and-mining.html#freight" },
  "en/salinas-grandes-from-salta.html": { nombre: "Salinas Grandes from Salta", padre: "/en/tours-and-transfers.html" },
  "en/salta-airport-transfer.html": { nombre: "Salta airport transfer", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-cachi-transfer.html": { nombre: "Salta to Cachi and Ruta 40", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-cafayate-transfer.html": { nombre: "Salta to Cafayate", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-jujuy-transfer.html": { nombre: "Salta to Jujuy transfer", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-purmamarca-tilcara-humahuaca.html": { nombre: "Salta to Purmamarca, Tilcara and Humahuaca", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-san-antonio-de-los-cobres.html": { nombre: "Salta to San Antonio de los Cobres", padre: "/en/tours-and-transfers.html" },
  "en/salta-to-san-pedro-de-atacama.html": { nombre: "Salta to San Pedro de Atacama", padre: "/en/international-trips.html" },
  "en/salta-to-uyuni.html": { nombre: "Salta to Uyuni", padre: "/en/international-trips.html" },
  "en/san-pedro-de-atacama-to-salta.html": { nombre: "San Pedro de Atacama to Salta", padre: "/en/international-trips.html" },
  "en/tours-and-transfers.html": { nombre: "Tours and transfers" },
  "en/train-to-the-clouds-transfer.html": { nombre: "Tren a las Nubes", padre: "/en/tours-and-transfers.html" },
  "en/transfer-carnival-quebrada-de-humahuaca.html": { nombre: "Quebrada carnival", padre: "/en/tours-and-transfers.html" },
  "en/uyuni-to-salta.html": { nombre: "Uyuni to Salta", padre: "/en/international-trips.html" },
  "en/warehouse.html": { nombre: "Warehouse & cold room", padre: "/en/business-and-mining.html#freight" },
  "en/wedding-transportation.html": { nombre: "Wedding transportation" },
  "pt/passeios-e-traslados.html": { nombre: "Passeios e traslados" },
  "pt/privacidade.html": { nombre: "Privacidade" },
  "pt/salinas-grandes-saindo-de-salta.html": { nombre: "Salinas Grandes saindo de Salta", padre: "/pt/passeios-e-traslados.html" },
  "pt/traslado-salta-cafayate.html": { nombre: "Salta – Cafayate", padre: "/pt/passeios-e-traslados.html" },
  "pt/traslado-salta-purmamarca-tilcara-humahuaca.html": { nombre: "Salta a Purmamarca, Tilcara e Humahuaca", padre: "/pt/passeios-e-traslados.html" },
  "pt/traslado-salta-san-pedro-de-atacama.html": { nombre: "Salta – San Pedro de Atacama", padre: "/viajes-internacionales.html" },
  "pt/traslado-salta-uyuni.html": { nombre: "Salta – Uyuni", padre: "/viajes-internacionales.html" },
};
