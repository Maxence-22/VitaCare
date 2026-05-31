<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$titre                  = trim($data['titre'] ?? '');
$description            = trim($data['description'] ?? '');
$categorie              = $data['categorie'] ?? 'autre';
$date_heure_debut       = $data['date_heure_debut'] ?? '';
$date_heure_fin         = $data['date_heure_fin'] ?? '';
$lieu                   = trim($data['lieu'] ?? '');
$places_max             = intval($data['places_max'] ?? 10);
$prix                   = floatval($data['prix'] ?? 0);
$date_limite_inscription = $data['date_limite_inscription'] ?? null;

if (!$titre || !$date_heure_debut || !$date_heure_fin) {
    echo json_encode(['success' => false, 'message' => 'Titre, date de début et date de fin sont obligatoires.']);
    exit;
}

if ($date_heure_fin <= $date_heure_debut) {
    echo json_encode(['success' => false, 'message' => 'La date de fin doit être après la date de début.']);
    exit;
}

if ($places_max < 1) {
    echo json_encode(['success' => false, 'message' => 'Le nombre de places doit être au moins 1.']);
    exit;
}

if ($date_limite_inscription === '') $date_limite_inscription = null;

$stmt = $pdo->prepare('
    INSERT INTO activites
        (titre, description, categorie, intervenant_id, date_heure_debut, date_heure_fin, lieu, places_max, prix, date_limite_inscription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
');
$stmt->execute([
    $titre, $description, $categorie, $_SESSION['user_id'],
    $date_heure_debut, $date_heure_fin, $lieu, $places_max, $prix, $date_limite_inscription
]);

echo json_encode(['success' => true, 'message' => 'Activité créée avec succès.']);
