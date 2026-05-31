<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

// pas de session → utilisateur non connecté
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id, nom, prenom, email, role, telephone, date_naissance, photo FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    // session orpheline (utilisateur supprimé)
    session_destroy();
    echo json_encode(['success' => false]);
    exit;
}

echo json_encode(['success' => true, 'user' => $user]);
