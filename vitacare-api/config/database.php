<?php
// Connexion à la base de données MySQL
// À adapter si ton MAMP utilise un port différent




define('DB_HOST', 'localhost');
define('DB_PORT', '3306');     // port WAMP par défaut
define('DB_NAME', 'vitacare'); // ou vitacare2 si tu as pas renommé
define('DB_USER', 'root');
define('DB_PASS', '');         // mot de passe vide sur WAMP
function getDB() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur base de données : ' . $e->getMessage()]);
            exit;
        }
    }

    return $pdo;
}
