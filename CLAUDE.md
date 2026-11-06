# web-sofi: guía para agentes

El sitio de Lausof SRL (www.lausof.com). Cómo se trabaja, se prueba y se publica: `README.md` («Publicación») y `~/lausof/WEB-LANE-HANDOFF.md`. Este archivo no se publica: producción sube sólo la exportación permitida de `scripts/publicacion.mjs`, nunca la raíz (`--dir .` está prohibido).

## Sin entornos de prueba, con una excepción: la demo de la vitrina

La regla global es que no hay staging, previews ni entornos de desarrollo: Lautaro revisa sólo producción (`~/.claude/CLAUDE.md`, «No preview/staging/dev deploys by default»). Para este repo hay **una** excepción, pedida por él el 06/11/2026 a las 10:20 (`~/lausof/web/demo-reservas-2026-11-06/LAUTARO-2026-11-06.md`):

> «let's aim to show it on a "dev" environment (not is lausof.com) so that when it's ready, I can use it there, as well as some agents to QA i (not behave as users, just QA), and then, I will pass it to the family, and natalia so to test it our themselves.»
>
> «This dev/non-prod environment for demo should have the latest from the main branch that lausof.com uses, and have on top this bot, and the self checkout experience in the site.»

**Alcance, y nada más:**
- Un solo sitio de Netlify, `lausof-demo-uvhgjf` (id `6050134e-9ca4-4c37-b621-ae3536fb8e29`), en el equipo Free, sin git y sin dominio propio. Sólo para la vitrina (catálogo, elegir, comprar) y el asistente.
- Lleva el mismo sha que producción más el manifiesto cerrado de `scripts/demo.mjs` (O1–O12): marca de demo, noindex, sin sitemap, sin IndexNow, sin Search Console, sin GA4 de producción, hosts de la demo de Apacheta. El manifiesto cambia valores, nunca comportamiento.
- Datos de demo solamente: precios de prueba del catálogo de la demo de Apacheta, Mercado Pago en modo prueba del lado de Apacheta. Este repo no guarda ningún precio.
- Se entra con un enlace con llave (edge function `demo/llave.mjs`); sin llave, 401. La llave vive en el Llavero (`lausof-demo-llave` / `lausof-web`) y en la variable `DEMO_LLAVE` del sitio; nunca se imprime ni se escribe en un archivo.
- Ningún otro preview, staging o deploy de rama. Una segunda demo o una demo permanente es otra excepción que sólo Lautaro da.

**Reglas de la demo:**
- Todo lo que difiere entre producción y la demo está en `scripts/entorno.mjs`. Ninguna página, cabecera, robots, js ni css nombra un host de la demo (guardia G2); este archivo y los tests sí, y no se publican.
- Nada de la demo vive en `netlify/` ni en un `netlify.toml` del repo: el CLI empaquetaría la edge function también en el deploy de producción (netlify/cli #7933). G5 lo impide.
- Producción nunca espera a la demo. Orden completo en README «El orden de cada deploy»: merge → gate → push (avance rápido) → `publicacion.mjs publicar` → `publicacion.mjs comprobar` → demo. Después de cada deploy de producción, el mismo integrador, desde el mismo árbol limpio:
  1. `node scripts/demo.mjs publicar --sha <sha40>`
  2. `node scripts/demo.mjs comprobar --sha <sha40>` y copia sus líneas en el bloque del deploy de WEB-LANE-HANDOFF.

  Si alguno sale en rojo, producción queda como está, se anota «demo atrasada en <sha>: <motivo>» en WEB-LANE-HANDOFF y una lane nueva lo arregla.
- Orden de quién la ve: los agentes de QA primero (QA, no actuación), después Lautaro, después la familia y Natalia, que la recibe de él. Ningún agente le escribe a la familia.
- Las guardias G1–G13 están en `tests/entorno.test.js` y `tests/demo.test.js`; la lista de permitidos que comparten producción y la demo, en `tests/publicacion.test.js`.

**Cierre:** el release que enciende la vitrina en producción (`PERFILES.produccion.tienda.activa = true`) cierra la demo en la misma lane: borra el sitio de Netlify por la API, la llave del Llavero, `demo/`, `scripts/demo.mjs`, el perfil demo y sus guardias (G1–G3, G5 y G9 quedan), y marca esta sección «cerrada <fecha>». Diseño completo: `~/lausof/web/demo-reservas-2026-11-06/3b-diseno-entorno.md` §7.
