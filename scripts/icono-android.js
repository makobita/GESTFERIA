// Pone el icono de la app y la pantalla de arranque (carpeta recursos/android-res) en el proyecto Android.
// Se ejecuta después de "npx cap add android".
const fs = require('fs');
const path = require('path');
const origen = path.join(__dirname, '..', 'recursos', 'android-res');
const destino = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
if (!fs.existsSync(destino)) { console.error('No existe ' + destino + '. Ejecuta antes: npx cap add android'); process.exit(1); }
fs.cpSync(origen, destino, { recursive: true, force: true });
console.log('Icono y pantalla de arranque copiados');
