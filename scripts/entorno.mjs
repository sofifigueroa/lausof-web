/* =============================================================================
   PERFILES DE ENTORNO — producción (www.lausof.com) y la demo de la vitrina
   -----------------------------------------------------------------------------
   El único lugar donde producción y la demo difieren. La vitrina (catálogo,
   «Reservar», chat) y el armado de la demo (scripts/demo.mjs) leen de acá sus
   hosts y sus llaves de encendido; nada más en el repo nombra un host de la
   demo. Diseño: ~/lausof/web/demo-reservas-2026-11-06/3b-diseno-entorno.md §1.2.

   Excepción a la regla «sin entornos de prueba» pedida por Lautaro el
   06/11/2026: ver CLAUDE.md de este repo. Se cierra el día que la vitrina se
   enciende en producción (3b §7): ese mismo release borra el perfil demo.

   Lo que vale para los dos:
   - `tienda.clave` es la clave PÚBLICA del chat (asistente_sitios.clave_publica
     de Apacheta). Es pública por diseño, como el ID de GA4.
   - Ningún precio vive en el repo: la vitrina lee el catálogo de
     `{tienda.sitio}/api/publico/{empresa}/catalogo` en el navegador.
   - `pendientes` dice qué falta para que el perfil esté completo. Mientras haya
     algo, `node scripts/demo.mjs comprobar` sale en rojo y lo nombra.
   ============================================================================= */

export const HOST_PRODUCCION = 'https://www.lausof.com';
export const GA4_PRODUCCION = 'G-GHHRS5LDE7';

// Sitio de Netlify de producción (WEB-LANE-HANDOFF, «Procedimiento de deploy»).
// `publicar` rehúsa este id pase lo que pase.
export const NETLIFY_PRODUCCION = { id: '0abef4b8-2f02-4123-9f79-fcfd58750ac8', nombre: 'lausof' };

// Orígenes de Apacheta (handoff de Apacheta asistente-demo-plan-0611.md §3):
// las rutas son las mismas en los dos, cambian sólo las dos URL base.
export const APACHETA = {
  produccion: { app: 'https://app.getapacheta.com', sitio: 'https://getapacheta.com' },
  demo: { app: 'https://apacheta-demo.vercel.app', sitio: 'https://apacheta-demo-sitio.vercel.app' },
};

export const PERFILES = {
  produccion: {
    nombre: 'produccion',
    host: HOST_PRODUCCION,
    indexar: true,          // robots con Sitemap, sitemap.xml, IndexNow, Search Console
    ga4: GA4_PRODUCCION,
    marcaDemo: false,
    netlify: NETLIFY_PRODUCCION,
    tienda: {
      activa: false,        // pasa a true sólo en el release que enciende la vitrina (3b §7)
      ...APACHETA.produccion,
      empresa: 'lausof',
      clave: null,
    },
    pendientes: [],
  },
  demo: {
    nombre: 'demo',
    // Sitio de Netlify creado el 06/11/2026 por el CLI en el equipo Free
    // «Proyecto 0», sin git ni dominio propio.
    host: 'https://lausof-demo-uvhgjf.netlify.app',
    indexar: false,
    // Opción B de 3b §4: sin GA4 en la demo. La cuenta de servicio de
    // medición es Viewer de la propiedad y la Admin API respondió 403 al crear
    // una propiedad aparte (06/11/2026). Con un ID de demo, va acá y O1 cambia
    // el ID en vez de sacar las dos líneas de gtag.
    ga4: null,
    marcaDemo: true,
    netlify: { id: '6050134e-9ca4-4c37-b621-ae3536fb8e29', nombre: 'lausof-demo-uvhgjf' },
    // Llave del enlace de acceso (3b §3): en el Llavero de la Mac y en la
    // variable DEMO_LLAVE del sitio de Netlify. Nunca en el repo.
    llave: { servicio: 'lausof-demo-llave', cuenta: 'lausof-web', variable: 'DEMO_LLAVE' },
    tienda: {
      activa: true,
      ...APACHETA.demo,
      empresa: 'lausof',
      clave: null,
    },
    // Lo que falta de Apacheta (main lo pasa en una línea). Al llegar, se
    // completa el valor de arriba y se borra su renglón.
    pendientes: [
      'hosts de la demo de Apacheta sin confirmar (APP y SITIO son los del plan de Apacheta §3; main confirma que están en línea)',
      'clave pública del chat de la demo sin recibir (tienda.clave = null: el chat no se incrusta)',
    ],
  },
};

export const perfil = (nombre) => {
  const p = PERFILES[nombre];
  if (!p) throw new Error(`perfil desconocido: ${nombre} (hay: ${Object.keys(PERFILES).join(', ')})`);
  return p;
};

// Hosts de producción de lausof.com. Cualquier otro host (la demo, localhost)
// no es producción. Lo usa js/precios-host.js con la misma lista.
export const HOSTS_PRODUCCION = ['www.lausof.com', 'lausof.com'];
