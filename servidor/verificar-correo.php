<?php
// GestFeria · Envío del código de verificación de correo (SMTP con autenticación).
// Súbelo a la carpeta de la web: https://gestferia.es/verificar-correo.php
const CLAVE = '42e5f3e4ea58675a4d93cb7a';                       // la misma que lleva la app
const SMTP_HOST = 'ssl://smtp.serviciodecorreo.es';
const SMTP_PORT = 465;
const SMTP_USER = 'usuarios@gestferia.es';
const SMTP_PASS = 'Gestferia2026.';
const REMITENTE = 'usuarios@gestferia.es';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
function smtp($s, $cmd, $esperado) { if ($cmd !== null) fwrite($s, $cmd . "\r\n"); $r = ''; while (($l = fgets($s, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } if (substr($r, 0, 3) !== $esperado) throw new Exception(trim($r)); }
function salir($ok, $error = '', $c = 200) { http_response_code($c); echo json_encode(['ok' => $ok, 'error' => $error]); exit; }
// Diagnóstico: abre en el navegador verificar-correo.php?diag=CLAVE para probar la conexión con el servidor de correo (no envía nada)
if (isset($_GET['diag'])) {
  if (!hash_equals(CLAVE, (string)$_GET['diag'])) salir(false, 'clave', 403);
  try { $s = stream_socket_client(SMTP_HOST . ':' . SMTP_PORT, $en, $es, 20); if (!$s) throw new Exception('conexión: ' . $es);
    smtp($s, null, '220'); smtp($s, 'EHLO gestferia.es', '250'); smtp($s, 'AUTH LOGIN', '334'); smtp($s, base64_encode(SMTP_USER), '334'); smtp($s, base64_encode(SMTP_PASS), '235'); smtp($s, 'QUIT', '221');
    salir(true, 'conexión y usuario correctos'); } catch (Exception $e) { salir(false, $e->getMessage(), 500); }
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') salir(false, 'método', 405);
$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d) || !hash_equals(CLAVE, (string)($d['clave'] ?? ''))) salir(false, 'clave', 403);
$email = trim((string)($d['email'] ?? '')); $codigo = (string)($d['codigo'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $codigo)) salir(false, 'datos', 400);

// Como mucho 5 envíos por hora desde la misma conexión
$dir = sys_get_temp_dir() . '/gestferia-correo'; @mkdir($dir, 0700, true);
$f = $dir . '/' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
$env = array_filter(@json_decode(@file_get_contents($f), true) ?: [], fn($t) => $t > time() - 3600);
if (count($env) >= 5) salir(false, 'demasiados envíos', 429);
$env[] = time(); @file_put_contents($f, json_encode(array_values($env)));

try {
  $s = stream_socket_client(SMTP_HOST . ':' . SMTP_PORT, $en, $es, 20); if (!$s) throw new Exception($es);
  smtp($s, null, '220'); smtp($s, 'EHLO gestferia.es', '250');
  smtp($s, 'AUTH LOGIN', '334'); smtp($s, base64_encode(SMTP_USER), '334'); smtp($s, base64_encode(SMTP_PASS), '235');
  smtp($s, 'MAIL FROM:<' . REMITENTE . '>', '250'); smtp($s, 'RCPT TO:<' . $email . '>', '250'); smtp($s, 'DATA', '354');
  $asunto = '=?UTF-8?B?' . base64_encode('Tu código de GestFeria: ' . $codigo) . '?=';
  $txt = "Hola:\r\n\r\nTu código para verificar el correo en GestFeria es:\r\n\r\n    $codigo\r\n\r\nCaduca en 15 minutos. Si no lo has pedido, ignora este mensaje.\r\n\r\nGestFeria · info@gestferia.es";
  $msg = "From: GestFeria <" . REMITENTE . ">\r\nTo: <$email>\r\nSubject: $asunto\r\nDate: " . date('r') . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" . str_replace("\r\n.", "\r\n..", $txt) . "\r\n.";
  smtp($s, $msg, '250'); smtp($s, 'QUIT', '221'); fclose($s);
} catch (Exception $e) { salir(false, 'no se pudo enviar: ' . $e->getMessage(), 500); }
salir(true);
