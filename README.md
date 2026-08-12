# Lausof SRL — Sitio web

Rediseño del sitio de [Lausof SRL](https://www.lausof.com), empresa de transporte y logística de Salta, Argentina (pasajeros, cargas generales y refrigeradas, 4x4, auxilio y remolques).

## Objetivo del rediseño

- **Conversión por WhatsApp**: cada servicio tiene su botón con mensaje pre-armado, para que las consultas lleguen clasificadas.
- **Confianza**: habilitaciones, seguros, flota a la vista y testimonios reales.
- **Identidad**: paleta derivada del logo (azul marino, azules, dorado insignia).

## Estructura

```
lausof-web/
├── index.html          # página principal (única, one-page)
├── css/
│   └── styles.css      # estilos (tokens de color/tipografía arriba del archivo)
└── assets/
    ├── logo-horizontal.png       # original
    ├── logo-horizontal-web.png   # optimizado (720px, navbar/footer)
    ├── logo-insignia.png         # original
    └── logo-insignia-web.png     # optimizado (480px, hero/favicon)
```

## Cómo verlo en local

Abrir `index.html` en el navegador (doble click), o servirlo:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Pendientes

El sitio ya está online, así que nada de esto va al HTML hasta tenerlo
confirmado: mejor que falte un dato a que figure uno equivocado.

Datos que tiene que pasar papá:

- [ ] N° de habilitación CNRT vigente → vuelve a la franja de habilitaciones
- [ ] Aseguradora + N° de póliza → misma franja
- [ ] CUIT → al footer (los compradores lo copian para verificar la empresa)
- [ ] Año de constitución de la SRL → "Desde 19XX" en el hero
- [ ] Horario de atención y quién atiende el WhatsApp (por eso sacamos el "24 hs")
- [ ] Qué unidades tienen GPS hoy y de qué proveedor (hoy el sitio lo afirma de todas)
- [ ] Link del perfil de Google Business, para linkear las reseñas

Del lado técnico:

- [ ] DNS: apuntar `lausof.com` acá (ver más abajo — ojo con el mail)

## Publicación

El dominio `lausof.com` ya existe (hoy apunta a Wix). Plan:

1. Subir este repo a GitHub y activar **GitHub Pages** (o conectar a **Netlify/Cloudflare Pages**) — hosting gratuito.
2. Probar en la URL provisoria (`*.github.io` / `*.netlify.app`).
3. Con el OK de la familia, apuntar el DNS de `lausof.com` al nuevo hosting (requiere acceso al registrador del dominio).
