<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

$data = json_decode(file_get_contents('php://input'), true);

$email        = trim($data['email'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

if (!$email || !$mot_de_passe) {
    echo json_encode(['success' => false, 'message' => 'Email et mot de passe requis.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// vérifier que l'utilisateur existe et que le mot de passe correspond
if (!$user || !password_verify($mot_de_passe, $user['mot_de_passe'])) {
    echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
    exit;
}

// stocker l'id en session PHP
$_SESSION['user_id'] = $user['id'];

// on renvoie les infos utilisateur sans le mot de passe
unset($user['mot_de_passe']);
echo json_encode(['success' => true, 'user' => $user]);
