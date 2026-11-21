<?php
declare(strict_types=1);

// Liefert eine kleine Rechenfrage plus signiertes Token (ohne Session/Cookie, also ohne Cookie-Einwilligung nutzbar).
require __DIR__ . '/captcha-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$a = random_int(2, 9);
$b = random_int(2, 9);
if (random_int(0, 1) === 0) {
    $frage = "Was ist {$a} × {$b}?";
    $antwort = $a * $b;
} else {
    $frage = "Was ist {$a} + {$b}?";
    $antwort = $a + $b;
}

echo json_encode(['frage' => $frage, 'token' => captcha_token($antwort, time())]);
