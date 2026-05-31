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

$service_id       = intval($data['service_id'] ?? 0);
$date_heure_debut = $data['date_heure_debut'] ?? '';
$date_heure_fin   = $data['date_heure_fin'] ?? '';
$places_max       = intval($data['places_max'] ?? 1);

if (!$service_id || !$date_heure_debut || !$date_heure_fin) {
    echo json_encode(['success' => false, 'message' => 'Service, date de début et date de fin sont obligatoires.']);
    exit;
}

if ($date_heure_fin <= $date_heure_debut) {
    echo json_encode(['success' => false, 'message' => 'La date de fin doit être après la date de début.']);
    exit;
}

// vérifier que le service existe et appartient à cet intervenant (ou admin)
if ($user['role'] === 'intervenant') {
    $stmt = $pdo->prepare('SELECT id FROM services WHERE id = ? AND intervenant_id = ? AND actif = 1');
    $stmt->execute([$service_id, $_SESSION['user_id']]);
} else {
    $stmt = $pdo->prepare('SELECT id FROM services WHERE id = ? AND actif = 1');
    $stmt->execute([$service_id]);
}

if (!$stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Service introuvable ou accès refusé.']);
    exit;
}

$stmt = $pdo->prepare('
    INSERT INTO disponibilites (intervenant_id, service_id, date_heure_debut, date_heure_fin, places_max)
    VALUES (?, ?, ?, ?, ?)
');
$stmt->execute([$_SESSION['user_id'], $service_id, $date_heure_debut, $date_heure_fin, $places_max]);

echo json_encode(['success' => true, 'message' => 'Créneau ajouté avec succès.']);
