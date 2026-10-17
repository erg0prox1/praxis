<img width="606" height="1280" alt="manual01" src="https://github.com/user-attachments/assets/4a5a45a6-9da5-4d62-9cc6-00c689fdd49a" />
<img width="606" height="1280" alt="manual02" src="https://github.com/user-attachments/assets/bcc877c4-9acf-4f8b-9901-386507947892" />
# Manuales Rápidos

App para generar manuales con fotos y descripciones simples, paso a paso (PASO 1, PASO 2...).

- Ficha con título, descripción del escenario y tag (ELECTRICO, TI, OPERACION, DIAGNOSTICO, COTIZACION y los que agregues).
- Cada paso: foto + descripción, con editar y eliminar.
- Fecha y hora automáticas en cada ficha y paso.
- Consulta por tag o histórico.
- Exporta a PDF (fotos + información + diagrama esquemático) y lo comparte por mensaje o correo.
- Los datos se guardan en el propio dispositivo (IndexedDB).

## Estructura
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `styles.css` | Pantalla y estilos |
| `app.js` | Lógica: pantallas, pasos, tags, diagrama y PDF |
| `db.js` | Base de datos local (IndexedDB) |
| `vendor/jspdf.umd.min.js` | Generador de PDF (incluido, funciona sin internet) |
| `manifest.webmanifest`, `sw.js`, `icon*` | Versión instalable (PWA) |
| `build-web.mjs` | Copia los archivos web a `www/` para empaquetarlos |
| `capacitor.config.json`, `package.json` | Configuración del APK |
| `.github/workflows/build-apk.yml` | Compila el APK en GitHub Actions |

## Obtener el APK
1. Sube todos estos archivos al repositorio (incluida la carpeta `vendor` y `assets`).
2. Crea el archivo `.github/workflows/build-apk.yml` (Add file → Create new file) y pega el contenido del workflow.
3. Entra a **Actions** → *Build APK*. Corre solo con cada commit, o con *Run workflow*. Tarda de 5 a 8 minutos.
4. Descarga `app-debug.apk` desde **Releases** (o desde el run, en *Artifacts*).
5. Instálalo en Android permitiendo "instalar apps de orígenes desconocidos".

## Probar en el navegador
Sirve la carpeta con cualquier servidor estático (por ejemplo `npx serve .`) y abre la URL en el celular.
