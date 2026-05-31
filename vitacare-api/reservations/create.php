<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour réserver.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$disponibilite_id = intval($data['disponibilite_id'] ?? 0);

if (!$disponibilite_id) {
    echo json_encode(['success' => false, 'message' => 'Créneau invalide.']);
    exit;
}

$pdo = getDB();
$client_id = $_SESSION['user_id'];

// --- vérifier que le créneau existe et est dans le futur ---
$stmt = $pdo->prepare('SELECT * FROM disponibilites WHERE id = ? AND date_heure_debut > NOW()');
$stmt->execute([$disponibilite_id]);
$dispo = $stmt->fetch();

if (!$dispo) {
    echo json_encode(['success' => false, 'message' => 'Ce créneau n\'existe pas ou est déjà passé.']);
    exit;
}

// --- vérifier qu'il reste de la place ---
$stmt = $pdo->prepare('
    SELECT COUNT(*) AS nb FROM reservations
    WHERE disponibilite_id = ? AND statut IN ("en_attente", "confirmee")
');
$stmt->execute([$disponibilite_id]);
$count = $stmt->fetch();

if ($count['nb'] >= $dispo['places_max']) {
    echo json_encode(['success' => false, 'message' => 'Ce créneau est complet.']);
    exit;
}

// --- vérifier que l'utilisateur n'a pas déjà réservé ce créneau ---
$stmt = $pdo->prepare('
    SELECT id FROM reservations
    WHERE client_id = ? AND disponibilite_id = ? AND statut != "annulee"
');
$stmt->execute([$client_id, $disponibilite_id]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Vous avez déjà réservé ce créneau.']);
    exit;
}

// --- créer la réservation ---
$stmt = $pdo->prepare('
    INSERT INTO reservations (client_id, disponibilite_id, statut)
    VALUES (?, ?, "en_attente")
');
$stmt->execute([$client_id, $disponibilite_id]);
$reservation_id = $pdo->lastInsertId();

// --- créer une notification pour le client ---
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Réservation enregistrée", "Votre réservation est en attente de confirmation.", "reservation")
');
$stmt->execute([$client_id]);

echo json_encode(['success' => true, 'message' => 'Réservation effectuée avec succès.', 'reservation_id' => $reservation_id]);
