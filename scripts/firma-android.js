// Firma fija y número de versión creciente para que cada APK nuevo se instale ENCIMA del anterior.
// - Firma: se indica directamente en el proyecto la clave recursos/debug.keystore, así no depende
//   de dónde se compile (GitHub o el ordenador).
// - Versión: cada compilación lleva un número más alto (Android no deja instalar una
//   versión "más vieja" encima de una nueva).
// Se ejecuta después de "npx cap add android".
const fs = require('fs');
const path = require('path');
const ruta = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(ruta)) { console.error('No existe ' + ruta + '. Ejecuta antes: npx cap add android'); process.exit(1); }
let g = fs.readFileSync(ruta, 'utf8');

if (!g.includes('firmaGestFeria')) {
  const firma = [
    '    signingConfigs {',
    '        firmaGestFeria {',
    "            storeFile rootProject.file('../recursos/debug.keystore')",
    "            storePassword 'android'",
    "            keyAlias 'androiddebugkey'",
    "            keyPassword 'android'",
    '        }',
    '    }',
    '    buildTypes {',
    '        debug {',
    '            signingConfig signingConfigs.firmaGestFeria',
    '        }'
  ].join('\n');
  if (!/\n\s*buildTypes\s*\{/.test(g)) { console.error('No se encuentra buildTypes en build.gradle'); process.exit(1); }
  g = g.replace(/\n\s*buildTypes\s*\{/, '\n' + firma);
  console.log('Firma fija configurada');
}

// Número de versión según la fecha y la hora de la compilación (en minutos): siempre más alto que el anterior,
// se compile en GitHub o en el ordenador
const n = Math.floor(Date.now() / 60000) - 29000000;
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + n);
// Versión visible (Acerca de): la del archivo version.txt (por ejemplo 0.5.1)
const vf = path.join(__dirname, '..', 'version.txt');
const nombreVersion = fs.existsSync(vf) ? fs.readFileSync(vf, 'utf8').trim() : '0.5.1';
g = g.replace(/versionName\s+"[^"]*"/, 'versionName "' + nombreVersion + '"');
fs.writeFileSync(ruta, g);
console.log('Versión ' + n);
