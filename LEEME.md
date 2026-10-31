# GestFeria: app para Android

Proyecto completo de la app. Al subirlo a GitHub, el archivo de instalación (APK) se crea solo.

## Qué hay en cada carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `www/index.html` | La app entera |
| `recursos/` | Icono de la app, pantalla de arranque y clave de firma (`debug.keystore`, para que las actualizaciones se instalen encima) |
| `scripts/` | Ajustes automáticos: permisos de Bluetooth, pantalla horizontal, icono |
| `.github/workflows/` | Las instrucciones para que GitHub cree el APK |
| `package.json`, `capacitor.config.json` | Configuración del proyecto Android |

## Subir a GitHub desde cero

1. Entra en https://github.com y pulsa **New** (o el **+** de arriba a la derecha → **New repository**).
2. Ponle un nombre, por ejemplo `venta-tickets`, marca **Private** y pulsa **Create repository**.
3. En la página del repositorio vacío pulsa el enlace **uploading an existing file**.
4. Abre la carpeta `venta-tickets-app` en tu ordenador, **selecciona todo su contenido**
   (no la carpeta en sí, sino lo que hay dentro) y arrástralo a la página de GitHub.
   Tienen que verse subiendo las carpetas `www`, `recursos`, `scripts`, `.github` y los archivos sueltos.
5. Espera a que termine de cargar y pulsa **Commit changes**.

> La carpeta `.github` empieza por punto y en algunos ordenadores está oculta.
> En Windows: Explorador → **Vista → Mostrar → Elementos ocultos**.
> En Mac: en la carpeta pulsa **Cmd + Mayús + .** (punto).

## Descargar el APK

1. En el repositorio, pestaña **Actions**. Verás «Compilar APK» en marcha (círculo amarillo).
2. Espera 5–8 minutos a que salga el **check verde ✓** y pulsa sobre él.
3. Abajo, en **Artifacts**, descarga **venta-tickets-apk** (es un .zip).
4. Descomprímelo: dentro está **`app-debug.apk`**.

## Instalar en la tablet

1. Pasa `app-debug.apk` a la tablet (cable, Google Drive, WhatsApp…) y ábrelo.
2. Android pedirá permitir **instalar aplicaciones de origen desconocido**: acéptalo.
3. **Solo esta primera vez:** si ya tenías instalada una versión anterior de la app y Android dice
   «No se ha instalado la aplicación», desinstala la anterior e instala esta. Al desinstalar se borran
   los datos guardados (precios, cierres…). A partir de aquí todas las actualizaciones se instalan encima.

## Primer uso

1. **Vincula la impresora** en Ajustes de Android → Bluetooth (código habitual `0000` o `1234`).
2. En la app: **Impresora → Conectar**. Android pide permiso de **Dispositivos cercanos**: **Permitir**.
3. Elige tu impresora. Si no aparece y es de bajo consumo, pulsa **Buscar impresoras BLE**.
4. **Configuración → Configurar ticket → Imprimir ticket de prueba** para ver cómo sale.

## Actualizar la app más adelante

Sube el `index.html` nuevo a la carpeta **www** (**Add file → Upload files → Commit changes**).
GitHub vuelve a crear el APK solo. Instálalo **encima** del anterior, sin desinstalar, y no se pierde nada.

## Cambiar el icono

Sustituye las imágenes de `recursos/android-res/` (o pide que te las generen de nuevo a partir de otra imagen)
y vuelve a subirlas.

## Crear el APK en el ordenador (opcional)

Con **Node.js** y **Android Studio** instalados, en Visual Studio Code: `npm install` y después `npm run apk`.
El archivo `venta-tickets.apk` aparece en la carpeta del proyecto.


## Spotify dentro de la app

- Hace falta una cuenta **Spotify Premium**.
- La app de Spotify (developer.spotify.com/dashboard) debe tener marcados **Web API** y **Web Playback SDK**, y en **Redirect URIs** exactamente:
  `es.feria.ventatickets://spotify-callback`
- El Client ID ya va puesto en la app. En la tablet: Audio → Música → Spotify → **Iniciar sesión con Spotify**.
- Si al entrar con tu cuenta Spotify dice que tu usuario no tiene acceso, añádelo en el panel de la app de Spotify, en **User Management**, con el correo de tu cuenta.


## Actualizar la app sin desinstalarla

Cada APK se firma siempre con la misma clave (`recursos/debug.keystore`, configurada por `scripts/firma-android.js`)
y lleva un número de versión más alto que el anterior, así que se instala encima conservando todos los datos.
Si la tablet tiene una versión antigua firmada con otra clave, hay que desinstalarla **una última vez**.

## Verificación del correo del administrador

1. Abre `servidor/verificar-correo.php`, cambia `CLAVE` por una clave tuya y `REMITENTE` por un correo de tu dominio.
2. Súbelo a tu hosting (por ejemplo a `https://tudominio.es/app/verificar-correo.php`).
3. En la app: Configuración → Desarrollador → Servidor de correo, pon esa dirección y la misma clave.

Sin servidor configurado, el correo del administrador se guarda sin verificar.
