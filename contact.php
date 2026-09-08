<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(bool $ok, string $message = ''): void {
    http_response_code($ok ? 200 : 400);
    echo json_encode(['success' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Methode nicht erlaubt.');
}

// Honeypot-Feld: für Menschen unsichtbar, Bots füllen es oft trotzdem aus
if (trim($_POST['website'] ?? '') !== '') {
    respond(true); // so tun, als wäre alles gut, aber nichts verschicken
}

$vorname   = trim($_POST['vorname'] ?? '');
$nachname  = trim($_POST['nachname'] ?? '');
$email     = trim($_POST['email'] ?? '');
$telefon   = trim($_POST['telefon'] ?? '');
$betreff   = trim($_POST['betreff'] ?? '');
$nachricht = trim($_POST['nachricht'] ?? '');

if ($vorname === '' || $nachname === '' || $nachricht === '') {
    respond(false, 'Bitte alle Pflichtfelder ausfüllen.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Bitte eine gültige E-Mail-Adresse angeben.');
}

// Zeilenumbrüche aus Kopfzeilen-Feldern entfernen (Header-Injection verhindern)
$clean = static fn(string $s): string => str_replace(["\r", "\n"], ' ', $s);
$vorname  = $clean($vorname);
$nachname = $clean($nachname);
$email    = $clean($email);
$telefon  = $clean($telefon);
$betreff  = $clean($betreff);

$empfaenger = 'info@pelvipoint.de';

// --- Mail an PelviPoint ---
$betreffIntern = 'Neue Kontaktanfrage – PelviPoint Website';
$bodyIntern = "Neue Nachricht über das Kontaktformular auf pelvipoint.de\n\n"
    . "Name: {$vorname} {$nachname}\n"
    . "E-Mail: {$email}\n"
    . "Telefon: " . ($telefon !== '' ? $telefon : '-') . "\n"
    . "Betreff: " . ($betreff !== '' ? $betreff : '-') . "\n\n"
    . "Nachricht:\n{$nachricht}\n";

$headersIntern = "From: PelviPoint Website <info@pelvipoint.de>\r\n"
    . "Reply-To: {$vorname} {$nachname} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8";

$okIntern = mail($empfaenger, '=?UTF-8?B?' . base64_encode($betreffIntern) . '?=', $bodyIntern, $headersIntern);

// --- Bestätigungsmail an den Absender ---
$betreffBestaetigung = 'Ihre Nachricht an PelviPoint Trier ist angekommen';
$bodyBestaetigung = "Hallo {$vorname},\n\n"
    . "vielen Dank für Ihre Nachricht über unsere Website. Wir haben Ihre Anfrage erhalten und melden uns so schnell wie möglich bei Ihnen zurück.\n\n"
    . "Ihre Nachricht:\n{$nachricht}\n\n"
    . "Viele Grüße\n"
    . "Ihr PelviPoint-Team\n"
    . "https://pelvipoint.de";

$headersBestaetigung = "From: PelviPoint Trier <info@pelvipoint.de>\r\n"
    . "Content-Type: text/plain; charset=UTF-8";

mail($email, '=?UTF-8?B?' . base64_encode($betreffBestaetigung) . '?=', $bodyBestaetigung, $headersBestaetigung);

if ($okIntern) {
    respond(true, 'Vielen Dank für Ihre Nachricht!');
} else {
    respond(false, 'Beim Versand ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
}
