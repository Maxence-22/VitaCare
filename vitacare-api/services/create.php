<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

// seuls admin et intervenant peuvent créer un service
$pdo = getDB();
$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$titre          = trim($data['titre'] ?? '');
$description    = trim($data['description'] ?? '');
$categorie      = $data['categorie'] ?? 'autre';
$duree_minutes  = intval($data['duree_minutes'] ?? 60);
$prix           = floatval($data['prix'] ?? 0);

if (!$titre) {
    echo json_encode(['success' => false, 'message' => 'Le titre est obligatoire.']);
    exit;
}

$stmt = $pdo->prepare('
    INSERT INTO services (titre, description, categorie, duree_minutes, prix, intervenant_id)
    VALUES (?, ?, ?, ?, ?, ?)
');
$stmt->execute([$titre, $description, $categorie, $duree_minutes, $prix, $_SESSION['user_id']]);

echo json_encode(['success' => true, 'message' => 'Service créé.']);
