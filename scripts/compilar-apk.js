// Crea el APK con un solo comando:  npm run apk
// Busca solo el SDK de Android y el Java que trae Android Studio.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const win = process.platform === 'win32';
const mac = process.platform === 'darwin';
const raiz = path.join(__dirname, '..');
const run = (cmd, cwd, env) => execSync(cmd, { stdio: 'inherit', cwd: cwd || raiz, env: env || process.env, shell: true });
const existe = p => p && fs.existsSync(p);
const fallo = msg => { console.error('\n\u274C ' + msg + '\n'); process.exit(1); };

// 1) SDK de Android
const sdkPosibles = [
  process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
  win ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : null,
  mac ? path.join(os.homedir(), 'Library', 'Android', 'sdk') : null,
  !win && !mac ? path.join(os.homedir(), 'Android', 'Sdk') : null
];
const sdk = sdkPosibles.find(existe);
if (!sdk) fallo('No encuentro el SDK de Android. Instala Android Studio, \u00e1brelo una vez y deja que termine el asistente de configuraci\u00f3n (descarga el SDK). Despu\u00e9s vuelve a ejecutar: npm run apk');

// 2) Java (el que viene con Android Studio)
const javaPosibles = [
  process.env.JAVA_HOME,
  win ? 'C:\\Program Files\\Android\\Android Studio\\jbr' : null,
  win ? 'C:\\Program Files\\Android\\Android Studio1\\jbr' : null,
  mac ? '/Applications/Android Studio.app/Contents/jbr/Contents/Home' : null,
  !win && !mac ? '/opt/android-studio/jbr' : null,
  !win && !mac ? path.join(os.homedir(), 'android-studio', 'jbr') : null
];
const java = javaPosibles.find(existe);
if (!java) fallo('No encuentro Java. Instala Android Studio (trae su propio Java) en la ruta por defecto, o instala Java 17 y define JAVA_HOME.');

const env = { ...process.env, JAVA_HOME: java, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk };
console.log('\u2714 SDK de Android: ' + sdk);
console.log('\u2714 Java: ' + java + '\n');

// 3) Proyecto Android (solo la primera vez)
if (!existe(path.join(raiz, 'node_modules'))) fallo('Falta instalar las dependencias. Ejecuta primero: npm install');
if (!existe(path.join(raiz, 'android'))) {
  console.log('Creando el proyecto Android (solo la primera vez)...');
  run('npx cap add android', raiz, env);
  run('node scripts/permisos-android.js', raiz, env);
}
run('node scripts/icono-android.js', raiz, env);
run('node scripts/firma-android.js', raiz, env);
run('npx cap sync android', raiz, env);

// 4) local.properties con la ruta del SDK
const sdkProp = win ? sdk.replace(/\\/g, '\\\\').replace(/:/g, '\\:') : sdk;
fs.writeFileSync(path.join(raiz, 'android', 'local.properties'), 'sdk.dir=' + sdkProp + '\n');

// Misma clave de firma que en GitHub, para poder instalar encima (solo si no hay ya una)
const clave = path.join(os.homedir(), '.android', 'debug.keystore');
if (!existe(clave)) { fs.mkdirSync(path.dirname(clave), { recursive: true }); fs.copyFileSync(path.join(raiz, 'recursos', 'debug.keystore'), clave); }

// 5) Compilar
console.log('\nCompilando el APK (la primera vez tarda varios minutos)...\n');
run(win ? 'gradlew.bat assembleDebug' : 'chmod +x gradlew && ./gradlew assembleDebug', path.join(raiz, 'android'), env);

// 6) Copiar el APK a la carpeta del proyecto
const apk = path.join(raiz, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!existe(apk)) fallo('La compilaci\u00f3n termin\u00f3 pero no encuentro el APK.');
const destino = path.join(raiz, 'venta-tickets.apk');
fs.copyFileSync(apk, destino);
console.log('\n\u2705 Listo. El archivo para instalar en Android est\u00e1 en:\n   ' + destino + '\n');
