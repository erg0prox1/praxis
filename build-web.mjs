// Copia los archivos web a ./www (carpeta que Capacitor empaqueta dentro del APK).
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const OUT = 'www';
const FILES = ['index.html','styles.css','app.js','db.js','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of FILES) cpSync(f, `${OUT}/${f}`);
cpSync('vendor', `${OUT}/vendor`, { recursive: true });
console.log(`www listo: ${FILES.length} archivos + vendor/`);
