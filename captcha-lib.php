<?php
declare(strict_types=1);

const CAPTCHA_MIN_SEKUNDEN = 3;     // schneller als ein Mensch kann
const CAPTCHA_MAX_SEKUNDEN = 3600;  // danach neue Frage nötig

function captcha_secret(): string {
    // Serverspezifisch, nicht im Quelltext der Webseite sichtbar
    return hash('sha256', __DIR__ . '|pelvipoint-captcha|' . (string) fileinode(__FILE__));
}

function captcha_token(int $antwort, int $zeit): string {
    return $zeit . '.' . hash_hmac('sha256', $antwort . '|' . $zeit, captcha_secret());
}

function captcha_pruefen(string $antwort, string $token): bool {
    if (!preg_match('/^\d{1,3}$/', trim($antwort))) return false;
    $teile = explode('.', $token, 2);
    if (count($teile) !== 2 || !ctype_digit($teile[0])) return false;
    $zeit = (int) $teile[0];
    $alter = time() - $zeit;
    if ($alter < CAPTCHA_MIN_SEKUNDEN || $alter > CAPTCHA_MAX_SEKUNDEN) return false;
    return hash_equals(captcha_token((int) trim($antwort), $zeit), $token);
}
