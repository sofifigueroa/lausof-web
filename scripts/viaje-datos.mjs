/* =============================================================================
   DATOS DEL VIAJE, por página (los escribe scripts/viaje.mjs en el bloque
   GENERADO:VIAJE). Ronda 5 de lausof.com, 08/11/2026.

   Cada fila lleva `fuente`: frases exactas del texto visible de la misma
   página que la sostienen. El modo comprobar de viaje.mjs y tests/viaje.test.js revisan que la
   página las siga diciendo; si una cambia, se cambia el dato o la fuente.
   Reglas (rondas-2026-11-07/BRIEF.md): sin precios ni «desde», sin
   cantidades de flota, sin plazos de respuesta; cada página en su idioma y su
   registro (usted o vos); `incluye` dice sólo lo que la página dice que
   incluye el servicio. El mapa es un enlace de Google Maps (recorrido u
   origen) con lugares que la página nombra.
   ============================================================================= */

export const VIAJES = {
  "agencias-y-hoteles.html": {
    "filas": {
      "duracion": {
        "valor": "Traslados, excursiones de día o los días del programa, con la misma unidad",
        "fuente": [
          "La unidad y el chofer a disposición del grupo durante el día o los días del programa",
          "En un programa de varios días, la misma unidad sigue con el grupo."
        ]
      },
      "salida": {
        "valor": "En el aeropuerto de Salta o en el hotel, con el cartel de su agencia o de su hotel",
        "fuente": [
          "Recepción en el aeropuerto Martín Miguel de Güemes y traslado al hotel",
          "El chofer recibe al grupo con el cartel de su agencia o de su hotel"
        ]
      },
      "incluye": {
        "valor": "Unidad, chofer y los horarios de su programa; el chofer espera al grupo en cada parada",
        "fuente": [
          "unidad, chofer y los horarios de su programa",
          "El chofer espera al grupo en cada parada del programa"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4; para grupos más grandes coordinamos más de una unidad"
        ]
      }
    },
    "mapa": null
  },
  "alquiler-4x4.html": {
    "filas": {
      "salida": {
        "valor": "En Salta, en el lugar que acordemos",
        "fuente": [
          "Los viajes con chofer salen de Salta, del lugar que acordemos."
        ]
      },
      "incluye": {
        "valor": "Chofer que conoce el ripio, la altura y los pasos de frontera; mantenimiento en taller propio y GPS",
        "fuente": [
          "la camioneta va siempre con uno de nuestros choferes, que conoce el ripio, la altura y los pasos de frontera",
          "Preventivo y correctivo en nuestro propio taller, con mecánicos propios.",
          "GPS en las unidades en servicio, durante todo el alquiler."
        ]
      },
      "unidades": {
        "valor": "Camionetas 4x4 preparadas para ripio y altura",
        "fuente": [
          "Camionetas 4x4 preparadas para ripio y altura"
        ]
      }
    },
    "mapa": null
  },
  "alquiler-combi-con-chofer-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Por día o por varios días; el horario de cada día se acuerda al cotizar",
        "fuente": [
          "Alquiler de combi con chofer profesional por día o por varios días",
          "Lo acordamos al cotizar, con el horario de cada día, y queda escrito en la cotización."
        ]
      },
      "salida": {
        "valor": "A la hora que el grupo elige, en el punto que indique al cotizar o en el hall de arribos",
        "fuente": [
          "salen a la hora que el grupo elige",
          "Desde dónde salen, por dónde quieren ir y si hay noches fuera de Salta.",
          "Empiece el día en el hall de arribos y salga directo de la ciudad."
        ]
      },
      "incluye": {
        "valor": "La unidad y el chofer con el grupo; el chofer espera en cada parada del recorrido acordado",
        "fuente": [
          "la unidad y el chofer quedan con el grupo durante el día o los días contratados",
          "esperan en cada parada y siguen el recorrido que se acordó"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional",
          "Grupos más grandes: coordinamos más de una unidad para el mismo programa"
        ]
      }
    },
    "mapa": null
  },
  "charter-recitales.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta la misma noche; unas 4 h de manejo por trayecto a Tucumán y 1 h 30 a Jujuy",
        "fuente": [
          "Ida y vuelta la misma noche",
          "Alrededor de 4 horas de manejo por trayecto",
          "Alrededor de 1 hora y media de manejo por trayecto"
        ]
      },
      "distancia": {
        "valor": "Unos 310 km a San Miguel de Tucumán; entre 99 y 115 km a San Salvador de Jujuy",
        "fuente": [
          "Unos 310 km por la RN 9 y la RN 34",
          "Entre 99 y 115 km según el camino"
        ]
      },
      "salida": {
        "valor": "Salta, en el punto y horario que acordamos con tu grupo según la hora del evento",
        "fuente": [
          "Tu grupo sale de Salta en una combi de 19+1 plazas",
          "Acordamos punto y horario de salida según la hora del evento"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, la combi completa para tu grupo, la espera durante el show y la vuelta la misma noche",
        "fuente": [
          "con chofer profesional, el chofer espera durante el show y vuelven todos juntos la misma noche",
          "reservan la combi completa"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas, habilitada por CNRT para viajes entre provincias",
        "fuente": [
          "Combis de 19+1 plazas con chofer profesional",
          "Unidad habilitada por CNRT para viajes entre provincias"
        ]
      }
    },
    "mapa": null
  },
  "clubes-deportivos.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta el mismo día, o con noche incluida para torneos de fin de semana",
        "fuente": [
          "la combi lleva al equipo, espera el partido y los trae de vuelta en el día",
          "Para torneos de fin de semana o canchas lejanas: el chofer y la unidad quedan a disposición de la delegación."
        ]
      },
      "salida": {
        "valor": "En el club: la combi busca al equipo y lo deja en el club",
        "fuente": [
          "La combi busca al equipo en el club y lo deja en el club"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, seguro de pasajeros, lugar para bolsos y utilería, y espera del partido",
        "fuente": [
          "Cada persona que sube a la combi viaja cubierta por el seguro de pasajeros",
          "con lugar para bolsos y utilería",
          "el chofer espera el partido y vuelven en el día"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas",
        "fuente": [
          "Jugadores, cuerpo técnico y delegados en combis de 19+1 plazas",
          "Si viaja más de un plantel, sumamos unidades"
        ]
      }
    },
    "mapa": null
  },
  "feriados-fines-de-semana-largos.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta, o la combi con chofer a disposición durante los días que el grupo esté afuera",
        "fuente": [
          "por el viaje de ida y vuelta o con la combi con chofer a disposición durante los días que el grupo esté afuera"
        ]
      },
      "salida": {
        "valor": "Salta, en el punto que indique el grupo",
        "fuente": [
          "Los viajes que salen de Salta en un fin de semana largo",
          "cuántos viajan y desde dónde salen"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, la combi para el grupo y, si se elige, la unidad a disposición para las salidas de cada día",
        "fuente": [
          "La combi de 19+1 plazas va con chofer profesional",
          "la unidad y el chofer quedan a disposición del grupo y hacen las salidas de cada día desde el alojamiento"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas",
        "fuente": [
          "La combi de 19+1 plazas va con chofer profesional",
          "cotizamos más de una unidad para el mismo viaje"
        ]
      }
    },
    "mapa": null
  },
  "peregrinaciones-eventos.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta en el día o varios días; la combi queda con el grupo lo que dure la salida",
        "fuente": [
          "Ida y vuelta en el día, o un viaje de varios días: la combi queda con el grupo lo que dure la salida."
        ]
      },
      "salida": {
        "valor": "En los puntos de subida que armamos juntos antes de salir",
        "fuente": [
          "Armamos juntos los horarios, las paradas y los puntos de subida antes de salir."
        ]
      },
      "incluye": {
        "valor": "Chofer profesional que acompaña los tiempos del grupo: esperas, paradas en el camino y regreso",
        "fuente": [
          "Combis de 19+1 plazas con chofer profesional para que tu grupo viaje junto",
          "El chofer acompaña los tiempos del grupo: las esperas, las paradas en el camino y el regreso sin apuro."
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas",
        "fuente": [
          "Combis de 19+1 plazas. ¿Son más? Coordinamos más de una unidad para que nadie viaje separado."
        ]
      }
    },
    "mapa": null
  },
  "salinas-grandes-desde-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Unas 4 h 10 de manejo solo ida, sin paradas; ida y vuelta, más de ocho horas",
        "fuente": [
          "Unos 255 km y 4 h 10 solo ida, sin paradas.",
          "ida y vuelta son unos 510 km y más de ocho horas de manejo, sin contar las paradas"
        ]
      },
      "distancia": {
        "valor": "Unos 255 km solo ida, por Purmamarca y la Cuesta de Lipán, todo asfaltado",
        "fuente": [
          "son unos 255 km y 4 h 10 de manejo solo ida, por Purmamarca y la Cuesta de Lipán",
          "Es asfalto todo el camino."
        ]
      },
      "salida": {
        "valor": "En su hotel de Salta o en el aeropuerto",
        "fuente": [
          "Búsqueda en el hotel en Salta o en el aeropuerto"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, aire acondicionado y paradas a elección: Purmamarca, la Cuesta de Lipán y el salar",
        "fuente": [
          "Una combi privada de 19+1 plazas con chofer profesional",
          "Aire acondicionado en todas las unidades",
          "Paradas a elección del grupo: Purmamarca, los miradores de la Cuesta de Lipán y el salar"
        ]
      },
      "unidades": {
        "valor": "Combi privada de 19+1 plazas o camioneta 4x4, preparadas para la altura",
        "fuente": [
          "para más de 19 pasajeros, más de una unidad",
          "O una camioneta 4x4, según el grupo; unidades preparadas para la altura",
          "Una combi privada de 19+1 plazas con chofer profesional"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Salinas Grandes, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina"
      ]
    }
  },
  "semana-santa-salta-jujuy.html": {
    "filas": {
      "duracion": {
        "valor": "Por excursión o traslado, o la unidad con el grupo los días del fin de semana largo",
        "fuente": [
          "Excursiones, traslados y unidades para agencias",
          "La unidad queda con el grupo los días del fin de semana largo"
        ]
      },
      "salida": {
        "valor": "La ciudad de Salta, su hotel o el aeropuerto de Salta, según el plan del grupo",
        "fuente": [
          "La ciudad de Salta, punto de partida de los circuitos",
          "Traslados entre el aeropuerto de Salta y el hotel"
        ]
      },
      "incluye": {
        "valor": "Chofer y la unidad para su grupo; con varios días, el chofer los lleva de un pueblo a otro según el plan",
        "fuente": [
          "en combi o 4x4 para su grupo",
          "el chofer los lleva de un pueblo a otro según el plan"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas, o camioneta 4x4 para grupos chicos o caminos de ripio",
        "fuente": [
          "La combi lleva 19 pasajeros más el chofer",
          "Para grupos chicos o caminos de ripio usamos camionetas 4x4"
        ]
      }
    },
    "mapa": null
  },
  "traslado-aeropuerto-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Alrededor de 20 minutos hasta los hoteles del centro, sin tránsito; más en las horas pico",
        "fuente": [
          "alrededor de 20 minutos sin tránsito, y más en las horas pico"
        ]
      },
      "distancia": {
        "valor": "Unos 11 a 13 km hasta los hoteles del centro, según el hotel",
        "fuente": [
          "Unos 11 a 13 km hasta los hoteles del centro, según el hotel"
        ]
      },
      "salida": {
        "valor": "En el aeropuerto de Salta, en el punto que le confirmamos por WhatsApp; o en su hotel, para el vuelo de salida",
        "fuente": [
          "Lo esperamos en el aeropuerto de Salta y lo llevamos a su hotel",
          "el punto de encuentro en el aeropuerto se lo confirmamos por WhatsApp antes del viaje",
          "lo buscamos en el hotel y lo dejamos en el aeropuerto"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional y la unidad para el grupo y su equipaje, con la hora de búsqueda según el vuelo",
        "fuente": [
          "con chofer, para el grupo y su equipaje, con la hora de búsqueda según el vuelo",
          "Combis de 19+1 plazas y camionetas 4x4 con chofer profesional"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4 con chofer profesional",
          "Grupos más grandes: coordinamos más de una unidad para el mismo vuelo"
        ]
      }
    },
    "mapa": {
      "tipo": "lugar",
      "consulta": "Aeropuerto Internacional Martín Miguel de Güemes, Salta"
    }
  },
  "traslado-carnaval-quebrada-de-humahuaca.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta cada noche o la unidad a disposición; de 2 h 15 a 3 h según el pueblo, tiempo aproximado",
        "fuente": [
          "o con la unidad a disposición durante los días de carnaval",
          "179 km por la RN 9 y la RN 52, unas 2 h 15 de manejo",
          "239 km por la RN 9, unas 3 h de manejo"
        ]
      },
      "distancia": {
        "valor": "Purmamarca 179 km, Tilcara 197 km y Humahuaca 239 km, por la RN 9",
        "fuente": [
          "179 km por la RN 9 y la RN 52, unas 2 h 15 de manejo",
          "197 km por la RN 9, unas 2 h 30 de manejo",
          "239 km por la RN 9, unas 3 h de manejo"
        ]
      },
      "salida": {
        "valor": "Salta, en el punto acordado por WhatsApp, o en el aeropuerto si el grupo llega en avión",
        "fuente": [
          "El grupo sale de Salta, el chofer espera en el pueblo",
          "la combi lo busca en el aeropuerto",
          "dejamos escritos en el chat el punto y la hora de salida y de vuelta"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, la combi para el grupo, la espera en el pueblo y el equipaje de varios días",
        "fuente": [
          "Una combi de 19+1 plazas con chofer profesional lleva al grupo",
          "el chofer espera en el pueblo y la vuelta arranca a la hora acordada",
          "El equipaje de varios días viaja en la misma combi"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas",
        "fuente": [
          "Una combi de 19+1 plazas con chofer profesional",
          "cotizamos más de una unidad para el mismo viaje"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Humahuaca, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Tilcara, Jujuy, Argentina"
      ]
    }
  },
  "traslado-salta-cachi.html": {
    "filas": {
      "duracion": {
        "valor": "Unas 2 h 30 de manejo sin paradas; con la Cuesta y las paradas, la ida lleva más",
        "fuente": [
          "Unos 157 km y alrededor de 2 h 30 sin paradas. Con la Cuesta y las paradas, la ida lleva más."
        ]
      },
      "distancia": {
        "valor": "Unos 157 km, con unos 15 km de ripio en la Cuesta del Obispo",
        "fuente": [
          "De Salta a Cachi son unos 157 km",
          "En la Cuesta quedan unos 15 km de ripio."
        ]
      },
      "salida": {
        "valor": "En su hotel de Salta o en el aeropuerto",
        "fuente": [
          "Desde su hotel en Salta o el aeropuerto hasta su alojamiento en Cachi"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, la unidad elegida según la época y el camino, y paradas en la Cuesta y el Parque Nacional",
        "fuente": [
          "Combis de 19+1 plazas con chofer profesional",
          "elegida según la época y el estado del camino",
          "con paradas en la Cuesta y en el Parque Nacional"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas preparadas para ripio y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas con chofer profesional, preparadas para ripio",
          "Camionetas 4x4 para grupos chicos o cuando el camino lo pide",
          "Grupos más grandes: coordinamos más de una unidad"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cachi, Salta, Argentina",
      "paradas": []
    }
  },
  "traslado-salta-cafayate.html": {
    "filas": {
      "duracion": {
        "valor": "Unas 2 h 30 de manejo sin paradas; con paradas en la quebrada, buena parte de la mañana",
        "fuente": [
          "alrededor de 2 h 30 de manejo sin paradas",
          "Con paradas en la quebrada, la ida lleva buena parte de la mañana"
        ]
      },
      "distancia": {
        "valor": "Unos 190 km por la Ruta Nacional 68, todo asfaltado",
        "fuente": [
          "son unos 190 km por la Ruta Nacional 68, todo asfaltado"
        ]
      },
      "salida": {
        "valor": "En su hotel, la terminal o el aeropuerto de Salta",
        "fuente": [
          "Del hotel, la terminal o el aeropuerto de Salta hasta su alojamiento en Cafayate"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional que espera al grupo, paradas en la quebrada y el traslado entre bodegas",
        "fuente": [
          "con chofer profesional, que espera al grupo y lo trae de vuelta",
          "El chofer se detiene donde el grupo quiera",
          "Nosotros hacemos el traslado entre una y otra"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4 con chofer",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4 con chofer profesional",
          "coordinamos más de una unidad para que viajen juntos"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cafayate, Salta, Argentina",
      "paradas": []
    }
  },
  "traslado-salta-jujuy.html": {
    "filas": {
      "duracion": {
        "valor": "Alrededor de 1 h 35 por la autopista o unas 2 h por la cornisa, sin paradas",
        "fuente": [
          "Unos 120 km por la autopista, alrededor de 1 h 35 (aproximado). Por la cornisa, unos 96 km y unas 2 h."
        ]
      },
      "distancia": {
        "valor": "Unos 120 km por la autopista; unos 96 km por la cornisa",
        "fuente": [
          "Unos 120 km por la autopista, alrededor de 1 h 35 (aproximado). Por la cornisa, unos 96 km y unas 2 h."
        ]
      },
      "salida": {
        "valor": "Puerta a puerta en Salta, o en los aeropuertos de Salta y de Jujuy",
        "fuente": [
          "puerta a puerta, para el grupo y su equipaje; también desde o hacia los aeropuertos de Salta y de Jujuy"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional y viaje puerta a puerta para el grupo y su equipaje",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4 con chofer profesional",
          "puerta a puerta, para el grupo y su equipaje"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4 con chofer",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4 con chofer profesional",
          "Coordinamos más de una unidad para el mismo viaje"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Salvador de Jujuy, Jujuy, Argentina",
      "paradas": []
    }
  },
  "traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "filas": {
      "duracion": {
        "valor": "Unas 2 h 50 hasta Purmamarca y 3 h 45 hasta Humahuaca, solo ida y sin paradas",
        "fuente": [
          "Purmamarca: unos 188 km y 2 h 50. Humahuaca: unos 250 km y 3 h 45. Solo ida y sin paradas."
        ]
      },
      "distancia": {
        "valor": "Unos 188 km hasta Purmamarca y unos 250 km hasta Humahuaca, todo asfaltado",
        "fuente": [
          "Purmamarca: unos 188 km y 2 h 50. Humahuaca: unos 250 km y 3 h 45.",
          "hacia el norte por la Quebrada. Asfalto."
        ]
      },
      "salida": {
        "valor": "En su hotel de Salta o en el aeropuerto",
        "fuente": [
          "Búsqueda en el hotel en Salta o en el aeropuerto"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, aire acondicionado y paradas a elección del grupo a lo largo de la ruta",
        "fuente": [
          "Una combi privada de 19+1 plazas con chofer profesional",
          "Aire acondicionado en todas las unidades",
          "Paradas a elección del grupo a lo largo de la ruta"
        ]
      },
      "unidades": {
        "valor": "Combi privada de 19+1 plazas; 4x4 o combi para ripio con el Hornocal",
        "fuente": [
          "para más de 19 pasajeros, más de una unidad",
          "Camioneta 4x4 o combi preparada para ripio cuando el plan incluye el Hornocal",
          "Una combi privada de 19+1 plazas con chofer profesional"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Humahuaca, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Tilcara, Jujuy, Argentina"
      ]
    }
  },
  "traslado-salta-san-antonio-de-los-cobres.html": {
    "filas": {
      "duracion": {
        "valor": "Unas 3 h de manejo sin paradas; como se sube con paradas, la ida lleva más",
        "fuente": [
          "Unos 164 km y alrededor de 3 horas de manejo sin paradas.",
          "Como subimos con paradas, la ida lleva más."
        ]
      },
      "distancia": {
        "valor": "Unos 164 km por la Ruta Nacional 51, todo asfaltado; el viaducto La Polvorilla, unos 16 a 18 km más",
        "fuente": [
          "son unos 164 km por la Ruta Nacional 51 y la Quebrada del Toro, todo asfaltado",
          "El viaducto La Polvorilla queda unos 16 a 18 km más adelante."
        ]
      },
      "salida": {
        "valor": "En la ciudad de Salta, a la hora que elige el grupo",
        "fuente": [
          "Son unos 164 km desde la ciudad de Salta",
          "el grupo elige la hora de salida y dónde parar en el camino"
        ]
      },
      "incluye": {
        "valor": "Chofer, paradas para que el cuerpo se acomode a la altura y teléfono satelital a bordo",
        "fuente": [
          "Combi o camioneta 4x4 con chofer, con paradas para que el cuerpo se acomode a la altura",
          "Teléfono satelital a bordo en los servicios de altura"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas o camionetas 4x4, según el grupo y el camino",
        "fuente": [
          "Combis de 19+1 plazas o camionetas 4x4, según el grupo y el camino"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Antonio de los Cobres, Salta, Argentina",
      "paradas": []
    }
  },
  "traslado-salta-san-pedro-de-atacama.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 8 horas de manejo sin paradas; con la frontera y las paradas, un día completo",
        "fuente": [
          "El manejo sin paradas ronda las 8 horas; con la frontera y las paradas, es un viaje de día completo."
        ]
      },
      "distancia": {
        "valor": "Unos 590 km, todo asfaltado, por el Paso de Jama",
        "fuente": [
          "son unos 590 km por la ruta 9, la ruta 52 y el Paso de Jama, todo asfaltado"
        ]
      },
      "salida": {
        "valor": "Su hotel en Salta o el aeropuerto, hasta su alojamiento en San Pedro de Atacama",
        "fuente": [
          "desde su hotel en Salta o el aeropuerto hasta su alojamiento en San Pedro"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, permiso internacional de la unidad, seguro con extensión a Chile y las paradas del grupo",
        "fuente": [
          "Tramitamos el permiso de viaje internacional de la unidad",
          "La unidad viaja con su seguro con extensión a Chile.",
          "Es un traslado privado: las paradas las elige el grupo."
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional",
          "Grupos más grandes: más de una unidad"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Pedro de Atacama, Chile",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Salinas Grandes, Jujuy, Argentina",
        "Paso de Jama, Jujuy, Argentina"
      ]
    }
  },
  "traslado-salta-uyuni.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 9 horas y media de manejo sin paradas, más la frontera; recomendado en dos días",
        "fuente": [
          "El manejo sin paradas ronda las 9 horas y media, más la frontera; lo recomendamos en dos días."
        ]
      },
      "distancia": {
        "valor": "Unos 690 km, por la Quebrada de Humahuaca, La Quiaca–Villazón y Tupiza",
        "fuente": [
          "De Salta a Uyuni son unos 690 km",
          "por la Quebrada de Humahuaca, el paso La Quiaca–Villazón y Tupiza"
        ]
      },
      "salida": {
        "valor": "Su hotel en Salta, hasta su alojamiento en Uyuni",
        "fuente": [
          "desde su hotel en Salta hasta su alojamiento en Uyuni"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, permiso internacional de la unidad, seguro con extensión a Bolivia y las paradas del grupo",
        "fuente": [
          "Tramitamos el permiso de viaje internacional de la unidad",
          "La unidad viaja con su seguro con extensión a Bolivia.",
          "Paradas: Purmamarca, Tilcara, Humahuaca o Tupiza, las que elija el grupo."
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Uyuni, Bolivia",
      "paradas": [
        "Humahuaca, Jujuy, Argentina",
        "La Quiaca, Jujuy, Argentina",
        "Tupiza, Bolivia"
      ]
    }
  },
  "traslado-san-pedro-de-atacama-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 8 horas de manejo sin paradas; con la frontera y alguna parada, un día completo",
        "fuente": [
          "El manejo sin paradas ronda las 8 horas; con el control de frontera y alguna parada, es un viaje de día completo."
        ]
      },
      "distancia": {
        "valor": "Unos 590 km, todo asfaltado, por el Paso de Jama",
        "fuente": [
          "son unos 590 km por la ruta 27 CH, el Paso de Jama y la ruta 52, todo asfaltado"
        ]
      },
      "salida": {
        "valor": "Su alojamiento en San Pedro de Atacama u otro punto del pueblo, el día y la hora acordados",
        "fuente": [
          "acordamos con anticipación el día, la hora y el lugar: su alojamiento en San Pedro de Atacama u otro punto del pueblo"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, permiso internacional de la unidad, seguro con extensión a Chile y las paradas del grupo",
        "fuente": [
          "Tramitamos el permiso de viaje internacional de la unidad",
          "La unidad viaja con su seguro con extensión a Chile.",
          "Es un traslado privado: las paradas las elige el grupo."
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional",
          "Grupos más grandes: más de una unidad"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "San Pedro de Atacama, Chile",
      "destino": "Salta, Argentina",
      "paradas": [
        "Paso de Jama, Jujuy, Argentina",
        "Salinas Grandes, Jujuy, Argentina",
        "Purmamarca, Jujuy, Argentina"
      ]
    }
  },
  "traslado-serenata-a-cafayate.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta en la misma noche, o la unidad a disposición si el grupo se queda; unas 2 h 20 de manejo, tiempo aproximado",
        "fuente": [
          "Ida y vuelta en la misma noche, o la unidad a disposición",
          "si el grupo se queda en Cafayate",
          "Unas 2 h 20 de manejo en auto"
        ]
      },
      "distancia": {
        "valor": "189 km por la RN 68 y la Quebrada de las Conchas",
        "fuente": [
          "189 km por la RN 68, pasando por Cerrillos"
        ]
      },
      "salida": {
        "valor": "Salta, en el punto que indique el grupo; a la vuelta, en uno o varios puntos acordados",
        "fuente": [
          "desde dónde salen en Salta",
          "La combi deja a cada pasajero en el punto acordado en Salta, o en varios puntos si el grupo lo pide al cotizar"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, la combi para el grupo y la espera en Cafayate durante el festival",
        "fuente": [
          "en una combi de 19+1 plazas con chofer profesional, el chofer espera en Cafayate durante el festival"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas",
        "fuente": [
          "en una combi de 19+1 plazas con chofer profesional",
          "Si el grupo es más grande, cotizamos más de una unidad"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cafayate, Salta, Argentina",
      "paradas": []
    }
  },
  "traslado-tren-a-las-nubes.html": {
    "filas": {
      "duracion": {
        "valor": "Ida y vuelta en el día: unas 2 h 50 sin paradas y entre 3 y 4 horas con paradas, tiempos aproximados",
        "fuente": [
          "volvemos a Salta el mismo día",
          "alrededor de 2 h 50 de manejo sin paradas",
          "conviene calcular entre 3 y 4 horas"
        ]
      },
      "distancia": {
        "valor": "Unos 164 km por la RN 51 hasta la estación de San Antonio de los Cobres",
        "fuente": [
          "hay unos 164 km por la RN 51"
        ]
      },
      "salida": {
        "valor": "En su alojamiento de Salta",
        "fuente": [
          "Pasamos por su alojamiento de Salta"
        ]
      },
      "incluye": {
        "valor": "Chofer, la unidad para su grupo, las paradas que elija y la espera mientras hace el recorrido en tren",
        "fuente": [
          "pero en una unidad para su grupo",
          "con las paradas que quiera hacer",
          "esperamos mientras usted hace el recorrido en tren"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas para grupos, o camioneta 4x4 para grupos chicos o caminos de ripio",
        "fuente": [
          "Para familias grandes, grupos de amigos o contingentes de agencia",
          "Para grupos chicos o si después del tren quieren seguir por caminos de ripio",
          "en combi o en camioneta 4x4 con chofer"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Antonio de los Cobres, Salta, Argentina",
      "paradas": [
        "Campo Quijano, Salta, Argentina",
        "Santa Rosa de Tastil, Salta, Argentina"
      ]
    }
  },
  "traslado-uyuni-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 9 horas y media de manejo sin paradas, más la frontera; recomendado en dos días",
        "fuente": [
          "El manejo sin paradas ronda las 9 horas y media, más la frontera; lo recomendamos en dos días."
        ]
      },
      "distancia": {
        "valor": "Unos 690 km, por Tupiza, el puente Villazón–La Quiaca y la Quebrada de Humahuaca",
        "fuente": [
          "De Uyuni a Salta son unos 690 km: unos 290 km de ruta de montaña asfaltada por Atocha y Tupiza hasta Villazón",
          "Puente internacional Villazón–La Quiaca",
          "por el puente internacional de La Quiaca y la Quebrada de Humahuaca"
        ]
      },
      "salida": {
        "valor": "Su alojamiento en Uyuni, Tupiza o Villazón, el día y la hora acordados",
        "fuente": [
          "acordamos con anticipación el día, la hora y el lugar: su alojamiento en Uyuni, Tupiza o Villazón"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, permiso internacional de la unidad, seguro con extensión a Bolivia, sin cambiar de vehículo",
        "fuente": [
          "Tramitamos el permiso de viaje internacional de la unidad",
          "La unidad viaja con su seguro con extensión a Bolivia.",
          "sin cambiar de vehículo y con las paradas que quiera el grupo"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Uyuni, Bolivia",
      "destino": "Salta, Argentina",
      "paradas": [
        "Tupiza, Bolivia",
        "La Quiaca, Jujuy, Argentina",
        "Humahuaca, Jujuy, Argentina"
      ]
    }
  },
  "traslados-casamientos.html": {
    "filas": {
      "duracion": {
        "valor": "La noche del casamiento: ida a la ceremonia y al salón, y una o más vueltas acordadas al reservar",
        "fuente": [
          "llevan a los invitados a la ceremonia y después al salón",
          "Se pueden armar varias vueltas: una más temprano para quienes se retiran antes y otra al cierre de la fiesta.",
          "El horario se acuerda al reservar."
        ]
      },
      "distancia": {
        "valor": "Fincas de los alrededores a unos 45 minutos; bodegas de Cafayate a unos 190 km de Salta",
        "fuente": [
          "fincas en San Lorenzo, La Caldera y Chicoana, a unos 45 minutos",
          "Para un casamiento en una bodega de Cafayate, a unos 190 km de Salta"
        ]
      },
      "salida": {
        "valor": "En los hoteles o puntos de encuentro que ustedes definan; también en el aeropuerto",
        "fuente": [
          "Las combis pasan por los hoteles o puntos de encuentro que ustedes definan",
          "Traslados desde el aeropuerto Martín Miguel de Güemes hasta los hoteles"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, del hotel a la ceremonia, a la fiesta y de vuelta, con el mismo chofer",
        "fuente": [
          "Llevamos a los invitados del hotel a la ceremonia, de la ceremonia a la fiesta y de vuelta al hotel",
          "El grupo viaja junto, con el mismo chofer de ida y de vuelta."
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas",
        "fuente": [
          "Combis de 19+1 plazas. Si los invitados son más, coordinamos más de una unidad con los mismos horarios."
        ]
      }
    },
    "mapa": null
  },
  "traslados-fiesta-del-milagro.html": {
    "filas": {
      "duracion": {
        "valor": "Regreso al pueblo, vehículo de apoyo por tramos o ida y vuelta el día de la procesión",
        "fuente": [
          "regreso, vehículo de apoyo o ida y vuelta el día de la procesión",
          "Una combi que acompaña la peregrinación por tramos"
        ]
      },
      "salida": {
        "valor": "La localidad del grupo o, en Salta, un punto de encuentro acordado fuera de la zona de cortes",
        "fuente": [
          "podemos buscar al grupo en su ciudad o llevarlo de vuelta",
          "acordamos con el grupo un punto de bajada y de encuentro fuera del perímetro de cortes"
        ]
      },
      "incluye": {
        "valor": "Chofer y la combi para su grupo; como apoyo, lleva bolsos, agua y abrigo y sube a quien necesite descansar",
        "fuente": [
          "Ponemos combis de 19+1 plazas con chofer para que su grupo",
          "lleva bolsos, agua y abrigo, y sube a quien necesite descansar"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas",
        "fuente": [
          "Las combis son de 19+1 plazas",
          "Para grupos más numerosos coordinamos más de una unidad, con el mismo punto de encuentro"
        ]
      }
    },
    "mapa": null
  },
  "traslados-trail-jujuy-utmb.html": {
    "filas": {
      "duracion": {
        "valor": "Los traslados de la semana de carrera; unas 2 h 15 de Salta a Purmamarca y 20 minutos de Purmamarca a Tilcara",
        "fuente": [
          "Los traslados de toda la semana de carrera",
          "alrededor de 2 h 15 de manejo",
          "unos 20 minutos de manejo"
        ]
      },
      "distancia": {
        "valor": "Unos 179 km de Salta a Purmamarca; 64 km de San Salvador de Jujuy a Purmamarca",
        "fuente": [
          "unos 179 km por la RN 9 y la RN 52",
          "de la capital a Purmamarca hay 64 km"
        ]
      },
      "salida": {
        "valor": "El aeropuerto de Salta o de Jujuy, o su alojamiento en la Quebrada",
        "fuente": [
          "búsqueda en el aeropuerto de Salta o de Jujuy",
          "el lugar donde se aloja el grupo"
        ]
      },
      "incluye": {
        "valor": "Chofer, la combi para su equipo y acompañantes, lugar para bolsos y equipo, y el regreso de la llegada al alojamiento",
        "fuente": [
          "Ponemos combis de 19+1 plazas con chofer para su equipo y sus acompañantes",
          "Con lugar para bolsos y equipo de montaña",
          "Del arco de llegada al alojamiento"
        ]
      },
      "unidades": {
        "valor": "Combi de 19+1 plazas; camioneta 4x4 para equipaje o caminos de ripio",
        "fuente": [
          "Combis de 19+1 plazas con chofer, en la Quebrada de Humahuaca",
          "Camionetas 4x4 para equipaje o caminos de ripio"
        ]
      }
    },
    "mapa": null
  },
  "viajes-de-estudio.html": {
    "filas": {
      "salida": {
        "valor": "En los horarios y puntos de salida que coordinamos con el colegio al confirmar el viaje",
        "fuente": [
          "Confirmado el viaje, la fecha queda reservada para el colegio y coordinamos horarios y puntos de salida."
        ]
      },
      "incluye": {
        "valor": "Chofer profesional que conoce el camino, unidad habilitada, seguro de pasajeros y recorrido por GPS",
        "fuente": [
          "Chofer profesional que conoce el camino, unidad habilitada y el recorrido registrado por GPS.",
          "Seguro de pasajeros vigente y choferes profesionales"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas",
        "fuente": [
          "Las combis son de 19+1 plazas.",
          "la cantidad de unidades que necesita el contingente"
        ]
      }
    },
    "mapa": null
  },
  "viajes-internacionales.html": {
    "filas": {
      "duracion": {
        "valor": "San Pedro de Atacama: un día completo de viaje; Uyuni: recomendado en dos días",
        "fuente": [
          "un día completo de viaje, todo asfaltado",
          "lo recomendamos en dos días"
        ]
      },
      "distancia": {
        "valor": "Unos 590 km a San Pedro de Atacama y unos 690 km a Uyuni",
        "fuente": [
          "Unos 590 km por el Paso de Jama",
          "Unos 690 km por la Quebrada de Humahuaca, La Quiaca y Tupiza"
        ]
      },
      "salida": {
        "valor": "Salta, en el lugar que nos indique; también lo buscamos en Chile o Bolivia y lo traemos a Salta",
        "fuente": [
          "De Salta a Chile, Bolivia y más allá, con chofer.",
          "dónde los buscamos y si es solo ida o ida y vuelta",
          "También lo buscamos allá y lo traemos a Salta"
        ]
      },
      "incluye": {
        "valor": "Chofer profesional, el permiso de viaje internacional de la unidad y el seguro con extensión al país de destino",
        "fuente": [
          "el permiso de viaje internacional de la unidad lo tramitamos nosotros",
          "Seguro con extensión al país de destino.",
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional"
        ]
      },
      "unidades": {
        "valor": "Combis de 19+1 plazas y camionetas 4x4",
        "fuente": [
          "Combis de 19+1 plazas y camionetas 4x4, con chofer profesional"
        ]
      }
    },
    "mapa": null
  },
  "en/4x4-rental.html": {
    "filas": {
      "salida": {
        "valor": "In Salta, from the place we agree",
        "fuente": [
          "Trips with a driver start in Salta, from the place we agree."
        ]
      },
      "incluye": {
        "valor": "One of our drivers, who knows gravel roads, altitude and border passes; maintenance and GPS",
        "fuente": [
          "the pickup always comes with one of our drivers, who knows the gravel roads, the altitude and the border passes",
          "4x4 pickups maintained in our own workshop",
          "GPS on the units in service, for the length of the rental."
        ]
      },
      "unidades": {
        "valor": "4x4 pickups prepared for gravel roads and altitude",
        "fuente": [
          "4x4 pickups prepared for gravel roads and altitude"
        ]
      }
    },
    "mapa": null
  },
  "en/ground-transport-for-tour-operators.html": {
    "filas": {
      "duracion": {
        "valor": "Airport transfers, day trips or the days of your program, with the same vehicle",
        "fuente": [
          "The vehicle and the driver stay with the group for the day or the days of the program.",
          "On a multi-day program, the same vehicle stays with the group."
        ]
      },
      "salida": {
        "valor": "At Salta airport or the hotel, with your agency’s or your hotel’s name sign",
        "fuente": [
          "Meet and greet at Martín Miguel de Güemes airport (SLA) and the ride to the hotel",
          "The driver meets the group with your agency’s or your hotel’s name sign"
        ]
      },
      "incluye": {
        "valor": "Vehicle and driver on your schedule; the driver waits for the group at every stop",
        "fuente": [
          "we provide the vehicle and the driver, and we keep to your schedule",
          "The driver waits for the group at every stop of the program."
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups; for larger groups we add vehicles to the same program"
        ]
      }
    },
    "mapa": null
  },
  "en/holy-week-salta-jujuy.html": {
    "filas": {
      "duracion": {
        "valor": "Day trips, transfers, or a vehicle that stays with your group over the long weekend",
        "fuente": [
          "Day trips, transfers and multi-day hire",
          "stays with your group over the long weekend"
        ]
      },
      "salida": {
        "valor": "The city of Salta, your hotel or Salta airport (SLA)",
        "fuente": [
          "The city of Salta, where most trips start",
          "Salta airport (SLA) to your hotel"
        ]
      },
      "incluye": {
        "valor": "A driver and a vehicle for your group only; on multi-day hire, the driver takes you from village to village",
        "fuente": [
          "in a vehicle for your group only",
          "the driver takes you from village to village on your plan"
        ]
      },
      "unidades": {
        "valor": "Minibus or 4x4",
        "fuente": [
          "The minibus or 4x4 stays with your group over the long weekend"
        ]
      }
    },
    "mapa": null
  },
  "en/international-trips.html": {
    "filas": {
      "duracion": {
        "valor": "San Pedro de Atacama: a full day on paved roads; Uyuni: best over two days",
        "fuente": [
          "a full day on paved roads",
          "La Quiaca and Tupiza, best over two days"
        ]
      },
      "distancia": {
        "valor": "About 590 km to San Pedro de Atacama and about 690 km to Uyuni",
        "fuente": [
          "About 590 km over the Jama Pass",
          "About 690 km via the Quebrada de Humahuaca"
        ]
      },
      "salida": {
        "valor": "In Salta, wherever you tell us; we also pick you up in Chile or Bolivia and drive you to Salta",
        "fuente": [
          "where we pick you up, one way or return",
          "We also pick you up there and drive you to Salta"
        ]
      },
      "incluye": {
        "valor": "Professional driver, the vehicle's international trip permit and insurance extended to the destination country",
        "fuente": [
          "we file the vehicle's international trip permit ourselves",
          "Insurance extended to the destination country.",
          "with a professional driver, one way or return"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver"
        ]
      }
    },
    "mapa": null
  },
  "en/jujuy-utmb-trail-race-transfers.html": {
    "filas": {
      "duracion": {
        "valor": "Every ride of race week; about 2 h 15 min from Salta to Purmamarca, 20 minutes from Purmamarca to Tilcara",
        "fuente": [
          "Every ride of race week",
          "on routes RN 9 and RN 52, roughly 2 h 15 min",
          "apart, about 20 minutes"
        ]
      },
      "distancia": {
        "valor": "About 179 km (111 miles) from Salta to Purmamarca; 64 km (40 miles) from Jujuy city",
        "fuente": [
          "From Salta to Purmamarca it is about 179 km (111 miles)",
          "from the city to Purmamarca it is 64 km (40 miles)"
        ]
      },
      "salida": {
        "valor": "Salta (SLA) or Jujuy (JUJ) airport, or your lodging in the Quebrada",
        "fuente": [
          "We meet the group at Salta or Jujuy airport",
          "where your group is staying"
        ]
      },
      "incluye": {
        "valor": "A driver, a minibus for your team and crew, room for duffels and race gear, and the ride back from the finish",
        "fuente": [
          "for runners, teams and support crews",
          "with room for duffels and race gear",
          "the ride back from the finish in Purmamarca"
        ]
      },
      "unidades": {
        "valor": "19-seat minibus; 4x4 pickup for extra luggage or gravel roads",
        "fuente": [
          "19-seat minibuses with a driver, in the Quebrada de Humahuaca",
          "4x4 pickups for extra luggage or gravel roads"
        ]
      }
    },
    "mapa": null
  },
  "en/minibus-with-driver-salta.html": {
    "filas": {
      "duracion": {
        "valor": "By the day or for several days; the schedule for each day is agreed in the quote",
        "fuente": [
          "by the day or for several days",
          "We agree on it when we price the trip, with the schedule for each day, and it is written into the quote."
        ]
      },
      "salida": {
        "valor": "Where you start, when the group wants, or at the arrivals hall of Salta airport",
        "fuente": [
          "they leave when the group wants",
          "Where you start, where you want to go",
          "Start the day at the arrivals hall and go straight out of town."
        ]
      },
      "incluye": {
        "valor": "Vehicle and driver stay with the group; the driver waits at every stop on the agreed route",
        "fuente": [
          "the vehicle and the driver stay with the group for the day or the days you book",
          "wait at every stop and follow the route agreed beforehand"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups, with a professional driver",
          "Larger groups: we coordinate additional vehicles for the same program"
        ]
      }
    },
    "mapa": null
  },
  "en/salinas-grandes-from-salta.html": {
    "filas": {
      "duracion": {
        "valor": "About 4 h 10 one way without stops; the round trip is more than eight hours of driving",
        "fuente": [
          "About 255 km and 4 h 10 one way, without stops.",
          "more than eight hours of driving for the round trip, before any stop"
        ]
      },
      "distancia": {
        "valor": "About 255 km (158 miles) one way via Purmamarca and the Cuesta de Lipán, paved the whole way",
        "fuente": [
          "about 255 km (158 miles) and 4 h 10 of driving one way, via Purmamarca and the Cuesta de Lipán",
          "It is paved the whole way."
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta or Salta airport",
        "fuente": [
          "Pickup at your hotel in Salta or at Salta airport"
        ]
      },
      "incluye": {
        "valor": "A professional driver, air conditioning, and stops of your choice: Purmamarca, the Cuesta de Lipán, the salt flat",
        "fuente": [
          "A private 19-seat minibus for the group, with a professional driver",
          "Air conditioning in every vehicle",
          "Stops chosen by the group: Purmamarca, the viewpoints of the Cuesta de Lipán, the salt flat"
        ]
      },
      "unidades": {
        "valor": "A private 19-seat minibus or a 4x4 pickup, prepared for altitude",
        "fuente": [
          "A private 19-seat minibus for the group",
          "Or a 4x4 pickup, chosen for the group; vehicles prepared for altitude",
          "larger groups travel in additional minibuses"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Salinas Grandes, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina"
      ]
    }
  },
  "en/salta-airport-transfer.html": {
    "filas": {
      "duracion": {
        "valor": "Around 20 minutes to the downtown hotels without traffic; longer at rush hour",
        "fuente": [
          "around 20 minutes without traffic, longer at rush hour"
        ]
      },
      "distancia": {
        "valor": "About 11 to 13 km to the downtown hotels, depending on the hotel",
        "fuente": [
          "About 11 to 13 km to the downtown hotels, depending on the hotel"
        ]
      },
      "salida": {
        "valor": "At Salta airport, at a meeting point we confirm by WhatsApp or email; or at your hotel for departures",
        "fuente": [
          "We meet you at Salta airport and drive you to your hotel",
          "we confirm the meeting point at the airport by WhatsApp or email before you fly",
          "we pick you up at the hotel and drop you at the airport"
        ]
      },
      "incluye": {
        "valor": "Professional driver and a vehicle for your group and its luggage, timed to your flight",
        "fuente": [
          "with a driver, for your group and its luggage, timed to your flight",
          "with a professional driver, for families, groups and travel agencies"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses with a professional driver",
          "4x4 pickups for small groups or when the trip continues on gravel",
          "Larger groups: we coordinate additional vehicles for the same flight"
        ]
      }
    },
    "mapa": {
      "tipo": "lugar",
      "consulta": "Aeropuerto Internacional Martín Miguel de Güemes, Salta"
    }
  },
  "en/salta-to-cachi-transfer.html": {
    "filas": {
      "duracion": {
        "valor": "About 2 h 30 of driving without stops; the Cuesta and photo stops add to that",
        "fuente": [
          "About 157 km and around 2 h 30 without stops. With the Cuesta and photo stops, the ride takes longer."
        ]
      },
      "distancia": {
        "valor": "About 157 km (98 miles), with about 15 km of gravel on the Cuesta del Obispo",
        "fuente": [
          "Salta to Cachi is about 157 km (98 miles)",
          "About 15 km of the Cuesta is still gravel."
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta or the airport",
        "fuente": [
          "From your hotel in Salta or the airport to your lodging in Cachi"
        ]
      },
      "incluye": {
        "valor": "A professional driver, the vehicle chosen for the season and the road, and stops on the Cuesta and in the park",
        "fuente": [
          "19-seat minibuses with a professional driver",
          "chosen for the season and the road",
          "with stops on the Cuesta and in the national park"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses prepared for gravel and 4x4 pickups",
        "fuente": [
          "19-seat minibuses with a professional driver, prepared for gravel roads",
          "4x4 pickups for small groups or when the road calls for it",
          "Larger groups: we add minibuses so everyone travels together"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cachi, Salta, Argentina",
      "paradas": []
    }
  },
  "en/salta-to-cafayate-transfer.html": {
    "filas": {
      "duracion": {
        "valor": "About 2 h 30 of driving without stops; with stops in the gorge, most of the morning",
        "fuente": [
          "roughly 2 h 30 of driving without stops. With stops in the gorge, the ride takes most of the morning."
        ]
      },
      "distancia": {
        "valor": "About 190 km (118 miles) on National Route 68, paved all the way",
        "fuente": [
          "Salta to Cafayate is about 190 km (118 miles) on National Route 68, paved all the way"
        ]
      },
      "salida": {
        "valor": "Your hotel, the bus terminal or Salta airport",
        "fuente": [
          "From your hotel, the bus terminal or Salta airport to your lodging in Cafayate"
        ]
      },
      "incluye": {
        "valor": "A professional driver, stops in the gorge where you want them, and rides between wineries",
        "fuente": [
          "A 19-seat minibus or a 4x4 pickup with a professional driver",
          "The driver stops wherever you want, as long as the road allows it safely",
          "We drive you between them and back to your hotel or to Salta"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups with a professional driver",
        "fuente": [
          "19-seat minibuses with a professional driver",
          "4x4 pickups for small groups",
          "Larger groups: we add minibuses so everyone travels together"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cafayate, Salta, Argentina",
      "paradas": []
    }
  },
  "en/salta-to-jujuy-transfer.html": {
    "filas": {
      "duracion": {
        "valor": "Around 1 h 35 on the highway or about 2 h on the mountain road, without stops",
        "fuente": [
          "About 120 km on the highway, around 1 h 35 (estimate). On the mountain road, about 96 km and about 2 h."
        ]
      },
      "distancia": {
        "valor": "About 120 km on the highway; about 96 km on the mountain road",
        "fuente": [
          "About 120 km on the highway, around 1 h 35 (estimate). On the mountain road, about 96 km and about 2 h."
        ]
      },
      "salida": {
        "valor": "Door to door in Salta, or at the Salta and Jujuy airports",
        "fuente": [
          "door to door, for the group and its luggage; also to or from the Salta and Jujuy airports"
        ]
      },
      "incluye": {
        "valor": "A professional driver, door to door, for the group and its luggage",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver",
          "door to door, for the group and its luggage"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups with a professional driver",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Salvador de Jujuy, Jujuy, Argentina",
      "paradas": []
    }
  },
  "en/salta-to-purmamarca-tilcara-humahuaca.html": {
    "filas": {
      "duracion": {
        "valor": "About 2 h 50 to Purmamarca and 3 h 45 to Humahuaca, one way without stops",
        "fuente": [
          "Purmamarca: about 188 km and 2 h 50. Humahuaca: about 250 km and 3 h 45. One way, without stops."
        ]
      },
      "distancia": {
        "valor": "About 188 km (117 miles) to Purmamarca and about 250 km to Humahuaca, paved",
        "fuente": [
          "Salta to Purmamarca is about 188 km (117 miles)",
          "Humahuaca about 250 km and 3 h 45 from Salta",
          "then RN 9 north along the Quebrada. Paved."
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta or Salta airport",
        "fuente": [
          "Pickup at your hotel in Salta or at Salta airport"
        ]
      },
      "incluye": {
        "valor": "A professional driver, air conditioning, and stops chosen by the group along the route",
        "fuente": [
          "A private 19-seat minibus for the group, with a professional driver",
          "Air conditioning in every vehicle",
          "Stops chosen by the group along the route"
        ]
      },
      "unidades": {
        "valor": "A private 19-seat minibus; a 4x4 or gravel-ready minibus for the Hornocal",
        "fuente": [
          "A private 19-seat minibus for the group",
          "larger groups travel in additional minibuses",
          "A 4x4 pickup or a minibus prepared for gravel when the plan includes the Hornocal"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Humahuaca, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Tilcara, Jujuy, Argentina"
      ]
    }
  },
  "en/salta-to-san-antonio-de-los-cobres.html": {
    "filas": {
      "duracion": {
        "valor": "About 3 h of driving without stops; we climb with stops, so the trip up takes longer",
        "fuente": [
          "About 164 km and around 3 hours of driving without stops.",
          "Because we climb with stops, the trip up takes longer."
        ]
      },
      "distancia": {
        "valor": "About 164 km (102 miles) on Route 51, paved; the La Polvorilla viaduct is 16 to 18 km further",
        "fuente": [
          "is about 164 km (102 miles) on National Route 51 through the Quebrada del Toro, paved all the way",
          "The La Polvorilla viaduct is about 16 to 18 km further on."
        ]
      },
      "salida": {
        "valor": "Salta city, at the time your group picks",
        "fuente": [
          "from the city of Salta on National Route 51",
          "your group picks the departure time and where to stop on the way"
        ]
      },
      "incluye": {
        "valor": "A professional driver, stops so your body can adjust to the altitude, and a satellite phone on board",
        "fuente": [
          "in a minibus or a 4x4 pickup with a professional driver",
          "with stops so your body can adjust to the altitude",
          "Satellite phone on board on high-altitude trips"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses or 4x4 pickups, chosen for the group and the road",
        "fuente": [
          "19-seat minibuses or 4x4 pickups, chosen for the group and the road"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Antonio de los Cobres, Salta, Argentina",
      "paradas": []
    }
  },
  "en/salta-to-san-pedro-de-atacama.html": {
    "filas": {
      "duracion": {
        "valor": "Close to 8 hours of driving without stops; a full day with the border and stops",
        "fuente": [
          "Driving time without stops is close to 8 hours; with the border and stops it takes a full day."
        ]
      },
      "distancia": {
        "valor": "About 590 km (365 miles), paved all the way, over the Jama Pass",
        "fuente": [
          "Salta to San Pedro de Atacama is about 590 km (365 miles) on Ruta 9, Ruta 52 and the Jama Pass, paved all the way."
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta or the airport, to your lodging in San Pedro de Atacama",
        "fuente": [
          "from your hotel in Salta or the airport to your lodging in San Pedro"
        ]
      },
      "incluye": {
        "valor": "Professional driver, the vehicle's international trip permit, insurance extended to Chile and your stops",
        "fuente": [
          "We file the vehicle's international trip permit",
          "The vehicle travels with its insurance extended to Chile.",
          "the stops are yours to choose"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver",
          "Larger groups travel in several minibuses"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Pedro de Atacama, Chile",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Salinas Grandes, Jujuy, Argentina",
        "Paso de Jama, Jujuy, Argentina"
      ]
    }
  },
  "en/salta-to-uyuni.html": {
    "filas": {
      "duracion": {
        "valor": "Close to 9 and a half hours of driving without stops, plus the border; best over two days",
        "fuente": [
          "Driving time without stops is close to 9 and a half hours, plus the border, so we recommend two days."
        ]
      },
      "distancia": {
        "valor": "About 690 km (430 miles), via the Quebrada de Humahuaca, La Quiaca–Villazón and Tupiza",
        "fuente": [
          "Salta to Uyuni is about 690 km (430 miles)",
          "up the Quebrada de Humahuaca, across the La Quiaca–Villazón bridge and on through Tupiza"
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta, to your lodging in Uyuni",
        "fuente": [
          "from your hotel in Salta to your lodging in Uyuni"
        ]
      },
      "incluye": {
        "valor": "Professional driver, the vehicle's international trip permit, insurance extended to Bolivia and your stops",
        "fuente": [
          "We file the vehicle's international trip permit",
          "The vehicle travels with its insurance extended to Bolivia.",
          "Stops: Purmamarca, Tilcara, Humahuaca or Tupiza, whichever your group chooses."
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Uyuni, Bolivia",
      "paradas": [
        "Humahuaca, Jujuy, Argentina",
        "La Quiaca, Jujuy, Argentina",
        "Tupiza, Bolivia"
      ]
    }
  },
  "en/san-pedro-de-atacama-to-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Close to 8 hours of driving without stops; a full day with the border check and a few stops",
        "fuente": [
          "Driving time without stops is close to 8 hours; with the border check and a few stops it takes a full day."
        ]
      },
      "distancia": {
        "valor": "About 590 km (365 miles), paved all the way, via the Jama Pass",
        "fuente": [
          "San Pedro de Atacama to Salta is about 590 km (365 miles) on Ruta 27 CH, the Jama Pass and Ruta 52, paved all the way."
        ]
      },
      "salida": {
        "valor": "Your lodging in San Pedro de Atacama or another point in town, on the agreed day and time",
        "fuente": [
          "we agree the day, time and place well ahead: your lodging in San Pedro de Atacama or another point in town"
        ]
      },
      "incluye": {
        "valor": "Professional driver, the vehicle's international trip permit, insurance extended to Chile and your stops",
        "fuente": [
          "We file the vehicle's international trip permit",
          "The vehicle travels with its insurance extended to Chile.",
          "the stops are yours to choose"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver",
          "Larger groups travel in several minibuses"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "San Pedro de Atacama, Chile",
      "destino": "Salta, Argentina",
      "paradas": [
        "Paso de Jama, Jujuy, Argentina",
        "Salinas Grandes, Jujuy, Argentina",
        "Purmamarca, Jujuy, Argentina"
      ]
    }
  },
  "en/train-to-the-clouds-transfer.html": {
    "filas": {
      "duracion": {
        "valor": "Same-day round trip; about 2 h 50 min of driving without stops, 3 to 4 hours with stops",
        "fuente": [
          "bring you back to Salta the same day",
          "roughly 2 h 50 min of driving without stops",
          "plan on 3 to 4 hours"
        ]
      },
      "distancia": {
        "valor": "About 164 km (102 miles) on route RN 51 to San Antonio de los Cobres station",
        "fuente": [
          "About 164 km (102 miles) from Salta to San Antonio de los Cobres"
        ]
      },
      "salida": {
        "valor": "Your hotel in Salta",
        "fuente": [
          "Pickup at your hotel in Salta"
        ]
      },
      "incluye": {
        "valor": "A driver, a private minibus or 4x4, your own stops, and waiting while you ride the train",
        "fuente": [
          "in a private minibus or 4x4 with a driver, wait while you ride the train",
          "stopping wherever you like"
        ]
      },
      "unidades": {
        "valor": "Private minibus or 4x4; a 4x4 if you want to continue on Puna gravel roads",
        "fuente": [
          "in a private minibus or 4x4 with a driver",
          "4x4 pickups if you want to continue on Puna gravel roads"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Antonio de los Cobres, Salta, Argentina",
      "paradas": [
        "Campo Quijano, Salta, Argentina",
        "Santa Rosa de Tastil, Salta, Argentina"
      ]
    }
  },
  "en/transfer-carnival-quebrada-de-humahuaca.html": {
    "filas": {
      "duracion": {
        "valor": "Nightly round trip or a vehicle at your disposal; about 2 h 15 to 3 h by car depending on the village (estimated)",
        "fuente": [
          "every night, or with the vehicle and driver at your disposal for the carnival days",
          "179 km (111 mi), about 2 h 15 by car",
          "239 km (149 mi), about 3 h by car"
        ]
      },
      "distancia": {
        "valor": "Purmamarca 179 km (111 mi), Tilcara 197 km (122 mi), Humahuaca 239 km (149 mi) from Salta city",
        "fuente": [
          "179 km (111 mi), about 2 h 15 by car",
          "197 km (122 mi), about 2 h 30 by car",
          "239 km (149 mi), about 3 h by car"
        ]
      },
      "salida": {
        "valor": "Salta, or Salta (SLA) or Jujuy (JUJ) airport if you are flying in",
        "fuente": [
          "takes your group from Salta, or straight from Salta airport",
          "Yes, at Salta (SLA) or Jujuy (JUJ)"
        ]
      },
      "incluye": {
        "valor": "A professional driver, a private minibus for your group, waiting in the village, and luggage for several days",
        "fuente": [
          "A private 19-seat minibus with a professional driver",
          "the driver waits in the village",
          "Luggage for several days travels in the same minibus"
        ]
      },
      "unidades": {
        "valor": "19-seat minibus",
        "fuente": [
          "19-seat minibuses with a professional driver",
          "Larger groups get a quote for extra vehicles on the same trip"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Humahuaca, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Tilcara, Jujuy, Argentina"
      ]
    }
  },
  "en/uyuni-to-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Close to 9 and a half hours of driving without stops, plus the border; best over two days",
        "fuente": [
          "Driving time without stops is close to 9 and a half hours, plus the border, so we recommend two days."
        ]
      },
      "distancia": {
        "valor": "About 690 km (430 miles), via Tupiza, Villazón–La Quiaca and the Quebrada de Humahuaca",
        "fuente": [
          "Uyuni to Salta is about 690 km (430 miles): some 290 km of paved mountain road through Atocha and Tupiza to Villazón",
          "Villazón–La Quiaca international bridge",
          "down the Quebrada de Humahuaca"
        ]
      },
      "salida": {
        "valor": "Your lodging in Uyuni, Tupiza or Villazón, on the agreed day and time",
        "fuente": [
          "we agree the day, time and place well ahead: your lodging in Uyuni, Tupiza or Villazón"
        ]
      },
      "incluye": {
        "valor": "Professional driver, the vehicle's international trip permit, insurance extended to Bolivia, same vehicle all the way",
        "fuente": [
          "We file the vehicle's international trip permit",
          "The vehicle travels with its insurance extended to Bolivia.",
          "in the same vehicle all the way and with the stops your group wants"
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses and 4x4 pickups",
        "fuente": [
          "19-seat minibuses and 4x4 pickups with a professional driver"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Uyuni, Bolivia",
      "destino": "Salta, Argentina",
      "paradas": [
        "Tupiza, Bolivia",
        "La Quiaca, Jujuy, Argentina",
        "Humahuaca, Jujuy, Argentina"
      ]
    }
  },
  "en/wedding-transportation.html": {
    "filas": {
      "duracion": {
        "valor": "The wedding night: to the ceremony and the venue, then one or more return runs agreed when you book",
        "fuente": [
          "take guests to the ceremony and then to the venue",
          "an earlier run for guests who leave first and a last run when the party ends. Times are agreed when you book."
        ]
      },
      "distancia": {
        "valor": "Fincas about 45 minutes away; Cafayate wineries about 190 km from Salta",
        "fuente": [
          "fincas in San Lorenzo, La Caldera and Chicoana (about 45 minutes away)",
          "For a wedding at a winery in Cafayate, about 190 km from Salta"
        ]
      },
      "salida": {
        "valor": "At the hotels or meeting points you choose; airport pickups at Salta airport (SLA)",
        "fuente": [
          "The minibuses pick up at the hotels or meeting points you choose",
          "Guests arriving at Salta's Martín Miguel de Güemes airport (SLA) are taken to their hotels"
        ]
      },
      "incluye": {
        "valor": "Professional driver; hotels to the ceremony, the party and back, with the same driver both ways",
        "fuente": [
          "from the hotels to the ceremony and the party, and back again at the end of the night",
          "The group travels together, with the same driver both ways."
        ]
      },
      "unidades": {
        "valor": "19-seat minibuses",
        "fuente": [
          "19-seat minibuses. For more guests, we add minibuses on the same schedule."
        ]
      }
    },
    "mapa": null
  },
  "pt/salinas-grandes-saindo-de-salta.html": {
    "filas": {
      "duracion": {
        "valor": "Umas 4 h 10 de estrada só ida, sem paradas; ida e volta, mais de oito horas",
        "fuente": [
          "Uns 255 km e 4 h 10 só ida, sem paradas.",
          "ida e volta são uns 510 km e mais de oito horas de estrada, sem contar as paradas"
        ]
      },
      "distancia": {
        "valor": "Uns 255 km só ida, por Purmamarca e a Cuesta de Lipán, todo em asfalto",
        "fuente": [
          "são uns 255 km e 4 h 10 de estrada, só ida, por Purmamarca e a Cuesta de Lipán",
          "É asfalto o caminho todo."
        ]
      },
      "salida": {
        "valor": "Busca no seu hotel em Salta ou no aeroporto",
        "fuente": [
          "Busca no hotel em Salta ou no aeroporto"
        ]
      },
      "incluye": {
        "valor": "Motorista profissional, ar-condicionado e paradas à escolha: Purmamarca, a Cuesta de Lipán e o salar",
        "fuente": [
          "Uma van privativa de 19+1 lugares para o grupo, com motorista profissional",
          "Ar-condicionado em todos os veículos",
          "Paradas à escolha do grupo: Purmamarca, os mirantes da Cuesta de Lipán e o salar"
        ]
      },
      "unidades": {
        "valor": "Van privativa de 19+1 lugares ou caminhonete 4x4, preparadas para a altitude",
        "fuente": [
          "Uma van privativa de 19+1 lugares para o grupo",
          "Ou uma caminhonete 4x4, conforme o grupo; veículos preparados para a altitude",
          "os grupos maiores viajam em vans adicionais"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Salinas Grandes, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina"
      ]
    }
  },
  "pt/traslado-salta-cafayate.html": {
    "filas": {
      "duracion": {
        "valor": "Umas 2 h 30 de direção sem paradas; com paradas na quebrada, boa parte da manhã",
        "fuente": [
          "cerca de 2 h 30 de direção sem paradas",
          "Com paradas na quebrada, a ida ocupa boa parte da manhã"
        ]
      },
      "distancia": {
        "valor": "Uns 190 km pela Ruta Nacional 68, toda asfaltada",
        "fuente": [
          "são uns 190 km pela Ruta Nacional 68, toda asfaltada"
        ]
      },
      "salida": {
        "valor": "Busca no seu hotel, na rodoviária ou no aeroporto de Salta",
        "fuente": [
          "Do hotel, da rodoviária ou do aeroporto de Salta até a sua hospedagem em Cafayate"
        ]
      },
      "incluye": {
        "valor": "Motorista profissional que espera o grupo, paradas na quebrada e o traslado entre as vinícolas",
        "fuente": [
          "com motorista profissional, que espera o grupo e o traz de volta",
          "O motorista para onde o grupo quiser",
          "Nós fazemos o traslado de uma para outra"
        ]
      },
      "unidades": {
        "valor": "Vans de 19+1 lugares e caminhonetes 4x4 com motorista",
        "fuente": [
          "Vans de 19+1 lugares e caminhonetes 4x4 com motorista profissional",
          "coordenamos mais de um veículo para que viajem juntos"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Cafayate, Salta, Argentina",
      "paradas": []
    }
  },
  "pt/traslado-salta-purmamarca-tilcara-humahuaca.html": {
    "filas": {
      "duracion": {
        "valor": "Umas 2 h 50 até Purmamarca e 3 h 45 até Humahuaca, só ida e sem paradas",
        "fuente": [
          "Purmamarca: uns 188 km e 2 h 50. Humahuaca: uns 250 km e 3 h 45. Só ida e sem paradas."
        ]
      },
      "distancia": {
        "valor": "Uns 188 km até Purmamarca e uns 250 km até Humahuaca, todo em asfalto",
        "fuente": [
          "Purmamarca: uns 188 km e 2 h 50. Humahuaca: uns 250 km e 3 h 45.",
          "rumo ao norte pela Quebrada. Asfalto."
        ]
      },
      "salida": {
        "valor": "Busca no seu hotel em Salta ou no aeroporto",
        "fuente": [
          "Busca no hotel em Salta ou no aeroporto"
        ]
      },
      "incluye": {
        "valor": "Motorista profissional, ar-condicionado e paradas à escolha do grupo ao longo da estrada",
        "fuente": [
          "Uma van privativa de 19+1 lugares para o grupo, com motorista profissional",
          "Ar-condicionado em todos os veículos",
          "Paradas à escolha do grupo ao longo da estrada"
        ]
      },
      "unidades": {
        "valor": "Van privativa de 19+1 lugares; 4x4 ou van para cascalho no Hornocal",
        "fuente": [
          "Uma van privativa de 19+1 lugares para o grupo",
          "os grupos maiores viajam em vans adicionais",
          "Caminhonete 4x4 ou van preparada para cascalho quando o plano inclui o Hornocal"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Humahuaca, Jujuy, Argentina",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Tilcara, Jujuy, Argentina"
      ]
    }
  },
  "pt/traslado-salta-san-pedro-de-atacama.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 8 horas de estrada sem paradas; com a fronteira e as paradas, um dia inteiro",
        "fuente": [
          "Dirigindo sem paradas, são cerca de 8 horas; com a fronteira e as paradas, é uma viagem de dia inteiro."
        ]
      },
      "distancia": {
        "valor": "Uns 590 km, tudo asfaltado, pelo Paso de Jama",
        "fuente": [
          "De Salta a San Pedro de Atacama são uns 590 km pela Ruta 9, pela Ruta 52 e pelo Paso de Jama, tudo asfaltado."
        ]
      },
      "salida": {
        "valor": "Seu hotel em Salta ou o aeroporto, até a sua hospedagem em San Pedro de Atacama",
        "fuente": [
          "do seu hotel em Salta ou do aeroporto até a sua hospedagem em San Pedro"
        ]
      },
      "incluye": {
        "valor": "Motorista profissional, autorização internacional do veículo, seguro com extensão para o Chile e paradas do grupo",
        "fuente": [
          "Cuidamos da autorização de viagem internacional do veículo",
          "O veículo viaja com seguro com extensão para o Chile.",
          "as paradas são escolhidas pelo grupo"
        ]
      },
      "unidades": {
        "valor": "Vans de 19+1 lugares e caminhonetes 4x4",
        "fuente": [
          "Vans de 19+1 lugares e caminhonetes 4x4, com motorista profissional",
          "Grupos maiores: mais de um veículo"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "San Pedro de Atacama, Chile",
      "paradas": [
        "Purmamarca, Jujuy, Argentina",
        "Salinas Grandes, Jujuy, Argentina",
        "Paso de Jama, Jujuy, Argentina"
      ]
    }
  },
  "pt/traslado-salta-uyuni.html": {
    "filas": {
      "duracion": {
        "valor": "Cerca de 9 horas e meia ao volante sem paradas, mais a fronteira; recomendado em dois dias",
        "fuente": [
          "Sem paradas, são cerca de 9 horas e meia ao volante, mais a fronteira; recomendamos fazer em dois dias."
        ]
      },
      "distancia": {
        "valor": "Uns 690 km, pela Quebrada de Humahuaca, La Quiaca–Villazón e Tupiza",
        "fuente": [
          "De Salta a Uyuni são uns 690 km",
          "pela Quebrada de Humahuaca, a fronteira La Quiaca–Villazón e Tupiza"
        ]
      },
      "salida": {
        "valor": "Seu hotel em Salta, até a sua hospedagem em Uyuni",
        "fuente": [
          "do seu hotel em Salta até a sua hospedagem em Uyuni"
        ]
      },
      "incluye": {
        "valor": "Motorista profissional, autorização internacional do veículo, seguro com extensão para a Bolívia e paradas do grupo",
        "fuente": [
          "Cuidamos da autorização de viagem internacional do veículo",
          "O veículo viaja com seguro com extensão para a Bolívia.",
          "Paradas: Purmamarca, Tilcara, Humahuaca ou Tupiza, as que o grupo escolher."
        ]
      },
      "unidades": {
        "valor": "Vans de 19+1 lugares e caminhonetes 4x4",
        "fuente": [
          "Vans de 19+1 lugares e caminhonetes 4x4, com motorista profissional"
        ]
      }
    },
    "mapa": {
      "tipo": "ruta",
      "origen": "Salta, Argentina",
      "destino": "Uyuni, Bolivia",
      "paradas": [
        "Humahuaca, Jujuy, Argentina",
        "La Quiaca, Jujuy, Argentina",
        "Tupiza, Bolivia"
      ]
    }
  }
};
