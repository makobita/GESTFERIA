// Ajusta el AndroidManifest.xml: permisos de Bluetooth para la impresora y pantalla siempre en horizontal.
// Se ejecuta una vez, después de "npx cap add android".
const fs = require('fs');
const ruta = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(ruta)) { console.error('No existe ' + ruta + '. Ejecuta antes: npx cap add android'); process.exit(1); }
let xml = fs.readFileSync(ruta, 'utf8');
const permisos = [
  '<uses-permission android:name="android.permission.BLUETOOTH" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" android:maxSdkVersion="30" />',
  '<uses-feature android:name="android.hardware.bluetooth" android:required="false" />',
  '<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />'
];
let añadidos = 0;
for (const p of permisos) {
  const nombre = p.match(/android:name="([^"]+)"/)[1];
  if (!xml.includes('"' + nombre + '"')) { xml = xml.replace('</manifest>', '    ' + p + '\n</manifest>'); añadidos++; }
}
// Siempre en horizontal: la app gira entre los dos lados horizontales, pero nunca se pone en vertical
if (!/android:screenOrientation=/.test(xml)) {
  xml = xml.replace(/<activity\b/, '<activity android:screenOrientation="sensorLandscape"');
  console.log('Orientación fijada en horizontal');
}
// Vuelta del inicio de sesión de Spotify: el enlace es.feria.ventatickets://spotify-callback abre la app
if (!xml.includes('spotify-callback')) {
  const filtro = [
    '            <intent-filter>',
    '                <action android:name="android.intent.action.VIEW" />',
    '                <category android:name="android.intent.category.DEFAULT" />',
    '                <category android:name="android.intent.category.BROWSABLE" />',
    '                <data android:scheme="es.feria.ventatickets" android:host="spotify-callback" />',
    '            </intent-filter>'
  ].join('\n');
  xml = xml.replace(/(<activity\b[\s\S]*?)(\s*<\/activity>)/, (m, a, b) => a + '\n' + filtro + b);
  console.log('Enlace de vuelta de Spotify añadido');
}
fs.writeFileSync(ruta, xml);
console.log('Permisos de Bluetooth añadidos: ' + añadidos);

// Pantalla siempre encendida mientras la app está abierta (para la venta y la música en la feria)
const path = require('path');
const javaDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java');
const buscarActividad = d => { for (const f of fs.readdirSync(d, { withFileTypes:true })) { const r = path.join(d, f.name); if (f.isDirectory()) { const x = buscarActividad(r); if (x) return x; } else if (f.name === 'MainActivity.java') return r; } return null; };
const act = fs.existsSync(javaDir) ? buscarActividad(javaDir) : null;
if (act) {
  let j = fs.readFileSync(act, 'utf8');
  const paquete = (j.match(/^package\s+[^;]+;/m) || [''])[0];
  // Actividad: pantalla siempre encendida y complemento de foco de audio
  j = paquete + '\n\nimport android.os.Bundle;\nimport android.view.WindowManager;\nimport com.getcapacitor.BridgeActivity;\n\n' +
    'public class MainActivity extends BridgeActivity {\n' +
    '    @Override\n' +
    '    public void onCreate(Bundle savedInstanceState) {\n' +
    '        registerPlugin(AudioFocoPlugin.class);\n' +
    '        super.onCreate(savedInstanceState);\n' +
    '        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n' +
    '    }\n' +
    '}\n';
  fs.writeFileSync(act, j);
  // Foco de audio: al sonar el sampler, Spotify u otra app se pausan y continúan al terminar
  fs.writeFileSync(path.join(path.dirname(act), 'AudioFocoPlugin.java'), paquete + `

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioFoco")
public class AudioFocoPlugin extends Plugin {
    private AudioFocusRequest peticion;
    private AudioManager am() { return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE); }

    @PluginMethod
    public void pedir(PluginCall call) {
        AudioManager a = am();
        if (Build.VERSION.SDK_INT >= 26) {
            if (peticion == null) peticion = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();
            a.requestAudioFocus(peticion);
        } else {
            a.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        }
        call.resolve();
    }

    @PluginMethod
    public void soltar(PluginCall call) {
        AudioManager a = am();
        if (Build.VERSION.SDK_INT >= 26) { if (peticion != null) a.abandonAudioFocusRequest(peticion); }
        else a.abandonAudioFocus(null);
        call.resolve();
    }
}
`);
  console.log('Pantalla encendida y foco de audio configurados');
}
