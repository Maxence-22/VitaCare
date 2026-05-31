<?php
// Headers CORS - autorise le frontend React (port 8888) à appeler l'API
// et autorise l'envoi des cookies de session

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// les navigateurs envoient d'abord une requête OPTIONS (preflight)
// on répond juste 200 et on arrête
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
