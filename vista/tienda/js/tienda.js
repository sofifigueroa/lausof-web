/* Vitrina: precios por cantidad de personas y «Reservar» en las páginas que la llevan.

   Lee el catálogo público de Apacheta (GET {sitio}/api/publico/{empresa}/
   catalogo) y dibuja en las zonas que escribió scripts/tienda.mjs. Diseño:
   ~/lausof/web/demo-reservas-2026-11-06/3c-diseno-seleccion.md (contador
   «Personas», un total por tramo, el vehículo como información) y
   3e-diseno-mercado.md §5 A (sólo pesos: sin «Ver en», sin «Aprox.», sin nota
   del cambio, sin `moneda` en el enlace); textos: 4-textos.md; forma del
   catálogo: 7-contrato-overlay.md («Campos que la vitrina lee»).

   Mientras la vitrina no esté encendida en producción (scripts/entorno.mjs,
   tienda.activa), ninguna página de www.lausof.com carga este archivo: sólo la
   demo, después del `load` de la página y detrás de js/precios-host.js.

   Reglas que este archivo no rompe:
   - Web nunca calcula, divide, convierte ni formatea un monto: imprime
     `total_texto`, `neto_texto` y `por_persona_texto[n]` tal como llegan (RC-0b; un precio publicado obliga mientras está
     publicado, Ley 24.240 art. 7: siempre se lee en vivo). El contador sólo
     elige cuál de los totales del catálogo se ve.
   - Un monto nunca se muestra sin su tramo de personas ni sin su «Precio sin
     impuestos nacionales», y nunca con «desde» (Res. SIC 4/2025 art. 2 b–c).
     Un precio por día nunca sin «por día» ni sin sus km.
   - Sólo pesos, lo que se cobra (Lautaro 06/11, D13; 3e §5 A). Si el
     catálogo trae `monedas` o `aprox` (Apacheta puede mandarlos), se ignoran.
   - Ningún monto sin el visto de js/precios-host.js (3b G10).
   - Si falta un dato, la tarjeta se degrada (sin línea, el camino
     de contacto); nunca dice «no».
   - Lee sólo <script id="tienda-config"> y los data-tienda-* de sus zonas;
     nunca los enganches de contexto de <body> (tests/menu.test.js).

   Los tests lo cargan con require() (tests/tienda.test.js, el núcleo puro) y
   en jsdom (tests/tienda-dom.test.js, el contador y el anuncio). */
