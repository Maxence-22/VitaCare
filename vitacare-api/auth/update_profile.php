<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$nom            = trim($data['nom'] ?? '');
$prenom         = trim($data['prenom'] ?? '');
$telephone      = trim($data['telephone'] ?? '');
$date_naissance = $data['date_naissance'] ?? null;

if (!$nom || !$prenom) {
    echo json_encode(['success' => false, 'message' => 'Nom et prénom requis.']);
    exit;
}

// date_naissance vide → on met NULL
if ($date_naissance === '') $date_naissance = null;

$pdo = getDB();
$stmt = $pdo->prepare('
    UPDATE users SET nom = ?, prenom = ?, telephone = ?, date_naissance = ?
    WHERE id = ?
');
$stmt->execute([$nom, $prenom, $telephone, $date_naissance, $_SESSION['user_id']]);

// on retourne les infos à jour
$stmt = $pdo->prepare('SELECT id, nom, prenom, email, role, telephone, date_naissance, photo FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

echo json_encode(['success' => true, 'user' => $user]);