(function (raiz) {
  'use strict';

  const TIEMPO_MAXIMO_MS = 8000;
  const LEYENDA_DEL_NETO = 'Precio sin impuestos nacionales'; // Res. SIC 4/2025 art. 2 c; el catálogo la manda en textos.neto
  const PERSONAS_MIN = 1;
  const PERSONAS_MAX = 99; // el contador nunca rechaza un grupo: más que el vehículo más grande es «Pedir presupuesto» (3c §4)
  const PERSONAS_DEFECTO = 2; // 3c §5: el tramo de 1 a 4, el total exacto de cualquier grupo de 1 a 4
  const ESPERA_ANUNCIO_MS = 500; // 3c §6: el lector oye el resultado 500 ms después del último cambio
  const ESPERA_TIPEO_MS = 700; // 3c §6: lo tipeado queda después de 700 ms sin teclas
  const GUARDA_PERSONAS = 'lausof.personas'; // sessionStorage: el grupo cambia de un viaje a otro (3c §3)

  /** Escapa texto del catálogo antes de ponerlo en HTML. */
  function escapar(valor) {
    return String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Para cruzar el mapa con el catálogo por nombre: sin acentos, minúsculas, un espacio. */
  function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  const texto = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const entero = (v) => (Number.isInteger(v) ? v : null);

  /** Una plantilla de los textos de la página con sus marcadores. */
  const t = (ctx, id, valores = {}) => {
    const plantilla = ctx.textos[id];
    if (plantilla === undefined) throw new Error(`falta el texto ${id}`);
    return plantilla.replace(/\{(\w+)\}/g, (_, k) => (k in valores ? valores[k] : `{${k}}`));
  };

  /** ¿Singular en este idioma? (4-textos §2.3: Intl.PluralRules, nunca concatenar). */
  const esUno = (ctx, n) => {
    try { return new Intl.PluralRules(ctx.idioma).select(n) === 'one' && n === 1; } catch { return n === 1; }
  };

  /* ---- el catálogo ------------------------------------------------------- */

  /** ¿El catálogo es una respuesta válida del contrato? */
  function catalogoValido(catalogo) {
    return Boolean(catalogo && catalogo.ok === true && Array.isArray(catalogo.servicios));
  }

  /**
   * Cruza una entrada del mapa con el catálogo: por `clave` (R13), por `id`, o
   * por el nombre en castellano del servicio en la semilla de la demo.
   */
  function buscar(catalogo, entrada) {
    const servicios = catalogo && Array.isArray(catalogo.servicios) ? catalogo.servicios.filter((s) => s && typeof s === 'object') : [];
    return servicios.find((s) => s.clave && s.clave === entrada.clave)
      || servicios.find((s) => s.id && s.id === entrada.clave)
      || (entrada.nombre ? servicios.find((s) => typeof s.nombre === 'string' && normalizar(s.nombre) === normalizar(entrada.nombre)) : null)
      || null;
  }

  /**
   * Los tramos de personas de un servicio (R1′): cada uno con su total, su neto
   * y su vehículo, ya formateados por Apacheta. Tienen que ir seguidos desde 1,
   * sin huecos ni cruces; si no, el servicio no muestra montos (falla cerrado,
   * nunca un total que no es el de ese grupo). Con `unidad: 'por_dia'`, un
   * tramo sin km incluidos invalida igual. `tramos: 'primero'` deja sólo el primero.
   */
  function tramosDe(servicio, { unidad, tramos: alcance } = {}) {
    const precio = servicio && servicio.precio;
    if (!precio || !Array.isArray(precio.tramos) || !precio.tramos.length) return [];
    const lista = [];
    for (const x of precio.tramos) {
      if (!x || typeof x !== 'object') return [];
      const min = entero(x.pasajeros_min);
      const max = entero(x.pasajeros_max);
      const total = texto(x.total_texto);
      const neto = texto(x.neto_texto);
      const vehiculo = texto(x.vehiculo);
      const km = entero(x.km_incluidos) && x.km_incluidos > 0 ? x.km_incluidos : null;
      if (!min || !max || min < 1 || max < min || !total || !neto || !vehiculo) return [];
      if (unidad === 'por_dia' && !km) return [];
      const porPersona = {};
      if (unidad !== 'por_dia' && x.por_persona_texto && typeof x.por_persona_texto === 'object') {
        for (const [n, v] of Object.entries(x.por_persona_texto)) if (/^\d+$/.test(n) && texto(v)) porPersona[n] = texto(v);
      }
      lista.push({ min, max, total, neto, vehiculo, km, porPersona });
    }
    lista.sort((a, b) => a.min - b.min);
    for (let i = 0; i < lista.length; i += 1) {
      if (lista[i].min !== (i === 0 ? 1 : lista[i - 1].max + 1)) return [];
    }
    return alcance === 'primero' ? lista.slice(0, 1) : lista;
  }

  /** Hasta cuántas personas se reserva en línea: lo que dice el catálogo, nunca más que el último tramo. */
  function maximoDe(servicio, tramos) {
    if (!tramos.length) return 0;
    const ultimo = tramos[tramos.length - 1].max;
    const dicho = entero(servicio && servicio.precio && servicio.precio.pasajeros_max_reservable);
    return dicho && dicho >= 1 ? Math.min(dicho, ultimo) : ultimo;
  }

  const tramoPara = (tramos, n) => tramos.find((x) => n >= x.min && n <= x.max) || null;

  /** La cantidad que el contador muestra al cargar: la de la sesión, la del catálogo o 2 (3c §5). */
  function personasIniciales(guardadas, servicio) {
    const g = personasValidas(guardadas);
    if (g) return g;
    const d = entero(servicio && servicio.precio && servicio.precio.pasajeros_defecto);
    return d && d >= PERSONAS_MIN && d <= PERSONAS_MAX ? d : PERSONAS_DEFECTO;
  }

  /** Un número de personas válido (1–99) o null. Sólo dígitos: «0», «», «2a» → null. */
  function personasValidas(valor) {
    const s = String(valor === null || valor === undefined ? '' : valor).trim();
    if (!/^\d{1,3}$/.test(s)) return null;
    const n = Number(s);
    return n >= PERSONAS_MIN ? Math.min(n, PERSONAS_MAX) : null;
  }

  /* ---- la compra --------------------------------------------------------- */

  /**
   * La compra alojada en Apacheta (contrato §3.3), en la misma pestaña:
   * servicio, `pasajeros` (R15), idioma y `desde`,
   * la URL completa de esta página (R8). Usa el `servicio` del enlace del
   * catálogo si es del mismo origen que SITIO; si no, la clave o el id.
   */
  function urlReservar(servicio, ctx, { pasajeros = null, respaldo = null } = {}) {
    let delCatalogo = null;
    if (servicio && typeof servicio.reservar === 'string') {
      try {
        const u = new URL(servicio.reservar);
        if (u.origin === new URL(ctx.sitio).origin && u.pathname === `/${encodeURIComponent(ctx.empresa)}/reservar`) delCatalogo = u.searchParams.get('servicio');
      } catch { /* se arma abajo */ }
    }
    const url = new URL(`${ctx.sitio}/${encodeURIComponent(ctx.empresa)}/reservar`);
    const id = delCatalogo || (servicio && (servicio.clave || servicio.id)) || respaldo;
    if (id) url.searchParams.set('servicio', String(id));
    if (pasajeros) url.searchParams.set('pasajeros', String(pasajeros));
    url.searchParams.set('idioma', ctx.idioma);
    url.searchParams.set('desde', `${ctx.origen}${ctx.desde}`);
    return url.toString();
  }

  /* ---- la zona de precio de una tarjeta ---------------------------------- */

  const netoHTML = (ctx, x) => `<small class="tienda-neto">${t(ctx, 'tienda.neto', { leyenda: escapar(ctx.leyenda), neto: escapar(x.neto) })}</small>`;

  const etiquetaTramo = (ctx, x) => (x.min === x.max
    ? (esUno(ctx, x.min) ? t(ctx, 'tienda.card.tramo.uno') : t(ctx, 'tienda.card.tramo.igual', { n: x.min }))
    : t(ctx, 'tienda.card.tramo.rango', { min: x.min, max: x.max }));

  /** El total, con «por día» después en las tarjetas por día. */
  function totalHTML(ctx, x, porDia) {
    if (!porDia) return `<b class="tienda-total">${escapar(x.total)}</b>`;
    const [antes, despues] = ctx.textos['tienda.card.por_dia'].split('{total}');
    return `<b class="tienda-total">${escapar(antes)}${escapar(x.total)}<small>${escapar(despues)}</small></b>`;
  }

  /** «ARS 260.000 por persona» (S1): con la elección encendida, más de una persona y el texto del catálogo. */
  const porPersonaDe = (ctx, x, n, porDia) => (ctx.porPersona && !porDia && n > 1 && x.porPersona[String(n)]) || null;

  /** La línea de información: el vehículo del tramo y lo que va aparte (3c §2.3). */
  function infoDe(ctx, entrada, x) {
    const partes = [t(ctx, 'tienda.card.vehiculo_info', { vehiculo: escapar(x.vehiculo) })];
    if (entrada.unidad === 'por_dia') partes.push(t(ctx, 'tienda.card.unidad.por_dia', { km: x.km }));
    else if (entrada.unidad && entrada.unidad !== 'traslado') partes.push(t(ctx, `tienda.card.unidad.${entrada.unidad}`));
    return partes.join(' ');
  }

  /**
   * Lo que muestra una tarjeta para n personas. Puro. Devuelve
   * { tipo, zona (HTML), info (HTML; '' = oculta), accion: { texto, clase, href }, voz (lo que oye el lector; null = no se anuncia), montos }.
   * tipo: 'precio' | 'presupuesto' (más que el máximo) | 'sin_precio' (precio null) | 'sin_monto' (sin tramos usables o sin el visto).
   */
  function zonaDe(servicio, entrada, n, ctx) {
    const nombre = typeof servicio.nombre === 'string' ? servicio.nombre : '';
    const href = () => urlReservar(servicio, ctx, { pasajeros: n });
    const presupuesto = (zona, voz) => ({
      tipo: voz ? 'presupuesto' : 'sin_precio', zona, info: '', voz, montos: 0,
      accion: { texto: t(ctx, 'tienda.card.presupuesto'), clase: 'btn btn-presupuesto', href: href() },
    });
    if (!servicio.precio) return presupuesto(`<p class="tienda-sin-precio">${t(ctx, 'tienda.card.sin_precio')}</p>`, null);
    const tramos = ctx.mostrarPrecios ? tramosDe(servicio, entrada) : [];
    if (!tramos.length) {
      return { tipo: 'sin_monto', zona: '', info: '', voz: null, montos: 0, accion: { texto: t(ctx, 'tienda.card.reservar'), clase: 'btn btn-reservar', href: href() } };
    }
    const maximo = maximoDe(servicio, tramos);
    const x = n <= maximo ? tramoPara(tramos, n) : null;
    if (!x) {
      return presupuesto(
        `<span class="tienda-tramo">${t(ctx, 'tienda.card.tramo.igual', { n })}</span><p class="tienda-mas-de">${t(ctx, 'tienda.card.mas_de')}</p>`,
        t(ctx, 'tienda.vivo.presupuesto', { servicio: nombre }),
      );
    }
    const porDia = entrada.unidad === 'por_dia';
    const pp = porPersonaDe(ctx, x, n, porDia);
    const zona = `<span class="tienda-tramo">${etiquetaTramo(ctx, x)}</span>${totalHTML(ctx, x, porDia)}${netoHTML(ctx, x)}`
      + (pp ? `<span class="tienda-pp">${t(ctx, 'tienda.card.por_persona', { monto: escapar(pp) })}</span>` : '');
    const voz = t(ctx, 'tienda.vivo.card', {
      servicio: nombre,
      total: x.total + (porDia ? ctx.textos['tienda.vivo.por_dia'] : ''),
      pp: pp ? t(ctx, 'tienda.vivo.pp', { monto: pp }) : '',
    });
    return { tipo: 'precio', zona, info: infoDe(ctx, entrada, x), voz, montos: 1, accion: { texto: t(ctx, 'tienda.card.reservar'), clase: 'btn btn-reservar', href: href() } };
  }

  /**
   * Lo que oye el lector después de un cambio del contador (3c §6): la
   * cantidad y hasta tres tarjetas con precio; las de «Precio a medida» no
   * cambian con las personas y no se nombran.
   */
  function textoVivo(zonas, n, ctx) {
    const valuetext = esUno(ctx, n) ? t(ctx, 'tienda.contador.valuetext.uno') : t(ctx, 'tienda.contador.valuetext.varios', { n });
    const voces = zonas.map((z) => z.voz).filter(Boolean);
    const partes = [t(ctx, 'tienda.vivo.personas', { valuetext }), ...voces.slice(0, 3)];
    const k = voces.length - 3;
    if (k > 0) partes.push(k === 1 ? t(ctx, 'tienda.vivo.mas.uno') : t(ctx, 'tienda.vivo.mas.varios', { k }));
    return partes.join(' ');
  }

  /* ---- tarjetas, bloques y líneas ---------------------------------------- */

  /** El enlace que abre el chat (R6): un WhatsApp de verdad, que el script del chat intercepta si cargó. */
  const enlaceChat = (ctx, id, extra = '') => (ctx.chat
    ? `<a class="tienda-chat" href="${escapar(ctx.wa)}" target="_blank" rel="noopener" data-asistente-abrir${extra}>${t(ctx, id)}</a>`
    : '');

  /** Una tarjeta de servicio para n personas. */
  function tarjeta(servicio, entrada, n, ctx) {
    const z = zonaDe(servicio, entrada, n, ctx);
    const nombre = escapar(servicio.nombre || '');
    const descripcion = servicio.descripcion ? `<p>${escapar(servicio.descripcion)}</p>` : '';
    const chat = enlaceChat(ctx, 'tienda.card.presupuesto_chat', z.tipo === 'presupuesto' || z.tipo === 'sin_precio' ? '' : ' hidden');
    return {
      z,
      html: `<article class="card tienda-card" data-tienda-tarjeta><div class="card-body"><h3>${nombre}</h3>${descripcion}`
        + `<div class="tienda-zona" data-tienda-zona>${z.zona}</div><p class="tienda-info" data-tienda-info${z.info ? '' : ' hidden'}>${z.info}</p>`
        + `<a class="${z.accion.clase}" href="${escapar(z.accion.href)}" data-tienda-accion>${z.accion.texto}</a>${chat}</div></article>`,
    };
  }

  /**
   * Los servicios del mapa que el catálogo trae, en el orden del mapa. null si
   * no queda ninguno (el bloque se oculta y la página queda como hoy).
   */
  function servicios(catalogo, entradas) {
    const hechos = entradas.map((e) => { const s = buscar(catalogo, e); return s ? { s, e } : null; }).filter(Boolean);
    return hechos.length ? hechos : null;
  }

  /** Un bloque para n personas. */
  function bloque(catalogo, entradas, n, ctx) {
    const hechos = servicios(catalogo, entradas);
    if (!hechos) return null;
    const tarjetas = hechos.map(({ s, e }) => tarjeta(s, e, n, ctx));
    return {
      html: tarjetas.map((x) => x.html).join(''),
      zonas: tarjetas.map((x) => x.z),
      ids: hechos.map(({ s }) => s.id).filter(Boolean),
      montos: tarjetas.reduce((a, x) => a + x.z.montos, 0),
      // ¿Algún servicio tiene tramos que el contador pueda cambiar?
      conTramos: ctx.mostrarPrecios && hechos.some(({ s, e }) => tramosDe(s, e).length > 0),
      soloPresupuesto: hechos.every(({ s }) => !s.precio),
    };
  }

  /** El renglón final del bloque (4-textos §2.6). */
  function renglonFinal(ctx) {
    return `<span>${t(ctx, 'tienda.bloque.otro')}</span>${enlaceChat(ctx, 'tienda.bloque.otro_chat')}<a class="walink" href="${escapar(ctx.wa)}" target="_blank" rel="noopener">${t(ctx, 'tienda.bloque.otro_wa')}</a>`;
  }

  /** El estado de error: qué pasó y las dos salidas (3c §5, UI-67e). La compra, sin personas: la compra las pregunta. */
  function estadoError(ctx, primera) {
    const compra = ctx.compraEnError
      ? `<a class="btn btn-reservar" href="${escapar(urlReservar(null, ctx, { respaldo: primera }))}">${t(ctx, 'tienda.estado.error_boton')}</a>`
      : '';
    return `<article class="card tienda-card tienda-error"><div class="card-body"><p>${t(ctx, 'tienda.estado.error')}</p>${compra}<a class="btn btn-wa" href="${escapar(ctx.wa)}" target="_blank" rel="noopener">${t(ctx, 'tienda.estado.error_wa')}</a></div></article>`;
  }

  /** La línea de precio del encabezado para n personas, o null si no hay monto (4-textos §1). */
  function lineaCabeza(catalogo, cabeza, n, ctx) {
    const s = buscar(catalogo, cabeza);
    if (!s || !ctx.mostrarPrecios) return null;
    const z = zonaDe(s, cabeza, n, ctx);
    const nombre = escapar(s.nombre || '');
    if (z.tipo === 'presupuesto') {
      return `<span class="tienda-cabeza-q">${t(ctx, 'tienda.cabeza.servicio.igual', { servicio: nombre, n })}</span> <a class="tienda-total" href="${escapar(z.accion.href)}">${t(ctx, 'tienda.card.presupuesto')}</a>`;
    }
    if (z.tipo !== 'precio') return null;
    const x = tramoPara(tramosDe(s, cabeza), n);
    const que = x.min === x.max
      ? (esUno(ctx, x.min) ? t(ctx, 'tienda.cabeza.servicio.uno', { servicio: nombre }) : t(ctx, 'tienda.cabeza.servicio.igual', { servicio: nombre, n: x.min }))
      : t(ctx, 'tienda.cabeza.servicio.rango', { servicio: nombre, min: x.min, max: x.max });
    const porDia = cabeza.unidad === 'por_dia';
    return `<span class="tienda-cabeza-q">${que}</span> ${totalHTML(ctx, x, porDia)}${ctx.chips ? ` <span class="tienda-chip">${escapar(ctx.textos['demo.chip.precio'])}</span>` : ''}${netoHTML(ctx, x)}`;
  }

  /**
   * El contexto de dibujo. `mostrarPrecios` lo decide js/precios-host.js
   * (window.LausofPrecios.puedeMostrarPrecios: el host y el catálogo tienen que
   * ser del mismo entorno, 3b G10); sin esa respuesta, ningún monto.
   */
  function contexto(config, catalogo, mostrarPrecios, origen) {
    const catalogoDemo = Boolean(catalogo && catalogo.demo === true);
    const leyenda = catalogo && catalogo.textos && texto(catalogo.textos.neto);
    return {
      sitio: config.sitio,
      empresa: config.empresa,
      idioma: config.idioma,
      origen,
      desde: config.desde,
      wa: config.wa,
      chat: config.chat === true,
      textos: config.textos,
      leyenda: leyenda || LEYENDA_DEL_NETO,
      porPersona: config.porPersona === true,
      compraEnError: config.compraEnError === true,
      mostrarPrecios: mostrarPrecios === true,
      chips: catalogoDemo && mostrarPrecios === true,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Navegador                                                                 */
  /* ------------------------------------------------------------------------ */

  /** Muestra el chip «PRECIOS DE PRUEBA» del título: el que trae el HTML (invisible, guarda el alto) o uno nuevo. */
  function mostrarChip(h2, ctx) {
    if (!h2) return;
    const chip = h2.querySelector('[data-tienda-chip]');
    if (chip) chip.setAttribute('data-visible', '');
    else h2.insertAdjacentHTML('beforeend', ` <span class="tienda-chip">${escapar(ctx.textos['demo.chip.bloque'])}</span>`);
  }

  /** Lee de sessionStorage / localStorage sin romper nunca (modo privado, sitio bloqueado). */
  function leerGuardado(win, cual, clave) {
    try { const s = win[cual]; return s ? s.getItem(clave) : null; } catch { return null; }
  }
  function guardar(win, cual, clave, valor) {
    try { const s = win[cual]; if (s) s.setItem(clave, valor); } catch { /* sin guardar: sólo se pierde la comodidad */ }
  }

  function registrar(win, motivo) {
    try {
      win.console.warn(`[tienda] ${motivo}`);
      if (typeof win.gtag === 'function') win.gtag('event', 'tienda_error', { motivo });
    } catch { /* nunca rompe la página */ }
  }

  async function leerCatalogo(win, config) {
    const url = `${config.sitio}/api/publico/${encodeURIComponent(config.empresa)}/catalogo?idioma=${encodeURIComponent(config.idioma)}`;
    const corte = typeof win.AbortController === 'function' ? new win.AbortController() : null;
    const reloj = corte ? win.setTimeout(() => corte.abort(), TIEMPO_MAXIMO_MS) : null;
    try {
      const r = await win.fetch(url, { credentials: 'omit', mode: 'cors', signal: corte ? corte.signal : undefined });
      if (!r.ok) throw new Error(`catálogo ${r.status}`);
      const json = await r.json();
      if (!catalogoValido(json)) throw new Error('catálogo con otra forma');
      return json;
    } finally {
      if (reloj) win.clearTimeout(reloj);
    }
  }

  // La barra nueva va después de la de hoy, que la hoja oculta mientras la nueva
  // exista; sacarla deja la de hoy (scripts/tienda.css).
  function restaurarBarra(doc) {
    const barra = doc.querySelector('.wa-bar[data-tienda-barra]');
    if (barra) barra.remove();
  }

  /** Los controles de un bloque o del hub (contador y anuncio), ya en la página. */
  function controlesDe(raizNodo) {
    const c = raizNodo && raizNodo.querySelector('[data-tienda-controles]');
    if (!c) return null;
    return {
      caja: c,
      campo: c.querySelector('[data-tienda-personas]'),
      menos: c.querySelector('[data-tienda-menos]'),
      mas: c.querySelector('[data-tienda-mas-uno]'),
      vivo: raizNodo.querySelector('[data-tienda-vivo]'),
    };
  }

  /** Dibuja la vitrina en el documento y engancha el contador. Nunca deja un bloque roto. */
  async function iniciar(doc, win) {
    const nodo = doc.getElementById('tienda-config');
    if (!nodo) return null;
    let config;
    try { config = JSON.parse(nodo.textContent); } catch { return null; }

    let catalogo = null;
    try {
      catalogo = await leerCatalogo(win, config);
    } catch (e) {
      registrar(win, e && e.message ? e.message : 'catálogo sin respuesta');
    }
    let mostrar = false;
    if (catalogo) {
      const host = win.LausofPrecios;
      mostrar = Boolean(host && typeof host.puedeMostrarPrecios === 'function'
        && host.puedeMostrarPrecios({ host: win.location.host, catalogoDemo: catalogo.demo }));
      if (!mostrar) registrar(win, 'el catálogo y el sitio no son del mismo entorno (o falta js/precios-host.js)');
    }
    const ctx = contexto(config, catalogo, mostrar, win.location.origin);

    // Un solo estado por página: cada bloque, el hub y el encabezado lo siguen (3c §3).
    const primerServicio = catalogo && config.bloques[0] && config.bloques[0].servicios[0] ? buscar(catalogo, config.bloques[0].servicios[0])
      : catalogo && config.hub && config.hub[0] ? buscar(catalogo, config.hub[0]) : null;
    const estado = {
      n: personasIniciales(leerGuardado(win, 'sessionStorage', GUARDA_PERSONAS), primerServicio),
    };
    const grupos = []; // { tarjetas: [{ nodo, s, e }], controles }

    const apagarControles = (controles) => { if (controles) controles.caja.hidden = true; };

    let primeroConPrecio = false;
    for (const [i, b] of config.bloques.entries()) {
      const zona = doc.querySelector(`[data-tienda-bloque="${i}"]`);
      if (!zona) continue;
      const seccion = zona.closest('section');
      const mas = seccion.querySelector('[data-tienda-mas]');
      const controles = controlesDe(seccion);
      if (!catalogo) {
        zona.innerHTML = estadoError(ctx, b.servicios[0] && b.servicios[0].clave);
        apagarControles(controles);
        if (mas) mas.hidden = true;
      } else {
        const hecho = bloque(catalogo, b.servicios, estado.n, ctx);
        if (!hecho) { seccion.hidden = true; continue; }
        zona.innerHTML = hecho.html;
        // R12 b: las opciones rápidas del chat siguen los servicios de este bloque, en su orden.
        if (i === 0 && hecho.ids.length) seccion.setAttribute('data-asistente-servicios', hecho.ids.join(','));
        if (mas) mas.innerHTML = renglonFinal(ctx);
        const kicker = seccion.querySelector('[data-tienda-kicker]');
        const h2 = seccion.querySelector('h2');
        if (hecho.soloPresupuesto && kicker) kicker.textContent = ctx.textos['tienda.bloque.kicker_presupuesto'];
        if (hecho.montos && ctx.chips) mostrarChip(h2, ctx);
        const servs = servicios(catalogo, b.servicios);
        const nodos = [...zona.querySelectorAll('[data-tienda-tarjeta]')];
        grupos.push({ tarjetas: servs.map(({ s, e }, k) => ({ nodo: nodos[k], s, e })), controles: hecho.conTramos ? controles : null });
        if (!hecho.conTramos) apagarControles(controles);
        if (i === 0) {
          const primero = buscar(catalogo, b.servicios[0]);
          primeroConPrecio = Boolean(primero && primero.precio);
        }
      }
      zona.removeAttribute('aria-busy');
    }

    // El hub de turismo: un contador bajo la bajada mueve las seis tarjetas (3c §3).
    const hubs = [...doc.querySelectorAll('[data-tienda-hub]')];
    if (hubs.length) {
      const tarjetas = [];
      let montos = 0;
      for (const zonaHub of hubs) {
        const entrada = (config.hub || []).find((h) => h.clave === zonaHub.getAttribute('data-tienda-hub'));
        const s = catalogo && entrada ? buscar(catalogo, entrada) : null;
        if (!s || !s.precio) { zonaHub.hidden = true; continue; }
        const z = zonaDe(s, entrada, estado.n, ctx);
        zonaHub.innerHTML = `<div class="tienda-zona" data-tienda-zona>${z.zona}</div><p class="tienda-info" data-tienda-info${z.info ? '' : ' hidden'}>${z.info}</p><a class="${z.accion.clase}" href="${escapar(z.accion.href)}" data-tienda-accion>${z.accion.texto}</a>`;
        montos += z.montos;
        tarjetas.push({ nodo: zonaHub, s, e: entrada });
      }
      const seccion = hubs[0].closest('section');
      const controles = controlesDe(seccion);
      const conTramos = ctx.mostrarPrecios && tarjetas.some(({ s, e }) => tramosDe(s, e).length > 0);
      grupos.push({ tarjetas, controles: conTramos ? controles : null });
      if (!conTramos) apagarControles(controles);
      if (montos && ctx.chips) {
        mostrarChip(seccion && seccion.querySelector('h2'), ctx);
      }
    }

    const cabeza = doc.querySelector('[data-tienda-cabeza]');
    const ir = doc.querySelector('[data-tienda-ir]');

    /** Vuelve a dibujar cada tarjeta, el encabezado y los controles con el estado. */
    function pintar() {
      for (const g of grupos) {
        for (const { nodo, s, e } of g.tarjetas) {
          if (!nodo) continue;
          const z = zonaDe(s, e, estado.n, ctx);
          nodo.querySelector('[data-tienda-zona]').innerHTML = z.zona;
          const info = nodo.querySelector('[data-tienda-info]');
          info.innerHTML = z.info;
          info.hidden = !z.info;
          const a = nodo.querySelector('[data-tienda-accion]');
          a.className = z.accion.clase;
          a.textContent = z.accion.texto;
          a.setAttribute('href', z.accion.href);
          const chat = nodo.querySelector('.tienda-chat');
          if (chat) chat.hidden = !(z.tipo === 'presupuesto' || z.tipo === 'sin_precio');
        }
        const c = g.controles;
        if (!c) continue;
        c.campo.value = String(estado.n);
        c.campo.setAttribute('aria-valuenow', String(estado.n));
        c.campo.setAttribute('aria-valuetext', esUno(ctx, estado.n) ? t(ctx, 'tienda.contador.valuetext.uno') : t(ctx, 'tienda.contador.valuetext.varios', { n: estado.n }));
        c.menos.setAttribute('aria-disabled', String(estado.n <= PERSONAS_MIN));
        c.mas.setAttribute('aria-disabled', String(estado.n >= PERSONAS_MAX));
      }
      if (cabeza && config.cabeza) {
        const html = catalogo ? lineaCabeza(catalogo, config.cabeza, estado.n, ctx) : null;
        if (html) { cabeza.innerHTML = html; cabeza.hidden = false; } else cabeza.hidden = true;
        if (ir && !html) ir.textContent = ctx.textos['tienda.cabeza.boton_sin_monto'];
      }
    }

    // Un anuncio por grupo con controles, 500 ms después del último cambio; nada al cargar.
    let relojAnuncio = null;
    function anunciar(g) {
      if (!g.controles || !g.controles.vivo) return;
      win.clearTimeout(relojAnuncio);
      relojAnuncio = win.setTimeout(() => {
        g.controles.vivo.textContent = textoVivo(g.tarjetas.map(({ s, e }) => zonaDe(s, e, estado.n, ctx)), estado.n, ctx);
      }, ESPERA_ANUNCIO_MS);
    }

    function fijarPersonas(n, g) {
      const cambio = n !== estado.n;
      estado.n = n;
      pintar();
      guardar(win, 'sessionStorage', GUARDA_PERSONAS, String(n));
      if (cambio) anunciar(g);
    }

    for (const g of grupos) {
      const c = g.controles;
      if (!c) continue;
      c.campo.disabled = false;
      c.menos.disabled = false;
      c.mas.disabled = false;
      c.caja.removeAttribute('data-inerte');
      let ultimo = estado.n;
      let relojTipeo = null;
      const confirmar = () => {
        win.clearTimeout(relojTipeo);
        const n = personasValidas(c.campo.value) || ultimo;
        const cambio = n !== ultimo;
        ultimo = n;
        estado.n = n;
        pintar();
        guardar(win, 'sessionStorage', GUARDA_PERSONAS, String(n));
        if (cambio) anunciar(g);
      };
      const paso = (d) => {
        const n = Math.min(PERSONAS_MAX, Math.max(PERSONAS_MIN, estado.n + d));
        if (n === estado.n) return;
        ultimo = n;
        fijarPersonas(n, g);
      };
      c.menos.addEventListener('click', () => paso(-1));
      c.mas.addEventListener('click', () => paso(1));
      c.campo.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowUp') { ev.preventDefault(); paso(1); } else if (ev.key === 'ArrowDown') { ev.preventDefault(); paso(-1); } else if (ev.key === 'Enter') { ev.preventDefault(); confirmar(); }
      });
      // Mientras se tipea, las tarjetas siguen al número; el valor queda con
      // Enter, al salir del campo o 700 ms sin teclas. Lo inválido vuelve, en
      // silencio, al último válido al salir (3c §6).
      c.campo.addEventListener('input', () => {
        const limpio = c.campo.value.replace(/\D/g, '').slice(0, 2);
        if (limpio !== c.campo.value) c.campo.value = limpio;
        const n = personasValidas(limpio);
        win.clearTimeout(relojTipeo);
        if (!n) return;
        estado.n = n;
        pintar();
        relojTipeo = win.setTimeout(confirmar, ESPERA_TIPEO_MS);
      });
      c.campo.addEventListener('blur', confirmar);
    }

    pintar();
    // Nada se anuncia al cargar: el «Cargando precios…» se va en silencio (3c §5).
    for (const v of doc.querySelectorAll('[data-tienda-vivo]')) v.textContent = '';

    // La barra con «Reservar» sólo si el primer servicio de la página tiene precio (3a §6.1).
    if (!primeroConPrecio) restaurarBarra(doc);
    return { estado, pintar };
  }

  const api = {
    escapar, normalizar, catalogoValido, buscar, tramosDe, maximoDe, tramoPara, personasIniciales, personasValidas,
    urlReservar, zonaDe, textoVivo,
    tarjeta, bloque, renglonFinal, estadoError, lineaCabeza, contexto, leerGuardado, guardar, iniciar,
    PERSONAS_MAX, GUARDA_PERSONAS,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    raiz.LausofTienda = api;
    iniciar(raiz.document, raiz);
  }
})(this);
